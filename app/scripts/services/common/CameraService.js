kindFramework
  .service('CameraService', ['$rootScope', 'BaseCameraService', 'ModalManagerService',
    'SunapiClient', 'UniversialManagerService', 'CAMERA_STATUS', 'kindStreamInterface',
    function($rootScope, BaseCameraService, ModalManagerService, SunapiClient,
      UniversialManagerService, CAMERA_STATUS, kindStreamInterface) {
      "use strict";
      var cameraService = new BaseCameraService();

      cameraService.capture = function() {
        $rootScope.$emit('channelPlayer:command', 'capture');
      };

      cameraService.alarmOut = function() {
        var successCallback = function(response) {
          var DataList = [];

          if (response.data.AlarmOutput === undefined) {
            ModalManagerService.open('message', {
              'buttonCount': 0,
              'message': "lang_alarmoulang_nolang_supported"
            });
            return;
          }

          for (var i = 0; i < Object.keys(response.data.AlarmOutput).length; i++) {
            var Data = {
              'name': 'Alarm Output ' + (i + 1),
              'enable': response.data.AlarmOutput[i + 1]
            };
            DataList.push(Data);
          }

          ModalManagerService.open('checkboxlist', {
            'list': DataList
          });
        };

        var errorCallBack = function() {
          ModalManagerService.open('message', {
            'buttonCount': 0,
            'message': "카메라와 연결이 실패했습니다."
          });
        };

        SunapiClient.get('/stw-cgi/eventstatus.cgi?msubmenu=eventstatus&action=check', {}, successCallback, errorCallBack, '', true);
      };

      cameraService.toggleZoomMode = function() {
        if (UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
          UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
        } else {
          UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
        }
      };

      cameraService.digitalAutoTracking = function() {
        var successCallback = function(response) {
          var DEFAULT_CHANNEL = 0;
          var currentProfileInfo = UniversialManagerService.getProfileInfo();
          var Profilelist = response.data.VideoProfiles[DEFAULT_CHANNEL].Profiles;
          for (var i = 0; i < Profilelist.length; i++) {
            if (Profilelist[i].Name === currentProfileInfo.Name) {
              if (Profilelist[i].IsDigitalPTZProfile === false) {
                ModalManagerService.open('message', {
                  'buttonCount': 0,
                  'message': "lang_dptzprofile_select"
                });
                return;
              }
              break;
            }
          }

          if (UniversialManagerService.getDigitalPTZ() === CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ) {
            SunapiClient.get(
              '/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control&Mode=Start', {},
              function() {
                ModalManagerService.open('message', {
                  'buttonCount': 0,
                  'message': "lang_dalang_on"
                });
              },
              errorCallback,
              '',
              true
            );
          } else {
            SunapiClient.get(
              '/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control&Mode=Stop', {},
              function() {
                ModalManagerService.open('message', {
                  'buttonCount': 0,
                  'message': "lang_dalang_off"
                });
              },
              errorCallback,
              '',
              true
            );
          }
        };
        var errorCallback = function() {
          ModalManagerService.open('message', {
            'buttonCount': 0,
            'message': "lang_camera_conneclang_failed"
          });
        };
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', {}, successCallback, errorCallback, '', true);
      };

      cameraService.changeViewMode = function(mode) {
        kindStreamInterface.setCanvasStyle(mode);
      };

      return cameraService;

    }
  ]);