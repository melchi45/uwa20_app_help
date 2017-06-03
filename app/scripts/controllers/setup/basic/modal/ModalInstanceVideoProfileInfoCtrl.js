'use strict';

kindFramework.controller('ModalInstanceVideoProfileInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout', 'infoTableData',
  function($scope, $rootScope, $uibModalInstance, $timeout, infoTableData) {

    $scope.defaultProfileOrder = [
      'name',
      'codec',
      'resolution',
      'frameRate',
      'bitrate',
      'GOVLength'
    ];

    $scope.infoTableData = infoTableData;

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
  }
]);