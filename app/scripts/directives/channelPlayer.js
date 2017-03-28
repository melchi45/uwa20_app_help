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
            scope.child = {};
            $rootScope.$emit('channelPlayer::initialized'); 
            scope.$on('$destroy', function(event) {
              stopStreaming(elem);

              /*** PlugIn Mode is default. added for PlayBack Page  ***/
              UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE);
            });
            function StreamElementDetect(_plugin, _parentElement) {
                if(_plugin === true)
                {
                    switch(BrowserService.BrowserDetect)
                    {
                        case BrowserService.BROWSER_TYPES.IE:
                        case BrowserService.BROWSER_TYPES.SAFARI:
                            return ((_parentElement.find('object').length !== 0) ? true : false);
                        case BrowserService.BROWSER_TYPES.CHROME:
                        case BrowserService.BROWSER_TYPES.EDGE:
                        case BrowserService.BROWSER_TYPES.FIREFOX:
                        /* jshint ignore:start */
                        default :
                        /* jshint ignore:end */
                            return false;
                    }
                }
                else
                {
                    switch(BrowserService.BrowserDetect)
                    {
                        case BrowserService.BROWSER_TYPES.IE:
                            return ((_parentElement.find('image').length !== 0) ? true : false);
                        case BrowserService.BROWSER_TYPES.SAFARI:
                        case BrowserService.BROWSER_TYPES.CHROME:
                        case BrowserService.BROWSER_TYPES.EDGE:
                        case BrowserService.BROWSER_TYPES.FIREFOX:
                        /* jshint ignore:start */
                        default :
                        /* jshint ignore:end */
                            return ((_parentElement.find('kind_stream').length !== 0) ? true : false);
                    }
                }
            }

            function createPlugInInstallElement() {
                var ElementTemplate = '<div class="cm-plugin-msg">{{ "lang_msg_plugin_install2" | translate }}<br><a href=' + BrowserService.PlugInPath +'><i class="tui tui-wn5-download cm-icon-x15"></i>Plugin</a></div>';
                elem.append($compile(ElementTemplate)(scope));
                $rootScope.$emit('NeedToInstallPlugIn', true);
            }

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

            function createPlugInElement() {
              if (window.ActiveXObject || "ActiveXObject" in window) {
                createActiveXElement();
              } 
              else
              {
                createNPAPIElement();
              }
            }

            function createMJPEGElement() {
              var ElementTemplate = $compile('<img cursor="default" zIndex="10" draggable="false"></img>')(scope);
              elem.append(ElementTemplate);
              setElement(ElementTemplate);
            }

            function createKindElement() {
                var ElementTemplate = '<kind_stream class="channel-content" kindplayer="playerdata" display="displayInfo"></kind_stream>';
                elem.append($compile(ElementTemplate)(scope));
            }

            function createStreamElement(_plugin) {
                if(_plugin === true)
                {
                    switch(BrowserService.BrowserDetect)
                    {
                        case BrowserService.BROWSER_TYPES.IE:
                        case BrowserService.BROWSER_TYPES.SAFARI:
                            createPlugInElement();
                            break;
                        case BrowserService.BROWSER_TYPES.CHROME:
                        case BrowserService.BROWSER_TYPES.EDGE:
                        case BrowserService.BROWSER_TYPES.FIREFOX:
                        /* jshint ignore:start */
                        default :
                        /* jshint ignore:end */
                            return null;
                    }
                }
                else
                {
                    switch(BrowserService.BrowserDetect)
                    {
                        case BrowserService.BROWSER_TYPES.IE:
                            createMJPEGElement();
                            break;
                        case BrowserService.BROWSER_TYPES.SAFARI:
                        case BrowserService.BROWSER_TYPES.CHROME:
                        case BrowserService.BROWSER_TYPES.EDGE:
                        case BrowserService.BROWSER_TYPES.FIREFOX:
                        /* jshint ignore:start */
                        default :
                        /* jshint ignore:end */
                            createKindElement();
                            break;
                    }
                }
            }

            function deleteStreamElement(_plugin) {
              if(_plugin === true)
              {
                switch(BrowserService.BrowserDetect)
                {
                  case BrowserService.BROWSER_TYPES.IE:
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      elem.empty();
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      return null;
                }
              } else {
                angular.element(elem.find('kind_stream')).remove();
                elem.empty();
                if( scope.child.$destroy !== undefined ) {
                  scope.child.$destroy();
                }                
              }
            }

            function stopStreaming(_channelPlayerElement) {
              MJPEGPollingControlService.stopStreaming(_channelPlayerElement);
              PluginControlService.stopStreaming();
              KindControlService.stopStreaming(_channelPlayerElement);
            }

            function startStreaming(_pluginMode, _ip, _port, _profile, _id, _password, _streamtagtype, statusCallback, isReconnect) {
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if( _pluginMode === true )
                      {
                        var pluginObj = elem[0].getElementsByTagName('object')[0];
                        $(pluginObj).addClass("cm-vn");
                        PluginControlService.startPluginStreaming(pluginObj, _ip, _port, _profile, _id, _password, statusCallback);
                      }
                      else
                      {
                        MJPEGPollingControlService.startMJPEGStreaming(elem);
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if( _pluginMode === true )
                      {
                        var pluginObj = elem[0].getElementsByTagName('object')[0];
                        $(pluginObj).addClass("cm-vn");
                        PluginControlService.startPluginStreaming(pluginObj, _ip, _port, _profile, _id, _password, statusCallback);
                      }
                      else
                      {
                        KindControlService.startKindStreaming(scope, _profile, _streamtagtype, statusCallback,isReconnect);
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      KindControlService.startKindStreaming(scope, _profile, _streamtagtype, statusCallback,isReconnect);
                      break;
              }
            }

            function checkProfileAvailable(_pluginMode, _profile){
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if( _pluginMode === true )
                      {
                          return true;
                      }
                      else
                      {
                          var MJPEG_PROFILE_NUM = 1; // 1 is MJPEG
                          if(_profile === MJPEG_PROFILE_NUM)
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
                      if(_pluginMode === true)
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

            function capture(_streamingmode) {
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                    {
                      var strPath = PluginControlService.capture();
                      ModalManagerService.open('message', { 'buttonCount': 0, 'message': $translate.instant('lang_capture_image_saved')+"\n"+strPath } );
                    }
                    else
                    {
                      MJPEGPollingControlService.capture();
                    }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                    {
                      PluginControlService.capture();
                      ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_capture_image_saved" } );
                    }
                    else
                    {
                      ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_service_unavailable" } );
                    }
                    break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      KindControlService.capture(scope);
                      ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_capture_image_saved" } );
                    break;
              }
            }

            function pixelCount(_streamingmode, _type, _command) {
              UniversialManagerService.setPixelCount(_command.cmd);
              switch(BrowserService.BrowserDetect) {
                case BrowserService.BROWSER_TYPES.IE:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) {
                        PluginControlService.pixcelCount(_command);
                    } else {
                        stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                    }
                    break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) {
                        PluginControlService.pixcelCount(_command);
                        break;
                    }
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  $rootScope.$emit('channel:overlayCanvas', _command.cmd);
                  $rootScope.$emit('overlayCanvas::command', _type, _command.cmd);
                  break;
              }
            }            
            
            
            function speakerStatusON(_streamingmode, command) {
              UniversialManagerService.setSpeakerOn(true);
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.startAudioListen();
                          $timeout(function(){
                            PluginControlService.setAudioVolume(UniversialManagerService.getSpeakerVol());
                          },500);
                      }
                      else
                      {
                        stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.startAudioListen();
                          $timeout(function(){
                            PluginControlService.setAudioVolume(UniversialManagerService.getSpeakerVol());
                          },500);
                      }
                      else
                      {
                         kindStreamInterface.controlAudioIn(UniversialManagerService.getSpeakerVol());
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      kindStreamInterface.controlAudioIn(UniversialManagerService.getSpeakerVol());
                    break;
              }
            }       
            
            
            function speakerStatusOFF(_streamingmode, command) {
              UniversialManagerService.setSpeakerOn(false);
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                        PluginControlService.stopAudioListen();
                      }
                      else
                      {
                        stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI :
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                        PluginControlService.stopAudioListen();
                      }
                      else
                      {
                          kindStreamInterface.controlAudioIn('off');
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      kindStreamInterface.controlAudioIn('off');
                      break;
              }
            }       
            
            
            function changeSpeakerVolume(_streamingmode, command) {
              UniversialManagerService.setSpeakerVol(command);              
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.setAudioVolume(command);
                      }
                      else
                      {
                        
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.setAudioVolume(command);
                      }
                      else
                      {
                          kindStreamInterface.controlAudioIn(command);
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      kindStreamInterface.controlAudioIn(command);
                      break;
              }
            }

            function micStatusON(_streamingmode, command) {
              UniversialManagerService.setMicOn(command);
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.startAudioTalk();
                      }
                      else
                      {
                        stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.startAudioTalk();
                      }
                      else
                      {
                        kindStreamInterface.controlAudioOut('on');
                        // $timeout(function(){
                        //   kindStreamInterface.controlAudioOut(UniversialManagerService.getMicVol());
                        // },300);
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      kindStreamInterface.controlAudioOut('on');
                      // $timeout(function(){
                      //   kindStreamInterface.controlAudioOut(UniversialManagerService.getMicVol());
                      // },300);
                      break;
              }
            }

            function micStatusOFF(_streamingmode, command) {
              UniversialManagerService.setMicOn(command);
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                    {
                      PluginControlService.stopAudioTalk();
                    }
                    else
                    {
                      stopStreaming(elem);
                      elem.empty();
                      createNoSupportPlaybackInPlugInElement();
                    }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                    if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                    {
                      PluginControlService.stopAudioTalk();
                    }
                    else
                    {
                      kindStreamInterface.controlAudioOut('off');
                    }
                    break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                    kindStreamInterface.controlAudioOut('off');
                    break;
              }
            }                                           

            function changeMicVolume(_streamingmode, command) {
              UniversialManagerService.setMicVol(command);              
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.setAudioTalkVolume(command);
                      }
                      else
                      {
                        
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                          PluginControlService.setAudioTalkVolume(command);
                      }
                      else
                      {
                          kindStreamInterface.controlAudioOut(command);
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      kindStreamInterface.controlAudioOut(command);
                      break;
              }
            }            

            function record(_streamingmode, recordInfo) {
              switch(BrowserService.BrowserDetect)
              {
                  case BrowserService.BROWSER_TYPES.IE:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                        if(recordInfo.command === 'start')
                        {
                          PluginControlService.startRecord(recordInfo.callback);
                        }
                        else if(recordInfo.command === 'stop')
                        {
                          PluginControlService.stopRecord(recordInfo.callback);
                        }
                      }
                      else
                      {
                        stopStreaming(elem);
                        elem.empty();
                        createNoSupportPlaybackInPlugInElement();
                      }
                    break;
                  case BrowserService.BROWSER_TYPES.SAFARI:
                      if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                      {
                        if(recordInfo.command === 'start')
                        {
                          PluginControlService.startRecord(recordInfo.callback);
                        }
                        else if(recordInfo.command === 'stop')
                        {
                          PluginControlService.stopRecord(recordInfo.callback);
                        }
                      }
                      else
                      {
                        if(recordInfo.command === 'start')
                        {
                          KindControlService.startRecord(scope, recordInfo);
                        }
                        else if(recordInfo.command === 'stop')
                        {
                          KindControlService.stopRecord(scope, recordInfo);
                        }
                      }
                      break;
                  case BrowserService.BROWSER_TYPES.CHROME:
                  case BrowserService.BROWSER_TYPES.EDGE:
                  case BrowserService.BROWSER_TYPES.FIREFOX:
                  /* jshint ignore:start */
                  default :
                  /* jshint ignore:end */
                      if(recordInfo.command === 'start')
                      {
                        KindControlService.startRecord(scope , recordInfo);
                      }
                      else if(recordInfo.command === 'stop')
                      {
                        KindControlService.stopRecord(scope, recordInfo);
                      }
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
                    elem.empty();
                    PluginControlService.stopStreaming();
                    $rootScope.$emit('app/scripts/directives/channelPlayer.js:disablePlayback', false);
                  }
                  else
                  {
                    stopStreaming(elem, scope);
                    elem.empty();
                    if( isPlaybackMode === true ) {
                      createNoSupportPlaybackInPlugInElement();
                      $rootScope.$emit('app/scripts/directives/channelPlayer.js:disablePlayback', true);
                    }
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.stopStreaming();
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
            function playbackBackup(_streamingmode, data, _callback) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    createPlugInElement();
                    var pluginObj = elem[0].getElementsByTagName('object')[0];
                    PluginControlService.startPlaybackBackup(pluginObj, data, _callback);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    createPlugInElement();
                    var pluginObj = elem[0].getElementsByTagName('object')[0];
                    PluginControlService.startPlaybackBackup(pluginObj, data, _callback);
                  }
                  else
                  {
                    createKindElement();
                    KindControlService.startPlaybackBackup(scope, data, _callback);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  createKindElement();
                  KindControlService.startPlaybackBackup(scope, data, _callback);
                  break;
              }
            }

            function checkNeedToSpeakerStatus(StreamingMode) {
              if( UniversialManagerService.isSpeakerOn()) {
                speakerStatusON(StreamingMode);
                changeSpeakerVolume(StreamingMode, UniversialManagerService.getSpeakerVol());
              }
            }

            function playback(_streamingmode, data, timeCallback, errorCallback) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    createPlugInElement();
                    var pluginObj = elem[0].getElementsByTagName('object')[0];
                    PluginControlService.startPlayback(pluginObj, data, timeCallback, errorCallback);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    createPlugInElement();
                    var pluginObj = elem[0].getElementsByTagName('object')[0];
                    PluginControlService.startPlayback(pluginObj, data, timeCallback, errorCallback);
                  }
                  else
                  {
                    createKindElement();
                    KindControlService.startPlayback(scope, data, timeCallback, errorCallback);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  createKindElement();
                  KindControlService.startPlayback(scope, data, timeCallback, errorCallback);
                  break;
              }
              $timeout(function(){
                checkNeedToSpeakerStatus(_streamingmode);
              });
            }

            function resume(_streamingmode, data) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyResumeCommand(data);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyResumeCommand(data);
                  }
                  else
                  {
                    KindControlService.applyResumeCommand(scope, data);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.applyResumeCommand(scope, data);
                  break;
              }
            }

            function step(_streamingmode, data) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyStepCommand(data);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyStepCommand(data);
                  }
                  else
                  {
                    $rootScope.$emit('app/scripts/directives/channelPlayer.js:step', data);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  $rootScope.$emit('app/scripts/directives/channelPlayer.js:step', data);
                  break;
              }
            }            

            function seek(_streamingmode, data) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applySeekCommand(data);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applySeekCommand(data);
                  }
                  else
                  {
                    KindControlService.applySeekCommand(scope, data);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.applySeekCommand(scope, data);
                  break;
              }
            }

            function pause(_streamingmode) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyPauseCommand();
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyPauseCommand();
                  }
                  else
                  {
                    KindControlService.applyPauseCommand(scope);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.applyPauseCommand(scope);
                  break;
              }
            }

            function speed(_streamingmode, speed, data) {
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyPlaySpeed(speed, data);
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.applyPlaySpeed(speed, data);
                  }
                  else
                  {
                    KindControlService.applyPlaySpeed(scope, speed, data);
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.applyPlaySpeed(scope, speed, data);
                  break;
              }
            }

            function closePlayback(_streamingmode) {
              $rootScope.$emit('blockTimebarInputField', false);
              switch(BrowserService.BrowserDetect)
              {
                case BrowserService.BROWSER_TYPES.IE:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.closePlaybackSession();
                    elem.empty();
                  }
                  else
                  {
                    stopStreaming(elem);
                    elem.empty();
                    createNoSupportPlaybackInPlugInElement();
                  }
                  break;
                case BrowserService.BROWSER_TYPES.SAFARI:
                  if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                  {
                    PluginControlService.closePlaybackSession();
                    elem.empty();
                  }
                  else
                  {
                    KindControlService.closePlaybackSession(scope);
                    angular.element(elem.find('kind_stream')).remove();
                    if( scope.child.$destroy !== undefined ) {
                      scope.child.$destroy();
                    }
                  }
                  break;
                case BrowserService.BROWSER_TYPES.CHROME:
                case BrowserService.BROWSER_TYPES.EDGE:
                case BrowserService.BROWSER_TYPES.FIREFOX:
                /* jshint ignore:start */
                default :
                /* jshint ignore:end */
                  KindControlService.closePlaybackSession(scope);
                  angular.element(elem.find('kind_stream')).remove();
                  if( scope.child.$destroy !== undefined ) {
                    scope.child.$destroy();
                  }
                  break;
              }
            }

            function setManualTrackingMode(_streamingmode, _type, _mode)
            {
                switch(BrowserService.BrowserDetect)
                {
                    case BrowserService.BROWSER_TYPES.IE:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setManualTrackingMode(_mode);
                        }
                        else
                        {
                            //?
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.SAFARI:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setManualTrackingMode(_mode);
                        }
                        else
                        {
                            KindControlService.setManualTrackingMode(_mode);
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.CHROME:
                    case BrowserService.BROWSER_TYPES.EDGE:
                    case BrowserService.BROWSER_TYPES.FIREFOX:
                        /* jshint ignore:start */
                    default :
                        /* jshint ignore:end */
                        KindControlService.setManualTrackingMode(_mode);
                        break;
                }
            }

            function setAreaZoomMode(_streamingmode, _type ,_mode)
            {
                switch(BrowserService.BrowserDetect)
                {
                    case BrowserService.BROWSER_TYPES.IE:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setAreaZoomMode(_mode);
                        }
                        else
                        {
                            stopStreaming(elem);
                            elem.empty();
                            createNoSupportPlaybackInPlugInElement();
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.SAFARI:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setAreaZoomMode(_mode);
                        }
                        else
                        {
                            KindControlService.setAreaZoomMode(_mode);
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.CHROME:
                    case BrowserService.BROWSER_TYPES.EDGE:
                    case BrowserService.BROWSER_TYPES.FIREFOX:
                    /* jshint ignore:start */
                    default :
                        /* jshint ignore:end */
                        KindControlService.setAreaZoomMode(_mode);
                        break;
                }
            }

            function setAreaZoomAction(_streamingmode, _command)
            {
                switch(BrowserService.BrowserDetect)
                {
                    case BrowserService.BROWSER_TYPES.IE:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setAreaZoomAction(_command);
                        }
                        else
                        {
                            stopStreaming(elem);
                            elem.empty();
                            createNoSupportPlaybackInPlugInElement();
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.SAFARI:
                        if(_streamingmode === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE)
                        {
                            PluginControlService.setAreaZoomAction(_command);
                        }
                        else
                        {
                            KindControlService.setAreaZoomAction(_command);
                        }
                        break;
                    case BrowserService.BROWSER_TYPES.CHROME:
                    case BrowserService.BROWSER_TYPES.EDGE:
                    case BrowserService.BROWSER_TYPES.FIREFOX:
                    /* jshint ignore:start */
                    default :
                        /* jshint ignore:end */
                        KindControlService.setAreaZoomAction(_command);
                        break;
                }
            }

            $rootScope.$saveOn('channelPlayer:play', function(event, pluginMode, ip, port, profile, id, password, streamTagType, statusCallback, isReconnect) {
                console.log("Requested Play { plugInMode : " + pluginMode + ", Profile : " + profile + " }");

                $rootScope.$emit('changeLoadingBar', true);

                //1. Check PlugIn Installed.
                if((pluginMode === true)&& (BrowserService.PlugInDetect === false))
                {
                  stopStreaming(elem);

                  //2. Check if request is first or not.
                  if(elem[0].childNodes.length === 0)
                  {
                    requestAvailableProfile(profile);
                  }
                  else
                  {
                    elem.empty();
                    createPlugInInstallElement();
                    $rootScope.$emit('changeLoadingBar', false);
                  }
                  return;  
                }
                
                //3. Stop Previous Streaming
                stopStreaming(elem);

                //4. Check Requested Profile
                if(checkProfileAvailable(pluginMode, profile) === false)
                {
                   elem.empty();
                  if(BrowserService.PlugInSupport && BrowserService.PlugInDetect)
                  {
                      //IE ?��?��그인 ?��?��?�� // PlugIn Off ?��?��?��?�� H264, H265 ?���? ?��
                      $rootScope.$emit("channel:setPlugin");
                  }
                  else {
                      //?���? ?��?��리오
                      createPlugInInstallElement();
                      $rootScope.$emit('changeLoadingBar', false);
                  }

                  //NonPlugIn ?��?�� ?��?��리오
                  //requestAvailableProfile(profile);
                  return;
                }

                //5. Stream Element Check
                if(StreamElementDetect(pluginMode, elem) === false)
                {
                  deleteStreamElement(pluginMode);
                  createStreamElement(pluginMode);
                }

                //prevent blocking of UI for allow excute plugin
                $rootScope.$emit('changeLoadingBar', false);

                //6. Plugin Version Check
                if((pluginMode === true) && (BrowserService.PlugInVersionCheck(elem) === false))
                {
                  elem.empty();
                  createPlugInInstallElement();
                  return;
                }

                //7. Start Streaming
                startStreaming(pluginMode, ip, port, profile, id, password, streamTagType, statusCallback, isReconnect);
            }, scope);

            $rootScope.$saveOn('channelPlayer:command', function(event, type, command, callback) {
                console.log("Requested command {  Type : " + type + " }");
                var StreamingMode = UniversialManagerService.getStreamingMode();

                switch(type)
                {
                  case 'capture':
                    capture(StreamingMode);
                    break;
                  case 'record':
                    record(StreamingMode, command);
                    break;
                  case 'stopLive' :
                    stopLiveForPlayback(StreamingMode, command);
                    break;
                  case 'playbackBackup':
                    playbackBackup(StreamingMode, command, callback);
                    break;
                  case 'playback':
                    playback(StreamingMode, command, callback.timeCallback, callback.errorCallback);
                    break;
                  case 'resume':
                    resume(StreamingMode, command );
                    break;
                  case 'seek':
                    seek(StreamingMode, command);
                    break;
                  case 'pause':
                    pause(StreamingMode);
                    break;
                  case 'speed':
                    speed(StreamingMode, command.speed, command.data);
                    break;
                  case 'close':
                    closePlayback(StreamingMode);
                    break;
                  case 'pixelCount':
                    pixelCount(StreamingMode, type, command);
                    break;
                  case 'speakerStatus':
                    if(command) {
                      speakerStatusON(StreamingMode, command);
                    }
                    else {
                      speakerStatusOFF(StreamingMode, command);
                    }
                    break;    
                  case 'speakerVolume':
                    changeSpeakerVolume(StreamingMode, command);
                    break;
                  case 'micStatus' :
                    if(command) {
                      micStatusON(StreamingMode, command);
                    }
                    else {
                      micStatusOFF(StreamingMode, command);
                    }
                    break;
                  case 'micVolume':
                    changeMicVolume(StreamingMode, command);
                    break;
                  case 'step':
                    step(StreamingMode, command);
                    break;
                  case 'manualTracking' :
                    setManualTrackingMode(StreamingMode, type, command);
                    break;
                  case 'areaZoomMode' :
                    setAreaZoomMode(StreamingMode, type, command);
                    break;
                  case 'areaZoomAction' :
                    setAreaZoomAction(StreamingMode, command);
                    break;
                  default:
                    break;
                }
            }, scope);            
        }
    };
}]);
