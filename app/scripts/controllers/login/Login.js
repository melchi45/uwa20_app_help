/*global BaseLogin*/
kindFramework.controller('LoginCtrl', ['$controller', '$scope', 'SessionOfUserManager', 'SunapiClient',
  'CAMERA_TYPE', 'ModalManagerService', '$timeout', 'UniversialManagerService',
  'CAMERA_STATUS', 'AccountService', 'LoginModel', 'RESTCLIENT_CONFIG', 'Attributes',
  'MultiLanguage', 'ConnectionSettingService', '$state',
  function($controller, $scope, SessionOfUserManager, SunapiClient,
    CAMERA_TYPE, ModalManagerService, $timeout, UniversialManagerService,
    CAMERA_STATUS, AccountService, LoginModel, RESTCLIENT_CONFIG, Attributes,
    MultiLanguage, ConnectionSettingService, $state) {
    "use strict";
    var self = this;
    var loginModel = new LoginModel();
    var optionServiceType = loginModel.getServiceType();
    var timeOutPromise = null;
    BaseLogin.prototype.initServiceType = function() {
      UniversialManagerService.setServiceType(CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB);
      $scope.loginInfo.serviceType = optionServiceType[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB];
    };

    BaseLogin.prototype.getAttributes = function() {
      var mAttr = Attributes.get();

      if (!mAttr.Ready || mAttr.GetFail) {
        Attributes.initialize(1000);
      }
    };

    BaseLogin.prototype.loginIPOLISWeb_No_Digest = function() {
      var _self = this;
      var userId = '';
      var userPassword = '';
      SunapiClient.get(
        '/stw-cgi/security.cgi?msubmenu=users&action=view', {},
        function(response) {
          self.setAccountData(response);

          SessionOfUserManager.addSession($scope.loginInfo.id, '', $scope.loginInfo.serviceType);
          SessionOfUserManager.setLogin();

          if (userPassword === 4321 && userId === 'admin') // jshint ignore:line
          {
            $state.go('change_password');
          } else {
            SunapiClient.get(
              '/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', {},
              function(response) {
                if (SessionOfUserManager.isLoggedin()) {
                  $scope.currentLanguage = response.data.Language;
                  MultiLanguage.setLanguage($scope.currentLanguage);
                  console.log(" -- Current Login language = [ " + $scope.currentLanguage + " ]");
                  _self.successLogin();
                  ConnectionSettingService.setConnectionInfo($scope.loginInfo);
                  UniversialManagerService.setUserId($scope.loginInfo.id);
                  $state.go('uni.channel');
                }
              },
              function(errorData) {
                console.error(errorData);
              },
              '',
              true);
          }
        },
        function(errorData) {
          console.error(errorData);
        }, '', true);
    };

    BaseLogin.prototype.loginIPOLISWeb = function() {
      var _self = this;
      var successCallBack = function(response) {
        SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=view', {}, self.setAccountData,
          self.userAccessInfoFailureCallback, {}, false);
        $timeout.cancel(timeOutPromise);
        if (timeOutflag) {
          if ($scope.loginInfo.password === '4321' && $scope.loginInfo.id === 'admin') {
            $timeout(function() {
              $scope.$apply(function() {
                $state.go('change_password');
              });
            });
          } else {
            if (SessionOfUserManager.isLoggedin()) {
              $scope.currentLanguage = response.data.Language;
              MultiLanguage.setLanguage($scope.currentLanguage);
              console.log(" -- Current Login language = [ " + $scope.currentLanguage + " ]");
              _self.successLogin();
              if ($scope.desktopAppInfo.isDesktopApp === true) {
                ConnectionSettingService.changeServerAddress($scope.desktopAppInfo.ipAddress);
              }
              ConnectionSettingService.setConnectionInfo($scope.loginInfo);
              UniversialManagerService.setUserId($scope.loginInfo.id);
              $state.go('uni.channel');
            }
          }
        }
      };
      var errorCallBack = function(errorData, errorCode) {
        $timeout.cancel(timeOutPromise);
        if (timeOutflag) {
          self.failedLogin();
          SessionOfUserManager.unSetLogin();

          var msg = loginModel.getIPOLISWebErrorMessage(errorCode);

          if (typeof errorCode !== 'undefined') {
            if (errorCode === 490) {
              self.failedLogin();
              ModalManagerService.open('message', {
                'buttonCount': 0,
                'message': msg
              });
            } else if (errorCode === 401) {
              ModalManagerService.open('message', {
                'buttonCount': 0,
                'message': msg
              });
            }
          } else {
            ModalManagerService.open('message', {
              'buttonCount': 0,
              'message': msg
            });
          }
        }
      };
      var timeOutCallBack = function() {
        timeOutflag = false;
        self.failedLogin();
        var msg = loginModel.getTimeoutMessage();
        SessionOfUserManager.unSetLogin();
        ModalManagerService.open('message', {
          'buttonCount': 0,
          'message': msg
        });
      };

      var timeOutflag = true;

      if ($scope.desktopAppInfo.isDesktopApp === true) {
        RESTCLIENT_CONFIG.digest.hostName = $scope.desktopAppInfo.ipAddress;
      }

      UniversialManagerService.setServiceType(CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB);
      SessionOfUserManager.addSession($scope.loginInfo.id, $scope.loginInfo.password, $scope.loginInfo.serviceType);
      SessionOfUserManager.setLogin();
      timeOutPromise = $timeout(timeOutCallBack, 5000);
      SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', {}, successCallBack, errorCallBack, '', true);
    };


    angular.extend(this, $controller('BaseLoginCtrl', {
      $scope: $scope,
      SessionOfUserManager: SessionOfUserManager,
      SunapiClient: SunapiClient,
      CAMERA_TYPE: CAMERA_TYPE,
      ModalManagerService: ModalManagerService,
      $timeout: $timeout,
      UniversialManagerService: UniversialManagerService,
      CAMERA_STATUS: CAMERA_STATUS,
      AccountService: AccountService,
      LoginModel: LoginModel,
      RESTCLIENT_CONFIG: RESTCLIENT_CONFIG
    }));

    if (RESTCLIENT_CONFIG.serverType === 'camera') {
      $scope.onSubmitHandle();
    }


    $scope.desktopAppInfo = {
      isDesktopApp: window.isDesktopApp,
      ipAddress: ""
    };
  }
]);