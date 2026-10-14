# CDN support — implementation plan

Plan for [cdn-support.md](./cdn-support.md), based on the current code (v2.6.0) and the *CDN API — Partner integration guide* (CDN 1.0, 2026-09-22).

_Rev 4 (2026-09-25): with CDN on, a temporary URL is **never** delivered; video is always excluded from CDN; any failing API call and any CDN-unsupported file type shows an error (no 503 retry, no legacy fallback)._

_Rev 5 (2026-10-13): `isUsingCDN()` now decides via `GET users/me?fields=activeModules` (CDN module active for the customer); `cdnId` stays `2` until it can be fetched. Added an implementation status section._

_Rev 6 (2026-10-13): decisions — module key `'cdn'` (response is logged with `console.log`), `cdnId` source still unknown (fixed `2`), **one automatic retry** of `POST cdn/resources` on 503. Real `isUsingCDN()`, the info-panel pending fix and the retry are implemented._

## Status

| Part | State |
|---|---|
| `api.js` (202/204, status + body to `fail`, network errors) | Done |
| `services/cdn.js` (support check, create resource, transform params, errors, `cdnWaitForReady`) | Done |
| CDN delivery in `fileselector.clickDone` and `cropperview` | Done |
| Unsupported-type alert in `fileinfo` | Done, incl. the "pending" fix (§1) |
| `isUsingCDN()` | Done — `users/me?fields=activeModules` contains `'cdn'`; `cdnId` fixed `2` (§1) |
| One automatic retry on 503 for `POST cdn/resources` | Done (§2) |
| README, CHANGELOG | Done (CHANGELOG under "Unreleased", no version bump yet) |
| Translations in the `fileSelector` dictionary | **To do** (English fallbacks in `cdn.js` until then) |
| CDN preset for the test page | Not done (not needed while CDN is decided by the API) |

## Goal

