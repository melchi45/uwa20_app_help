kindFramework.controller('ModalInstnceSliderCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data', 'kindStreamInterface', 'UniversialManagerService', 'CAMERA_STATUS',
  function ($scope, $rootScope, $uibModalInstance, data, kindStreamInterface, UniversialManagerService, CAMERA_STATUS) {
    'use strict';
    var sectionLength = data.timeSections.length;
    $scope.message = data.message;
    $scope.slider = {
      'options': {
        min: parseFloat(data.timeSections[0]),
        max: parseFloat(data.timeSections[sectionLength - 1]),
        stop: function(event, ui){
          if(event.type === "slidestop") {
            if(data.tag === "speaker") {
              if(checkAudioInputState() === false){
                console.log("AudioInput is disabled.");
                return;
              }
              kindStreamInterface.controlAudioIn(ui.value);
              UniversialManagerService.setSpeakerVol(ui.value);
            } else if(data.tag === "mic") {
              if(checkAudioOutputState() === false){
                console.log("AudioOutput is disabled.");
                return;
              }
              kindStreamInterface.controlAudioOut(ui.value);
              UniversialManagerService.setMicVol(ui.value);
            }
          }
        },
      },
      data : 0,
      timeSections: data.timeSections,
      cellStyle: {
        width: 1/sectionLength * 100 + '%'
      },
      getCellStyle: function(index) {
        return {
          left: index * (1/$scope.slider.options.max) * 100 + '%',
        };
      }
    };

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    function checkAudioInputState(){
      var profileInfo = UniversialManagerService.getProfileInfo();
      return profileInfo.AudioInputEnable === true ? true : false; 
    }

    function checkAudioOutputState(){
      var data = UniversialManagerService.getIsAudioOutEnabled();
      return data === true ? true : false; 
    }

    $scope.onOff = function(){
      if(data.tag === "speaker") {
        if(checkAudioInputState() === false){
          console.log("AudioInput is disabled.");
          return;
        }

        $scope.isSpeakerOn = UniversialManagerService.isSpeakerOn();
        $scope.isSpeakerOn = !$scope.isSpeakerOn;
        UniversialManagerService.setSpeakerOn($scope.isSpeakerOn);
        if($scope.isSpeakerOn) {
          kindStreamInterface.controlAudioIn('on');
          var vol = UniversialManagerService.getSpeakerVol();
          kindStreamInterface.controlAudioIn(vol);
          UniversialManagerService.setSpeakerVol(vol);
        } else {
          kindStreamInterface.controlAudioIn('off');
        }
      } else if(data.tag === "mic") {
        if(checkAudioOutputState() === false){
          console.log("AudioOutput is disabled.");
          return;
        }

        $scope.isMicOn = UniversialManagerService.isMicOn();
        $scope.isMicOn = !$scope.isMicOn;
        UniversialManagerService.setMicOn($scope.isMicOn);
        if($scope.isMicOn) {
          kindStreamInterface.controlAudioOut('on');
          var vol = UniversialManagerService.getMicVol();
          kindStreamInterface.controlAudioOut(vol);
          UniversialManagerService.setMicVol(vol);
        } else {
          kindStreamInterface.controlAudioOut('off');
        }
      }
    };

    if(data.tag === "speaker") {
      $scope.isSpeaker = true;
      $scope.isSpeakerOn = true;
      if(checkAudioInputState() === false){
        console.log("AudioInput is disabled.");
        $scope.isSpeakerOn = false;
      }else{
        $scope.isSpeakerOn = UniversialManagerService.isSpeakerOn();
      }
      var iniVol = UniversialManagerService.getSpeakerVol();
      if(iniVol !== null){
        $scope.slider.data = iniVol;
      }
    } else if(data.tag === "mic") {
      $scope.isSpeaker = false;
      $scope.isMicOn = true;
      if(checkAudioOutputState() === false){
        console.log("AudioOutput is disabled.");
        $scope.isMicOn = false;
      }else{
        $scope.isMicOn = UniversialManagerService.isMicOn();
      }
      var iniVol = UniversialManagerService.getMicVol();
      if(iniVol !== null){
        $scope.slider.data = iniVol;
      }
    }
    
    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

    $scope.getModalBottomBar = function(){
      if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.LIVE){
        return "modal-bottom-bar";
      } else if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      } else {
        console.log("Unexpected play mode");
        return;
      }
    };

    $scope.getModalSlideBar = function(){
      if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.LIVE){
        return "";
      } else if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return ""+" playback";
      } else {
        console.log("Unexpected play mode");
        return;
      }
    };

}]);