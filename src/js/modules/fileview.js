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

const FILES_PER_PAGE = 500;
const FILE_LIST_FIELDS = 'id,name,filename,filesize,type,mediumPreview,smallPreview,thumbPreview,mark,uploaded,uploadedby,gdprstatus,gdprtype,mediaid,alttext,alpha';

const FolderFileSortField = {
  FILENAME: 'filename',
  FILESIZE: 'filesize',
  MARK: 'mark',
  UPLOADED: 'uploaded',
};

const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
};

function buildFolderFilesUrl(me, folderId) {
  var p = me.folderPagination;
  return 'folder/' + folderId + '/files?sort=' + me.folderSortField
    + '&order=' + me.folderSortOrder
    + '&fields=' + FILE_LIST_FIELDS
    + '&per_page=' + p.perPage + '&page=' + p.page;
}

function hasClientFileFilters(me) {
  if (typeof me.config.limitFileType === 'string' && me.config.limitFileType !== '') {
    return true;
  }
  if (me.config.hideUnsafeGDPR === true) {
    return true;
  }
  if (me.config.hideUnassignedGDPR === true) {
    return true;
  }
  return false;
}

function updateFolderPaginationTotals(me, pagination, rawBatchLength, append) {
  if (!append) {
    pagination.rawFetchedCount = rawBatchLength;
  } else {
    pagination.rawFetchedCount = (pagination.rawFetchedCount || 0) + rawBatchLength;
  }

  var apiTotal = pagination.apiTotalCount;
  if (apiTotal == null || isNaN(apiTotal)) {
    pagination.totalCount = me.files.length;
    return;
  }

  var apiHasMore = pagination.page * pagination.perPage < apiTotal;
  if (!hasClientFileFilters(me) || !apiHasMore) {
    pagination.totalCount = apiHasMore ? apiTotal : me.files.length;
    return;
  }

  if (!pagination.rawFetchedCount) {
    pagination.totalCount = me.files.length;
    return;
  }

  var ratio = me.files.length / pagination.rawFetchedCount;
  pagination.totalCount = Math.max(me.files.length, Math.round(apiTotal * ratio));
}

function hasMoreFolderFiles(me) {
  if (!me.folderPagination) {
    return false;
  }
  var p = me.folderPagination;
  if (p.apiTotalCount != null && !isNaN(p.apiTotalCount)) {
    return p.page * p.perPage < p.apiTotalCount;
  }
  return (p.lastRawBatchLength || 0) >= p.perPage;
}

function isSearchView(me) {
  return typeof me.searchquery === 'string' && me.searchquery.length > 0;
}

function createGdprWarndiv(me) {
  var warndiv = document.createElement('div');
  warndiv.className = 'mf-gdpr-warning';
  warndiv.title = me.lang.translate('FILE_VIEW_GDPR_WARNING');
  warndiv.style.position = 'absolute';
  warndiv.style.height = '16px';
  warndiv.style.width = '16px';
  warndiv.style.backgroundColor = '#EF60A3';
  warndiv.style.color = 'white';
  warndiv.style.fontFamily = 'Arial, Helvetica sans-serif';
  warndiv.style.fontSize = '14px';
  warndiv.style.lineHeight = '16px';
  warndiv.style.fontWeight = 'bold';
  warndiv.innerText = '!';
  warndiv.style.textAlign = 'center';
  warndiv.style.borderRadius = '50%';
  return warndiv;
}

