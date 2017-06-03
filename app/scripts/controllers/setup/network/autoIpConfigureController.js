kindFramework.controller('autoIpConfigureCtrl', function($scope, $timeout, $uibModal, $translate, SunapiClient, $location, Attributes, COMMONUtils, $q) {
  "use strict";

  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();

  var pageData = {};

  var testZeroConf = false;

  $scope.zeroConfStatus = "";

  var MaxRetryCount = 30;
  var RetryCount = 0;
  var StatusTimeout = false;

  function getAttributes() {
    $scope.UpnpDiscoveryPattern = mAttr.FriendlyNameCharSetStr;
    $scope.BonjourPattern = mAttr.FriendlyNameCharSetStr;

    if (mAttr.Upnp !== undefined) {
      $scope.UpnpFriendlyNameMinLength = 1;
      $scope.UpnpFriendlyNameMaxLength = mAttr.Upnp.maxLength;
    }

    if (mAttr.Bonjour !== undefined) {
      $scope.BonjourFriendlyNameMinLength = 1;
      $scope.BonjourFriendlyNameMaxLength = mAttr.Bonjour.maxLength;
    }
  }

  function checkZeroConfStatus(status) {
    switch (status) {
      case 'Fail':
        $scope.zeroConfStatus = $translate.instant('lang_msg_test_fail');
        break;

      case 'Success':
        $scope.zeroConfStatus = $translate.instant('lang_msg_test_success');
        break;

      case 'Trying':
        $scope.zeroConfStatus = $translate.instant('lang_msg_test_connecting');
        break;
    }

    if (status === 'Trying') {
      var changedUrl = $location.absUrl();
      if (changedUrl.indexOf('network_autoIpConfigure') !== -1) {
        testZeroConf = true;
        if (RetryCount < MaxRetryCount) {
          setTimeout(updateZeroStatus, 1000);
        } else {
          StatusTimeout = true;
        }
      }
    }
  }

  function getZeroConf() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=zeroconf&action=view', '',
      function(response) {
        if (!$scope.$$phase) {
          $scope.$apply(function() {
            $scope.ZeroConf = response.data.ZeroConf;

            if ($scope.ZeroConf[0].Enable == false) {
              $scope.ZeroConf[0].IPAddress = "";
              $scope.ZeroConf[0].SubnetMask = "";
            }

            if ($scope.ZeroConf[0].IPAddress === "" && $scope.ZeroConf[0].Enable === true) {
              if (StatusTimeout === true) {
                checkZeroConfStatus('Fail');
              } else {
                checkZeroConfStatus('Trying');
              }
            } else {
              StatusTimeout = false;
              testZeroConf = false;
              RetryCount = 0;
              $scope.zeroConfStatus = "";
            }

            pageData.ZeroConf = angular.copy($scope.ZeroConf);
          });
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getUpnpDiscovery() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=upnpdiscovery&action=view', '',
      function(response) {
        $scope.UpnpDiscovery = response.data.UpnpDiscovery;
        pageData.UpnpDiscovery = angular.copy($scope.UpnpDiscovery);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getBonjour() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=bonjour&action=view', '',
      function(response) {
        $scope.Bonjour = response.data;
        pageData.Bonjour = angular.copy($scope.Bonjour);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }


  function setZeroConf() {
    var setData = {};

    setData.Enable = $scope.ZeroConf[0].Enable;

    if (setData.Enable === true) {
      testZeroConf = true;
      console.log("TEST ZERO CONF  iiiiiinwe", testZeroConf);
    }

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=zeroconf&action=set', setData,
      function(response) {
        getZeroConf();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setUpnpDiscovery() {
    var setData = {};

    if (pageData.UpnpDiscovery[0].Enable !== $scope.UpnpDiscovery[0].Enable) {
      setData.Enable = pageData.UpnpDiscovery[0].Enable = $scope.UpnpDiscovery[0].Enable;
    }

    if (pageData.UpnpDiscovery[0].FriendlyName !== $scope.UpnpDiscovery[0].FriendlyName) {
      setData.Enable = pageData.UpnpDiscovery[0].Enable = $scope.UpnpDiscovery[0].Enable;
      setData.FriendlyName = pageData.UpnpDiscovery[0].FriendlyName = $scope.UpnpDiscovery[0].FriendlyName;
    }

    if (setData.Enable === false) {
      delete setData.FriendlyName;
    }

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=upnpdiscovery&action=set', setData,
      function(response) {

      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setBonjour() {
    var setData = {};

    if (pageData.Bonjour.Enable !== $scope.Bonjour.Enable) {
      setData.Enable = pageData.Bonjour.Enable = $scope.Bonjour.Enable;
    }

    if (pageData.Bonjour.FriendlyName !== $scope.Bonjour.FriendlyName) {
      setData.Enable = pageData.Bonjour.Enable = $scope.Bonjour.Enable;
      setData.FriendlyName = pageData.Bonjour.FriendlyName = $scope.Bonjour.FriendlyName;
    }

    if (setData.Enable === false) {
      delete setData.FriendlyName;
    }

    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=bonjour&action=set', setData,
      function(response) {

      },
      function(errorData) {
        console.log(errorData);
      }, '', true);

  }

  function validatePage() {
    if (($scope.$$childHead.autoIpConfigForm.UpnpFriendlyName.$invalid) || ($scope.$$childHead.autoIpConfigForm.BonjourFriendlyName.$invalid)) {
      console.log("Wrong Friendly name");
      var ErrorMessage = 'lang_msg_invalid_friendlyname';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    if ($scope.Bonjour.FriendlyName.charAt(0) === " " || $scope.UpnpDiscovery[0].FriendlyName.charAt(0) === " ") {
      console.log("Wrong Friendly name");
      var ErrorMessage = 'lang_msg_invalid_friendlyname';
      COMMONUtils.ShowError(ErrorMessage);
      return false;
    }

    return true;
  }

  function view() {
    getAttributes();

    $q.seqAll([
      getZeroConf,
      getUpnpDiscovery,
      getBonjour
    ]).then(function() {
      $scope.pageLoaded = true;
    }, function(errorData) {
      console.log(errorData);
    })
  }

  function set() {
    if (validatePage()) {
      if (!angular.equals(pageData.ZeroConf, $scope.ZeroConf) || !angular.equals(pageData.UpnpDiscovery, $scope.UpnpDiscovery) || !angular.equals(pageData.Bonjour, $scope.Bonjour)) {
        var modalInstance = $uibModal.open({
          templateUrl: 'views/setup/common/confirmMessage.html',
          controller: 'confirmMessageCtrl',
          size: 'sm',
          resolve: {
            Message: function() {
              return 'lang_apply_question';
            }
          }
        });

        testZeroConf = false;

        modalInstance.result.then(function() {
          if (!angular.equals(pageData.ZeroConf, $scope.ZeroConf)) {
            console.log("TEST ZERO CONF  werwe", testZeroConf);

            setZeroConf();

            if (testZeroConf === true) {
              setTimeout(updateZeroStatus, 1000);
            }
          }

          if (!angular.equals(pageData.UpnpDiscovery, $scope.UpnpDiscovery)) {
            setUpnpDiscovery();
          }

          if (!angular.equals(pageData.Bonjour, $scope.Bonjour)) {
            setBonjour();
          }
        }, function() {

        });

      }
    }
  }


  function updateZeroStatus() {
    RetryCount = RetryCount + 1;
    getZeroConf();
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
      view();
    }
  })();
});