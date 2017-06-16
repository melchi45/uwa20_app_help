kindFramework.controller('handoverAddCameraCtrl', function($scope, $uibModalInstance, $uibModal, COMMONUtils, Attributes, HandoverList, SelectedArea, $translate) {
  var mAttr = Attributes.get();

  $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
  $scope.MaxIPV6Len = mAttr.MaxIPV6Len;
  $scope.IPv4Pattern = mAttr.IPv4;
  $scope.IPv6Pattern = mAttr.IPv6;
  $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
  $scope.IPv6PatternStr = mAttr.IPv6PatternStr;
  $scope.HttpMaxPort = mAttr.Http.maxValue;
  $scope.OnlyNumStr = mAttr.OnlyNumStr;
  $scope.FriendlyNameCharSetExpandedStr2 = mAttr.FriendlyNameCharSetExpandedStr2;
  $scope.PasswordCharSet = mAttr.PasswordCharSet;

  if (typeof mAttr.IpFilterIPType !== "undefined") {
    $scope.IPTypes = mAttr.IpFilterIPType;
  }

  if (typeof mAttr.HandoverUserMaxLen !== "undefined") {
    $scope.HandoverUserMinLen = 1;
    $scope.HandoverUserMaxLen = mAttr.HandoverUserMaxLen.maxLength;
  }

  if (typeof mAttr.HandoverPwdMaxLen !== "undefined") {
    $scope.HandoverPwdMinLen = 1;
    $scope.HandoverPwdMaxLen = mAttr.HandoverPwdMaxLen.maxLength;
  }

  if (typeof mAttr.HandoverPresetRange !== "undefined") {
    $scope.HandoverPresetMin = mAttr.HandoverPresetRange.minValue;
    $scope.HandoverPresetMax = mAttr.HandoverPresetRange.maxValue;
  }

  $scope.HandoverList = HandoverList;

  $scope.UserList = {};

  $scope.UserList.SelectedHandoverIndex = false;

  if (typeof $scope.HandoverList[SelectedArea] !== "undefined") {
    console.log("true");
    $scope.UserList.HandoverIndex = typeof $scope.HandoverList[SelectedArea].UserList !== 'undefined' ? $scope.HandoverList[SelectedArea].UserList.length + 1 : 1;
  } else {
    console.log("false");
    $scope.UserList.HandoverIndex = 1;
  }

  $scope.UserList.IPType = $scope.IPTypes[0];
  $scope.UserList.IPV4Address = '1.1.1.1';
  $scope.UserList.IPV6Address = 'fe80::209:18ff:fee1:61f';
  $scope.UserList.Port = 80;
  $scope.UserList.Username = 'admin';
  $scope.UserList.Password = '4321';
  $scope.UserList.PresetNumber = 1;

  console.log(" >>>>> $scope.UserList", $scope.UserList);

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function validatePage() {
    if ($scope.UserList.IPType === $scope.IPTypes[0]) {
      if (typeof $scope.UserList.IPV4Address === "undefined") {
        COMMONUtils.ShowError("lang_msg_chkIPAddress");
        return false;
      } else if (COMMONUtils.CheckValidIPv4Address($scope.UserList.IPV4Address) === false) {
        COMMONUtils.ShowError("lang_msg_chkIPAddress");
        return false;
      }
    } else {
      if (typeof $scope.UserList.IPV6Address === "undefined") {
        COMMONUtils.ShowError("lang_msg_chkIPAddress");
        return false;
      } else if (COMMONUtils.CheckValidIPv6Address($scope.UserList.IPV6Address) === false) {
        COMMONUtils.ShowError("lang_msg_chkIPv6Address");
        return false;
      }
    }

    if (
      typeof $scope.UserList.Port === "undefined" ||
      $scope.UserList.Port <= 0 ||
      $scope.UserList.Port > $scope.HttpMaxPort) {
      var ErrorMessage = 'lang_msg_Theportshouldbebetween1and65535';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    if ($scope.handoverForm.Username.$invalid) {
      console.log("Wrong Username");

      $uibModal.open({
        templateUrl: 'views/setup/common/errorMessage.html',
        controller: 'errorMessageCtrl',
        windowClass: 'modal-position-middle',
        size: 'sm',
        resolve: {
          Message: function() {
            return 'lang_msg_invalid_userID';
          },
          Header: function() {
            return 'lang_error';
          }
        }
      });
      return false;
    }

    if ($scope.handoverForm.Password.$invalid) {
      console.log("Wrong Password");

      $uibModal.open({
        templateUrl: 'views/setup/common/errorMessage.html',
        controller: 'errorMessageCtrl',
        windowClass: 'modal-position-middle',
        size: 'sm',
        resolve: {
          Message: function() {
            return 'lang_msg_invalid_pw';
          },
          Header: function() {
            return 'lang_error';
          }
        }
      });
      return false;
    }

    if (
      typeof $scope.UserList.PresetNumber === "undefined" ||
      parseInt($scope.UserList.PresetNumber) < $scope.HandoverPresetMin ||
      parseInt($scope.UserList.PresetNumber) > $scope.HandoverPresetMax) {
      console.log("Wrong PresetNumber");

      $uibModal.open({
        templateUrl: 'views/setup/common/errorMessage.html',
        controller: 'errorMessageCtrl',
        windowClass: 'modal-position-middle',
        size: 'sm',
        resolve: {
          Message: function() {
            return $translate.
              instant('lang_range_alert').
              replace('%1', $scope.HandoverPresetMin).
              replace('%2', $scope.HandoverPresetMax);
          },
          Header: function() {
            return 'lang_error';
          }
        }
      });
      return false;
    }

    return true;
  }

  $scope.apply = function() {
    if (validatePage()) {
      //$scope.HandoverList[SelectedArea].UserList.push($scope.UserList);
      $uibModalInstance.close([true, $scope.UserList]);
    }
    /*else
    {
        $uibModalInstance.close(false);
    }*/
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});