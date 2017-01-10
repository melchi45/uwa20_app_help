/*global BaseWrapper*/
kindFramework
.controller('WrapperCtrl',['$controller','$rootScope', '$scope', 'RESTCLIENT_CONFIG', 
	'MultiLanguage','ROUTE_CONFIG','Attributes','SessionOfUserManager',
	function($controller,$rootScope, $scope, RESTCLIENT_CONFIG, MultiLanguage,
	ROUTE_CONFIG,Attributes,SessionOfUserManager){
		"use strict";
		var self = this;
		BaseWrapper.prototype.stateChange = function(toState,fromState) {
			setBodyHeightInLive(toState.name);
		};
		angular.extend(this, $controller('BaseWrapper',{
			$rootScope:$rootScope, $scope:$scope, RESTCLIENT_CONFIG:RESTCLIENT_CONFIG,
			MultiLanguage:MultiLanguage, ROUTE_CONFIG:ROUTE_CONFIG, Attributes:Attributes,
			SessionOfUserManager:SessionOfUserManager
		}));

		function setBodyHeightInLive(toStateName){
			var wisenetBodyCls = 'wisenet-desktop-body';
			var kindResponsiveCls = {
				live: 'kind-responsive-live',
				playback: 'kind-responsive-playback',
				setup: 'kind-responsive-setup'
			};
			var kindResponsiveReg = {
				live: /^(uni.channel)/,
				playback: /^(uni.playbackChannel)/,
				setup: /^(setup.)/
			};
			var body = $('body');

			if(toStateName === "uni.channel"){
				if(!body.hasClass(wisenetBodyCls)){
				  body.addClass(wisenetBodyCls);
				}
			}else{
				body.removeClass(wisenetBodyCls);
			}

			for(var keyName in kindResponsiveReg){
				var clsName = kindResponsiveCls[keyName];
				var hasClass = body.hasClass(clsName);
				var reg = kindResponsiveReg[keyName];

				if(reg.test(toStateName)){
					if(!hasClass){
						body.addClass(clsName);	
					}
				}else if(hasClass){
					body.removeClass(clsName);
				}
			}
		}
}]);