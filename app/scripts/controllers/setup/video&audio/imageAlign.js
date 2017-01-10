kindFramework.controller('imageAlignCtrl', function ($scope, $timeout, SunapiClient, Attributes, COMMONUtils, $translate, ModalManagerService, $q) {
    "use strict";

    var mAttr = Attributes.get();
    var pageData = {};

    $scope.videoinfo = {
        width: 640,
        height: 360,
        maxWidth: mAttr.MaxROICoordinateX,
        maxHeight: mAttr.MaxROICoordinateY,
        flip: null,
        mirror: null,
        support_ptz: null,
        rotate: null
    };

    $scope.sensorIds = [0,1,2,3];
    $scope.selectedSensorId = $scope.sensorIds[0];

    $scope.selectSensorId = function(sensorId){
        $scope.selectedSensorId = sensorId;
    };

    $scope.resetAll = function(){
        var mode = 'Reset';
        controlImageAlign(mode, false, false, false);
    };

    var leftButton = 'glyphicon glyphicon-chevron-left';
    var rightButton = 'glyphicon glyphicon-chevron-right';
    var upButton = 'glyphicon glyphicon-chevron-up';
    var downButton = 'glyphicon glyphicon-chevron-down';

    $scope.pannelButtons = {
        xAxis: [
            {
                btnCls: 'pannel-yaxis-fast-left',
                clickCallback: function(){
                    moveImageAlign(false, -10);
                },
                iconCls: [
                    leftButton,
                    leftButton
                ]
            },
            {
                btnCls: 'pannel-yaxis-left',
                clickCallback: function(){
                    moveImageAlign(false, -1);
                },
                iconCls: [
                    leftButton
                ]
            },
            {
                btnCls: 'pannel-yaxis-fast-right',
                clickCallback: function(){
                    moveImageAlign(false, 10);
                },
                iconCls: [
                    rightButton,
                    rightButton
                ]
            },
            {
                btnCls: 'pannel-yaxis-right',
                clickCallback: function(){
                    moveImageAlign(false, 1);
                },
                iconCls: [
                    rightButton
                ]
            }
        ],
        yAxis: [
            {
                btnCls: 'pannel-xaxis-fast-top',
                clickCallback: function(){
                    moveImageAlign(10, false);
                },
                iconCls: [
                    upButton,
                    upButton
                ]
            },
            {
                btnCls: 'pannel-xaxis-top',
                clickCallback: function(){
                    moveImageAlign(1, false);
                },
                iconCls: [
                    upButton
                ]
            },            
            {
                btnCls: 'pannel-xaxis-reset',
                clickCallback: function(){
                    var mode = 'Reset';
                    var sensorId = $scope.selectedSensorId;

                    controlImageAlign(mode, sensorId, false, false);
                },
                iconCls: [
                    'tui tui-ch-playback-reset'
                ]
            },
            {
                btnCls: 'pannel-xaxis-down',
                clickCallback: function(){
                    moveImageAlign(-1, false);
                },
                iconCls: [
                    downButton
                ]
            },
            {
                btnCls: 'pannel-xaxis-fast-down',
                clickCallback: function(){
                    moveImageAlign(-10, false);
                },
                iconCls: [
                    downButton,
                    downButton
                ]
            }
        ]
    };

    function moveImageAlign(vertical, horizontal){
        var mode = 'Move';
        var sensorId = $scope.selectedSensorId;

        controlImageAlign(mode, sensorId, vertical, horizontal);
    }

    var controlLocking = false;

    function controlImageAlign(mode, sensorId, vertical, horizontal){        
        if(controlLocking === true) return;
        controlLocking = true;

        var reqData = {};

        if(mode !== false){
            reqData.Mode = mode;
        }

        if(sensorId !== false){
            reqData.SensorID = sensorId;
        }

        if(vertical !== false){
            reqData.Vertical = vertical;
        }

        if(horizontal !== false){
            reqData.Horizontal = horizontal;
        }

        return SunapiClient.get(
            '/stw-cgi/image.cgi?msubmenu=imagealignment&action=control&Channel=0',
            reqData,
            function (response) {
                controlLocking = false;
            },
            function (errorData) {
                if(errorData.toLowerCase() !== "no response"){
                    console.log(errorData);   
                }
                controlLocking = false;
            }, 
            '', 
            true
        );
    };

    function getAttributes() {
        /*if (mAttr.BaudRateOptions !== undefined) {
            $scope.BaudRateOptions = mAttr.BaudRateOptions;
        }
        if (mAttr.ParityBitOptions !== undefined) {
            $scope.ParityBitOptions = mAttr.ParityBitOptions;
        }
        if (mAttr.StopBitOptions !== undefined) {
            $scope.StopBitOptions = mAttr.StopBitOptions;
        }
        if (mAttr.DataBitOptions !== undefined) {
            $scope.DataBitOptions = mAttr.DataBitOptions;
        }
        if (mAttr.ExternalPTZModel !== undefined) {
            $scope.ExternalPTZModel = mAttr.ExternalPTZModel;
        }

        if (mAttr.PTZModel !== undefined) {
            $scope.PTZModel = mAttr.PTZModel;
        }

        if (mAttr.PresetNameMaxLen !== undefined) {
            $scope.PresetNameMaxLen = parseInt(mAttr.PresetNameMaxLen);
        }*/

    }


    /*function set() {
    }*/

    function view() {
        getAttributes();
        $scope.pageLoaded = true;
        $timeout(showVideo);
    }

    function showVideo() {
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

                $scope.ptzinfo = {
                    autoOpen: false,
                    type: 'none'
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
            view();
        }
    })();

    // $scope.submit = set;
    $scope.view = view;
});
