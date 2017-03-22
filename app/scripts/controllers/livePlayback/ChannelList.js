kindFramework.controller('ChannelListCtrl', function($scope, $timeout,  $rootScope, 
    kindStreamInterface, Attributes, SunapiClient, ConnectionSettingService) {
    "use strict";

    var channlistClass = 'channellist-video-wrapper';
    var count = 0;
    var requestId = null;
    var sunapiAttributes = Attributes.get()
    var videoMode = "video";

    window.addEventListener('resize', resizeHandle);

    $scope.$on("$viewContentLoaded", function() {
        var section = $('#channellist-containner');
        for (var i = 0; i < sunapiAttributes.MaxChannel; i++ ) {
            var figure = document.createElement('figure');
            var div = document.createElement('div');
            var videoElement = document.createElement(videoMode);

            $(div).addClass('channellist-video-wrapper ratio-16-9');
            $(videoElement).attr('id', "live" + videoMode + i);
            $(videoElement).attr('kind-channel-id', i);
            $(section).append($(figure).append($(div).append(videoElement)));
        }	        

        getVideoProfile();
    });
    
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

    var getVideoProfile = function() {
        SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
            function (response) {
                for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
                    var MultiDirectionProfile = response.data.VideoProfiles[i].Profiles[1];
                    MultiDirectionProfile.ChannelId = i;
                    var playerData = ConnectionSettingService.getPlayerData('live', MultiDirectionProfile, timeCallback, errorCallback, closeCallback, "video");
                    playerData.device.channelId = i;
                    kindStreamInterface.init(playerData, SunapiClient);
                    kindStreamInterface.changeStreamInfo(playerData);
                }
            },
            function (errorData) {
                console.log("getVideoProfile Error msg : " + errorData);
        },'', true);
    };

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

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
        $state.go('uni.channel');
    }, $scope);

    function timeCallback(e) {
        console.log("timeCallback msg =", e);
    }

    function errorCallback(e) {
        console.log("errorCallback msg =", e);
    }

    function closeCallback(e) {
        console.log("closeCallback msg =", e);
    }

    setTimeout(changeCanvas);
});