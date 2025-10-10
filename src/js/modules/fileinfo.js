/* Mediaflow File Selector */

import {getTranslation as translate} from "./../services/translations";

export default {
  me:{},
  init: function(me, clickCallback) {
    this.clickCallback = clickCallback;
    this.me = me;
  },
  showInfo: function(me, idx) {
    var _this = this;

    me.api.get('file/' + me.files[idx].id + '?fields=any&locale=' + me.lang.locale(), function (o) {
      me.file = o[0];

      me.api.get('file/' + me.files[idx].id + '/checkpermissions', function (permissions) {
        me.file.permissions = permissions[0];

        me.api.get('file/' + me.files[idx].id + '/usage?fields=any', function (usage) {
          me.file.usage = usage;
          
          me.api.get('file/' + me.files[idx].id + '/license?fields=rightsExists,rightsInformation,licenseInformation,downloadWarning,lockFile,useFrom,useTo', function (licenses) {
            me.file.license = licenses[0];
          
            me.api.get('file/' + me.files[idx].id + '/aialttext?check=1', function (aiAltText) {
              me.file.aiAltTextCanBeUsed = (aiAltText.validFiletype && aiAltText.processed);
              _this.showFileInfo(me, _this);
            }, function (o) {
              console.error('Error: Failed to get AI Alt text check data');
              _this.showFileInfo(me, _this); // Failsafe to show file info even if "aialttext" enpoint does not exist
            });
          
          }, function (o) {
            console.error('Error: Failed to get license data');
            _this.showFileInfo(me, _this); // Failsafe to show file info even if "license" enpoint does not exist
          });
        
        }, function (o) {
          me.file.usage = [];
          console.error('Error: Failed to get file usage data');
        });
      
      }, function (o) {
        console.error('Error: Failed to get permissions data');
      });

    }, function (o) {
      console.error('Error: Failed to get file data');
    })
  },
  showFileInfo: function(me, _this) {
    var canDownload = true;
    me.fileinfoArea.innerHTML = '';
      /* previewbox */
      var div1 = document.createElement('div');
      div1.classList.add('mf-preview-box');

      if(me.file.type.type !== 'video') {
        if(me.file.mediumPreview){
          div1.style.backgroundImage = 'url(' + me.file.mediumPreview + ')';
        } else if(me.file.type.type == 'sound'){
          div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-651-dark.svg)';
          div1.style.backgroundSize = '80%';
          div1.classList.add('mf-file-icon');
        } else if(me.file.type.type == 'file' && me.file.type.extension == 'srt'){
          div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-592-dark.svg)';
          div1.style.backgroundSize = '80%';
          div1.classList.add('mf-file-icon');
        }
      }
      else {
        div1.classList.add("mf-file-video");
        var iframe = document.createElement('iframe');
        iframe.id = 'videoIframe';
        iframe.setAttribute('allowfullscreen','true');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.src = 'https://play.mediaflow.com/ovp/5/' + me.file.mediaId;
        if (me.config.apiBase.includes('tech') || me.config.apiBase.includes('localhost')) {
          iframe.src = 'https://play.mediaflow.tech/ovp/7/' + me.file.mediaId;
        }
        if (me.config.apiBase.includes('build')) {
          iframe.src = 'https://play.mediaflow.build/ovp/8/' + me.file.mediaId;
        }
        div1.appendChild(iframe);      
      }

      let previewImgBoxWrapper = Object.assign(document.createElement("div"),{
        className: `${me.file.alpha ? "mf-file-alpha" : "mf-file-no-alpha"}`
      });

      previewImgBoxWrapper.appendChild(div1);
      me.fileinfoArea.appendChild(previewImgBoxWrapper);

      var fileInfoWrapper = document.createElement('div');
      fileInfoWrapper.className = 'mf-file-info-wrapper';
      
      var tabsContainer = document.createElement('div');
      tabsContainer.className = 'mf-tabs-container';
      /* tabs */
      var tabInfo = document.createElement('button');
      tabInfo.className = 'mf-tab active';
      tabInfo.innerText = me.lang.translate('FILE_INFO_TAB');
      tabInfo.onclick = function() {
        var tabActive = document.querySelector('.mf-tabs-container .mf-tab.active');
        if(tabActive) {
          tabActive.classList.remove('active');
        }
        tabInfo.classList.add('active');
        me.fileinfoArea.querySelector('.mf-fileinfo').classList.remove("hidden");
        me.fileinfoArea.querySelector('.mf-fileusage').classList.add("hidden");
      }

      tabsContainer.appendChild(tabInfo);

      var tabUsage = document.createElement('button');
      tabUsage.className = 'mf-tab';
      tabUsage.innerText = me.lang.translate('FILEUSAGE_TAB');
      tabUsage.onclick = function() {
        var tabActive = document.querySelector('.mf-tabs-container .mf-tab.active');
        if(tabActive) {
          tabActive.classList.remove('active');
        }
        tabUsage.classList.add('active');
        me.fileinfoArea.querySelector('.mf-fileinfo').classList.add("hidden");
        me.fileinfoArea.querySelector('.mf-fileusage').classList.remove("hidden");
      }

      tabsContainer.appendChild(tabUsage);

      fileInfoWrapper.appendChild(tabsContainer);
         
    /* insert button + background */
