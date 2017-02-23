kindFramework.factory('SunapiClient', function (RESTCLIENT_CONFIG, $location, $q, SessionOfUserManager,ModalManagerService, $timeout, SunapiConverter)
{
    'use strict';

    var digestInfo;
    var usrName;
    var passWord;

    var sunapiClient = {};

    var sequencenum = 0;

    var debugMode = false;

   if (RESTCLIENT_CONFIG.serverType === 'camera'){
        RESTCLIENT_CONFIG['digest'].hostName = window.location.hostname;
        RESTCLIENT_CONFIG['digest'].port = window.location.port;
        var loc_protocol = window.location.protocol;
        var splitProt =loc_protocol.split(":");
        RESTCLIENT_CONFIG['digest'].protocol = splitProt[0];
    }else{
      try{
        debugMode = RESTCLIENT_CONFIG['debugMode']; 
      }catch(e){
        console.error(e);
      }
    }


    sunapiClient.post = function (url, jsonData, SuccessFn, FailFn, $scope, fileData, specialHeaders)
    {
        if (typeof jsonData !== 'undefined')
        {
            url += jsonToText(jsonData);
        }

        return ajax_async("POST", url, SuccessFn, FailFn, $scope, fileData, specialHeaders);
    };

    sunapiClient.get = function (url, jsonData, SuccessFn, FailFn, $scope, isAsyncCall, isText)
    {
        if (typeof jsonData !== 'undefined')
        {
            url += jsonToText(jsonData);

            if(url.indexOf("attributes.cgi") == -1)
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
        if(currentItem === undefined) {return;}

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
            LoginRedirect();
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

        if (wwwAuthenticate !== '' && wwwAuthenticate !== undefined){
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

                    if (wwwAuthenticate !== '' && wwwAuthenticate !== undefined){
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
                                    LoginRedirect();
                                }
                                failFn("HTTP Error : ",this.status);
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
                            LoginRedirect();
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
        if (typeof fileData !== 'undefined' && fileData !== null && fileData !== ''){
            xhr.send(fileData);
        }else{
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

        var xhr = mobile.makeNewRequest(connect_info, url, '');
        console.log(xhr);
        var OnErrorEvent = function (evt) {  
          FailFn(
            { msg : "Network Error",
              code : evt.status,
          });
        };

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

              xhr.onerror = function (evt) { FailFn(xhr.status); };
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
                var wwwAuthenticate = this.getResponseHeader('www-authenticate');
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
        var result;

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
        var responseValue, digestAuthHeader;
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
            var digestAuthHeader = digestCache.scheme + ' ' + btoa(usrName + ':' + passWord);

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
          var resp;
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
                    failFn(result.data.Error.Details,result.data.Error.Code);
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

    function handleAccountBlock(failFn)
    {
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Exceeded maximum login attempts, please try after some time" } );
        LoginRedirect();
        if(SessionOfUserManager.IsLoginSuccess() === false)
        {

            failFn("HTTP Error : ",xhr.status);
            console.log("After calling Account block fail fn");
        }
    }

    function setupAsyncCall(xhr, method, callbackList, url, failFn)
    {
        var OnErrorEvent = function (evt)
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
                xhr.addEventListener("error", OnErrorEvent, false);
            }
        }

        if (method === 'POST')
        {
          if(url.indexOf("firmwareupdate") !== -1){
            xhr.timeout = 360000;
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
            xhr.timeout = 10000;
        }
        else
        {
            xhr.timeout = 5000;
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
         //   (checkStaleResponseIssue(url) === false))
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
          if (wwwAuthenticate !== '' && wwwAuthenticate !== undefined)
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

    /**
     * When ever server return STALE parameter in digest header, browser shows popup before control coming to
     * XHR callback, Inorder to avaoid it we will remove digest cache in scenarios in which STALE response can happen
     * just a temporary workaround
     */

    function checkStaleResponseIssue(url)
    {
        var retVal = false;

        /** As of not it happens only after SSL certificate install and delete */
        if (url.indexOf("ssl") !== -1)
        {
            if (url.indexOf("install") !== -1 || url.indexOf("remove") !== -1)
            {
                retVal = true;
            }
        }
        return retVal;
    }


    sunapiClient.clearDigestCache = function () {
        console.log('Clearing the Diegest cache !!!!!!!!!!!! ');
        digestInfo = undefined;
    };

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
              LoginRedirect();
              return;
          }
  }
        var xhr = makeNewRequest(method, url, false, '', isText);

        if(RESTCLIENT_CONFIG.serverType === 'grunt') {
          console.log(url);
        }
        xhr.send();

        if (xhr.status === 200)
        {
            if (typeof xhr.response !== 'undefined' && xhr.response !== "")
            {
                parseResponse(xhr, successFn, failFn, isText);
            }
            else
            {
                failFn("No response");
            }
        }
        else if (xhr.status === 401 && RESTCLIENT_CONFIG.serverType === 'grunt')
        {
            var wwwAuthenticate = xhr.getResponseHeader('www-authenticate');
            console.log("sync wwwAuthenticate : ", wwwAuthenticate);
            var xhr = makeNewRequest(method, url, false, wwwAuthenticate, isText);
            setDigestHeader(xhr, method, url, digestInfo);

            if(RESTCLIENT_CONFIG.serverType === 'grunt') {
              console.log(url);
            }
            xhr.send();

            if (xhr.status === 200)
            {
                if (typeof xhr.response !== 'undefined' && xhr.response !== "")
                {
                    parseResponse(xhr, successFn, failFn, isText);
                }
                else
                {
                    failFn("No response");
                }
            }
            else
            {
                if(xhr.status === 490)
                {
                    handleAccountBlock(failFn);
                }
                else
                {
                   failFn("HTTP Error : ",xhr.status);
                }
            }
        }
        else
        {
            if(xhr.status === 490)
            {
                handleAccountBlock(failFn);
            }
            else
            {
                failFn("HTTP Error : ",xhr.status);
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
              LoginRedirect();
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
                                 LoginRedirect();
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
                         LoginRedirect();
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

    var decimalToHex = function (d, padding)
    {
        var hex = Number(d).toString(16);
        padding = typeof (padding) === 'undefined' || padding === null ? padding = 2 : padding;

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

    var DetectBrowser = function()
    {
        var BrowserDetectRes = {};
        BrowserDetectRes.isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
       BrowserDetectRes.isFirefox = typeof InstallTrigger !== 'undefined';
    // At least Safari 3+: "[object HTMLElementConstructor]"
        BrowserDetectRes.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // Internet Explorer 6-11
        BrowserDetectRes.isIE = /*@cc_on!@*/false || !!document.documentMode;
    // Edge 20+
        BrowserDetectRes.isEdge = !BrowserDetectRes.isIE && !!window.StyleMedia;
    // Chrome 1+
        BrowserDetectRes.isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
        BrowserDetectRes.isBlink = (BrowserDetectRes.isChrome || BrowserDetectRes.isOpera) && !!window.CSS;

        return BrowserDetectRes;
    };

    var LoginRedirect = function()
    {
      if(RESTCLIENT_CONFIG.serverType === 'grunt')
        {
            $location.path('/login');
        }
    }

    /**
     * @param {Int} msgType 0: Request, 1: Response
     */
    var printDebug = function(msgType, url){
      try{
        var msgType = msgType === 0 ? "REQUEST" : "RESPONSE";
        if(debugMode === true){
          console.info("[SUNAPI][" + msgType + "]", url);
        }
      }catch(e){
        console.error(e);
      }
    };

    return sunapiClient;
});
