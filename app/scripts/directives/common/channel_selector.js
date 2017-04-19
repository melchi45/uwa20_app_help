/**
 * [View]
 * <channel-selector></channel-selector>
 *
 * [Controller]
 * Channel 클릭 이벤트는 "channelSelector:selectChannel"를 통해 전달 받음.
 * Channel 변경 요청은
 * $rootScope.$emit('channelSelector:changeChannel', <Channel Index>);를 통해서 수정
 *
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    $rootScope.$emit('channelSelector:changeChannel', index);
 * }, $scope);
 *
 * Channel Selector Mount 확인
 * $rootScope.$saveOn("channelSelector:mounted", function(){
 *    //Mounted
 * }, $scope);
 */
kindFramework.directive('channelSelector', function($rootScope) {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/common/directives/channel_selector.html',
        link: function(scope, element, attrs){
            var elem = element;

            scope.channelSelector = {
                selectedChannel: '',
                selectChannel: function(index){
                    $rootScope.$emit("channelSelector:selectChannel", index);
                }
            };

            $rootScope.$saveOn('channelSelector:changeChannel', function(event, index){
                elem.find("button").removeClass('active');
                elem.find(" > li:nth-of-type(" + (index + 2) + ") > button").addClass('active');

                $rootScope.$emit("channelSelector:changedChannel", index);
            }, scope);

            $rootScope.$saveOn('channelSelector:off', function(event){
                elem.find("button").attr("disabled", true);
            }, scope);

            $rootScope.$saveOn('channelSelector:on', function(event){
                elem.find("button").removeAttr("disabled");
            }, scope);

            setTimeout(function(){
                $rootScope.$emit('channelSelector:mounted', true);
            });
        }
    };
});

/**
 * Live, Playback 은 채널 선택 시 자동으로 changeChannel이 실행 됨.
 * 
 * [View]
 * 1. 기본 사용방법
 * <live-playback-channel-selector>
 * </live-playback-channel-selector>
 *
 * 2. Quad view 버튼 사용시
 * <live-playback-channel-selector use-quad-view="true">
 * </live-playback-channel-selector>
 *
 * [Controller]
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    console.log(index);
 * }, $scope);
 *
 * $rootScope.$saveOn("channelSelector:changeQuadView", function(event){
 *    //Go to Quad mode
 * }, $scope);
 */
kindFramework.directive('livePlaybackChannelSelector', function($rootScope, UniversialManagerService) {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/livePlayback/directives/live-playback-channel-selector.html',
        link: function(scope, element, attrs){
            scope.livePlaybackChannelSelector = {
                useQuadView: attrs.useQuadView === 'true',
                changeQuadView: function(){
                    $rootScope.$emit("channelSelector:changeQuadView", true);
                }
            };

            $rootScope.$saveOn('channelSelector:mounted', function(event, index){
                try {
                    $rootScope.$emit('channelSelector:changeChannel', UniversialManagerService.getChannelId());   
                }catch(e){
                    $rootScope.$emit('channelSelector:changeChannel', 0);
                }
            }, scope);

            $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
                $rootScope.$emit('channelSelector:changeChannel', index);
            }, scope);
        }
    };
});


/**
 * [View]
 * 1. 기본 사용 방법
 * <setup-channel-selector>
 * </setup-channel-selector>
 *
 * 2. info 버튼 사용시 use-info="true" 를 추가 하시면 됩니다.
 * <setup-channel-selector use-info="true">
 * </setup-channel-selector>
 *
 * 3. 데이터 변경 체크가 필요할 경우 use-confirm을 true로 설정
 * $rootScope.$emit('channelSelector:changeChannel', <Channel Index>)를 통해서
 * Channel 변경을 해줘야 함.
 * <setup-channel-selector use-confirm="true">
 * </setup-channel-selector>
 *
 * [Controller]
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    console.log(index);
 * }, $scope);
 *
 * $rootScope.$saveOn("channelSelector:showInfo", function(event){
 *    //Open popup
 * }, $scope);
 */
kindFramework.directive('setupChannelSelector', function($rootScope, SunapiClient){
    "use strict";

    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/setup/common/setup_channel_selector.html',
        link: function(scope, element, attrs){
            var defaultChannel = 0;

            scope.setupChannelSelector = {
                useInfo: attrs.useInfo === 'true',
                ProfileData: "",
                showInfo: function(){
                    $rootScope.$emit("channelSelector:showInfo", true);
                }
            };

            if(attrs.useConfirm !== "true"){
                $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
                    $rootScope.$emit('channelSelector:changeChannel', index);
                }, scope);
            }

            $rootScope.$saveOn('channelSelector:mounted', function(event, index){
                $rootScope.$emit('channelSelector:changeChannel', defaultChannel);
            }, scope);
        }
    };
});