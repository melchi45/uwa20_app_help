'use strict';

kindFramework.controller('ModalInstanceStorageInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout', 'infoTableData',
  function($scope, $rootScope, $uibModalInstance, $timeout, infoTableData) {

    $scope.defaultStorageOrder = [
      'Channel',
      'Enable',
      'FileSystem',
      'Status',
      'TotalSpace',
      'UsedSpace'
    ];

    $scope.infoTableData = infoTableData;

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
  }
]);