/**
 * KindSystemService can get the device information from camera.
 *
 * @class   KindSystemService
 * @example 
 * var settings = {
 *      cameraUrl: "[192.168.xxx.xxx]",
 *      echo_sunapi_server:["" or "55.101.78.176:5000"],
 *      user:"[user id]",
 *      password:"[password]"
 * };
 *        
 * KindSystemService.setDeviceConnectionInfo(settings);
 * KindSystemService.getDeviceInfo()
 * .then(function(data){
 *  // handle data            
 *  });
 */
kindSunapi
.factory("KindSystemService", function(KindSunapiService, $q){
    var generateJson = function(data){
        var parser = new BasicSunapiParser();
        return parser.parseLine(data);
    };
    
    var setDeviceConnectionInfo = function(settings){
        KindSunapiService.setSettings(settings);
    };
    
    var getDeviceInfo = function(){
        KindSunapiService.changeCgi('system.cgi');
        KindSunapiService.changeSubmenu('deviceinfo');
        KindSunapiService.changeAction('view');
        
        var deferred = $q.defer();
        KindSunapiService.commit()
        .then(function(response){   
            deferred.resolve(
                KindSunapiService.checkVersion()?response.data:generateJson(response.data)
            );
        });
        
        return deferred.promise;
    };
    
    var isPtzDevice = function(){
        var deferred = $q.defer();
        getDeviceInfo().then(function(data){
            deferred.resolve(
                data.hasOwnProperty('PTZBoardVersion')
            );
        });
        return deferred.promise;
    };
    
    return {
        setDeviceConnectionInfo:setDeviceConnectionInfo,
        getDeviceInfo:getDeviceInfo,
        isPtzDevice:isPtzDevice
    }

});