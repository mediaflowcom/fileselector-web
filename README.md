# fileselector-web
A common "component" for browsing and searching for images and videos. Images can be cropped. The backend api will supply url:s for images to be downloaded and videos to be mounted via embed code.
Written in javascript as a WebPack project with minification and a built-in live test server.

## index.html
The dist folder contains a test html file (index.html) for testing during development.
It works best if you let Webpack "serve" with  ```npm serve dev```

## Presets
In order to better test the File Selector from an integration perspective, i.e. how it works in e.g. Sitevision, Wordpress etc, 
it is possible to create 'presets' with the settings that should apply to the particular "integration" you want.  
In the folder 'presets' you create an object with the settings that are used and set values ​​that should apply in just that integration.  
A tip is to have variable values ​​in a private separate object to be able to easily replace the values ​​you want to test. The values ​​that do not vary can be 'hard coded'.  
<b>OBS!</b> 'locale' is set separatly by the test page. See 'currentFsSettings'.

## Developer 'environment' settings
If you want to have your own settings at hand, you can create an ```env.js``` file in the ./presets folder like this:
```json
export const credentials = {
    CLIENT_ID: '',
    CLIENT_SECRET: '',
    REFRESH_TOKEN: '',
    DOMAIN: ''
};
```
**NOTE: Never check this file into GitHub!**

## Testing as an integration (access tokens)

The test page can run the File Selector the way a production integration does: with `auth: 'accesstoken'`,
where tokens come from the integration's backend and the File Selector never sees the client secret or refresh token.

The dev server (`npm run serve`) plays the integration backend: `devtools/mockIntegrationBackend.js` adds
`POST /mock-integration/token`, which exchanges the test page's credentials for an access token server-side
(with `username` → user token, without → integration token). It's only used by the dev server, never in the build.

In the test page, set **Authentication** to *Access tokens – integration creates tokens* and choose:

| Setting | Options |
|---|---|
| Username | Mediaflow user the user token is issued for (empty = no username, also used in refresh-token mode) |
| Token delivery | **Callbacks**: `getAccessToken` / `getIntegrationAccessToken` only<br>**Static tokens + callbacks**: tokens fetched before start-up, callbacks for renewal<br>**Static tokens only**: no renewal (old behaviour), fails with `401` once the token expires<br>**Invalid static tokens + callbacks**: first request gets `401`, tests renew-and-retry |
| Integration token | Off: no integration token, so `users/me` uses the user token (logs a warning with the CDN preset) |
| Token lifetime | Reports a shorter `expires_in` (60 s / 40 s) so proactive renewal happens within a minute |

Each token request is logged in the browser console as `[integration] token request` (also collected in
`window.integrationTokenLog`) and in the dev-server terminal as `[mock-integration]`. Combine with the
*CDN, useCdn: true* preset to test `users/me` with the integration token.

## Project setup
```
npm install
```

Also add the correct client_id, client_secret and refresh_token that go to the desired Mediaflow account, otherwise folders will not load.

To set a light theme, you set a class "light" on the container element for the fileselector.

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

## Authentication

| `auth` | Use for | Notes |
|---|---|---|
| `'accesstoken'` | **Production integrations (recommended)** | The integration's backend issues the tokens; no secrets in the browser. |
| `'mediaflowlogin'` | Pages on a Mediaflow domain | Uses the Mediaflow session cookie. |
| anything else (refresh token) | Local development and presets only | `client_id`, `client_secret` and `refresh_token` are in the page config, readable by anyone in devtools. |

### Recommended setup: the integration issues the tokens

The file selector runs in the editor's browser, so the integration (plugin/add-on) keeps the Mediaflow
credentials on its **backend** and issues tokens there. The backend needs them anyway for the CDN lifecycle
calls (`PUT`/`PATCH`/`DELETE`), and only the integration knows which Mediaflow user an editor maps to.

Two tokens are used:

- **User token** (`accesstoken` / `getAccessToken`): issued *with* `username`. Used for files, folders, downloads and `cdn/resources`.
- **Integration token** (`integrationAccesstoken` / `getIntegrationAccessToken`): issued *without* `username`. Used for
  integration-level calls (`users/me?fields=activeModules`), which fail with a user-mapped token. Needed with `useCdn: true`.

Give each token as a callback so the file selector can renew it:

```js
new FileSelector('container', {
  auth: 'accesstoken',
  getAccessToken: () => fetch('/my-plugin/mediaflow-token').then(r => r.json()),
  getIntegrationAccessToken: () => fetch('/my-plugin/mediaflow-token?integration=1').then(r => r.json()),
  // Optional: tokens already rendered into the page, used first so start-up needs no extra round trip.
  accesstoken: '…',
  integrationAccesstoken: '…',
  success: (file) => { /* … */ }
});
```