function createListViewHeader(me, _this, filesbox) {
  var header = document.createElement('div');
  header.className = 'mf-header';
  if (me.folderSortOrder === SortOrder.DESC) {
    header.classList.add('mf-reversed');
  }
  header.style.cursor = 'pointer';
  header.style.padding = '0 7px 7px';

  var row = document.createElement('div');
  row.className = 'mf-row';

  var col1 = document.createElement('div');
  col1.style.flex = '3 1 100px';
  col1.className = me.folderSortField === FolderFileSortField.FILENAME ? 'mf-col mf-filename mf-active' : 'mf-col mf-filename';
  col1.style.overflowX = 'hidden';
  col1.style.textOverflow = 'ellipsis';
  col1.style.whiteSpace = 'nowrap';
  col1.innerText = me.lang.translate('FILE_INFO_FILE_NAME');
  col1.addEventListener('click', function () { _this.changeSort(me, _this, FolderFileSortField.FILENAME); }, false);
  row.appendChild(col1);

  var col2 = document.createElement('div');
  col2.style.textAlign = 'right';
  col2.style.flexBasis = '100px';
  col2.className = me.folderSortField === FolderFileSortField.FILESIZE ? 'mf-col mf-filesize mf-active' : 'mf-col mf-filesize';
  col2.innerText = me.lang.translate('FILE_INFO_FILE_SIZE');
  col2.addEventListener('click', function () { _this.changeSort(me, _this, FolderFileSortField.FILESIZE); }, false);
  row.appendChild(col2);

  var col3 = document.createElement('div');
  col3.style.flexBasis = '100px';
  col3.className = me.folderSortField === FolderFileSortField.MARK ? 'mf-col mf-active' : 'mf-col';
  col3.innerText = me.lang.translate('FILE_VIEW_MARKING');
  col3.addEventListener('click', function () { _this.changeSort(me, _this, FolderFileSortField.MARK); }, false);
  row.appendChild(col3);

  var col4 = document.createElement('div');
  col4.style.flexBasis = '100px';
  col4.className = me.folderSortField === FolderFileSortField.UPLOADED ? 'mf-col mf-date mf-active' : 'mf-col mf-date';
  col4.innerText = me.lang.translate('FILE_INFO_UPLOADED');
  col4.addEventListener('click', function () { _this.changeSort(me, _this, FolderFileSortField.UPLOADED); }, false);
  row.appendChild(col4);

  header.appendChild(row);
  filesbox.appendChild(header);
}

