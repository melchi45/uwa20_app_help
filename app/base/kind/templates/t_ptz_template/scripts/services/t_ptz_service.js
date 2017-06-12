
var ptzModule = angular.module('ptzModule',[]);

/**
 * ptz template interface service Component
 * @memberof ptzModule
 * @ngdoc service
 * @name ptzInterFace
 * @param 'ptzInterface' {string} service name
 * @param {function} service soruce
 * @fires angluar bootstrap kindFramework
 * @example 
 *   Module.Component(Component Name, function (ptzInterface) { 
 *        your source~
 *    });
*/
ptzModule.service('ptzInterface', function(KindPTZService){
    return {
        directions:[
            {direction:'up'},
            {direction:'right'},
            {direction:'down'},
            {direction:'left'}
        ],
        
/**
 * Submit ptz Control info by PtzController
 * @function moveCamera
 * @memberof ptzInterFace
 * @param ip {string} ip of control camera
 * @param type {string} ptz event type
 * @example ptzInterface.moveCamera('192.168.123.208','up')
 */
        moveCamera:function(ip,type,sunapiServer,user,password){
/**
 * PtzConroller setting variables
 * @var ptzSettings
 * @memberof ptzInterface
 */
            var ptzSettings = {
                cameraUrl: ip,

                // Temporary parameters caused by origin Issue of SUMAPI.
                echoSunapiServer:sunapiServer,
                user:user,
                password:password,
                options:{
                    unitSize:3.0,
                    pulseSize:20
                }
            };
            
/**
 * PtzController of common_modules
 * @var controller
 * @memberof ptzInterface
 */
            KindPTZService.setDeviceConnectionInfo(ptzSettings);
            switch(type){
                case'up':
                    KindPTZService.up();
                break;
                case'down':
                    KindPTZService.down();
                break;
                case'right':
                    KindPTZService.right();
                break;
                case'left':
                    KindPTZService.left();
                break;
                case'zoomIn':
                    KindPTZService.zoomIn();
                break;
                case'zoomOut':
                    KindPTZService.zoomOut();
                break;

            }
        }
    }
});
