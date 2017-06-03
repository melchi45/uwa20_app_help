kindFramework.controller('ModalCheckBoxListCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data', 'SunapiClient',
  function($scope, $rootScope, $uibModalInstance, data, SunapiClient) {
    "use strict";

    $scope.data = {
      ModalList: data.list
    };

    $scope.buttonCount = typeof(data.buttonCount) === "undefined" ? 0 : data.buttonCount;

    $scope.select = function(item) {
      var successCallback = function() {};
      var errorCallBack = function() {
        if (item.enable === true) {
          item.enable = false;
        } else {
          item.enable = true;
        }
      };

      for (var i = 0; i < data.list.length; i++) {
        if (data.list[i].name === item.name) {
          if (item.enable === true) {
            SunapiClient.get('/stw-cgi/io.cgi?msubmenu=alarmoutput&action=control&AlarmOutput.' + (i + 1) + '.State=On', {}, successCallback, errorCallBack, '', true);
          } else {
            SunapiClient.get('/stw-cgi/io.cgi?msubmenu=alarmoutput&action=control&AlarmOutput.' + (i + 1) + '.State=Off', {}, successCallback, errorCallBack, '', true);
          }
        }
      }
    };

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
  }
]);