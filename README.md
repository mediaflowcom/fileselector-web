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
- Authentication: the CDN API does not accept the file selector's normal credentials. With `useCdn: true`, `cdnAuth` is **required** and is used only for `cdn/resources` (everything else, including `users/me`, keeps using the normal credentials, whatever `auth` mode is used):
  ```js
  cdnAuth: { client_id: '…', client_secret: '…', refresh_token: '…', username: '…' /* optional */ }
  // or, with a token issued by the integration's backend:
  cdnAuth: { auth: 'accesstoken', accesstoken: '…' }
  ```
  The CDN credentials must belong to the same customer and file server as the normal ones (the CDN token's `serv` claim), since `mediaId` comes from the normal API. Missing or incomplete `cdnAuth` → `CDN_INIT_FAILED` at start-up. A failing CDN login (token request or `401`) → `CDN_AUTH_FAILED`; other failures → `CDN_CREATE_FAILED`.
  For the test page, add `CDN_CLIENT_ID`, `CDN_CLIENT_SECRET` and `CDN_REFRESH_TOKEN` to `env.js` (used by the CDN preset).

**Lifecycle:** the file selector only creates resources. The integration is responsible for `PUT`/`PATCH`/`DELETE` using `cdn.resourceId`. Selecting the same image again reuses the same resource, so only delete a resource when nothing else uses it.

**Translations:** `CDN_INIT_FAILED`, `CDN_CREATE_FAILED`, `CDN_AUTH_FAILED`, `CDN_FILETYPE_NOT_SUPPORTED` and `FILE_INFO_CDN_NOT_SUPPORTED` should be added to the `fileSelector` dictionary. Until then English fallback texts are used.
