/* Mediaflow File Selector - CDN support
 *
 * When FileSelector.isUsingCDN() is true, the file selector never delivers a temporary
 * download URL. Instead a CDN resource is created (POST /1/cdn/resources) and the file
 * object's url is replaced by the resource's stable CDN URL, with transform parameters
 * (crop/size/format) appended as query parameters.
 *
 * The CDN API is called with its own credentials (config.cdnAuth) through a separate MFAPI
 * instance (me.cdnApi); everything else uses the file selector's normal credentials (me.api).
 *
 * Video is never routed to the CDN. The file selector only creates resources; the
 * integration owns the rest of the lifecycle (PUT/PATCH/DELETE) via cdn.resourceId.
 */

import MFAPI from './api';

// Used until the keys exist in the fileSelector dictionary
const FALLBACK_TEXTS = {
  CDN_INIT_FAILED: 'Could not determine the CDN settings. Please reload the page or contact your administrator.',
  CDN_CREATE_FAILED: 'The file could not be published to the CDN. Please try again or contact your administrator.',
  CDN_AUTH_FAILED: 'Could not log in to the CDN. Please contact your administrator.',
  CDN_FILETYPE_NOT_SUPPORTED: 'This file type cannot be published to the CDN.',
  FILE_INFO_CDN_NOT_SUPPORTED: 'This file type cannot be published to the CDN and can therefore not be used.'
};

const RETRY_DELAY = 1000; // ms - one automatic retry of POST cdn/resources on 503
const READY_POLL_INTERVAL = 2000; // ms
const READY_POLL_TIMEOUT = 15000; // ms

/**
 * Translate a CDN key, falling back to English while the key is missing in the dictionary.
 * (A missing key is returned by the translation service as "[fileSelector.section.key]".)
 */
export function translateCdn(me, key) {
  const text = me.lang.translate(key);
  if (typeof text !== 'string' || text.length === 0 || text.startsWith('[')) {
    return FALLBACK_TEXTS[key] ?? key;
  }
  return text;
}

/**
 * Current CDN mode.
 * @returns {'pending'|'error'|'on'|'off'}
 */
export function getCdnMode(me) {
  if (!me.cdn || me.cdn.pending) return 'pending';
  if (me.cdn.error) return 'error';
  return me.cdn.enabled === true ? 'on' : 'off';
}

export function isVideo(file) {
  return file?.type?.type === 'video';
}

/**
 * Whether the CDN can publish this file.
 * Images (101-199), PDF (201), SVG (230) and audio (300-399). Video is handled outside the CDN.
 * The CDN requires the alphanumeric mediaId (>= 9 chars), not the numeric file id.
 */
export function isCdnSupported(file) {
  if (!file || !file.type) return false;
  if (file.mediaId === undefined || file.mediaId === null || String(file.mediaId).length < 9) return false;
  const id = parseInt(file.type.id, 10);
  return (id >= 101 && id <= 199) || id === 201 || id === 230 || (id >= 300 && id <= 399);
}

/** Download permission as reported by file/{id}/checkpermissions (replaces the 403 from downloads/{format}). */
export function isDownloadDenied(me) {
  return me.file?.permissions?.allowDownload === false && me.config.ignorePermissionChecks !== true;
}

/**
 * Show a CDN error: alert, console and a 'cdnError' event. Never delivers anything.
 * @param {string} key CDN_INIT_FAILED | CDN_CREATE_FAILED | CDN_AUTH_FAILED | CDN_FILETYPE_NOT_SUPPORTED
 */
export function showCdnError(me, key, detail) {
  console.error('CDN: ' + key, detail ?? '');
  if (typeof me.config.events === 'function') {
    me.config.events('cdnError', {
      id: me.file?.id,
      mediaId: me.file?.mediaId,
      reason: key,
      error: detail === undefined || detail === null ? '' : (typeof detail === 'string' ? detail : JSON.stringify(detail))
    });
  }
  alert(translateCdn(me, key));
}

