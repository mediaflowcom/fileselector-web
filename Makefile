# Release the Fileselector to production on mfstatic.com.
# Runbook: RELEASING.md
-include .env

STATIC_HOST ?= 178.174.209.211
UPLOAD_USER ?= staticuser
ADMIN_USER  ?= adminuser
JS_DIR      ?= /ssddata/static/js
CSS_DIR     ?= /ssddata/static/css
PUBLIC_URL  ?= https://mfstatic.com

VERSION   := $(shell node -p "require('./package.json').version")
JS_FILES  := fileselector.min.js
CSS_FILES := fileselector.min.css fileselector.css
REMOTE_FILES  := $(addprefix $(JS_DIR)/,$(JS_FILES)) $(addprefix $(CSS_DIR)/,$(CSS_FILES))
BACKUP_SUFFIX := _backup$(shell date +%Y%m%d)

.PHONY: help build publish confirm mfstatic-ssh upload revert gzip verify

help:
	@echo "make build    - clean install and build dist/"
	@echo "make publish  - build, upload, gzip and verify fileselector $(VERSION) on $(PUBLIC_URL)"
	@echo "make mfstatic-ssh - open a shell on $(STATIC_HOST) as $(UPLOAD_USER)"
	@echo "make upload   - copy dist/ files to $(STATIC_HOST) as $(UPLOAD_USER)"
	@echo "make revert   - restore the newest _backupYYYYMMDD (or BACKUP=YYYYMMDD) and regenerate the .gz files"
	@echo "make gzip     - regenerate the .gz files on $(STATIC_HOST) as $(ADMIN_USER)"
	@echo "make verify   - compare $(PUBLIC_URL) (plain and gzip) with dist/"

build:
	npm ci
	npm run build

# Sub-makes, not prerequisites: under make -j prerequisites run in parallel, uploading before the confirm.
publish:
	$(MAKE) confirm
	$(MAKE) build
	$(MAKE) upload
	$(MAKE) gzip
	$(MAKE) verify

confirm:
	@read -p "Publish fileselector $(VERSION) to production ($(PUBLIC_URL))? [y/N] " answer && [ "$$answer" = y ]

mfstatic-ssh:
	ssh $(UPLOAD_USER)@$(STATIC_HOST)

# Copied, not moved, so production never serves a 404 between the backup and the upload.
# An existing backup from today is kept: it holds the release before today's first upload.
# So a failed copy must never take the backup name; the partial name stays outside revert's _backup* glob.
upload:
	ssh $(UPLOAD_USER)@$(STATIC_HOST) '\
		for file in $(REMOTE_FILES); do \
			backup="$${file}$(BACKUP_SUFFIX)"; \
			if [ -e "$$backup" ]; then echo "kept     $$backup"; continue; fi; \
			partial="$${file}.backup-partial"; \
			if [ -e "$$file" ]; then cp -p "$$file" "$$partial" && mv "$$partial" "$$backup" && echo "backed up $$backup" || { rm -f "$$partial"; exit 1; }; fi; \
		done'
	scp $(addprefix dist/,$(JS_FILES)) $(UPLOAD_USER)@$(STATIC_HOST):$(JS_DIR)/
	scp $(addprefix dist/css/,$(CSS_FILES)) $(UPLOAD_USER)@$(STATIC_HOST):$(CSS_DIR)/

revert:
	@date="$(BACKUP)"; \
	if [ -z "$$date" ]; then \
		date=$$(ssh $(UPLOAD_USER)@$(STATIC_HOST) 'ls -1 $(addsuffix _backup*,$(REMOTE_FILES)) 2>/dev/null' | sed 's/.*_backup//' | grep -E '^[0-9]{8}$$' | sort -u | tail -1); \
	fi; \
	case "$$date" in [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]) ;; *) echo "No backup found (BACKUP=YYYYMMDD picks one)."; exit 1 ;; esac; \
	read -p "Revert production ($(PUBLIC_URL)) to the backup from $$date? [y/N] " answer && [ "$$answer" = y ] || exit 1; \
	ssh $(UPLOAD_USER)@$(STATIC_HOST) "\
		missing=0; \
		for file in $(REMOTE_FILES); do \
			[ -e \"\$${file}_backup$$date\" ] || { echo \"missing  \$${file}_backup$$date\"; missing=1; }; \
		done; \
		[ \$$missing -eq 0 ] || { echo \"Incomplete backup set, nothing restored.\"; exit 1; }; \
		for file in $(REMOTE_FILES); do \
			cp -p \"\$${file}_backup$$date\" \"\$$file\" && echo \"restored \$$file\" || exit 1; \
		done"
	$(MAKE) gzip

# nginx serves the .gz when one exists, so a stale .gz keeps serving the old release.
# -f because -k alone refuses to overwrite the previous release's .gz.
gzip:
	ssh -t $(ADMIN_USER)@$(STATIC_HOST) '\
		cd $(JS_DIR) && sudo gzip -kf --best $(JS_FILES) && \
		cd $(CSS_DIR) && sudo gzip -kf --best $(CSS_FILES)'

verify:
	@status=0; served=$$(mktemp); headers=$$(mktemp); trap 'rm -f "$$served" "$$headers"' EXIT; \
	for file in $(addprefix js/,$(JS_FILES)) $(addprefix css/,$(CSS_FILES)); do \
		case $$file in js/*) built=dist/$${file#js/} ;; *) built=dist/$$file ;; esac; \
		for encoding in identity gzip; do \
			if curl -fsS --compressed -H "Accept-Encoding: $$encoding" -D "$$headers" -o "$$served" "$(PUBLIC_URL)/$$file" && cmp -s "$$served" "$$built" \
				&& { [ $$encoding = identity ] || grep -qi '^content-encoding: *gzip' "$$headers"; }; then \
				echo "ok       $$file ($$encoding)"; \
			else \
				echo "MISMATCH $$file ($$encoding)"; status=1; \
			fi; \
		done; \
	done; \
	[ $$status -eq 0 ] || echo "The second static server can take a few minutes to sync: rerun 'make verify'."; \
	exit $$status
