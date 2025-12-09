/* Mediaflow File Selector */
export default {
  me:{},
  init: function(me, backClickCallback, embedMethod, startTime, autoPlay) {
    this.me = me;
    me.isDownloading = false;
    me.movieviewVisible = false;
    me.movieview = this;
    me.startTime = startTime;
    me.autoPlay = autoPlay;
    me.embedMethod = embedMethod;


    me.backClickCallback = backClickCallback;

    this.themes = [];
  },
  hideMovieView: function(me) {
    me.movieArea.style.display = 'none';
    me.movieArea.innerHTML = '';
    me.movieviewVisible = false;
  },
  showMovieView: function(me) {
    var i;

    /* moviepreviewbox */
    var div1 = document.createElement('div');
    //div1.style.backgroundColor = '#444';
    div1.style.position = 'absolute';
    div1.style.left = '400px';
    div1.style.right = '0';
    div1.style.top = '0';
    div1.style.bottom = '0';
    div1.className = 'mf-cropper-box';

    var iframewrapper = document.createElement('div');
    iframewrapper.style.position = 'absolute';
    
    div1.appendChild(iframewrapper);
    me.movieArea.appendChild(div1);
    
    /* left panel */
    var div2 = document.createElement('div');
    div2.style.position = 'absolute';
    div2.style.left = '0';
    div2.style.width = '400px';
    div2.style.top = '0';
    div2.style.bottom = '0';
    div2.className = 'mf-leftpane-box';

    var div3 = document.createElement('div');
    div3.style.left = '0';
    div3.style.width = '400px';
    div3.style.top = '0';
  //  div3.style.height = '40px';
    div3.style.padding = '16px 0';
    div3.className = 'mf-leftpane-topbox';
    var divbtn = document.createElement('div');
    divbtn.innerHTML = '<svg slot="prefix" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"></path></svg>'+me.lang.translate('VIDEO_OTHER_FILE');
    divbtn.className = 'mf-backlink';
    divbtn.style.cursor = 'pointer';
    divbtn.addEventListener('click', function(e) {me.backClickCallback(me);}, false);
    div3.appendChild(divbtn);
    div2.appendChild(div3);

    var div4 = document.createElement('div');
    div4.className = 'mf-leftpane-mainbox';
    
    div4.style.boxSizing='border-box';
    div4.style.width='100%';
    div4.style.display='inline-block';
    
    div2.appendChild(div4);

    // if we hide video settings, set JS video to the only option
    if (me.config.hideVideoSettings === true) {
      me.embedMethod = 'javascript';
      me.config.allowIframeVideo = false;
    }

    if(me.config.allowIframeVideo !== false && me.config.allowJSVideo !== false) {          
        var header = document.createElement('h2');
        header.innerText = me.lang.translate('EMBEDDING');         
        div4.appendChild(header);
        var radio = document.createElement('input');
        var label = document.createElement('label');
        label.setAttribute('for','mf_radio_js');
        label.innerText = me.lang.translate('EMBED_USING_JAVASCRIPT');
        label.style.color='white';
        label.style.display='block';
        radio.setAttribute('type','radio');
        radio.setAttribute('name','embedMethod');
        radio.setAttribute('value','javascript');
        if(me.embedMethod === 'javascript')
           radio.setAttribute('checked','checked');
        
        radio.style.float = 'left';
        radio.addEventListener('change', function(e) { me.embedMethod = e.target.value;});
        radio.id = 'mf_radio_js';
        label.appendChild(radio);
        div4.appendChild(label);
        
        label = document.createElement('label');
        label.setAttribute('for','mf_radio_iframe');
        label.innerText = me.lang.translate('EMBED_USING_IFRAME');
        label.style.color='white';
        label.style.display='block';
        radio = document.createElement('input');
        radio.addEventListener('change', function(e) { me.embedMethod = e.target.value;});
        radio.style.float = 'left';
        radio.setAttribute('type','radio');
        radio.setAttribute('name','embedMethod');
        radio.setAttribute('value','iframe');
        if(me.embedMethod === 'iframe')
           radio.setAttribute('checked','checked');
        radio.id = 'mf_radio_iframe';
        label.appendChild(radio);
        div4.appendChild(label);               
    } else {
      if(me.config.allowJSVideo !== false) {
        me.embedMethod = 'javascript';
      } else {
        me.embedMethod = 'iframe';
      }
    }

    // settings title
    if (me.config.hideVideoSettings !== true) {
      header = document.createElement('h2');
      header.innerText = me.lang.translate('PLAYBACK'); 
      div4.appendChild(header);
    }

    // Setting for start time
    if (me.config.hideVideoSettings !== true) {
      label = document.createElement('label');
      var cb = document.createElement('input');
    
      label.setAttribute('for','mf_startTime');
      label.innerText = me.lang.translate('START_PLAYBACK_AT');
      label.style.color='white';
      label.style.display='block';
      cb.setAttribute('type','checkbox');
      cb.setAttribute('name','mf_startTime');
      cb.setAttribute('value','true');
      cb.style.float = 'left';
      if(me.startTime > 0)
        cb.setAttribute('checked','');

      cb.addEventListener('change', function(e) { 
        me.useStartOffset = e.target.checked;
                                              
        if(me.useStartOffset) {
            inpH.style.display='';
            inpM.style.display='';
            inpS.style.display='';
        }
        else {
            inpH.style.display='none';
            inpM.style.display='none';
            inpS.style.display='none';
        }
      });
      cb.id = 'mf_startTime';
      label.appendChild(cb);
      div4.appendChild(label);

      var inpH = document.createElement('input');
      var inpM = document.createElement('input');
      var inpS = document.createElement('input');
      if(me.startTime > 0) {
        me.useStartOffset = true;
        var stN = me.startTime
        if(Math.floor(me.startTime / 3600) > 0) {
          inpH.value = Math.floor(me.startTime / 3600);
          stN -= 3600 * Math.floor(me.startTime / 3600);
        }
        if(Math.floor(stN / 60) >= 0) {
          inpM.value = Math.floor(stN / 60);
          stN -= 60 * Math.floor(stN / 60);
        }
        inpS.value = stN;      
      }
      else {
        me.useStartOffset = false;
      }  
      inpH.className = 'mf-txt-input';
      inpM.className = 'mf-txt-input';
      inpS.className = 'mf-txt-input';
      inpH.setAttribute('type','text');
      inpM.setAttribute('type','text');
      inpS.setAttribute('type','text');
      inpH.id= 'startTimeH-' + Math.random().toString().replace('.','');
      inpM.id= 'startTimeM-' + Math.random().toString().replace('.','');
      inpS.id= 'startTimeS-' + Math.random().toString().replace('.','');
      inpH.setAttribute('placeholder','HH');
      inpM.setAttribute('placeholder','MM');
      inpS.setAttribute('placeholder','SS');
      if(me.startTime === 0) {
        inpH.style.display='none';
        inpM.style.display='none';
        inpS.style.display='none';
      }
      function getIntVal(v) {      
        if(v.value === '') return 0;
        return parseInt(v.value,10);
      }
      inpH.addEventListener('input', function(e) {me.startTime = getIntVal(inpH) * 3600 + getIntVal(inpM) * 60 + getIntVal(inpS);});
      inpM.addEventListener('input', function(e) {me.startTime = getIntVal(inpH) * 3600 + getIntVal(inpM) * 60 + getIntVal(inpS);});
      inpS.addEventListener('input', function(e) {me.startTime = getIntVal(inpH) * 3600 + getIntVal(inpM) * 60 + getIntVal(inpS);});
      div4.appendChild(inpH);
      div4.appendChild(inpM);
      div4.appendChild(inpS);
    }

    // Setting for autoPlay
    if (me.config.hideVideoSettings !== true) {
      label = document.createElement('label');
      cb = document.createElement('input');
      
      label.setAttribute('for','mf_autostart');
      label.innerText = me.lang.translate('AUTOSTART_PLAYBACK');
      label.style.color='white';
      
      cb.setAttribute('type','checkbox');
      cb.setAttribute('name','mf_autostart');
      cb.setAttribute('value','true');
      cb.style.float = 'left';
      if(me.autoPlay)
          cb.setAttribute('checked','');

      cb.addEventListener('change', function(e) { me.autoPlay = e.target.checked;});
      cb.id = 'mf_autostart';
      label.appendChild(cb);
      div4.appendChild(label);
    }

    /* insert button  */
    if(me.config.showDoneButton !== false) {
      var divBtn = document.createElement('div');
      divBtn.style.cursor = 'pointer';
      divBtn.className = 'mf-btn';
      divBtn.id = 'mf-btn-done';
      divBtn.innerText = me.lang.translate('USE_THIS_FILE');
      divBtn.addEventListener('click', function(e) { me.movieview.clickDone(me);}, false);
      div2.appendChild(divBtn);    
    }
    me.movieArea.appendChild(div2);

    me.movieArea.style.display = 'block';

    var w = 700;
    var h = 394;
    if(div1.clientWidth > 700) {
      iframewrapper.style.left = Math.round((div1.clientWidth-w)/2) + 'px';
      iframewrapper.style.top = Math.round((div1.clientHeight-h)/2) + 'px';
      iframewrapper.style.width = w + 'px';
      iframewrapper.style.height = h + 'px';
    }
    else {
      h = (Math.round(div1.clientWidth * 9 / 16));
      w = div1.clientWidth;
      iframewrapper.style.width = w + 'px';
      iframewrapper.style.height = h + 'px';
      if(div1.clientHeight > 394)
          iframewrapper.style.top = Math.round((div1.clientHeight-h)/2) + 'px';
    }
        
    this.renderPlayerPreview();
    me.movieviewVisible = true;

    if (me.config.hideVideoSettings !== true) {
      this.getThemes();
    }
  },
  getThemes: function() {
    try {
      this.me.api.get('users/me?fields=activeModules&customerId', (data) => {
        if (data && data.length > 0 && data[0].activeModules && data[0].activeModules.includes('video_player_themes')) {
          
    
            this.me.api.get('player/theme', (data) => {
              if (data.length > 0) {
                // show themes controller
                var div = document.createElement('div');  
                var label = document.createElement('h2'); // label were h2 in old version
                var select = document.createElement('select');
                select.className = 'mf-select';
                label.innerText = this.me.lang.translate('THEME');
                this.themes = data;

                // Add Mediaflow option
                var option = document.createElement('option');
                option.value = '';
                option.text = 'Mediaflow';
                select.appendChild(option);
      
                data.sort((a, b) => a.isDefault ? -1 : 1);
      
                for (var i = 0; i < data.length; i++) {
                  var option = document.createElement('option');
                  option.value = data[i].themeId;
                  option.text = data[i].name;
      
                  if (data[i].isDefault || (this.me.config.defaults && this.me.config.defaults.theme == data[i].themeId)) {
                    option.selected = true;
                  }
      
                  select.appendChild(option);
                }
      
                select.addEventListener('change', (e) => {
                  this.me.pickedTheme = e.target.value;

                  // set autoPlay to true or false of theme has it as default
                  var theme = this.themes.find(x => x.themeId == this.me.pickedTheme);
                  if (theme) {
                    this.me.autoPlay = theme.settings.autoPlay;
                    if (this.me.config.rootElement) {
                      this.me.config.rootElement.querySelector('#mf_autostart').checked = this.me.autoPlay;
                    } else {
                      document.getElementById('mf_autostart').checked = this.me.autoPlay;
                    }
                  }

                  this.renderPlayerPreview();
                });
      
                div.appendChild(label);
                div.appendChild(select);
                var mainBox = this.me.movieArea.querySelector('.mf-leftpane-mainbox');
                mainBox.appendChild(div);
      
                // try to set default theme
                try {
                  var defaultTheme = this.me.config.defaults && this.me.config.defaults.theme ?
                    data.find(x => x.themeId == this.me.config.defaults.theme)
                    : data.find(x => x.isDefault);

                  if (defaultTheme) {
                    this.me.pickedTheme = defaultTheme.themeId;
                    this.renderPlayerPreview();
                  }
                } catch {
                  console.warn('ERR: FAILED TO SET DEFAULT THEME');
                }
              }
            }, (error) => {
      
            });
        }
      }, () => {

      });
    } catch {

    }
  },
  renderPlayerPreview: function() {
    var iframewrapper = this.me.movieArea.querySelector('.mf-cropper-box > div');
    iframewrapper.innerHTML = '';

    var iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.setAttribute('allowfullscreen','true');
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    var url = 'https://play.mediaflowpro.com/ovp/5/' + this.me.file.mediaId
    if (this.me.config.apiBase.includes('tech') || this.me.config.apiBase.includes('localhost')) {
      url = 'https://play.mediaflow.tech/ovp/7/' + this.me.file.mediaId
    } else if (this.me.config.apiBase.includes('build')) {
      url = 'https://play.mediaflow.build/ovp/8/' + this.me.file.mediaId
    }
    
    if (this.me.pickedTheme) {
       url += `?theme=${this.me.pickedTheme}`;
    }

    iframe.src = url;

    iframewrapper.appendChild(iframe);
  },
  clickDone: function(me) {
    var _this = this;
    
    if(me.isDownloading){
      return;
    }
    
    if(me.config.showDoneButton !== false) {
      if (me.config.rootElement) {
        // If rootElement is set, use it to find the button. This is necessary when using the file selector in a web component.
        var btn = me.config.rootElement.querySelector('#mf-btn-done');
      } else {
        var btn = document.getElementById('mf-btn-done');
      }
      btn.disabled = true;
      if(me.config.showDoneButtonWorkingFlow){
        btn.classList.add('working');
        btn.innerText = me.lang.translate('FILE_VIEW_FETCHING_DATA');
      }
      else{
        btn.classList.add('mf-btn-loading');
      }
    }
    me.isDownloading = true;
    
    //create custom event to be triggered when embedcode is ready
    const event = new Event('videoEmbedReady');
    // bind event to element that is destroyed when fileselector is closed, so it will not be triggered when fileselector is opened again
    me.movieArea.addEventListener('videoEmbedReady', videoEmbedReady, false);
    
    function videoEmbedReady(){
      me.isDownloading = false;
      me.movieArea.removeEventListener('videoEmbedReady', videoEmbedReady);
      me.config.success({
        id: me.file.id, 
        folderId: me.selectedFolderId,
        description: me.file.description,
        poster: me.file.poster, 
        mediaId: me.file.mediaId, 
        filename: me.file.filename, 
        basetype: me.file.type.type, 
        filetype: me.file.type.extension, 
        embedMethod: me.embedMethod, 
        embedCode: sEmebedCode, 
        autoPlay: me.autoPlay,
        startTime: me.useStartOffset === true ? me.startTime : 0, 
        theme: me.pickedTheme
      });

      // Show "all done" message to user
      if(me.config.showDoneButtonWorkingFlow){
        if (me.config.rootElement) {
          var btn = me.config.rootElement.querySelector('#mf-btn-done');
        } else {
          var btn = document.getElementById('mf-btn-done');
        }
        btn.classList.add('working-done');
        btn.classList.remove('working');
        btn.innerHTML = `<div><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                          </svg></div><div>${me.lang.translate('FILE_VIEW_FETCHING_DATA_DONE')}</div>`;
      }
    }

    var sEmebedCode = '';
      if(me.embedMethod === 'javascript' && me.config.videoBackgroundMode) {
        var apiURL = 'https://m.mediaflow.com/json/'+me.file.mediaId;
        if (me.config.apiBase.includes('tech') || me.config.apiBase.includes('localhost')) {
          apiURL = 'https://m.mediaflow.tech/json/'+me.file.mediaId;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiURL);
        xhr.onload = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                var o = JSON.parse(xhr.responseText);
                if (o) {
                  var videoSrc = o.mp4s.filter(x => x.size == 1920)[0];//get 1080p
                  videoSrc = videoSrc ? videoSrc : o.mp4s.filter(x => x.size == 1280)[0];//fallback to 720p
                  sEmebedCode = '<video autoplay loop muted src="'+videoSrc.src+'"></video>';
                  me.movieArea.dispatchEvent(event);
                }
              } catch (e) {
                console.warn('ERR: FAILED TO GET VIDEO SOURCE');
              }
            }
          }
        };

        // Show "all done" message to user
        if(me.config.showDoneButtonWorkingFlow){
          if (me.config.rootElement) {
            var btn = me.config.rootElement.querySelector('#mf-btn-done');
          } else {
            var btn = document.getElementById('mf-btn-done');
          }
          btn.classList.add('working-done');
          btn.classList.remove('working');
          btn.innerText = me.lang.translate('FILE_VIEW_FETCHING_DATA_DONE');
        }

        xhr.send(null);
        return;
      } 

      var apiUrl = 'https://m.mediaflow.com/embed';
      if (me.config.apiBase.includes('tech') || me.config.apiBase.includes('localhost')) {
        apiUrl = 'https://m.mediaflow.tech/embed';
      }
      var options = {};
      var iframeOptions = '';

      if (me.pickedTheme) {
        options.theme = me.pickedTheme;
      }
      
      if (me.useStartOffset) {
        options.startAt = me.startTime;
      }

      // Always set here as we don't have the theme setting at hand for comparison
      if (me.autoPlay === true) {
        options.autoPlay = true;
        options.muted = true;
      }else{
        options.autoPlay = false;
      }

      // iframe options
      if(me.embedMethod === 'iframe') {
        iframeOptions = this.mapIframeOptions(iframeOptions, options);
      }

      if (me.config.apiBase.includes('tech') || me.config.apiBase.includes('localhost')) {
        options.env = 'development';
      }
      fetch(apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application',
        },
        body: JSON.stringify({
          imageId: me.file.id,
          customerId: me.customerId,
          videoId: me.file.mediaId,
          mediaType: 'video',
          embedType: me.embedMethod === 'javascript' ? 'js' : 'iframe-responsive',
          mediaTitle: me.file.name,
          themeId: me.pickedTheme,
          options: me.embedMethod == 'javascript' ? JSON.stringify(options) : iframeOptions,
        }),
      }).then(response => response.json()).then(data => {
        sEmebedCode = data.embedCode;
        me.movieArea.dispatchEvent(event);
      }).catch((error) => {
        console.error('Error:', error);
      });
  },
  mapIframeOptions: function(iframeOptions, options) {
    iframeOptions += `&autoPlay=${options.autoPlay ? 'true' : 'false'}`;
    
    if(options.muted) {
      iframeOptions += `&muted=true`;
    }
    
    if(options?.startAt > 0 ?? false) {
      iframeOptions += `&startAt=${options.startAt}`;
    }

    return iframeOptions.startsWith("&") ? iframeOptions.substring(1) : iframeOptions;
  }
};