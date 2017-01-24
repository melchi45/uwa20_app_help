/**
 * snapshot directive
 * @memberof kindFramework
 * @ngdoc directive
 * @name snapshot
 * @fires write a snapshot element
 * @example <snapshot data="your data"></snapshot>
*/

kindFramework.directive('snapshot',function(KindProfileService){
    return {
        restrict:'E',
        scope:{
            data:'='
        },
        template:'<img class="snapshot-image" src="{{ imageData }}">',
        link:function(scope,element,target,fn){
            scope.$watch('data',function(){
                var default_image = "images/image_placeholder.jpg";
                if(scope.data !== undefined){
                    KindProfileService.setDeviceConnectionInfo(scope.data);

                    KindProfileService.getSnapshot().then(function(value){
                        scope.imageData = value;
                    },function(){
                        scope.imageData = default_image;
                        console.log("fail load, please check your form");   
                    });
                }else {
                    scope.imageData = default_image;
                }
                
            });
            
        }
    }
});


