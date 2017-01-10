/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('simpleFocusCtrl', function ($scope, SunapiClient, Attributes, $timeout, COMMONUtils, sketchbookService, $q) {
    "use strict";

    $scope.FastAutoFocusDefined = true;
    $scope.ZoomOptionsDefined = true;
    $scope.FastAutoFocus = true;

    $scope.PageData = {};

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);

    function getAttributes() {
        var defer = $q.defer();
        if (mAttr.SimpleFocusOptions !== undefined) {
            $scope.SimpleFocusOptions = mAttr.SimpleFocusOptions;
            $scope.SimpleZoomOptions = mAttr.SimpleZoomOptions;
            $scope.FastAutoFocusEnable = mAttr.FastAutoFocusEnable;
            if (typeof $scope.FastAutoFocusEnable === 'undefined') {
                $scope.FastAutoFocusDefined = false;
            }
            if (typeof $scope.SimpleZoomOptions === 'undefined') {
                $scope.ZoomOptionsDefined = false;
            }
            $scope.FocusModeOptions = mAttr.FocusModeOptions;
        }
        
        defer.resolve("success");
        return defer.promise;
    }

    $scope.isSupportedFocusMode = function (mode) {
        var retVal = false;

        if ($scope.FocusModeOptions !== undefined) {
            if ($scope.FocusModeOptions.indexOf(mode) !== -1) {
                return true;
            }
        }

        return retVal;
    };

    getAttributes();


    function manualFocus(level) {
        var setData = {};

        setData.Focus = level;

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function manualZoom(level) {
        var setData = {};

        setData.Zoom = level;

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function focusMode(mode) {
        var setData = {};

        setData.Mode = mode;
        var coordi = sketchbookService.get();
        if(coordi[0].isSet){
            setData.FocusAreaCoordinate = coordi[0].x1 + "," + coordi[0].y1 + "," + coordi[0].x2 + "," + coordi[0].y2;
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }



    function SaveFAFSettings() {
        var setData = {};
        setData.FastAutoFocus = $scope.FastAutoFocus;
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
            function (response) {
                view();
            },
            function (errorData) {
                view();
                console.log(errorData);
            }, '', true);
    }



    function setFastAutoFocus() {
        COMMONUtils.ApplyConfirmation(SaveFAFSettings);
    }

    function focusView(){
        var jData;
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=view', jData,
            function (response) {
                $scope.PageData = response.data;
                $scope.FastAutoFocus = response.data.Focus[0].FastAutoFocus;
            },
            function (errorData) {}, '', true);
    }

    function view() {
        var promises = [];

        promises.push(focusView);

        $q.seqAll(promises).then(
            function(){
        $scope.pageLoaded = true;
                showVideo().finally(function(){
        $("#simplefocuspage").show();
                });
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    function showVideo(){
        var getData = {};
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
                    adjust: adjust
                };

                $scope.coordinates = new Array(1);
                $scope.coordinates[0] = {isSet: false, x1: 0, y1: 0, x2: 0,y2: 0};

                $scope.sketchinfo = {
                    workType: "simpleFocus",
                    shape: 0,
                    maxNumber: 1,
                    modalId: null
                };                
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);                    
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().finally(function(){
                try{
                    Attributes.getAttributeSection().then(function(){
                        console.log("Attributes.getAttributeSection()");
                        mAttr = Attributes.get();
                        view();
                    });
                }catch(e){
                    view();
                }
            });
        }
    })();

    $scope.manualFocus = manualFocus;
    $scope.manualZoom = manualZoom;
    $scope.focusMode = focusMode;
    $scope.setFastAutoFocus = setFastAutoFocus;

});
