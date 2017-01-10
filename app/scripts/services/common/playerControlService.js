/**
 * Created by dohyuns.kim on 2016-09-06.
 */
kindFramework
  .service('KindControlService', ['$rootScope', 'LoggingService', 'kindStreamInterface', '$interval', 'UniversialManagerService', 'ConnectionSettingService', 'Attributes',
    'ModalManagerService','$translate', 'CAMERA_STATUS',
    function($rootScope, LoggingService, kindStreamInterface, $interval, UniversialManagerService, ConnectionSettingService, Attributes,
             ModalManagerService, $translate, CAMERA_STATUS){
      var Live4NVRProfile = "Live4NVR";
      var NonPluginProfile = "PLUGINFREE";
      var NonPluginResolution = "1280x720";
      var NonPluginResolution_Multi = "1536x676";
      var NonPluginResolution_Fish_9M = "1280x1280";
      var NonPluginResolution_Fish_12M = "800x600";
      var sunapiAttributes = Attributes.get();  //--> not common.

      var getDateStr = function() {
        var dt = new Date();
        var dateStr =  dt.getFullYear() + "";
        dateStr += (dt.getMonth() < 9 ? "0" + (dt.getMonth() +1) : (dt.getMonth() +1)) + "";
        dateStr += (dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate()) + " ";
        dateStr += (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) + "";
        dateStr += (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes()) + "";
        dateStr += (dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds());
        return dateStr;
      };

      this.startRecord = function(_scope, _callback)
      {
        var fileName = sunapiAttributes.ModelName + ' ' + getDateStr();
        _scope.playerdata = ConnectionSettingService.backupCommand('start', fileName, _callback);
      }

      this.stopRecord = function(_scope)
      {
        _scope.playerdata = ConnectionSettingService.backupCommand('stop', null, null);
      }

      this.capture = function(_scope)
      {
        _scope.playerdata.media.requestInfo.cmd = 'capture';
        _scope.playerdata.device.captureName = sunapiAttributes.ModelName + ' ' + getDateStr();
      }

      this.startPlaybackBackup = function(_scope, data, _errorCallback){
        _scope.playerdata.callback.error = _errorCallback;
        _scope.playerdata.device.captureName = sunapiAttributes.ModelName+"_"+data.time;
        _scope.playerdata.media.type = 'backup';
        _scope.playerdata.media.requestInfo.cmd = 'backup';
        _scope.playerdata.media.requestInfo.url = "recording/"+data.time+"/OverlappedID="+data.id+"/play.smp";
        console.log(_scope.playerdata.media.requestInfo.url);
      };

      this.startKindStreaming = function(_scope ,_profile, _streamtagtype) {
        var logger = LoggingService.getInstance('ChannelCtrl');
        var closeCallback = function(error) {
          logger.log(error);
        };
        var timeCallback = function(time) {
          logger.log('[timestamp]', time.timestamp, ':[timezone]', time.timezone);
        };

        var disconnectedUI = function(){
          var disconnectedTimer = kindStreamInterface.getEventTimer();
          var elem = kindStreamInterface.getStreamCanvas();
          if(disconnectedTimer !== undefined || disconnectedTimer !== null){
            window.clearTimeout(disconnectedTimer);
          }
          elem[0].style.border = "3px solid orange";
          disconnectedTimer = window.setTimeout(function(){
            elem[0].style.border = "0px";
          }, 15000);
          kindStreamInterface.setEventTimer(disconnectedTimer);
        };

        var reconnectionInterval = null;
        var errorCallback = function(error) {
          logger.log("errorcode:", error.errorCode, "error string:", error.description, "error place:", error.place);

          switch(error.errorCode)
          {
            case '200':
              $interval.cancel(reconnectionInterval);
              $rootScope.$emit('changeLoadingBar', false);
              break;
            case '999':
              console.log("disconnect detected");
              disconnectedUI();
              $rootScope.$emit('changeLoadingBar', true);
              reconnectionInterval = $interval(function(){
                console.log(" :: reconnectionInterval");
                //If playback mode, live reconnection is not required.
                if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK){
                  $rootScope.$emit('changeLoadingBar', false);
                  return;
                }

                var RequestProfile = UniversialManagerService.getProfileInfo();
                var PlayData = ConnectionSettingService.getPlayerData('live', RequestProfile, timeCallback, errorCallback, closeCallback);
                kindStreamInterface.changeStreamInfo(PlayData);
              },5000);
              break;
            case '997': // below 50 FPS
            case '996': // no Available Profile
              var UserName = UniversialManagerService.getUserId();
              var ProfileAuth = AccountService.isProfileAble();
              var CurrentProfile = UniversialManagerService.getProfileInfo();

              if (UserName === "guest" || (UserName !== "admin" && ProfileAuth === false)) {
                ModalManagerService.open('message', { 'buttonCount': 1, 'message': "lang_msg_not_profile_auth" } );
              } else {
                if (CurrentProfile !== undefined) {
                  /* T
                   * his is for PLUGINFREE Profile
                   if ($scope.isLoading === false && CurrentProfile.Name !== NonPluginProfile && CurrentProfile.Name !== Live4NVRProfile) {
                   $rootScope.$emit('changeLoadingBar', true);
                   console.log("[Alert] Profile Size !!");
                   ModalManagerService.open('profileSizeAlert',{'buttonCount': 1});
                   changeToDefaultProfile();
                   }
                   */
                } else {
                  ModalManagerService.open('message', { 'buttonCount': 1, 'message': $translate.instant('lang_msg_invalidValue') } );
                }
              }
              break;
            case '404':
              break;
            case '503':
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open('message', { 'buttonCount': 1, 'message': $translate.instant('lang_service_unavailable') } );
              break;
          }
        };

        var RequestProfile = UniversialManagerService.getProfileInfo();
        var PlayerData = null;

        if(_streamtagtype === 'canvas')
        {
          PlayerData = ConnectionSettingService.getPlayerData('live', RequestProfile , timeCallback, errorCallback, closeCallback);
        }
        else if(_streamtagtype === 'video')
        {
          PlayerData = ConnectionSettingService.getPlayerData('live', RequestProfile , timeCallback, errorCallback, closeCallback, _streamtagtype);
        }

        console.log("Kind Streaming Started");

        _scope.playerdata = PlayerData;
        $rootScope.$emit('changeLoadingBar', false);
      }

      this.stopStreaming = function(_channelPlayerElement) {
        if(_channelPlayerElement.find('kind_stream').length !== 0)
        {

        }
      }

      this.startPlayback = function(_scope, data, timeCallback, errorCallback){
        _scope.playerdata = ConnectionSettingService.getPlaybackDataSet(data, timeCallback, errorCallback );
      };

      this.applyResumeCommand = function(_scope, data) {
        _scope.playerdata = ConnectionSettingService.applyResumeCommand(data);
      };

      this.applySeekCommand = function(_scope, data){
        _scope.playerdata = ConnectionSettingService.applySeekCommand(data);
      };

      this.applyPauseCommand = function(_scope){
        _scope.playerdata = ConnectionSettingService.applyPauseCommand();
      };

      this.applyPlaySpeed = function( _scope, speed, data) {
        _scope.playerdata = ConnectionSettingService.applyPlaySpeed(speed, data);
      };

      this.closePlaybackSession = function(_scope){
        _scope.playerdata = ConnectionSettingService.closePlaybackSession();
      };

      var waitUWAProfile = function () {
        var deferred = $q.defer();
        var isExistUWA = false;
        $timeout(function () {
          SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
            function (response) {
              var ProfileList = response.data.VideoProfiles[0].Profiles;
              UniversialManagerService.setProfileList(ProfileList);
              for (var i = 0; i < ProfileList.length; i++) {
                if (ProfileList[i].Name === NonPluginProfile) {
                  isExistUWA = true;
                  deferred.resolve(ProfileList[i].Profile);
                  $rootScope.$emit('changeLoadingBar', false);
                  break;
                }
              }
              if(!isExistUWA){
                waitUWAProfile().then(function(_profileNumber){ deferred.resolve(_profileNumber); });
              }
            },
            function (errorData) {
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
            },'', true);
        },500);
        return deferred.promise;
      };

      var waitLive4NVRProfile = function () {
        var deferred = $q.defer();
        var isExistLive4NVR = false;
        $timeout(function () {
          SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
            function (response) {
              var ProfileList = response.data.VideoProfiles[0].Profiles;
              UniversialManagerService.setProfileList(ProfileList);
              for (var i = 0; i < ProfileList.length; i++) {
                if (ProfileList[i].Name === Live4NVRProfile) {
                  deferred.resolve(ProfileList[i].Profile);
                  isExistLive4NVR = true;
                  $rootScope.$emit('changeLoadingBar', false);
                  break;
                }
              }
              if(!Live4NVR){
                waitLive4NVRProfile().then(function(_profileNumber){ deferred.resolve(_profileNumber); });
              }
            },
            function (errorData) {
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
            },'', true);
        },500);
        return deferred.promise;
      };

      var sunapiErrorFunc = function(errorData) {
        if (errorData === "Duplicate Value In List") {
          var list = UniversialManagerService.getProfileList();
          for (var i = 0; i < list.length; i++) {
            if (list[i].Name === NonPluginProfile) {
              $rootScope.$emit('newProfile', list[i]);
              break;
            }
          }
          $rootScope.$emit('changeLoadingBar', false);
        } else {
          $rootScope.$emit('changeLoadingBar', false);
          ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
        }
      };

      function addDefaultProfile(resolution) {
        var deferred = $q.defer();
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=add&Name=" + NonPluginProfile + "&EncodingType=H264";
        sunapiURI += "&ATCTrigger=Network&ATCMode=Disabled&SVNPMulticastEnable=False&RTPMulticastEnable=False&Resolution=" + resolution;
        sunapiURI += "&FrameRate=20&CompressionLevel=10&Bitrate=2048&AudioInputEnable=False";
        sunapiURI += "&H264.BitrateControlType=VBR&H264.PriorityType=FrameRate&H264.GOVLength=20";
        sunapiURI += "&H264.Profile=Main&H264.EntropyCoding=CABAC";

        SunapiClient.get(sunapiURI, '',
          function (response) {
            waitUWAProfile().then( function(_profileNumber){ deferred.resolve(_profileNumber); });
          },
          function (errorData) {
            sunapiErrorFunc(errorData);
          },'', true);
        return deferred.promise;
      }

      function addFisheyeDefaultProfile() {
        var deferred = $q.defer();
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', '',
          function (response) {
            var SensorSize = response.data.VideoSources[0].SensorCaptureSize;
            if (SensorSize == "9M") {
              addDefaultProfile(NonPluginResolution_Fish_9M).then(function(_profileNumber){ deferred.resolve(_profileNumber);});
            } else {
              addDefaultProfile(NonPluginResolution_Fish_12M).then(function(_profileNumber){ deferred.resolve(_profileNumber);});
            }
          },
          function (errorData) {
            console.log(errorData);
          }, '', true
        );
        return deferred.promise;
      }

      function revertFisheyeDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', '',
          function (response) {
            var sensorSize = response.data.VideoSources[0].SensorCaptureSize;
            var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&Resolution=";
            ModalManagerService.open('message', { 'buttonCount': 0, 'message': 'Change PLUGINFREE Resolution' } );
            if (sensorSize == "9M") {
              sunapiURI += NonPluginResolution_Fish_9M + "&FrameRate=20&ViewModeIndex=0&Profile=" + (_profileIndex + 1);
            } else {
              sunapiURI += NonPluginResolution_Fish_12M + "&FrameRate=20&ViewModeIndex=0&Profile=" + (_profileIndex + 1);
            }

            SunapiClient.get(sunapiURI, '',
              function (response) {
                waitUWAProfile().then(function(_profileNumber){ deferred.resolve(_profileNumber); });
              },
              function (errorData) {
                deferred.reject();
                sunapiErrorFunc(errorData);
              },'', true);
          },
          function (errorData) {
            deferred.reject();
            console.log(errorData);
          }, '', true
        );
        return deferred.promise;
      }

      function revertMultiimagerDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': 'Change PLUGINFREE Resolution' } );
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&Resolution=" + NonPluginResolution_Multi + "&Profile=" + (_profileIndex + 1);
        SunapiClient.get(sunapiURI, '',
          function (response) {
            waitUWAProfile().then( function(_profileNumber){ deferred.resolve(_profileNumber); });
          },
          function (errorData) {
            sunapiErrorFunc(errorData);
          },'', true);
        return deferred.promise;
      }

      function revertDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': 'Change PLUGINFREE Resolution' } );
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&Resolution=" + NonPluginResolution + "&Profile=" + (_profileIndex + 1);
        return SunapiClient.get(sunapiURI, '',
          function (response) {
            waitUWAProfile().then( function(_profileNumber){ deferred.resolve(_profileNumber); });
          },
          function (errorData) {
            sunapiErrorFunc(errorData);
          },'', true);
        return deferred.promise;
      }

      function revertLiveNVRDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': 'Change Live4NVR Resolution' } );
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&Resolution=" + NonPluginResolution + "&Profile=" + (_profileIndex + 1);
        SunapiClient.get(sunapiURI, '',
          function (response) {
            waitLive4NVRProfile().then( function(_profileNumber){ deferred.resolve(_profileNumber); });
          },
          function (errorData) {
            sunapiErrorFunc(errorData);
          },'', true);
        return deferred.promise;
      }

      function createPLUGINFREEProfile() {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var ProfileIndex = 0;
        var ProfileList = UniversialManagerService.getProfileList();
        /* jshint ignore:start */

        setTimeout(
          function(){
            for (ProfileIndex = 0; ProfileIndex < ProfileList.length; ProfileIndex++) {
              if (ProfileList[ProfileIndex].Name === NonPluginProfile) {
                var Resolution = ProfileList[ProfileIndex].Resolution.split('x');
                var size = Resolution[0] * Resolution[1];

                if (sunapiAttributes.FisheyeLens == true) {   //for fish eye
                  if (size <= 1280 * 1280) {
                    deferred.resolve(ProfileIndex+1);
                  } else {
                    revertFisheyeDefaultProfile(ProfileIndex).then(
                      function(){ deferred.resolve(ProfileIndex+1); },
                      function(){ deferred.reject(); }
                    );
                  }
                } else if (sunapiAttributes.MultiImager == true) {   //for multiImager
                  if (size <= 1536 * 676) {
                    deferred.resolve(ProfileIndex+1);
                  } else {
                    revertMultiimagerDefaultProfile(ProfileIndex).then(
                      function(){ deferred.resolve(ProfileIndex+1); },
                      function(){ deferred.reject(); }
                    );
                  }
                } else {
                  if (size <= 1280 * 720) {
                    deferred.resolve(ProfileIndex+1);
                  } else {
                    revertDefaultProfile(ProfileIndex).then(
                      function(){ deferred.resolve(ProfileIndex+1); },
                      function(){ deferred.reject(); }
                    );
                  }
                }
                break;
              }
              else if(ProfileList[ProfileIndex].Name === Live4NVRProfile)
              {
                var Resolution = ProfileList[ProfileIndex].Resolution.split('x');
                var size = Resolution[0] * Resolution[1];

                if (size <= 1280 * 720) {
                  deferred.resolve(ProfileIndex+1);
                } else {
                  revertLiveNVRDefaultProfile(ProfileIndex).then(
                    function(){ deferred.resolve(ProfileIndex+1); },
                    function(){ deferred.reject(); }
                  );
                }
                break;
              }
            }
            /* jshint ignore:end */

            if (ProfileIndex === ProfileList.length) {
              if (sunapiAttributes.FisheyeLens == true) {
                addFisheyeDefaultProfile().then(
                  function(_profileNumber){ deferred.resolve(_profileNumber); },
                  function(){ deferred.reject(); }
                );
              } else if (sunapiAttributes.MultiImager == true) {
                addDefaultProfile(NonPluginResolution_Multi).then(
                  function(_profileNumber){ deferred.resolve(_profileNumber); },
                  function(){ deferred.reject(); }
                );
              } else {
                addDefaultProfile(NonPluginResolution).then(
                  function(_profileNumber){ deferred.resolve(_profileNumber); },
                  function(){ deferred.reject(); }
                );
              }
            }
          } ,300);

        return deferred.promise;
      };
    }]);