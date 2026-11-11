/**
 * Shared parts of the file object passed to config.success.
 * Kept in line with the Asset Migration Service (AMS) file object, so integrations
 * get the same properties for a picked file and for a migrated ImageVault asset.
 */

/**
 * File metadata properties the AMS file object also has.
 * Properties without a value are undefined and so left out of JSON.
 */
export function assetFields(file) {
  return {
    isMediaflowAsset: true,
    type: file.type,
    filesize: file.filesize,
    thumbPreview: file.thumbPreview,
    smallPreview: file.smallPreview,
    mediumPreview: file.mediumPreview
  };
}

/**
 * Adds the CDN resource info: the cdn object and, as in the AMS file object, the flat resourceId.
 */
export function withCdn(result, cdn) {
  result.cdn = cdn;
  result.resourceId = cdn ? cdn.resourceId : undefined;
  return result;
}

/**
 * True when the crop box (natural image pixels) does not cover the whole image.
 */
export function isCropped(cropX, cropY, cropWidth, cropHeight, canvasWidth, canvasHeight) {
  if (!(cropWidth > 0) || !(cropHeight > 0) || !(canvasWidth > 0) || !(canvasHeight > 0)) return false;
  return Math.round(cropX) > 0
    || Math.round(cropY) > 0
    || Math.round(cropWidth) < canvasWidth
    || Math.round(cropHeight) < canvasHeight;
}
