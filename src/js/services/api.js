/* Mediaflow main JS */
export default function MFAPI(baseURI, config)
{
  var accesstoken = '';
  var loading = 0;
  var client_id = '', client_secret = '', refresh_token = '', username = '';
  var authtype = 'refresh_token';

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

  function loadXHR(method, endpoint, postdata, success, fail, timeout)
  {
    var xhr = new XMLHttpRequest();
    if(endpoint==null || endpoint=='') {
      fail('ERR:Missing endpoint');
      return;
    }
    if(authtype === 'refresh_token' && accesstoken === '') {
      if(loading === 1) {
        setTimeout(function() {loadXHR(method, endpoint, postdata, success, fail, timeout);}, 200);
        return;
      }
      loading = 1;
      var sParams = 'grant_type=refresh_token&client_id=' + client_id + '&client_secret=' + client_secret + '&refresh_token=' + refresh_token;
      if(typeof(username) === 'string' && username.length>0)
        sParams += '&username=' + encodeURIComponent(username);
      xhr.open(method, baseURI + '/oauth2/token?' + sParams);
      xhr.onload = function() {
        if (xhr.readyState === 4) {
          if(xhr.status === 200) {
            try {
              var o = JSON.parse(xhr.responseText);
              accesstoken = o.access_token;
              setTimeout(function() {loadXHR(method, endpoint, postdata, success, fail, timeout);}, 0);
            } catch (e) {
              fail('ERR:' + method + ',AUTHJSON');
            }
          } else {
            fail('ERR:' + method + ',' + xhr.status);
          }
        }
      };
	    xhr.send(null);
      return;
    }
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
    if(authtype === 'refresh_token' || authtype === 'access_token') {
      if (endpoint.indexOf('?') > 0) {
        endpoint += '&access_token=' + accesstoken;
      } else {
        endpoint += '?access_token=' + accesstoken;
      }    
    }    
    xhr.open(method, baseURI + endpoint);
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
