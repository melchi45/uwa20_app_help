kindFramework.directive('liveIconList', function(
  $rootScope,
  $timeout,
  Attributes,
  SunapiClient,
  CameraService,
  AccountService,
  BACKUP_STATUS,
  BrowserService,
  UniversialManagerService,
  CAMERA_STATUS,
  SearchDataModel
) {
  "use strict";
  return {
    restrict: 'E',
    replace: true,
    scope: false,
    templateUrl: 'views/livePlayback/directives/live-icon-list.html',
    link: function(scope, element, attrs) {
      var mAttr = Attributes.get();

      scope.disableAlarmOutput = function() {
        if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE &&
          UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE) {
          return true;
        } else {
          return false;
        }
      }

      scope.alarmOutputUser = function() {
        return AccountService.isAlarmOutputAble();
      }

      var backupCallback = function(data) {
        if (data.errorCode === BACKUP_STATUS.MODE.RECORDING) {
          $timeout(function() {
            scope.channelBasicFunctions.rec = true;
          });
        } else if (data.errorCode === BACKUP_STATUS.MODE.STOP) {
          $timeout(function() {
            scope.channelBasicFunctions.rec = false;
          });
        }
      };

      function backup() {
        var channelId = UniversialManagerService.getChannelId();
        var recordInfo = {
          'channel': channelId,
          'callback': backupCallback
        };
        if (scope.channelBasicFunctions.rec === false) {
          recordInfo.command = 'start';
          $rootScope.$emit('channelPlayer:command', 'record', recordInfo);
        } else {
          recordInfo.command = 'stop';
          $rootScope.$emit('channelPlayer:command', 'record', recordInfo);
        }
      }

      function pixelCountFunc() {
        if (scope.channelBasicFunctions.pixelCount) {
          scope.channelBasicFunctions.pixelCount = false;
        } else {
          scope.channelBasicFunctions.pixelCount = true;
        }

        var command = {
          cmd: scope.channelBasicFunctions.pixelCount
        };

        $rootScope.$emit('channelPlayer:command', 'pixelCount', command);
        $rootScope.$emit('livePTZControl:command', 'pixelCount', command);
      }

      $rootScope.$saveOn("liveIconList:command", function(event, mode, boolEnable) {
        switch (mode) {
          case "pixelCount":
            break;
          case "manualTracking":
            break;
          case "areaZoomMode":
            scope.channelBasicFunctions.pixelCount = false;
            break;
        }
      }, scope);

      function openFullscreenButton(e) {
        e.fullButton = true;
        $rootScope.$emit('channel:changeFullSetRec');
        $rootScope.$emit('channelContainer:openFullscreenButton', e);
      }

      function closeFullscreenButton(e) {
        e.fullButton = true;
        $rootScope.$emit('fullCamera:closeFullscreenButton', e);
      }

      function toggleChannelFunctions(type) {
        var PrevShowStatus = scope.channelSetFunctions["show"];
        if (scope.channelSetFunctions["show"] === false || scope.channelSetFunctions[type] === true) {
          scope.channelSetFunctions["show"] = !scope.channelSetFunctions["show"];
        }

        for (var key in scope.channelSetFunctions) {
          if (key !== "show") {
            if (key === type && scope.channelSetFunctions["show"] === true) {
              scope.channelSetFunctions[type] = true;
              if (type === 'status') {
                setProfileAccessInfo();
              } else if (type === 'setup') {
                scope.refreshSliders(500);
              } else if (type === 'ptz') {
                scope.openPTZ();
              }
            } else {
              scope.channelSetFunctions[key] = false;
            }
          }
        }

        if (scope.channelSetFunctions["show"] !== PrevShowStatus) {
          $timeout(scope.setChannelSize);
        }
      }

      $rootScope.$saveOn('liveIconList:setProfileAccessInfo', function(event) {
        $timeout(setProfileAccessInfo, 1000);
      });

      function setProfileAccessInfo() {
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=profileaccessinfo&action=view', '',
          function(response) {
            scope.$apply(function() {
              scope.profileAccessUserList = {};
              var channelId = UniversialManagerService.getChannelId();
              scope.profileAccessInfoList = response.data.ProfileAccessInfo.ProfileInfo[channelId].Profiles;
              var currentUsers = response.data.ProfileAccessInfo.Users;
              var index = 0;
              if (scope.isMultiChannel) {
                for (index = 0; index < currentUsers.length; index++) {
                  if (currentUsers[index].ChannelBasedUserProfile !== "undefined") {
                    currentUsers[index].ProfileNameList = {};
                    for (var j = 0; j < currentUsers[index].ChannelBasedUserProfile.length; j++) {
                      if (currentUsers[index].ChannelBasedUserProfile[j].Channel === channelId) {
                        currentUsers[index].ProfileNameList = currentUsers[index].ChannelBasedUserProfile[j].ProfileNameList;
                      }
                    }
                    if (currentUsers[index].ProfileNameList.length === 0) {
                      currentUsers.splice(index, 1);
                    }
                  }
                }
              }

              scope.profileAccessUserList = currentUsers;
              for (index = 0; index < scope.profileAccessInfoList.length; index++) {
                scope.profileAccessInfoList[index].Name = scope.profileList[index].Name;
              }

              $timeout(function() {
                $rootScope.$emit('liveMenuContent:setTableSize');
              });
            });
          },
          function(errorData) {}, '', true);
      }

      function setInit() {
        scope.wisenetCameraFuntions = {
          fullScreen: {
            'label': 'lang_fullScreen',
            'action': function(e) {
              if (scope.domControls.visibilityFullScreen) {
                closeFullscreenButton(e);
              } else {
                openFullscreenButton(e);
              }
              $rootScope.$emit('channel:overlayCanvas');
            },
            'class': 'tui-wn5-toolbar-fullscreen',
            'show': true,
            'disabled': false,
          },
          viewMode: {
            'label': 'viewMode',
            'action': function() {
              scope.domControls.changeViewMode();
            },
            'class': 'viewMode',
            'show': true,
            'disabled': false,
          },
          mode3d: {
            'label': '3D mode',
            'action': function(){
              scope.MI_toggleFullScreen(true);
            },
            'class': 'tui-wn5-3d',
            'show': scope.show3DModeButton,
            'disabled' : false,
          },
          capture: {
            'label': 'lang_capture',
            'action': function() {
              CameraService.captureScreen();
            },
            'class': 'tui-wn5-toolbar-capture',
            'show': true,
            'disabled': false,
          },
          record: {
            'label': 'lang_record',
            'action': function() {
              backup();
            },
            'class': 'tui-wn5-toolbar-record',
            'ngClass': "rec",
            'show': true,
            'disabled': false,
          },
          pixelCounting: {
            'label': 'lang_pixel_count',
            'action': function() {
              pixelCountFunc();
            },
            'class': 'tui-wn5-toolbar-pixel',
            'ngClass': "pixelCount",
            'show': true,
            'disabled': false,
          }
        };

        scope.wisenetCameraFuntions2 = {
          setup: {
            'label': 'lang_menu_videosrc',
            'action': function() {
              toggleChannelFunctions('setup');
            },
            'class': 'tui-wn5-toolbar-setup',
            'ngClass': 'setup',
            'show': true
          },
          ptz: {
            'label': 'lang_PTZ',
            'action': function() {
              toggleChannelFunctions('ptz');
            },
            'class': 'tui-wn5-toolbar-ptz',
            'ngClass': 'ptz',
            'show': false
          },
          fisheye: {
            'label': 'lang_fisheyeView',
            'action': function() {
              toggleChannelFunctions('fisheye');
            },
            'class': 'tui-wn5-toolbar-fisheye',
            'ngClass': 'fisheye',
            'show': scope.showFisheye,
          },
          status: {
            'label': 'lang_status',
            'action': function() {
              toggleChannelFunctions('status');
            },
            'class': 'tui-wn5-toolbar-status',
            'ngClass': 'status',
            'show': true
          },
        };

        $("#cm-speaker-slider div").slider({
          orientation: "horizontal",
          range: "min",
          min: 0,
          max: 5,
          step: 1,
          slide: function(event, ui) {
            if (!scope.channelBasicFunctions.speakerStatus) {
              event.stopPropagation();
              return false;
            }
          },
          stop: function(event, ui) {
            if (!scope.channelBasicFunctions.speakerStatus) {
              console.log("AudioInput is disabled.");
              return;
            }

            scope.$apply(function() {
              scope.channelBasicFunctions.speakerVolume = ui.value;
            });
          }
        });
      }

      var watchPluginMode = scope.$watch(function() {
        return UniversialManagerService.getStreamingMode();
      },
      function(newVal, oldVal) {
        if (scope.wisenetCameraFuntions === "undefined") {
          return;
        }
        if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.SAFARI) {
          if (newVal === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE) {
            scope.wisenetCameraFuntions.record.disabled = true;
          } else {
            scope.wisenetCameraFuntions.record.disabled = false;
          }
        }
      });

      scope.$on('$destroy', function() {
        watchPluginMode();
      });

      function view() {
        setInit();
      }

      $timeout(view);
      $timeout(wait);

      scope.showFisheye = function() {
        var isFisheyeProfile = false;
        if (
          typeof scope.profileInfo !== "undefined" && 
          typeof scope.profileInfo.ViewModeIndex !== "undefined" &&
          scope.profileInfo.ViewModeIndex === 0
        ) {
          isFisheyeProfile = true;
        }
        return ( 
          mAttr.FisheyeLens && 
          (UniversialManagerService.getStreamingMode() === 
          CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) && 
          isFisheyeProfile );
      };

      scope.changeFisheyeMode = function(elem){
        var self = $(elem.currentTarget);
        // var type = self.attr("data-mode");
        
        $("#cm-fisheye-mode button").removeClass("active");
        self.addClass("active");
      };
      
      function getFisheyeMode() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=view', getData,
          function (response) {
            scope.fisheyeModeList = mAttr.CameraPosition;
            scope.fisheyeMode = response.data.Viewmodes[0].CameraPosition;
            console.info(scope.fisheyeModeList, scope.fisheyeMode);
          },
          function (errorData) {
            console.log(errorData);
          }, '', true);
      }

      scope.show3DModeButton = function(){
        return ( 
          mAttr.FisheyeLens && 
          (UniversialManagerService.getStreamingMode() === 
          CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE) &&
          (BrowserService.BrowserDetect !== BrowserService.BROWSER_TYPES.IE) 
        );
      };

      function loadedAttr() {
        scope.wisenetCameraFuntions2.ptz.show = 
          (mAttr.ZoomOnlyModel || mAttr.PTZModel || mAttr.ExternalPTZModel || mAttr.isDigitalPTZ);
        getFisheyeMode();

        if (mAttr.MaxChannel > 1) {
          scope.isMultiChannel = true;
        }
        if (AccountService.isPTZAble() === false) {
          scope.wisenetCameraFuntions2.ptz.show = false;
        }
        if (mAttr.MaxAudioInput !== "undefined") {
          scope.MaxAudioInput = mAttr.MaxAudioInput;
        }
        if (mAttr.MaxAudioOutput !== "undefined") {
          scope.MaxAudioOutput = mAttr.MaxAudioOutput;
        }
        if(mAttr.MaxAlarmOutput !== "undefined")
        {
          scope.alarmOutputMax = new Array(mAttr.MaxAlarmOutput);
        }
      }

      function wait() {
        if (!mAttr.Ready || !AccountService.accountReady()) {
          $timeout(function() {
            mAttr = Attributes.get();
            wait();
          }, 500);
        } else {
          loadedAttr();
        }
      }
    }
  };
});