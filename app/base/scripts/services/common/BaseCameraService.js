"use strict";
kindFramework.
  factory('BaseCameraService', ['$rootScope', 'ModalManagerService', 'UniversialManagerService',
    function($rootScope, ModalManagerService, UniversialManagerService) {
      return function() {
        var self = this;

        this.captureScreen = function() {
          UniversialManagerService.setIsCaptured(true);
          self.capture();
        };

        this.channelInfo = function() {
          var profileInfo = UniversialManagerService.getProfileInfo();

          var html = "<p>Profile name : " + profileInfo.Name + "</p>" +
            "<p>Resolution : " + profileInfo.Resolution + "</p>" +
            "<p>Video : " + profileInfo.EncodingType + "</p>" +
            "<p>Framerate :  " + profileInfo.FrameRate + "fps</p>" +
            "<p>Compression : " + profileInfo.CompressionLevel + "</p>" +
            "<p>Target Bitrate : " + profileInfo.Bitrate + "Kbps </p>";

          ModalManagerService.open(
            'message', {
              'message': html,
              'isHtml': true
            }
          );
        };

        this.getProfileList = function() {
          var profileInfo = UniversialManagerService.getProfileInfo();
          var profileList = UniversialManagerService.getProfileList();
          ModalManagerService.open(
            'profile', {
              'profileList': profileList,
              'profileInfo': profileInfo
            },
            function(selectedItem) {
              UniversialManagerService.setProfileInfo(selectedItem);
              $rootScope.$emit('newProfile', selectedItem);
            });
        };

        this.speaker = function(event) {
          ModalManagerService.open(
            'slider', {
              'tag': 'speaker',
              'buttonCount': 0,
              'timeSections': ['0', '1', '2', '3', '4', '5'],

            }
          );
        };

        this.mic = function() {
          ModalManagerService.open(
            'slider', {
              'tag': 'mic',
              'buttonCount': 0,
              'timeSections': ['0', '1', '2', '3', '4', '5'],
            }
          );
        };

        this.capture = function() {};
      }
    }
  ]);