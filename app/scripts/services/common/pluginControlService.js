"use strict";
kindFramework.
  service('PluginControlService', ['$rootScope', '$timeout', 'Attributes', 'SunapiClient', 
    'UniversialManagerService', '$interval', 'kindStreamInterface', 'ModalManagerService', 
    '$translate', 'CAMERA_STATUS', 'EventNotificationService', 'PlayDataModel', 
    'PTZContorlService', 'PTZ_TYPE', 'RESTCLIENT_CONFIG', 'BrowserService',
    function($rootScope, $timeout, Attributes, SunapiClient, UniversialManagerService, $interval,
      kindStreamInterface, ModalManagerService, $translate, CAMERA_STATUS, 
      EventNotificationService, PlayDataModel, PTZContorlService, PTZ_TYPE, RESTCLIENT_CONFIG, BrowserService) {
      var sunapiAttributes = Attributes.get(); //--> not common.
      var pluginElement = null,
        rtspIP = null,
        rtspPort = null,
        userID = null,
        currentProfile = null;
      var backupCallback = null;
      var PlugInPromise = null;
      var playbackTime = '';
      var overlappedID = 0;
      var timelineCallback = null;
      var playbackCallback = null;
      var playSpeed = 1;
      var _self = this;
      var stepFlag = null;
      var playbackMode = 1;
      var liveStatusCallback = null;
      var macWheelEvent = false;
      var TIMEOUT = 500;
      var DEFAULT_FPS = 30;
      var DECIMAL = 10;
      var ERROR_CODE = {'NO_FILE':13, 'ARGUMENT_ERR' : 300, 'PLUGIN_EMPTY' : 400};
      var CALLBACK = {'INSTANCE_START' : 101, 'INSTANCE_END' : 102, 'INSTANCE_ERR':103,
        'BACKUP_START':104, 'BACKUP_END':105, 'BACKUP_ERR':106, 
        'AREAZOOM' :311, 'TIMESTAMP' : 351 };
      var EVENT_TYPE = {1:'MotionDetection', 2:'VideoAnalytics', 3:'TamperingDetection',
        4:'FaceDetection', 5:'DefocusDetection', 6:'Fog', 7:'AudioDetection',
        8:'SoundClassification', 9:'DigitalInput', 10:'DigitalAutoTracking',
        11:'Relay', 12:'NetworkDisconnection', 13:'PTMove', 14:'Queue', 15:'AutoTracking',
        16:'TrackingEnable'};

      var windowEvent = window.attachEvent || window.addEventListener,
        beforeUnloadEvt = window.attachEvent ? 'onbeforeunload' : 'beforeunload';

      windowEvent(beforeUnloadEvt, function() {
        _self.stopStreaming();
      });

      this.startPluginStreaming = function(pluginObj, _ip, _port, _profile, _id, 
                                        _password, statusCallback) {
        pluginElement = pluginObj;
        rtspIP = RESTCLIENT_CONFIG.digest.hostName;
        rtspPort = _port;
        userID = _id;
        currentProfile = _profile;
        liveStatusCallback = statusCallback;

        var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
        pluginElement.width = parseInt(resolution[0], 10);
        pluginElement.height = parseInt(resolution[1], 10);

        var fps = UniversialManagerService.getProfileInfo().FrameRate;

        EventNotificationService.setBorderElement($(pluginElement), 'live');

        if (PlugInPromise !== null) {
          // pluginElement.PlayLiveStream ?��?�� ?�� ��?? Profile ��??��?? ?����???�� ?��?��?�� 경우
          $timeout.cancel(PlugInPromise);
        }

        function startPlay() {
          if (reconnectionTimeout !== null) {
            $timeout.cancel(reconnectionTimeout);
          }

          PlugInPromise = $timeout(function() {
            try {
              if (sunapiAttributes.MaxChannel > 1) {
                pluginElement.SetWMDInitialize(Number(UniversialManagerService.getChannelId()), 
                                                1, "WebCamJSONEvent");
              }

              var renderDelay = 1;
              if(typeof window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") !== undefined && window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") !== null){
                var quality = window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") === "true"? true : false;
                if(quality !== true){
                  renderDelay = 0;
                }
              }

              pluginElement.SetUserFps(fps);
              pluginElement.SetRenderDelay(renderDelay);

              pluginElement.PlayLiveStream(rtspIP, Number(rtspPort), Number(currentProfile - 1), 
                                          userID, '', '');
              $rootScope.$emit('changeLoadingBar', false);
              $(pluginElement).removeClass("cm-visibility-hidden");
              console.log("pluginControlService::startPluginStreaming() ===> PlugIn Streaming Started");
            } catch (err) {
              console.log("pluginControlService::startPluginStreaming() ===> PlugIn is loading...");
              startPlay();
            }
          }, TIMEOUT);
        }
        startPlay();

        if(BrowserService.OSDetect === BrowserService.OS_TYPES.MACINTOSH && macWheelEvent === false){
          $(".cm-play-area").bind('mousewheel', function(event){
            try {
              pluginElement.FireMouseWheel(event.clientX,event.clientY,event.deltaY);
              macWheelEvent = true;
            }
            catch (err) {
            } 
          });
        }
      };

      this.stopStreaming = function() {
        if (PlugInPromise !== null) {
          $timeout.cancel(PlugInPromise);
          PlugInPromise = null;
        }
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          $(pluginElement).css("border", "3px solid transparent");
          if (UniversialManagerService.isSpeakerOn()) {
            pluginElement.StopAudio();
          }
          if (UniversialManagerService.isMicOn()) {
            pluginElement.StopTalk();
          }
          var pluginDestroyMode = 3;
          pluginElement.CloseStream();
          pluginElement.ChangeMode(pluginDestroyMode);
          if (backupCallback !== null) {
            backupCallback({
              'errorCode': 1
            }); // Instant recording end
            backupCallback = null;
          }
          pluginElement = null;
          console.log("pluginControlService::stopStreaming() ===> Plugin Streaming Stopped");
        }
      };

      this.startAudioListen = function() {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.SetVolume(0);
          pluginElement.StartAudio();
          console.log("pluginControlService::startAudioListen() ===> Plugin Audio Started");
        }
      };

      this.stopAudioListen = function() {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.StopAudio();
          console.log("pluginControlService::stopAudioListen() ===> Plugin Audio stop");
        }
      };

      this.setAudioVolume = function(command) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.SetVolume(command);
          console.log("pluginControlService::setAudioVolume() ===> Plugin Audio volume changed to " + command);
        }
      };

      this.startAudioTalk = function() {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          var checkMic = pluginElement.StartTalk('');
          if (parseInt(checkMic, 10) !== 1) {
            liveStatusCallback(504); //Talk service unavailable
          }
          // var vol = UniversialManagerService.getMicVol() * 20;
          // pluginElement.SetAudioTalkVolume(vol);
          console.log("pluginControlService::startAudioTalk() ===> Plugin Audio talk Started");
        }
      };

      this.stopAudioTalk = function() {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.StopTalk();
          console.log("pluginControlService::stopAudioTalk() ===> Plugin Audio talk Stop");
        }
      };

      this.setAudioTalkVolume = function(command) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          var vol = command * 20;
          pluginElement.SetAudioTalkVolume(vol);
          console.log("pluginControlService::setAudioTalkVolume() ===> Plugin Audio talk volume changed to " + command);
        }
      };

      this.capture = function() {
        var strPath = pluginElement.SaveSnapShotNoDialog(MakeRecordFileName());
        console.log("pluginControlService::capture() ===> ");
        return strPath;
      };

      this.pixcelCount = function(command) {
        var channelId = UniversialManagerService.getChannelId();
        var rotate = UniversialManagerService.getRotate(channelId);
        var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
        var width = parseInt(resolution[0], 10);
        var height = parseInt(resolution[1], 10);

        if (rotate === '90' || rotate === '270') {
          width = parseInt(resolution[1], 10);
          height = parseInt(resolution[0], 10);
        }

        pluginElement.SetPixelCounterOnOff_WH((command.cmd === true ? 1 : 0), 
                                              parseInt(width), parseInt(height));
        console.log("pluginControlService::pixcelCount() ===> ");
      };
      /* Playback interface */
      function openStream() {
        PlugInPromise = $timeout(function() {
          try {
            if (sunapiAttributes.MaxChannel > 1) {
              pluginElement.SetWMDInitialize(Number(UniversialManagerService.getChannelId()), 1, "WebCamJSONEvent");
            }
            pluginElement.SetUserFps(DEFAULT_FPS);
            pluginElement.SetRenderDelay(1);
            pluginElement.OpenRecordStream(rtspIP, Number(rtspPort), userID, '', '', overlappedID, playbackTime, '', playbackMode);
            $rootScope.$emit('changeLoadingBar', false);
            $(pluginElement).removeClass("cm_vn");
            console.log("pluginControlService::startPlayback() ===> PlugIn playback Started");
          } catch (err) {
            console.log("pluginControlService::startPlayback() ===> PlugIn is loading...");
            openStream();
          }
        }, TIMEOUT);
      }

      this.startPlayback = function(pluginObj, data, _timelineCallback, errorCallback) {

        pluginElement = pluginObj;

        pluginElement.width = 0;
        pluginElement.height = 0;

        playbackTime = data.time;
        rtspIP = RESTCLIENT_CONFIG.digest.hostName;
        rtspPort = data.rtspPort;
        userID = data.userID;
        playSpeed = 1;
        playbackMode = 1;

        overlappedID = Number(data.id);
        timelineCallback = _timelineCallback;
        playbackCallback = errorCallback;

        openStream();
      };

      this.startPlaybackBackup = function(pluginObj, data, errorCallback) {

        pluginElement = pluginObj;
        pluginElement.width = 0;
        pluginElement.height = 0;

        playbackTime = data.time;
        rtspIP = RESTCLIENT_CONFIG.digest.hostName;
        rtspPort = data.rtspPort;
        userID = data.userID;
        playbackMode = 3;

        overlappedID = Number(data.id);
        timelineCallback = null;
        backupCallback = errorCallback;

        openStream();
      };

      this.applyResumeCommand = function(data) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.ResumeRecordStreamImmediate(data.time, data.needToImmediate);
          console.log("pluginControlService::applyResumeCommand() ===> data time: " + data.time);
        }
      };

      this.applyStepCommand = function(data) {
        var playdata = new PlayDataModel();
        playdata.setDefautPlaySpeed();
        playSpeed = 1;
        var time = playdata.getCurrentPosition();

        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.StepRecordStream((data === "forward" ? 1 : 2), time);
          stepFlag = true;
          console.log("pluginControlService::applyStepCommand() ===> direction: " + data);
        }
      };

      this.applySeekCommand = function(data) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          pluginElement.PlayRecordStream(data.time, '', playSpeed);
          console.log("pluginControlService::applySeekCommand() ===> data time: " + data.time + "playSpeed" + playSpeed);
        }
      };

      this.applyPauseCommand = function() {
        pluginElement.PauseRecordStream();
        console.log("pluginControlService::applyPauseCommand()");
      };

      this.applyPlaySpeed = function(speed, data) {
        playSpeed = Number(speed);
        pluginElement.SetPlaySpeed(Number(speed), data.time);
        console.log("pluginControlService::applyPlaySpeed() ===> speed: " + speed,
                    "time:", data.time);
      };

      this.closePlaybackSession = function() {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          if (UniversialManagerService.isSpeakerOn()) {
            pluginElement.StopAudio();
          }
          _self.stopStreaming();
          timelineCallback = null;
          playbackCallback = null;
          console.log("pluginControlService::closePlaybackSession()");
        }
      };

      function leadingZeros(_num, digits) {
        var zero = '';
        var num = _num.toString();
        if (num.length < digits) {
          for (var i = 0; i < digits - num.length; i++) {
            zero += '0';
          }
        }
        return zero + num;
      }

      function MakeRecordFileName() {
        var date = new Date();
        var defaultFilename = sunapiAttributes.ModelName + "_" +
          leadingZeros(date.getFullYear(), 4) +
          leadingZeros(date.getMonth() + 1, 2) +
          leadingZeros(date.getDate(), 2) +
          leadingZeros(date.getHours(), 2) +
          leadingZeros(date.getMinutes(), 2) +
          leadingZeros(date.getSeconds(), 2);

        return defaultFilename;
      }

      this.startRecord = function(_callback) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          backupCallback = _callback;
          // jshint ignore:line
          pluginElement.StartLocalRecording(MakeRecordFileName());
          console.log("pluginControlService::startRecord() ===> Start record");
        }
      };

      this.stopRecord = function(_callback) {
        if (pluginElement !== null && typeof pluginElement !== "undefined") {
          // jshint ignore:line
          pluginElement.StopLocalRecording();
          console.log("pluginControlService::stopRecord() ===> Stop record");
        }
      };

      this.setManualTrackingMode = function(_mode) {
        try {
          if (pluginElement !== null && typeof pluginElement !== "undefined") {
            // jshint ignore:line
            if (_mode !== true && _mode !== false) {
              throw new Error(ERROR_CODE.ARGUMENT_ERR, "Argument Error");
            }

            if (_mode) {
              pluginElement.SetManualTrackingModeOnOff(1);
            } else {
              pluginElement.SetManualTrackingModeOnOff(0);
            }
            console.log("pluginControlService::setManualTrackingMode() ===>" + _mode + " Manual Tracking");
          } else {
            throw new Error(ERROR_CODE.PLUGIN_EMPTY, "PlugIn Element is empty");
          }
        } catch (err) {
          console.log(err.message);
        }
      };

      this.setAreaZoomMode = function(_mode) {
        try {
          if (pluginElement !== null && typeof pluginElement !== "undefined") {
            // jshint ignore:line
            if (_mode !== true && _mode !== false) {
              throw new Error(ERROR_CODE.ARGUMENT_ERR, "Argument Error");s
            }

            if (_mode) {
              pluginElement.SetAreaZoomOnOff(1);
            } else {
              pluginElement.SetAreaZoomOnOff(0);
            }
            console.log("pluginControlService::setAreaZoomMode() ===>" + _mode + " Area Zoom");
          } else {
            throw new Error(ERROR_CODE.PLUGIN_EMPTY, "PlugIn Element is empty");
          }
        } catch (err) {
          console.log(err.message);
        }
      };

      this.setAreaZoomAction = function(_command) {
        try {
          switch (_command) {
            case '1X':
              PTZContorlService.getPTZAreaZoomURI("1x");
              break;
            case 'Prev':
              PTZContorlService.getPTZAreaZoomURI("prev");
              break;
            case 'Next':
              PTZContorlService.getPTZAreaZoomURI("next");
              break;
          }
        } catch (err) {
          console.log(err.message);
        }
      };

      function updatePluginEventNotification(eventType, status) {
        var data = {
          type: '',
          value: false,
          eventId: null,
        };

        data.value = (status === 0) ? 'false' : 'true';
        data.type = EVENT_TYPE[eventType];
        if ( data.type === 'Relay') {
          //alarm output : status == 10  ==> alarm ID : 1, status : true
          //alarm output : status == 11  ==> alarm ID : 1, status : false
          data.value = (status % DECIMAL === 0) ? 'false' : 'true';
          data.eventId = parseInt((status / DECIMAL), DECIMAL);
        } else if ( data.type === 'PTMove') {
          //for AreaZoom, PT & Zoom are IDLE
          data.type = '';
          $rootScope.$emit('PTZMoveStatus', {
            type: 'MoveStatus:PanTilt',
            value: 'IDLE',
          });
          $rootScope.$emit('PTZMoveStatus', {
            type: 'MoveStatus:Zoom',
            value: 'IDLE',
          });
        } else if ( data.type === 'Queue') {//QueueManagement : status == 10  ==> Level : High, status : false
          data.value = (status % DECIMAL === 0) ? 'false' : 'true'; //                  status == 20  ==> Level : Middle, status : false
          data.eventId = parseInt((status / DECIMAL), DECIMAL); //                  status == 21  ==> Level : Middle, status : true  
        }

        EventNotificationService.updateEventStatus(data);
      }

      function runManualTracking(xPos, yPos) {
        var pluginElement = document.getElementsByTagName("channel_player")[0].getElementsByTagName("object")[0];

        PTZContorlService.setMode(PTZ_TYPE.ptzCommand.TRACKING);
        PTZContorlService.setManualTrackingMode("True");

        if (xPos >= 0 && yPos >= 0) {
          var channelId = UniversialManagerService.getChannelId();
          var rotate = UniversialManagerService.getRotate(channelId);
          if (rotate === '90' || rotate === '270') {
            xPos = Math.ceil(xPos * (10000 / pluginElement.offsetHeight));
            yPos = Math.ceil(yPos * (10000 / pluginElement.offsetWidth));
          } else {
            xPos = Math.ceil(xPos * (10000 / pluginElement.offsetWidth));
            yPos = Math.ceil(yPos * (10000 / pluginElement.offsetHeight));
          }
          PTZContorlService.execute([xPos, yPos]);
        }
      }

      function runAreaZoomString(Pos1, Pos2) {
        var setData = {};
        var pluginElement = document.getElementsByTagName("channel_player")[0].getElementsByTagName("object")[0];

        var LengthPos1 = String(Pos1).length;
        var LengthPos2 = String(Pos2).length;
        setData.X1 = parseInt(Number(Pos1) / 10000);
        setData.Y1 = Number(String(Pos1).substring(String(setData.X1).length, LengthPos1));

        setData.X2 = parseInt(Number(Pos2) / 10000);
        setData.Y2 = Number(String(Pos2).substring(String(setData.X2).length, LengthPos2));

        setData.TileWidth = pluginElement.GetWidth();
        setData.TileHeight = pluginElement.GetHeight();

        PTZContorlService.setPTZAreaZoom("start");
        PTZContorlService.runPTZAreaZoom(setData.X1, setData.Y1, setData.X2, setData.Y2, 
                                        setData.TileWidth, setData.TileHeight);
      }

      function runAreaZoom(x1, y1, x2, y2) {
        var pluginElement = document.getElementsByTagName("channel_player")[0].getElementsByTagName("object")[0];

        PTZContorlService.setPTZAreaZoom("start");
        PTZContorlService.runPTZAreaZoom(x1, y1, x2, y2, pluginElement.offsetWidth, 
                                        pluginElement.offsetHeight);
      }

      var reconnectionTimeout = null;
      window.WebCamEvent = function(evId, lp, rp) {
        $timeout(function() {
          _WebCamEvent(evId, lp, rp);
        }, 0);
      };

      var processPlaybackResponse = function(evId, lp, rp) {
        var callbackMessage = {};
        if ( evId === CALLBACK.INSTANCE_START) {
          callbackMessage.errorCode = 0;
        } else if ( evId === CALLBACK.INSTANCE_END ||
          evId === CALLBACK.INSTANCE_ERR) {
          callbackMessage.errorCode = 1;
        } else if ( evId === CALLBACK.BACKUP_START) {
          $rootScope.$emit('changeLoadingBar', true);
          callbackMessage.errorCode = 0;
          callbackMessage.description = 'backup';
        } else if (evId === CALLBACK.BACKUP_END) {
          callbackMessage.errorCode = 1;
          callbackMessage.description = 'backup';
        } else if ( evId === CALLBACK.BACKUP_ERR) {
          callbackMessage.description = 'backup';
          if ( lp === ERROR_CODE.NO_FILE) {
            callbackMessage.errorCode = -3;
          } else {
            callbackMessage.errorCode = -1;
          }
        }
        if ( backupCallback !==null) {
          backupCallback(callbackMessage);
          console.log("___callback:", callbackMessage);
        }
      };

      function _WebCamEvent(evId, lp, rp) {
        console.log("Plugin WebEvent callback =======> EventID :" + evId + " Lparam : " + lp + "  Rparam : " + rp);
        switch (evId) {
          case CALLBACK.INSTANCE_START:
          case CALLBACK.INSTANCE_END:
          case CALLBACK.INSTANCE_ERR:
          case CALLBACK.BACKUP_START:
          case CALLBACK.BACKUP_END:
          case CALLBACK.BACKUP_ERR:
            processPlaybackResponse(evId, lp, rp);
            break;
          case 301: //Event Notification
            updatePluginEventNotification(lp, rp);
            break;
          case CALLBACK.AREAZOOM: //AreaZoom
            runAreaZoomString(lp, rp);
            break;
          case 312: //Manual Tracking
            runManualTracking(lp, rp);
            break;
          case CALLBACK.TIMESTAMP:
            var time = {
              'timezone': lp,
              'timestamp': rp,
            };
            if (timelineCallback !== null) {
              if ( stepFlag !== null) {
                timelineCallback(time, stepFlag );
              } else {
                timelineCallback(time);
              }
            }
            break;
          case 352:
            if (reconnectionTimeout !== null) {
              $timeout.cancel(reconnectionTimeout);
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.close();
            }

            pluginElement.width = lp;
            pluginElement.height = rp;
            var viewMode = UniversialManagerService.getViewModeType();
            kindStreamInterface.setCanvasStyle(viewMode);
            break;
          case 400:
            switch (rp) {
              case 0: // RTSP Live Stream is connected
                //ManualTracking is Always On for PTZ model
                if (sunapiAttributes.PTZModel) {
                  $rootScope.$emit('channelPlayer:command', 'manualTracking', true);
                }
                break;
              case 1:
                if (timelineCallback !== null) {
                  pluginElement.PlayRecordStream(playbackTime, '', playSpeed);
                  if (playbackCallback !== null) {
                    playbackCallback({
                      'errorCode': "200"
                    });
                  }
                }
                break;
              case 3:
                pluginElement.StartBackupRecording(sunapiAttributes.ModelName + "_" + playbackTime, playbackTime, '');
                break;
            }
            break;
          case 401:
            $timeout(function() {
              if (rp === 0) {
                rtspDigestAuth('live');
                $timeout(function() {
                  if (UniversialManagerService.isSpeakerOn()) {
                    _self.startAudioListen();
                    _self.setAudioVolume(UniversialManagerService.getSpeakerVol());
                  }
                  if (UniversialManagerService.isMicOn()) {
                    _self.startAudioTalk();
                  }
                  if (UniversialManagerService.getPixelCount()) {
                    _self.pixcelCount({
                      cmd: true
                    });
                  }
                }, 500);
              } else if (rp === 1 || rp === 3) {
                rtspDigestAuth('playback');
              } else if (rp === 2) {
                rtspDigestAuth('audioTalk');
              }
            }, 100);
            break;
          case 402:
            console.log("402 error :: try reconnect");
            pluginElement.CloseStream();
            if (reconnectionTimeout !== null) {
              $timeout.cancel(reconnectionTimeout);
            }

            reconnectionTimeout = $timeout(liveStatusCallback, 5000, false, 999);

            $rootScope.$emit('changeLoadingBar', true);
            updatePluginEventNotification(12, 1);
            // $rootScope.$emit("pluginControlService:updateEvent", data);        
            break;
          case 503:
            if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
              if (playbackCallback !== null) {
                playbackCallback({
                  'errorCode': "503"
                });
              }
            } else {
              if (rp == 2) {
                liveStatusCallback(504); //Talk service unavailable
              } else {
                liveStatusCallback(503);
              }
            }
            break;
          case 600:
            $rootScope.$emit('changeLoadingBar', (lp == 0 ? false : true));
            break;
        }
      };

      window.WebCamJSONEvent = function(ch, evId, sdata) { //Mutl-directional Plugin webEvent
        setTimeout(function() {
          _WebCamJSONEvent(ch, evId, sdata);
        }, 0)
      };

      function _WebCamJSONEvent(ch, evId, sdata) {
        console.log("WebCamJSONEvent ch, evId, sdata => ", ch, evId, sdata);

        var jsonData = null;

        try {
          jsonData = JSON.parse(sdata); //safari
        } catch (e) {
          jsonData = sdata; //ie
        }

        switch (evId) {
          case 100:
            if (viewMode == '4ch') {
              viewer_mode_change(1, ch);
            } else {
              viewer_mode_change(4, ch);
            }
            break;
          case CALLBACK.INSTANCE_START:
          case CALLBACK.INSTANCE_END:
          case CALLBACK.INSTANCE_ERR:
          case CALLBACK.BACKUP_START:
          case CALLBACK.BACKUP_END:
          case CALLBACK.BACKUP_ERR:
            processPlaybackResponse(evId, jsonData.type);
            break;
          case 301: //Event Notification
            /*  jsonData
                {
                    data: Metadata,
                    type: metadata type
                }
            */
            updatePluginEventNotification(jsonData.type, jsonData.data);
            break;
          case 311: //AreaZoom
            /*  jsonData
                {
                    x1: x1 좌표,
                    y1: y1 좌표,
                    x2: x2 좌표,
                    y2: y2 좌표
                }
            */
            runAreaZoom(jsonData.x1, jsonData.y1, jsonData.x2, jsonData.y2);
            break;
          case 312: //Manual Tracking
            /*  jsonData
                {
                    x1: x1 좌표,
                    y1: y1 좌표   
                }
            */
            // runManualTracking(lp, rp);
            break;
          case CALLBACK.TIMESTAMP: //playback timestamp
            /*  jsonData
                {
                    gmp: GMP Data,
                    time: timeStamp
                }
            */
            if (timelineCallback !== null) {
              var timeInfo = {
                'timezone': jsonData.gmp,
                'timestamp': jsonData.time,
              };
              if (stepFlag !==null) {
                timelineCallback(timeInfo, stepFlag);
              } else {
                timelineCallback(timeInfo);
              }
            }
            break;
          case 352: //streaming resolution info
            /*  jsonData
                {
                    width: 1920,
                    height: 1080
                }
            */
            // if(reconnectionTimeout !== null)
            // {
            //     $timeout.cancel(reconnectionTimeout);
            //     $rootScope.$emit('changeLoadingBar', false);
            //     ModalManagerService.close();
            // }

            pluginElement.width = jsonData.width;
            pluginElement.height = jsonData.height;
            var viewMode = UniversialManagerService.getViewModeType();
            kindStreamInterface.setCanvasStyle(viewMode);
            break;
          case 400: //rtsp connection success
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            if (jsonData.type === 1) {
              if (timelineCallback !== null) {
                pluginElement.PlayRecordStream(playbackTime, '', playSpeed);
                if (playbackCallback !== null) {
                  playbackCallback({
                    'errorCode': "200"
                  });
                }
              }
            } else if (jsonData.type === 3) {
              pluginElement.StartBackupRecording(sunapiAttributes.ModelName + "_" + playbackTime, playbackTime, '');
            }
            break;
          case 401: //rtsp unauthorized(401)
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            $timeout(function() {
              if (jsonData.type === 0) {
                rtspDigestAuth('live');
                $timeout(function() {
                  if (UniversialManagerService.isSpeakerOn()) {
                    _self.startAudioListen();
                    _self.setAudioVolume(UniversialManagerService.getSpeakerVol());
                  }
                  if (UniversialManagerService.isMicOn()) {
                    _self.startAudioTalk();
                  }
                  if (UniversialManagerService.getPixelCount()) {
                    _self.pixcelCount({
                      cmd: true
                    });
                  }
                }, 500);
              } else if (jsonData.type === 1 || jsonData.type === 3) {
                rtspDigestAuth('playback');
              } else if (jsonData.type === 2) {
                rtspDigestAuth('audioTalk');
              }
            }, 100);
            break;
          case 402: //rtsp disconnection(5초간 미수?��?��)
            console.log("402 error :: try reconnect");
            pluginElement.CloseStream();
            if (reconnectionTimeout !== null) {
              $timeout.cancel(reconnectionTimeout);
            }

            reconnectionTimeout = $timeout(liveStatusCallback, 5000, false, 999);

            $rootScope.$emit('changeLoadingBar', true);
            updatePluginEventNotification(12, 1);
            // $rootScope.$emit("pluginControlService:updateEvent", data);        
            break;
          case 403: //Rtsp ?��?��?�� 계정 블록?
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            break;
          case 404: //Rtsp not found(404)
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            break;
          case 405: //Rtsp client error
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            break;
          case 455: //Call invalid rtsp method 
            break;
          case 457: //Rtsp range error
            break;
          case 503: //Rtsp service not available(503)
            /*  jsonData
                {
                    retrycnt: ?��?�� ?��?��,
                    type: ?����?? ????��
                }
            */
            if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
              if (playbackCallback !== null) {
                playbackCallback({
                  'errorCode': "503"
                });
              }
            } else {
              if (jsonData.type == 2) {
                liveStatusCallback(504); //Talk service unavailable
              } else {
                liveStatusCallback(503);
              }
            }
            break;
          case 600: //Step busy event 
            /*  jsonData
                {
                    busy: true/false
                }
            */
            // $rootScope.$emit('changeLoadingBar', (lp == 0 ? false : true));
            $rootScope.$emit('changeLoadingBar', jsonData.busy);
            break;
        }
      };

      function rtspDigestAuth(mode) {
        var getData = {};

        getData.Method = 'OPTIONS';

        if (mode === 'audioTalk') {
          getData.Realm = "iPOLiS";
          getData.Nonce = pluginElement.GetNonceAudioTalk();
        } else {
          getData.Realm = pluginElement.GetRealm();
          getData.Nonce = pluginElement.GetNonce();
        }

        getData.Uri = encodeURIComponent(pluginElement.GetRtspUrl());

        SunapiClient.get('/stw-cgi/security.cgi?msubmenu=digestauth&action=view', getData,
          function(response) {
            var responseValue = response.data.Response;
            switch (mode) {
              case 'live':
                var fps = UniversialManagerService.getProfileInfo().FrameRate;
                var renderDelay = 1;
                if(typeof window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") !== undefined && window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") !== null){
                  var quality = window.sessionStorage.getItem("HTW-PLUGIN-QUALITY") === "true"? true : false;
                  if(quality !== true){
                    renderDelay = 0;
                  }
                }
                pluginElement.SetUserFps(fps);
                pluginElement.SetRenderDelay(renderDelay);
                pluginElement.PlayLiveStream(rtspIP, Number(rtspPort), Number(currentProfile - 1), userID, '', responseValue);
                break;
              case 'playback':
                pluginElement.SetUserFps(30);
                pluginElement.SetRenderDelay(1);
                pluginElement.OpenRecordStream(rtspIP, Number(rtspPort), userID, '', responseValue, overlappedID, playbackTime, '', playbackMode);
                break;
              case 'audioTalk':
                pluginElement.StartTalk(responseValue);
                break;
            }

          },
          function(errorData, errorCode) {
            console.error(errorData);
          }, '', true);
      }
    }
  ]);