"use strict";

kindFramework.controller('ModalGeneralCheckBoxListCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data', '$timeout',
  function($scope, $rootScope, $uibModalInstance, data, $timeout) {

    $scope.checklist = data.list;
    $scope.checkboxAll = data.checkboxAll

    $scope.all = {
      selected: false
    };

    $scope.selectAll = function(_selected) {
      if (_selected) {
        for (var i = 0; i < $scope.checklist.length; i++) {
          $scope.checklist[i].selected = true;
        }
      } else {
        for (var i = 0; i < $scope.checklist.length; i++) {
          $scope.checklist[i].selected = false;
        }
      }
    };

    $scope.selectCam = function(_selected) {
      if (_selected === false) {
        $scope.all.selected = false;
      }
    };

    $scope.ok = function() {
      var selectedList = [];
      for (var i = 0; i < $scope.checklist.length; i++) {
        if ($scope.checklist[i].selected) {
          selectedList.push($scope.checklist[i]);
        }
      }
      $uibModalInstance.close(selectedList);
    };

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
  }
]);