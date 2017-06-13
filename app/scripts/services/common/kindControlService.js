kindFramework.
  service('KindControlService', ['$rootScope', 'LoggingService', 'kindStreamInterface',
    'UniversialManagerService', 'ConnectionSettingService', 'Attributes', 'ModalManagerService',
    '$translate', 'CAMERA_STATUS', 'EventNotificationService', 'AccountService', '$q', 
    'SunapiClient', '$timeout', 'PTZContorlService', 'PTZ_TYPE',
    function($rootScope, LoggingService, kindStreamInterface, UniversialManagerService,
      ConnectionSettingService, Attributes, ModalManagerService, $translate, CAMERA_STATUS,
      EventNotificationService, AccountService, $q, SunapiClient, $timeout, PTZContorlService, 
      PTZ_TYPE) {
      var sunapiAttributes = Attributes.get(); //--> not common.
      var NonPluginProfile = "PLUGINFREE";
      var MIN_DOUBLE_FIGURES = 10;
      var nonPluginResolution = {
        'multi' : '1536x676',
        'Fisheye9M' : "1280x1280",
        'Fisheye12M' : "800x600",
      };
      var NON_PLUGIN_RESOLUTION = {
        'MULTI' : {
          'WIDTH' : 1536,
          'HEIGHT' : 676,
        },
        'FISHEYE' : {
          'WIDTH' : 1280,
          'HEIGHT' : 1280,
        },
      };
      var ERROR_CODE = {
        'ARGUMENT_ERROR' : 300,
        'PROFILE_UNAVAILABLE' : 503,
        'TALK_UNAVAILABLE' : 504,
        'PLUGINFREE' : 996,
        'DISCONNECT' : 999,
      }
      var TIMEOUT = 500;
      var NonPluginResolutionArray = getResolutionListForRatio();
      var NonPluginSelectNum = 0;
      var changePluginFlag = false;
      var liveStatusCallback = null;

      var getDateStr = function() {
        var dt = new Date();
        var dateStr = dt.getFullYear() + "";
        dateStr += (dt.getMonth()+1 < MIN_DOUBLE_FIGURES ? "0" + (dt.getMonth() + 1) :
                                                           (dt.getMonth() + 1)) + "";
        dateStr += (dt.getDate() < MIN_DOUBLE_FIGURES ? "0" + dt.getDate() : 
                                                        dt.getDate()) + " ";
        dateStr += (dt.getHours() < MIN_DOUBLE_FIGURES ? "0" + dt.getHours() : 
                                                        dt.getHours()) + "";
        dateStr += (dt.getMinutes() < MIN_DOUBLE_FIGURES ? "0" + dt.getMinutes() : 
                                                          dt.getMinutes()) + "";
        dateStr += (dt.getSeconds() < MIN_DOUBLE_FIGURES ? "0" + dt.getSeconds() : 
                                                          dt.getSeconds());
        return dateStr;
      };

      this.startRecord = function(_scope, info) {
        var fileName = sunapiAttributes.ModelName + ' ' + getDateStr();
        var recordInfo = {
          'menu': 'start',
          'channel': info.channel,
          'fileName': fileName,
          'callback': info.callback,
        };
        _scope.playerdata = ConnectionSettingService.backupCommand(recordInfo);
      }

      this.stopRecord = function(_scope, info) {
        var recordInfo = {
          'menu': 'stop',
          'channel': info.channelId,
        };
        _scope.playerdata = ConnectionSettingService.backupCommand(recordInfo);
      }

      this.capture = function(_scope) {
        _scope.playerdata.media.requestInfo.cmd = 'capture';
        _scope.playerdata.device.captureName = sunapiAttributes.ModelName + ' ' + getDateStr();
      }

      this.startPlaybackBackup = function(_scope, data, _errorCallback) {
        _scope.playerdata = ConnectionSettingService.playbackBackup(data,
          sunapiAttributes.ModelName + "_" + data.time, _errorCallback);
      };

      this.startKindStreaming = function(_scope, _profile, _streamtagtype, 
                                          statusCallback, isReconnect) {
        var logger = LoggingService.getInstance('ChannelCtrl');
        var closeCallback = function(error) {
          logger.log(error);
        };
        var timeCallback = function(time) {
          logger.log('[timestamp]', time.timestamp, ':[timezone]', time.timezone);
        };

        liveStatusCallback = statusCallback;

        var errorCallback = function(error) {
          logger.log("errorcode:", error.errorCode, "error string:", error.description, 
                    "error place:", error.place);

          switch (error.errorCode) {
            case '200':
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.close();

              //ManualTracking is Always On for PTZ model
              if (sunapiAttributes.PTZModel) {
                $rootScope.$emit('channelPlayer:command', 'manualTracking', true);
              }
              break;
            case '999':
              console.log("disconnect detected");
              var eventData = {
                type: 'NetworkDisconnection',
                value: 'true',
                eventId: null,
              };
              EventNotificationService.updateEventStatus(eventData);

              $rootScope.$emit('changeLoadingBar', true);

              //If playback mode, live reconnection is not required.
              if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
                $rootScope.$emit('changeLoadingBar', false);
                return;
              }
              liveStatusCallback(ERROR_CODE.DISCONNECT);
              break;
            case '997': // delay check 5sec
              var CurrentProfile = UniversialManagerService.getProfileInfo();
              if (CurrentProfile.Name === NonPluginProfile) {
                if (NonPluginSelectNum !== -1) {
                  NonPluginSelectNum = checkPLUGINFREEProfile();
                  if (NonPluginSelectNum === -1) {
                    ModalManagerService.open('message', {
                      'buttonCount': 1,
                      'message': $translate.instant('lang_msg_not_support_performance')
                    });
                    $rootScope.$emit('channelPlayer:command', 'stopLive', false);
                    break;
                  }
                } else {
                  break;
                }
              }
            case '996': // no Available Profile
              if (changePluginFlag === false && NonPluginSelectNum !== -1) {
                changePluginFree();
              }
              break;
            case '404':
              break;
            case '503': //profile unavailable
              $rootScope.$emit('changeLoadingBar', false);
              liveStatusCallback(ERROR_CODE.PROFILE_UNAVAILABLE);
              break;
            case '504': //Talk unavailable
              $rootScope.$emit('changeLoadingBar', false);
              liveStatusCallback(ERROR_CODE.TALK_UNAVAILABLE);
              break;
          }
        };

        var RequestProfile = UniversialManagerService.getProfileInfo();

        UniversialManagerService.setVideoMode(_streamtagtype);
        // workerManager.setLiveMode(_streamtagtype);
        kindStreamInterface.setIspreview(false, 'live');

        if (_streamtagtype === 'canvas') {
          _scope.playerdata = 
              ConnectionSettingService.getPlayerData('live', RequestProfile, timeCallback, 
                                      errorCallback, closeCallback, _streamtagtype);
        } else if (_streamtagtype === 'video') {
          _scope.playerdata = 
              ConnectionSettingService.getPlayerData('live', RequestProfile, 
                                        timeCallback, errorCallback, closeCallback, _streamtagtype);
        }

        if (isReconnect === true) {
          kindStreamInterface.changeStreamInfo(_scope.playerdata);
        }

        console.log("Kind Streaming Started");
        $rootScope.$emit('changeLoadingBar', false);
      }

      this.stopStreaming = function(_channelPlayerElement, _scope) {
      }

      this.startPlayback = function(_scope, data, timeCallback, errorCallback) {
        _scope.playerdata = 
            ConnectionSettingService.startPlayback(data, timeCallback, errorCallback);
      };

      this.applyResumeCommand = function(_scope, data) {
        _scope.playerdata = ConnectionSettingService.applyResumeCommand(data);
      };

      this.applySeekCommand = function(_scope, data) {
        _scope.playerdata = ConnectionSettingService.applySeekCommand(data);
      };

      this.applyPauseCommand = function(_scope) {
        _scope.playerdata = ConnectionSettingService.applyPauseCommand();
      };

      this.applyPlaySpeed = function(_scope, speed, data) {
        _scope.playerdata = ConnectionSettingService.applyPlaySpeed(speed, data);
      };

      this.closePlaybackSession = function(_scope) {
        _scope.playerdata = ConnectionSettingService.closePlaybackSession();
      };

      this.closeStream = function(_scope) {
        _scope.playerdata = ConnectionSettingService.closeStream();
      };

      this.setManualTrackingMode = function(_mode) {
        try {

          if (_mode !== true && _mode !== false) {
            throw new Error(ERROR_CODE.ARGUMENT_ERROR, "Argument Error");
          } else {
            $rootScope.$emit('channel:overlayCanvas');
            $rootScope.$emit('overlayCanvas::command', "manualTracking", _mode);

            console.log("kindControlService::setManualTrackingMode() ===>" + _mode + 
                        "manualTracking");
          }
        } catch (err) {
          console.log(err.message);
        }
      };

      this.setAreaZoomMode = function(_mode) {
        try {
          if (_mode !== true && _mode !== false) {
            throw new Error(ERROR_CODE.ARGUMENT_ERROR, "Argument Error");
          } else {
            $rootScope.$emit('channel:overlayCanvas');
            $rootScope.$emit('overlayCanvas::command', "areaZoomMode", _mode);

            console.log("kindControlService::setAreaZoomMode() ===>" + _mode + "AreaZoom");
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
            default:
              throw new Error(ERROR_CODE.ARGUMENT_ERROR, "Argument Error");
          }
          console.log("kindControlService::setAreaZoomAction() ===>" + _command);
        } catch (err) {
          console.log(err.message);
        }
      };

      var waitUWAProfile = function() {
        var deferred = $q.defer();
        var isExistUWA = false;
        $timeout(function() {
          SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
            function(response) {
              var ProfileList = response.data.VideoProfiles[0].Profiles;
              UniversialManagerService.setProfileList(ProfileList);
              for (var i = 0; i < ProfileList.length; i++) {
                if (ProfileList[i].Name === NonPluginProfile) {
                  isExistUWA = true;
                  deferred.resolve(ProfileList[i].Profile - 1);
                  $rootScope.$emit('changeLoadingBar', false);
                  break;
                }
              }
              if (!isExistUWA) {
                waitUWAProfile();
              }
            },
            function(errorData) {
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open('message', {
                'buttonCount': 0,
                'message': errorData,
              });
            }, '', true);
        }, TIMEOUT);
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
          ModalManagerService.open('message', {
            'buttonCount': 0,
            'message': errorData,
          });
        }
      };

      function addDefaultProfile(resolution) {
        var deferred = $q.defer();
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=add&Name=" + 
                        NonPluginProfile + "&EncodingType=H264";
        sunapiURI += "&ATCTrigger=Network&ATCMode=Disabled&Resolution=" + resolution;
        sunapiURI += "&FrameRate=20&CompressionLevel=10&Bitrate=2048"; //AudioInputEnable=False";
        sunapiURI += "&H264.BitrateControlType=VBR&H264.PriorityType=FrameRate&H264.GOVLength=20";
        sunapiURI += "&H264.Profile=Main&H264.EntropyCoding=CABAC";
        if (sunapiAttributes.MaxChannel > 1) {
          sunapiURI += "&Channel=" + UniversialManagerService.getChannelId();
        }



        SunapiClient.get(sunapiURI, '',
          function(response) {
            waitUWAProfile().then(function(_profileNumber) {
              deferred.resolve(_profileNumber);
            });
          },
          function(errorData) {
            sunapiErrorFunc(errorData);
          }, '', true);
        return deferred.promise;
      }

      function addFisheyeDefaultProfile() {
        var deferred = $q.defer();
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', '',
          function(response) {
            var SensorSize = response.data.VideoSources[0].SensorCaptureSize;
            if (SensorSize === "9M") {
              addDefaultProfile(nonPluginResolution.Fisheye9M).then(function(_profileNumber) {
                deferred.resolve(_profileNumber);
              });
            } else {
              addDefaultProfile(nonPluginResolution.Fisheye12M).then(function(_profileNumber) {
                deferred.resolve(_profileNumber);
              });
            }
          },
          function(errorData) {
            console.log(errorData);
          }, '', true
        );
        return deferred.promise;
      }

      function revertFisheyeDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', '',
          function(response) {
            var sensorSize = response.data.VideoSources[0].SensorCaptureSize;
            var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&"+
                            "EncodingType=H264&Resolution=";
            ModalManagerService.open('message', {
              'buttonCount': 0,
              'message': 'Change PLUGINFREE Resolution',
            });
            if (sensorSize === "9M") {
              sunapiURI += nonPluginResolution.Fisheye9M + 
                        "&FrameRate=20&ViewModeIndex=0&Profile=" + (_profileIndex + 1);
            } else {
              sunapiURI += nonPluginResolution.Fisheye12M + 
                        "&FrameRate=20&ViewModeIndex=0&Profile=" + (_profileIndex + 1);
            }

            SunapiClient.get(sunapiURI, '',
              function(response) {
                waitUWAProfile().then(function(_profileNumber) {
                  deferred.resolve(_profileNumber);
                });
              },
              function(errorData) {
                deferred.reject();
                sunapiErrorFunc(errorData);
              }, '', true);
          },
          function(errorData) {
            deferred.reject();
            console.log(errorData);
          }, '', true
        );
        return deferred.promise;
      }

      function revertMultiimagerDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        ModalManagerService.open('message', {
          'buttonCount': 0,
          'message': 'Change PLUGINFREE Resolution',
        });
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&"+
                        "FrameRate=20&EncodingType=H264&Resolution=" + nonPluginResolution.multi + 
                        "&Profile=" + (_profileIndex + 1);
        SunapiClient.get(sunapiURI, '',
          function(response) {
            waitUWAProfile().then(function(_profileNumber) {
              deferred.resolve(_profileNumber);
            });
          },
          function(errorData) {
            sunapiErrorFunc(errorData);
          }, '', true);
        return deferred.promise;
      }

      function revertDefaultProfile(_profileIndex) {
        var deferred = $q.defer();
        ModalManagerService.open('message', {
          'buttonCount': 0,
          'message': 'Change PLUGINFREE Resolution'
        });
        var sunapiURI = "/stw-cgi/media.cgi?msubmenu=videoprofile&action=update&"+
                        "FrameRate=20&EncodingType=H264&Resolution=" + 
                        NonPluginResolutionArray[NonPluginSelectNum] + "&Profile=" + 
                        (_profileIndex + 1);
        if (sunapiAttributes.MaxChannel > 1) {
          sunapiURI += "&Channel=" + UniversialManagerService.getChannelId();
        }
        SunapiClient.get(sunapiURI, '',
          function(response) {
            waitUWAProfile().then(function(_profileNumber) {
              deferred.resolve(_profileNumber);
            });
          },
          function(errorData) {
            sunapiErrorFunc(errorData);
          }, '', true);
        return deferred.promise;
      }

      function gcd(a, b) {
        return (b === 0) ? a : gcd(b, a % b);
      }

      function getResolutionListForRatio() {
        var sunapiURI = '/stw-cgi/media.cgi?msubmenu=videocodecinfo&action=view';
        if (sunapiAttributes.MaxChannel > 1) {
          sunapiURI += "&Channel=" + UniversialManagerService.getChannelId();
        }
        SunapiClient.get(sunapiURI, '',
          function(response) {
            var VideoCodes = response.data.VideoCodecInfo[0].ViewModes[0].Codecs;
            for (var idx = 0; idx < VideoCodes.length; idx++) {
              if (VideoCodes[idx].EncodingType === "H264") {
                NonPluginResolutionArray = getListRatioArray(VideoCodes[idx].General);
              }
            }
          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      }

      function getListRatioArray(list) {
        var resolutionArray = new Array();
        var standardRatio = null;

        for (var id = 0; id < list.length; id++) {
          var aspectRatio=-1,
            aspectWitdth=-1,
            aspectHeight=-1;

          aspectRatio = gcd(list[id].Width, list[id].Height);
          aspectWitdth = list[id].Width / aspectRatio;
          aspectHeight = list[id].Height / aspectRatio;

          if (aspectWitdth > 16) {
            aspectWitdth = 16;
          }

          if (aspectHeight > 9) {
            aspectHeight = '9+';
          }

          if (standardRatio === null) {
            standardRatio = aspectWitdth + ":" + aspectHeight;
            if (list[id].Width <= 1920 && list[id].Height <= 1080) {
              resolutionArray.push(list[id].Width + 'x' + list[id].Height);
            }
          } else {
            if (standardRatio === (aspectWitdth + ":" + aspectHeight)) {
              resolutionArray.push(list[id].Width + 'x' + list[id].Height);
            }
          }
        }
        return resolutionArray;
      }

      function changePluginFree() {
        var UserName = UniversialManagerService.getUserId();
        var ProfileAuth = AccountService.isProfileAble();
        var CurrentProfile = UniversialManagerService.getProfileInfo();

        if (UserName === "guest" || (UserName !== "admin" && ProfileAuth === false)) {
          $rootScope.$emit('channelPlayer:command', 'stopLive', false);
          ModalManagerService.open('message', {
            'buttonCount': 1,
            'message': "lang_msg_not_profile_auth",
          });
        } else {
          if (typeof CurrentProfile !== "undefined") {
            changePluginFlag = true;
            $rootScope.$emit('changeLoadingBar', true);
            ModalManagerService.open('message', {
              'buttonCount': 1,
              'message': $translate.instant('lang_videoplaydifficult') + 
                          $translate.instant('lang_defaultprofileapplied'),
            });
            createPLUGINFREEProfile().then(
              function(data) {
                liveStatusCallback(ERROR_CODE.PLUGINFREE, data);
                changePluginFlag = false;
              },
              function(error) {
                console.log("createPLUGINFREEProfile::error = " + error);
              }
            );
          } else {
            ModalManagerService.open('message', {
              'buttonCount': 1,
              'message': $translate.instant('lang_msg_invalidValue'),
            });
          }
        }
      }

      function createPLUGINFREEProfile() {
        var deferred = $q.defer();

        var ProfileIndex = 0;
        var ProfileList = UniversialManagerService.getProfileList();
        /* jshint ignore:start */

        setTimeout(
          function() {
            for (ProfileIndex = 0; ProfileIndex < ProfileList.length; ProfileIndex++) {
              if (ProfileList[ProfileIndex].Name === NonPluginProfile) {
                var Resolution = ProfileList[ProfileIndex].Resolution.split('x');
                var size = Resolution[0] * Resolution[1];
                var codec = ProfileList[ProfileIndex].EncodingType;

                if (sunapiAttributes.FisheyeLens === true) { //for fish eye
                  if (size <= 
                        NON_PLUGIN_RESOLUTION.FISHEYE.WIDTH*NON_PLUGIN_RESOLUTION.FISHEYE.HEIGHT && 
                        codec === "H264") {
                    deferred.resolve(ProfileIndex);
                  } else {
                    revertFisheyeDefaultProfile(ProfileIndex).then(
                      function() {
                        deferred.resolve(ProfileIndex);
                      },
                      function() {
                        deferred.reject();
                      }
                    );
                  }
                } else if (sunapiAttributes.MultiImager === true) { //for multiImager
                  if (size <= 
                        NON_PLUGIN_RESOLUTION.MULTI.WIDTH*NON_PLUGIN_RESOLUTION.MULTI.HEIGHT &&
                        codec === "H264") {
                    deferred.resolve(ProfileIndex);
                  } else {
                    revertMultiimagerDefaultProfile(ProfileIndex).then(
                      function() {
                        deferred.resolve(ProfileIndex);
                      },
                      function() {
                        deferred.reject();
                      }
                    );
                  }
                } else {
                  if (typeof NonPluginResolutionArray !== "undefined") {
                    var freeResolution = NonPluginResolutionArray[NonPluginSelectNum].split('x');
                    var NonPluginSize = freeResolution[0] * freeResolution[1];
                    if (size <= NonPluginSize && codec === "H264") {
                      deferred.resolve(ProfileIndex);
                    } else {
                      $rootScope.$emit('channelPlayer:command', 'stopLive', false);
                      revertDefaultProfile(ProfileIndex).then(
                        function() {
                          deferred.resolve(ProfileIndex);
                        },
                        function() {
                          deferred.reject();
                        }
                      );
                    }
                  } else {
                    deferred.resolve(ProfileIndex);
                  }
                }
                break;
              }
            }
            /* jshint ignore:end */

            if (ProfileIndex === ProfileList.length) {
              if (sunapiAttributes.FisheyeLens === true) {
                addFisheyeDefaultProfile().then(
                  function(_profileNumber) {
                    deferred.resolve(_profileNumber);
                  },
                  function() {
                    deferred.reject();
                  }
                );
              } else if (sunapiAttributes.MultiImager === true) {
                addDefaultProfile(nonPluginResolution.multi).then(
                  function(_profileNumber) {
                    deferred.resolve(_profileNumber);
                  },
                  function() {
                    deferred.reject();
                  }
                );
              } else {
                addDefaultProfile(NonPluginResolutionArray[0]).then(
                  function(_profileNumber) {
                    deferred.resolve(_profileNumber);
                  },
                  function() {
                    deferred.reject();
                  }
                );
              }
            }
          }, 300);

        return deferred.promise;
      }

      function checkPLUGINFREEProfile() {
        var curResolution = UniversialManagerService.getProfileInfo().Resolution.split('x');
        var curResolutionSize = (typeof size === "undefined" ? curResolution[0] * curResolution[1] : size);
        var selectNum = -1;

        if (typeof NonPluginResolutionArray !== "undefined") {
          for (var index = 0; index < NonPluginResolutionArray.length; index++) {
            var resolution = NonPluginResolutionArray[index].split('x');
            var size = resolution[0] * resolution[1];

            if (size < curResolutionSize) {
              selectNum = index;
              break;
            }
          }
        }

        return selectNum;
      }
    },
  ]);