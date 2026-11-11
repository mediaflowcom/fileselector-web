# CDN support feature
The File selector is normally delivering a file object (json) with an URL to consume in integrations.
This URL is temporary and will expire after some time so the idea is for the integration to download the file and upload it to the integrated host system.
Now we have a CDN api to use as an alternative (see attached pdf in the context).
When the fileselector object is created, I want a new function, isUsingCDN(), to be called. This function will make an api call, /users/me?fields=activeModules, to Mediaflow in order to decide whether the CDN module is active for the customer. Later, the cdnId will also be fatched - use cdnId=2 for now.
If isUsingCDN is true, when a file is selected (with or without preview) and the file object shall be delivered back to the integration, a CDN resource shall be created and transform parameters should be set. Finally the file objects URL is replaced by the resulting CDN URL.
With isUsingCDN() is true the FS should never deliver a temporary URL. For video assets, CDN on/off doesn't matter they're always using the same URL as tody.


## Browser → management API
The guide says to call the management API from a backend but `POST /1/cdn/resources` works from the browser with CORS for all three auth modes.

## cdnId source
The cdnId source is yet unkown but will be retrieved via Mediaflows api. Just ignore it for now and set the default value to `2`.

## CDN filename
If the user maodifies the filename, use the original me.file.filename for the resource and keep returning the edited name in filename.

## Keep the downloads/{format} call?
Remove it.

## Failures
Show an error as soon as an API call is failing. The same goes for file types, not supported by CDN.

## returnValue: 'fileObject'
returnValue: 'fileObject' shall return the raw file without a URL.

## Lifecycle
The file selector only creates resources