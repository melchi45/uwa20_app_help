/*global kindFramework */
/*global console */
/*global alert */
/*jslint nomen: true */
kindFramework.controller('ddnsCtrl', function($scope, $timeout, SunapiClient, XMLParser, Attributes, $translate, $uibModal, COMMONUtils, $q) {
  "use strict";
  var mAttr = Attributes.get();
  COMMONUtils.getResponsiveObjects($scope);

  $scope.hostnamePattern = mAttr.HostNameCharSet;
  $scope.servernamePattern = mAttr.ServerNameCharSet;

  $scope.DynamicDNSArr = [];

  $scope.gTimerDDNS = null;

  $scope.ddns_samsung_status = '';
  $scope.ddns_public_status = '';

  var pageData = {};

  function get() {
    getAttributes();
    SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dynamicdns&action=view', '',
      function(response) {
        $scope.ddns_samsung_status = '';
        $scope.ddns_public_status = '';
        $scope.DynamicDNSArr = response.data.DynamicDNS;
        $scope.pageLoaded = true;
        $("#ddnspage").show();
        if ($scope.DynamicDNSArr[0].Type !== 'Off') {
          CheckDDNSStatus($scope.DynamicDNSArr[0].Status, $scope.DynamicDNSArr[0].Type);
        }
        if ($scope.DynamicDNSArr[0].PublicPassword !== '') {
          $("#ddnspublicpwid").val("");
        }
        
        pageData.DynamicDNSArr = angular.copy($scope.DynamicDNSArr);
        $scope.DynamicDNSArr[0].PublicPassword = "";

        try {
          $scope.$apply();
        } catch (e) {
          console.log(e);
        }
      },
      function(errorData) {},
      '',
      true);
  }

  function CheckDDNSStatus(status, type) {
    switch (status) {
      case 'Fail':
        if (type === 'SamsungDDNS') {
          $scope.ddns_samsung_status = $translate.instant('lang_msg_test_fail');
        } else if (type === 'PublicDDNS') {
          $scope.ddns_public_status = $translate.instant('lang_msg_test_fail');
        }
        break;
      case 'Success':
        if (type === 'SamsungDDNS') {
          $scope.ddns_samsung_status = $translate.instant('lang_msg_test_success');
        } else if (type === 'PublicDDNS') {
          $scope.ddns_public_status = $translate.instant('lang_msg_test_success');
        }
        break;
      case 'Trying':
        if (type === 'SamsungDDNS') {
          $scope.ddns_samsung_status = $translate.instant('lang_msg_test_connecting');
        } else if (type === 'PublicDDNS') {
          $scope.ddns_public_status = $translate.instant('lang_msg_test_connecting');
        }
        break;
    }

    if (status === 'Trying') {
      $scope.gTimerDDNS = $timeout(GetDDNSStatus, 1000);
    }
  }

  function GetDDNSStatus() {
    getAttributes();
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dynamicdns&action=view', '',
      function(response) {
        $scope.DynamicDNSStatusArr = response.data.DynamicDNS;
        if ($scope.DynamicDNSStatusArr[0].Type !== 'Off') {
          CheckDDNSStatus($scope.DynamicDNSStatusArr[0].Status, $scope.DynamicDNSStatusArr[0].Type);
        }
      },
      function(errorData) {},
      '', true);
  }

  // function validateHostname(str) {
  //   return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(str);
  // }

  function validatePage() {

    var retVal = true;
    var idx = null;
    var ErrorMessage = null;

    for (idx = 0; idx < $scope.DynamicDNSArr.length; idx = idx + 1) {
      if ($scope.DynamicDNSArr[idx].Type === "SamsungDDNS") {

        if ($scope.ddnsform.servername.$valid === false) {
          ErrorMessage = 'lang_msg_WisenetDDNSserver';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        if ($scope.DynamicDNSArr[idx].SamsungServerName.length === 0 || $scope.DynamicDNSArr[idx].SamsungServerName === '') {
          ErrorMessage = 'lang_msg_WisenetDDNSserver';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        /* if (validateHostname($scope.DynamicDNSArr[idx].SamsungServerName) === false) {
             var ErrorMessage = 'lang_msg_SamsungDDNSserver';
             COMMONUtils.ShowError(ErrorMessage);
             return false;
         }*/


        if ($scope.ddnsform.productid.$valid === false) {
          ErrorMessage = 'lang_msg_WisenetDDNSuser';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        /*if($scope.DynamicDNSArr[idx].SamsungProductID == '')
        {
            var ErrorMessage = 'lang_msg_WisenetDDNSuser';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }*/

        // if (!COMMONUtils.TypeCheck($scope.DynamicDNSArr[idx].SamsungProductID, COMMONUtils.getNUM()+COMMONUtils.getALPHA()+COMMONUtils.getFriendlyName()))
        // {
        //     var ErrorMessage = 'lang_msg_SamsungDDNSuser';
        //     COMMONUtils.ShowError(ErrorMessage);
        //     return false;
        // }

      } else if ($scope.DynamicDNSArr[idx].Type === "PublicDDNS") {

        if ($scope.ddnsform.host.$valid === false) {
          ErrorMessage = 'lang_msg_publicDDNShost';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        if ($scope.ddnsform.user.$valid === false) {
          ErrorMessage = 'lang_msg_publicDDNSuser';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        if ($scope.ddnsform.password.$valid === false) {
          ErrorMessage = 'lang_msg_publicDDNSpass';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        if ($scope.DynamicDNSArr[idx].PublicHostName === '') {
          ErrorMessage = 'lang_msg_publicDDNShost';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        // if (!COMMONUtils.TypeCheck($scope.DynamicDNSArr[idx].PublicHostName, COMMONUtils.getNUM()+COMMONUtils.getALPHA()))
        // {
        //     var ErrorMessage = 'lang_msg_publicDDNShost';
        //     COMMONUtils.ShowError(ErrorMessage);
        //     return false;
        // }

        if ($scope.DynamicDNSArr[idx].PublicUserName === '') {
          ErrorMessage = 'lang_msg_publicDDNSuser';
          COMMONUtils.ShowError(ErrorMessage);
          return false;
        }

        /* if (!COMMONUtils.TypeCheck($scope.DynamicDNSArr[idx].PublicUserName, COMMONUtils.getNUM()+COMMONUtils.getALPHA()+COMMONUtils.getFriendlyName()))
         {
              var ErrorMessage = 'lang_msg_publicDDNSuser';
             COMMONUtils.ShowError(ErrorMessage);
             return false;
         }
         */

        /* if(PWSet === false && $scope.DynamicDNSArr[idx].PublicPassword === '')
         {
             var ErrorMessage = 'lang_msg_publicDDNSpass';
             COMMONUtils.ShowError(ErrorMessage);
             return false;
         }*/

        /*
        if (PWSet === false && !COMMONUtils.TypeCheck($scope.DynamicDNSArr[idx].PublicPassword, COMMONUtils.getNUM()+COMMONUtils.getALPHA()+COMMONUtils.getFriendlyName()))
        {
           var ErrorMessage = 'lang_msg_publicDDNSpass';
            COMMONUtils.ShowError(ErrorMessage);
            return false;
        }*/

      }
    }

    return retVal;
  }


  function set() {
    if (validatePage()) {
      COMMONUtils.ApplyConfirmation(saveSettings);
    }
  }

  function saveSettings() {
    var setData = null;
    var idx = null;

    for (idx = 0; idx < $scope.DynamicDNSArr.length; idx = idx + 1) {
      setData = {};
      setData.Type = $scope.DynamicDNSArr[idx].Type;
      if ($scope.DynamicDNSArr[idx].Type === "SamsungDDNS") {
        setData.SamsungServerName = encodeURIComponent($scope.DynamicDNSArr[idx].SamsungServerName);
        setData.SamsungProductID = encodeURIComponent($scope.DynamicDNSArr[idx].SamsungProductID);
        setData.SamsungQuickConnect = $scope.DynamicDNSArr[idx].SamsungQuickConnect;
      } else if ($scope.DynamicDNSArr[idx].Type === "PublicDDNS") {
        setData.PublicServiceEntry = $scope.DynamicDNSArr[idx].PublicServiceEntry;
        setData.PublicHostName = encodeURIComponent($scope.DynamicDNSArr[idx].PublicHostName);
        setData.PublicUserName = encodeURIComponent($scope.DynamicDNSArr[idx].PublicUserName);

        if ($scope.DynamicDNSArr[idx].PublicPassword !== "" && pageData.DynamicDNSArr[idx].PublicPassword !== $scope.DynamicDNSArr[idx].PublicPassword) {
          setData.PublicPassword = encodeURIComponent($scope.DynamicDNSArr[idx].PublicPassword);
          pageData.DynamicDNSArr[idx].PublicPassword = $scope.DynamicDNSArr[idx].PublicPassword;
        }
      }

      SunapiClient.get('/stw-cgi/network.cgi?msubmenu=dynamicdns&action=set', angular.copy(setData),
        function(response) {
          $timeout(function() {
            get();
          }, 500);
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    }
  }

  function getAttributes() {

    if (typeof mAttr.SamsungProductIDRange !== 'undefined') {
      $scope.SamsungProductIDRange = {};
      $scope.SamsungProductIDRange.Max = mAttr.SamsungProductIDRange.maxLength;
      $scope.SamsungProductIDRange.Pattern = mAttr.FriendlyNameCharSet;
    }

    if (typeof mAttr.SamsungServerNameRange !== 'undefined') {
      $scope.SamsungServerNameRange = {};
      $scope.SamsungServerNameRange.Max = mAttr.SamsungServerNameRange.maxLength;
      $scope.SamsungServerNameRange.Pattern = mAttr.AlphaNumeric;
    }

    if (typeof mAttr.PublicServiceEntryOptions !== 'undefined') {
      $scope.PublicServiceEntryOptions = [];
      $scope.PublicServiceEntryOptions = mAttr.PublicServiceEntryOptions;
    }

    if (typeof mAttr.PublicHostNameRange !== 'undefined') {
      $scope.PublicHostNameRange = [];
      $scope.PublicHostNameRange.Max = mAttr.PublicHostNameRange.maxLength;
      $scope.PublicHostNameRange.Pattern = mAttr.AlphaNumeric;
    }

    if (typeof mAttr.PublicUserNameRange !== 'undefined') {
      $scope.PublicUserNameRange = [];
      $scope.PublicUserNameRange.Max = mAttr.PublicUserNameRange.maxLength;
      $scope.PublicUserNameRange.Pattern = mAttr.FriendlyNameCharSet;
    }

    if (typeof mAttr.PublicPasswordRange !== 'undefined') {
      $scope.PublicPasswordRange = [];
      $scope.PublicPasswordRange.Max = mAttr.PublicPasswordRange.maxLength;
      $scope.PublicPasswordRange.Pattern = mAttr.FriendlyNameCharSet;
    }

  }

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      get();
    }
  })();

  $scope.submit = set;
  $scope.view = get;
});