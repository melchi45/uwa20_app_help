/*global location, BaseMain, confirm */
kindFramework.
  controller('UniversalMainCtrl', ['$scope', '$location', '$window', '$rootScope', 'CAMERA_TYPE',
    'ModalManagerService', 'SunapiClient', 'DisplayService', 'UniversialManagerService',
    'SessionOfUserManager', 'CAMERA_STATUS', '$timeout', '$state', 'RESTCLIENT_CONFIG', 
    '$controller',
    function($scope, $location, $window, $rootScope, CAMERA_TYPE,
      ModalManagerService, SunapiClient, DisplayService, UniversialManagerService,
      SessionOfUserManager, CAMERA_STATUS, $timeout, $state, RESTCLIENT_CONFIG, $controller) {
      "use strict";

      BaseMain.prototype.setInitial = function() {
        if (SessionOfUserManager.getUsername() === 'undefined') {
          $scope.showLoginAccountID = 'User';
        } else {
          $scope.showLoginAccountID = SessionOfUserManager.getUsername();
        }
        if ($scope.showLoginAccountID === 'admin') {
          $scope.isAdmin = true;
        }
      };

      BaseMain.prototype.gruntLogout = function() {
        ModalManagerService.open('logout', {'buttonCount': 2 }, function(success) {
          UniversialManagerService.setisLogin(false);
          UniversialManagerService.removeUserId();
          UniversialManagerService.initialization();
          SessionOfUserManager.removeSession();
          SessionOfUserManager.unSetLogin();
          $state.go('login');
        });
        $scope.toggleNav(false);
      };

      BaseMain.prototype.goState = function(param) {
        $state.go(param);
      };

      angular.extend(this, $controller('BaseUniversalMainCtrl', {
        $scope: $scope,
        $location: $location,
        $window: $window,
        $rootScope: $rootScope,
        $timeout: $timeout,
        $state: $state,
        ModalManagerService: ModalManagerService,
        SunapiClient: SunapiClient,
        DisplayService: DisplayService,
        UniversialManagerService: UniversialManagerService,
        CAMERA_STATUS: CAMERA_STATUS,
        RESTCLIENT_CONFIG: RESTCLIENT_CONFIG,
      }));
    },
  ]);