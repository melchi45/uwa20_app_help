/**
 * draggable directive
 * @memberof kindFramework
 * @ngdoc directive
 * @name draggable
 * @fires write a draggable attribute
 * @example <div draggable></div>
*/

kindFramework.directive('draggable',function(){
    return {
        restrict:'A',
        link:function(scope,element,target,fn){
            
            /**
             * draggable directive need 'content' name scope
             * @var content
             * @memberof draggable
             */
            var content = scope.content;
                element.draggable({
                    cursorAt:{
                        top:10,
                        left:50
                    },
                    helper:function(event){

                        /**
                         * url for submit rtsp
                         * @var rtspUrl
                         * @memberof draggable
                         */
                        var rtspUrl = "rtsp://"+content.user+":"+content.password+"@"+content.ip+"/profile2/media.smp";
                        element.attr('data-url',rtspUrl);
                        element.attr('data-width',content.width);
                        element.attr('data-height',content.height);
                        return $("<div id='drag-helper'>"+content.title+"</div>");
                    }
                });
        }
    }
});


/**
 * droppable directive
 * @memberof kindFramework
 * @ngdoc directive
 * @name droppable
 * @fires write a droppable attribute
 * @example <div droppable></div>
*/
kindFramework.directive('droppable',function(){
    return {
        restrict:'A',
        link:function(scope,element,target,fn){
            
            element.droppable({
                drop:function(event,ui){
                    /**
                     * draggable element
                     * @var u
                     * @memberof droppable
                     */
                    var u = ui.draggable;
                    
                    /**
                     * get index of drop target 
                     * @var channelId
                     * @memberof droppable
                     */
                    var channelId = angular.element("kind-stream").index(element);                    

                    /**
                     * player data for play stream
                     * @var changeplayerdata
                     * @memberof droppable
                     */
                    var changeplayerdata = {
                        channelId: channelId,
                        server_address:"55.101.78.176:5000",
                        rtspUrl: u.attr('data-url'),
                        width: u.attr('data-width'),
                        height: u.attr('data-height')
                    };

                    scope.playerdata[scope.channelId] = changeplayerdata;
                    scope.$apply();
                    
                }
            });
            
        }
    }
});
