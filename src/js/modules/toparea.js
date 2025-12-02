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
      innerHTML: `<svg width="37" viewBox="0 0 94 75" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M27.0999 42.8144C25.2299 41.5443 22.0299 41.5644 20.5299 44.4343C20.5299 44.4343 19.8199 45.7743 18.6199 47.7644C16.7799 50.8144 13.5399 54.3343 10.5799 53.6243C8.56987 53.1443 7.88987 51.0243 7.72987 50.4743C6.41987 46.1343 10.5999 38.1443 17.4799 37.0343C27.6599 35.4043 33.8899 47.3743 38.4699 54.3043C41.8699 59.4443 45.5599 64.1443 50.5099 68.0443C57.0899 73.3643 66.0999 76.0144 74.4599 73.8543C88.3299 70.1943 93.3699 56.3344 93.4399 43.2043C93.4399 42.2043 93.6199 37.2043 93.7899 32.6343C93.9699 27.7143 91.3099 23.1243 86.9499 20.8343C81.9599 18.2243 75.8099 19.9543 72.9099 24.7843L68.3799 32.3443C67.8399 33.2444 66.4499 32.8443 66.4699 31.7943L66.7899 16.1043C66.9099 10.0143 63.5799 4.37435 58.1799 1.54435C51.5799 -1.91565 43.4299 0.634348 39.9699 7.23435C34.5199 17.6443 28.3199 29.4843 27.5999 30.8543C24.9299 29.6743 21.8799 28.9843 18.3999 29.1843C6.87987 29.8743 -1.54013 41.7843 0.239869 51.6643C1.15987 56.7743 5.04987 60.9343 10.2799 61.5543C13.7599 61.9943 17.2099 60.7243 19.9199 58.6044C21.8199 57.1143 24.5199 54.1643 30.0699 45.8243C30.0699 45.8243 28.6399 43.8543 27.1099 42.8043L27.0999 42.8144ZM80.4299 59.1243C75.6999 66.7943 66.0799 67.5144 58.6699 63.3443C51.4899 59.2243 46.9099 52.2743 42.2299 45.4843C40.1999 42.4943 38.1399 39.6343 35.8099 37.0943C38.1099 33.5844 44.3699 24.0843 49.3299 16.5343C50.7699 14.3443 54.1699 15.3443 54.1999 17.9643L54.4199 37.3443C54.4799 42.4543 57.3399 47.1244 61.8699 49.4944C66.1499 51.7344 71.4399 50.1643 73.7999 45.9443L79.9799 34.8943C80.9199 33.2143 83.4799 33.8244 83.5599 35.7444C83.6999 39.1644 83.8499 42.7143 83.8599 43.2543C83.9299 48.7243 83.3699 54.4643 80.4299 59.1243Z" fill="currentColor" />
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
