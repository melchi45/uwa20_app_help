/**
 * KindPTZService can control PAN, TILT and ZOOM of camera.
 *
 * @class   KindPTZService
 * @example 
 * var settings = {
 *      cameraUrl: "192.168.xxx.xxx",
 *      echo_sunapi_server:["" or "55.101.78.176:5000"],
 *      user:"userid",
 *      password:"password",
 *      options:{
 *          unitSize:3.0,   // optional
            pulseSize:20    // optional
 *      }
 * };
 *        
 * KindPTZService.setDeviceConnectionInfo(settings);
 * KindPTZService.left();
 */
kindSunapi
.factory("KindPTZService", function(KindSunapiService, $q){
    var unitSize = 3.0;
    var pulseSize =  20;//Temporary Magic Number
    var ptz_param = {
            Pan: 0.0,
            Tilt: 0.0,
            ZoomPulse: 0.0
    };
    var sunapiSettings;
    
    var setDeviceConnectionInfo = function(settings){
        if(!KindSunapiService.isNull(settings.options)) {
            if(!KindSunapiService.isNull(settings.options.unitSize)){
                unitSize = settings.options.unitSize;
            }
            if(!KindSunapiService.isNull(settings.options.pulseSize)) {
                pulseSize = settings.options.pulseSize;
            }
        }
        
        KindSunapiService.setSettings(settings);
        KindSunapiService.changeCgi('ptzcontrol.cgi');
        KindSunapiService.changeSubmenu('relative');
        KindSunapiService.changeAction('control');
        KindSunapiService.changeParam(ptz_param);
        
    };
    
    var setPTZValue = function(p, t, z){
        ptz_param.Pan = p;
        ptz_param.Tilt = t;
        ptz_param.ZoomPulse = z;
    };
    
    var run = function(){
        var deferred = $q.defer();
        KindSunapiService.commit().then(function(response){   
                deferred.resolve(response.data);
        });
        return deferred.promise;
    };
    
    var left = function(){
        setPTZValue(unitSize, 0.0, 0.0);
        KindSunapiService.changeParam(ptz_param);
        KindSunapiService.changeSubmenu('relative');
        return run();
    };
    
    var right = function(){
        setPTZValue(-unitSize, 0.0, 0.0);
        KindSunapiService.changeParam(ptz_param);
        KindSunapiService.changeSubmenu('relative');
        return run();
    };
    
    var up = function(){
        setPTZValue(0.0, unitSize, 0.0);
        KindSunapiService.changeParam(ptz_param);
        KindSunapiService.changeSubmenu('relative');
        return run();
    };
    
    var down = function(){
        setPTZValue(0.0, -unitSize, 0.0);
        KindSunapiService.changeParam(ptz_param);
        KindSunapiService.changeSubmenu('relative');
        return run();
    };
    
    var zoomIn = function(){
        setPTZValue(0.0, 0.0, unitSize * pulseSize);
        KindSunapiService.changeParam(ptz_param);
        KindSunapiService.changeSubmenu('relative');
        return run();
    };
    
    var zoomOut = function(){
        setPTZValue(0.0, 0.0, -unitSize * pulseSize);
        KindSunapiService.changeParam(ptz_param);
        return run();
    };
    
    var areaZoomIn = function(x1,y1,x2,y2){
        var areaZoomParam = {
            Type:'ZoomIn',
            X1:x1,
            X2:x2,
            Y1:y1,
            Y2:y2,
            TileWidth:200,
            TileHeight:200
        };
        KindSunapiService.changeParam(areaZoomParam);
        KindSunapiService.changeSubmenu('areazoom');
        return run();        
    };
    
    var areaZoomOut = function(){
        var areaZoomParam = {
            Type:'1x'
        };
        KindSunapiService.changeParam(areaZoomParam);
        KindSunapiService.changeSubmenu('areazoom');
        return run();
    }

    return {
//        areaZoomIn:areaZoomIn,//abnormal operation
//        areaZoomOut:areaZoomOut,//abnormal operation
        setDeviceConnectionInfo:setDeviceConnectionInfo,
        left:left,
        right:right,
        up:up,
        down:down,
        zoomIn:zoomIn,
        zoomOut:zoomOut
    };
});