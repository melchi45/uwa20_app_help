/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*global kindFramework */
/*global console */
/*global setTimeout */
/*global alert */
kindFramework.controller('ftpemailCtrl', function($scope, $timeout, SunapiClient, XMLParser, Attributes, COMMONUtils, $uibModal, $q, $translate) {
  "use strict";
  var mAttr = Attributes.get();
  COMMONUtils.getResponsiveObjects($scope);
  $scope.ftpStatus = "";
  $scope.smtpStatus = "";
  $scope.FTPSupported = true;
  $scope.SMTPSupported = true;
  var pageDataFTP = {};
  var pageDataSMTP = {};

  var ftpModeOptions = ["Passive", "Active"];
  var smtpAuthOptions = ["SMTP", "None"];
  var smtpEncryOptions = ["SSL", "None"];

  function featureDetection() {
    var defer = $q.defer();
    $scope.FriendlyNameCharSetSupportedStr = mAttr.FriendlyNameCharSetSupportedStr;
    $scope.FriendlyNameCharSetNoSpaceStr = mAttr.FriendlyNameCharSetNoSpaceStr;
    $scope.FriendlyNameCharSetNoNewLineStr = mAttr.FriendlyNameCharSetNoNewLineStr;
    $scope.FriendlyNameCharSetExpandedStr2 = mAttr.FriendlyNameCharSetExpandedStr2;
    $scope.regForIdPwd = "^[a-zA-Z0-9`~*!@$()^_\\-|\\[\\]{};,./?]*$";
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.SMTPSupported = mAttr.SMTPSupport;
    $scope.FTPSupported = mAttr.FTPSupport;
    $scope.DeviceType = mAttr.DeviceType;
    if ($scope.DeviceType === 'NWC') {
      $scope.FTPPortRange = mAttr.FTPPortRange;
      $scope.FTPPortRangeMaxStrLen = $scope.FTPPortRange.maxValue.toString().length;
      $scope.FTPHostStringLen = mAttr.FTPHostStringLen;
      $scope.FTPUsernameStringLen = mAttr.FTPUsernameStringLen;
      $scope.FTPPasswordStringLen = mAttr.FTPPasswordStringLen;
      $scope.FTPPathStringLen = mAttr.FTPPathStringLen;
    }
    $scope.SMTPPortRange = mAttr.SMTPPortRange;
    $scope.SMTPPortRangeMaxStrLen = $scope.SMTPPortRange.maxValue.toString().length;
    $scope.SMTPHostStringLen = mAttr.SMTPHostStringLen;
    $scope.SMTPUsernameStringLen = mAttr.SMTPUsernameStringLen;
    $scope.SMTPPasswordStringLen = mAttr.SMTPPasswordStringLen;
    $scope.SMTPSenderStringLen = mAttr.SMTPSenderStringLen;
    if ($scope.DeviceType === 'NWC') {
      $scope.SMTPRecipientStringLen = mAttr.SMTPRecipientStringLen;
      $scope.SMTPSubjectStringLen = mAttr.SMTPSubjectStringLen;
      $scope.SMTPMessageStringLen = mAttr.SMTPMessageStringLen;
    }
    defer.resolve("success");
    return defer.promise;
  }

  function ftpView() {
    var jData;
    return SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=ftp&action=view', jData, function(response) {
      pageDataFTP = response.data;
      $scope.FTPHost = response.data.Host;
      $scope.Mode = response.data.Mode;
      $scope.ModeEnable = $scope.Mode === ftpModeOptions[0] ? true : false;
      $scope.FTPPort = response.data.Port;
      $scope.FTPPath = response.data.Path;
      $scope.FTPUsername = response.data.Username;
      $scope.FTPPassword = response.data.Password;
      $scope.FTPPasswordDummy = "";
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function smtpView() {
    var jData;
    return SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=smtp&action=view', jData, function(response) {
      pageDataSMTP = response.data;
      $scope.SMTPHost = response.data.Host;
      $scope.SMTPPort = response.data.Port;
      $scope.SMTPUsername = response.data.Username;
      $scope.SMTPPassword = response.data.Password;
      $scope.SMTPPasswordDummy = "";
      $scope.Authentication = response.data.Authentication;
      $scope.SMTPSender = response.data.Sender;
      $scope.Encryption = response.data.Encryption;

      $scope.AuthenticationEnable = $scope.Authentication === smtpAuthOptions[0] ? true : false;
      $scope.EncryptionEnable = $scope.Encryption === smtpEncryOptions[0] ? true : false;
      if ($scope.DeviceType === 'NWC') {
        $scope.SMTPRecipient = response.data.Recipient;
        $scope.SMTPSubject = response.data.Subject;
        $scope.SMTPBody = response.data.Message;
      }
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function view() {
    var promises = [];
    if ($scope.DeviceType === 'NWC') {
      promises.push(ftpView);
    }
    promises.push(smtpView);
    $q.seqAll(promises).then(function() {
      $scope.pageLoaded = true;
      $("#ftpemailpage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  }

  function validateSMTP() {
    var retVal = true;
    var ErrorMessage;
    if ($scope.DeviceType === 'NWC') {
      if ($scope.SMTPBody.length > 256) {
        ErrorMessage = 'lang_msg_body_maxlength';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
      if ($scope.SMTPSubject === '') {
        ErrorMessage = 'lang_msg_InputSMTPSubject';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      } else if (!COMMONUtils.TypeCheck($scope.SMTPSubject, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM() + COMMONUtils.getSPACE() + '\r' + '\n' + COMMONUtils.getSIM2() + COMMONUtils.getQUOTATION() + '<>=+:')) {
        ErrorMessage = 'lang_msg_invalid_subject';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      } else if ($scope.SMTPBody === '') {
        ErrorMessage = 'lang_msg_InputSMTPBody';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      } else if (!COMMONUtils.TypeCheck($scope.SMTPBody, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM() + COMMONUtils.getSPACE() + '\r' + '\n' + COMMONUtils.getSIM2() + COMMONUtils.getQUOTATION() + '<>=+:')) {
        ErrorMessage = 'lang_msg_invalid_body';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      } else if ($scope.SMTPRecipient === '') {
        ErrorMessage = 'lang_msg_InputSMTPRecipient';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
    }
    if ($scope.SMTPPasswordDummy.length !== 0) {
      $scope.SMTPPassword = $scope.SMTPPasswordDummy;
    }
    if (
      typeof $scope.SMTPHost === 'undefined' ||
      $scope.SMTPHost === ""
    ) {
      ErrorMessage = 'lang_msg_InputSMTPServerAddress';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (validateServerAddress($scope.SMTPHost)) {
      ErrorMessage = 'lang_msg_invalid_server_addr';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (typeof $scope.SMTPUsername === 'undefined' || $scope.SMTPUsername === '') {
      ErrorMessage = 'lang_msg_InputSMTPUserID';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (!COMMONUtils.TypeCheck($scope.SMTPUsername, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())) {
      ErrorMessage = 'lang_msg_invalid_userID';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    /* else if (typeof $scope.SMTPPassword === 'undefined' || $scope.SMTPPassword === '') {
                ErrorMessage = 'lang_msg_invalid_userPW';
                retVal = false;
                COMMONUtils.ShowError(ErrorMessage);
                return retVal;
            }*/
    else if (
      pageDataSMTP.Password !== $scope.SMTPPassword &&
      !COMMONUtils.TypeCheck($scope.SMTPPassword, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())
    ) {
      ErrorMessage = 'lang_msg_invalid_userPW';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (typeof $scope.SMTPSender === 'undefined' || $scope.SMTPSender === '') {
      ErrorMessage = "lang_msg_InputSMTPSender";
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (COMMONUtils.CheckAddrKorean($scope.SMTPSender)) {
      ErrorMessage = 'lang_msg_InputSMTPSender';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    } else if (COMMONUtils.CheckAddrKorean($scope.SMTPSender)) {
      ErrorMessage = 'lang_msg_invalid_recipient';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    var smtpPort = parseInt($scope.SMTPPort);
    if (isNaN(smtpPort) || smtpPort > $scope.SMTPPortRange.maxValue || smtpPort < $scope.SMTPPortRange.minValue) {
      ErrorMessage = 'lang_msg_Theportshouldbebetween1and65535';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    return retVal;
  }

  function validateFTP() {
    var retVal = true;
    var ErrorMessage;
    var ftpPathTok = $scope.FTPPath.split("/");
    for (var i = 1; i < ftpPathTok.length - 1; i++) {
      if (ftpPathTok[i].length === 0) {
        ErrorMessage = 'lang_msg_invalid_path';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
      if (ftpPathTok[i].length === 1 && ftpPathTok[i].charAt(ftpPathTok[i].length - 1) === ' ') {
        ErrorMessage = 'lang_msg_invalid_path';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
    }
    for (var j = 0; j < ftpPathTok.length; j++) {
      if (ftpPathTok[j].charAt(0) === '.' || ftpPathTok[j].charAt(ftpPathTok[j].length - 1) === '.') {
        ErrorMessage = 'lang_msg_invalid_path';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
    }
    if (!COMMONUtils.TypeCheck($scope.FTPPath, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getDIRECTORY() + COMMONUtils.getSPACE())) {
      ErrorMessage = 'lang_msg_invalid_path';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    if (validateServerAddress($scope.FTPHost)) {
      ErrorMessage = 'lang_msg_invalid_server_addr';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    if ($scope.FTPUsername === '' || !COMMONUtils.TypeCheck($scope.FTPUsername, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())) {
      ErrorMessage = 'lang_msg_invalid_userID';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    if ($scope.FTPPasswordDummy.length !== 0) {
      $scope.FTPPassword = $scope.FTPPasswordDummy;
    }
    if (
      pageDataFTP.Password !== $scope.FTPPassword &&
      !COMMONUtils.TypeCheck($scope.FTPPassword, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())
    ) {
      ErrorMessage = 'lang_msg_invalid_userPW';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    if ($scope.FTPPath === "") {
      ErrorMessage = 'lang_msg_invalid_path';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    var ftpPort = parseInt($scope.FTPPort);
    if (isNaN(ftpPort) || ftpPort > $scope.FTPPortRange.maxValue || ftpPort < $scope.FTPPortRange.minValue) {
      ErrorMessage = 'lang_msg_Theportshouldbebetween1and65535';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }
    return retVal;
  }

  function CheckValidIPv4Address(address) {
    var textCheck = isNaN(address.split(/\./)[0]);
    if (textCheck === true) return true;

    return COMMONUtils.CheckValidIPv4Address(address);
  }

  function validateServerAddress(address) {
    var reg = COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM();
    return (
      address === '0.0.0.0' ||
      address === '255.255.255.255' ||
      address === '' ||
      !COMMONUtils.TypeCheck(address, reg) ||
      !CheckValidIPv4Address(address) ||
      COMMONUtils.CheckAddrKorean(address)
    );
  }

  function saveFTP() {
    var modified = false;
    var setData = {};
    if (pageDataFTP.Host !== $scope.FTPHost) {
      setData.Host = $scope.FTPHost;
      modified = true;
    }
    if (pageDataFTP.Mode !== $scope.Mode) {
      setData.Mode = $scope.Mode;
      modified = true;
    }
    if (pageDataFTP.Port !== $scope.FTPPort) {
      setData.Port = $scope.FTPPort;
      modified = true;
    }
    if (pageDataFTP.Path !== $scope.FTPPath) {
      setData.Path = encodeURIComponent($scope.FTPPath);
      modified = true;
    }
    if (pageDataFTP.Username !== $scope.FTPUsername) {
      setData.Username = $scope.FTPUsername;
      modified = true;
    }
    if (pageDataFTP.Password !== $scope.FTPPassword) {
      setData.Password = $scope.FTPPassword;
      modified = true;
    }
    if ($scope.FTPPasswordDummy.length !== 0) {
      $scope.FTPPasswordDummy = "";
    }
    if (modified === true) {
      SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=ftp&action=set', setData, function(response) {
        view();
      }, function(errorData) {
        view();
        console.log(errorData);
      }, '', true);
    }
    setTimeout(updateFTPStatus, 500);
  }

  function setFTP() {
    if (validateFTP()) {
      COMMONUtils.ApplyConfirmation(saveFTP);
    }
  }

  function saveSMTP() {
    var setData = {};
    var modified = false;
    if (pageDataSMTP.Host !== $scope.SMTPHost) {
      setData.Host = $scope.SMTPHost;
      modified = true;
    }
    if (pageDataSMTP.Port !== $scope.SMTPPort) {
      setData.Port = $scope.SMTPPort;
      modified = true;
    }
    if (pageDataSMTP.Username !== $scope.SMTPUsername) {
      setData.Username = $scope.SMTPUsername;
      modified = true;
    }
    if (pageDataSMTP.Password !== $scope.SMTPPassword) {
      setData.Password = $scope.SMTPPassword;
      modified = true;
    }
    if (pageDataSMTP.Authentication !== $scope.Authentication) {
      setData.Authentication = $scope.Authentication;
      modified = true;
    }
    if (pageDataSMTP.Sender !== $scope.SMTPSender) {
      setData.Sender = $scope.SMTPSender;
      modified = true;
    }
    if (pageDataSMTP.Encryption !== $scope.Encryption) {
      setData.Encryption = $scope.Encryption;
      modified = true;
    }
    if ($scope.DeviceType === 'NWC') {
      if (pageDataSMTP.Recipient !== $scope.SMTPRecipient) {
        setData.Recipient = $scope.SMTPRecipient;
        modified = true;
      }
      if (pageDataSMTP.Subject !== $scope.SMTPSubject) {
        setData.Subject = encodeURIComponent($scope.SMTPSubject);
        modified = true;
      }
      if (pageDataSMTP.Message !== $scope.SMTPBody) {
        setData.Message = encodeURIComponent($scope.SMTPBody);
        modified = true;
      }
    }
    if ($scope.SMTPPasswordDummy.length !== 0) {
      $scope.SMTPPasswordDummy = "";
    }
    if (modified === true) {
      SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=smtp&action=set', setData, function(response) {
        view();
      }, function(errorData) {
        view();
        console.log(errorData);
      }, '', true);
    }
    setTimeout(updateSMTPStatus, 500);
  }

  function setSMTP() {
    if (validateSMTP()) {
      COMMONUtils.ApplyConfirmation(saveSMTP);
    }
  }

  function checkStatus(status) {
    var statusMsg;
    switch (status) {
      case 'Fail':
        statusMsg = $translate.instant('lang_msg_test_fail');
        break;
      case 'Success':
        statusMsg = $translate.instant('lang_msg_test_success');
        break;
      case 'Trying':
        statusMsg = $translate.instant('lang_msg_test_connecting');
        break;
      default:
        statusMsg = status;
        break;
    }
    return statusMsg;
  }

  function updateSMTPStatus() {
    var jData;
    return SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=smtp&action=test', jData, function(response) {
      $scope.smtpStatus = checkStatus(response.data.Status);
      $scope.$apply();
      if ($scope.DeviceType === 'NWC') {
        if (response.data.Status === 'Trying') {
          setTimeout(updateSMTPStatus, 1000);
        }
      }
    }, function(errorData) {}, '', true);
  }

  function updateFTPStatus() {
    var jData;
    return SunapiClient.get('/stw-cgi/transfer.cgi?msubmenu=ftp&action=test', jData, function(response) {
      $scope.ftpStatus = checkStatus(response.data.Status);
      $scope.$apply();
      if (response.data.Status === 'Trying') {
        setTimeout(updateFTPStatus, 1000);
      }
    }, function(errorData) {}, '', true);
  }

  $scope.updateDefaultMode = function() {
    $scope.Mode = $scope.ModeEnable === true ? ftpModeOptions[0] : ftpModeOptions[1];
  };

  $scope.updateDefaultAuth = function() {
    $scope.Authentication = $scope.AuthenticationEnable === true ? smtpAuthOptions[0] : smtpAuthOptions[1];
  };

  function updateDefaultSMTPPort() {
    $scope.Encryption = $scope.EncryptionEnable === true ? smtpEncryOptions[0] : smtpEncryOptions[1];

    if ($scope.Encryption === "SSL") {
      $scope.SMTPPort = 465;
    } else if ($scope.Encryption === "None") {
      $scope.SMTPPort = 25;
    }
  }
  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      featureDetection().finally(function() {
        view();
      });
    }
  })();
  $scope.submitFTP = setFTP;
  $scope.submitSMTP = setSMTP;
  $scope.updateDefaultSMTPPort = updateDefaultSMTPPort;
  $scope.view = view;
  $scope.cancelFTP = function() {
    var promises = [];
    if ($scope.DeviceType === 'NWC') {
      promises.push(ftpView);
    }
    $q.seqAll(promises).then(function() {
      $scope.pageLoaded = true;
      $("#ftpemailpage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  };
  $scope.cancelSMTP = function() {
    var promises = [];
    promises.push(smtpView);
    $q.seqAll(promises).then(function() {
      $scope.pageLoaded = true;
      $("#ftpemailpage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  };
});