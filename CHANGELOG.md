# Change log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

# 2.4.0 2025-12-02
### Added
- Added German translations and updated German date formatting.

### Fixed
- Fixed bug where some buttons could have unintentional behavior due to not
  preventing the default behavior of the buttons.
- Fixed faulty URL validation function.

# 2.3.0 2025-10-20

### Changed
- New Mediaflow branding.

# 2.2.4 2025-10-14

### Changed
- Added support for `Keep Ratio` download preset

# 2.2.3 2025-10-08

### Changed
- Added support these font types: `ttf`, `otf`, `woff`, `woff2`, `eof`

# 2.2.2 2025-10-02

### Changed
- Added support for configurable rootElement in additional locations

# 2.2.1 2025-08-25

### Fixed
- Added checks for `canvasData` and `cropperData` to prevent errors when using File Selector without cropper.

# 2.2.0 2025-08-19

### Added
- Success callback object now includes `canvasWidth`, `canvasHeight`, `cropWidth`, `cropHeight`, and `cropCoordinates` with `x1`, `y1`, `x2`, `y2`.

# 2.1.2 2025-07-04

### Changed
- Added validation for users/me request.

# 2.1.1 2025-05-26

### Fixed
- getElementById => querySelector to support rootElement

# 2.1.0 2025-05-19

### Added
- Support `rootElement` setting to allow specifying a custom root element (instead of document)

# 2.0.1 2025-04-28

### Fixed
- RegEx for validating the navigation URL

# 2.0.0 2025-04-22

### Fixed
- Moved translations to the cloud
- Styling list view
- Navigation link description

# 1.9.0 2025-04-09

### Added
- Support for 'returnValue'. If you don't want to download the file, just get file info,
  you can specify 'returnValue': 'fileObject'. The default value is 'url'


# 1.8.2 2025-04-04

### Fixed
- Fix for downloadFormat: 'original'

# 1.8.1 2025-04-02

### Fixed
- Fix for 'downloadFormats' with a format with id = 0

# 1.8.0 2025-03-27

### Added
- Displaying dimensions for image in right pane
- New setting "useNavigationLink" - to enable adding an URL to the output data
- 'type' added to output json object, when clicking on a file  
Ex. type:'image', type:'video' etc.

### Fixed
- Updated code to work as wanted when getting embed code from server
- When using config.downloadFormat: 'original' we got w/h = 0. (Fixed in this version)
- Some minor css text alignments

# 1.7.0 2025-02-26

### Added
- Support for "svg" files.  
Note! Setting "permanentURL" must be true

# 1.6.0 2025-01-17

### Added
- If using any of the default "Image size:s" and the image file type is .webp,  
the image asset will now be .webp (previous just supported .png).
- Setting for default image asset file type:  
```defaults: {imageDownloadFileType: "webp"} - with valid file types ["jpg" | "png" | "webp"]```  
Applies to default "Image size:s" and has heigher priority than the above "rule".

### Fixed
- Missing null check on "me.config.defaults.format"

# 1.5.0 2025-01-10

### Added
- Support to serve "pdf" files via asset server when/if setting "permanentURL" = true.  
(This adds '&permalink=true' to the download url.)
- Ability to shrink (not crop) an image to "fit" (cover/contain) inside a container (ex. div).
Using setting "defaults" with parameters 'width', 'height' and 'format'.
- New "default" formats: -100 (cover), -101 (contain) and -102 (none).  
Only used in conjunction with "defaults". Ex. ..., defaults:{width: 300, height: 200, format: -100}, ...
(-102 'none' means - take the whole image as is with its original width and height).  
If "deafult.format" = [-100 | -101 | -102] then the corresponding format is added to the "format selector" via code.
- New setting "defaults.disableCropper" - explicitly says that the cropper should not be used. The view is still rendered but without the actual cropper.
- New setting "hideLeftPaneCropperFileData" to explicitly hide all file data when in cropper view (display:none on the table).  
(Notice that the fields cannot be omitted completely as the logic in the code still uses them.)  

#### Note:  
If "defaults.disableCropper" = true and "deafult.format" = [-100 | -101 | -102] then "clickDone()" is called automatically (as we do not want/need to do anything more with the image).

### Fixed
- Webpack build setting - now includes "presets".  
.css files now end up in ./css/ folder.
- Preset inheritance issue.

# 1.4.5 2024-12-13

### Fixed
- Video preview was not working in staging environment
- Video embed codes didn't work because streamapi has a new syntax för requesting embed codes

# 1.4.4 2024-11-21

### Added 
- Now showing transparent background for images with transparent background.
- The images are now displayed with slightly higher quality.
- Lazy loading
- 'aiAltTextDisabled' setting to explicitly disable AI alt text option.
- 'aiSearchDisabled' setting to explicitly disable AI search option.
- 'excludePrivateFolders' setting to exclude private folders in folder tree (api request flag).

### Fixed
- Minor UI fixes
- Alt text property was missing if setting downloadFormat="original"
- Crop area is maximized - stretching horizontally or vertically

# 1.4.3 2024-10-22

### Fixed
- Language fix for AI search

# 1.4.2 2024-10-22

### Fixed
- Fix for end-point that does not exist (api v. 3) - still displaying file info.

# 1.4.1 2024-10-22

### Fixed
- Bug with alt-text field not showing

# 1.4.0 2024-10-21

### Added 
- Now using grid layout in file view to make it responsive.
- Now showing file type in file card (and play icon on videos).
- 'selectedFolder' setting can be used separatly from 'selectedFile' to just open a folder.
- Support for alt text from AI  
(New setting 'aiAltTextLanguageCode' which can be used if the language of the current page being edited can be determined - else language selector drop-down in FS)
- FS_VERSION (current version from package.json) - to be used for cache-busting of css  
(Also displayed when hovering the logo)

# 1.3.0 2024-10-01

### Added 
- Support for showing, fetching and editing Description (new settings: 'setDescription', 'autosetDescription'. Both default: false )
- Added support for AI-search (api call to get setting from customers MF instance) - search button removed (press 'Enter')
- Added setting 'showDoneButtonWorkingFlow' (default false) to get feed-back where we can not close the FS in an plug-in (like Sitevision)

### Fixed
- Some minor CSS issues and face-lift.
- Translation

# 1.2.0 2024-06-03

### Added
- Updated theme to better match Mediaflow's new design
- Added ability to pick a video player theme
- Added ignorePermissionChecks setting to ignore file warnings in case we only want a reference to a file and not download it.

## 1.1.4 2024-05-22

### Fixed
- Fix for PNG format if using original format
- Fix for permanentURL and original image not giving a permanent url

## 1.1.3 2024-03-22

### Fixed
- Patch on callback for videos

## 1.1.2 2024-03-11

### Fixed
- Updated design to clearly indicate when Force Alt Text setting is turned on
- Small design updates to align with updated design for 4.0

## 1.0.4 2022-05-10

### Fixed
- Correct ratio when picked format use whole image
  
## 1.0.3 2022-03-07

### Fixed
- Fixed responsive view when dragging browser to smaller view

## 1.0.2 2022-02-21

### Added
- Added iframe title

## 1.0.1 2022-01-11

### Fixed
- Css fix for back button

## 1.0.0 2022-01-11

### Added
- Support for responsive fileselector
