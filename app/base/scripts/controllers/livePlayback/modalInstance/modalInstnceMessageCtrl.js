'use strict';

kindFramework.controller('ModalInstnceMessageCtrl', ['$scope', '$rootScope', '$uibModalInstance', 
  '$sce', 'data', '$timeout', 'UniversialManagerService', 'CAMERA_STATUS',
  function($scope, $rootScope, $uibModalInstance, $sce, data, $timeout, UniversialManagerService, 
    CAMERA_STATUS) {

    var TIMEOUT = 3000;
    $scope.data = data;

    if (typeof(data.isHtml) === 'undefined') {
      $scope.isHtml = false;
    } else {
      $scope.isHtml = true;
    }

    if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
      $scope.modalMessagePlaybackflag = true;
    } else {
      $scope.modalMessagePlaybackflag = false;
    }

    $scope.deliberatelyTrustDangerousSnippet = function() {
      return $sce.trustAsHtml($scope.data.message);
    };

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.checkPlayback = function() {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      }
    };

    if (data.buttonCount <= 0) {
      $timeout(function() {
        $uibModalInstance.close();
      }, TIMEOUT);
    }

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

  }
]);