//    if((me.config === undefined || me.config.noCropButton === undefined || me.config.noCropButton === false) && me.config.showDoneButton !== false) {
    if(me.config === undefined || me.config.noCropButton === undefined || me.config.noCropButton === false) {
      var divBtnBG = document.createElement('div');
      divBtnBG.style.width = '100%';
      
      divBtnBG.style.height = '38px';
      divBtnBG.style.display = 'inline-block';    
      divBtnBG.className = 'mf-btn-bg mf-use-btn';
      
      //divBtnBG.style.backgroundColor = '#5f5f5f';
      var divBtn = document.createElement('div');
      divBtn.id = 'mf-use-btn';
      divBtn.className = 'mf-btn';
      divBtn.innerText = me.lang.translate('USE_THIS_FILE');
      divBtn.addEventListener('click', function(e) {
        if(!divBtn.getAttribute('disabled')){
          _this.btnClick(me, e, this, _this);
        }
      }, true);
      divBtnBG.appendChild(divBtn);
      fileInfoWrapper.appendChild(divBtnBG);
    }

    /* file info contents */

    let fileInfoData = "";

    let alertIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-diamond" viewBox="0 0 16 16">
          <path d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.482 1.482 0 0 1 0-2.098L6.95.435zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>`;

    let warningIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
          <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
          <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
        </svg>`;

    //#region Warnings
    // Rights
    if (me.file.rights != undefined && me.config.ignorePermissionChecks !== true) {
      if (me.file.rights.rightsType != undefined && me.file.rights.rightsType.toUpperCase() === 'NO') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_INFO_NO_RIGHTS')}</div>`;
        canDownload = false;
      }
    }
    // GDPR
    if (me.file.gdprStatus != undefined && me.config.ignorePermissionChecks !== true) {
      var s = me.file.gdprStatus.toUpperCase();
      if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_VIEW_GDPR_WARNING')}</div>`;
        canDownload = false;
      }
    }
    if (me.file.gdprType != undefined) {
      var s = me.file.gdprType.toUpperCase();
      if (s == 'UNKNOWN') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_VIEW_GDPR_NOT_ASSIGNED')}</div>`;
      }
    }
    // Permissions
    if (me.file.permissions.allowDownload == false && me.config.ignorePermissionChecks !== true) {
      if (me.file.permissions.allowDownloadReason == 'MARKING_DENIED') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_INFO_DOWNLOAD_NOT_ALLOWED_MARKING')}</div>`;
      } else if (me.file.permissions.allowDownloadReason == 'LICENCE_RIGHTS') {
        // this is already handled above
      } else if (me.file.permissions.allowDownloadReason == 'FILE_DENIED') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_INFO_DOWNLOAD_NOT_ALLOWED_FILE')}</div>`;
      } else if (me.file.permissions.allowDownloadReason == 'FOLDER_DENIED') {
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('FILE_INFO_DOWNLOAD_NOT_ALLOWED_FOLDER')}</div>`;
      } else if (me.file.permissions.allowDownloadReason == 'DATE_DENIED') {
        var dateText = me.lang.translate('FILE_INFO_DOWNLOAD_NOT_ALLOWED_DATE');
        if (me.file.rights.useTom) {
          dateText += ' ' + me.file.rights.useTom;
        }
        fileInfoData += `<div class="mf-alert">${alertIcon}${dateText}</div>`;
      }
      canDownload = false;
    }
    // Permissions - lock warning
    if(me.file.permissions?.lockWarningMessage != "" && me.config.ignorePermissionChecks !== true){
      const warn = me.file.permissions.warnFrom === "" ? false : new Date() > new Date(me.file.permissions.warnFrom);
      
      // Check expired first
      if(warn && me.file.permissions.lockWarningMessage.startsWith("RIGHTS_EXPIRED")){
        fileInfoData += `<div class="mf-alert">${alertIcon}${me.lang.translate('LICENSE_HAS_EXPIRED')}</div>`;
      }
      // then expire (starts with order)
      else if(warn && me.file.permissions.lockWarningMessage.startsWith("RIGHTS_EXPIRE")){
        fileInfoData += `<div class="mf-warning">${warningIcon}${me.lang.translate('LICENSE_WILL_EXPIRE')}</div>`;
      }
    }
    //#endregion
    
    fileInfoData += `<label>${translate("fileInfo", "fileName")}</label><div>${_this.escapeHtml(me.file.filename)}</div>`;
    if (me.file.name?.length > 0) {
      fileInfoData += `<label>${translate("fileInfo", "name")}</label><div>${_this.escapeHtml(me.file.name)}</div>`;
    }
    if (me.file.description?.length > 0) {
      fileInfoData += `<label>${me.lang.translate('FILE_INFO_DESC')}</label><div>${_this.escapeHtml(me.file.description)}</div>`;
    }
    fileInfoData += `<div class="devider"></div>`;
    fileInfoData += `<label>${me.lang.translate('FILE_INFO_FILE_SIZE')}</label><div>${me.lang.humanFileSize(me.file.filesize)}</div>`;
    
    if(me.file.type.type === "image" && me.file.width && me.file.height){
      fileInfoData += `<label>${me.lang.translate('FILE_INFO_FILE_DIMENSIONS')}</label><div>${me.file.width} × ${me.file.height} px</div>`;
    }
    
    fileInfoData += `<label>${me.lang.translate('FILE_INFO_FILE_TYPE')}</label><div>${me.file.type.description}</div>`;
    fileInfoData += `<label>${me.lang.translate('FILE_INFO_UPLOADED')}</label><div>${_this.escapeHtml(me.lang.formatLongDate(me.file.uploaded))}</div>`;

    if(me.file?.rating > 0 ?? false){
      fileInfoData += `<label>${me.lang.translate('FILE_INFO_RATING')}</label>
        <div class="mf-file-rating">
          <span class="${me.file.rating > 0 ? 'mf-selected' : ''}"></span>
          <span class="${me.file.rating > 1 ? 'mf-selected' : ''}"></span>
          <span class="${me.file.rating > 2 ? 'mf-selected' : ''}"></span>
          <span class="${me.file.rating > 3 ? 'mf-selected' : ''}"></span>
          <span class="${me.file.rating > 4 ? 'mf-selected' : ''}"></span>
        </div>
      `;
    }

    if (me.file.mark) {
      var className = 'mf-mark mf-mark-' + me.file.mark;
      var marking = me.markings.filter(function (m) { return m.mark == me.file.mark })[0];
      var markName = (marking == undefined) ? me.lang.translate('FILE_VIEW_MARKING_' + me.file.mark) : marking.name;
      fileInfoData += `<label>${me.lang.translate('FILE_VIEW_MARKING')}</label>
      <div class="mf-mark-wrapper">
        <span class="${className}"></span>
        <span class="mf-mark-name">${markName}</span>
      </div>`;
    } 

    if (me.file.photographer?.length > 0) {
      fileInfoData += `<label>${me.lang.translate('FILE_INFO_PHOTOGRAPHER')}</label><div>${_this.escapeHtml(me.file.photographer)}</div>`;
    }
    if (me.file.instructions?.length > 0) {
      fileInfoData += `<div class="devider"></div>`;
      fileInfoData += `<label class="instructions">${me.lang.translate('FILE_INFO_INSTRUCTIONS')}</label><div class="instructions">${_this.escapeHtml(me.file.instructions)}</div>`;
    }

    if (me.file.customFields != undefined) {
      for (var i = 0; i < me.file.customFields.length; i++) {
        if (me.file.customFields[i].value != "" && me.file.customFields[i].value != null)
          fileInfoData += `<label>${me.file.customFields[i].field}</label><div>${me.file.customFields[i].value}</div>`;
      }
    }

    //#region License
    if (me.file.license?.rightsExists > 0 ?? false) {
      fileInfoData += `<div class="devider"></div>`;

      fileInfoData += `<label>${me.lang.translate('LICENSE_RIGHTS')}</label><div>${me.lang.translate('LICENSE_RIGHTS_'+me.file.license.rightsExists)}</div>`;
      // CCL
      if (me.file.license.rightsExists === 5) {
        let licenseTypeText = "";
        if(me.file.license.rightsInformation.indexOf("CC") === 0) {
          const licType = me.file.license.rightsInformation.replace(" ", "_").replace(/-/g, "_"); // /g => replace all
          licenseTypeText = me.lang.translate(licType);
        }
        else if(me.file.license.rightsInformation === "0"){
          licenseTypeText = me.lang.translate("LICENSE_RIGHTS_0");
        }
        fileInfoData += `<label>${me.lang.translate('LICENSE_TYPE')}</label><div class="mf-license-cc-type">${licenseTypeText}</div>`;
      }
      // Normal info
      if (me.file.license.rightsInformation?.length > 0 && me.file.license.rightsExists !== 5) {
        fileInfoData += `<label>${me.lang.translate('INFORMATION')}</label><div>${me.file.license.rightsInformation}</div>`;
      }
      // Limited rights
      if (me.file.license.rightsExists === 2) {
        if(me.file.license?.useFrom != null){
          fileInfoData += `<label>${me.lang.translate('VALID_TO')}</label><div>${me.file.license.useFrom ?? ""} ${me.lang.translate('TO')} ${me.file.license.useTo ?? ""}</div>`;
        }
        else if(me.file.license?.useTo !=  null){
          fileInfoData += `<label>${me.lang.translate('VALID_TO')}</label><div>${me.file.license.useTo ?? ""}</div>`;
        }
      }
    }
    //#endregion

    /* file info */
    var fileInfo = document.createElement('div');
    fileInfo.className = 'mf-fileinfo';
    fileInfo.insertAdjacentHTML("afterbegin", fileInfoData);
    fileInfoWrapper.appendChild(fileInfo);

    /* file usage */
    var fileUsage = document.createElement('div');
    fileUsage.classList.add("mf-fileusage", "hidden");

    let fileUsageData = "";
    for (var i = 0; i < me.file.usage.length; i++) {
      let fileUsageWrapper = document.createElement('div');
      fileUsageWrapper.classList.add("mf-fileusage-wrapper");
      fileUsageData = "";
      fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_RESPONSIBLE')}</label><div>${me.file.usage[i].contact}</div>`;
      fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_PROJECT')}</label><div>${me.file.usage[i].project}</div>`;

      if(me.file.usage[i].publishDate) {
        if(!isNaN(Date.parse(me.file.usage[i].publishDate))) {
          fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_TIME')}</label><div>${me.lang.formatShortDate(me.file.usage[i].publishDate)}</div>`;
        } else {
          fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_TIME')}</label><div>${me.file.usage[i].publishDate}</div>`;
        }
      }

      if(me.file.usage[i].type == 'WEB') {
        if (me.file.usage[i].url) {
          var link = me.file.usage[i].url;
          if(link.indexOf('http') != 0) {
            link = 'http://'+link;
          }
          fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_USAGE')}</label><div>${me.file.usage[i].type} - <a href="${link}" target="_blank">${me.file.usage[i].url}</a></div>`;
        } else {
          fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_USAGE')}</label><div>${me.file.usage[i].type}</div>`;
        }
      } else {
        fileUsageData += `<label>${me.lang.translate('FILE_INFO_USAGE_USAGE')}</label><div>${me.file.usage[i].type}</div>`;
      }

      const reportString = `${me.lang.translate('FILE_INFO_USAGE_REPORTED_ON')} ${me.lang.formatLongDate(me.file.usage[i].created)} ${me.lang.translate('BY')} ${me.file.usage[i].createdBy.name}`;
      fileUsageData += `<div class="full-width">${reportString}</div>`;
      fileUsageData += `<div class="devider"></div>`;
      fileUsageWrapper.insertAdjacentHTML("afterbegin", fileUsageData);
      fileUsage.appendChild(fileUsageWrapper);
    }
    
    if(me.file.usage.length == 0) {
      let fileUsageWrapper = document.createElement('div');
      fileUsageWrapper.classList.add("mf-fileusage-wrapper");
      const empty = `<div class="full-width">${me.lang.translate('FILE_INFO_USAGE_EMPTY')}</div>`;
      fileUsageWrapper.insertAdjacentHTML("afterbegin", empty);
      fileUsage.appendChild(fileUsageWrapper);
    }
    
    fileInfoWrapper.appendChild(fileUsage);

    me.fileinfoArea.appendChild(fileInfoWrapper);

    if(!canDownload) {
      //set disabled attribute
      if(document.getElementById('mf-use-btn')){
        document.getElementById('mf-use-btn').setAttribute('disabled', 'disabled');
      }
    }
  },
  btnClick(me, e, _elem, _this) {
    _this.clickCallback(me);

    if(me.file.type.type === 'video') {
      // Pause video if playing
      document.querySelector('#videoIframe').contentWindow.postMessage({context: 'mediaflowplayer', event :'pausevideo'}, "*");
    }
  },  
  escapeHtml: function(str) {
    var entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  }  
};

