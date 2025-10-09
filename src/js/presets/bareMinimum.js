// These are the bear minimum setting for the FS - the rest are implicit (ex. "undefined" can be both false and true depending on which setting it is and so on).
export const bareMinimumSettings = {
    auth: "token",
    client_id: "",
    client_secret: "",
    refresh_token: "",
    success: function (response) {
        console.log('SUCCESS');
        console.log(response);
    },
    events: function (eventName, eventData) {
        console.log('Event = ' + eventName);
        console.log(eventData);
        /*
        if(eventName === 'fileSelected') { }
        if(eventName === 'fileClick') { }
        if(eventName === 'fileDeselected') { }
        if(eventName === 'folderClick') { }
        */
    }
}

export const bareMinimumSettingsWithPreview = Object.assign({}, bareMinimumSettings, {
    success: function (o) {
        console.log('success');
        console.log(o);
        const selectedFile = o;
        document.getElementById('previewFile').innerHTML = '';
        localStorage.setItem('selectedFile', JSON.stringify(selectedFile));
        var player = null;
        if (selectedFile.basetype === 'video') {
            if (selectedFile.embedMethod === 'javascript') {
                //if video element, this is embeded in background mode. So dont use javascript embed
                console.log(selectedFile.embedCode.indexOf('</video>'))
                if (selectedFile.embedCode.indexOf('</video>') != -1) {
                    console.log("backgroundmode")
                    document.getElementById('previewFile').innerHTML = selectedFile.embedCode;
                } else {
                    if (player && typeof player.destroy == 'function') {
                        player.destroy();
                    }
                    const playerOptions = {
                        displayLanguage: 'sv',
                        autoPlay: selectedFile.autoPlay,
                        startTime: selectedFile.startTime,
                        muted: selectedFile.muted
                    };
                    player = new MFPlayer('#previewFile', selectedFile.mediaId, playerOptions);
                }
            }
            else {
                document.getElementById('previewFile').innerHTML = selectedFile.embedCode;
            }
        }
        else {
            var img = document.createElement('img');
            img.src = o.url;
            document.getElementById('previewFile').appendChild(img);
        }

        setTimeout(() => {
          myFileSelector = null;
          document.getElementById('test1').innerHTML = '';
          document.getElementById('test1').style.display = 'none';
          document.getElementById('previewFile').style.display = 'block';
          document.getElementById('browsebtn').style.display = 'block';
        }, 200);
    }
}
);