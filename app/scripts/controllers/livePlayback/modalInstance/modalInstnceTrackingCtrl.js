kindFramework.controller('ModalInstnceTrackingCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data', 'PTZContorlService',
  function($scope, $rootScope, $uibModalInstance, data, PTZContorlService) {
    "use strict";

    $scope.selectMenu = {
      isAutoOn: PTZContorlService.getAutoTrackingMode() === "True",
      isManualOn: PTZContorlService.getManualTrackingMode() === "True",
      onAuto: function() {
        $scope.selectMenu.isAutoOn = true;
        $scope.selectMenu.isManualOn = false;
      },
      onManual: function() {
        $scope.selectMenu.isAutoOn = false;
        $scope.selectMenu.isManualOn = true;
      }
    };
    $scope.setAutoTracking = function() {
      /* jshint ignore:start */
      if ($scope.selectMenu.isAutoOn) {
        PTZContorlService.setAutoTrackingMode("False");
      } else {
        if ($scope.selectMenu.isManualOn) {
          PTZContorlService.setManualTrackingMode("False");
        }
        PTZContorlService.setAutoTrackingMode("True");
        $scope.selectMenu.onAuto();
      }
      $uibModalInstance.close();
      /* jshint ignore:end */
    };

    $scope.setManualTracking = function() {
      if ($scope.selectMenu.isManualOn) {
        PTZContorlService.setManualTrackingMode("False");
      } else {
        if ($scope.selectMenu.isAutoOn) {
          PTZContorlService.setAutoTrackingMode("False");
        }
        PTZContorlService.setManualTrackingMode("True");
        $scope.selectMenu.onManual();
      }
      $uibModalInstance.close();
    };

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
  }
]);