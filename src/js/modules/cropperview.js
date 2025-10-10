/* Mediaflow File Selector */

import Cropper from 'cropperjs';

export default {
  me:{},
  init: function(me, backClickCallback) {
    this.me = me;
    me.isDownloading = false;
    me.cropperviewVisible = false;
    me.cropperview = this;
    me.backClickCallback = backClickCallback;
    me.lastEntered = {direction:'w', w:800, h:600};
    me.formats = [];
    
    if(me.config.downloadFormat === 'fixed' || me.config.downloadFormat === 'both') {
      for(let i=0; i<me.config.downloadFormats.length; i++) {
        me.formats.push(me.config.downloadFormats[i]);
      }
    }

    if(me.config.downloadFormat === 'mediaflow' || me.config.downloadFormat === 'both') {
      me.api.get('formats?fields=id,name,suffix,filetype,width,height,keepRatio', 
        function(o){me.formats = me.formats.concat(o);}, 
        function(o){console.error('Error: Failed to get formats data');}
      );
    }else if(me.config.downloadFormat === 'original') {
      me.formats = [{id:0, name:'Original', width:-1, height:-1, format:'', dpi:0}];
    }else if(me.config.downloadFormat === 'stream') {
      me.formats = [{id:0, name:'Stream', width:0, height:0, format:'', dpi:0}];
    }
  },
  hideCropper: function(me) {
    me.cropperArea.style.display = 'none';
    me.cropperArea.innerHTML = '';
    me.cropperviewVisible = false;
  },
  showCropper: function(me) {
    // We can disable the cropper alltogether if the defaults object "demands" it.
    // Used when we are not going to crop - but just, for example, reduce the size of an image.
    const disableCropper = me.config?.defaults?.disableCropper ?? false;
    const hideLeftPaneCropperFileData = me.config.hideLeftPaneCropperFileData === true;

    /* cropperpreviewbox */
    var div1 = document.createElement('div');
    div1.style.position = 'absolute';
    div1.style.inset = "0 0 0 420px";
    div1.className = 'mf-cropper-box';

    var imgwrapper = document.createElement('div');
    imgwrapper.id = "mfCropperBoxWrapper"
    imgwrapper.style.position = 'absolute';
    var img = document.createElement('img');
    img.src = me.file.mediumPreview;
    img.style.display = 'block';
    img.style.maxWidth = '100%';
    imgwrapper.appendChild(img);
    div1.appendChild(imgwrapper);

    me.cropperWarning = document.createElement('div');
    me.cropperWarning.style.position = 'absolute';
    me.cropperWarning.style.top = '0';
    me.cropperWarning.style.minHeight = '24px';
    me.cropperWarning.style.left = '0';
    me.cropperWarning.style.right = '0';
    me.cropperWarning.style.display = 'none';
    me.cropperWarning.className = 'mf-warn';
    div1.appendChild(me.cropperWarning);
    
    me.cropperArea.appendChild(div1);
    
    /* left panel */
    var div2 = document.createElement('div');
    div2.style.position = 'absolute';
    div2.style.left = '0';
    div2.style.width = '400px';
    div2.style.top = '0';
    div2.style.bottom = '0';
    div2.className = 'mf-leftpane-box';

    me.config.debugMode && addToggleButton(div2, me);

    var div3 = document.createElement('div');
    div3.style.left = '0';
    div3.style.width = '400px';
    div3.style.top = '0';
    div3.style.padding = '16px 0';
    div3.className = 'mf-leftpane-topbox';
    var divbtn = document.createElement('button');
    divbtn.innerHTML = '<svg slot="prefix" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"></path></svg>'+me.lang.translate('CROPPER_OTHER_FILE');
    divbtn.className = 'mf-backlink';
    divbtn.addEventListener('click', function(e) {
      me.backClickCallback(me);
    }, false);
    div3.appendChild(divbtn);
    div2.appendChild(div3);

    var tbl = document.createElement('table');
    tbl.className = "mf-cropperview-image";

    // If we want to hide all fields. Button "done" button still visible.
    if(hideLeftPaneCropperFileData) {
      tbl.style.display='none';
    }

    var trn = document.createElement('tr');
    if(me.config.allowSelectFormat === false){
      trn.style.display='none';
    }
    var tdn = document.createElement('td');
    tdn.innerText = me.lang.translate('CROPPER_IMAGESIZE');
    tdn.className = 'mf-hdr';
    trn.appendChild(tdn);
    tdn = document.createElement('td');
    me.formatSelector = document.createElement('select');

    // #region Formats
    // Special setting (config.defaults{}) to shrink an image to "fit" some html container's width/height (if image is larger)
    // Shrinking the image makes the file size smaller - :-)
    if ([-100, -101].includes(me.config?.defaults?.format)) {
      // Add to formatSelector
      me.formatSelector.innerHTML += `<option value="${me.config.defaults.format}" data-id="${me.config.defaults.format}">${me.config.defaults.format === -100 ? "COVER" : "CONTAIN"}</option>`;
    }
    // Keeping the image original size (file.width and file.height)
    else if ([-102].includes(me.config?.defaults?.format)) {
      // Add to formatSelector
      me.formatSelector.innerHTML += `<option value="${me.config.defaults.format}" data-id="${me.config.defaults.format}">NONE (org. size)</option>`;
    }

    me.formatSelector.innerHTML += `<option value="-3">${me.lang.translate('CROPPER_USE_ENTIRE_IMAGE')}</option>`;
    me.formatSelector.innerHTML += `<option value="-2">${me.lang.translate('CROPPER_USE_OWN_FORMAT')}</option>`;
    me.formatSelector.innerHTML += `<option value="-1">${me.lang.translate('CROPPER_CROP_FREELY')}</option>`;

    if(me.formats.length > 0) {
      me.formatSelector.innerHTML += `<option value="-4">---${me.lang.translate('CROPPER_PREDEFINED_FORMATS')}---</option>`;
      for(let i = 0; i < me.formats.length; i++) {
        me.formatSelector.innerHTML += `<option value="${i}" data-id="${me.formats[i].id}">${me.formats[i].name}</option>`;
      }
    }
    me.formatSelector.addEventListener('change', function(e) {
      me.cropperview.changeFormat(e, me);
    }, false);
    tdn.appendChild(me.formatSelector);
    trn.appendChild(tdn);
    tbl.appendChild(trn);
    // #endregion

    // #region Width
    me.widthInputRow = document.createElement('tr');
    tdn = document.createElement('td');
    tdn.innerText =  me.lang.translate('CROPPER_WIDTH');
    tdn.className = 'mf-hdr';
    me.widthInputRow.appendChild(tdn);
    tdn = document.createElement('td');
    me.widthInput = document.createElement('input');
    me.widthInput.setAttribute('type', 'number');
    me.widthInput.setAttribute('min', '1');
    me.widthInput.className = 'mf-sizeinput';
    me.widthInput.title = me.lang.translate('CROPPER_WIDTH_TITLE');
    me.widthInput.addEventListener('input', function(o) { me.cropperview.updateInput(me, 'w');}, false);
    tdn.appendChild(me.widthInput);
    var spann = document.createElement('span');
    spann.className = 'mf-pxspan';
    spann.innerText = 'px';
    tdn.appendChild(spann);
    me.widthInputRow.appendChild(tdn);
    if(me.formats.length > 0)
      me.widthInputRow.style.display = 'none';
    tbl.appendChild(me.widthInputRow);
    // #endregion
    
    // #region Height
    me.heightInputRow = document.createElement('tr');
    tdn = document.createElement('td');
    tdn.innerText = me.lang.translate('CROPPER_HEIGHT');
    tdn.className = 'mf-hdr';
    me.heightInputRow.appendChild(tdn);
    tdn = document.createElement('td');
    me.heightInput = document.createElement('input');
    me.heightInput.setAttribute('type', 'number');
    me.heightInput.setAttribute('min', '1');
    me.heightInput.className = 'mf-sizeinput';
    me.heightInput.title = me.lang.translate('CROPPER_HEIGHT_TITLE');
    me.heightInput.addEventListener('input', function(o) { me.cropperview.updateInput(me, 'h');}, false);
    tdn.appendChild(me.heightInput);
    spann = document.createElement('span');
    spann.className = 'mf-pxspan';
    spann.innerText = 'px';
    tdn.appendChild(spann);
    me.heightInputRow.appendChild(tdn);
    if(me.formats.length > 0)
      me.heightInputRow.style.display = 'none';
    tbl.appendChild(me.heightInputRow);
    // #endregion

    trn = document.createElement('tr');
    tdn = document.createElement('td');
    tdn.innerText =  me.lang.translate('CROPPER_FILE_NAME');
    tdn.className = 'mf-hdr';
    trn.appendChild(tdn);
    tdn = document.createElement('td');
    me.filenameInput = document.createElement('input');
    me.filenameInput.className = 'mf-txt-input';
    me.filenameInput.value = me.file.name;
    me.filenameInput.title = me.lang.translate('CROPPER_FILE_NAME_TITLE');
    tdn.appendChild(me.filenameInput);
    trn.appendChild(tdn);
    tbl.appendChild(trn);

    // #region Alt text
    trn = document.createElement('tr');
    if(me.config?.setAltText === false){
      trn.style.display='none';
    }
    tdn = document.createElement('td');
    tdn.innerHTML = me.lang.translate('CROPPER_ALT') + (me.config.forceAltText ? '<span style="color: #D71D43;">&nbsp;*</span>' : '');
    tdn.className = 'mf-hdr';
    tdn.setAttribute('valign', 'top');
    trn.appendChild(tdn);
    tdn = document.createElement('td');
    tdn.className = "mf-td-alt-text";
    me.altInput = document.createElement('textarea');
    if(me.config?.forceAltText){
      me.altInput.setAttribute("required", "");
    }
    me.altInput.className = 'mf-txtarea-input';
    if(typeof(me.config.customAltText)==='string'){
      me.altInput.value = me.config.customAltText;
    }
    else if(me.config.autosetAltText !== false){
        me.altInput.value = me.file.alttext;
    }
    me.altInput.title = me.lang.translate('CROPPER_ALT_TITLE');
    me.altInput.style.resize ='none';
    tdn.appendChild(me.altInput);
    trn.appendChild(tdn);
    tbl.appendChild(trn);
    // #endregion

    // #region Alt text - AI
    if((me.file?.aiAltTextCanBeUsed ?? false) && me.config.aiAltTextDisabled !== true){
      let aiAltText = document.createElement("span");
      aiAltText.title = me.lang.translate("CROPPER_AI_ALT_TEXT");
      aiAltText.className = 'mf-ai-alt';
      aiAltText.addEventListener("click", () => toggleAiAltTextSelector());
      aiAltText.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stars" viewBox="0 0 16 16">
                              <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z"></path>
                            </svg>`;
      tdn.setAttribute("data-ai-alt-txt", "");

      if (me.config.aiAltTextLanguageCode) {
        aiAltText.addEventListener("click", function() { me.cropperview.getAiAltText(me, me.config.aiAltTextLanguageCode); });
        tdn.appendChild(aiAltText);
      }
      else {
        tdn.appendChild(aiAltText);

        let aiAltTextLangSelector = document.createElement("div");
        aiAltTextLangSelector.className = 'mf-ai-alttext-selector';

        let langList = 
        [ { langName: me.lang.translate("ENGLISH_UK"), langCode: "en-GB" },
          { langName: me.lang.translate("ENGLISH_US"), langCode: "en-US" },
          { langName: me.lang.translate("FINNISH"), langCode: "fi-FI" },
          { langName: me.lang.translate("GERMAN"), langCode: "de-DE" },
          { langName: me.lang.translate("NORWEGIAN"), langCode: "nb-NO" },
          { langName: me.lang.translate("SWEDISH"), langCode: "sv-SE" }
        ]

        langList.sort((a, b) => a.langName.localeCompare(b.langName));

        langList.forEach((lang, index) => {
          const langButton = Object.assign(document.createElement("button"), {
            type: "button",
            innerText: lang.langName,
          });
          langButton.addEventListener("click", (e) => me.cropperview.getAiAltText(me, lang.langCode));
          aiAltTextLangSelector.appendChild(langButton);
        })
        tdn.appendChild(aiAltTextLangSelector);

      }
    }
    // #endregion

    // #region Description
    trn = document.createElement('tr');
    if(me.config.setDescription !== true){
      trn.style.display='none';
    }
    tdn = document.createElement('td');
    tdn.innerHTML = me.lang.translate('FILE_INFO_DESC');
    tdn.className = 'mf-hdr';
    tdn.style.paddingTop = '10px';
    tdn.setAttribute('valign', 'top');
    trn.appendChild(tdn);
    tdn = document.createElement('td');
    me.fileDescription = document.createElement('textarea');
    me.fileDescription.className = 'mf-txtarea-input';
    if(me.config.autosetDescription === true){
        me.fileDescription.value = me.file.description;
    }
    me.fileDescription.title = me.lang.translate('FILE_INFO_DESC');
    me.fileDescription.style.resize ='none';
    tdn.appendChild(me.fileDescription);
    trn.appendChild(tdn);
    tbl.appendChild(trn);

    div2.appendChild(tbl);
    // #endregion

    // #region Link
    if (me.config.useNavigationLink === true) {
      const linkTR = document.createElement('tr');
      const td_link_header = Object.assign(document.createElement("td"),
        {
          className: "mf-hdr",
          innerHTML: me.lang.translate('CROPPER_NAVIGATION_LINK'),
        });
      linkTR.appendChild(td_link_header);

      // input
      const td_link_input = document.createElement("td")
      me.navigationLink = Object.assign(document.createElement('input'), {
        type: 'text',
        className: 'mf-txt-input',
        title: me.lang.translate('CROPPER_NAVIGATION_LINK_TITLE'),
        onblur: (e) => this.validateURL(e.target),
        onclick: (e) => this.resetValidateURL(e.target),
      });      

      // description
      const navDesc = Object.assign(document.createElement('div'), {
        innerHTML: me.lang.translate('CROPPER_NAVIGATION_LINK_DESCRIPTION'), 
        style: "font-size:.75rem; white-space:pre-line; " 
      });

      // checkbox
      const navLabel = Object.assign(document.createElement('label'), 
      { 
        innerHTML: me.lang.translate('CROPPER_NAVIGATION_LINK_TARGET'), 
        style: "display: flex; align-items: center; gap: 4px; font-size:.75rem; margin-top: 4px;" 
      });      
      me.navigationLinkTarget = Object.assign(document.createElement('input'),
      {
        type: 'checkbox',
      });
      navLabel.insertBefore(me.navigationLinkTarget, navLabel.firstChild);

      td_link_input.appendChild(me.navigationLink);
      td_link_input.appendChild(navDesc);
      td_link_input.appendChild(navLabel);
      linkTR.appendChild(td_link_input);
      tbl.appendChild(linkTR);
    }
    // #endregion

    /* insert button  */
    if(me.config.showDoneButton !== false) {
      var divBtn = document.createElement('div');
      divBtn.className = 'mf-btn';
      divBtn.id = 'mf-btn-done';
      divBtn.innerText = me.lang.translate('USE_THIS_FILE');
      divBtn.addEventListener('click', function(e) { me.cropperview.clickDone(me);}, false);
      div2.appendChild(divBtn);    
    }
    me.cropperArea.appendChild(div2);

    me.cropperArea.style.display = 'block';

    setCropperSizeAndPosition();

    let aspectRatio = 16/9;
    let handleKeepRatioFormat = false; // Used if we have a "keepRatio" format

    if(me.formats.length > 0) {
      me.formatSelector.selectedIndex = 4; // The first crop format in drop-down from MF or if downloadFormat = "original".
      me.selectedFormat = me.formats[0].id;
      // -1 for width and height means "use original size"
      if(me.formats[0].width === -1 && me.formats[0].height === -1) {
        me.lastEntered.w = me.file.width; // set width to original image width
        me.lastEntered.h = me.file.height; // set height to original image height
        aspectRatio = me.lastEntered.w / me.lastEntered.h;
      } // "Keep Ratio"? 
      else if(this.isKeepRatioFormatSelected(me.formats[0])) {
        handleKeepRatioFormat = true;
      } else {
        aspectRatio = me.formats[0].width / me.formats[0].height;
        me.lastEntered.w = me.formats[0].width;
        me.lastEntered.h = me.formats[0].height;
        me.lastEntered.direction = 'w';
      }
    } else {
      me.formatSelector.selectedIndex = 1;
      aspectRatio = (me.file.width / me.file.height);
      me.lastEntered.w = 800;
      me.lastEntered.h = Math.round(800 / aspectRatio);
      me.lastEntered.direction = 'w';
    }

    // "config.defaults" - special case where width and height are dictated by this config's settings.
    let usingDefaultsFormat = false;
    if(me.config?.defaults?.width != undefined && me.config?.defaults?.height != undefined) {
      usingDefaultsFormat = true;

      me.lastEntered.w = me.config.defaults.width;
      me.lastEntered.h = me.config.defaults.height;
      me.lastEntered.direction = 'w';
      aspectRatio = me.lastEntered.w / me.lastEntered.h

      // Set values here if cropper.crop (below) is not executed due to disabled Cropper
      me.widthInput.value = me.lastEntered.w;
      me.heightInput.value = me.lastEntered.h;

      // Call setDefaultFormat() as there is no cropper
      disableCropper && setDefaultFormat();
    }

    if(disableCropper !== true){
      me.cropper = new Cropper(img, {
        aspectRatio: aspectRatio,
        autoCropArea: 1,
        zoomable: false,
        crop: function(event) {
          // Fix for when event.detail.height and/or event.detail.width = Infinity | NaN
          if((event.detail.width === Infinity || event.detail.height === Infinity) ||
            (isNaN(event.detail.width) || isNaN(event.detail.height))) {
            return;
          }

          if(me.lastEntered.direction === 'w') {
            me.widthInput.value = me.lastEntered.w;
            me.heightInput.value = Math.round(me.lastEntered.w * (event.detail.height / event.detail.width));
          } else {
            me.widthInput.value = Math.round(me.lastEntered.h * (event.detail.width / event.detail.height));
            me.heightInput.value = me.lastEntered.h;
          }
          me.cropperview.checkCropSize(me, Math.round(event.detail.width), Math.round(event.detail.height));
        },
        ready: function (event) {
          handleKeepRatioFormat && me.cropperview?.handleKeepRatioFormat(me, me.formats[0]); // If we have a "keepRatio" format selected
          var idata = me.cropper.getImageData();
          if (Math.abs(idata.naturalWidth / idata.naturalHeight - aspectRatio) < 0.01) {
           var contData = me.cropper.getContainerData();
           me.cropper.setCropBoxData({ left: 0, top: 0, height: contData.height, width: contData.width })
          }

          // If we use defaults format, we may need to recalculate the cropper box
          usingDefaultsFormat && setDefaultFormat();
        }
      });
      me.cropperviewVisible = true;
    }

    function setDefaultFormat(){
      // set default format
      if(me.config?.defaults?.format != undefined) {
        me.formatSelector.selectedIndex = me.formatSelector.querySelector('option[value="'+me.config.defaults.format+'"]').index;
        me.selectedFormat = me.config.defaults.format;

        // Call changeFormat for this special case
        me.cropperview.changeFormat(null, me);
      }
    }

    function setCropperSizeAndPosition() {
      const clientWidth = div1.clientWidth;
      const clientHeight = div1.clientHeight;
      const minTopMargin = 30;
      const minLeftMargin = 10;
      const w = me.file.width;
      const h = me.file.height;
      var ww, hh, maxw = 700, maxh = 700;

      if (clientWidth < maxw) {
        maxw = clientWidth - (minLeftMargin * 2); // Room for top/bottom"margin"
      }
      if (clientHeight < maxh) {
        maxh = clientHeight - (minTopMargin * 2); // Room for left/right "margin"
      }
      
      ww = maxw;
      hh = Math.round(maxw * h / w);
      if (ww > maxw || hh > maxh) {
        hh = maxh;
        ww = Math.round(maxh * w / h);
      }
      const topMargin = Math.max(Math.round((clientHeight - hh) / 2), minTopMargin);
      imgwrapper.style.top = `${topMargin}px`;
      const leftMargin = Math.max(Math.round((clientWidth - ww) / 2), minLeftMargin);
      imgwrapper.style.left = `${leftMargin}px`;
      imgwrapper.style.width = `${ww}px`;
      imgwrapper.style.height = `${hh}px`;
    }

    function toggleAiAltTextSelector() {
      const rootElement = me.config.rootElement || document;
      const aiAltText = rootElement.querySelector(".mf-ai-alt");
      aiAltText.classList.toggle("mf-ai-alt-open");
      me.cropperArea.removeEventListener("click", hideAiAltTextSelector);
      window.setTimeout(() => me.cropperArea.addEventListener("click", hideAiAltTextSelector), 200);
    }

    function hideAiAltTextSelector() {
      const rootElement = me.config.rootElement || document;
      const aiAltText = rootElement.querySelector(".mf-ai-alt");
      aiAltText.classList.remove("mf-ai-alt-open");
      me.cropperArea.removeEventListener("click", hideAiAltTextSelector);
    }

    // In this scenario we want to "click" on "Use this file" via code
    if(disableCropper && [-100, -101, -102].includes(Number.parseInt(me.selectedFormat))){
      me.cropperview.clickDone(me);
    }

    function addToggleButton(container, me) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-toggle-details-debug';
      Object.assign(btn.style, {
        position: 'absolute',
        width: '10px',
        height: '10px',
        left: '0',
        bottom: '0',
        border: '0',
        background: 'transparent'
     });

      btn.addEventListener('click', function () {
        const widthRow = me.widthInputRow;
        const heightRow = me.heightInputRow;
        if (!heightRow || !widthRow) return;
        heightRow.style.display = (heightRow.style.display === 'none') ? '' : 'none';
        widthRow.style.display = (widthRow.style.display === 'none') ? '' : 'none';
      }, false);

      container.appendChild(btn);
    }
  },
  checkCropSize: function(me, w, h) {
    var ww = 700;
    if(me.file.width < me.file.height) {
      ww = Math.round(700 * (me.file.width / me.file.height));
    }
    var checkW =  Math.round(me.lastEntered.w/(w/ww));
    if(checkW > me.file.width) {
      var procenten = Math.round(100*((checkW/me.file.width)-1));
      
      me.cropperWarning.innerText = "";
      me.cropperWarning.style.display = '';
      if(procenten>100){
        me.cropperWarning.innerText = me.lang.translateWithParams('CROPPER_UPSCALE', [procenten]);
      }
      else if(procenten > 0){
        me.cropperWarning.innerText = me.lang.translateWithParams('CROPPER_UPSCALE_WARN', [procenten]);
      }
      else{
        me.cropperWarning.style.display = 'none';
      }
    } else {
      me.cropperWarning.style.display = 'none';
    }
  },
  updateInput: function(me, direction) {
    var value, cropperData;
    var selIdx = parseInt(me.formatSelector[me.formatSelector.selectedIndex].value, 10);

    if(direction === 'w') {
      value = parseInt(me.widthInput.value, 10);
      if(value<=0)
        return;
      if(selIdx === -1 || selIdx === -3) { // beskär fritt || använd hela bilden
        cropperData = me.cropper.getData();
        me.lastEntered.w = value;
        me.heightInput.value = Math.round(value * (cropperData.height / cropperData.width));
      }
      if(selIdx === -2) { // ange eget format
        me.lastEntered.w = value;
        me.cropper.setAspectRatio(me.lastEntered.w / me.lastEntered.h);
      }
    } else {
      value = parseInt(me.heightInput.value, 10);
      if(value<=0)
        return;
      if(selIdx === -1 || selIdx === -3) { // beskär fritt || använd hela bilden
        cropperData = me.cropper.getData();
        me.lastEntered.h = value;
        me.widthInput.value = Math.round(value * (cropperData.width / cropperData.height));
      }    
      if(selIdx === -2) { // ange eget format
        me.lastEntered.h = value;
        me.cropper.setAspectRatio(me.lastEntered.w / me.lastEntered.h);
      }
    }
    me.lastEntered.direction = direction;
  },
  changeFormat: function(e, me) {
    me.cropper?.enable(); // In case it was disabled due to "keepRatio" format
    var selOpt = me.formatSelector[me.formatSelector.selectedIndex];
    var selectedFormatValue = parseInt(selOpt.value, 10);
    me.selectedFormat = selOpt.dataset.id;

    if(selectedFormatValue === -4) { // rubriken - välj första i listan
      me.formatSelector.selectedIndex = 4;
      selectedFormatValue = 0;
    }
    if(selectedFormatValue >= 0) {
      // -1 in width and height means original size
      if (me.formats[selectedFormatValue].width === -1 && me.formats[selectedFormatValue].height === -1) {
        me.lastEntered.w = me.file.width; // set width to original image width
        me.lastEntered.h = me.file.height; // set height to original image height
        var canvasData = me.cropper.getCanvasData();
        me.cropper.setAspectRatio(me.file.width / me.file.height);
        me.cropper.setCropBoxData({top:0, left:0, width:canvasData.width, height:canvasData.height});
      }// "Keep Ratio"?
      else if(this.isKeepRatioFormatSelected(me.formats[selectedFormatValue])) {
        this.handleKeepRatioFormat(me, me.formats[selectedFormatValue]);
      } else {
        me.lastEntered.w = me.formats[selectedFormatValue].width;
        me.lastEntered.h = me.formats[selectedFormatValue].height;
        me.lastEntered.direction = 'w';
        me.cropper.setAspectRatio(me.formats[selectedFormatValue].width / me.formats[selectedFormatValue].height);
      }

      me.widthInputRow.style.display = 'none';
      me.heightInputRow.style.display = 'none';
    } 
    else 
    {
      me.widthInputRow.style.display = '';
      me.heightInputRow.style.display = '';
      if (selectedFormatValue === -1) { // beskär fritt
        me.cropper.setAspectRatio(NaN);

        if (me.config?.defaults?.format === -1) {
          // (Very) special case when using defaults and format -1 ("Free crop")
          // As "setAspectRatio(NaN)" recalculates the cropper box, we need to do some math to match this.
          const canvasData = me.cropper.getCanvasData();
          // height/width
          const canvasHeightWidthRatio = canvasData.height / canvasData.width;
          const formatHeightWidthRation = me.config.defaults.height / me.config.defaults.width;

          // width/height
          const canvasWidthHeightRatio = canvasData.width / canvasData.height;
          const formatWidthHeightRation = me.config.defaults.width / me.config.defaults.height

          // NOTE: It does NOT work to set left and top at the same time as width and height to get this to work. Do not know why.
          if (canvasHeightWidthRatio > formatHeightWidthRation) {
            //const ratio = formatWidthHeightRation >= 1 ? (canvasHeightWidthRatio / formatHeightWidthRation) : (formatHeightWidthRation / canvasHeightWidthRatio);
            const ratio = (formatHeightWidthRation / canvasHeightWidthRatio);
            me.cropper.setCropBoxData({ /*left: cropBoxLeft, top: cropBoxTop,*/ width: canvasData.width, height: canvasData.height * ratio });
          }
          else if (canvasWidthHeightRatio > formatWidthHeightRation) {
            //const ratio = formatWidthHeightRation >= 1 ? (canvasWidthHeightRatio / formatWidthHeightRation) : (formatWidthHeightRation / canvasWidthHeightRatio);
            const ratio = (formatWidthHeightRation / canvasWidthHeightRatio);
            me.cropper.setCropBoxData({ /*left: cropBoxLeft, top: cropBoxTop,*/ width: canvasData.width * ratio, height: canvasData.height });
          }

          // Adjust cprop box position
          const cropBoxTop = canvasHeightWidthRatio > formatHeightWidthRation ?
            Math.floor((canvasData.height - (canvasData.width * formatHeightWidthRation)) / 2) : 0;

          const cropBoxLeft = canvasWidthHeightRatio > formatWidthHeightRation ?
            Math.floor(((canvasData.width - (canvasData.height * formatWidthHeightRation)) / 2)) : 0;

          me.cropper.setCropBoxData({ left: cropBoxLeft, top: cropBoxTop });
        }
      }
      else if (selectedFormatValue === -2) { // ange eget format
        me.cropper.setAspectRatio(me.lastEntered.w / me.lastEntered.h);
      }
      if (selectedFormatValue === -3) { // hela bilden
        me.lastEntered.w = me.file.width; // set width to original image width
        me.lastEntered.h = me.file.height; // set height to original image height
        var canvasData = me.cropper.getCanvasData();
        me.cropper.setAspectRatio(me.file.width / me.file.height);
        me.cropper.setCropBoxData({ /*top: 0, left: 0,*/ width: canvasData.width, height: canvasData.height });
      }
    }
  },
  clickDone: function(me) {
    var _this = this;

    if(me.isDownloading){
      return false;
    }
    
    if (me.config.forceAltText === true && me.config.setAltText !== false && me.altInput.value.length < 1) {
      me.altInput.reportValidity();
      return false;
    }

    if(me.config.showDoneButton !== false) {
      let btn;
      if (me.config.rootElement) {
        // If rootElement is set, use it to find the button. This is necessary when using the file selector in a web component.
        btn = me.config.rootElement.querySelector('#mf-btn-done');
      } else {
        btn = document.getElementById('mf-btn-done');
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
    var format = -1;
    if (me.selectedFormat > 0) {
      format = me.selectedFormat;
    }
    
    me.api.get('file/' + me.file.id + '/downloads/'+format, function(o){
      _this.doDownload(me, o);
    }, 
    function(o) {
      if(o.indexOf('403') >= 0) {
        alert(me.lang.translate('CROPPER_PERMISSION_DENIED'));
      } else {
        alert(me.lang.translate('CROPPER_DOWNLOAD_FAILED'));
      }
      me.isDownloading = false;
    });
    return true;
  },

  doDownload: function (me, o) {
    let downloadURL = o[0].downloadURL;
    let ww, hh;

    const altText = me.altInput.value;
    const description = me.fileDescription.value;
    const fileName = me.filenameInput.value;

    const selectedFormatValue = parseInt(me.formatSelector[me.formatSelector.selectedIndex].value, 10);
    const widthInput = me.widthInput.value;
    const heightInput = me.heightInput.value;

    if (selectedFormatValue >= -3) { // defaults + crop formats (from MF)
      // in the case where "downloadFormat": "original" - w/h is set to -1 => use original size
      if(me.config.downloadFormat === 'original'){
        ww = me.file.width;
        hh = me.file.height
      } // "KeepRatio"
      else if(this.isKeepRatioFormatSelected(me.formats[selectedFormatValue])) { // "Keep Ratio" format selected
        ww = widthInput;
        hh = heightInput;
      }
      else if (selectedFormatValue >= 0) { // crop formats defined in MF (or a 'fixed' format with id=0)
        ww = me.formats[selectedFormatValue].width;
        hh = me.formats[selectedFormatValue].height;
      }
      else if ([-1, -2, -3].includes(selectedFormatValue)) { // Default formats: -1: beskär fritt, -2: ange eget format, -3: använd hela bilden 
        ww = widthInput;
        hh = heightInput;
      }
      var canvasData = me.cropper.getCanvasData();
      var cropperData = me.cropper.getData();

      // cropper values inluded in url
      downloadURL += '&x1=' + Math.round(cropperData.x) + '&y1=' + Math.round(cropperData.y) +
        '&x2=' + Math.round(cropperData.x + cropperData.width) + '&y2=' + Math.round(cropperData.y + cropperData.height) +
        '&sw=' + canvasData.naturalWidth + '&sh=' + canvasData.naturalHeight + '&w=' + ww + '&h=' + hh + '&permalink=true&stretch=1';
    }
    else if ([-100, -101, -102].includes(selectedFormatValue)) { // -100: cover, -101: contain, -102: originalSize
      const fileWidth = me.file.width;
      const fileHeight = me.file.height;
      const fileAspectRatio = fileWidth / fileHeight

      const inputAspectRatio = widthInput / heightInput;

      if (selectedFormatValue == -100) {  // "cover"
        // The image, if larger than "container", will be shrunk down to cover the container
        let ratio = 1;
        if (widthInput < fileWidth || heightInput < fileHeight) {
          if (fileAspectRatio >= inputAspectRatio) {
            // ratio on height
            ratio = heightInput / fileHeight;
          }
          else {
            // ratio on width
            ratio = widthInput / fileWidth;
          }
        }
        ww = Math.round(fileWidth * ratio);
        hh = Math.round(fileHeight * ratio);
      }
      else if (selectedFormatValue == -101) {  // "contain"
        // The image, if larger than "container", will be shrunk down so that the container contains the image
        let ratio = 1;
        if (widthInput < fileWidth || heightInput < fileHeight) {
          if (fileAspectRatio >= inputAspectRatio) {
            // ratio on width
            ratio = widthInput / fileWidth;
          }
          else {
            // ratio on height
            ratio = heightInput / fileHeight;
          }
        }
        ww = Math.round(fileWidth * ratio);
        hh = Math.round(fileHeight * ratio);
      }
      else if (selectedFormatValue == -102) {  // "none" (i.e. original size)
        ww = fileWidth;
        hh = fileHeight;
      }
      // only width & height of interest for these two
      downloadURL += `&w=${ww}&h=${hh}&permalink=true&stretch=1`;
    }

    // Only if using any of the default formats - i.e. "Image size"
    if (selectedFormatValue < 0) {
      // defaults.imageDownloadFileType
      if (["jpg", "png", "webp"].includes(me.config?.defaults?.imageDownloadFileType?.toLowerCase() ?? "")) {
        downloadURL += `&format=${me.config.defaults.imageDownloadFileType.toLowerCase()}`;
      }
      // if using default "format" - use png/webp if file type is png/webp, else uses format file type
      else if (["png", "webp"].includes(me.file.type.extension)) {
        downloadURL += `&format=${me.file.type.extension}`;
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', downloadURL);
    xhr.onload = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            var o = JSON.parse(xhr.responseText);
            const fileType = o.url.split('.').pop();

            me.isDownloading = false;
            setTimeout(function () {
              const safeCanvasWidth = canvasData?.naturalWidth ?? me.file?.width ?? ww ?? null;
              const safeCanvasHeight = canvasData?.naturalHeight ?? me.file?.height ?? hh ?? null;
              const cropX = cropperData?.x ?? 0;
              const cropY = cropperData?.y ?? 0;
              const cropW = cropperData?.width ?? 0;
              const cropH = cropperData?.height ?? 0;
              let successObject = {
                id: me.file.id,
                folderId: me.selectedFolderId,
                url: o.url,
                name: me.file.name,
                filename: fileName + '.' + fileType,
                basetype: me.file.type.type,
                filetype: fileType,
                width: ww,
                height: hh,
                description: description,
                photographer: me.file.photographer,
                altText: altText,
                canvasWidth: safeCanvasWidth,
                canvasHeight: safeCanvasHeight,
                cropCoordinates: {
                  x1: cropX,
                  y1: cropY,
                  x2: cropX + cropW,
                  y2: cropY + cropH
                },
                cropWidth: cropW,
                cropHeight: cropH
              };
              if(me.config.useNavigationLink === true && me.navigationLink.value.trim().length > 0) {
                successObject.navigationLink = me.navigationLink.value.trim();
                successObject.navigationLinkTarget = me.navigationLinkTarget.checked ? "_blank" : "_self";
              }
              me.config.success(successObject);
            }, 5);
          } catch (e) {
            me.isDownloading = false;
            alert('ERR:doDownload, JSON');
          }
        } else {
          me.isDownloading = false;
          alert('ERR: doDownload, status: ' + xhr.status);
        }

        // Show "all done" message to user
        if(me.config.showDoneButtonWorkingFlow){
          var btn = document.getElementById('mf-btn-done');
          btn.classList.add('working-done');
          btn.classList.remove('working');
          btn.innerHTML = `<div><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                          </svg></div><div>${me.lang.translate('FILE_VIEW_FETCHING_DATA_DONE')}</div>`;
        }

      }
    };
    xhr.send(null);

  },
  getAiAltText: function(me, langCode){
    me.api.get('file/' + me.file.id + `/aialttext?lang=${langCode}`, function (aiAltText) {
      me.altInput.value = aiAltText.alttext ?? me.altInput.value;
    }, function (o) {
      console.error('Error: Failed to get AI Alt text');
    });
  },
  validateURL: function(inputElement) {
    const regex = /^(?:$|https?:\/\/[-\w@:%._\+~#=]{1,256}(?:\.[a-zA-Z0-9()]{2,6})?(?:\/[-\w@:%_\+.~#?&\/=]*)?)$/;
    const urlToBeTested = inputElement.value.trim();
    if(regex.test(urlToBeTested) === false) {
      inputElement.setCustomValidity('Invalid input!');
    }else{ 
      inputElement.setCustomValidity('');
    }
  },
  resetValidateURL: function(inputElement) {
    inputElement.setCustomValidity('');
  },
  isKeepRatioFormatSelected: function(selectedFormat) {
    // width or height must also be 0, else not valid
    return (selectedFormat?.keepRatio && (selectedFormat.width === 0 || selectedFormat.height === 0)) ?? false;
  },
  handleKeepRatioFormat: function(me, selectedFormat) {
    // "KeepRatio" and one of the dimensions is 0 - we need to calculate it based on the image's aspect ratio
    const imagerAspectRatio = me.file.width / me.file.height;
    if (selectedFormat.width === 0) {
      me.lastEntered.w = Math.round(selectedFormat.height * imagerAspectRatio);
      me.lastEntered.h = selectedFormat.height;
    } else {
      me.lastEntered.w = selectedFormat.width;
      me.lastEntered.h = Math.round(selectedFormat.width / imagerAspectRatio);
    }

    me.widthInput.value = me.lastEntered.w;
    me.heightInput.value = me.lastEntered.h;
    me.cropper?.setAspectRatio(imagerAspectRatio);
    me.cropper?.disable();
  }
};