/**
 * Why config.cdnAuth can't be used, or null when it's fine.
 * Either { client_id, client_secret, refresh_token [, username] } or { auth: 'accesstoken', accesstoken }.
 */
export function cdnAuthProblem(config) {
  const a = config?.cdnAuth;
  const filled = (v) => typeof v === 'string' && v.length > 0;
  if (!a || typeof a !== 'object') return 'MISSING_CDNAUTH';
  if (a.auth === 'accesstoken') return filled(a.accesstoken) ? null : 'MISSING_CDNAUTH_ACCESSTOKEN';
  if (!filled(a.client_id) || !filled(a.client_secret) || !filled(a.refresh_token)) return 'INCOMPLETE_CDNAUTH';
  return null;
}

/**
 * MFAPI instance for the CDN API, using config.cdnAuth. Each MFAPI instance keeps its own
 * token, so the CDN token never mixes with the file selector's normal token.
 * Returns null when config.cdnAuth is invalid (reported by _initCdn via cdnAuthProblem).
 */
export function createCdnApi(config) {
  if (cdnAuthProblem(config)) return null;
  const a = config.cdnAuth;
  const cdnConfig = a.auth === 'accesstoken'
    ? { auth: 'accesstoken', accesstoken: a.accesstoken }
    : { auth: 'token', client_id: a.client_id, client_secret: a.client_secret, refresh_token: a.refresh_token, username: a.username };
  cdnConfig.oauthBase = config.oauthBase;
  return MFAPI(config.apiBase, cdnConfig);
}

/** Error key for a failed CDN call: login problems (token request failed, 401) vs other failures. */
export function cdnErrorKey(err) {
  const message = typeof err === 'string' ? err : err?.message;
  if (err?.status === 401 || (typeof message === 'string' && message.indexOf('AUTHJSON') >= 0)) {
    return 'CDN_AUTH_FAILED';
  }
  return 'CDN_CREATE_FAILED';
}

/** Wrap MFAPI's callback style in a promise; rejects with { message, status, body }. Uses the CDN credentials. */
function request(me, method, endpoint, body) {
  return new Promise((resolve, reject) => {
    if (!me.cdnApi) {
      reject({ message: 'ERR:CDN,NO_CDN_API' });
      return;
    }
    const fail = (message, info) => reject({ message: message, status: info?.status, body: info?.body });
    if (method === 'POST') {
      me.cdnApi.post(endpoint, body, resolve, fail);
    } else {
      me.cdnApi.get(endpoint, resolve, fail);
    }
  });
}

/**
 * Create (or reuse - the API dedups on imageId/cdnId/filename) a CDN resource.
 * Always uses the original filename, never the one edited by the user.
 * A 503 means the resource was saved but a follow-up step failed; POST is idempotent, so it is
 * retried once automatically. Any other failure, or a second 503, is reported as an error.
 */
export async function createResource(me, file) {
  const body = {
    cdnId: me.cdn.cdnId,
    source: 'mediaflow',
    metadata: {
      imageId: String(file.mediaId),
      filename: file.filename,
      filetype: parseInt(file.type.id, 10)
    }
  };
  let o;
  try {
    o = await request(me, 'POST', 'cdn/resources', body);
  } catch (e) {
    if (e?.status !== 503) throw e;
    console.warn('CDN: POST cdn/resources returned 503, retrying once', e.body ?? '');
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    o = await request(me, 'POST', 'cdn/resources', body);
  }
  if (!o || typeof o.url !== 'string' || !o.resourceId) {
    throw { message: 'ERR:POST,CDN,INVALID_RESPONSE', body: o };
  }
  return o;
}

/** Optional (config.cdnWaitForReady): poll until the resource is 'completed'. */
async function waitForReady(me, resource) {
  if (resource.status === 'completed') return resource;
  const until = Date.now() + READY_POLL_TIMEOUT;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, READY_POLL_INTERVAL));
    const o = await request(me, 'GET', 'cdn/resources/' + encodeURIComponent(resource.resourceId));
    if (o?.status === 'completed') return Object.assign({}, resource, o);
    if (o?.status === 'error') throw { message: 'ERR:CDN,RESOURCE_ERROR', body: o.error };
  }
  throw { message: 'ERR:CDN,READY_TIMEOUT' };
}

