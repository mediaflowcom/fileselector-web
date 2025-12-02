/* Mediaflow File Selector */
var fileNameComparer = function (a, b) {
  if (a.filename > b.filename)
    return 1;
  else
    return -1;
};

var fileSizeComparer = function (a, b) {
  if (a.filesize > b.filesize)
    return 1;
  else
    return -1;
};

var markComparer = function (a, b) {
  if (a.mark > b.mark)
    return 1;
  else
    return -1;
};

var dateComparer = function (a, b) {
  var d1 = new Date(a.uploaded);
  var d2 = new Date(b.uploaded);
  if (d1.getTime() > d2.getTime())
    return 1;
  else
    return -1;
};

var fileNameComparer2 = function (a, b) {
  if (a.filename <= b.filename)
    return 1;
  else
    return -1;
};

var fileSizeComparer2 = function (a, b) {
  if (a.filesize <= b.filesize)
    return 1;
  else
    return -1;
};

var markComparer2 = function (a, b) {
  if (a.mark <= b.mark)
    return 1;
  else
    return -1;
};

var dateComparer2 = function (a, b) {
  var d1 = new Date(a.uploaded);
  var d2 = new Date(b.uploaded);
  if (d1.getTime() <= d2.getTime())
    return 1;
  else
    return -1;
};

