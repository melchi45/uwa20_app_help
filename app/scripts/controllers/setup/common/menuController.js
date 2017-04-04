kindFramework.controller('sideMenuCtrl', function ($scope, $rootScope, $state, MenuData ) {
	"use strict";
	$rootScope.$state = $state;
	$scope.menuData = MenuData.getMenuData($state);
	//활성화 메뉴 클래스
	$scope.activeCheck = function(state){
		var className = $state.current.name.indexOf(state) > -1 ? 'active in' : '';
		return className;
	};

	//왼쪽 메뉴 첫번째 메뉴가 페이지를 가지고있는 메뉴인지 자식을 감싸고만 있는 메뉴인지 체크하여 링크값을 리턴
	$scope.getLink = function(menuData){
		var stateName = menuData.templateUrl !== null ? menuData.stateName : "#";
	};

	$scope.wasteValue = function(){
		return Math.random();
	};

});

kindFramework.controller('topNavCtrl', function ($scope, $rootScope, $state, MenuData) {
	"use strict";
	$rootScope.$state = $state;
	$scope.menuData = MenuData.getTopMenuData();
});

kindFramework.controller('layoutCtrl', function($scope, $rootScope, $state, MenuData, SessionOfUserManager,ModalManagerService,UniversialManagerService,SunapiClient,RESTCLIENT_CONFIG) {
	"use strict";

	var menuData = MenuData.getMenuData($state);
	$scope.navOpened = false;
	$scope.userName = SessionOfUserManager.getUsername();
	$rootScope.isCameraSetupPreview = false;


	$scope.toggleNav = function(val) {
		$scope.navOpened = val;
		if(val === true)
		{
			$('.side-nav-wrapper').css({zIndex: '10001 !important'});
		}
		else
		{
			$('.side-nav-wrapper').css({zIndex: '0 !important'});
		}
	};

    function livePreviewMode(mode) {
        var setData = {};

        setData.ImagePreview = mode;

        SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
                function (response) {
                	window.location.href =$rootScope.monitoringPath;
                },
                function (errorData) {
                   window.location.href =$rootScope.monitoringPath;
                }, '', true);
    }

	$scope.getMenuPath = function() {
		var menuPath = [];
		var currentName = $state.current.name;
		var parnetName = $state.current.name.split("_")[0];
		var i = 0;
		var j = 0;
		while(i < menuData.length) {
			if(menuData[i].stateName.indexOf(parnetName) >= 0) {
				menuPath.push(menuData[i].name);
				j = 0;
				while( j < menuData[i].childs.length) {
					if(menuData[i].childs[j].stateName.indexOf(currentName) >= 0) {
						menuPath.push(menuData[i].childs[j].name);
						break;
					}
					j++;
				}
				break;
			}
			i++;
		}
		return menuPath;
	};

	$scope.$on('$stateChangeStart',function (event, toState, toParams, fromState, fromParams) {
		if(toState !== fromState) $scope.toggleNav(false);
	});

	$scope.isDisableSideNav= function()
	{
		if(getId($state.current.name) === 'taskmanager')
		{
			$('#setup-main').attr('style', 'left: 0 !important; margin-top: 0 !important');
			return true;
		}
		return false;
	};

	function getId(id)
    {
        var newIds = id.split('_');

        if (newIds.length === 2)
        {
            newIds = newIds[1];
            return newIds;
        }
        else
        {
            newIds = id;
        }

        newIds = newIds.split('.');

        if (newIds.length === 2)
        {
            newIds = newIds[1];
        }

        return newIds;
    }

	$scope.OnLogout = function(){
		if(RESTCLIENT_CONFIG.serverType === 'grunt')
        {
			ModalManagerService.open('logout', {'buttonCount': 2 }, function(success) {
            	UniversialManagerService.setisLogin(false);
              	UniversialManagerService.removeUserId();
              	UniversialManagerService.initialization();
              	SessionOfUserManager.RemoveSession();
              	SessionOfUserManager.UnSetLogin();
              	$state.go('login');
            }, {}, 'modal-setup');
		}
	};

});