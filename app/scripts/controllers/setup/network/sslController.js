"use strict";
/*globals Uint8Array*/
kindFramework.controller('sslCtrl', function($rootScope, $scope, $location, SunapiClient, COMMONUtils, Attributes, $timeout, $translate, CAMERA_STATUS, UniversialManagerService, $q, $window) {

  var mAttr = Attributes.get();
  COMMONUtils.getResponsiveObjects($scope);

  var sslURLPath = $(location).attr('pathname') + '#/setup/network_ssl';
  $scope.needReload = false;
  $scope.pageData = {};

  function getAttributes() {
    if (typeof mAttr.SSLPolicyOptions !== "undefined") {
      $scope.SSLPolicyOptions = mAttr.SSLPolicyOptions;
    }

    if (typeof mAttr.PublicCertificateNameRange !== "undefined") {
      $scope.PublicCertificateNameRange = parseInt(mAttr.PublicCertificateNameRange.maxLength, 10);
    }
    $scope.PublicCertificateNamePattern = "^[a-zA-Z0-9]*$";
  }

  function sslView() {
    $scope.CertificateFile = '';
    $scope.KeyFile = '';

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ssl&action=view', '',
      function(response) {
        $scope.$evalAsync(function() {
          $scope.SSL = response.data;
          $scope.pageData.SSL = angular.copy($scope.SSL);
        });
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function httpPortView() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=http&action=view', '',
      function(response) {
        if (typeof response.data !== "undefined") {
          $scope.httpPort = response.data.Port;
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }


  function httpsPortView() {
    return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=https&action=view', '',
      function(response) {
        if (typeof response.data !== "undefined") {
          $scope.httpsPort = response.data.Port;
        }
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function view() {

    var certfileelm = document.getElementById("certificatefileid");
    var keyfileelm = document.getElementById("keyfileid");
    certfileelm.value = "";
    keyfileelm.value = "";

    getAttributes();

    $q.seqAll([
      sslView,
      httpPortView,
      httpsPortView
    ]).then(function() {
      $rootScope.$emit('changeLoadingBar', false);
      $scope.pageLoaded = true;
      $("#sslpage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  }

  function validate() {
    var retVal = true;

    if ($scope.sslForm.cerName.$valid === false) {
      retVal = false;
    }

    if ($scope.SSL.PublicCertificateName === "") {
      if ($scope.SSL.Policy === "HTTPSPublic") {
        retVal = false;
      }
    }

    return retVal;
  }

  function sslSet() {
    if (angular.equals($scope.pageData.SSL, $scope.SSL)) {
      return;
    }

    if ($scope.SSL.Policy === $scope.pageData.SSL.Policy) {
      return;
    }

    var setData = {};
    setData.Policy = $scope.SSL.Policy;

    SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ssl&action=set', setData,
      function(response) {
        setRelocateURL();
      },
      function(errorData) {
        //alert(errorData);
        setRelocateURL();
      }, '', true);
  }

  function set() {
    if (validate() === false) {
      var ErrorMessage = 'lang_msg_please_input_certname';
      COMMONUtils.ShowError(ErrorMessage);
      return;
    }

    COMMONUtils.ApplyConfirmation(sslSet);
  }

  $scope.setCertificateFile = function(element) {
    $scope.$apply(function($scope) {
      $scope.CertificateFile = element.files[0].name;
      $scope.cerfilesize = element.files[0].size;
      $scope.cerfile = element.files[0];
      //console.log("Certificate File:",$scope.CertificateFile,$scope.cerfilesize);
    });
  };

  $scope.setKeyFile = function(element) {
    $scope.$apply(function($scope) {
      $scope.KeyFile = element.files[0].name;
      $scope.keyfilesize = element.files[0].size;
      $scope.keyfile = element.files[0];
      //console.log("Certificate File:",$scope.KeyFile,$scope.keyfilesize);
    });
  };

  $scope.OnInstall = function() {
    var certfileelm = document.getElementById("certificatefileid");
    var keyfileelm = document.getElementById("keyfileid");
    var element = '';
    var fileName = '';
    var ext = '';

    if ($scope.SSL.PublicCertificateName === "") {
      COMMONUtils.ShowError("lang_msg_please_input_certname");
      return;
    }

    element = document.getElementById("certificateFile");
    fileName = element.value.split('/').pop().split('\\').pop();
    ext = fileName.split('.').pop();

    //Check for file extension validity.
    if (ext !== "crt") {
      COMMONUtils.ShowError("lang_msg_cert_file_error");
      return;
    }

    element = document.getElementById("keyFile");
    fileName = element.value.split('/').pop().split('\\').pop();
    ext = fileName.split('.').pop();

    if (ext !== "key") {
      COMMONUtils.ShowError("lang_msg_key_file_error");
      return;
    }

    var setData = {},
      postData = "";

    if ($scope.cerfile) {
      $rootScope.$emit('changeLoadingBar', true);
      var r = new FileReader();
      r.readAsArrayBuffer($scope.cerfile);
      r.onload = function(e) {
        $scope.certcontents = e.target.result;

        var certbytes = new Uint8Array($scope.certcontents);

        var cerfileToPost = '';
        for (var index = 0; index < certbytes.byteLength; index++) {
          cerfileToPost += String.fromCharCode(certbytes[index]);
        }

        if ($scope.keyfile) {
          var p = new FileReader();
          p.readAsArrayBuffer($scope.keyfile);
          p.onload = function(e) {
            $scope.keycontents = e.target.result;
            var keybytes = new Uint8Array($scope.keycontents);

            var keyfileToPost = '';
            for (var index = 0; index < keybytes.byteLength; index++) {
              keyfileToPost += String.fromCharCode(keybytes[index]);
            }

            var specialHeaders = [];
            specialHeaders[0] = {};
            specialHeaders[0].Type = 'Content-Type';
            specialHeaders[0].Header = 'application/x-www-form-urlencoded';

            postData = '<SetHTTPSData><PublicCertName>' + $scope.SSL.PublicCertificateName + '</PublicCertName><CertLength>' + $scope.cerfilesize + '</CertLength>' +
              '<CertData>' + cerfileToPost + '</CertData><KeyLength>' + $scope.keyfilesize + '</KeyLength><KeyData>' + keyfileToPost + '</KeyData></SetHTTPSData>';

            var encodedata = encodeURI(postData);
            //console.log("Read file:",encodedata);
            SunapiClient.post('/stw-cgi/security.cgi?msubmenu=ssl&action=install', setData,
              function(response) {
                certfileelm.value = "";
                keyfileelm.value = "";
                $timeout(view, 5000);
                //setRelocateURL();
                SunapiClient.clearDigestCache();
                //$scope.needReload = true;
              },
              function(errorData) {
                console.log(errorData);
                certfileelm.value = "";
                keyfileelm.value = "";
              }, $scope, encodedata, specialHeaders);
          };

        } else {
          var ErrorMessage = 'lang_msg_key_file_error';
          COMMONUtils.ShowError(ErrorMessage);
        }
      };
    } else {
      var ErrorMessage = 'lang_msg_cert_file_error';
      COMMONUtils.ShowError(ErrorMessage);
    }

  };

  function setRelocateURL() {
    var the_hostname = document.location.hostname;
    var ipaddr = the_hostname.split(':');
    var ipv6addr = false;
    var httpsmode = $scope.SSL.Policy;
    var httpPort = $scope.httpPort;
    var httpsPort = $scope.httpsPort;
    var relocate_page = '';

    //disable ui when redirecting
    var div = document.createElement("div");
    div.setAttribute("id", "notallow")
    div.className += "disabledom";
    document.body.appendChild(div);



    if (ipaddr.length > 1) {
      ipv6addr = true;
      the_hostname = the_hostname.replace('[', '');
      the_hostname = the_hostname.replace(']', '');
    }

    if (httpsmode === 'HTTP') {
      relocate_page = 'http://';
    } else {
      relocate_page = 'https://';
    }

    if (ipv6addr) {
      relocate_page += '[' + the_hostname + ']';
    } else {
      relocate_page += the_hostname;
    }

    if (httpsmode === 'HTTP') {
      if (httpPort !== 80) {
        relocate_page += ':' + httpPort;
      }
    } else {
      if (httpPort !== 443) {
        relocate_page += ':' + httpsPort;
      }
    }

    relocate_page += sslURLPath;
    $scope.relocateUrl = relocate_page;
    $scope.needReload = false;

    var loc_protocol = window.location.protocol;
    if (loc_protocol.toLowerCase() === 'https:' && httpsmode !== 'HTTP') {
      $scope.needReload = true;
    }

    //To check plugin at HTTPS
    if (typeof $window.sessionStorage !== "undefined") {
      if ($window.sessionStorage.isPlugin === "true") {
        $scope.relocateUrl += "?isPlugin";
      } else {
        $scope.relocateUrl += "?isNonPlugin";
      }
    }

    console.log("kind reload ", $scope.relocateUrl);

    window.setTimeout(RefreshPage, 3000);
  }


  function RefreshPage() {

    if ($scope.needReload === true) {
      window.location.reload(true);
    } else {
      window.location.href = $scope.relocateUrl;
    }
  }

  $scope.OnDelete = function() {
    if ($scope.SSL.PublicCertificateName === "") {
      var ErrorMessage = 'lang_msg_please_input_certname';
      COMMONUtils.ShowError(ErrorMessage);
      return;
    }

    $rootScope.$emit('changeLoadingBar', true);

    var setData = {};
    setData.PublicCertificateName = $scope.SSL.PublicCertificateName;

    SunapiClient.get('/stw-cgi/security.cgi?msubmenu=ssl&action=remove', setData,
      function(response) {
        $scope.CertificateFile = '';
        $scope.KeyFile = '';
        $timeout(view, 5000);
        //setRelocateURL();
        SunapiClient.clearDigestCache();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  };

  $scope.IsCerticateInstalled = function() {
    if (typeof $scope.SSL !== "undefined" && $scope.SSL.PublicCertificateInstalled === false) {
      return false;
    }
    return true;
  };

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

  $scope.submit = set;
  $scope.view = view;

  UniversialManagerService.setServiceType(CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB);

  //Plugin check at HTTPS

  (function checkPlugin() {
    var url = $location.url();
    try {
      if (typeof $window.sessionStorage !== "undefined") {
        if (url.indexOf('isPlugin') > 0) {
          $window.sessionStorage.isPlugin = "true";
        } else if (url.indexOf('isNonPlugin') > 0) {
          if ("isPlugin" in $window.sessionStorage) {
            delete $window.sessionStorage.isPlugin;
          }
        }
        $rootScope.updateMonitoringPath();
      }
    } catch (e) {
      console.error("checkPlugin in sslController.js have problem", e);
    }
  })();
});