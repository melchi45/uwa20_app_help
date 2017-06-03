"use strict";
/* global detector */
kindFramework.controller('reportModalCtrl', function($scope, $uibModalInstance, PcSetupReportModel, pcSetupService) {
  var pcSetupReportModel = new PcSetupReportModel();

  $scope.lang = pcSetupReportModel.getLang();

  //Excel cann't export in Safari browser.
  if (detector.safari === true) {
    $scope.lang.report.extensionList.pc = ['txt'];
  }

  $scope.extensionList = $scope.lang.report.extensionList.pc;
  $scope.extension = $scope.extensionList[0];
  $scope.fileName = '';
  $scope.fileNameRegExp = pcSetupService.regExp.getAlphaNum();

  $scope.ok = function() {
    var arr = [
      //'title',       //optional necessary condition
      //'description', //optional necessary condition
      'fileName'
    ];
    var errClass = ' has-error';
    var i = 0;
    var key = null;
    var elem = null;
    var parent = null;
    //trim
    for (i = 0; i < arr.length; i++) {
      key = arr[i];
      var tmpVal = $scope[key].trim();
      elem = document.getElementById("pc-confirm-report-" + key);
      parent = elem.parentNode;
      parent.className = parent.className.replace(errClass, '');

      $scope[key] = tmpVal;
      elem.value = tmpVal;
    }

    var isOk = true;
    for (i = 0; i < arr.length; i++) {
      key = arr[i];
      if ($scope[key] === '') {
        elem = document.getElementById("pc-confirm-report-" + key);
        parent = elem.parentNode;
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

  $scope.cancel = function() {
    $uibModalInstance.dismiss();
  };
});