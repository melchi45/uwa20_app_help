'use strict';
/* global isPhone */
function BaseLogin(
  $scope, SessionOfUserManager, SunapiClient, CAMERA_TYPE, ModalManagerService,
  $timeout, UniversialManagerService, CAMERA_STATUS, AccountService, LoginModel,
  RESTCLIENT_CONFIG) {

  var self = this;
  var loginModel = new LoginModel();
  var optionServiceType = loginModel.getServiceType();
  $scope.serverType = RESTCLIENT_CONFIG.serverType;
  $scope.currentLanguage = "English";
  $scope.loginInfo = {
    serviceType: "",
    id: "",
    password: ""
  };

  var errorCallBack = function(error) {
    console.log(JSON.stringify(error));
    /*
     *** login 실패 시 native에서 web으로 전송되는 문자열
    -. Timeout으로 인한 실패 : "loginResultFailTimeout"
    -. id/password가 잘못되었을 경우 :  "loginResultFailUnauthorized"
    -. 네트워크가 연결이 안되었을 경우 : "loginResultFailNetworkNotConnected"
    -. 그 외의 이유로 실패되었을 경우 : "loginResultFailOther"
    */
    var msg = loginModel.getErrorCallBackMessage(error);
    ModalManagerService.open('message', {
      'buttonCount': 0,
      'message': msg
    });
  };

  $scope.showFindIP = function() {
    var action = function(data) {
      var type_index = data.value;
      $scope.loginInfo.serviceType = optionServiceType[type_index];
    };
    var list = [{
        'name': optionServiceType[CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE],
        'action': action,
        'value': CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE,
      },
      {
        'name': optionServiceType[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB],
        'action': action,
        'value': CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB,
      },
    ];
    ModalManagerService.open(
      'list', {
        'buttonCount': 0,
        'list': list
      },
      action
    );
  };
  this.setAccountData = function(response) {
    var accountInfo = {};
    var data = response.data.Users;

    if (data.length > 0) { //admin, user
      accountInfo = data[0];
    } else { //guest
      accountInfo.UserID = 'guest';
    }
    AccountService.setAccount(accountInfo);
    $scope.loginInfo.id = accountInfo.UserID;
  };


  this.userAccessInfoFailureCallback = function(errorData) {
    console.error(errorData);
  };

  var loginFormIsEmpty = function() {
    var result = false;
    // switch(UniversialManagerService.getServiceType())
    // {
    //     case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
    //         break;
    //     case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
    //         if($scope.loginInfo.id != '' && $scope.loginInfo.password != '')
    //             resu lt = false;
    //         break;
    //     case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
    //         if($scope.loginInfo.id != '' && $scope.loginInfo.password != '')
    //             result = false;
    //         break;
    //     case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:

    //         break;
    // }
    if (isPhone) {
      if (CAMERA_TYPE === 'b2c') {
        if ($scope.loginInfo.id === '' || $scope.loginInfo.password === '') {
          result = true;
        }
      }
    }
    return result;
  };

  $scope.onSubmitHandle = function() {
    /**
     * Remove unnecessary focus in input
     */
    $('input').blur();

    console.log($scope.loginInfo.serviceType + ' -- ' + $scope.loginInfo.id + '--' + $scope.loginInfo.password);
    if (loginFormIsEmpty()) {
      errorCallBack({
        'type': 'empty'
      });
      return;
    }

    tryLogin();

    switch (UniversialManagerService.getServiceType()) {
      case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
        self.loginSSMMobile();
        break;
      case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
        if (RESTCLIENT_CONFIG.serverType === 'grunt') {
          self.loginIPOLISWeb();
        } else {
          self.loginIPOLISWeb_No_Digest();
        }
        break;
      case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
        self.loginSHCMobile();
        break;
      case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
        self.loginIPOLISMobile();
        break;
    }
  };

  var initUI = function() {
    $scope.loggedin = false;
    self.resetLoadingText();
    $scope.btnDisabled = false;
    $scope.isPhone = isPhone;
  };

  this.resetLoadingText = function() {
    $scope.loadingText = loginModel.getResetLoadingMessage();
  };

  this.setLoadingText = function() {
    $timeout(function() {
      $scope.$apply(function() {
        $scope.loadingText = loginModel.getLoadingMessage();
      });
    });
  };

  var tryLogin = function() {
    $scope.btnDisabled = true;
    self.setLoadingText();
  };

  this.afterSuccessLogin = function() {
    SessionOfUserManager.markLoginSuccess();
    console.log("Login Success");
    $scope.btnDisabled = false;
    UniversialManagerService.setisLogin(true);
    this.resetLoadingText();
  };

  this.failedLogin = function(error) {
    var self = this;
    console.log("Login Failed");

    $timeout(function() {
      $scope.$apply(function() {
        $scope.btnDisabled = false;
        UniversialManagerService.setisLogin(false);
        self.resetLoadingText();

        if (error !== null && typeof error !== "undefined") // jshint ignore:line
        {
          errorCallBack(error);
        }
      });
    });
  };

  var loginStatus = function() {
    UniversialManagerService.setisLogin(SessionOfUserManager.isLoggedin());
    if (UniversialManagerService.getisLogin() === true) {
      UniversialManagerService.setisLogin(false);
      SessionOfUserManager.unSetLogin();
    }
    $scope.btnDisabled = false;
    SessionOfUserManager.unMarkLoginSuccess();
  };

  this.initServiceType();
  initUI();
  loginStatus(); //Added to reset the stored authentication info


}

BaseLogin.prototype.initServiceType = function() {};
BaseLogin.prototype.loginIPOLISWeb_No_Digest = function() {};
BaseLogin.prototype.loginIPOLISWeb = function() {};
BaseLogin.prototype.loginSHCMobile = function() {};
BaseLogin.prototype.loginIPOLISMobile = function() {};
BaseLogin.prototype.getAttributes = function() {};
BaseLogin.prototype.successLogin = function() {
  this.getAttributes();
  this.afterSuccessLogin();
};

kindFramework.controller('BaseLoginCtrl', ['$scope', 'SessionOfUserManager', 'SunapiClient',
  'CAMERA_TYPE', 'ModalManagerService', '$timeout', 'UniversialManagerService',
  'CAMERA_STATUS', 'AccountService', 'LoginModel', 'RESTCLIENT_CONFIG', BaseLogin
]);