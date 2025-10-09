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

# Release flow
See documentation in Notion