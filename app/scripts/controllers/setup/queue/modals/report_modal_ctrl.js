"use strict";
kindFramework.controller('reportModalCtrl', function ($scope, $uibModalInstance, PcSetupReportModel, pcSetupService) {
  var pcSetupReportModel = new PcSetupReportModel();

  $scope.lang = pcSetupReportModel.getLang();

  $scope.extensionList = $scope.lang.report.extensionList.pc;
  $scope.extension = $scope.extensionList[0];
  $scope.fileName = '';
  $scope.fileNameRegExp = pcSetupService.regExp.getAlphaNum();

  $scope.ok = function () {
    var arr = [
      //'title',       //optional necessary condition
      //'description', //optional necessary condition
      'fileName'
    ];
    var errClass = ' has-error';

    //trim
    for (var i = 0; i < arr.length; i++) {
      var key = arr[i];
      var tmpVal = $scope[key].trim();
      var elem = document.getElementById("pc-confirm-report-" + key);
      var parent = elem.parentNode;
      parent.className = parent.className.replace(errClass, '');

      $scope[key] = tmpVal;
      elem.value = tmpVal;
    }

    var isOk = true;
    for (var i = 0; i < arr.length; i++) {
      var key = arr[i];
      if ($scope[key] === '') {
        var elem = document.getElementById("pc-confirm-report-" + key);
        var parent = elem.parentNode;
        parent.className = parent.className + errClass;
        isOk = false;
      }
    }

    if (isOk === false) {
      return;
    }

    $uibModalInstance.close({
      title: $("#pc-confirm-report-title").val(),
      description: $("#pc-confirm-report-description").val(),
      fileName: $scope.fileName,
      extension: $scope.extension
    });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };
});