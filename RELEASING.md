# Publishing the Fileselector to production

The Fileselector is served as static files from **mfstatic.com**. Publishing means building `dist/`,
copying three files to the static server, regenerating their `.gz` copies, and checking what is served.
The GitHub release workflows don't work yet, so this is done by hand or with `make publish`.
Each step below names the `make` target that does the same thing.

| Built file | Server path | Public URL |
|---|---|---|
| `dist/fileselector.min.js` | `/ssddata/static/js/` | `https://mfstatic.com/js/fileselector.min.js` |
| `dist/css/fileselector.min.css` | `/ssddata/static/css/` | `https://mfstatic.com/css/fileselector.min.css` |
| `dist/css/fileselector.css` | `/ssddata/static/css/` | `https://mfstatic.com/css/fileselector.css` |

Don't upload the other files in `dist/` (`index.html`, `bareMinimum.js`, `env.example.js`, `*.LICENSE.txt`).
They're for the test page.

> **Every integration loads this file live.** Once it's uploaded, every customer has it. There's no
> staged rollout, so the backup in step 3 is your only way back.

## Prerequisites
- SSH access to `178.174.209.211` as **`staticuser`** (for uploading) and as **`adminuser`** (for gzip,
  which needs sudo).
- Node from `.nvmrc`: run `nvm use`.
- The release is merged and checked out locally, with a clean working tree.

## 1. Prepare the release
1. Set the version in `package.json`. Webpack bakes it into the bundle as `FS_VERSION`.
2. In `CHANGELOG.md`, change `# x.y.z Unreleased` to the release date.
3. Merge and tag it (`vX.Y.Z`).

## 2. Build — `make build`
```bash
npm ci && npm run build
```
Check that `dist/fileselector.min.js`, `dist/css/fileselector.min.css` and `dist/css/fileselector.css`
exist and have today's timestamp.

## 3. Back up the current production files
As `staticuser`, **copy** (don't move) each live file to `<file>_backupYYYYMMDD`. Copying means
production never returns a 404 during the release.
```bash
ssh staticuser@178.174.209.211
d=$(date +%Y%m%d)
for f in /ssddata/static/js/fileselector.min.js /ssddata/static/css/fileselector.min.css /ssddata/static/css/fileselector.css; do
  if [ -e "${f}_backup$d" ]; then echo "kept ${f}_backup$d"; else cp -p "$f" "${f}_backup$d"; fi
done
exit
```
The loop **keeps** any backup that already has today's date. It holds the release from before today's
first upload, so overwriting it would lose that.

## 4. Upload — `make upload`
Use `scp`, or an SFTP client logged in as `staticuser`:
```bash
scp dist/fileselector.min.js staticuser@178.174.209.211:/ssddata/static/js/
scp dist/css/fileselector.min.css dist/css/fileselector.css staticuser@178.174.209.211:/ssddata/static/css/
```

## 5. Regenerate the gzip files — `make gzip`
nginx serves the `.gz` file whenever one exists. If you skip this step, browsers that accept gzip
(almost all of them) keep getting the **old** release.
```bash
ssh -t adminuser@178.174.209.211
cd /ssddata/static/js  && sudo gzip -kf --best fileselector.min.js
cd /ssddata/static/css && sudo gzip -kf --best fileselector.min.css fileselector.css
exit
```
Use `-f`: `-k` alone refuses to overwrite the previous release's `.gz`, so the stale file stays in place.

## 6. Verify — `make verify`
Download each public URL twice, once plain and once gzipped, and compare it byte for byte with `dist/`:
```bash
served=$(mktemp)
curl -fsS -o "$served" https://mfstatic.com/js/fileselector.min.js && cmp "$served" dist/fileselector.min.js
curl -fsS --compressed -H 'Accept-Encoding: gzip' -o "$served" https://mfstatic.com/js/fileselector.min.js && cmp "$served" dist/fileselector.min.js
```
Do the same for both CSS files. A mismatch in the first few minutes is normal, because the files sync
to the second static server (`178.174.209.212`). Wait and run it again. Then open an integration that
uses the Fileselector, hard-reload it, and check that `FS_VERSION` shows the new version.

## Rollback — `make revert` (or `make revert BACKUP=YYYYMMDD`)
As `staticuser`, copy each `<file>_backupYYYYMMDD` back over `<file>`. Then **repeat step 5**, otherwise
the gzipped copy still serves the broken release. Finish with step 6, but against the release you
restored: `dist/` still holds the broken one, so check out the restored release's tag and run `make build`
first. In the integration, `FS_VERSION` should then show that older version.

## Shortcut
`make publish` asks for confirmation, then runs steps 2–6 in order. Put connection overrides
(`STATIC_HOST`, `UPLOAD_USER`, `ADMIN_USER`, …) in a local `.env`, which git ignores. Step 1 is still manual.