When `isUsingCDN()` says yes, every file object that today carries a temporary download `url` instead carries a stable CDN URL (with transform parameters that reproduce the user's crop/size/format choices). Everything else in the file object stays the same.

**Invariant:** with CDN on, the file selector **never** delivers a temporary URL — it either delivers a CDN URL or shows an error. Video assets are unaffected by CDN on/off and keep today's behaviour.

## Decisions (from the spec)

| Topic | Decision |
|---|---|
| Browser → management API | `POST /1/cdn/resources` works from the browser with CORS for all three auth modes → call it directly via `MFAPI`, no backend needed. |
| CDN on/off | `isUsingCDN()` calls `GET users/me?fields=activeModules`; CDN is on when the customer's `activeModules` contains the CDN module. |
| `cdnId` | Will be fetched from the Mediaflow API later. Fixed **2** for now. |
| CDN filename | Resource is created with the original `me.file.filename`; the (possibly edited) name is still returned in `filename`. |
| `downloads/{format}` call | **Removed** on the CDN path (see §5). |
| Video | Always today's behaviour, regardless of CDN on/off. |
| Failures | **Show an error as soon as an API call fails** — `users/me` in `isUsingCDN()` or `POST cdn/resources`. Exception: a 503 from `POST cdn/resources` is retried **once** automatically first. No fallback to the temporary URL (see §6). |
| Unsupported file types | With CDN on, file types the CDN can't publish → **error** (see §6). |
| `returnValue: 'fileObject'` | Unchanged — returns the raw file without a URL. |
| Lifecycle | The file selector only creates resources (see §9). |

## Where file objects are delivered today

| # | Path | File | Has `url`? | CDN? |
|---|------|------|-----------|------|
| 1 | Image via cropper (preview) | `cropperview.clickDone()` → `doDownload()` | yes (rendered crop) | **yes** — main case |
| 2 | Non-image, or `downloadFormat: 'original'`, plain | `fileselector.clickDone()` (else-branch of `permanentURL`) | yes (temp URL) | **yes** |
| 3 | Same, with `permanentURL: true` | `fileselector.clickDone()` (`permalink=true` XHR) | yes (permalink) | **yes** — CDN replaces permalink |
| 4 | Video | `movieview.clickDone()` | no (embed code) | no — video always excluded |
| 5 | `downloadFormat: 'stream'` | `fileselector.clickDone()` | no | no |
| 6 | `returnValue: 'fileObject'` | `fileselector.clickDone()` → raw `me.file` | no | no (decided) |

## Design

### 1. `isUsingCDN()` — decision at construction

Already in place (unchanged): `_initCdn()` runs once from the constructor right after `me.api = MFAPI(...)`, stores the promise in `me.cdnReady` and keeps the state in `me.cdn = { pending, enabled, cdnId, error }`. Delivery code reads it through `getCdnMode(me)` (`pending` / `error` / `on` / `off`); while `pending` a click is queued until `me.cdnReady` resolves. If `isUsingCDN()` rejects → `CDN_INIT_FAILED` right away, and every later selection shows the error instead of delivering (the customer's choice is unknown, so no temporary URL may slip through). No integration-side override.

**Implementation of `isUsingCDN()`** (`fileselector.js`):

```js
const CDN_MODULE = 'cdn'; // activeModules value that enables the CDN

async isUsingCDN() {
	const me = this;
	const result = await new Promise((resolve, reject) => {
		me.api.get('users/me?fields=activeModules', resolve,
			(message, info) => reject({ message, status: info?.status, body: info?.body }));
	});
	console.log('CDN: users/me?fields=activeModules response', result);
	if (!Array.isArray(result) || !result[0] || !Array.isArray(result[0].activeModules)) {
		throw { message: 'ERR:GET,users/me,INVALID_RESPONSE', body: result };
	}
	me.cdn.cdnId = 2; // TODO: fetch the cdnId from the Mediaflow API when the source is known
	return result[0].activeModules.includes(CDN_MODULE);
}
```

- A failing `users/me` call or an unexpected response throws → `_initCdn()` shows `CDN_INIT_FAILED` (per the failure rule).
- Module **not** active → `false` → CDN off, behaviour identical to 2.6.0.
- `users/me?fields=activeModules` is also called by `toparea` (AI search switch) and `movieview` (player themes). Optional: memoize it (e.g. `me.getActiveModules()` returning one shared promise) so the selector makes the call once. Not required for this feature.

**Info panel while the decision is pending (implemented):** `fileinfo.showFileInfo` checks `getCdnMode(me) === 'on'` synchronously. If the user opens a file before `users/me` has answered, the mode is still `pending` and the "not supported by CDN" alert is skipped. Selection is still safe (the click waits and then shows `CDN_FILETYPE_NOT_SUPPORTED`), but the panel should be correct too:
- the check lives in `isBlockedByCdn(me)`; the alert markup in `cdnAlertHtml()`; the button disabling in `disableUseButton(me)` (also used by the existing permission checks);
- when the mode is `pending`, `showFileInfo` waits for `me.cdnReady` and, if the same file is still shown and it is blocked, inserts the alert at the top of the info and disables `#mf-use-btn`.

### 2. New module `src/js/services/cdn.js`

- `isCdnSupported(file)` — `file.mediaId` present and ≥ 9 chars, and `file.type.id` is an image (101–199), PDF 201, SVG 230 or audio 300–399. Video (400–499) is never routed to CDN (handled by the video paths). Anything else (fonts, Office docs, archives, missing/short `mediaId`) → not supported → **error** when CDN is on.
- `createResource(me, file)` → `POST cdn/resources` with
  ```json
  { "cdnId": me.cdn.cdnId, "source": "mediaflow",
    "metadata": { "imageId": file.mediaId, "filename": file.filename, "filetype": file.type.id } }
  ```
  Always the **original** `file.filename`. Returns `{ resourceId, status, url, versionedUrl }`. On **503** (resource saved, follow-up step failed — POST is idempotent) it waits 1 s and retries **once** (`console.warn`). A second 503, or any other non-2xx, is an error.
- `buildTransformParams(cropState)` → `{ w, h, rg?, fit?, f? }` (see §4).
- `applyParams(url, params)` → appends as query string. Always starts from the returned `url` — never construct edge URLs.

### 3. `api.js` changes

- `loadXHR` treats only 200/201 as success. CDN POST returns **202** for new resources → accept 202 (and 204).
- Pass the HTTP status and the plain-text error body to `fail` (CDN API errors are plain text) so the error can be logged for troubleshooting.

### 4. Transform parameters (image path)

Map the cropper state that `doDownload` already computes:

| Selector case | CDN params |
|---|---|
| Crop formats from MF (≥0), free crop (-1), custom (-2), keep-ratio | `rg = x,y,w,h` in % of `naturalWidth/Height` (from `cropperData`), `w = ww`, `h = hh` |
| Whole image (-3) / `downloadFormat: 'original'` | `w`, `h` only (skip `rg` when the crop box covers the full image) |
| Cover (-100) / contain (-101) | `w`, `h` (already scaled), `fit=cover` / `fit=contain` |
| Original size (-102) | `w`, `h` = original |
| `defaults.imageDownloadFileType` jpg/png/webp | `f=jpeg` / `png` / `webp` (`jpg`→`jpeg`) |
| Otherwise | `f` unset → edge negotiates AVIF/WebP |

Rules from the guide:
- `rg` rounded to 2 decimals, clamped so `x+w ≤ 100`, `y+h ≤ 100`; requires `w`/`h` > 0.
- **GIF on CDN 1.0.0:** always set an explicit `f` (e.g. `webp`) on transformed requests, otherwise some clients get a 500.
- Use **query params, not resource `defaults`**. Dedup is on (customer, imageId, serverId, cdnId, filename) and `defaults` are ignored on a dedup hit. Since we always use the original filename, every crop of the same image maps to the *same* resource — so per-selection settings must live in the URL.

Non-image paths (#2, #3): no transform params; just the resource `url`.

### 5. Removing the `downloads/{format}` call

On the CDN path neither `downloads/{format}` nor the follow-up render/permalink request is made. What the call did, and what happens now:

| What it did | On the CDN path |
|---|---|
| Permission check (403 → `CROPPER_PERMISSION_DENIED`) | Already covered earlier: `fileinfo` loads `file/{id}/checkpermissions`, rights and GDPR status and disables the select button (`canDownload`). Keep a defensive guard: if `me.file.permissions.allowDownload === false` and `ignorePermissionChecks !== true` → show the existing `CROPPER_PERMISSION_DENIED` alert and stop. |
| Produced the temporary URL | Replaced by the CDN URL. |

The existing `downloads/{format}` flow runs only when `isUsingCDN()` is false (and for video, which never touches CDN).

### 6. Flow changes

**Image (cropperview.clickDone / doDownload):**
1. `await me.cdnReady`. If CDN init failed → error. If CDN enabled: `isCdnSupported(me.file)` false → error; otherwise skip `downloads/{format}` and the render XHR.
2. Permission guard (§5) → `createResource` → `buildTransformParams` → `applyParams`.
3. Build `successObject` exactly as today, with `url = cdnUrl`, `filename` = edited name + extension, `filetype` from `f` or the source extension (today it's taken from the rendered URL).
4. `me.config.success(successObject)`.
5. Split `doDownload` so the successObject builder and the "done button" UI reset are shared helpers used by both the CDN and legacy branches.

**Non-image / original (fileselector.clickDone):**
1. `await me.cdnReady`; if init failed → error.
2. If CDN enabled and the file is not a video: unsupported → error; supported → skip `downloads/0` (and the `permanentURL` permalink request), guard permissions, `createResource`, `success({...same object, url: cdnUrl})`.
3. Video reaching this path (e.g. public `clickDone()` with `downloadFormat: 'original'`) → today's flow, unchanged.

**Earlier feedback for unsupported types (UX):** in `fileinfo.showFileInfo`, when CDN is on and `!isCdnSupported(file)` (and not video), show an alert in the info panel (`FILE_INFO_CDN_NOT_SUPPORTED`, same style as the permission alerts) and disable the select button (`canDownload = false`). The error on select remains as a guard.

**Errors** — one helper `cdnError(me, key, detail)` used for every case:

| Case | Translation key (all 8 locales, `fileSelector` dictionary) |
|---|---|
| `isUsingCDN()` API call failed | `CDN_INIT_FAILED` |
| `POST cdn/resources` failed (any non-2xx; 503 only after the one retry) | `CDN_CREATE_FAILED` |
| File type not supported by CDN | `CDN_FILETYPE_NOT_SUPPORTED` (+ `FILE_INFO_CDN_NOT_SUPPORTED` for the info panel) |

The helper:
- shows the alert (e.g. en for `CDN_CREATE_FAILED`: "The file could not be published to the CDN. Please try again or contact your administrator.");
- `console.error` with the status/body for troubleshooting;
- resets `me.isDownloading` and the done button (remove `mf-btn-loading` / `working`, re-enable) so the user can retry;
- never calls `config.success` and never falls back to the temporary URL.
- fires `config.events('cdnError', { id, mediaId, reason, error })` so integrations can react.

### 7. File object additions

`url` becomes the CDN URL; add:
```js
cdn: { resourceId, url, versionedUrl, status, params }
```
Integrations need `resourceId` for later PUT/PATCH/DELETE. Also fire `config.events('cdnResourceCreated', {...})`. No `cdn` property when CDN is off or for video — integrations can use its presence to tell the cases apart.

### 8. Readiness (503 while `registered`)

A new resource is `registered` briefly and the edge answers `503 Retry-After: 30`. Default: return immediately (guide's recommendation). Optional `config.cdnWaitForReady: true` polls `GET cdn/resources/{resourceId}` until `completed` (timeout ~15 s; a failing poll call or timeout → `CDN_CREATE_FAILED`) while the done button shows the "fetching data" state.

### 9. Lifecycle

The file selector **only creates** resources (`POST`, idempotent). It never calls `PUT`, `PATCH` or `DELETE`. The integration owns the rest of the lifecycle using `cdn.resourceId` (delete when the asset is removed — orphans count against the CDN footprint/billing; replace source / change defaults as needed). Note for integrators: the same image selected twice maps to the same resource (original filename is used), so a resource should only be deleted when nothing else references it. Documented in the README.

### 10. Test page, docs, release

- Preset in `src/js/presets/` with CDN enabled for the dev test page.
- README: CDN behaviour (no temporary URLs when on, video excluded), the `cdn` property, `cdnError` event, `cdnWaitForReady` option, lifecycle responsibilities (§9).
- Translations: add `CDN_INIT_FAILED`, `CDN_CREATE_FAILED`, `CDN_FILETYPE_NOT_SUPPORTED`, `FILE_INFO_CDN_NOT_SUPPORTED` to the `fileSelector` dictionary.
- CHANGELOG entry, version bump → 2.7.0.

## Implementation order

1. `api.js`: accept 202/204, pass status + error body to `fail`.
2. `services/cdn.js`: `isCdnSupported`, `createResource`, `buildTransformParams`, `applyParams`, `cdnError` helper.
3. `FileSelector.isUsingCDN()` (`users/me?fields=activeModules` contains `'cdn'`, `cdnId: 2`) + `me.cdnReady` + init-error handling.
4. Non-image/original path in `fileselector.clickDone` (simplest end-to-end test).
5. Image path in `cropperview` + transform mapping + GIF rule + permission guard.
6. Error handling for all three cases + unsupported-type alert in `fileinfo`.
7. `cdn` property + `cdnResourceCreated` event; optional readiness polling.
8. Preset, README, translations, CHANGELOG.
9. `fileinfo` pending fix (§1), one automatic 503 retry (§2), README/CHANGELOG updated.

## Test checklist (manual, via dev test page)

- Image: each format option (MF crop format, free crop, custom, whole image, keep-ratio, cover, contain, original size) → CDN URL renders the same crop/size as the legacy URL.
- Edited filename → resource URL ends with the original filename; `filename` in the file object is the edited one.
- Two different crops of the same image → same `resourceId`, different query params.
- `imageDownloadFileType` jpg/png/webp → correct `f`. GIF with and without transforms.
- PDF, SVG, audio → plain CDN URL. Font / Office doc / archive → info-panel alert, select disabled; forced select → `CDN_FILETYPE_NOT_SUPPORTED`, no URL delivered.
- `permanentURL: true` + CDN → CDN URL wins.
- No `downloads/*` request in the network log on the CDN path.
- File without download permission → blocked, no CDN resource created.
- CDN POST returns 503 once → retried after ~1 s, file delivered. 503 twice → `CDN_CREATE_FAILED`.
- CDN POST fails with 400, 401 or 500 (simulate via devtools request blocking/override) → immediate `CDN_CREATE_FAILED` (no retry), no `success` call, no temporary URL, done button usable again.
- Console shows the `users/me?fields=activeModules` response at start-up.
- Customer **with** the CDN module → CDN on; customer **without** it → behaviour identical to 2.6.0.
- `users/me` fails (block it in devtools) or returns no `activeModules` → `CDN_INIT_FAILED` at start-up; every select shows the error, nothing delivered.
- Slow `users/me` (devtools throttling): open an unsupported file before it answers → the info-panel alert appears once it answers; a click while pending waits and then delivers / shows the error.
- With CDN on: network log never shows a `downloads/*` request for non-video files.
- Video (embed, and `downloadFormat: 'original'`), `stream`, `returnValue: 'fileObject'` unchanged with CDN on and off.
- Auth modes: `refresh_token`, `accesstoken`, `mediaflowlogin`.

## Open questions

1. **`cdnId` source.** Unknown for now — fixed `2` in `isUsingCDN()` until the API is known.
