"use strict";

var app = {
    webviewUrl: 'http://',
	
	// Check if app is running on browser on device
    setDevice: function () {
        window.isPhone = false;
        var documentUrl = document.URL;
        
        if (documentUrl.indexOf("http://") === -1 && documentUrl.indexOf("https://") === -1) {
            window.isPhone = true;
        }
        return window.isPhone;
    },
	
    // Application Constructor
    initialize: function() {
        this.setDevice();
        /*
        scripts/detecter.js파일의 객체
        
        //Browsers들        
        detector.chrome
        detector.firefox
        detector.msie
        detector.msedge
        detector.android
        detector.ios
        detector.opera
        detector.safari
        
        //Version
        detector.version
        */
        
        //설치되거나 Univarsal App으로 오는 것을 선택했을 때
        //( detector.msie && detector.version < 9 ) 이 부분을 수정하면 됨
        //Chrome에서 테스트 하고 싶을 때
        //if( ( detector.chrome ) && ( browserDetect !== "true" )){ 
        
        if(window.isPhone){
            this.bindEvents();
        }else{
            if(detector.msie || detector.safari || detector.firefox){
                $('body').addClass('wisenet-dark-setup');
            }
            
            try{
                var _this = this;
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open( "POST", "../home/pw_check.cgi", true); // false for synchronous request
                xmlHttp.send( null );

                xmlHttp.onreadystatechange = function(){
                    if(this.readyState === 4){
                        if(this.status == 200){
                            if(xmlHttp.responseText == "OK"){
                                location.href = "../home/setup/pw_change.cgi";
                            }else{
                                if(xmlHttp.responseText === "admin"){
                                    document.getElementsByTagName('title')[0].innerHTML = "Wisenet WEBVIEWER";
                                    _this.onDeviceReady();
                                }else{
                                    var hashName = window.location.hash;                                    
                                    if(hashName === ""){
                                        document.getElementsByTagName('title')[0].innerHTML = "Wisenet WEBVIEWER";
                                        _this.onDeviceReady();
                                    }else{
                                        if(hashName.indexOf("uni/channel") !== -1){
                                            document.getElementsByTagName('title')[0].innerHTML = "Wisenet WEBVIEWER";
                                            _this.onDeviceReady();                                            
                                        }else{
                                            location.href = "../wmf/index.html";
                                        }
                                    }
                                }
                            }
                        }else if(this.status == 401){
                            document.getElementsByTagName('title')[0].innerHTML = "401 - Unauthorized";
                            document.getElementsByClassName('wrap')[0].innerHTML = "<h1>401 - Unauthorized</h1>";
                        }else if(this.status == 490){
                            document.getElementsByTagName('title')[0].innerHTML = "Account Blocked";
                            document.getElementsByClassName('wrap')[0].innerHTML = "<h1>You have exceeded the maximum number of login attempts, please try after some time.</h1>";
                        }else{
                            document.getElementsByTagName('title')[0].innerHTML = "Wisenet WEBVIEWER";
                            _this.onDeviceReady();
                        }
                    }
                }
            }catch(e){

            }

        }
    },
    
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
	
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
			console.log('onDeviceReady..');
			angular.bootstrap(document, ['kindFramework']);
    }
};

app.initialize();