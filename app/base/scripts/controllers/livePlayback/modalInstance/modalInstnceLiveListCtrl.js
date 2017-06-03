"use strict";
kindFramework.controller('ModalInstnceLiveListCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data', 'UniversialManagerService', 'CAMERA_STATUS',
  function($scope, $rootScope, $uibModalInstance, data, UniversialManagerService, CAMERA_STATUS) {

    $scope.ModalList = data.list;
    $scope.buttonCount = typeof(data.buttonCount) === "undefined" ? 0 : data.buttonCount;

    $scope.select = function(data) {
      $uibModalInstance.close(data);
    };

    $scope.checkPlayback = function() {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      }
    };

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

  }
]);