/**
 * @fileoverview The Rest Client of client.
 * @name Smith
 */

/**
 * kindFramework module
 * @module kindFramework
 * @augments ngRoute
 */

/**
 * Rich components의 Restful client
 *
 * @class RestClient
 * @augments $http
 * @augments SERVER
 * @memberof module:kindFramework
 * @example
 *   var node = new RestClient().setServer('node');
 *   node
 *    .get("/helloworld")
 *    .then(function(response){
 *      console.log(response.data);
 *    });
 */

kindFramework.
factory('RestClient', function($http, RESTCLIENT_CONFIG) {
  return function() {
    var _seconds = 10000;
    var _server = '';
    var _headers = {};

    var _ajax = function(method, url, headers, jsonData) {
      if (Object.keys(_headers).length > 0) {
        for (var key in headers) {
          _headers[key] = headers[key];
        }
      }

      var config = {
        method: method,
        url: _server + url,
        headers: headers,
        timeout: _seconds
      };

      if (typeof jsonData !== "undefined") {
        config.data = jsonData;
      }

      return $http(config);
    };

    var post = function(url, headers, jsonData) {
      return _ajax("POST", url, jsonData);
    };

    var get = function(url) {
      return _ajax("GET", url);
    };

    var put = function(url, headers, jsonData) {
      return _ajax("PUT", url, jsonData);
    };

    var del = function(url) {
      return _ajax("DELETE", url);
    };

    var setCommonHeader = function(name, value) {
      _headers[name] = value;
      return this;
    };

    var setRequestTimeout = function(seconds) {
      _seconds = seconds;
      return this;
    };

    var setServer = function(serverName) {
      var server = RESTCLIENT_CONFIG[serverName];
      _server = server.protocol + '://' + server.hostName;
      if (typeof server.port !== "undefined" && server.port !== null && server.port != '') {
        _server += ':' + server.port;
      }
      return this;
    };

    return {
      post: post,
      get: get,
      put: put,
      del: del,
      setCommonHeader: setCommonHeader,
      setRequestTimeout: setRequestTimeout,
      setServer: setServer
    };
  };
});