function createFileElement(me, _this, file, idx, isSearch, warndiv, smallWindow) {
  var div1, col1, col2, col3, col4, row, markDiv;

  if (me.previewSize === 2) {
    file.elem = document.createElement('div');
    file.elem.dataset.idx = idx;
    file.elem.className = 'mf-file';
    file.elem.style.padding = '5px';
    file.elem.style.position = 'relative';
    file.elem.style.cursor = 'pointer';
    file.elem.addEventListener('click', function (e) { _this.fileClick(me, e, this, _this, isSearch); }, false);

    row = document.createElement('div');
    row.className = 'mf-row';
    col1 = document.createElement('div');
    col1.style.flex = '3 1 100px';
    col1.className = 'mf-col col-filename';
    col1.style.overflowX = 'hidden';
    col1.style.textOverflow = 'ellipsis';
    col1.style.whiteSpace = 'nowrap';
    col1.innerText = file.filename;
    row.appendChild(col1);

    col2 = document.createElement('div');
    col2.style.flexBasis = '100px';
    col2.style.textAlign = 'right';
    col2.className = 'mf-col col-filesize';
    col2.innerText = me.lang.humanFileSize(file.filesize);
    row.appendChild(col2);

    col3 = document.createElement('div');
    col3.style.flexBasis = '100px';
    col3.className = 'mf-col col-mark';
    markDiv = document.createElement('div');
    markDiv.style.width = '10px';
    markDiv.style.height = '10px';
    markDiv.style.display = 'inline-block';
    markDiv.className = 'mf-mark mf-mark-' + file.mark;
    col3.appendChild(markDiv);
    row.appendChild(col3);

    col4 = document.createElement('div');
    col4.style.flexBasis = '100px';
    col4.className = 'mf-col col-date';
    col4.innerText = file.uploaded.substring(0, 10);
    if (file.gdprStatus != undefined) {
      var s = file.gdprStatus.toUpperCase();
      if (s == 'MISSING_CONSENT' || s == 'INVALID_CONSENT' || s == 'AWAIT_CONSENT') {
        var listWarndiv = warndiv.cloneNode(true);
        listWarndiv.style.position = '';
        listWarndiv.style.float = 'right';
        col4.innerHTML += listWarndiv.outerHTML;
      }
    }
    row.appendChild(col4);
    file.elem.appendChild(row);
    return file.elem;
  }

  file.elem = document.createElement('div');
  file.elem.title = file.name;
  file.elem.className = 'mf-file';
  file.elem.dataset.idx = idx;
  if (file.gdprStatus != undefined) {
    var gdprStatus = file.gdprStatus.toUpperCase();
    if (gdprStatus == 'MISSING_CONSENT' || gdprStatus == 'INVALID_CONSENT' || gdprStatus == 'AWAIT_CONSENT') {
      file.elem.innerHTML += warndiv.outerHTML;
    }
  }

  div1 = Object.assign(document.createElement('div'), { className: 'mf-img' });
  var useSmallPreview = me.previewSize === 0 || smallWindow;
  var previewUrl = useSmallPreview ? file.smallPreview : file.mediumPreview;

  if (previewUrl) {
    div1.classList.add('lazy-load-background');
    div1.setAttribute('data-background-src', previewUrl);
    div1.style.backgroundRepeat = 'no-repeat';
    div1.style.backgroundPosition = 'center';
  } else if (file.type.type == 'sound') {
    div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-651-dark.svg)';
    div1.style.backgroundRepeat = 'no-repeat';
    div1.style.backgroundPosition = 'center';
    div1.style.backgroundSize = '80%';
    div1.classList.add('mf-file-icon');
  } else if (file.type.type == 'file' && file.type.extension == 'srt') {
    div1.style.backgroundImage = 'url(//static.mediaflowpro.com/images/icons/filetype-592-dark.svg)';
    div1.style.backgroundRepeat = 'no-repeat';
    div1.style.backgroundPosition = 'center';
    div1.style.backgroundSize = '80%';
    div1.classList.add('mf-file-icon');
  }

  if (file?.type?.extension != null) {
    var spanFileType = document.createElement('span');
    spanFileType.className = 'mf-file-type';
    spanFileType.innerText = file?.type?.extension;
    file.elem.appendChild(spanFileType);
  }

  if (file?.type?.type === 'video') {
    var spanVideoFileType = document.createElement('span');
    spanVideoFileType.className = 'mf-file-type_video';
    spanVideoFileType.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">' +
      '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path>' +
      '<path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"></path>' +
      '</svg>';
    file.elem.appendChild(spanVideoFileType);
  }

  var imgWrapper = Object.assign(document.createElement('div'), {
    className: 'mf-img-wrapper' + (file.alpha ? ' mf-file-alpha' : '')
  });
  imgWrapper.appendChild(div1);
  file.elem.appendChild(imgWrapper);

  var divLbl = document.createElement('div');
  divLbl.className = 'mf-lbl';
  var fileMarkDiv = Object.assign(document.createElement('span'), {
    className: 'mf-mark mf-mark-' + file.mark
  });
  divLbl.appendChild(fileMarkDiv);
  divLbl.appendChild(Object.assign(document.createElement('span'), {
    innerText: file.name,
    className: 'mf-img-name'
  }));
  divLbl.appendChild(Object.assign(document.createElement('span')));
  file.elem.appendChild(divLbl);

  file.elem.addEventListener('click', function (e) { _this.fileClick(me, e, this, _this, isSearch); }, false);
  return file.elem;
}

