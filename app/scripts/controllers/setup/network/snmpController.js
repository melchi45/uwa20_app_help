/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('snmpCtrl', function($scope, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q) {
  "use strict";

  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();

  var pageData = {};

  function getAttributes() {
    $scope.DeviceType = mAttr.DeviceType;
    $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
    $scope.IPv4Pattern = mAttr.IPv4;
    $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
    $scope.AlphaNumericExp = mAttr.AlphaNumeric;
    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.FriendlyNameCharSetExpandedStr2 = mAttr.FriendlyNameCharSetExpandedStr2;

    if (mAttr.ReadCommunity !== "undefined") {
      $scope.RCommMinLength = mAttr.ReadCommunity.minLength;
      $scope.RCommMaxLength = mAttr.ReadCommunity.maxLength;
    }

    if (mAttr.WriteCommunity !== "undefined") {
      $scope.WCommMinLength = mAttr.WriteCommunity.minLength;
      $scope.WCommMaxLength = mAttr.WriteCommunity.maxLength;
    }

    if (mAttr.UserPassword !== "undefined") {
      $scope.PwdMinLength = mAttr.UserPassword.minLength;
      $scope.PwdMaxLength = mAttr.UserPassword.maxLength;
    }

    if (mAttr.TrapCommunity !== "undefined") {
      $scope.TCommMinLength = mAttr.TrapCommunity.minLength;
      $scope.TCommMaxLength = mAttr.TrapCommunity.maxLength;
    }

    $scope.TrapAuthFailSupport = mAttr.TrapAuthentificationFailure;
    $scope.TrapLinkUpSupport = mAttr.TrapLinkUp;
    $scope.TrapAlarmInputSupport = mAttr.TrapAlarmInput;
    $scope.TrapAlarmOutputSupport = mAttr.TrapAlarmOutput;
    $scope.TrapTDSupport = mAttr.TrapTamperingDetection;
    $scope.MaxAlarmInput = mAttr.MaxAlarmInput;
    $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;

    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getAlarmInArray = COMMONUtils.getArray(mAttr.MaxAlarmInput);
  }

  function getSLL() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ssl&action=view', getData,
      function(response) {
        $scope.SSL = response.data;
        pageData.SSL = angular.copy($scope.SSL);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getSnmp() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=snmp&action=view', getData,
      function(response) {
        $scope.snmp = response.data;
        pageData.snmp = angular.copy($scope.snmp);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getSnmpTrap() {
    var getData = {};

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=snmptrap&action=view', getData,
      function(response) {
        $scope.snmpTrap = response.data;
        $scope.snmpTrap.TrapConf = angular.copy(response.data.SNMPTrap[0]);

        if ($scope.TrapAlarmInputSupport) {
          $scope.snmpTrap.TrapConf.AlarmInputArray = [];
          for (var ai = 1; ai <= mAttr.MaxAlarmInput; ai++) {
            $scope.snmpTrap.TrapConf.AlarmInputArray.push(response.data.SNMPTrap[0].AlarmInputs[ai]);
          }
        }

        if ($scope.TrapAlarmOutputSupport) {
          $scope.snmpTrap.TrapConf.AlarmOutputArray = [];
          for (var ao = 1; ao <= mAttr.MaxAlarmOutput; ao++) {
            $scope.snmpTrap.TrapConf.AlarmOutputArray.push(response.data.SNMPTrap[0].AlarmOutputs[ao]);
          }
        }

        pageData.snmpTrap = angular.copy($scope.snmpTrap);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function view() {
    $q.seqAll([
      getSLL,
      getSnmp,
      getSnmpTrap
    ]).then(function() {
      $scope.pageLoaded = true;
      $("#snmppage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  }

  function validatePage() {
    var ErrorMessage = null;

    if ($scope.snmpForm.readComm.$valid === false) {
      COMMONUtils.ShowError('lang_msg_invalid_readcommunity');
      return false;
    }

    if ($scope.snmpForm.writeComm.$valid === false) {
      COMMONUtils.ShowError('lang_msg_invalid_writecommunity');
      return false;
    }

    /** IF SNMP V3 is enabled  */
    if ($scope.snmp.Version3) {
      /** If User entered some invalid password or not allowed characters  */
      if ($scope.snmp.UserPassword === "undefined") {
        COMMONUtils.ShowError('lang_msg_invalid_pw');
        return false;
      } else {
        /** Only when User enters some password, it should be validated, else dont validate  */
        if ($scope.snmp.UserPassword.length !== 0) {
          if (($scope.snmp.UserPassword.length < parseInt($scope.PwdMinLength, 10)) || ($scope.snmp.UserPassword.length > parseInt($scope.PwdMaxLength, 10))) {
            COMMONUtils.ShowError('lang_msg_invalid_pw');
            return false;
          }
        }
      }
    }

    if ($scope.snmpForm.trapComm.$valid === false) {
      if ($scope.snmpForm.trapComm.$error.required === true) {
        if ($scope.snmpTrap.Enable) {
          ErrorMessage = 'lang_msg_invalid_community';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }
      } else {
        ErrorMessage = 'lang_msg_invalid_community';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    }

    if ($scope.snmpTrap.Enable === true) {
      if ($scope.snmpForm.trapAddress.$valid === false || COMMONUtils.CheckValidIPv4Address($scope.snmpTrap.TrapConf.Address) === false) {
        ErrorMessage = 'lang_msg_chkIPAddress';
        COMMONUtils.ShowError(ErrorMessage);
        return false;
      }
    }

    /*
        It is requested from BE to disable this check from Fisheye model onwards
     if ($scope.SSL.Policy !== 'HTTP') {
        if (($scope.snmp.Version1 === false) && ($scope.snmp.Version2 === false) && ($scope.snmp.Version3 === false)) {
            var ErrorMessage = 'lang_msg_select_SNMP';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }
    } else {
        if (($scope.snmp.Version1 === false) && ($scope.snmp.Version2 === false)) {
            var ErrorMessage = 'lang_msg_select_SNMP';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }
    } */

    return true;
  }

  function setSnmp() {
    var setData = {};

    setData.Version1 = $scope.snmp.Version1;
    setData.Version2 = $scope.snmp.Version2;
    setData.Version3 = $scope.snmp.Version3;

    if ($scope.snmp.Version2) {
      setData.ReadCommunity = $scope.snmp.ReadCommunity;
      setData.WriteCommunity = $scope.snmp.WriteCommunity;
    }

    if ($scope.snmp.Version3 && $scope.snmp.UserPassword.length > 0) {
      setData.UserPassword = $scope.snmp.UserPassword;
    }

    SunapiClient.get('/stw-cgi/network.cgi?msubmenu=snmp&action=set', setData,
      function(response) {
        pageData.snmp = angular.copy($scope.snmp);
        view();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setSnmpTrap() {
    var setData = {};

    setData.Enable = $scope.snmpTrap.Enable;

    if ($scope.snmpTrap.Enable) {
      setData["Trap.0.Address"] = $scope.snmpTrap.TrapConf.Address;
      setData["Trap.0.Community"] = $scope.snmpTrap.TrapConf.Community;

      if ($scope.TrapAuthFailSupport) {
        setData["Trap.0.AuthenticationFailure"] = $scope.snmpTrap.TrapConf.AuthenticationFailure;
      }

      if ($scope.TrapLinkUpSupport) {
        setData["Trap.0.LinkUp"] = $scope.snmpTrap.TrapConf.LinkUp;
      }

      if ($scope.TrapAlarmInputSupport) {
        for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
          setData["Trap.0.AlarmInput." + (ai + 1)] = $scope.snmpTrap.TrapConf.AlarmInputArray[ai];
        }
      }

      if ($scope.TrapAlarmOutputSupport) {
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          setData["Trap.0.AlarmOutput." + (ao + 1)] = $scope.snmpTrap.TrapConf.AlarmOutputArray[ao];
        }
      }

      if ($scope.TrapTDSupport) {
        setData["Trap.0.TamperingDetection"] = $scope.snmpTrap.TrapConf.TamperingDetection;
      }
    }

    SunapiClient.get('/stw-cgi/network.cgi?msubmenu=snmptrap&action=set', setData,
      function(response) {
        pageData.snmpTrap = angular.copy($scope.snmpTrap);
        view();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function saveSettings() {
    if (!angular.equals(pageData.snmp, $scope.snmp)) {
      setSnmp();
    }

    if (!angular.equals(pageData.snmpTrap, $scope.snmpTrap)) {
      setSnmpTrap();
    }
  }

  function set() {
    if (validatePage()) {
      if (!angular.equals(pageData.snmp, $scope.snmp) || !angular.equals(pageData.snmpTrap, $scope.snmpTrap)) {
        COMMONUtils.ApplyConfirmation(saveSettings);
      }
    }
  }

  $scope.submit = set;
  $scope.view = view;

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      getAttributes();
      view();
    }
  })();
});