The callbacks take no arguments and return (or resolve to) either a token string or the OAuth response
`{ access_token, expires_in, token_type }`. With `expires_in` the token is renewed 30 s before it expires;
without it, it is used until the API answers `401`.

The file selector calls the callback:

- when a request needs a token and there is none, or the current one expires within 30 s;
- when the API answers `401`. The request is then retried **once** with the new token. Parallel requests share one renewal.

If the callback throws or returns no token, the request fails with `ERR:ACCESSTOKEN` (or `ERR:ACCESSTOKEN,INVALID`).

Token rules:

- `auth: 'accesstoken'` requires `accesstoken` or `getAccessToken`.
- A static `accesstoken` without `getAccessToken` is never renewed. This is the old behaviour and still works,
  but requests fail with `401` once the token expires.
- Integration token: `getIntegrationAccessToken` when given; otherwise a static `integrationAccesstoken` (never renewed,
  and never replaced by `getAccessToken`); otherwise the user token / `getAccessToken`. A console warning is
  logged when `useCdn: true` is used without an integration token.

Backend endpoint sketch (keep `client_secret` and `refresh_token` on the server):

```js
// POST {oauthBase}/oauth2/token, grant_type=refresh_token
app.get('/my-plugin/mediaflow-token', requireEditor, async (req, res) => {
  const body = new URLSearchParams({ grant_type: 'refresh_token', client_id, client_secret, refresh_token });
  if (req.query.integration !== '1') body.append('username', mapToMediaflowUser(req.user));
  const r = await fetch('https://accounts.mediaflow.com/oauth2/token', { method: 'POST', body });
  const { access_token, expires_in, token_type } = await r.json();
  res.set('Cache-Control', 'no-store').json({ access_token, expires_in, token_type });
});
```

Protect the endpoint with the host platform's own editor authentication, and don't cache its response.

## CDN support
CDN is **opt-in per integration**: set `useCdn: true` in the config. The default is `false` and will stay `false` — the file selector is loaded live by every installed integration, and integrations that don't understand CDN URLs must keep getting today's behaviour. Without `useCdn: true`, `users/me` and `cdn/resources` are never called.

With `useCdn: true` and `isUsingCDN()` (in `fileselector.js`) returning `true` — the customer has the `cdn` module in `users/me?fields=activeModules` — selected files are published to the Mediaflow CDN instead of being delivered as a temporary download URL. See `features/cdn-support.md` and `features/cdn-support-plan.md`.

- `url` in the file object is the stable CDN URL. For images the crop/size/format selection is appended as query parameters, for example `…/hero.jpg?w=800&h=600&rg=10,10,40,30`.
- `cdn` holds `{ resourceId, url, versionedUrl, status, params }`. `cdn.url` is the URL without parameters.
- Video, `downloadFormat: 'stream'` and `returnValue: 'fileObject'` are unaffected.
- File types the CDN can't publish, and failing CDN API calls, show an error. A 503 when creating the resource is retried once first. With CDN on, a temporary URL is never delivered.
- Events: `cdnResourceCreated` and `cdnError` (`{ id, mediaId, reason, error }`).
- `cdnWaitForReady: true` waits (up to 15 s) until the resource is `completed`. Without it, the URL returns `503 Retry-After` for a short while after creation.
- `filetype` and the extension of `filename`: when an explicit format is requested (`defaults.imageDownloadFileType`, or `webp` forced for GIF) they match it (`jpeg` → `jpg`). Otherwise they are the **source** extension, while the CDN edge negotiates the delivered format per request (AVIF/WebP/…) from the browser's `Accept` header. Use the response `Content-Type`, not `filetype`, if the integration downloads the CDN URL and needs the real format.
- `mediaId` is now included in the file object for images too (it was only set for non-image files).
- Authentication: `POST cdn/resources` is called from the browser with the user token, like the rest of the file selector. The user/token must be allowed to create CDN resources, otherwise selection fails with `CDN_CREATE_FAILED`. `users/me` uses the integration token. See [Authentication](#authentication).

**Lifecycle:** the file selector only creates resources. The integration is responsible for `PUT`/`PATCH`/`DELETE` using `cdn.resourceId`. Selecting the same image again reuses the same resource, so only delete a resource when nothing else uses it.

**Translations:** `CDN_INIT_FAILED`, `CDN_CREATE_FAILED`, `CDN_FILETYPE_NOT_SUPPORTED` and `FILE_INFO_CDN_NOT_SUPPORTED` should be added to the `fileSelector` dictionary. Until then English fallback texts are used.
