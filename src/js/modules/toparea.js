/* Mediaflow File Selector */


export default {
  me: {},
  init: function (me, clickCallback) {
    this.clickCallback = clickCallback;
    this.me = me;
    this.renderSearchBox(me, this);
    this.renderLogo(me);
  },
  renderLogo: function (me) {
    const logo = Object.assign(document.createElement("div"), {
      className: "mf_logo",
      innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="24" viewBox="0 0 50 24">
      <path shape-rendering="geometricPrecision" d="M44.263,21.92a5.15,5.15,0,0,1-4.333-2.352L38.071,16.8,40,13.914a5.142,5.142,0,1,1,4.261,8.006Zm0-11.826a6.751,6.751,0,0,0-5.576,2.939l-1.569,2.341L29.985,4.731l-5.151,7.687L16.512,0,1,23.146H2.905l13.607-20.3,7.37,11-6.24,9.307h1.905l5.287-7.886,2.712,4.047h1.905l-3.665-5.469,4.2-6.265L36.166,16.8l-4.256,6.35h1.905l3.3-4.929,1.486,2.218a6.725,6.725,0,1,0,5.658-10.34Z" transform="translate(-1)" fill="currentColor" fill-rule="evenodd"></path>
      </svg>`,
      title: `v.${FS_VERSION}`
    });

    me.topArea.appendChild(logo);
  },
  renderSearchBox: function (me, _this) {
    me.topArea.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'mf-search-wrapper';

    var sb = document.createElement('input');
    sb.setAttribute('type', 'text');
    sb.className = 'mf-search-bar';
    sb.addEventListener('keypress', function (e) {
      if (e.key == 'Enter') {
        const aiSearch = document.getElementById("ai-switch")?.checked ?? false;
        _this.clickCallback(me, sb.value, aiSearch);
      }
      else {
        return false;
      }
    });
    div.appendChild(sb);

    const lookingGlass =
      `<div id="mf-looking-glass" class="mf-looking-glass">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
        </svg>
      </div>`;
    div.insertAdjacentHTML('beforeend', lookingGlass);
    renderAiSwitch(me, div);
    me.topArea.appendChild(div);
  }
};

function renderAiSwitch(me, div) {
  if(me.config.aiSearchDisabled === true){
    return;
  }

  me.api.get('/users/me?fields=activeModules',
    function (result) {
      if (!result || !result[0]) {
        console.error('Error: Invalid response from /users/me');
        return;
      }
      me.customerId = result[0].customerId;
      const valuesToCheck = ["ai_assisted_search_default", "ai_generated_keywords"];
      const aiSearchActivatedInMF = valuesToCheck.every(value => result[0].activeModules.includes(value));
     
      if (aiSearchActivatedInMF) {
        const aiToggle =
          `<div class="mf-ai-switch">AI
          <input id="ai-switch" type="checkbox" onchange="document.querySelector('.mf-search-bar')?.focus()">
          <label for="ai-switch" title="${me.lang.translate("TOPBAR_SEARCH_AI_SWITCH")}"></label>
        </div>`;
        div.insertAdjacentHTML('beforeend', aiToggle);
      }
    },
    function (result) { console.error('Error: Failed to get users data'); }
  )
}
