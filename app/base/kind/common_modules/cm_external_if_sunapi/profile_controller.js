/**
 * KindProfileService can get the profile list or snapshot from camera.
 *
 * @class   KindProfileService
 * @example 
 * var settings = {
 *      cameraUrl: "192.168.xxx.xxx",
 *      echo_sunapi_server:["" or "55.101.78.176:5000"],
 *      user:"userid",
 *      password:"password",
 * };
 *        
 * KindProfileService.setDeviceConnectionInfo(settings);
 * KindProfileService.getProfileList()
 * .then(function(data){
 *  // handle data            
 *  });
 */
kindSunapi
.factory("KindProfileService", function(KindSunapiService, $q){
    var profile_param = {};
    var sunapiSettings;

    var generateJson = function(data){
        var parser = new ProfileParser();
        return parser.parseLine(data);
    };
    
    var setDeviceConnectionInfo = function(settings){
        KindSunapiService.setSettings(settings);
    };
    
    var getProfileList = function(profile, channel){
        var deferred = $q.defer();
        
        if(!KindSunapiService.isNull(profile)){
            profile_param.Profile = profile;
        }
        
        if(!KindSunapiService.isNull(channel)){
            profile_param.Channel = channel;
        }
        
        KindSunapiService.changeCgi('media.cgi');
        KindSunapiService.changeSubmenu('videoprofile');
        KindSunapiService.changeAction('view');
        KindSunapiService.changeParam(profile_param);
        KindSunapiService.commit()
            .then(function(response){   
                deferred.resolve(
                    KindSunapiService.checkVersion()?response.data:generateJson(response.data)
                );
            });

        return deferred.promise;
    };
    
    var getSnapshot = function(){
        var fr = new FileReader();
        var deferred = $q.defer();            

        KindSunapiService.changeCgi('video.cgi');
        KindSunapiService.changeSubmenu('snapshot');
        KindSunapiService.changeAction('view');
        KindSunapiService.commit({responseType:'blob'})
        .then(function(response){
            if(KindSunapiService.checkVersion()){
                fr.onload = function(){
                    deferred.resolve(
                        "data:image/jpeg;base64,"+ window.btoa(fr.result)
                    );
                };
                fr.readAsBinaryString(response.data);
            }
            else{
                deferred.resolve(
                    "data:image/jpeg;base64,"+ response.data
                );
            }
        },
             function(response){
            console.log("fail snapshot!");
        });

        return deferred.promise;
    };
    
    return {
        setDeviceConnectionInfo:setDeviceConnectionInfo,
        getProfileList:getProfileList,
        getSnapshot:getSnapshot,
        createProfile:function(){
            //TODO
        }
    };
});