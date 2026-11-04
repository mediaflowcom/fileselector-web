/* Mediaflow main JS */
export default function MFAPI(baseURI, config)
{
  var accesstoken = '';
  var tokentype = '';
  var expires = Date.now();
  var client_id = '', client_secret = '', refresh_token = '', username = '';
  var authtype = 'refresh_token';
  var loadingPromise = undefined;
  // Optional async callback (auth 'accesstoken') that returns a fresh token from the integration's backend.
  var tokenProvider = typeof(config.getAccessToken) === 'function' ? config.getAccessToken : undefined;

  if(config.auth === 'mediaflowlogin') {
    authtype = 'tokencookie';
  } else {
    if(config.auth === 'accesstoken') {
      authtype = 'access_token';
      accesstoken = typeof(config.accesstoken) === 'string' ? config.accesstoken : '';
      // A static token has no known expiry: it is used until the API answers 401
      // (then getAccessToken is called, if given).
      expires = accesstoken !== '' ? Infinity : 0;
    } else {
      client_id = config.client_id;
      client_secret = config.client_secret;
      refresh_token = config.refresh_token;
      username = config.username;
    }
  }

  // Accepts what getAccessToken resolves to: a token string, or { access_token, expires_in?, token_type? }.
  function normalizeTokenResult(result) {
    if (typeof(result) === 'string' && result.length > 0) {
      return { access_token: result };
    }
    if (result && typeof(result) === 'object' && typeof(result.access_token) === 'string' && result.access_token.length > 0) {
      return result;
    }
    throw 'ERR:ACCESSTOKEN,INVALID';
  }

  // Drop the current token so the next request fetches a new one. Only when it is the token the failed
  // request was sent with, so parallel 401s don't throw away a token that was just renewed.
  function invalidateAccessToken(usedToken) {
    if (usedToken === accesstoken) {
      accesstoken = '';
      expires = 0;
    }
  }

  function canRenewAccessToken() {
    return authtype === 'refresh_token' || (authtype === 'access_token' && !!tokenProvider);
  }

  // Ensure we have a valid access token before calling the API
  async function ensureAccessToken() {
    // If a token load is already in progress, return it.
    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = new Promise((resolve, reject) => {
      // Leave if no access token renewal is necessary
      if(authtype === 'access_token') {
        if (!tokenProvider || (accesstoken !== '' && Date.now() < (expires - 30000))) {
          if (tokentype === '') {
            tokentype = 'Bearer';
          }
          resolve();
          return;
        }
        Promise.resolve()
        .then(function() { return tokenProvider(); })
        .then(function(result) {
          var o = normalizeTokenResult(result);
          var expiresIn = Number(o.expires_in);
          accesstoken = o.access_token;
          tokentype = typeof(o.token_type) === 'string' && o.token_type.length > 0 ? o.token_type : 'Bearer';
          expires = expiresIn > 0 ? Date.now() + expiresIn * 1000 : Infinity;
          resolve();
        })
        .catch(function(e) {
          console.error('getAccessToken failed', e);
          reject(typeof(e) === 'string' && e.indexOf('ERR:') === 0 ? e : 'ERR:ACCESSTOKEN');
        });
        return;
      }
      if(authtype !== 'refresh_token') {
        resolve();
        return;
      }

      // Leave if we already have a valid token
      if(accesstoken !== '' && Date.now() < (expires - 5000)) {
        resolve();
        return;
      }

      var xhr = new XMLHttpRequest();
      var body = new URLSearchParams();
      body.append("grant_type", "refresh_token");
      body.append("client_id", client_id);
      body.append("client_secret", client_secret);
      body.append("refresh_token", refresh_token);
      if(typeof(username) === 'string' && username.length > 0) {
        body.append("username", username);
      }

      xhr.open('POST', config.oauthTokenUrl || (config.oauthBase + '/oauth2/token'));
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onerror = function() {
        reject('ERR:POST,AUTHJSON');
      };
      xhr.onload = function() {
        if (xhr.readyState === 4) {
          if(xhr.status === 200) {
            try {
              var o = JSON.parse(xhr.responseText);
              expires = Date.now() + (o.expires_in * 1000);
              accesstoken = o.access_token;
              tokentype = o.token_type;
              resolve();
            } catch (e) {
              reject('ERR:POST,AUTHJSON');
            }
          } else {
            reject('ERR:POST,AUTHJSON,' + xhr.status);
          }
        }
      };
      xhr.send(body);
    });

    var currentLoadingPromise = loadingPromise;
    currentLoadingPromise.then(function() {
      if (loadingPromise === currentLoadingPromise) {
        loadingPromise = undefined;
      }
    }, function() {
      if (loadingPromise === currentLoadingPromise) {
        loadingPromise = undefined;
      }
    });

    return loadingPromise;
  }

  function loadXHR(method, endpoint, postdata, success, fail, timeout, readTotalCount, isRetry)
  {
    var xhr = new XMLHttpRequest();
    if(endpoint==null || endpoint=='') {
      fail('ERR:Missing endpoint');
      return;
    }
    var originalEndpoint = endpoint;

    ensureAccessToken()
    .then(() => {
      var usedToken = accesstoken;
      if(endpoint.substring(0,1) !== '/') {
        endpoint = '/' + endpoint;
      }
      if(authtype === 'tokencookie') {
        xhr.withCredentials = true;
        if (endpoint.indexOf('?') > 0) {
          endpoint += '&tok=1';
        } else {
          endpoint += '?tok=1';
        }
      }
      xhr.open(method, baseURI + endpoint);
      if(authtype === 'refresh_token' || authtype === 'access_token') {
        xhr.setRequestHeader('Authorization', `${tokentype} ${accesstoken}`); 
      }
      if (method == 'POST' || method == 'PUT') {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      if(typeof timeout === 'number') {
        xhr.timeout = timeout;
        xhr.ontimeout = function () {
          fail('ERR:Timeout');
        };
      }    
      xhr.onload = function() {
        if (xhr.readyState === 4) {
          // 202 Accepted: e.g. a new CDN resource. 204 No Content: e.g. DELETE.
          if(xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 204) {
            if (xhr.status === 204 || xhr.responseText === '') {
              setTimeout(function(){success(null, null);}, 0);
              return;
            }
            try {
              var o = JSON.parse(xhr.responseText);
              var totalCount = null;
              if (readTotalCount === true) {
                var totalCountHeader = xhr.getResponseHeader('X-Total-Count');
                totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : null;
              }
              setTimeout(function(){success(o, totalCount);}, 0);
            } catch (e) {
              fail('ERR:' + method + ',JSON');
            }
          } else if (xhr.status === 401 && !isRetry && canRenewAccessToken()) {
            // Token expired or revoked: renew it and try once more.
            invalidateAccessToken(usedToken);
            loadXHR(method, originalEndpoint, postdata, success, fail, timeout, readTotalCount, true);
          } else {
            // Second argument gives callers that need it the raw status and error body (e.g. the CDN API returns plain-text errors)
            fail('ERR:' + method + ',' + xhr.status, { status: xhr.status, body: xhr.responseText });
          }
        }
      };
      if (typeof postdata === 'object') {
        xhr.send(JSON.stringify(postdata));
      } else {
        xhr.send(null);
      }
    }, (error) => {
      fail(error);
    });
    xhr.onerror = function() {
      fail('ERR:' + method + ',NETWORK', { status: 0, body: '' });
    };
  }

  return {
    get: function(endpoint, success, fail, timeout, readTotalCount) {
      loadXHR('GET', endpoint, null, success, fail, timeout, readTotalCount === true);
    },
    post: function(endpoint, postdata, success, fail, timeout) {
      loadXHR('POST', endpoint, postdata, success, fail, timeout);
    },
    put: function(endpoint, postdata, success, fail, timeout) {
      loadXHR('PUT', endpoint, postdata, success, fail, timeout);
    }
  };
}
