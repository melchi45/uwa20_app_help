/* global localStorage setTimeout */
"use strict";
var wn5OnlineHelp = angular.module(
	'wn5OnlineHelp',
	[
	    'ui.router'
	]
);

wn5OnlineHelp.
	config(function($stateProvider, $urlRouterProvider){
    	var supportRoute = null;
    	try{
			if(!("supportRoute" in localStorage)){
				alert("Wrong Access");
				window.close();
				return;
			}else{
				supportRoute = JSON.parse(localStorage.supportRoute);	
			}

			for(var i = 0, ii = supportRoute.length; i < ii; i++){
				var self = supportRoute[i];

		        $stateProvider.state(self.stateName, {
		            url: self.urlName,
		            templateUrl: self.templateUrl || null,
		            controller: "onlineHelpCtrl"
		        });
			}

	    	$urlRouterProvider.otherwise(supportRoute[0].urlName + supportRoute[1].urlName);
    	}catch(e){
    		console.error(e);
    	}

    	/*
    	$stateProvider.state('help', {
    		url: '/help',
    		templateUrl: 'main.html',
    		controller: 'onlineHelpCtrl'
    	});

    	$stateProvider.state('help.basic_videoProfile', {
    		url: '/basic_videoProfile',
    		templateUrl: 'basic/profile.html',
    		controller: 'onlineHelpCtrl'
    	});
    	*/
    }).
	controller("onlineHelpWrapperCtrl", function($scope, $state){
		var supportMenu = null;
		var supportFeatures = null;

		if("supportMenu" in localStorage){
			supportMenu = JSON.parse(localStorage.supportMenu);
			supportFeatures = JSON.parse(localStorage.supportFeatures);
			$scope.langOnlineHelp = localStorage.langOnlineHelp;
		}else{
			return;
		}

    	$scope.menuData = supportMenu;

    	for(var featureName in supportFeatures){
    		$scope[featureName] = supportFeatures[featureName];
    	}

		$scope.activeCheck = function(state){
			var className = $state.current.name.indexOf(state) > -1 ? 'active in' : '';
			return className;
		};

    	setTimeout(function(){
    		$('body').css('min-width', 'initial');
    		$("#side-menu").parent().metisMenu();
    	});
	}).
	controller("onlineHelpCtrl", function(){
    	setTimeout(function(){
    		$("#side-menu").parent().metisMenu();
    	});
	});