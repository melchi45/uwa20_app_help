/* global CryptoJS */
kindFramework.factory('SunapiClient', function (RESTCLIENT_CONFIG, $location, $q, SessionOfUserManager,ModalManagerService, $timeout, SunapiConverter)
{
    'use strict';

    var digestInfo = undefined;
    var usrName = '';
    var passWord = '';

    var sunapiClient = {};

    var sequencenum = 0;

    var debugMode = false;

   if (RESTCLIENT_CONFIG.serverType === 'camera'){
        RESTCLIENT_CONFIG.digest.hostName = window.location.hostname;
        RESTCLIENT_CONFIG.digest.port = window.location.port;
        var loc_protocol = window.location.protocol;
        var splitProt =loc_protocol.split(":");
        RESTCLIENT_CONFIG.digest.protocol = splitProt[0];
    }else{
      try{
        debugMode = RESTCLIENT_CONFIG.debugMode;
      }catch(e){
        console.error(e);
      }
    }


    sunapiClient.post = function (_url, jsonData, SuccessFn, FailFn, $scope, fileData, specialHeaders)
    {
        var url = _url;
        if (typeof jsonData !== 'undefined')
        {
            url += jsonToText(jsonData);
        }

        return ajax_async("POST", url, SuccessFn, FailFn, $scope, fileData, specialHeaders);
    };

    sunapiClient.get = function (_url, jsonData, SuccessFn, FailFn, $scope, isAsyncCall, isText)
    {
        var url = _url;
        if (typeof jsonData !== 'undefined')
        {
            url += jsonToText(jsonData);

            if(url.indexOf("attributes.cgi") === -1)
            {
               url += "&SunapiSeqId=" + sequencenum++;
            }

            if(sequencenum > 100000)
            {
               sequencenum = 0;
            }
        }

        if (url.indexOf("configbackup") !== -1 || isAsyncCall === true)
        {
            return ajax_async("GET", url, SuccessFn, FailFn, $scope, '', '', isText);
        }
        else
        {
            return ajax_sync("GET", url, SuccessFn, FailFn, isText);
        }
    };

    /**
     * SUNAPI 요청을 순서대로 요청을 하고 싶을 때 사용하는 함수.
     * @param {Array} queue 데이터 요청
     * @param {String} queue[<Index>].url 요청 URL
     * @param {Object} queue[<Index>].reqData 요청 JSON 데이터
     * @param {Function} queue[<Index>].successCallback 해당 요청이 끝날 때 실행, 없어도 됨.
     * @param {Function} successCallback 모든 요청이 끝날 때 Success Callback
     * @param {Function} errorCallback 요청 마다 Error가 생길 때 Error Callback
     * @example
        var setData = {};
        setData.NormalMode = $scope.RecordGeneralInfo[$scope.Channel].NormalMode;
        setData.EventMode = $scope.RecordGeneralInfo[$scope.Channel].EventMode;
        SunapiClient.seqence([
          {
            url: '/stw-cgi/recording.cgi?msubmenu=general&action=set',
            reqData: setData,
            successCallback: function(response){
              pageData.RecordGeneralInfo = angular.copy($scope.RecordGeneralInfo);
            }
          },
          {
            url: '/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=set',
            reqData: {}
          }
        ], function(response){
          //Success
        }, function(errorCode){
          console.error(errorCode);
        });
     */
    sunapiClient.sequence = function(queue, successCallback, errorCallback){
        var currentItem = queue.shift();
        if(typeof currentItem === "undefined") {return;}

        sunapiClient.get(
            currentItem.url, 
            currentItem.reqData, 
            function(response){
              if("successCallback" in currentItem){
                currentItem.successCallback(response);
              }
            }, 
            errorCallback, 
            '', 
            true
        ).then(reqCallback, reqCallback);

        function reqCallback(){
            if(queue.length > 0){
                sunapiClient.sequence(queue, successCallback, errorCallback);
            }else{
                successCallback();
            }
        }
    };

    /*--------------------- Start sunapiClient.file export ---------------- */
    sunapiClient.file = function (url, successFn, failFn, $scope, fileData, specialHeaders)
    {
        var method = 'POST';
        var deferred = $q.defer();
        var wwwAuthenticate = '';

        if (SessionOfUserManager.IsLoggedin() === true){
            usrName = SessionOfUserManager.getUsername();
            passWord = SessionOfUserManager.getPassword();
        }else{
            loginRedirect();
            return;
        }

        var restClientConfig = RESTCLIENT_CONFIG.digest;
        var server = restClientConfig.protocol + '://' +  restClientConfig.hostName;
        if (typeof restClientConfig.port !== 'undefined' && restClientConfig.port !== null && restClientConfig.port !== ''){
            server += ':' + restClientConfig.port;
        }

        var xhr = new XMLHttpRequest();
        xhr.open(method, server + url, true);
        xhr.responseType = 'arraybuffer';

        if(RESTCLIENT_CONFIG.serverType === 'camera'){
            //xhr.setRequestHeader('XClient', 'XMLHttpRequest');
            xhr.withCredentials = true;
        }

        if (wwwAuthenticate !== '' && typeof wwwAuthenticate !== "undefined"){
            digestInfo = getDigestInfoInWwwAuthenticate(wwwAuthenticate);
            setDigestHeader(xhr, method, url, digestInfo);
        }else{
            if (typeof digestInfo !== 'undefined' && digestInfo !== 'undefined'){
                setDigestHeader(xhr, method, url, digestInfo);
            }
        }

        setupAsyncCall(xhr, method, $scope, url, failFn);

        if(typeof specialHeaders !== 'undefined'){
            var hdrindex = 0;
            for (hdrindex = 0; hdrindex < specialHeaders.length; hdrindex = hdrindex + 1){
                xhr.setRequestHeader(specialHeaders[hdrindex].Type,specialHeaders[hdrindex].Header);
            }
        }

        xhr.onreadystatechange = function (){
            if (this.readyState === 4){
                if (this.status === 401){
                    var wwwAuthenticate = this.getResponseHeader('www-authenticate');
                    console.log("async wwwAuthenticate : ", wwwAuthenticate);

                    var restClientConfig = RESTCLIENT_CONFIG.digest;
                    var server = restClientConfig.protocol + '://' +  restClientConfig.hostName;
                    if (typeof restClientConfig.port !== 'undefined' && restClientConfig.port !== null && restClientConfig.port !== ''){
                        server += ':' + restClientConfig.port;
                    }

                    var xhr = new XMLHttpRequest();
                    xhr.open(method, server + url, true);
                    xhr.responseType = 'arraybuffer';

                    if(RESTCLIENT_CONFIG.serverType === 'camera'){
                        //xhr.setRequestHeader('XClient', 'XMLHttpRequest');
                        xhr.withCredentials = true;
                    }

                    if (wwwAuthenticate !== '' && typeof wwwAuthenticate !== "undefined"){
                        digestInfo = getDigestInfoInWwwAuthenticate(wwwAuthenticate);
                        setDigestHeader(xhr, method, url, digestInfo);
                    }else{
                        if (typeof digestInfo !== 'undefined' && digestInfo !== 'undefined'){
                            setDigestHeader(xhr, method, url, digestInfo);
                        }
                    }
                    setDigestHeader(xhr, method, url, digestInfo);

                    setupAsyncCall(xhr, method, $scope, url, failFn);

                    xhr.onreadystatechange = function (){
                        if (this.readyState === 4){
                            if (this.status === 200){
                                if (typeof this.response !== 'undefined' && this.response !== ""){
                                    parseResponse(this, successFn, failFn, true);
                                    deferred.resolve('Success');
                                }else{
                                    failFn("No response");
                                    deferred.reject('Failure');
                                }
                            }else{
                                if(this.status === 490){
                                    ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
                                    loginRedirect();
                                }
                                failFn("HTTP Error : ", this.status);
                                deferred.reject('Failure');
                            }
                        }
                    };

                    if(RESTCLIENT_CONFIG.serverType === 'grunt') {
                      console.log(url);
                    }
                    if (typeof fileData !== 'undefined' && fileData !== null && fileData !== ''){
                        xhr.send(fileData);
                    }else{
                        xhr.send();
                    }
                }else{
                    if (this.status === 200){
                        if (typeof this.response !== 'undefined' && this.response !== ""){
                            parseResponse(this, successFn, failFn, true);
                            deferred.resolve('Success');
                        }else{
                            failFn("No response");
                            deferred.reject('Failure');
                        }
                    }else{
                        if(this.status === 490){
                            ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
                            loginRedirect();
                        }
                        failFn("HTTP Error : ",this.status);
                        deferred.reject('Failure');
                    }
                }
            }
        };

        if(RESTCLIENT_CONFIG.serverType === 'grunt') {
          console.log(url);
        }
      if (
        typeof fileData !== 'undefined' &&
        fileData !== null && fileData !== ''
        ) {
        xhr.send(fileData);
      } else {
        xhr.send();
      }

      return deferred.promise;
    };
    //*--------------------- End sunapiClient.file export ---------------- */

    var mobile = {

      TIMEOUTCOUNT : 30000,

      mc : function(url, connect_info, SuccessFn, FailFn) {
        var reqURL = "";
        var xhr = new XMLHttpRequest();
        var auth = false;
        var isTimeout = false;

        reqURL = connect_info.host + url;
        usrName = connect_info.rtsp_id;
        passWord = connect_info.rtsp_pwd;
        console.log("%c request sunapi -> " + reqURL + " ", "color:#61BD4F");

        xhr = mobile.makeNewRequest(connect_info, url, '');
        console.log(xhr);

        // Mobile safari ( for iOS )
        if(Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
          xhr.onload = xhr.onabort = function ()  {
            if (this.status === 401) {
              var wwwAuthenticate = this.getResponseHeader('www-authenticate');
              console.log("async wwwAuthenticate : ", wwwAuthenticate);

              var xhr = mobile.makeNewRequest(connect_info, url, wwwAuthenticate);
              setDigestHeader(xhr, 'POST', url, digestInfo);

              xhr.onload = xhr.onabort = function() {
                isTimeout = false;
                if (this.status === 200) {
                  if (typeof this.response !== 'undefined' && this.response !== "") {
                      var result = {};

                      if (this.responseType === 'arraybuffer' || this.responseXML !== null) {
                        result.data = this.response;
                        SuccessFn(result);
                      } else {
                        // console.log("before convert", this.response);
                        var resp = mobile.parse(url, this.response);
                        console.log("after convert", resp);

                        result.data = resp;
                        if (result.data.Response === "Fail") {
                          FailFn(result.data);
                        } else {
                          SuccessFn(result);
                        }
                      }
                  } else {
                    FailFn("No response");
                  }
                } else {
                  FailFn(xhr.status);
                }
              };

              xhr.onerror = function () { FailFn(xhr.status); };
              xhr.ontimeout = function() {  FailFn(408);  }

              if(auth) {
                xhr.open('GET', reqURL, false, usrName, passWord);
              } else {
                xhr.open('GET', reqURL, true, usrName, passWord);
                xhr.timeout = mobile.TIMEOUTCOUNT;
              }

              xhr.setRequestHeader('Accept', 'application/json');
              xhr.setRequestHeader('Cache-Control', 'no-cache');
              xhr.send();
            } else if (this.status === 404) {
              FailFn("Not found");
            } else {
              isTimeout = false;
              if (this.status === 200) {
                if (typeof this.response !== 'undefined' && this.response !== "") {
                  var result = {};
                  // console.log("RESULT : " + this.response);
                  if (this.responseType === 'arraybuffer' || this.responseXML !== null) {
                    result.data = this.response;
                    SuccessFn(result);
                  } else {
                    // console.log("before convert", this.response);
                    var resp = mobile.parse(url, this.response);
                    console.log("after convert", resp);

                    result.data = resp;
                    if (result.data.Response === "Fail") {
                      FailFn(result.data);
                    } else {
                      SuccessFn(result);
                    }
                  }
                } else {
                  FailFn("No response");
                }
              }
            }
          };
          xhr.onerror = function () { FailFn(xhr.status); };
          xhr.ontimeout = function() { FailFn(408); }

        // Mobile Chrome
        } else {
          isTimeout = false;
          xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
              if (this.status === 401) {
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function () {
                  if (this.readyState === 4) {
                    if (this.status === 200) {
                      if (typeof this.response !== 'undefined' && this.response !== "") {
                        var result = {};
                        if (this.responseType === 'arraybuffer' || this.responseXML !== null) {
                          result.data = this.response;
                          SuccessFn(result);
                        } else {
                          // console.log("before convert", this.response);
                          var resp = mobile.parse(url, this.response);
                          console.log("after convert", resp);

                          result.data = resp;
                          if (result.data.Response === "Fail") {
                            FailFn(result.data);
                          } else {
                            SuccessFn(result);
                          }

                        }
                      } else {
                        FailFn("No response");
                      }
                    } else {
                      FailFn(xhr.status);
                    }
                  }
                };

                // if(auth) {
                //   xhr.open('GET', reqURL, false, usrName, passWord);
                // } else {
                  xhr.open('GET', reqURL, true, usrName, passWord);
                  xhr.timeout = mobile.TIMEOUTCOUNT;
                // }

                xhr.setRequestHeader('Accept', 'application/json');
                xhr.ontimeout = function() { FailFn(408); }
                xhr.send();
              } else {
                if (this.status === 200) {
                  if (typeof this.response !== 'undefined' && this.response !== "") {
                    var result = {};

                    if (this.responseType === 'arraybuffer' || this.responseXML !== null) {
                      result.data = this.response;
                      SuccessFn(result);
                    } else {
                      // console.log("before convert", this.response);
                      var resp = mobile.parse(url, this.response);
                      console.log("after convert", resp);

                      result.data = resp;
                      if (result.data.Response === "Fail") {
                        FailFn(result.data);
                      } else {
                        SuccessFn(result);
                      }
                    }
                  } else {
                    FailFn("No response");
                  }
                }
              }
            }
          };
        }

        // if(auth) {
        //   xhr.open('GET', reqURL, false, 'user', 'password');
        // } else {
          xhr.open('GET', reqURL, true, usrName, passWord);
          xhr.timeout = mobile.TIMEOUTCOUNT;
        // }
        xhr.ontimeout = function() { FailFn(408); }
        xhr.onerror = function () { FailFn(xhr.status); };
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Cache-Control', 'no-cache');

        if(Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
          var process = $timeout(function() {
            isTimeout = true;
            xhr.send();
          }, 200);

          if(auth) {
            $timeout(function() {
              if(isTimeout) {
                $timeout.cancel(process);
                FailFn('408');
              }
            }, mobile.TIMEOUTCOUNT);
          }
        } else {
          xhr.send();
        }
      },

      parse : function(url, response) {
        var result = '';

          try {
            result = JSON.parse(response);
          } catch(e) {
            if(response.indexOf('html') === -1) {
              console.log("START SUNAPI 2.0 Converter");
              result = SunapiConverter.covert(url, response);
            } else {
              console.log("START HTML Converter");
              var url_info = $('<div></div>').append(response).find('meta').attr('content');
              url_info = url_info.substring(url_info.indexOf('htt'), url_info.length);
              result = url_info;
            }
          }

          return result;
      },

      makeNewRequest : function(connect_info, url, wwwAuthenticate, isText) {
        var server = connect_info.host + url;
        var xhr = new XMLHttpRequest();

        xhr.open('POST', server, true, connect_info.rtsp_id, connect_info.rtsp_pwd);

        if(connect_info.model_type === 'nwc') {
            xhr.withCredentials = true;
        }

        if(!isText){
          xhr.setRequestHeader('Accept', 'application/json');
        }

        return xhr;
      },

    };

    sunapiClient.mobile = function(url, device_info) {
      var deferred = $q.defer();

      mobile.mc(url, device_info, 
        function(success) {
          deferred.resolve(success);
        }, function(error){ 
          deferred.reject(error);
      });

      return deferred.promise;
    }

    function setDigestHeader(xhr, method, url, digestCache)
    {
        var responseValue = null;
        var digestAuthHeader = null;
        if (digestCache.scheme.toLowerCase() === 'digest')
        {
            digestCache.nc = digestCache.nc + 1;
            digestCache.cnonce = generateCnonce();

            responseValue = formulateResponse(usrName, passWord, url, digestCache.realm, method.toUpperCase(), digestCache.nonce, digestCache.nc, digestCache.cnonce, digestCache.qop);

            digestAuthHeader = digestCache.scheme + ' ' + 'username="' + usrName + '", ' + 'realm="' + digestCache.realm + '", ' + 'nonce="' + digestCache.nonce + '", ' + 'uri="' + url + '", ' + 'cnonce="' + digestCache.cnonce + '" ' + 'nc=' + decimalToHex(digestCache.nc, 8) + ', ' + 'qop=' + digestCache.qop + ', ' + 'response="' + responseValue + '"';

            xhr.setRequestHeader("Authorization", digestAuthHeader);
        }
        else if (digestCache.scheme.toLowerCase() === 'xdigest')
        {
            digestCache.nc = digestCache.nc + 1;
            digestCache.cnonce = generateCnonce();

            responseValue = formulateResponse(usrName, passWord, url, digestCache.realm, method.toUpperCase(), digestCache.nonce, digestCache.nc, digestCache.cnonce, digestCache.qop);

            digestAuthHeader = digestCache.scheme + ' ' + 'username="' + usrName + '", ' + 'realm="' + digestCache.realm + '", ' + 'nonce="' + digestCache.nonce + '", ' + 'uri="' + url + '", ' + 'cnonce="' + digestCache.cnonce + '" ' + 'nc=' + decimalToHex(digestCache.nc, 8) + ', ' + 'qop=' + digestCache.qop + ', ' + 'response="' + responseValue + '"';

            xhr.setRequestHeader("Authorization", digestAuthHeader);
        }
        else if (digestCache.scheme.toLowerCase() === 'basic')
        {
            digestAuthHeader = digestCache.scheme + ' ' + btoa(usrName + ':' + passWord);

            xhr.setRequestHeader("Authorization", digestAuthHeader);
        }
    }

    function parseResponse(xhr, successFn, failFn, isText)
    {
        var result = {};

        if (xhr.responseType === 'arraybuffer' || xhr.responseXML !== null || isText)
        {
            result.data = xhr.response;
            successFn(result);
        }
        else
        {
          var resp = '';
          try{
             resp = JSON.parse(xhr.response);
           }
           catch(e)
           {
            failFn("Error Parsing response");
            return;
           }

            if (typeof resp === 'object')
            {
                result.data = resp;

                if (result.data.Response === "Fail")
                {
                    if(typeof result.data.OpenSDKError === 'undefined'){
                        failFn(result.data.Error.Details,result.data.Error.Code);
                    }else{
                        failFn(result.data.Error.Details,result.data.Error.Code,result.data.OpenSDKError);
                    }
                }
                else
                {
                    successFn(result);
                }
            }
            else
            {
                result.data = xhr.response;
                successFn(result);
            }
        }
    }

    function setupAsyncCall(xhr, method, callbackList, url, failFn)
    {
        var onErrorEvent = function ()
        {
            failFn("Network Error");
        };

        if (typeof callbackList !== 'undefined' && callbackList !== '')
        {
            if (typeof callbackList.ProgressEvent !== 'undefined')
            {
                xhr.upload.addEventListener("progress", callbackList.ProgressEvent, false);
            }

            if (typeof callbackList.CompleteEvent !== 'undefined')
            {
                xhr.addEventListener("load", callbackList.CompleteEvent, false);
            }

            if (typeof callbackList.CancelEvent !== 'undefined')
            {
                xhr.addEventListener("abort", callbackList.CancelEvent, false);
            }

            if (typeof callbackList.FailEvent !== 'undefined')
            {
                xhr.addEventListener("error", callbackList.FailEvent, false);
            }
            else
            {
                xhr.addEventListener("error", onErrorEvent, false);
            }
        }

        if (method === 'POST')
        {
          if(url.indexOf("firmwareupdate") !== -1){
            xhr.timeout = 420000;
          }else{
            xhr.timeout = 300000;
          }
        }
        else if (url.indexOf("configbackup") !== -1)
        {
            xhr.timeout = 30000;
        }
        else if (url.indexOf("ptzconfig.cgi") !== -1)
        {
            xhr.timeout = 30000;
        }
        else
        {
            xhr.timeout = 10000;
        }

        if (url.indexOf("configbackup") !== -1)
        {
            xhr.responseType = 'arraybuffer';
        }
    }

    function makeNewRequest(method, url, isAsync, wwwAuthenticate, isText)
    {
        var restClientConfig = RESTCLIENT_CONFIG.digest;

        var server = restClientConfig.protocol + '://' +  restClientConfig.hostName;

        if (typeof restClientConfig.port !== 'undefined' && restClientConfig.port !== null && restClientConfig.port !== '')
        {
            server += ':' + restClientConfig.port;
        }

        if(RESTCLIENT_CONFIG.serverType === 'camera'){
          server = '..';
        }

        var xhr = new XMLHttpRequest();
        xhr.open(method, server + url, isAsync);


        //if(SessionOfUserManager.IsWMFApp() === true  && RESTCLIENT_CONFIG.serverType === 'camera' &&
        if(RESTCLIENT_CONFIG.serverType === 'camera')
        {
            //Added for same origin request, now using custom digest to avoid browser hang and popups
            //xhr.setRequestHeader('XClient', 'XMLHttpRequest');
            xhr.withCredentials = true;

        }

        if(!isText){
          xhr.setRequestHeader('Accept', 'application/json');
        }

        /** If there is a new Challenge from server, update the local digest cache  */
        if(RESTCLIENT_CONFIG.serverType === 'grunt')
        {
          if (wwwAuthenticate !== '' && typeof wwwAuthenticate !== "undefined")
          {
              digestInfo = getDigestInfoInWwwAuthenticate(wwwAuthenticate);
              setDigestHeader(xhr, method, url, digestInfo);
          }
          else
          {
              /** Sometime the digest issued by the server becomes invalid,
              we need to request new digest from server again */
              if (typeof digestInfo !== 'undefined' && digestInfo !== 'undefined')
              {
                  setDigestHeader(xhr, method, url, digestInfo);
              }
          }
        }
        return xhr;
    }

    sunapiClient.clearDigestCache = function () {
        console.log('Clearing the Diegest cache !!!!!!!!!!!! ');
        digestInfo = undefined;
    };

    function handleAccountBlock(failFn)
    {
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
        loginRedirect();
        if(SessionOfUserManager.IsLoginSuccess() === false)
        {

            failFn("HTTP Error : ", syncXhr.status);
            console.log("After calling Account block fail fn");
        }
    }
    var syncXhr = null;
    var ajax_sync = function (method, url, successFn, failFn, isText)
    {
        if(RESTCLIENT_CONFIG.serverType === 'grunt')
  {
          if (SessionOfUserManager.IsLoggedin() === true)
          {
              usrName = SessionOfUserManager.getUsername();
              passWord = SessionOfUserManager.getPassword();
          }
          else
          {
              loginRedirect();
              return;
          }
  }
        syncXhr = makeNewRequest(method, url, false, '', isText);

        if(RESTCLIENT_CONFIG.serverType === 'grunt') {
          console.log(url);
        }
        syncXhr.send();

        if (syncXhr.status === 200)
        {
            if (typeof syncXhr.response !== 'undefined' && syncXhr.response !== "")
            {
                parseResponse(syncXhr, successFn, failFn, isText);
            }
            else
            {
                failFn("No response");
            }
        }
        else if (syncXhr.status === 401 && RESTCLIENT_CONFIG.serverType === 'grunt')
        {
            var wwwAuthenticate = syncXhr.getResponseHeader('www-authenticate');
            console.log("sync wwwAuthenticate : ", wwwAuthenticate);
            syncXhr = makeNewRequest(method, url, false, wwwAuthenticate, isText);
            setDigestHeader(syncXhr, method, url, digestInfo);

            if(RESTCLIENT_CONFIG.serverType === 'grunt') {
              console.log(url);
            }
            syncXhr.send();

            if (syncXhr.status === 200)
            {
                if (typeof syncXhr.response !== 'undefined' && syncXhr.response !== "")
                {
                    parseResponse(syncXhr, successFn, failFn, isText);
                }
                else
                {
                    failFn("No response");
                }
            }
            else
            {
                if(syncXhr.status === 490)
                {
                    handleAccountBlock(failFn);
                }
                else
                {
                   failFn("HTTP Error : ",syncXhr.status);
                }
            }
        }
        else
        {
            if(syncXhr.status === 490)
            {
                handleAccountBlock(failFn);
            }
            else
            {
                failFn("HTTP Error : ",syncXhr.status);
            }
        }
    };

    var ajax_async = function (method, url, successFn, failFn, $scope, fileData, specialHeaders, isText)
    {
        var deferred = $q.defer();
        if(RESTCLIENT_CONFIG.serverType === 'grunt')
        {
          if (SessionOfUserManager.IsLoggedin() === true)
          {
              usrName = SessionOfUserManager.getUsername();
              passWord = SessionOfUserManager.getPassword();
          }
          else
          {
              loginRedirect();
              return;
          }
        }

        printDebug(0, url);

        var xhr = makeNewRequest(method, url, true, '', isText);

        setupAsyncCall(xhr, method, $scope, url, failFn);

        if(typeof specialHeaders !== 'undefined')
        {
          var hdrindex = 0;
          for (hdrindex = 0; hdrindex < specialHeaders.length; hdrindex = hdrindex + 1)
          {
            xhr.setRequestHeader(specialHeaders[hdrindex].Type,specialHeaders[hdrindex].Header);
          }
        }

        xhr.onreadystatechange = function ()
        {
            if (this.readyState === 4)
            {
              if (this.status === 401 && RESTCLIENT_CONFIG.serverType === 'grunt')
              {
                  var wwwAuthenticate = this.getResponseHeader('www-authenticate');
                  console.log("async wwwAuthenticate : ", wwwAuthenticate);

                    var xhr = makeNewRequest(method, url, true, wwwAuthenticate, isText);
                    setDigestHeader(xhr, method, url, digestInfo);

                  setupAsyncCall(xhr, method, $scope, url, failFn);

                  xhr.onreadystatechange = function ()
                  {
                      if (this.readyState === 4)
                      {
                          if (this.status === 200)
                          {
                              if (typeof this.response !== 'undefined' && this.response !== "")
                              {
                                  printDebug(1, url);
                                  parseResponse(this, successFn, failFn, isText);
                                  deferred.resolve('Success');
                              }
                              else
                              {
                                  failFn("No response",this.status);
                                  deferred.reject('Failure');
                              }
                          }
                          else
                          {
                              if(this.status === 490)
                              {
                                 ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
                                 loginRedirect();
                              }
                              failFn("HTTP Error : ",this.status);
                              deferred.reject('Failure');
                          }
                      }
                  };

                  if(RESTCLIENT_CONFIG.serverType === 'grunt') {
                    console.log(url);
                  }
                  if (typeof fileData !== 'undefined' && fileData !== null && fileData !== '')
                  {
                      xhr.send(fileData);
                  }
                  else
                  {
                      xhr.send();
                  }
              }
              else
              {
                  if (this.status === 200)
                  {
                      if (typeof this.response !== 'undefined' && this.response !== "")
                      {
                          printDebug(1, url);
                          parseResponse(this, successFn, failFn, isText);
                          deferred.resolve('Success');
                      }
                      else
                      {
                          failFn("No response",this.status);
                          deferred.reject('Failure');
                      }
                  }
                  else
                  {
                      if(this.status === 490)
                      {
                         ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
                         loginRedirect();
                      }
                      failFn("HTTP Error : ",this.status);
                      deferred.reject('Failure');
                  }
              }
            }
        };

        if(RESTCLIENT_CONFIG.serverType === 'grunt') {
          console.log(url);
        }
        if (typeof fileData !== 'undefined' && fileData !== null && fileData !== '')
        {
            xhr.send(fileData);
        }
        else
        {
            xhr.send();
        }

        return deferred.promise;
    };

    var generateCnonce = function ()
    {
        var characters = 'abcdef0123456789';
        var token = '';
        for (var i = 0; i < 16; i++)
        {
            var randNum = Math.round(Math.random() * characters.length);
            token += characters.substr(randNum, 1);
        }
        return token;
    };

    var formulateResponse = function (username, password, url, realm, method, nonce, nc, cnonce, qop)
    {
        var HA1 = CryptoJS.MD5(username + ':' + realm + ':' + password).toString();
        var HA2 = CryptoJS.MD5(method + ':' + url).toString();
        var response = CryptoJS.MD5(HA1 + ':' + nonce + ':' + decimalToHex(nc, 8) + ':' + cnonce + ':' + qop + ':' + HA2).toString();

        return response;
    };

    var getDigestInfoInWwwAuthenticate = function (wwwAuthenticate)
    {
        var digestHeaders = wwwAuthenticate;
        var scheme = null;
        var realm = null;
        var nonce = null;
        var opaque = null;
        var qop = null;
        var cnonce = null;
        var nc = null;
        var returnValue = false;

        if (digestHeaders !== null)
        {
            digestHeaders = digestHeaders.split(',');
            scheme = digestHeaders[0].split(/\s/)[0];

            for (var i = 0; i < digestHeaders.length; i++)
            {
                var keyVal = digestHeaders[i].split('=');
                var key = keyVal[0];
                var val = keyVal[1].replace(/\"/g, '').trim();

                if (key.match(/realm/i) !== null)
                {
                    realm = val;
                }

                if (key.match(/nonce/i) !== null)
                {
                    nonce = val;
                }

                if (key.match(/opaque/i) !== null)
                {
                    opaque = val;
                }

                if (key.match(/qop/i) !== null)
                {
                    qop = val;
                }
            }

            cnonce = generateCnonce();
            nc++;

            returnValue = {"scheme": scheme, "realm": realm, "nonce": nonce, "opaque": opaque, "qop": qop, "cnonce": cnonce, "nc": nc};
        }

        return returnValue;
    };

    var decimalToHex = function (d, _padding)
    {
        var hex = Number(d).toString(16);
        var padding = typeof (_padding) === 'undefined' || _padding === null ? 2 : _padding;

        while (hex.length < padding)
        {
            hex = "0" + hex;
        }
        return hex;
    };

    var jsonToText = function (json)
    {
        var url = '';

        for (var key in json)
        {
            if (typeof json[key] === 'boolean')
            {
                url += '&' + key + '=' + (json[key] === true ? "True" : "False");
            }
            else
            {
                url += '&' + key + '=' + json[key];
            }
        }

        return url;
    };
    
    var loginRedirect = function()
    {
      if(RESTCLIENT_CONFIG.serverType === 'grunt')
        {
            $location.path('/login');
        }
    }

    /**
     * @param {Int} msgType 0: Request, 1: Response
     */
    var printDebug = function(_msgType, url){
      try{
        var msgType = _msgType === 0 ? "REQUEST" : "RESPONSE";
        if(debugMode === true){
          console.info("[SUNAPI][" + msgType + "]", url);
        }
      }catch(e){
        console.error(e);
      }
    };

    return sunapiClient;
});
