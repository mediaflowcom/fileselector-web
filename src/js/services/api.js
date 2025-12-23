/* Mediaflow main JS */
export default function MFAPI(baseURI, config)
{
  var accesstoken = '';
  var tokentype = '';
  var expires = Date.now();
  var client_id = '', client_secret = '', refresh_token = '', username = '';
  var authtype = 'refresh_token';
  var loadingPromise = undefined;

  if(config.auth === 'mediaflowlogin') {
    authtype = 'tokencookie';
  } else {
    if(config.auth === 'accesstoken') {
      authtype = 'access_token';
      accesstoken = config.accesstoken;
    } else {
      client_id = config.client_id;
      client_secret = config.client_secret;
      refresh_token = config.refresh_token;
      username = config.username;
    }
  }

  // Ensure we have a valid access token before calling the API
  async function ensureAccessToken() {
    // If a token load is already in progress, wait for it...
    if (loadingPromise) {
      await loadingPromise;
    }

    loadingPromise = new Promise((resolve, reject) => {
      // Leave if no access token is necessary
      if(authtype !== 'refresh_token' && authtype !== 'access_token') {
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

      xhr.open('POST', 'https://accounts.mediaflow.com/oauth2/token');
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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

    return loadingPromise;
  }

  function loadXHR(method, endpoint, postdata, success, fail, timeout)
  {
    var xhr = new XMLHttpRequest();
    if(endpoint==null || endpoint=='') {
      fail('ERR:Missing endpoint');
      return;
    }

    ensureAccessToken()
    .then(() => {
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
          if(xhr.status === 200 || xhr.status === 201) {
            try {
              var o = JSON.parse(xhr.responseText);
              setTimeout(function(){success(o);}, 0);
            } catch (e) {
              fail('ERR:' + method + ',JSON');
            }
          } else {
            fail('ERR:' + method + ',' + xhr.status);
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
  }

  return {
    get: function(endpoint, success, fail, timeout) {
      loadXHR('GET', endpoint, null, success, fail, timeout);
    },
    post: function(endpoint, postdata, success, fail, timeout) {
      loadXHR('POST', endpoint, postdata, success, fail, timeout);
    },
    put: function(endpoint, postdata, success, fail, timeout) {
      loadXHR('PUT', endpoint, postdata, success, fail, timeout);
    }
  };
}
