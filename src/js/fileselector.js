/* Mediaflow File Selector */

import MFAPI from "./services/api";
import lang from "./services/lang";
import {initTranslations} from "./services/translations";
import foldertree from './modules/foldertree';
import fileview from './modules/fileview';
import fileinfo from './modules/fileinfo';
import cropperview from './modules/cropperview';
import movieview from './modules/movieview';
import toparea from './modules/toparea';

import "../css/cropper.min.css";
import "../css/fileselector.css";

export default class FileSelector {
	constructor(item, config) {
		const me = this;

		if(typeof(config) !== 'object') {
			console.error("missing or invalid config object");
			return;
		}
		if(typeof(config.success) !== 'function') {
			console.error("missing or invalid parameter: success");
			return;
		}
		if(typeof(item) === 'string') {
			item = document.getElementById(item); 
		}
		if(!item) {
			console.error("missing or invalid element");
			return;
		}
		if(typeof(config.downloadFormat) !== 'string' || (config.downloadFormat!='fixed' && config.downloadFormat!='both' && config.downloadFormat!='original' && config.downloadFormat!='stream'))
			config.downloadFormat = 'mediaflow';
		if((config.downloadFormat === 'fixed' || config.downloadFormat === 'both') && (typeof(config.downloadFormats) !== 'object' || !(config.downloadFormats.length))) {
			console.error("missing or invalid downloadFormats");
			return;
		}
		if(config.auth === 'accesstoken' && (typeof(config.accesstoken) !== 'string' || config.accesstoken.length<1)) {
			console.error("missing config.accesstoken");
			return;
		}

		if(typeof(config.apiBase) !== 'string' || config.apiBase.length<10 || config.apiBase.substring(0,4) !== 'http') {
			config.apiBase = "https://api.mediaflow.com/1";
		}
	  
		if(typeof(config.locale) !== 'string' || config.locale.length !== 5)
		  config.locale = 'sv_SE';

        (async () => {
          me.folders = []; // folderTree
          me.files = [];   // files currently listed
          me.file = {};    // file object for currently selected file
          me.item = item;
          me.config = config;
          await initTranslations(me.config.locale); // init before use!!!
          me.lang = lang(me.config.locale);
          me.isDownloading = false;
          me.api = MFAPI(config.apiBase, config);
          me.version = '1.0.0';
          me._setupResponsiveUI();
          me._buildUI();		
          me._init();
          me._render();
          me._getMarkings();
        })();

		//add link to server css
		if (!document.getElementById('mf_fileselector_css')) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.id = 'mf_fileselector_css';
			link.href = `https://mfstatic.com/css/fileselector.min.css?v=${FS_VERSION}`;
			document.getElementsByTagName('head')[0].appendChild(link);
		}
	}

	folderClick(me, idx) {
		if(typeof(me.config.events)==='function') {
		  me.config.events('folderClick', {id:me.folders[idx].id, name:me.folders[idx].name});
		}
		fileview.showFolder(me, idx,null);
	}
  
	fileClick(me, idx, issearch) {
		if(typeof(me.config.events)==='function')
		  me.config.events('fileClick', {id:me.files[idx].id, name:me.files[idx].name, mediaId:me.files[idx].mediaId, isSearch:issearch, type:me.files[idx].type.type});
		me.fileinfo.showInfo(me, idx);
		me.item.dataset.activeView = "file"; // change activeview for mobile
	}

	btnSelectClick(me) {
		if (typeof (me.config.events) === 'function') {
			me.config.events('fileSelected', { id: me.file.id, name: me.file.name });
		}

		if (me.config.returnValue === 'fileObject') {
			me.clickDone();
			return;
		}

		if (me.file.type.type === 'image') {
			me.cropperview.showCropper(me);
		} else if (me.config.downloadFormat === 'original' && me.file.type.type !== 'video') {
			me.clickDone();
		} else if (me.file.type.type === 'video' && me.config.downloadFormat !== 'stream') {
			movieview.showMovieView(me);
		} else {
			me.clickDone();
		}
	}
  
	btnBackClick(me) {
		if(typeof(me.config.events)==='function')
		  me.config.events('fileDeselected', {});
		if(me.file.type.type == 'image')
		   me.cropperview.hideCropper(me);
		if(me.file.type.type == 'video')
		   movieview.hideMovieView(me);		   
	}

	btnSearchClick(me, txt, includeAiSearch) {
	    fileview.showSearchResults(me, txt, includeAiSearch);
	}

	/**
	 * @private
	 */
	_init() {
		const me = this;
		fileview.init(me, me.fileClick);
		foldertree.init(me, me.folderClick);

		me.fileinfo = fileinfo;
		me.fileinfo.init(me, me.btnSelectClick);

		me.cropperview = cropperview;
		me.cropperview.init(me, me.btnBackClick);

		toparea.init(me, me.btnSearchClick);
		if(me.config.selectedFile && typeof me.config.selectedFile === 'object' && me.config.selectedFile.basetype === 'video') {
		   var autoPlay = me.config.selectedFile.autoPlay === undefined ? false : me.config.selectedFile.autoPlay;
		   var startTime =  me.config.selectedFile.startTime === undefined ? false : me.config.selectedFile.startTime;		   
		   var embedMethod = me.config.selectedFile.embedMethod;
		   if(autoPlay === undefined) {
			   if(me.config.allowJSVideo) 
			     embedMethod = 'javascript';
			   else
			     embedMethod = 'iframe';
		   }
		   movieview.init(me, me.btnBackClick, embedMethod,startTime, autoPlay); 
		}
		else {
		   var method = 'javascript';
		   if(me.config.allowJSVideo === false)
		     method = 'iframe';
		   if(me.config.allowIframeVideo === false)
		     method = 'javascript';
		   movieview.init(me, me.btnBackClick,method,0,false);
		}
		return me;
	}		

	/**
	 * @private
	 * called by foldertree when folders are loaded
	 */              
	_setInitialFile(id, folderid, callback) {
		if(typeof id === 'object') {
		  id = id.id || -1;
		}

		if(id < 0 && !folderid) {
			callback();
			return;
		}		
		const me = this;
		if(!folderid) {
			me.api.get('file/' + id + '/folders', function(o) {
				if(o.length>0) {					
					    me._revealFolder(o[0].id);
						me.showFolder(o[0].id,id);
						
				}		
				callback();		
			}, function(o) {	
				callback();		
			});
		}
		else {			
			me._revealFolder(folderid);
			me.showFolder(folderid,id);
			callback();
		}
	}

	/**
	 * @private
	 */
	_getMarkings(){
		const me = this;
		me.api.get('marks', function(o) {
			me.markings = o;
		}, function(o) {	
			console.error('Error: Failed to get marks data');
		});
	}

	/**
	 * @private
	 */
	_buildUI() {
		const me = this;

		me.item.classList.add("mf_container");

		me.topArea = document.createElement('div');
		me.topArea.style.position = 'absolute';
		me.topArea.style.left = '0';
		me.topArea.style.right = '0';
		me.topArea.style.top = '0';		
		me.topArea.style.height = '40px';
		me.topArea.className = 'mf_topArea';
		me.item.appendChild(me.topArea);

		me.foldertreeArea = document.createElement('div');
		me.foldertreeArea.style.position = 'absolute';
		me.foldertreeArea.style.left = '0';
		me.foldertreeArea.style.top = '40px';
		me.foldertreeArea.style.bottom = '0';
		me.foldertreeArea.style.width = '250px';
		me.foldertreeArea.style.overflow = 'auto';
		me.foldertreeArea.className = 'mf_foldertreeArea';
		me.item.appendChild(me.foldertreeArea);

		me.fileviewArea = document.createElement('div');
		me.fileviewArea.style.position = 'absolute';
		me.fileviewArea.style.left = '250px';
		me.fileviewArea.style.top = '40px';
		me.fileviewArea.style.bottom = '0';
		me.fileviewArea.style.right = '300px';
		me.fileviewArea.style.overflow = 'auto';
		me.fileviewArea.className = 'mf_fileviewArea';
		me.item.appendChild(me.fileviewArea);

		me.fileinfoArea = document.createElement('div');
		me.fileinfoArea.style.position = 'absolute';
		me.fileinfoArea.style.right = '0';
		me.fileinfoArea.style.top = '40px';
		me.fileinfoArea.style.bottom = '0';
		me.fileinfoArea.style.width = '300px';
		me.fileinfoArea.className = 'mf_fileinfoArea';
		me.item.appendChild(me.fileinfoArea);

		me.cropperArea = document.createElement('div');
		me.cropperArea.style.position = 'absolute';
		me.cropperArea.style.right = '0';
		me.cropperArea.style.left = '0';
		me.cropperArea.style.top = '0';
		me.cropperArea.style.bottom = '0';
		me.cropperArea.style.backgroundColor = '#fff';
		me.cropperArea.style.display = 'none';
		me.cropperArea.className = 'mf_cropperArea';
		me.item.appendChild(me.cropperArea);

		me.movieArea = document.createElement('div');
		me.movieArea.style.position = 'absolute';
		me.movieArea.style.right = '0';
		me.movieArea.style.left = '0';
		me.movieArea.style.top = '0';
		me.movieArea.style.bottom = '0';
		me.movieArea.style.backgroundColor = '#fff';
		me.movieArea.style.display = 'none';
		me.movieArea.className = 'mf_movieArea';
		me.item.appendChild(me.movieArea);

		return me;
	}	

	/**
	 * @private
	 */
	_render() {
		const me = this;
	}

	/**
	 * @public
	 */
	showFolder(id, selectedFile) {
		var i, l, idx = -1;
		const me = this;

		l = me.folders.length;
		for(i=0; i<l; i++) {
			if(me.folders[i].id === id) {
				idx = i;
				break;
			}
		}
		if(idx >= 0) {		
			if(selectedFile)
			   fileview.showFolder(me, idx,selectedFile);
			else
			   fileview.showFolder(me, idx,null);
		}
	}

	/**
	 * @private
	 */
	_revealFolder(id) {
        var me = this;
		var idx=-1;
		for(var i=0;i<me.folders.length;i++) {
		   if(me.folders[i].id === id) {
			 idx = i;
			 break;
		   }
		}
		if(idx >=0) {
		   me.folders[idx].open = true;       
		   me.selectedFolder = idx;
		   var d= me.folders[idx].depth;;
		   if(me.folders[idx].depth > 0) {
			 for(var j=idx-1; j >=0 && me.folders[j].depth>=0; j--) {
			   if(d != me.folders[j].depth)
				 me.folders[j].open=true;
			   
			   while(me.folders[j].depth > d && j>=0) {
				j--;
			   }
			   d = me.folders[j].depth;
			   if(me.folders[j].depth == 0)
				  break;
			 }
		   }
	
		}
	  }

	
	/**
	 * @public
	 */
	clickDone() {
		const me = this;
		if(me.file.id) {
			if (me.config.returnValue === 'fileObject') {
				me.config.success(me.file);
				return true;
			}
			if((me.file.type.type != 'image' && me.file.type.type != 'video') || me.config.downloadFormat === 'original') {
				if(me.isDownloading)
					return false;
			  	me.isDownloading = true;
			  	me.api.get('file/' + me.file.id + '/downloads/0', function(o) {
					me.isDownloading = false;
					var downloadURL = o[0].downloadURL;
					if (me.config.permanentURL && (me.isValidFileType(me.file))){
						downloadURL += '&permalink=true';
						var xhr = new XMLHttpRequest();
						xhr.open('GET', downloadURL);
						xhr.onload = function() {
						  if (xhr.readyState === 4) {
							if(xhr.status === 200 || xhr.status === 201) {
							  try {
								var o = JSON.parse(xhr.responseText);
								me.config.success({
									url: o.url, 
									name:me.file.name, 
									filename:me.file.filename, 
									mediaId: me.file.mediaId, 
									id:  me.file.id, 
									folderId: me.selectedFolderId,
									basetype: me.file.type.type, 
									filetype: me.file.type.extension, 
									width: me.file.width, 
									height: me.file.width, 
									photographer: me.file.photographer,
									altText: me.config.autosetAltText !== false ? me.file.alttext : ""
								 });
							  } catch(e) {
								alert('Ett fel inträffade vid nerladdning av fil');
							  }
							}
						  }
						}
						xhr.send();
					} else {
						setTimeout(function() { 
							me.config.success({
								url: downloadURL, 
								name:me.file.name, 
								filename:me.file.filename,
								mediaId: me.file.mediaId, 
								id: me.file.id, 
								folderId: me.selectedFolderId,
								basetype:me.file.type.type, 
								filetype:me.file.type.extension, 
								width:me.file.width, 
								height:me.file.width, 
								photographer:me.file.photographer,
								altText: me.config.autosetAltText !== false ? me.file.alttext : ""
							 });
						}, 5);
					}
			  	}, function(o) {
				  	alert('Ett fel inträffade vid nerladdning av fil');
				  	me.isDownloading = false;
				});
			} else {
				if(me.cropperviewVisible) {
					me.cropperview.clickDone(me);
					return true;
				} else {
					if(me.movieviewVisible) {
						me.movieview.clickDone(me);
						return true;
					} else {
						if(me.config.downloadFormat === 'stream') {
  						  setTimeout(function() { 
							me.config.success({
								id:me.file.id, 
								mediaId:me.file.mediaId, 
								filename:me.file.filename, 
								basetype:me.file.type.type, 
								filetype:me.file.type.extension,
								folderId: me.selectedFolderId,
							});}, 5);
						  return true;
						}
						return false;
					}
				}
			}
		}
		return false;
	}


	/**
	 * Checks whether a given file has a valid type based on its category, extension, or ID.
	 *
	 * A file is considered valid if:
	 * - Its type is `"image"`, or
	 * - Its extension is one of `ttf`, `otf`, `woff`, `woff2`, or `eof`
	 * - Its type ID is in the list `[201, 230]`.
	 *
	 * @param {{ type: { type: string, extension: string, id: number } }} file
	 *   The file object to validate. Must include a `type` object with `type`, `extension`, and `id` properties.
	 * @returns {boolean} `true` if the file type is valid, otherwise `false`.
	 */
	isValidFileType(file) {
		if(file.type.type == 'image') {
			return true;
		}

		// The type is 'file' but we use extention to be extra percise
		if(file.type.extension == 'ttf' || file.type.extension == 'otf' || file.type.extension == 'woff' || file.type.extension == 'woff2' || file.type.extension == 'eof') {
			return true;
		}

		const allowedIds = [201/*pdf*/, 230/*svg*/];
		if(allowedIds.includes(file.type.id)) {
			return true;
		}
		return false;
	}

	/**
	 * @private
	 */
	_setupResponsiveUI() {
		const me = this;

		me.responsiveMenu = document.createElement('div');
		me.responsiveMenu.className = 'mf_responsiveMenu';
		me.item.appendChild(me.responsiveMenu);

		//set default view to folders
		me.item.dataset.activeView = "folders";
		
		var button1 = document.createElement('button');
		button1.innerText = me.lang.translate('FOLDERS');
		button1.onclick = function(){
			me.item.dataset.activeView = "folders";
		};
		me.responsiveMenu.appendChild(button1);

		var button2 = document.createElement('button');
		button2.innerText = me.lang.translate('FILES');
		button2.onclick = function(){
			me.item.dataset.activeView = "files";
		};
		me.responsiveMenu.appendChild(button2);

		var button3 = document.createElement('button');
		button3.innerText = me.lang.translate('FILE_INFO');
		button3.onclick = function(){
			me.item.dataset.activeView = "file";
		};
		me.responsiveMenu.appendChild(button3);

		updateContainerSize();
		window.addEventListener('resize', updateContainerSize);

		if ('IntersectionObserver' in window ||
		'IntersectionObserverEntry' in window ||
		'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
			new IntersectionObserver((entries, observer) => {
				entries.forEach(entry => {
				if(entry.intersectionRatio > 0) {
					updateContainerSize();
				}
				});
			}).observe(me.item);
		}
		
		function updateContainerSize(){
			if(me.item.offsetWidth < 990){
				me.responsiveMenu.style.display = "flex";
				me.item.classList.add("mf_container_small");
			} else{
				me.responsiveMenu.style.display = "none";
				me.item.classList.remove("mf_container_small");
			}
		};
	}
	
	
    /**
	 * Displays a video file in the movie view when selected by ID or current file.
	 *
	 * @param {*} idImage Optional video file identifier
	 */
	selectVideo(idImage) {
        if(idImage === undefined) {
            if (this.file && this.file.type && this.file.type.type === 'video') {
                movieview.showMovieView(this);
                return;
            }
            console.error('Error: Failed to get video. No video file selected');
            return;
        }
		const url = `/file/${idImage}?fields=all`;
		this.api.get(url, (result) => {
			if(!result && result.length !== 1){
				console.error('Error: Failed to get video');
				return;
			}
			const files = fileview.filterFiles(me, result);
			if (files.length !== 1) {
				console.error('Error: Bad video response');
				return;
			}
            this.file = files[0];
			if (!this.file.type && this.file.type.type !== 'video') {
				console.error('Error: File is not a video');
				return;
			}
            movieview.showMovieView(this);
		}, (error) => {
            console.error('Error: Failed to get video', error);
            return;
        });
    }
}

if (typeof window !== 'undefined') {
	window.FileSelector = FileSelector;
}