/* Mediaflow File Selector */

export default {
  init: function(me, clickCallback) {
    this.clickCallback = clickCallback;
    var _this = this;
    me.selectedFolder = -1;
    me.api.get(`foldertree?private=${me.config.excludePrivateFolders === true ? "false" : "true"}&public=true&fields=id,name,depth,type&locale=` + me.lang.locale(), function(o){
      me.folders = o;
      _this.initTree(me);
    }, function(o){console.error('Error: Failed to get foldertree data');})
  },
  initTree: function(me) {
    var n, le = me.folders.length, currDepth = -1;
    for(n=0; n<le; n++) {
      me.folders[n].open = false;
      me.folders[n].hasChildren = false;
      if(currDepth != me.folders[n].depth) {
        if(n>0 && me.folders[n].depth > currDepth) {
          me.folders[n-1].hasChildren = true;
        }
        currDepth = me.folders[n].depth;
      }  
    }



    if(me.config.selectedFile) {
      
			if(me.config.selectedFolder && typeof(me.config.selectedFolder==='number')) {        
			    me._setInitialFile(me.config.selectedFile, me.config.selectedFolder, () => this.renderTree(me));
			}
			else {         
			   me._setInitialFile(me.config.selectedFile, false, ()=>this.renderTree(me));
			}
    } else if(me.config.selectedFolder && typeof(me.config.selectedFolder === 'number')) {
      me._setInitialFile(-1, me.config.selectedFolder, () => this.renderTree(me));
    } else {
      me._setInitialFile(-1, false, () => this.renderTree(me));
    }
  },
  renderTree: function(me) {
    if(!me.folders || me.folders.length===0)
      return;
    var _this = this;
    var i, n, le, currDepth = 0, lastfolders;
    var treeDivs = [];
    le = me.folders.length;
/*
    var currDepth=0;
    sHTML = '<div style="padding-top:8px;padding-left:3px;"><div>';
    for(menunr=0; menunr<l; menunr++) {
      if(currDepth != this.folders[menunr].depth) {
        if(this.folders[menunr].depth>currDepth) {
          if(this.folders[menunr-1].open==1)
            sHTML += '<div id="' + MFPImage.prefix + 'IV_mb' + menunr + '">';
          else
            sHTML += '<div id="' + MFPImage.prefix + 'IV_mb' + menunr + '" style="display:none;">';
        } else {
          lastfolders = currDepth - this.folders[menunr].depth;
          for(n=0; n<lastfolders; n++)
            sHTML += '</div>';
        }
        currDepth = this.folders[menunr].depth;
      }
      if(this.folders[menunr].sep==1) {
        sHTML += '<div class="almtr_sep">' + MFPImage.escapeHtml(this.folders[menunr].seplabel) + '</div>';
      }      
      if(this.folders[menunr].ch==1) {
        if(this.folders[menunr].open==1)
          sHTML += '<div class="almtr_box" title="' + MFPImage.escapeHtml(this.folders[menunr].name) + '" id="' + MFPImage.prefix + 'IV_me' + (menunr+1) + '" OnClick="MFPImage.vm(\'' + (menunr+1) + '\',\'' + this.folders[menunr].id + '\',1,\'' + this.folders[menunr].type + '\');" OnDblClick="MFPImage.op(event,\'' + (menunr+1) + '\',' + this.folders[menunr].id + ',' + this.folders[menunr].type + ');"><div class="almtr_arrow" id="' + MFPImage.prefix + 'IV_pm' + (menunr+1) + '" style="width:' + ((currDepth+1)*11) + 'px;" OnClick="MFPImage.op(event,\'' + (menunr+1) + '\',' + this.folders[menunr].id + ',' + this.folders[menunr].type + ');">&#61661;</div><div class="almtr_icon" id="' + MFPImage.prefix + 'IV_fm' + (menunr+1) + '">' + (this.treeiconsopen[this.folders[menunr].type] ? this.treeiconsopen[this.folders[menunr].type] : '&#61564;') + '</div>' + MFPImage.escapeHtml(this.folders[menunr].name) + '</div>';
        else
          sHTML += '<div class="almtr_box" title="' + MFPImage.escapeHtml(this.folders[menunr].name) + '" id="' + MFPImage.prefix + 'IV_me' + (menunr+1) + '" OnClick="MFPImage.vm(\'' + (menunr+1) + '\',\'' + this.folders[menunr].id + '\',1,\'' + this.folders[menunr].type + '\');" OnDblClick="MFPImage.op(event,\'' + (menunr+1) + '\',' + this.folders[menunr].id + ',' + this.folders[menunr].type + ');"><div class="almtr_arrow" id="' + MFPImage.prefix + 'IV_pm' + (menunr+1) + '" style="width:' + ((currDepth+1)*11) + 'px;" OnClick="MFPImage.op(event,\'' + (menunr+1) + '\',' + this.folders[menunr].id + ',' + this.folders[menunr].type + ');">&#61658;</div><div class="almtr_icon" id="' + MFPImage.prefix + 'IV_fm' + (menunr+1) + '">' + (this.treeiconsclosed[this.folders[menunr].type] ? this.treeiconsclosed[this.folders[menunr].type] : '&#61563;') + '</div>' + MFPImage.escapeHtml(this.folders[menunr].name) + '</div>';
      } else {
        sHTML += '<div class="almtr_box" title="' + MFPImage.escapeHtml(this.folders[menunr].name) + '" id="' + MFPImage.prefix + 'IV_me' + (menunr+1) + '" OnClick="MFPImage.vm(\'' + (menunr+1) + '\',\'' + this.folders[menunr].id + '\',0,\'' + this.folders[menunr].type + '\');"><div class="almtr_spacer" style="width:' + ((currDepth+1)*11) + 'px;"></div><div class="almtr_icon" id="' + MFPImage.prefix + 'IV_fm' + (menunr+1) + '">' + (this.treeiconsclosed[this.folders[menunr].type] ? this.treeiconsclosed[this.folders[menunr].type] : '&#61563;') + '</div>' + MFPImage.escapeHtml(this.folders[menunr].name) + '</div>';
      }
    }
    sHTML += '</div></div>';*/
  
    currDepth = -1;
    for(i=0; i<le; i++) {
      if(currDepth != me.folders[i].depth) {
        if(me.folders[i].depth > currDepth) {
          treeDivs[me.folders[i].depth] = document.createElement('div');
          if(me.folders[i].depth>0)
            treeDivs[me.folders[i].depth-1].appendChild(treeDivs[me.folders[i].depth]);
          if(i===0 || me.folders[i-1].open === true)
            treeDivs[me.folders[i].depth].style.display = 'inline';
          else
            treeDivs[me.folders[i].depth].style.display = 'none';
        }
        currDepth = me.folders[i].depth;
      }
      me.folders[i].elem = document.createElement('div');
      if(me.folders[i].hasChildren===true) {
        var tArrow = document.createElement('div');
        tArrow.className = 'mf-arrow';
        tArrow.style.marginLeft = (currDepth*13) + 'px';
        tArrow.dataset.idx = i;
        me.folders[i].elem.appendChild(tArrow);
        var tIcon = document.createElement('div');
        tIcon.className = 'mf-icon';
        tIcon.dataset.idx = i;
        me.folders[i].elem.appendChild(tIcon);
      } else {
        var tIcon = document.createElement('div');
        tIcon.className = 'mf-icon';
        tIcon.style.marginLeft = ((currDepth+1)*13) + 'px';
        tIcon.dataset.idx = i;
        me.folders[i].elem.appendChild(tIcon);
      }
      var tName = document.createTextNode(me.folders[i].name);
      me.folders[i].elem.appendChild(tName);              
      me.folders[i].elem.title = me.folders[i].name;
      
      me.folders[i].elem.className = 'mf_folder'; 
      if(me.folders[i].open)
        me.folders[i].elem.classList.add('mf-open');
      else 
        me.folders[i].elem.classList.add('mf-closed');

      if(i === me.selectedFolder)
        me.folders[i].elem.classList.add('mf-selected');
      me.folders[i].elem.dataset.idx = i;
      me.folders[i].elem.addEventListener('click', function(e) {_this.folderClick(_this, me, e);}, true);
      treeDivs[currDepth].appendChild(me.folders[i].elem);
    }
    me.foldertreeArea.appendChild(treeDivs[0]);
  },
  arrowClick: function(_this, me, e) {
    if(!e || !e.target || !e.target.dataset || typeof(e.target.dataset.idx)!=='string')
      return;
    e.stopPropagation();
    e.preventDefault();
    var idx = parseInt(e.target.dataset.idx, 10);
    if(me.folders[idx].open) {
      me.folders[idx].open = false;
      me.folders[idx].elem.classList.remove('mf-open');
      me.folders[idx].elem.classList.add('mf-closed');
      me.folders[idx].elem.nextElementSibling.style.display = 'none';
    } else {
      me.folders[idx].open = true;
      me.folders[idx].elem.classList.remove('mf-closed');
      me.folders[idx].elem.classList.add('mf-open');
      me.folders[idx].elem.nextElementSibling.style.display = 'inline';
    }
  },
  folderClick: function(_this, me, e) {
    if(e && e.target && e.target.className==='mf-arrow') {
      _this.arrowClick(_this, me, e);
      return;
    }
    if(!e || !e.target || !e.target.dataset || typeof(e.target.dataset.idx)!=='string')
      return;
    e.stopPropagation();
    e.preventDefault();
    var idx = parseInt(e.target.dataset.idx, 10);
    if(me.selectedFolder>=0) {
      me.folders[me.selectedFolder].elem.classList.remove('mf-selected');
    }
    me.selectedFolder = idx;
    me.folders[idx].elem.classList.add('mf-selected');
    if(me.folders[idx].hasChildren) {
      me.folders[idx].open = true;
      me.folders[idx].elem.classList.remove('mf-closed');
      me.folders[idx].elem.classList.add('mf-open');
      me.folders[idx].elem.nextElementSibling.style.display = 'inline';
    }
    _this.clickCallback(me, idx);
  }

  
};
