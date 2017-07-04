/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('productinfo', function($scope, $timeout, $uibModal, $translate, SunapiClient, XMLParser, Attributes, COMMONUtils, MultiLanguage) {
  "use strict";
  var mAttr = Attributes.get();

  COMMONUtils.getResponsiveObjects($scope);

  $scope.systemLanguage = {
    currentLanguage: null,
    supportedLanguages: [],
  };
  $scope.Info = {
    DeviceName: null,
    Location: null,
    Description: null,
    Memo: null,
  };

  var DEVICE_NAME_LENGTH = 8;
  // var DEVICE_OPTION_LENGTH = 24;

  var ATTRIBUTE_REQUEST_TIMEOUT = 500;

  function featureDetection() {
    $scope.DeviceNameRange = {};
    $scope.DeviceNameRange.PatternStr = "^[^#'\"&+:<>=\\%*\\\\]*$";

    if (typeof mAttr.DeviceName !== 'undefined') {
      $scope.DeviceNameRange.Min = 1;
      $scope.DeviceNameRange.Max = mAttr.DeviceName.maxLength;
    }

    $scope.DeviceLocationRange = {};
    $scope.DeviceLocationRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
    if (typeof mAttr.DeviceLoc !== 'undefined') {
      $scope.DeviceLocationRange.Min = 1;
      console.log(mAttr.DeviceLoc.maxLength);
      $scope.DeviceLocationRange.Max = mAttr.DeviceLoc.maxLength;
    }

    $scope.DeviceDescriptionRange = {};
    $scope.DeviceDescriptionRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
    if (typeof mAttr.DeviceDesc !== 'undefined') {
      $scope.DeviceDescriptionRange.Min = 1;
      $scope.DeviceDescriptionRange.Max = mAttr.DeviceDesc.maxLength;
    }

    $scope.MemoRange = {};
    $scope.MemoRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
    if (typeof mAttr.Memo !== 'undefined') {
      $scope.MemoRange.Min = 1;
      $scope.MemoRange.Max = mAttr.Memo.maxLength;
    }

    $scope.systemLanguage.supportedLanguages = mAttr.Languages;
    $scope.showLanguage = true;
    if ($scope.systemLanguage.supportedLanguages.length === 1) {
      $scope.showLanguage = false;
    }
  }


  function view() {
    featureDetection();

    SunapiClient.get(
        '/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view',
        '',
        function(response) {
          /** Populate values from SUNAPI and store in the SCOPE */
          $scope.DeviceType = response.data.DeviceType;
          $scope.Model = response.data.Model;
          if ($scope.DeviceType === 'NWC') {
            $scope.Serial = response.data.SerialNumber;
            $scope.Info.Location = response.data.DeviceLocation;
            $scope.Info.Description = response.data.DeviceDescription;
            $scope.Info.Memo = response.data.Memo;
            $scope.ISPVersion = response.data.ISPVersion;
          } else {
            $scope.MicomVersion = response.data.MicomVersion;
          }
          $scope.Info.DeviceName = decodeURIComponent(response.data.DeviceName);
          $scope.BuildDate = response.data.BuildDate;
          $scope.FirmwareVersion = response.data.FirmwareVersion;
          $scope.systemLanguage.currentLanguage = response.data.Language;
        },
        function(errorData) {},
        '',
        true
      ).
      then(
        function() {
          $scope.pageLoaded = true;
          $("#prodinfopage").show();
        },
        function(errorData) {
          console.log(errorData);
        }
      );
  }

  function validDeviceName() {
    var val = $scope.Info.DeviceName;
    if ($.trim(val).length === 0) { 
      return false; 
    } // only white space
    var len = val.length;
    for (var ii = 0; ii < val.length; ii++) {
      // var str = val[ii];
      try {
        // var stringByteLen = ~-encodeURI(str).split(/%..|./).length;
      } catch (error) {
        ii++;
        len--;
      }
    }

    if (len > DEVICE_NAME_LENGTH) {
      return false;
    } else {
      return true;
    }
  }

  function validLocation() {
    var val = $scope.Info.Location;
    if ($.trim(val).length === 0) { 
      return false; 
    } // only white space
    var len = val.length;
    for (var ii = 0; ii < val.length; ii++) {
      // var str = val[ii];
      try {
        // var stringByteLen = ~-encodeURI(str).split(/%..|./).length;
      } catch (error) {
        ii++;
        len--;
      }
    }

    if (len > $scope.DeviceLocationRange.Max) {
      return false;
    } else {
      return true;
    }
  }

  function validDescription() {
    var val = $scope.Info.Description;
    if ($.trim(val).length === 0) { 
      return false; 
    } // only white space
    var len = val.length;
    for (var ii = 0; ii < val.length; ii++) {
      // var str = val[ii];
      try {
        // var stringByteLen = ~-encodeURI(str).split(/%..|./).length;
      } catch (error) {
        ii++;
        len--;
      }
    }

    if (len > $scope.DeviceDescriptionRange.Max) {
      return false;
    } else {
      return true;
    }
  }

  function validMemo() {
    var val = $scope.Info.Memo;
    if ($.trim(val).length === 0) { 
      return false; 
    } // only white space
    var len = val.length;
    for (var ii = 0; ii < val.length; ii++) {
      // var str = val[ii];
      try {
        // var stringByteLen = ~-encodeURI(str).split(/%..|./).length;
      } catch (error) {
        ii++;
        len--;
      }
    }

    if (len > $scope.MemoRange.Max) {
      return false;
    } else {
      return true;
    }
  }

  function validate() {
    var retVal = true;
    var ErrorMessage = '';

    if ($scope.prodinfoForm.DeviceName.$valid === false) {
      ErrorMessage = 'lang_msg_check_deviceName';
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if (validDeviceName() === false) {
      ErrorMessage = $translate.instant('lang_msg_check_deviceName') + ' ' + $translate.instant('lang_msg_allowed_upto_8_chars');
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if (validLocation() === false) {
      ErrorMessage = $translate.instant('lang_msg_check_location');
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if (validDescription() === false) {
      ErrorMessage = $translate.instant('lang_msg_check_description');
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if (validMemo() === false) {
      ErrorMessage = $translate.instant('lang_msg_check_memo');
      retVal = false;
      COMMONUtils.ShowError(ErrorMessage);
      return retVal;
    }

    if ($scope.DeviceType === 'NWC') {
      if ($scope.prodinfoForm.Description.$valid === false || $.trim($scope.Info.Description).length === 0) {
        ErrorMessage = 'lang_msg_check_description';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }

      if ($scope.prodinfoForm.Location.$valid === false || $.trim($scope.Info.Location).length === 0) {
        ErrorMessage = 'lang_msg_check_location';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }

      if ($scope.prodinfoForm.Memo.$valid === false || $.trim($scope.Info.Memo).length === 0) {
        ErrorMessage = 'lang_msg_check_memo';
        retVal = false;
        COMMONUtils.ShowError(ErrorMessage);
        return retVal;
      }
    }

    return retVal;
  }

  function set() {
    if (validate()) {
      COMMONUtils.ApplyConfirmation(function() {
        var setData = {};
        setData.DeviceName = encodeURIComponent($scope.Info.DeviceName);
        if ($scope.DeviceType === 'NWC') {
          setData.DeviceLocation = $scope.Info.Location;
          setData.DeviceDescription = $scope.Info.Description;
          setData.Memo = $scope.Info.Memo;
          setData.Language = $scope.systemLanguage.currentLanguage;

          /** Change the UI Language */
          MultiLanguage.setLanguage($scope.systemLanguage.currentLanguage);
          mAttr.CurrentLanguage = $scope.systemLanguage.currentLanguage;
        }
        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=set', setData,
          function(response) {

          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      }, 
      'sm',
      function() {

      });
    }
  }

  $scope.submit = set;
  $scope.view = view;

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, ATTRIBUTE_REQUEST_TIMEOUT);
    } else {
      view();
    }
  })();
});