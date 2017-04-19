"use strict";
kindFramework.directive('channelPlayer', 
    ['BrowserService', '$window', 'UniversialManagerService', 'CAMERA_STATUS', 
    '$rootScope', '$compile', 'PluginControlService', 'KindControlService', 
    'MJPEGPollingControlService', 'ExtendChannelContainerService', 'kindStreamInterface', 
    '$timeout', 'ModalManagerService','$translate',
    function (BrowserService, $window, UniversialManagerService, CAMERA_STATUS, 
      $rootScope, $compile, PluginControlService, KindControlService, 
      MJPEGPollingControlService, ExtendChannelContainerService, kindStreamInterface, 
      $timeout, ModalManagerService,$translate) {
    return {
        restrict: 'E',
        scope: {
            'playinfo': '='
        },
        link: function (scope, elem, attrs) {
            var channelPlayerObj = null;
            scope.child = {};
            $rootScope.$emit('channelPlayer::initialized');
            scope.$on('$destroy', function(event) {
              if(channelPlayerObj !== null)
              {
                  channelPlayerObj.stopStreaming();
                  channelPlayerObj = null;
              }

              /*** PlugIn Mode is default. added for PlayBack Page  ***/
              UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE);
            });

            $rootScope.$saveOn('channelPlayer:play', function(event, isPluginMode, ip, port, intProfileNumber, id, password, streamTagType, statusCallback, isReconnect) {
                console.log("Requested Play { plugInMode : " + isPluginMode + ", Profile : " + intProfileNumber + " }");
                channelPlayerObj = new ChannelPlayer(BrowserService.BrowserDetect, isPluginMode);

                $rootScope.$emit('changeLoadingBar', true);

                //1. Check PlugIn Installed.
                if((isPluginMode === true)&& (BrowserService.PlugInDetect === false))
                {
                    channelPlayerObj.stopStreaming();

                    //2. Check if request is first or not.
                    if(elem[0].childNodes.length === 0)
                    {
                        requestAvailableProfile(intProfileNumber);
                    }
                    else
                    {
                        elem.empty();
                        channelPlayerObj.createPlugInInstallElement();
                        $rootScope.$emit('changeLoadingBar', false);
                    }
                    return;
                }

                //3. Stop Previous Streaming
                channelPlayerObj.stopStreaming();

                //4. Check Requested Profile
                if(channelPlayerObj.checkProfileAvailable(isPluginMode, intProfileNumber) === false)
                {
                    if(BrowserService.PlugInSupport && BrowserService.PlugInDetect)
                    {
                        //IE ??????���� ????????? // PlugIn Off ???????????? H264, H265 ????? ???
                        $rootScope.$emit("channel:setPlugin");
                    }
                    else {
                        //????? ??????����
                        channelPlayerObj.createPlugInInstallElement();
                        $rootScope.$emit('changeLoadingBar', false);
                    }

                    //NonPlugIn ?????? ??????����
                    //requestAvailableProfile(profile);
                    return;
                }

                //5. Stream Element Check
                if(channelPlayerObj.StreamElementDetect(isPluginMode, elem) === false)
                {
                    channelPlayerObj.deleteStreamElement();
                    channelPlayerObj.createStreamElement(isPluginMode);
                }

                //prevent blocking of UI for allow excute plugin
                $rootScope.$emit('changeLoadingBar', false);

                //6. Plugin Version Check
                if((isPluginMode === true) && (BrowserService.PlugInVersionCheck(elem) === false))
                {
                    channelPlayerObj.stopStreaming();
                    channelPlayerObj.createPlugInInstallElement();
                    return;
                }

                //7. Start Streaming
                channelPlayerObj.startStreaming(isPluginMode, ip, port, intProfileNumber, id, password, streamTagType, statusCallback, isReconnect);
            }, scope);

            $rootScope.$saveOn('channelPlayer:command', function(event, type, command, callback) {
                console.log("Requested command {  Type : " + type + " }");

                if(channelPlayerObj === null)
                {
                    var isPluginMode = (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) ? true:false;
                    channelPlayerObj = new ChannelPlayer(BrowserService.BrowserDetect, isPluginMode);    
                }

                switch(type)
                {
                    case 'capture':
                        channelPlayerObj.capture();
                        break;
                    case 'record':
                        channelPlayerObj.record(command);
                        break;
                    case 'stopLive' :
                        stopLiveForPlayback(UniversialManagerService.getStreamingMode(), command);
                        break;
                    case 'playbackBackup':
                        channelPlayerObj.playbackBackup(command, callback);
                        break;
                    case 'playback':
                        channelPlayerObj.playback(command, callback.timeCallback, callback.errorCallback);
                        break;
                    case 'resume':
                        channelPlayerObj.resume(command);
                        break;
                    case 'seek':
                        channelPlayerObj.seek(command);
                        break;
                    case 'pause':
                        channelPlayerObj.pause();
                        break;
                    case 'speed':
                        channelPlayerObj.speed(command.speed, command.data);
                        break;
                    case 'close':
                        channelPlayerObj.closePlayback();
                        break;
                    case 'pixelCount':
                        channelPlayerObj.pixelCount(type, command);
                        break;
                    case 'speakerStatus':
                        if(command) {
                            channelPlayerObj.speakerStatusON();
                        }
                        else {
                            channelPlayerObj.speakerStatusOFF();
                        }
                        break;
                    case 'speakerVolume':
                        channelPlayerObj.changeSpeakerVolume(command);
                        break;
                    case 'micStatus' :
                        if(command) {
                            channelPlayerObj.micStatusON(command);
                        }
                        else {
                            channelPlayerObj.micStatusOFF(command);
                        }
                        break;
                    case 'micVolume':
                        channelPlayerObj.changeMicVolume(command);
                        break;
                    case 'step':
                        channelPlayerObj.step(command);
                        break;
                    case 'manualTracking' :
                        channelPlayerObj.setManualTrackingMode(command);
                        break;
                    case 'areaZoomMode' :
                        channelPlayerObj.setAreaZoomMode(command);
                        break;
                    case 'areaZoomAction' :
                        channelPlayerObj.setAreaZoomAction(command);
                        break;
                    default:
                        break;
                }
            }, scope);

            var ChannelPlayer = function(BrowserType, isPluginMode){
                function PlugIn(){
                    function checkNeedToSpeakerStatus() {
                        if( UniversialManagerService.isSpeakerOn()) {
                            speakerStatusON();
                            changeSpeakerVolume(UniversialManagerService.getSpeakerVol());
                        }
                    }

                    function createActiveXElement() {
                        var ElementTemplate = UniversialManagerService.getPluginElement();
                        if(ElementTemplate === null){
                            ElementTemplate = $compile('<object classid="clsid:FC4C00B9-5A98-461C-88E8-B24B528DDBF5" zIndex="10"></object>')(scope);
                            UniversialManagerService.setPluginElement(ElementTemplate);
                        }

                        elem.append(ElementTemplate);
                        setElement(ElementTemplate);
                    }

                    function createNPAPIElement() {
                        var ElementTemplate = UniversialManagerService.getPluginElement();
                        if(ElementTemplate === null){
                            ElementTemplate = $compile('<object type="application/HTWisenetViewer-plugin"></object>')(scope);
                            UniversialManagerService.setPluginElement(ElementTemplate);
                        }

                        elem.append(ElementTemplate);
                        setElement(ElementTemplate);
                    }

                    this.createStreamElement = function() {
                        if (window.ActiveXObject || "ActiveXObject" in window) {
                            createActiveXElement();
                        }
                        else
                        {
                            createNPAPIElement();
                        }
                    }

                    this.StreamElementDetect = function(){
                        return ((elem.find('object').length !== 0) ? true : false);
                    }

                    this.startStreaming = function(_pluginMode, _ip, _port, _profile, _id, _password, _streamtagtype, statusCallback, isReconnect){
                        var pluginObj = elem[0].getElementsByTagName('object')[0];
                        $(pluginObj).addClass("cm-vn");
                        PluginControlService.startPluginStreaming(pluginObj, _ip, _port, _profile, _id, _password, statusCallback);
                    }

                    this.capture = function() {
                        var strPath = PluginControlService.capture();
                        ModalManagerService.open('message', { 'buttonCount': 0, 'message': $translate.instant('lang_capture_image_saved')+"\n"+strPath } );
                    }

                    this.record = function(recordInfo) {
                        if(recordInfo.command === 'start')
                        {
                            PluginControlService.startRecord(recordInfo.callback);
                        }
                        else if(recordInfo.command === 'stop')
                        {
                            PluginControlService.stopRecord(recordInfo.callback);
                        }
                    }

                    this.setAreaZoomAction = function(_command){
                        PluginControlService.setAreaZoomAction(_command);
                    }

                    this.setAreaZoomMode = function(_mode){
                        PluginControlService.setAreaZoomMode(_mode);
                    }

                    this.setManualTrackingMode = function(_mode) {
                        PluginControlService.setManualTrackingMode(_mode);
                    }

                    this.step = function(_data) {
                        PluginControlService.applyStepCommand(_data);
                    }

                    this.changeMicVolume = function(_command) {
                        UniversialManagerService.setMicVol(_command);
                        PluginControlService.setAudioTalkVolume(_command);
                    }

                    this.micStatusOFF = function(_command) {
                        UniversialManagerService.setMicOn(_command);
                        PluginControlService.stopAudioTalk();
                    }

                    this.micStatusON = function(_command) {
                        UniversialManagerService.setMicOn(_command);
                        PluginControlService.startAudioTalk();
                    }

                    this.changeSpeakerVolume = function(_command) {
                        UniversialManagerService.setSpeakerVol(_command);
                        PluginControlService.setAudioVolume(_command);
                    }

                    this.speakerStatusOFF = function() {
                        UniversialManagerService.setSpeakerOn(false);
                        PluginControlService.stopAudioListen();
                    }

                    this.speakerStatusON = function() {
                        UniversialManagerService.setSpeakerOn(true);
                        PluginControlService.startAudioListen();
                        $timeout(function(){
                            PluginControlService.setAudioVolume(UniversialManagerService.getSpeakerVol());
                        },500);
                    }

                    this.pixelCount = function(_type, _command) {
                        UniversialManagerService.setPixelCount(_command.cmd);
                        PluginControlService.pixcelCount(_command);
                    }

                    this.closePlayback = function() {
                        $rootScope.$emit('blockTimebarInputField', false);
                        PluginControlService.closePlaybackSession();
                        elem.empty();
                    }

                    this.pause = function() {
                        PluginControlService.applyPauseCommand();
                    }

                    this.seek = function(_data) {
                        PluginControlService.applySeekCommand(_data);
                    }

                    this.resume = function(_data) {
                        PluginControlService.applyResumeCommand(_data);
                    }

                    this.playback = function(_data, _timeCallback, _errorCallback) {
                        this.createStreamElement();
                        var pluginObj = elem[0].getElementsByTagName('object')[0];
                        PluginControlService.startPlayback(pluginObj, _data, _timeCallback, _errorCallback);
                        $timeout(function(){
                            checkNeedToSpeakerStatus();
                        });
                    }

                    this.playbackBackup = function(_data, _callback) {
                        this.createStreamElement();
                        var pluginObj = elem[0].getElementsByTagName('object')[0];
                        PluginControlService.startPlaybackBackup(pluginObj, _data, _callback);
                    }
                }
                function MJPEG(){
                    function stopAndNotSupport() {
                        MJPEGPollingControlService.stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                    }

                    this.createStreamElement = function() {
                        var ElementTemplate = $compile('<img cursor="default" zIndex="10" draggable="false"></img>')(scope);
                        elem.append(ElementTemplate);
                        setElement(ElementTemplate);
                    }

                    this.StreamElementDetect = function(){
                        return ((elem.find('image').length !== 0) ? true : false);
                    }

                    this.startStreaming = function(_pluginMode, _ip, _port, _profile, _id, _password, _streamtagtype, statusCallback, isReconnect){
                        MJPEGPollingControlService.startMJPEGStreaming(elem);
                    }

                    this.capture = function() {
                        MJPEGPollingControlService.capture();
                    }

                    this.record = stopAndNotSupport;

                    this.setAreaZoomAction = stopAndNotSupport;

                    this.setAreaZoomMode = stopAndNotSupport;

                    this.setManualTrackingMode = stopAndNotSupport;

                    this.step = stopAndNotSupport;

                    this.changeMicVolume = stopAndNotSupport;

                    this.micStatusOFF = stopAndNotSupport;

                    this.micStatusON = stopAndNotSupport;

                    this.changeSpeakerVolume = stopAndNotSupport;

                    this.speakerStatusOFF = stopAndNotSupport;

                    this.speakerStatusON = stopAndNotSupport;

                    this.pixelCount = stopAndNotSupport;

                    this.closePlayback = stopAndNotSupport;

                    this.pause = stopAndNotSupport;

                    this.seek = stopAndNotSupport;

                    this.resume = stopAndNotSupport;

                    this.playback = stopAndNotSupport;

                    this.playbackBackup = stopAndNotSupport;
                }
                function Kind(){
                    function checkNeedToSpeakerStatus() {
                        if( UniversialManagerService.isSpeakerOn()) {
                            speakerStatusON();
                            changeSpeakerVolume(UniversialManagerService.getSpeakerVol());
                        }
                    }

                    this.createStreamElement = function() {
                        var ElementTemplate = '<kind_stream class="channel-content" kindplayer="playerdata" display="displayInfo"></kind_stream>';
                        elem.append($compile(ElementTemplate)(scope));
                    }

                    this.StreamElementDetect = function() {
                        return ((elem.find('kind_stream').length !== 0) ? true : false);
                    }

                    this.startStreaming = function(_pluginMode, _ip, _port, _profile, _id, _password, _streamtagtype, statusCallback, isReconnect){
                        KindControlService.startKindStreaming(scope, _profile, _streamtagtype, statusCallback,isReconnect);
                    }

                    this.capture = function() {
                        if (typeof document.createElement('a').download !== "undefined") {
                            KindControlService.capture(scope);
                            ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_capture_image_saved" } );
                        } else {
                            ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_service_unavailable" } );
                        }
                    }

                    this.record = function(recordInfo) {
                        if(recordInfo.command === 'start')
                        {
                            KindControlService.startRecord(scope, recordInfo);
                        }
                        else if(recordInfo.command === 'stop')
                        {
                            KindControlService.stopRecord(scope, recordInfo);
                        }
                    }

                    this.setAreaZoomAction = function(_command) {
                        KindControlService.setAreaZoomAction(_command);
                    }

                    this.setAreaZoomMode = function(_mode) {
                        KindControlService.setAreaZoomMode(_mode);
                    }

                    this.setManualTrackingMode = function(_mode) {
                        KindControlService.setManualTrackingMode(_mode);
                    }

                    this.step = function(_data) {
                        $rootScope.$emit('app/scripts/directives/channelPlayer.js:step', _data);
                    }

                    this.changeMicVolume = function(_command) {
                        UniversialManagerService.setMicVol(_command);
                        kindStreamInterface.controlAudioOut(_command);
                    }

                    this.micStatusOFF = function(_command) {
                        UniversialManagerService.setMicOn(_command);
                        kindStreamInterface.controlAudioOut('off');
                    }

                    this.micStatusON = function(_command) {
                        UniversialManagerService.setMicOn(_command);
                        kindStreamInterface.controlAudioOut('on');
                    }

                    this.changeSpeakerVolume = function(_command) {
                        UniversialManagerService.setSpeakerVol(_command);
                        kindStreamInterface.controlAudioIn(_command);
                    }

                    this.speakerStatusOFF = function() {
                        UniversialManagerService.setSpeakerOn(false);
                        kindStreamInterface.controlAudioIn('off');
                    }

                    this.speakerStatusON = function() {
                        UniversialManagerService.setSpeakerOn(true);
                        kindStreamInterface.controlAudioIn(UniversialManagerService.getSpeakerVol());
                    }

                    this.pixelCount = function(_type, _command) {
                        UniversialManagerService.setPixelCount(_command.cmd);
                        $rootScope.$emit('channel:overlayCanvas', _command.cmd);
                        $rootScope.$emit('overlayCanvas::command', _type, _command.cmd);
                    }

                    this.closePlayback = function() {
                        KindControlService.closePlaybackSession(scope);
                        angular.element(elem.find('kind_stream')).remove();
                        if( scope.child.$destroy !== undefined ) {
                          scope.child.$destroy();
                        }
                    }

                    this.pause = function() {
                        KindControlService.applyPauseCommand(scope);
                    }

                    this.seek = function(_data) {
                        KindControlService.applySeekCommand(scope, _data);
                    }

                    this.resume = function(_data) {
                        KindControlService.applyResumeCommand(scope, _data);
                    }

                    this.playback = function(_data, _timeCallback, _errorCallback) {
                        this.createStreamElement();
                        KindControlService.startPlayback(scope, _data, _timeCallback, _errorCallback);
                        $timeout(function(){
                            checkNeedToSpeakerStatus();
                        });
                    }

                    this.playbackBackup = function(_data, _callback) {
                        this.createStreamElement();
                        KindControlService.startPlaybackBackup(scope, _data, _callback);
                    }
                }

                function Player(){
                    this.stopStreaming = function(){
                        MJPEGPollingControlService.stopStreaming(elem);
                        PluginControlService.stopStreaming();
                        KindControlService.stopStreaming(elem);
                        elem.empty();
                    };

                    this.checkProfileAvailable = function(isPluginMode, intProfileNumber){
                        switch(BrowserService.BrowserDetect)
                        {
                            case BrowserService.BROWSER_TYPES.IE:
                                if( isPluginMode === true )
                                {
                                    return true;
                                }
                                else
                                {
                                    var MJPEG_PROFILE_NUM = 1; // 1 is MJPEG
                                    if(intProfileNumber === MJPEG_PROFILE_NUM)
                                    {
                                        return true;
                                    }
                                    else
                                    {
                                        return false;
                                    }
                                }
                                break;
                            case BrowserService.BROWSER_TYPES.SAFARI:
                                return true;
                            case BrowserService.BROWSER_TYPES.CHROME:
                            case BrowserService.BROWSER_TYPES.EDGE:
                            case BrowserService.BROWSER_TYPES.FIREFOX:
                            /* jshint ignore:start */
                            default :
                                /* jshint ignore:end */
                                if(isPluginMode === true)
                                {
                                    return false;
                                }
                                else
                                {
                                    return true;
                                    /* This is for PLUGINFREE Profile
                                     _profile = UniversialManagerService.getProfileInfo();
                                     return ProfileCheckService.availableCheck(_profile);
                                     */
                                }
                                break;
                        }
                    }

                    this.createPlugInInstallElement = function() {
                        var ElementTemplate = '<div class="cm-plugin-msg">{{ "lang_msg_plugin_install2" | translate }}<br><a href=' + BrowserService.PlugInPath +'><i class="tui tui-wn5-download cm-icon-x15"></i>Plugin</a></div>';
                        elem.append($compile(ElementTemplate)(scope));
                        $rootScope.$emit('NeedToInstallPlugIn', true);
                    }

                    this.deleteStreamElement = function(){
                        angular.element(elem.find('kind_stream')).remove();
                        elem.empty();
                        if( scope.child.$destroy !== undefined ) {
                            scope.child.$destroy();
                        }
                    }
                }

                (function constructor(){
                    switch (BrowserType)
                    {
                        case BrowserService.BROWSER_TYPES.IE:
                            if(isPluginMode === false)
                            {
                                Player.prototype = new MJPEG();
                                break;
                            }
                        case BrowserService.BROWSER_TYPES.SAFARI:
                            if(isPluginMode === false)
                            {
                                Player.prototype = new Kind();
                                break;
                            }
                            Player.prototype = new PlugIn();
                            break;
                        case BrowserService.BROWSER_TYPES.CHROME:
                        case BrowserService.BROWSER_TYPES.EDGE:
                        case BrowserService.BROWSER_TYPES.FIREFOX:
                        default:
                            Player.prototype = new Kind();
                            break;
                    }
                    console.log("channelPlayer ::",Player.prototype.constructor.name + " is created");
                })();

                return new Player();
            };

            function createNoSupportPlaybackInPlugInElement(){
                var ElementTemplate = '<div class="cm-plugin-msg">{{ "lang_msg_plugin_only_support_ie" | translate }}</div>';
                elem.append($compile(ElementTemplate)(scope));
            }

            function setElement(elem){
              $timeout(function(){
                $rootScope.$emit('BaseChannel:resetViewMode');
                kindStreamInterface.setStreamCanvas(elem);
                kindStreamInterface.setResizeEvent();
                kindStreamInterface.setCanvasStyle('originalratio');
              });
            }

            function requestAvailableProfile(_profile) {
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                    var MJPEG_PROFILE_NUM = 1; // 1 is MJPEG
                    $rootScope.$emit('channelPlayer:stopped', 'NOT_AVAIALBE', MJPEG_PROFILE_NUM, CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
                    $rootScope.$emit('NeedToInstallPlugIn', true);
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                    /* This is for PLUGINFREE Profile
                    createPLUGINFREEProfile().then(
                      function(_ProfileNumber){
                        $rootScope.$emit('channelPlayer:stopped', 'NOT_AVAIALBE', _ProfileNumber, CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
                      }
                    );
                    */
                    $rootScope.$emit('channelPlayer:stopped', 'NOT_AVAIALBE', _profile, CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
                    break;
              }
            }                                  

            function stopLiveForPlayback(_streamingmode, isPlaybackMode ) {
              /*Previously check plugin mode*/
              var pluginMode = (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) ? true:false;
              if( (pluginMode === true) && (BrowserService.PlugInDetect === false)) {
                UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
                _streamingmode = CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE;
              }
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    channelPlayerObj.stopStreaming();
                    $rootScope.$emit('app/scripts/directives/channelPlayer.js:disablePlayback', false);
                  }
                  else
                  {
                    channelPlayerObj.stopStreaming();
                    if( isPlaybackMode === true ) {
                      createNoSupportPlaybackInPlugInElement();
                      $rootScope.$emit('app/scripts/directives/channelPlayer.js:disablePlayback', true);
                    }
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    channelPlayerObj.stopStreaming();
                  }
                  else
                  {
                    KindControlService.closeStream(elem, scope);
                    elem.empty();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.FIREFOX:
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.closeStream(elem, scope);
                  elem.empty();
                  break;
              }
            }
        }
    };
}]);