export default {
  me: {},
  init: function (me, clickCallback) {
    this.clickCallback = clickCallback;
    this.me = me;
    me.sort = 1;
    me.sortdir = true;
    me.previewSize = 1;
    if (me.config.disableLocalStorage !== true) {
      if (window.localStorage) {
        if (localStorage.getItem) {
          if (localStorage.getItem("MF.previewSize"))
            me.previewSize = parseInt(localStorage.getItem("MF.previewSize"), 10);
        }
        if (me.previewSize !== 0 && me.previewSize !== 1)
          me.previewSize = 1;
      }
    }
    var d = document.createElement('div');
    d.className = 'mf-initmessage';
    d.innerText = me.lang.translate('FILE_VIEW_START');
    me.fileviewArea.appendChild(d);
  },

  showFolder: function (me, idx, selectedFile) {
    var _this = this;
    me.selectedFileId = -1;
    me.selectedFolderId = me.folders[idx].id;
    me.api.get('folder/' + me.folders[idx].id + '/files?fields=id,name,filename,filesize,type,mediumPreview,smallPreview,thumbPreview,mark,uploaded,uploadedby,gdprstatus,gdprtype,mediaid,alttext,alpha',
      function (o) {
        me.files = _this.filterFiles(me, o);
        _this.showFiles(me, _this, false, selectedFile);
        if (selectedFile) {
          _this.setInitialFile(me, selectedFile, _this);
        }
      },
      function (o) { console.error('Error: Failed to get folder data'); })
  },

  showSearchResults: function (me, searchtxt, includeAiSearch) {
    var _this = this;
    me.item.dataset.activeView = "files"; //set activeView to files for mobile view
    me.selectedFileId = -1;
    me.searchquery = searchtxt;

    var lang = me.lang.locale().replace('_', '-');

    // Fallback to english if language is not supported
    if (lang !== 'sv-SE' && lang !== 'en-GB' && lang !== 'fi-FI' && lang !== 'nb-NO' && lang !== 'de-DE') {
      lang = 'en-GB';
    }

    const postData = {
      searchTerm: searchtxt,
      lang: lang,
      ai: includeAiSearch
    };
    me.api.post('search/file?fields=id,name,filename,filesize,type,mediumPreview,smallPreview,thumbPreview,mark,uploaded,uploadedby,gdprstatus,gdprtype,mediaid,alttext',
      postData,
      function (o) { me.files = _this.filterFiles(me, o); _this.showFiles(me, _this, true, null) },
      function (o) { console.error('Error: Failed to get search result data'); })
  },

  sortFiles: function (me, filelist) {
    var sortFunc = fileNameComparer;
    switch (me.sort) {
      case 1:
        if (me.sortdir)
          return filelist.sort(fileNameComparer);
        else
          return filelist.sort(fileNameComparer2);
        break;
      case 2:
        if (me.sortdir)
          return filelist.sort(fileSizeComparer);
        else
          return filelist.sort(fileSizeComparer2);
        break;
      case 3:
        if (me.sortdir)
          return filelist.sort(markComparer);
        else
          return filelist.sort(markComparer2);
        break;
      case 4:
        if (me.sortdir)
          return filelist.sort(dateComparer);
        else
          return filelist.sort(dateComparer2);
    }
  },

  filterFiles: function (me, filelist) {
    var i, l, isValid;
    var returnAll = false, gdprSafe = false;
    if (typeof (me.config.limitFileType) !== 'string' || me.config.limitFileType === '') {
      me.config.limitFileType = '';
      returnAll = true;
    }
    var sCheck = ',' + me.config.limitFileType.toLowerCase() + ',';
    var f = [];
    l = filelist.length;
    for (i = 0; i < l; i++) {
      isValid = true;
      if (returnAll == false) {
        if (sCheck.indexOf(filelist[i].type.type) < 0 && sCheck.indexOf(filelist[i].type.extension.toLowerCase()) < 0) {
          isValid = false;
        }

      }
      if (isValid == true && me.config.hideUnsafeGDPR === true) {
        var s = filelist[i].gdprStatus;
        if (s && s.length > 0)
          isValid = !(s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT');
      }
      if (isValid == true && me.config.hideUnassignedGDPR === true) {
        var s = filelist[i].gdprType;
        if (s && s.length > 0)
          isValid = s != 'UNKNOWN';
      }

      if (isValid)
        f.push(filelist[i]);
    }
    return f;
  },

  changeSort: function (me, _this, sort) {
    if (me.sort != sort)
      me.sort = sort;
    else me.sortdir = !me.sortdir;
    _this.showFiles(me, _this);
  },

  initLazyLoading: function () {
    const rootElement = this.me.config.rootElement || document;
    const lazyLoadDivs = rootElement.querySelectorAll('.lazy-load-background');
    const scrollContainer = rootElement.querySelector('.mf-files-box');

    const lazyLoad = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const div = entry.target;
          const bgImage = div.getAttribute('data-background-src');
          div.style.backgroundImage = `url(${bgImage})`;
          observer.unobserve(div);
        }
      });
    };

    const observer = new IntersectionObserver(lazyLoad, {
      root: scrollContainer,
      rootMargin: '0px',
      threshold: 0
    });

    lazyLoadDivs.forEach(div => {
      observer.observe(div);
    });
  },

  showFiles: function (me, _this, isSearch) {
    var warndiv = document.createElement('div');
    warndiv.className = 'mf-gdpr-warning';
    warndiv.title = me.lang.translate('FILE_VIEW_GDPR_WARNING');
    warndiv.style.position = 'absolute';
    warndiv.style.height = "16px";
    warndiv.style.width = "16px";
    warndiv.style.backgroundColor = '#EF60A3';
    warndiv.style.color = 'white';
    warndiv.style.fontFamily = 'Arial, Helvetica sans-serif';
    warndiv.style.fontSize = '14px';
    warndiv.style.lineHeight = '16px';
    warndiv.style.fontWeight = 'bold';
    warndiv.innerText = '!';
    warndiv.style.textAlign = 'center';
    warndiv.style.borderRadius = '50%';
    me.fileviewArea.innerHTML = '';
    me.fileinfoArea.innerHTML = '';

    me.files = _this.sortFiles(me, me.files);

    var smallWindow = false;
    // if(me.fileviewArea.clientWidth <= 500)
    //   smallWindow = true;

    var filesbox = document.createElement('div');
    filesbox.classList.add('mf-files-box');
    if (me.previewSize === 0) {
      filesbox.classList.add('smallicons');
    }
    else if (me.previewSize === 2) {
      filesbox.classList.add('list-view');
    }

    filesbox.style.position = 'absolute';
    filesbox.style.top = '40px';
    filesbox.style.bottom = '0';
    filesbox.style.left = '0';
    filesbox.style.right = '0';
    filesbox.style.overflow = 'auto';
    var i, le = me.files.length, div1, div2, col1, col2, col3, col4, row, markDiv;
    if (me.previewSize === 2) {
      var header = document.createElement('div');
      header.className = 'mf-header';
      if (me.sortdir)
        header.classList.add('mf-reversed');

      header.style.cursor = 'pointer';
      header.style.padding = '7px';

      row = document.createElement('div');
      row.className = 'mf-row';
      col1 = document.createElement('div');
      col1.style.flex = '3 1 100px';
      if (me.sort == 1)
        col1.className = 'mf-col mf-filename mf-active';
      else
        col1.className = 'mf-col mf-filename';
      col1.style.overflowX = 'hidden';
      col1.style.textOverflow = 'ellipsis';
      col1.style.whiteSpace = 'nowrap';
      col1.innerText = me.lang.translate('FILE_INFO_FILE_NAME');
      col1.addEventListener('click', function (e) { _this.changeSort(me, _this, 1); }, false);

      row.appendChild(col1);

      col2 = document.createElement('div');
      col2.style.textAlign = 'right';
      col2.style.flexBasis = '100px';
      if (me.sort == 2)
        col2.className = 'mf-col mf-filesize mf-active';
      else
        col2.className = 'mf-col mf-filesize';
      col2.innerText = me.lang.translate('FILE_INFO_FILE_SIZE');
      col2.addEventListener('click', function (e) { _this.changeSort(me, _this, 2); }, false);

      row.appendChild(col2);

      col3 = document.createElement('div');
      col3.style.flexBasis = '100px';

      if (me.sort == 3)
        col3.className = 'mf-col mf-active';
      else
        col3.className = 'mf-col';

      col3.innerText = me.lang.translate('FILE_VIEW_MARKING');
      col3.addEventListener('click', function (e) { _this.changeSort(me, _this, 3); }, false);
      row.appendChild(col3);

      col4 = document.createElement('div');
      col4.style.flexBasis = '100px';
      if (me.sort == 4)
        col4.className = 'mf-col mf-date mf-active';
      else
        col4.className = 'mf-col mf-date';

      col4.innerText = me.lang.translate('FILE_INFO_UPLOADED');
      col4.addEventListener('click', function (e) { _this.changeSort(me, _this, 4); }, false);
      if (me.sort == 4)
        col4.classList.add('mf-active');
      row.appendChild(col4);

      header.appendChild(row);
      filesbox.appendChild(header);


      for (i = 0; i < le; i++) {
        me.files[i].elem = document.createElement('div');
        me.files[i].elem.dataset.idx = i;
        me.files[i].elem.className = 'mf-file';
        me.files[i].elem.style.padding = '5px';
        me.files[i].elem.style.position = 'relative';
        me.files[i].elem.style.cursor = 'pointer';

        me.files[i].elem.addEventListener('click', function (e) { _this.fileClick(me, e, this, _this, isSearch); }, false);
        if (me.files[i].gdprStatus != undefined) {
          var s = me.files[i].gdprStatus.toUpperCase();
          if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
            //me.files[i].elem.innerHTML += warndiv.outerHTML;
          }
        }

        row = document.createElement('div');
        row.className = 'mf-row';
        col1 = document.createElement('div');
        col1.style.flex = '3 1 100px';
        col1.className = 'mf-col col-filename';
        col1.style.overflowX = 'hidden';
        col1.style.textOverflow = 'ellipsis';
        col1.style.whiteSpace = 'nowrap';
        col1.innerText = me.files[i].filename;

        row.appendChild(col1);

        col2 = document.createElement('div');
        col2.style.flexBasis = '100px';
        col2.style.textAlign = 'right';
        col2.className = 'mf-col col-filesize';
        col2.innerText = me.lang.humanFileSize(me.files[i].filesize);
        row.appendChild(col2);

        col3 = document.createElement('div');
        col3.style.flexBasis = '100px';
        col3.className = 'mf-col col-mark';

        markDiv = document.createElement('div');
        markDiv.style.width = '10px';
        markDiv.style.height = '10px';
        markDiv.style.display = 'inline-block';
        markDiv.className = 'mf-mark mf-mark-' + me.files[i].mark;

        col3.appendChild(markDiv);
        row.appendChild(col3);

        col4 = document.createElement('div');
        col4.style.flexBasis = '100px';
        col4.className = 'mf-col col-date';
        col4.innerText = me.files[i].uploaded.substring(0, 10);
        if (me.files[i].gdprStatus != undefined) {
          var s = me.files[i].gdprStatus.toUpperCase();
          if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
            warndiv.style.position = '';
            warndiv.style.float = 'right';
            col4.innerHTML += warndiv.outerHTML;
          }
        }
        row.appendChild(col4);

        me.files[i].elem.appendChild(row);

        filesbox.appendChild(me.files[i].elem);
      }
    }
    else {
      if (me.previewSize === 0 || smallWindow) {
        for (i = 0; i < le; i++) {
          me.files[i].elem = document.createElement('div');
          me.files[i].elem.title = me.files[i].name;
          me.files[i].elem.className = 'mf-file';
          me.files[i].elem.dataset.idx = i;
          if (me.files[i].gdprStatus != undefined) {
            var s = me.files[i].gdprStatus.toUpperCase();
            if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
              me.files[i].elem.innerHTML += warndiv.outerHTML;
            }
          }
          div1 = Object.assign(document.createElement('div'), { className: "mf-img" });
          if (me.files[i].smallPreview) {
            // Lazy loading
            div1.classList.add("lazy-load-background");
            div1.setAttribute("data-background-src", me.files[i].smallPreview);

            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
          } else if (me.files[i].type.type == 'sound') {
            div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-651-dark.svg)';
            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
            div1.style.backgroundSize = '80%';
            div1.classList.add('mf-file-icon');
          } else if (me.files[i].type.type == 'file' && me.files[i].type.extension == 'srt') {
            div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-592-dark.svg)';
            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
            div1.style.backgroundSize = '80%';
            div1.classList.add('mf-file-icon');
          }
          //#region file type
          if (me.files[i]?.type?.extension != null) {
            let spanFileType = document.createElement('span');
            spanFileType.className = "mf-file-type";
            spanFileType.innerText = me.files[i]?.type?.extension;
            me.files[i].elem.appendChild(spanFileType);
          }
          //#endregion
          //#region video file type
          if (me.files[i]?.type?.type === 'video') {
            let spanVideoFileType = document.createElement('span');
            spanVideoFileType.className = "mf-file-type_video";
            spanVideoFileType.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path>
                                            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"></path>
                                          </svg>`;
            me.files[i].elem.appendChild(spanVideoFileType);
          }
          //#endregion

          const imgWrapper = Object.assign(document.createElement("div"), {
            className: `mf-img-wrapper ${me.files[i].alpha ? "mf-file-alpha" : ""}`
          });

          imgWrapper.appendChild(div1)

          me.files[i].elem.appendChild(imgWrapper);

          let divLbl = document.createElement('div');
          divLbl.className = 'mf-lbl';

          const markDiv = Object.assign(document.createElement("span"), {
            className: 'mf-mark mf-mark-' + me.files[i].mark
          });
          divLbl.appendChild(markDiv);

          divLbl.appendChild(Object.assign(document.createElement("span"), {
            innerText: me.files[i].name,
            className: "mf-img-name"
          }));
          divLbl.appendChild(Object.assign(document.createElement("span"))); // dummy
          me.files[i].elem.appendChild(divLbl);

          me.files[i].elem.addEventListener('click', function (e) { _this.fileClick(me, e, this, _this, isSearch); }, false);
          filesbox.appendChild(me.files[i].elem);
        }
      } else {
        for (i = 0; i < le; i++) {
          me.files[i].elem = document.createElement('div');
          me.files[i].elem.title = me.files[i].name;
          me.files[i].elem.className = 'mf-file';
          me.files[i].elem.dataset.idx = i;
          if (me.files[i].gdprStatus != undefined) {
            var s = me.files[i].gdprStatus.toUpperCase();
            if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
              me.files[i].elem.innerHTML += warndiv.outerHTML;
            }
          }
          div1 = Object.assign(document.createElement('div'), { className: "mf-img" });

          if (me.files[i].mediumPreview) {
            // Lazy loading
            div1.classList.add("lazy-load-background");
            div1.setAttribute("data-background-src", me.files[i].mediumPreview);

            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
          } else if (me.files[i].type.type == 'sound') {
            div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-651-dark.svg)';
            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
            div1.style.backgroundSize = '80%';
            div1.classList.add('mf-file-icon');
          } else if (me.files[i].type.type == 'file' && me.files[i].type.extension == 'srt') {
            div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-592-dark.svg)';
            div1.style.backgroundRepeat = 'no-repeat';
            div1.style.backgroundPosition = 'center';
            div1.style.backgroundSize = '80%';
            div1.classList.add('mf-file-icon');
          }
          //#region file type
          if (me.files[i]?.type?.extension != null) {
            let spanFileType = document.createElement('span');
            spanFileType.className = "mf-file-type";
            spanFileType.innerText = me.files[i]?.type?.extension;
            me.files[i].elem.appendChild(spanFileType);
          }
          //#endregion
          //#region video file type
          if (me.files[i]?.type?.type === 'video') {
            let spanVideoFileType = document.createElement('span');
            spanVideoFileType.className = "mf-file-type_video";
            spanVideoFileType.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path>
                                            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"></path>
                                          </svg>`;
            me.files[i].elem.appendChild(spanVideoFileType);
          }
          //#endregion

          const imgWrapper = Object.assign(document.createElement("div"), {
            className: `mf-img-wrapper ${me.files[i].alpha ? "mf-file-alpha" : ""}`
          });

          imgWrapper.appendChild(div1);

          me.files[i].elem.appendChild(imgWrapper);

          let divLbl = document.createElement('div');
          divLbl.className = 'mf-lbl';

          const markDiv = Object.assign(document.createElement("span"), {
            className: 'mf-mark mf-mark-' + me.files[i].mark
          });
          divLbl.appendChild(markDiv);

          divLbl.appendChild(Object.assign(document.createElement("span"), {
            innerText: me.files[i].name,
            className: "mf-img-name"
          }));
          divLbl.appendChild(Object.assign(document.createElement("span"))); // dummy
          me.files[i].elem.appendChild(divLbl);

          me.files[i].elem.addEventListener('click', function (e) { _this.fileClick(me, e, this, _this, isSearch); }, false);
          filesbox.appendChild(me.files[i].elem);
        }
      }
    }
    var filesboxHdr = document.createElement('div');
    filesboxHdr.className = 'mf-filesbox-header';
    var t = document.createElement('span');
    t.className = 'mf-folderinfo';

    if (isSearch)
      t.innerText = me.lang.translateWithParams('SEARCH_RESULTS', [me.searchquery, me.files.length]);
    else {
      if (me.files.length === 0) {
        t.innerText = me.lang.translate('FOLDER_NOFILES');
      } else {
        if (me.files.length === 1) {
          t.innerText = me.lang.translate('FOLDER_HDR_S');
        }
        else {

          t.innerText = me.lang.translateWithParams('FOLDER_HDR_P', [me.files.length]);
        }
      }
    }
    filesboxHdr.appendChild(t);
    me.fileviewArea.appendChild(filesboxHdr);

    if (smallWindow === false) {
      var sizeSelector = document.createElement('div');
      sizeSelector.className = 'mf-filesbox-sizeheader';

      sizeSelector.style.float = 'left';
      t = document.createElement('span');
      t.className = 'mf-text';
      t.innerText = this.me.lang.translate('CROPPER_IMAGESIZE');
      sizeSelector.appendChild(t);


      var smallPreviews = document.createElement('span');
      var smallPreviewsIcon = document.createElement('span');
      if (me.previewSize === 0) {
        smallPreviews.className = 'mf-previewSize mf-selected';
        smallPreviewsIcon.className = 'mf-smallicons mf-selected';
      } else {
        smallPreviews.className = 'mf-previewSize';
        smallPreviewsIcon.className = 'mf-smallicons';
        smallPreviews.style.cursor = 'pointer';
        smallPreviews.title = this.me.lang.translate('FILE_VIEW_SMALLIMAGES');
        smallPreviewsIcon.title = smallPreviews.title;
        smallPreviews.addEventListener('click', function () {
          if (me.config.disableLocalStorage !== true) {
            if (window.localStorage) {
              localStorage.setItem('MF.previewSize', 0);
            }
          }
          me.previewSize = 0;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "small";
        }, false);
        smallPreviewsIcon.addEventListener('click', function () {
          //console.log('click')
          this.nextSibling.click();
        }, false);
      }
      smallPreviews.innerText = this.me.lang.translate('FILE_VIEW_SMALLIMAGES');
      sizeSelector.appendChild(smallPreviewsIcon);
      sizeSelector.appendChild(smallPreviews);
      var largePreviews = document.createElement('span');
      var largePreviewsIcon = document.createElement('span');

      largePreviews.innerText = this.me.lang.translate('FILE_VIEW_LARGEIMAGES');
      if (me.previewSize === 1) {
        largePreviews.className = 'mf-previewSize mf-selected';
        largePreviewsIcon.className = 'mf-largeicons mf-selected';
      } else {
        largePreviews.className = 'mf-previewSize';
        largePreviewsIcon.className = 'mf-largeicons';
        largePreviews.style.cursor = 'pointer';
        largePreviews.title = this.me.lang.translate('FILE_VIEW_LARGEIMAGES');
        largePreviewsIcon.title = largePreviews.title;
        largePreviews.addEventListener('click', function () {
          if (me.config.disableLocalStorage !== true) {
            if (window.localStorage) {
              localStorage.setItem('MF.previewSize', 1);
            }
          }
          me.previewSize = 1;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "large";
        }, false);
        largePreviewsIcon.addEventListener('click', function () {
          this.nextSibling.click();
        }, false);
      }
      sizeSelector.appendChild(largePreviewsIcon);
      sizeSelector.appendChild(largePreviews);


      var noPreviews = document.createElement('span');
      var noPreviewsIcon = document.createElement('span');
      if (me.previewSize === 2) {
        noPreviews.className = 'mf-previewSize mf-selected';
        noPreviewsIcon.className = 'mf-listview mf-selected';
      } else {
        noPreviews.className = 'mf-previewSize';
        noPreviewsIcon.className = 'mf-listview';
        noPreviews.style.cursor = 'pointer';
        noPreviews.title = this.me.lang.translate('FILE_VIEW_LISTVIEW');
        noPreviewsIcon.title = noPreviews.title;
        noPreviews.addEventListener('click', function () {
          if (me.config.disableLocalStorage !== true) {
            if (window.localStorage) {
              localStorage.setItem('MF.previewSize', 2);
            }
          }
          me.previewSize = 2;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "list";
        }, false);
        noPreviewsIcon.addEventListener('click', function () {
          this.nextSibling.click();
        }, false);
      }
      noPreviews.innerText = this.me.lang.translate('FILE_VIEW_LISTVIEW');
      sizeSelector.appendChild(noPreviewsIcon);
      sizeSelector.appendChild(noPreviews);

      filesboxHdr.appendChild(sizeSelector);
    }
    me.fileviewArea.appendChild(filesbox);

    this.initLazyLoading();
  },
  fileClick: function (me, e, _elem, _this, issearch) {
    if (!_elem || !_elem.dataset || typeof (_elem.dataset.idx) !== 'string')
      return;
    var i, idx = parseInt(_elem.dataset.idx, 10);
    for (i = 0; i < me.files.length; i++) {
      me.files[i].elem.classList.remove("mf-selected");
    }
    me.selectedFileId = me.files[idx].id;
    me.files[idx].elem.classList.add("mf-selected");
    _this.clickCallback(me, idx, issearch);
  },
  setInitialFile: function (me, id, _this) {
    if (typeof id === 'number')
      me.selectedFileId = id;
    else
      me.selectedFileId = id.id;
    var idx = -1;
    for (var i = 0; i < me.files.length; i++) {
      if (me.files[i].id === id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      me.files[idx].elem.className = 'mf-file mf-selected';
      _this.clickCallback(me, idx, false);
    }
  },

  sortClick: function (me, _this, sortcol) {
    //console.log('sorting by ' + sortcol);
    switch (sortcol) {
      case 1:
        me.files = me.files.sort(fileNameComparer);
        break;
      case 2:
        me.files = me.files.sort(fileSizeComparer);
        break;
      case 2:
        me.files = me.files.sort(fileSizeComparer);
        break;
    }
    _this.showFiles(me, _this);
  }

};
