kindFramework.controller('ModalInstncePresetAddCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', '$sce', 'data', 'Attributes', 'ModalManagerService',
  function ($scope, $rootScope, $uibModalInstance, $sce, data, Attributes, ModalManagerService) {
    "use strict";
    
    var sunapiAttributes = Attributes.get();

    $scope.list = getPresetListwithNumber(sunapiAttributes.PTZPresetOptions.maxValue, data.list);
    $scope.selectPreset = null;
    $scope.presetName = "";
    $scope.AlphaNumericStr = sunapiAttributes.AlphaNumericStr;
    $scope.PresetNameMaxLen = ((sunapiAttributes.PresetNameMaxLen && sunapiAttributes.PresetNameMaxLen.maxLength)?sunapiAttributes.PresetNameMaxLen.maxLength:"12");

    $scope.ok = function() {
      if($scope.presetName === null | $scope.presetName === "" || $scope.presetName === undefined)
      {
        ModalManagerService.open('message', { 'buttonCount': 1, 'message': "lang_msg_noname" } );
        return;
      }

      if($scope.selectPreset === null | $scope.selectPreset === "" || $scope.selectPreset === undefined)
      {
        ModalManagerService.open('message', { 'buttonCount': 1, 'message': "lang_msg_selValidPresetNumber" } );
        return;
      }

      var values = {
        'action' : ($scope.list[$scope.selectPreset-1].name === undefined ? 'add' : 'update'),
        'num' : $scope.selectPreset,
        'name' : $scope.presetName
      };
      $uibModalInstance.close(values);
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    function getPresetListwithNumber(presetMaxLength, presetList){
      var PresetListwithNumber = [];
      for(var i=0; i<presetMaxLength; i++)
      {
        PresetListwithNumber.push({value:i+1});
      }

      for(var i=0; i<presetList.length; i++)
      {
        PresetListwithNumber[presetList[i].value-1] = presetList[i];
      }
      
      return PresetListwithNumber;
    }

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
}]);