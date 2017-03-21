kindFramework.controller('ChannelListCtrl', function($scope, $timeout,  $rootScope) {
    "use strict";

    var channlistClass = 'channellist-video-wrapper';
    var count = 0;
    var requestId = null;

    window.addEventListener('resize', resizeHandle);
    
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', resizeHandle);
    });

    function resizeHandle(){
        var renderCallBack = function(){
            count++;
            changeCanvas();
            if(count >= 5){
                window.cancelAnimationFrame(requestId);
                count = 0;
                requestId = null;
            }else{
                requestId = window.requestAnimationFrame(renderCallBack);   
            }
        };

        count = 0;

        if(requestId !== null){
            window.cancelAnimationFrame(requestId);
        }

        requestId = window.requestAnimationFrame(renderCallBack);
    }

    function changeCanvas(){
        var wrapElems = document.querySelectorAll('.' + channlistClass);
        var getRatio = function(classList){
            var ratio = [];
            for(var i = 0, ii = classList.length; i < ii; i++){
                var self = classList[i];
                if(self.indexOf('ratio-') !== -1){
                    ratio.push(self.split('-')[1]);
                    ratio.push(self.split('-')[2]);
                    break;
                }
            }

            return ratio;
        };

        for(var i = 0, ii = wrapElems.length; i < ii; i++){
            var self = wrapElems[i];
            var parentNode = self.parentNode;
            var ratio = [];
            var maxWidth = 'none';
            var maxHeight = 'none';

            if(self.clientHeight >= parentNode.clientHeight - 3){
                ratio = getRatio(self.classList);

                maxWidth = (parentNode.clientHeight / ratio[1] * ratio[0]) + 'px';
                maxHeight = '100%';
            }

            if(self.style.maxWidth !== maxWidth){
                self.style.maxWidth = maxWidth;
            }

            if(self.style.maxHeight !== maxHeight){
                self.style.maxHeight = maxHeight;   
            }
        }   
    }

    setTimeout(changeCanvas);
});