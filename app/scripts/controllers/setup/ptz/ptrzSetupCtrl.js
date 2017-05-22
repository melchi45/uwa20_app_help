kindFramework.controller('ptrzSetupCtrl', function ($scope, $location, $uibModal, $timeout, $translate, SunapiClient, Attributes, COMMONUtils, $q, UniversialManagerService)
{
    "use strict";

    var mAttr = Attributes.get();

    function showVideo(){
        var getData = {
            Channel: UniversialManagerService.getChannelId()
        };

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
            function (response) {
                var viewerWidth = 640;
                var viewerHeight = 360;
                var maxWidth = mAttr.MaxROICoordinateX;
                var maxHeight = mAttr.MaxROICoordinateY;
                var rotate = response.data.Flip[0].Rotate;
                var flip = response.data.Flip[0].VerticalFlipEnable;
                var mirror = response.data.Flip[0].HorizontalFlipEnable;
                var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

                $scope.videoinfo = {
                    width: viewerWidth,
                    height: viewerHeight,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    flip: flip,
                    mirror: mirror,
                    support_ptz: false,
                    rotate: rotate,
                    adjust: adjust,
                    currentPage: 'TamperingDetection',
                    channelId: UniversialManagerService.getChannelId()
                };
                $scope.ptzinfo = {
                    type: 'PTRZ'
                };

            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function getAttributes()
    {

    }

    function view()
    {
        var promises = [];

        promises.push(showVideo);

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                $("#ptrzsetuppage").show();
            },
            function(errorData){

            }
        );
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes();
            view();
        }
    })();

});


        