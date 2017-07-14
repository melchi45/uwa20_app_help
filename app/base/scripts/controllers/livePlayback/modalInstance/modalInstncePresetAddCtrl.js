kindFramework.controller('ModalInstncePresetAddCtrl', ['$scope', '$rootScope', '$uibModalInstance', 
  '$sce', 'data', 'Attributes', 'ModalManagerService',
  function($scope, $rootScope, $uibModalInstance, $sce, data, Attributes, ModalManagerService) {
    "use strict";

    var sunapiAttributes = Attributes.get();

    $scope.list = getPresetListwithNumber(sunapiAttributes.PTZPresetOptions.maxValue, data.list);
    $scope.selectPreset = null;
    $scope.presetName = "";
    $scope.AlphaNumericStr = sunapiAttributes.AlphaNumericStr;
    $scope.PresetNameMaxLen = ((sunapiAttributes.PresetNameMaxLen && 
                              sunapiAttributes.PresetNameMaxLen.maxLength) ? 
                              sunapiAttributes.PresetNameMaxLen.maxLength : "12");

    $scope.ok = function() {
      if ($scope.presetName === null | $scope.presetName === "" || 
          typeof $scope.presetName === "undefined") {
        ModalManagerService.open('message', {
          'buttonCount': 1,
          'message': "lang_msg_noname"
        });
        return;
      }

      if ($scope.selectPreset === null | $scope.selectPreset === "" || 
          typeof $scope.selectPreset === "undefined") {
        ModalManagerService.open('message', {
          'buttonCount': 1,
          'message': "lang_msg_selValidPresetNumber"
        });
        return;
      }

      var values = {
        'action': (typeof $scope.list[$scope.selectPreset - 1].name === "undefined" ? 
                  'add' : 'update'),
        'num': $scope.selectPreset,
        'name': $scope.presetName
      };
      $uibModalInstance.close(values);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    function getPresetListwithNumber(presetMaxLength, presetList) {
      var PresetListwithNumber = [];
      var idx = 0;
      for (idx = 0; idx < presetMaxLength; idx++) {
        PresetListwithNumber.push({
          value: idx + 1
        });
      }

      for (idx = 0; idx < presetList.length; idx++) {
        PresetListwithNumber[presetList[idx].value - 1] = presetList[idx];
      }

      return PresetListwithNumber;
    }

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
  }
]);