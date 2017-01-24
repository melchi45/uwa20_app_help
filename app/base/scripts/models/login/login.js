kindFramework.factory(
	'LoginModel',
	function(
	 CAMERA_STATUS,
	 UniversialManagerService
	 ){
	'use strict';
	var LoginModel = function(){
		if(!(this instanceof LoginModel)){
				return new LoginModel();
		}
		
		this.getServiceType = function(){
			return ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
		};
		
		this.getErrorCallBackMessage = function(error){
			/*
         *** login 실패 시 native에서 web으로 전송되는 문자열
        -. Timeout으로 인한 실패 : "loginResultFailTimeout"
        -. id/password가 잘못되었을 경우 :  "loginResultFailUnauthorized"
        -. 네트워크가 연결이 안되었을 경우 : "loginResultFailNetworkNotConnected"
        -. 그 외의 이유로 실패되었을 경우 : "loginResultFailOther"
        */
        var msg = '';
			
        switch(error.type.toLowerCase()){
					case "timeout":
							msg = 'Timeout으로 로그인에 실패하였습니다.';
					break;
					case "unauthorized":
							msg = 'Id 또는 Password가 잘못되었습니다.';
					break;
					case "network_not_connected":
							msg = '네트워크가 연결되지 않았습니다.';
					break;
					case "unknown":
							msg = '알 수 없는 이유로 실패하였습니다.';
					break;
					case "invalidate_parameter":
							msg = 'Id 또는 Password가 잘못되었습니다.';
					break;
					case "empty":
							msg = 'Id 또는 Password값을 입력하지 않았습니다.';
					break;
					default:
							msg = JSON.stringify(error);
					break;
			}
			return msg;
		};
		
		this.getIPOLISWebErrorMessage = function(errorCode){
			var msg = null;
			if(typeof errorCode !== 'undefined'){
					if(errorCode === 490){
							msg = "Exceeded maximum login attempts, please try after some time";
					}
					else if(errorCode === 401){
							msg = "Authorization Error";
					}
			}else{
					msg = "Login Error";
			}    
			
			return msg;
		};
		
		this.getTimeoutMessage = function(){
			return "lang_timeout";
		};
		
		this.getLoadingMessage = function(){
			var msg = "Loading...";
			return msg;
		};
		
		this.getResetLoadingMessage = function(){
			var msg = null;
       		switch(UniversialManagerService.getServiceType()){
				case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
						msg = "Universal App";
				break;
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
						msg = "Universal Web";
				break;
				case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
						msg = "Universal App";
				break;
			}			
			return msg;
		};
	};
	
	return LoginModel;
});