export default {
  me: {},
  init: function (me, clickCallback) {
    this.clickCallback = clickCallback;
    this.me = me;
    this.lazyLoadObserver = null;
    this.lazyLoadObserved = new WeakSet();
    this.lazyLoadRoot = null;
    me.folderSortField = FolderFileSortField.FILENAME;
    me.folderSortOrder = SortOrder.ASC;
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
    me.searchquery = '';
    me.folderPagination = {
      folderIdx: idx,
      page: 1,
      perPage: FILES_PER_PAGE,
      apiTotalCount: null,
      rawFetchedCount: 0,
      lastRawBatchLength: 0,
      totalCount: 0,
      loading: true
    };
    this.loadFolderPage(me, idx, { append: false, selectedFile: selectedFile });
  },

  loadFolderPage: function (me, idx, options) {
    var _this = this;
    var append = options.append || false;
    var selectedFile = options.selectedFile || null;
    var pagination = me.folderPagination;
    var url = buildFolderFilesUrl(me, me.folders[idx].id);

    me.api.get(url,
      function (o, totalCount) {
        var filtered = _this.filterFiles(me, o);
        if (append) {
          me.files = me.files.concat(filtered);
        } else {
          me.files = filtered;
          me.selectedFileId = -1;
          me.selectedFolderId = me.folders[idx].id;
        }
        if (totalCount != null && !isNaN(totalCount)) {
          pagination.apiTotalCount = totalCount;
        }
        pagination.lastRawBatchLength = o.length;
        updateFolderPaginationTotals(me, pagination, o.length, append);
        pagination.loading = false;
        if (append) {
          _this.appendFiles(me, _this, filtered, false);
        } else {
          _this.showFiles(me, _this, false);
          if (selectedFile) {
            _this.setInitialFile(me, selectedFile, _this);
          }
        }
      },
      function (o) {
        pagination.loading = false;
        if (append) {
          pagination.page--;
          _this.updateLoadMoreButton(me, _this);
        } else if (options.revertSort) {
          me.folderSortField = options.revertSort.field;
          me.folderSortOrder = options.revertSort.order;
          _this.showFiles(me, _this, false);
        }
        console.error('Error: Failed to get folder data');
      },
      undefined, true
    );
  },

  loadMoreFolderFiles: function (me, _this) {
    var pagination = me.folderPagination;
    if (!pagination || pagination.loading || !hasMoreFolderFiles(me)) {
      return;
    }
    pagination.loading = true;
    pagination.page++;
    _this.updateLoadMoreButton(me, _this);
    _this.loadFolderPage(me, pagination.folderIdx, { append: true });
  },

  getFolderHeaderText: function (me) {
    var totalCount = me.folderPagination ? me.folderPagination.totalCount : me.files.length;
    if (me.files.length === 0 && !hasMoreFolderFiles(me) && totalCount === 0) {
      return me.lang.translate('FOLDER_NOFILES');
    }
    if (totalCount === 1) {
      return me.lang.translate('FOLDER_HDR_S');
    }
    return me.lang.translateWithParams('FOLDER_HDR_P', [totalCount]);
  },

  updateFolderHeader: function (me) {
    var header = me.fileviewArea.querySelector('.mf-folderinfo');
    if (header) {
      header.innerText = this.getFolderHeaderText(me);
    }
  },

  createLoadMoreFooter: function (me, _this) {
    if (!hasMoreFolderFiles(me)) {
      return null;
    }

    var footer = document.createElement('div');
    footer.className = 'mf-load-more';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mf-load-more-btn';
    btn.innerText = me.lang.translate('FILE_VIEW_SHOW_MORE');
    btn.addEventListener('click', function () {
      _this.loadMoreFolderFiles(me, _this);
    }, false);
    footer.appendChild(btn);
    return footer;
  },

  updateLoadMoreButton: function (me, _this) {
    var footer = me.fileviewArea.querySelector('.mf-load-more');
    if (!footer) {
      return;
    }
    var btn = footer.querySelector('.mf-load-more-btn');
    var pagination = me.folderPagination;
    if (!pagination || !hasMoreFolderFiles(me)) {
      footer.remove();
      return;
    }
    footer.style.display = '';
    if (pagination.loading) {
      btn.disabled = true;
      btn.innerText = me.lang.translate('FILE_VIEW_FETCHING_DATA');
    } else {
      btn.disabled = false;
      btn.innerText = me.lang.translate('FILE_VIEW_SHOW_MORE');
    }
  },

  appendFiles: function (me, _this, newFiles, isSearch) {
    var warndiv = createGdprWarndiv(me);
    var smallWindow = false;
    var filesbox = me.fileviewArea.querySelector('.mf-files-box');
    var loadMore = filesbox.querySelector('.mf-load-more');
    var startIdx = me.files.length - newFiles.length;
    var i;

    for (i = 0; i < newFiles.length; i++) {
      var idx = startIdx + i;
      var elem = createFileElement(me, _this, me.files[idx], idx, isSearch, warndiv, smallWindow);
      if (loadMore) {
        filesbox.insertBefore(elem, loadMore);
      } else {
        filesbox.appendChild(elem);
      }
    }
    _this.updateFolderHeader(me);
    _this.updateLoadMoreButton(me, _this);
    _this.initLazyLoading();
    _this.highlightSelectedFileInList(me);
  },

  showSearchResults: function (me, searchtxt, includeAiSearch) {
    var _this = this;
    me.item.dataset.activeView = "files"; //set activeView to files for mobile view
    me.selectedFileId = -1;
    me.searchquery = searchtxt;

    var lang = me.lang.locale();

    // Fallback to english if language is not supported
    const supportedSearchLangs = ['sv-SE', 'en-GB', 'en-US', 'fi-FI', 'nb-NO', 'de-DE', 'fr-FR', 'it-IT'];
    if (!supportedSearchLangs.includes(lang)) {
      lang = 'en-GB';
    }

    const postData = {
      searchTerm: searchtxt,
      lang: lang,
      ai: includeAiSearch
    };
    me.api.post('search/file?fields=id,name,filename,filesize,type,mediumPreview,smallPreview,thumbPreview,mark,uploaded,uploadedby,gdprstatus,gdprtype,mediaid,alttext',
      postData,
      function (o) { me.files = _this.filterFiles(me, o); _this.showFiles(me, _this, true) },
      function (o) { console.error('Error: Failed to get search result data'); })
  },

  sortFiles: function (me, filelist) {
    var ascending = me.folderSortOrder === SortOrder.ASC;
    switch (me.folderSortField) {
      case FolderFileSortField.FILENAME:
        return filelist.sort(ascending ? fileNameComparer : fileNameComparer2);
      case FolderFileSortField.FILESIZE:
        return filelist.sort(ascending ? fileSizeComparer : fileSizeComparer2);
      case FolderFileSortField.MARK:
        return filelist.sort(ascending ? markComparer : markComparer2);
      case FolderFileSortField.UPLOADED:
        return filelist.sort(ascending ? dateComparer : dateComparer2);
      default:
        return filelist.sort(ascending ? fileNameComparer : fileNameComparer2);
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

  changeSort: function (me, _this, sortField) {
    if (me.folderPagination && me.folderPagination.loading) {
      return;
    }

    var previousSortField = me.folderSortField;
    var previousSortOrder = me.folderSortOrder;

    if (me.folderSortField !== sortField) {
      me.folderSortField = sortField;
      me.folderSortOrder = SortOrder.ASC;
    } else {
      me.folderSortOrder = me.folderSortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    }

    if (me.folderPagination && !isSearchView(me)) {
      if (!hasMoreFolderFiles(me)) {
        me.files = _this.sortFiles(me, me.files);
        _this.showFiles(me, _this, false);
        return;
      }
      me.folderPagination.page = 1;
      me.folderPagination.loading = true;
      _this.loadFolderPage(me, me.folderPagination.folderIdx, {
        append: false,
        revertSort: {
          field: previousSortField,
          order: previousSortOrder
        }
      });
      return;
    }

    _this.showFiles(me, _this, true);
  },

  initLazyLoading: function () {
    var _this = this;
    const rootElement = this.me.config.rootElement || document;
    const scrollContainer = rootElement.querySelector('.mf-files-box');
    if (!scrollContainer) {
      return;
    }

    const lazyLoad = function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const div = entry.target;
          const bgImage = div.getAttribute('data-background-src');
          div.style.backgroundImage = 'url(' + bgImage + ')';
          observer.unobserve(div);
          _this.lazyLoadObserved.delete(div);
        }
      });
    };

    if (!this.lazyLoadObserver || this.lazyLoadRoot !== scrollContainer) {
      if (this.lazyLoadObserver) {
        this.lazyLoadObserver.disconnect();
      }
      this.lazyLoadObserved = new WeakSet();
      this.lazyLoadRoot = scrollContainer;
      this.lazyLoadObserver = new IntersectionObserver(lazyLoad, {
        root: scrollContainer,
        rootMargin: '0px',
        threshold: 0
      });
    }

    const lazyLoadDivs = rootElement.querySelectorAll('.lazy-load-background');
    lazyLoadDivs.forEach(function (div) {
      if (_this.lazyLoadObserved.has(div)) {
        return;
      }
      if (div.style.backgroundImage) {
        return;
      }
      _this.lazyLoadObserved.add(div);
      _this.lazyLoadObserver.observe(div);
    });
  },

  showFiles: function (me, _this, isSearch) {
    if (isSearch !== true) {
      isSearch = isSearchView(me);
    }

    var warndiv = createGdprWarndiv(me);
    me.fileviewArea.innerHTML = '';
    me.fileinfoArea.innerHTML = '';

    // Only for search results
    if (isSearch) {
      me.files = _this.sortFiles(me, me.files);
    }

    var smallWindow = false;

    var filesbox = document.createElement('div');
    filesbox.classList.add('mf-files-box');
    if (me.previewSize === 0) {
      filesbox.classList.add('smallicons');
    }
    else if (me.previewSize === 2) {
      filesbox.classList.add('list-view');
    }

    if (me.previewSize === 2) {
      createListViewHeader(me, _this, filesbox);
    }

    var i, le = me.files.length;
    for (i = 0; i < le; i++) {
      filesbox.appendChild(createFileElement(me, _this, me.files[i], i, isSearch, warndiv, smallWindow));
    }

    var filesboxHdr = document.createElement('div');
    filesboxHdr.className = 'mf-filesbox-header';
    var t = document.createElement('span');
    t.className = 'mf-folderinfo';

    if (isSearch) {
      t.innerText = me.lang.translateWithParams('SEARCH_RESULTS', [me.searchquery, me.files.length]);
    } else {
      t.innerText = _this.getFolderHeaderText(me);
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
              localStorage.setItem('MF.previewSize', '0');
            }
          }
          me.previewSize = 0;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "small";
        }, false);
        smallPreviewsIcon.addEventListener('click', function () {
          var sibling = this.nextSibling;
          if (sibling instanceof HTMLElement) {
            sibling.click();
          }
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
              localStorage.setItem('MF.previewSize', '1');
            }
          }
          me.previewSize = 1;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "large";
        }, false);
        largePreviewsIcon.addEventListener('click', function () {
          var sibling = this.nextSibling;
          if (sibling instanceof HTMLElement) {
            sibling.click();
          }
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
              localStorage.setItem('MF.previewSize', '2');
            }
          }
          me.previewSize = 2;
          _this.showFiles(me, _this);
          me.item.dataset.activePreviewType = "list";
        }, false);
        noPreviewsIcon.addEventListener('click', function () {
          var sibling = this.nextSibling;
          if (sibling instanceof HTMLElement) {
            sibling.click();
          }
        }, false);
      }
      noPreviews.innerText = this.me.lang.translate('FILE_VIEW_LISTVIEW');
      sizeSelector.appendChild(noPreviewsIcon);
      sizeSelector.appendChild(noPreviews);

      filesboxHdr.appendChild(sizeSelector);
    }
    me.fileviewArea.appendChild(filesbox);

    if (!isSearch) {
      var loadMoreFooter = _this.createLoadMoreFooter(me, _this);
      if (loadMoreFooter) {
        filesbox.appendChild(loadMoreFooter);
      }
    }

    this.initLazyLoading();

    if (!isSearch) {
      _this.highlightSelectedFileInList(me);
    }
  },
  highlightSelectedFileInList: function (me) {
    if (!me.selectedFileId || me.selectedFileId < 0) {
      return;
    }

    var i, idx = -1;
    for (i = 0; i < me.files.length; i++) {
      if (me.files[i].elem) {
        me.files[i].elem.classList.remove('mf-selected');
      }
      if (me.files[i].id === me.selectedFileId) {
        idx = i;
      }
    }

    if (idx >= 0 && me.files[idx].elem) {
      me.files[idx].elem.classList.add('mf-selected');
    }
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
    var fileId = typeof id === 'number' ? id : id.id;
    me.selectedFileId = fileId;

    var idx = -1;
    for (var i = 0; i < me.files.length; i++) {
      if (me.files[i].id === fileId) {
        idx = i;
        break;
      }
    }

    if (idx >= 0) {
      me.files[idx].elem.className = 'mf-file mf-selected';
      _this.clickCallback(me, idx, false);
      return;
    }

    _this.loadInitialFileById(me, _this, fileId);
  },

  loadInitialFileById: function (me, _this, fileId) {
    _this.clickCallback(me, -1, false, fileId);
  }

};
