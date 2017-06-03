kindFramework.controller('ptzPresetCtrl', function($scope, $uibModalInstance, Attributes, PresetData, COMMONUtils) {
  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();
  $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
  $scope.PresetNameMaxLen = ((mAttr.PresetNameMaxLen && mAttr.PresetNameMaxLen.maxLength) ? mAttr.PresetNameMaxLen.maxLength : "12");
  $scope.PTZPresets = PresetData.PTZPresets;
  $scope.SelectedPTZPreset = null;

  $scope.PTZPresetList = new Array(PresetData.PTZPresetOptionsMaxValue);
  for (var i = 0; i < $scope.PTZPresetList.length; i++) {
    var data = null;
    for (var j = 0; j < $scope.PTZPresets.length; j++) {
      if (Number($scope.PTZPresets[j].Preset) == (i + 1)) {
        data = {
          'Preset': $scope.PTZPresets[j].Preset,
          'Name': $scope.PTZPresets[j].Preset + ':' + $scope.PTZPresets[j].Name
        };
        break;
      }
    }
    if (!data) {
      var idx = (i + 1);
      data = {
        'Preset': i + 1,
        'Name': '' + idx + ':'
      };
      if (!$scope.SelectedPTZPreset) $scope.SelectedPTZPreset = data;
    }
    $scope.PTZPresetList[i] = data;
  }
  if (!$scope.SelectedPTZPreset) $scope.SelectedPTZPreset = {
    'Preset': 1,
    'Name': '1:'
  };

  $scope.ok = function() {
    if (typeof $scope.InputPTZPresetName === 'undefined') {
      var ErrorMessage = 'lang_msg_validPresetName';
      COMMONUtils.ShowError(ErrorMessage, 'md');
    } else {
      $uibModalInstance.close({
        'PresetIdx': $scope.SelectedPTZPreset.Preset,
        'PresetName': $scope.InputPTZPresetName
      });
    }
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

});