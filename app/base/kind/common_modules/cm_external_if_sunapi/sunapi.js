var kindSunapi = angular.module("kindSunapiModule", []);

kindSunapi
.factory('KindSunapiService', function($http){
    var cameraUrl;// = settings.url;
    var _cgi;// = settings.cgi;
    var _msubmenu;// = settings.msubmenu;
    var _action;// = settings.action;
    var _param;// = settings.param;

    // Temporary variables caused by origin Issue of SUMAPI.
    var _echo_sunapi_server;// = settings.echo_sunapi_server;
    var _user;// = settings.user;          
    var _password;// = settings.password;  

    var setSettings = function(settings){
        if(!settings){
            return;
        }
        cameraUrl = settings.cameraUrl;
        _cgi = settings.cgi;
        _msubmenu = settings.msubmenu;
        _action = settings.action;
        _param = settings.param;

        // Temporary variables caused by origin Issue of SUMAPI.
        _echo_sunapi_server = settings.echo_sunapi_server;
        _user = settings.user;          
        _password = settings.password;    
    };

    var changeCgi = function(cgi){
        _cgi = cgi;
    };

    var changeParam = function(param){
        _param = param;
    };

    var changeAction = function(action){
        _action = action;
    };

    var changeSubmenu = function(menu) {
        _msubmenu = menu;
    };

    var getUrl = function(){ 
//        var path = "http://"+_user+":"+_password+"@"+cameraUrl+"/stw-cgi/"+_cgi+"?msubmenu="+_msubmenu+"&action="+_action;
        var path = "http://"+cameraUrl+"/stw-cgi/"+_cgi+"?msubmenu="+_msubmenu+"&action="+_action;
        var param_url = "";
        if(_param){
            for(var param_name in _param){
              param_url += (param_name)?"&"+param_name+"="+_param[param_name]:"";   
            }
        }
        else{
            param_url += "";
        }
        console.log(path+param_url);
        return path + param_url;
    };

    var toString = function(){
        console.log(this.getUrl()); 
    };

    var commit = function(additionalConfig){
        return checkVersion()?commitJsonSunapi(additionalConfig):commitOldSunapi(additionalConfig);
    };
    
    var addConfig = function(config, additionalConfig){
        if(isNull(additionalConfig)){
           return;
        }
        if(Object.keys(additionalConfig).length > 0){
            for(var key in additionalConfig){
                config[key] = additionalConfig[key];
            }
        }
    };
    
    var commitJsonSunapi = function(additionalConfig){
//        console.log("for json version sunapi");
        var config = {
            method: "GET",
            url: getUrl(),
            timeout: 10000,
            withCredentials: true
        };
        addConfig(config, additionalConfig);
        return $http(config);
    };

    // Temporary function caused by origin Issue of SUMAPI.

    var commitOldSunapi = function(additionalConfig){
//        console.log("for old version sunapi");
        var additionalUrl = "";
        if(!isNull(additionalConfig) && (additionalConfig['responseType']==='blob')){
            additionalUrl = "/BASE64";            
        }
        var config = {
            method: "POST",
            url: "http://"+_echo_sunapi_server+"/SUNAPI"+additionalUrl,
            data: {"user": _user, "password": _password, "url": getUrl()}
        };
        
        return $http(config);
    };

    var isNull = function(param) {
      return (param === undefined || param === null || param === '');
    };

    /**
     * if it isn't used _echo_sunapi_server, sunapi is json response type.
     */
    var checkVersion = function(){
        var OLD_VERSION = 0;
        var JSON_VERSION = 1;
        var version = isNull(_echo_sunapi_server);
        return version?JSON_VERSION:OLD_VERSION;
    };

    return {
        isNull:isNull,
        checkVersion:checkVersion,
        setSettings:setSettings,
        changeCgi:changeCgi,
        changeParam: changeParam,
        changeAction: changeAction,
        changeSubmenu: changeSubmenu,
        getUrl: getUrl,
        commit: commit
    };
});
