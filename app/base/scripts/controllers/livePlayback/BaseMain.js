/*global detector, location */
function BaseMain($scope, $location, $window, $rootScope, $timeout, $state, ModalManagerService,
  SunapiClient, DisplayService, UniversialManagerService, CAMERA_STATUS, RESTCLIENT_CONFIG) {

  var display = new DisplayService();
  var self = this;

  var setInitialValue = function() {
    $scope.navOpened = false;
    $scope.isLoading = false;
    $scope.navOverlay = false;
    $scope.isNavHide = false;
    $scope.isAdmin = false;
    display.closeFullScreen();
    $scope.optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
    $scope.connectedService = $scope.optionServiceType[UniversialManagerService.getServiceType()];
    self.setInitial();
  };

  setInitialValue();

  $scope.logout = function() {
    $rootScope.$emit('allpopupclose');

    switch (UniversialManagerService.getServiceType()) {
      case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
        break;
      case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
        /*
         * Block logout popup and feature for 9081 Camera.
         * Authentication is changed as legacy digest logic, No use JS auth anymore.
         * JS auth feature should be blocked, and keep feature same as Legacy specification.
         *          
         */
        if (RESTCLIENT_CONFIG.serverType === 'grunt') {
          self.gruntLogout();
        }
        break;
      case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
        return self.mobileLogout();
        //break; //Make block for fix Static Analysis lint error - Unreachable 'break' after 'return'
      case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
        break;
    }
  };

  $scope.toggleNav = function(val) {
    $scope.navOpened = val;
  };

  $scope.openNav = function() {
    $scope.toggleNav(true);
    $rootScope.$emit("app/scripts/directives/fullCamera.js::hiddenFunctions");
    $rootScope.$emit("allpopupclose");
  };

  $scope.closeNav = function() {
    $scope.toggleNav(false);
  };

  $scope.toggleOverlay = function(val) {
    $scope.navOverlay = val;
  };
  $scope.toggleHide = function(val) {
    $scope.isNavHide = val;
  };

  $scope.onLocation = function(param) {
    var path = $location.$$path;
    if (path.indexOf(param) < 0) {
      return true;
    } else {
      return false;
    }
  };

  var w = angular.element($window);
  w.on('resize', function() {
    if (!$scope.$$phase) {
      $scope.$broadcast('resize::resize');
    }
  });

  $scope.goState = function(param) {
    console.info(param);
    var path = $state.current.name;
    self.goState(param);
    $scope.navOpened = false;
  };

  var domControls = $scope.domControls = {
    visibilityLogoutPopup: false,
    visibilityStatusPopup: false,
  };
  $scope.resetMainMenuPopup = function() {
    domControls.visibilityStatusPopup = false;
    domControls.visibilityLogoutPopup = false;
  };
  $scope.gotoLoginPage = function() {
    $state.go('login');
  };

  $scope.showStatusPopup = function() {
    var DEFAULT_CHANNEL = 0;
    $scope.profileInfoList = 0;
    $scope.userList = 0;
    $scope.videoProfileList = 0;

    SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
      function(response) {
        $scope.videoProfileList = response.data.VideoProfiles[0].Profiles;
        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=profileaccessinfo&action=view', '',
          function(response) {
            $scope.profileInfoList = response.data.ProfileAccessInfo.ProfileInfo[0].Profiles;
            $scope.userList = response.data.ProfileAccessInfo.Users;
            for (var index = 0; index < $scope.profileInfoList.length; index++) {
              $scope.profileInfoList[index].Name = $scope.videoProfileList[index].Name;
            }
            ModalManagerService.open('status', {
              'buttonCount': 0,
              'profileInfoList': $scope.profileInfoList,
              'userList': $scope.userList
            });
            $scope.toggleNav(false);
          },
          function(errorData) {
            ModalManagerService.open('message', {
              'buttonCount': 0,
              'message': errorData
            });
          }, '', true);
      },
      function(errorData) {
        ModalManagerService.open('message', {
          'buttonCount': 0,
          'message': errorData
        });
      }, '', true);
  };

  $scope.goToChannel = function() {
    $scope.goState('uni.channel');
    $scope.clearHistoryStack();
  };

  $rootScope.$saveOn('toggleNavOpened', function(event, data) {
    console.log('toggleNavOpened is ' + data);
    $scope.navOpened = data;
  }, $scope);

  $rootScope.$saveOn('app/scripts/controllers/livePlayback/main.js::toggleOverlay', function(event, data) {
    console.log('toggleOverlay is ' + data);
    $scope.toggleOverlay(data);
  }, $scope);

  var showLoadingBar = function(_val) {
    $scope.isLoading = _val;
    $timeout(function() {
      $scope.$digest();
    });
  };

  $rootScope.$saveOn('changeLoadingBar', function(event, data) {
    //console.log("main.js::changeLoadingBar is Loaded with data : " + data);
    showLoadingBar(data);
  }, $scope);

  $rootScope.$saveOn('scripts/controllers/common/wrapper.js::$locationChangeStart', function(event) {
    setInitialValue();
  }, $scope);
}

BaseMain.prototype.gruntLogout = function() {};
BaseMain.prototype.mobileLogout = function() {};
BaseMain.prototype.goState = function(param) {};

kindFramework
  .controller('BaseUniversalMainCtrl', ['$scope', '$location', '$window', '$rootScope', '$timeout', '$state', 'ModalManagerService', 'SunapiClient',
    'DisplayService', 'UniversialManagerService', 'CAMERA_STATUS', 'RESTCLIENT_CONFIG',
    BaseMain
  ]);