/**
 * Append transform parameters as query parameters to the URL returned by the API.
 * Edge URLs are never constructed client-side.
 */
export function applyParams(url, params) {
  const order = ['w', 'h', 'rg', 'fit', 'f'];
  const parts = order
    .filter((k) => params && params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => k + '=' + params[k]); // values are numbers, "x,y,w,h" or lowercase enums - no encoding needed
  if (parts.length === 0) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + parts.join('&');
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Crop box (pixels in the natural image) -> "x,y,w,h" in percent, or null when it covers the whole image. */
export function toRegion(crop, naturalWidth, naturalHeight) {
  if (!crop || !(naturalWidth > 0) || !(naturalHeight > 0)) return null;
  const x = Math.min(100, Math.max(0, round2(crop.x / naturalWidth * 100)));
  const y = Math.min(100, Math.max(0, round2(crop.y / naturalHeight * 100)));
  const w = Math.min(round2(crop.width / naturalWidth * 100), round2(100 - x));
  const h = Math.min(round2(crop.height / naturalHeight * 100), round2(100 - y));
  if (!(w > 0) || !(h > 0)) return null;
  if (x <= 0.01 && y <= 0.01 && w >= 99.99 && h >= 99.99) return null;
  return x + ',' + y + ',' + w + ',' + h;
}

/**
 * Transform parameters for an image delivered from the cropper view.
 * @param {object} sel from cropperview.getSelection(): { selectedFormatValue, width, height, cropperData, canvasData }
 */
export function buildImageParams(me, sel) {
  const p = {};
  const w = parseInt(sel.width, 10);
  const h = parseInt(sel.height, 10);
  if (w > 0) p.w = w;
  if (h > 0) p.h = h;

  const v = sel.selectedFormatValue;
  if (v >= -3 && me.config.downloadFormat !== 'original' && p.w && p.h) {
    const rg = toRegion(sel.cropperData, sel.canvasData?.naturalWidth, sel.canvasData?.naturalHeight);
    if (rg) p.rg = rg;
  }
  if (v === -100) p.fit = 'cover';
  if (v === -101) p.fit = 'contain';

  // Same rule as the legacy flow: defaults.imageDownloadFileType only applies to the default formats
  const dft = (me.config?.defaults?.imageDownloadFileType ?? '').toLowerCase();
  if (v < 0 && ['jpg', 'png', 'webp'].includes(dft)) {
    p.f = dft === 'jpg' ? 'jpeg' : dft;
  }

  // CDN 1.0.0: transformed GIF requests need an explicit format (otherwise 500 for some clients)
  const ext = (me.file?.type?.extension ?? '').toLowerCase();
  if (ext === 'gif' && !p.f && Object.keys(p).length > 0) {
    p.f = 'webp';
  }
  return p;
}

/** File extension matching the params (jpeg -> jpg); falls back to the source extension. */
export function fileTypeFor(me, params) {
  if (params && params.f) return params.f === 'jpeg' ? 'jpg' : params.f;
  return me.file?.type?.extension;
}

/**
 * Create the resource and return what goes into the file object.
 * @returns {Promise<{url: string, cdn: object}>}
 */
export async function publish(me, file, params) {
  let resource = await createResource(me, file);
  if (me.config.cdnWaitForReady === true) {
    resource = await waitForReady(me, resource);
  }
  const cdn = {
    resourceId: resource.resourceId,
    url: resource.url,
    versionedUrl: resource.versionedUrl,
    status: resource.status,
    params: params || {}
  };
  if (typeof me.config.events === 'function') {
    me.config.events('cdnResourceCreated', { id: file.id, mediaId: file.mediaId, resourceId: cdn.resourceId, url: cdn.url });
  }
  return { url: applyParams(resource.url, params), cdn: cdn };
}
