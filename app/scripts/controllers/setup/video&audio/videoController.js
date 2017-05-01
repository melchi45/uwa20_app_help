/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('videoCtrl', function ($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, sketchbookService, $uibModal, $uibModalStack, $q, $translate, $rootScope, ModalManagerService, UniversialManagerService) {
    "use strict";

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
    var pageData = {};
    $scope.SelectedChannel = 0;
    $scope.PrivacyMaskListCheck = false;
    $scope.PrivacyMaskSelected = null;
    $scope.DefaultSelectedData = null;



    var disValue = null;
    var doNotMoveFunction = false;

    $scope.isMultiChannel = false;
    $scope.targetChannel = UniversialManagerService.getChannelId();

    $scope.infoTableData = [{},{},{},{}];

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.getDrawDots = function (Option, num) {
        return COMMONUtils.getDrawDots(Option, num);
    };

    var currentChannel = 0;

    function getPrivacyInfoData() {
        
        var getData = {};

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=view', getData,
            function (response) {
                
                var privacyMasks = response.data.PrivacyMask;

                for(var i = 0; i < privacyMasks.length; i++) {

                    var privacyMask = privacyMasks[i];

                    if(privacyMask.Masks !== undefined && privacyMask.Masks.length > 0) {
                        $scope.infoTableData[i].privacyMask = 'On';
                    } else {
                        $scope.infoTableData[i].privacyMask = 'Off';
                    }
                }
            },
            function (errorData) {
                disValue = false;
                console.log(errorData);                
            },'',true);
    }

    function getFlipInfoData() {

        var getData = {};

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
            function (response) {
                
                var flips = response.data.Flip;

                for(var i = 0; i < flips.length; i ++) {
                    if(flips[i].VerticalFlipEnable) {
                        $scope.infoTableData[i].flip = 'On';
                    } else {
                        $scope.infoTableData[i].flip = 'Off';
                    }
                    
                    if(flips[i].HorizontalFlipEnable) {
                        $scope.infoTableData[i].mirror = 'On';
                    } else {
                        $scope.infoTableData[i].mirror = 'Off';
                    }
                    
                    $scope.infoTableData[i].hallwayView = flips[i].Rotate;
                }
            },
            function (errorData) {
                console.log(errorData);
            },'',true);
    }

    function getVideoOutputInfoData() {

        var getData = {};
        
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videooutput&action=view', getData,
            function (response) {
                
                var videoOutputs = response.data.VideoOutputs;

                for(var i = 0; i < videoOutputs.length; i++) {
                    if(videoOutputs[i].Enable) {
                        $scope.infoTableData[i].videoOutput = videoOutputs[i].Type
                    } else {
                        $scope.infoTableData[i].videoOutput = 'Off';    
                    }
                }
                
            },
            function (errorData) {
                console.log(errorData);
            },'',true);
    }

    function getAttributes() {
        if(mAttr.MaxChannel > 1) {
            $scope.isMultiChannel = true;
        }
        $scope.EnableOptions = mAttr.EnableOptions;
        $scope.VideoTypeOptions = mAttr.VideoTypeOptions;
        $scope.ColorOptions = mAttr.ColorOptions;
        $scope.SensorModeOptions = mAttr.SensorModeOptions;
        $scope.MaxPrivacyMask =  mAttr.MaxPrivacyMask;
        $scope.PrivacyMasGlobalColor = mAttr.PrivacyMasGlobalColor;
        $scope.MaskPatternArray = mAttr.PrivacyMaskPattern;
        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
        $scope.MaxChannel = mAttr.MaxChannel;


        if (mAttr.MaxZoom !== undefined) {
            $scope.MaxZoom = mAttr.MaxZoom.maxValue;
        }
        $scope.RotateOptions = mAttr.RotateOptions;

        if(mAttr.ViewModeIndex !== undefined)
        {
            //Fisheye Features
            $scope.minViewModeIndex = mAttr.ViewModeIndex.minValue;
            $scope.maxViewModeIndex = mAttr.ViewModeIndex.maxValue;
            $scope.cameraPositionList = mAttr.CameraPosition; // "Wall", "Ceiling"
        }
        $scope.privacyMaskDrawType = (mAttr.PrivacyMaskRectangle == '0')? 1 : 0;
    }

    function getMessagePrivacyZoom(){
        var msg = '';
        if (typeof mAttr.MaxZoom !== 'undefined'){
            msg = $translate.instant('lang_msg_privacy_Zoom_variable_magnification').replace('%1', mAttr.MaxZoom.maxValue);
        }
        return msg;
    }
    $scope.getMessagePrivacyZoom = getMessagePrivacyZoom;
    
    function getDisValue() {
        var getData = {};
        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            var getData = {
                    Channel: currentChannel
            };
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', getData,
            function (response) {
                disValue = response.data.ImageEnhancements[0].DISEnable;
            },
            function (errorData) {
                disValue = false;
                console.log(errorData);                
            },'',true);
    }

    function getZoomValue(){
        var deferred = $q.defer();
        if(mAttr.PTZModel || mAttr.ZoomOnlyModel){
            var getData = {};
            if($scope.isMultiChannel) {
                var getData = {
                        Channel: currentChannel
                };
            }
            SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=query&action=view&Query=Zoom', getData,
                function (response) {
                    var resValue;
                    try {
                        resValue = response.data.Query[0].Zoom;
                    } catch (e) {
                    }
                    if(resValue){
                        deferred.resolve(resValue);
                    } else {
                        deferred.resolve(1);  
                    }
                },
                function (errorData) {
                    console.log(errorData);
                }
            ,'',true);
        } else {
            deferred.resolve(1);
        }
        return deferred.promise;
    }

    function videoOutputView() {
        var getData = {};
        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            var getData = {
                    Channel: currentChannel
            };
        }
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videooutput&action=view', getData,
            function (response) {
                $scope.VideoOutputs = response.data.VideoOutputs;
                pageData.VideoOutputs = angular.copy($scope.VideoOutputs);
            },
            function (errorData) {
                console.log(errorData);
            },'',true);
    }

    function flipView() {
        var getData = {};
        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            var getData = {
                    Channel: currentChannel
            };
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
            function (response) {
                var FlipRadioValue;

                $scope.DefaultSelectedData = response.data.Flip;
                $scope.Flip = response.data.Flip;
                pageData.Flip = angular.copy($scope.Flip);

                // if( typeof( $scope.DefaultSelectedData ) != "undefined" ) {
                //     $.each( $scope.DefaultSelectedData[0], function ( index, element ) {
                //         console.log()
                //     });
                // }

            },
            function (errorData) {
                console.log(errorData);
            },'',true);

    }

    function videoSourceView() {
        var getData = {};
        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            var getData = {
                    Channel: currentChannel
            };
        }
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', getData,
            function (response) {
                $scope.VideoSources = response.data.VideoSources;
                pageData.VideoSources = angular.copy($scope.VideoSources);
            },
            function (errorData) {
                console.log(errorData);
            },'',true);

    }

    function fisheyeSetupView() {
        var getData = {};
        if($scope.isMultiChannel) {
            var getData = {
                    Channel: currentChannel
            };
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=view', getData,
            function (response) {
                $scope.viewModes = response.data.Viewmodes[0];
                pageData.viewModes = angular.copy($scope.viewModes);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    var dummyIncValue = 0;

    var updatePrivacyMaskCoordinate = function(index) {
        if (!(index == null)) {
            if ($scope.PrivacyMask[$scope.SelectedChannel].Masks != undefined) {
                for (var i = 0; i < $scope.PrivacyMask[$scope.SelectedChannel].Masks.length; i++) {
                    if ($scope.PrivacyMask[$scope.SelectedChannel].Masks[i].MaskIndex == index) {
                        if(mAttr.PTZModel == true){
                            var setData = {};
                            setData["Mode"] = "Move";
                            setData["MaskIndex"] = index;
                            if($scope.isMultiChannel) {
                                var currentChannel = UniversialManagerService.getChannelId();
                                setData.Channel = currentChannel;
                            }
                            SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=control', setData,
                            function (response) {
                                sketchbookService.set({name:"", color:"", x1:0, y1:0, x2:0, y2:0, selectedMask:true});                                
                            },
                            function (errorData) {
                                console.log(errorData);
                            },'',true);
                        } else if(mAttr.ZoomOnlyModel == true){
                            sketchbookService.set({name:"", color:"", x1:0, y1:0, x2:0, y2:0, selectedMask:true});
                        } else {
                            var maskCoor = $scope.PrivacyMask[$scope.SelectedChannel].Masks[i].MaskCoordinate;
                            $scope.coordinates.x1 = maskCoor[0].x;
                            $scope.coordinates.y1 = maskCoor[0].y;
                            $scope.coordinates.x2 = maskCoor[1].x;
                            $scope.coordinates.y2 = maskCoor[1].y;
                            if($scope.sketchinfo.shape == 1){
                                $scope.coordinates.x3 = maskCoor[2].x;
                                $scope.coordinates.y3 = maskCoor[2].y;
                                $scope.coordinates.x4 = maskCoor[3].x;
                                $scope.coordinates.y4 = maskCoor[3].y;
                            }
                            $scope.coordinates.selectedMask = true;

                            sketchbookService.set($scope.coordinates);
                        }
                    }
                }
            }
        }
        else {
            if($scope.sketchinfo.shape == 0){
                sketchbookService.set({name:"", color:"", x1:0, y1:0, x2:0, y2:0, selectedMask:true});
            }else{
                sketchbookService.set({name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0, selectedMask:true});
            }
        }
    };

    function privacyAreaView(inputIndex) {
        var getData = {};
        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            var getData = {
                    Channel: currentChannel
            };
        }
        var prevSelectedMaskCoordinate = null;
        if( $scope.PrivacyMaskSelected !== null ) {
            if($scope.PrivacyMask[$scope.SelectedChannel].Masks !== undefined ) {
                for ( var i=0 ; i< $scope.PrivacyMask[$scope.SelectedChannel].Masks.length; i++ ) {
                    if( $scope.PrivacyMaskSelected === $scope.PrivacyMask[$scope.SelectedChannel].Masks[i].MaskIndex) {
                        prevSelectedMaskCoordinate = $scope.PrivacyMask[$scope.SelectedChannel].Masks[i].MaskCoordinate;
                    }
                }
            }
        }

        if(dummyIncValue > 1000)
        {
            dummyIncValue = 0;
        }

        var sunapiURL = '/stw-cgi/image.cgi?msubmenu=privacy&action=view&MaskIndex=' + (dummyIncValue++);

        return SunapiClient.get(sunapiURL, getData,
            function (response) {
                $scope.PrivacyMask = response.data.PrivacyMask;
                pageData.PrivacyMask = angular.copy($scope.PrivacyMask);

                if((mAttr.PTZModel || mAttr.ZoomOnlyModel) && $scope.PrivacyMask[$scope.SelectedChannel].Masks != undefined /*&& $scope.PrivacyMask[$scope.SelectedChannel].Enable*/){
                    for(var i = 0; i < $scope.PrivacyMask[$scope.SelectedChannel].Masks.length; i++){
                        if($scope.PrivacyMask[$scope.SelectedChannel].Masks[i].ZoomThresholdEnable == true){
                            $scope.PrivacyMask[$scope.SelectedChannel].Masks[i].ZoomThresholdEnable = "["+$translate.instant('lang_zoom')+"]";
                        } else {
                            $scope.PrivacyMask[$scope.SelectedChannel].Masks[i].ZoomThresholdEnable = "";
                        }
                    }
                }

                if ($scope.PrivacyMask[$scope.SelectedChannel].Masks != undefined && $scope.PrivacyMask[$scope.SelectedChannel].Enable) {
                    $scope.$apply(function(){
                        $scope.PrivacyMaskListCheck = true;
                        if( $scope.PrivacyMaskSelected !== $scope.PrivacyMask[$scope.SelectedChannel].Masks[0].MaskIndex) {
                            if(inputIndex != undefined && (mAttr.PTZModel == true || mAttr.ZoomOnlyModel == true)){
                                $scope.PrivacyMaskSelected = inputIndex;
                            } else {
                                $scope.PrivacyMaskSelected = $scope.PTZModel? null : $scope.PrivacyMask[$scope.SelectedChannel].Masks[0].MaskIndex;
                            }
                        }
                        else if( prevSelectedMaskCoordinate !== $scope.PrivacyMask[$scope.SelectedChannel].Masks[0].MaskCoordinate) {
                            if(mAttr.PTZModel || mAttr.ZoomOnlyModel){
                                $scope.PrivacyMaskSelected = inputIndex;
                                if(!doNotMoveFunction)updatePrivacyMaskCoordinate(inputIndex);
                            } else {
                                updatePrivacyMaskCoordinate($scope.PrivacyMaskSelected);
                            }
                        }
                    });
                } else {
                    $scope.$apply(function(){
                        $scope.PrivacyMaskListCheck = false;
                        $scope.PrivacyMaskSelected = null;
                    });
                }
            },
            function (errorData) {
                alert(" [View] " + errorData);
            },'',true);

    }

    $scope.$on('<app/scripts/directives>::<updateCoordinates>', function (args, data)
    {
        if(mAttr.PTZModel) {
            var coordi = sketchbookService.get();
            var setData = {};
            setData["Mode"] = "Start";
            setData["MaskCoordinate"] = coordi.x1 + "," + coordi.y1 + "," + coordi.x2 + "," + coordi.y2;

            if($scope.isMultiChannel) {
                var currentChannel = UniversialManagerService.getChannelId();
                setData.Channel = currentChannel;
            }
            SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=control', setData,
                function (response) {

                    $scope.coordinates.x1 = response.data.PrivacyMask[0].MaskCoordinate[0].x;
                    $scope.coordinates.y1 = response.data.PrivacyMask[0].MaskCoordinate[0].y;
                    $scope.coordinates.x2 = response.data.PrivacyMask[0].MaskCoordinate[1].x;
                    $scope.coordinates.y2 = response.data.PrivacyMask[0].MaskCoordinate[1].y;
                    $scope.coordinates.selectedMask = true;

                    sketchbookService.set($scope.coordinates);
                },
                function (errorData) {
                console.log(errorData);
            },'',true);
        }
    });

    $scope.$on('<app/scripts/directives>::<privacyUpdate>', function (args, data)
    {
        if (data === null) {    //privacy setting cancel
            $scope.PrivacyMaskSelected = 0;
            privacyAreaView();
        } else {
            var setData = {};

            if ($scope.PrivacyMask[$scope.SelectedChannel].Masks == undefined) {
                setData["MaskIndex"] = 1;
            } else {
                //Make do not send SUNAPI call, if there are max items.
                //console.log("Item Cnt = " + $scope.sketchinfo.currentNumber + " , Max = " + $scope.sketchinfo.maxNumber );
                if ($scope.sketchinfo.currentNumber === $scope.sketchinfo.maxNumber ) {
                    return;
                }
                for (var i = 1; i <= $scope.PrivacyMask[$scope.SelectedChannel].Masks.length; i++) {
                    if ($scope.PrivacyMask[$scope.SelectedChannel].Masks[(i - 1)].MaskIndex != i) {
                        setData["MaskIndex"] = i;
                        break;
                    } else if ($scope.PrivacyMask[$scope.SelectedChannel].Masks.length == i) {
                        setData["MaskIndex"] = (i + 1);
                    }
                }
            }

            ($scope.PrivacyMask[$scope.SelectedChannel].Masks == undefined ?
                                     1 : $scope.PrivacyMask[$scope.SelectedChannel].Masks.length + 1);
            data.name = (data.name == undefined ? '' : data.name);
            setData["MaskName"] = encodeURIComponent(data.name);

            if($scope.PrivacyMasGlobalColor === false){
                setData["MaskColor"] = data.color;
            }

            setData["MaskCoordinate"] = data.position;

            if($scope.isMultiChannel) {
                var currentChannel = UniversialManagerService.getChannelId();
                setData.Channel = currentChannel;
            }

            SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=add', setData,
            function (response) {
                if((mAttr.PTZModel || mAttr.ZoomOnlyModel) && data.thresholdEnable){
                    var modalInstance2 = $uibModal.open({
                        templateUrl: "privacyPopup2.html",
                        backdrop: true,
                        controller: ['$scope', '$uibModalInstance', '$timeout', 'sketchbookService', '$interval', 'CAMERA_STATUS', 'UniversialManagerService', 'SunapiClient', function(scope, $uibModalInstance, $timeout, sketchbookService, $interval, CAMERA_STATUS, UniversialManagerService,SunapiClient){
                            var ptzJogTimer = null;
                            var isJogUpdating = false;
                            var isPtzControlStart = false;

                            var ptzStop = function(){
                                if (ptzJogTimer !== null) {
                                    $interval.cancel(ptzJogTimer);
                                    ptzJogTimer = null;
                                }
                                if(!isPtzControlStart) return;
                                var setData = {};
                                setData.Channel = 0;
                                setData.OperationType = 'All';
                                isPtzControlStart = false;
                                SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control', setData,
                                    function (response) {
                                    },
                                    function (errorData) {
                                    },'', true);
                            };

                            scope.ptzControlZoom = function(value){
                                if(value=='Stop'){
                                    if (UniversialManagerService.getDigitalPTZ() !== CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING) {
                                        ptzStop();
                                    }
                                }else{
                                    var setData = {};
                                    setData.Channel = 0;
                                    setData.NormalizedSpeed = 'True';
                                    setData.Zoom = value;

                                    isPtzControlStart = true;
                                    SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
                                        function (response) {
                                        },
                                        function (errorData) {
                                        },'', true);
                                }
                            };

                            var makeJogTimer = function() {
                                ptzJogTimer = $interval(function() {
                                    isJogUpdating = false;
                                }, 100);
                            };
                            (function wait(){
                                if ($("#ptz-privacy-zoom-slider").length == 0) {
                                    $timeout(function () {
                                        wait();
                                    }, 100);
                                } else {
                                    $("#ptz-privacy-zoom-slider").slider({
                                        orientation: "horizontal",
                                        min: -100,
                                        max: 100,
                                        value: 0,
                                        revert: true,
                                        slide: function(event, ui){
                                            if(ptzJogTimer === null) {
                                                makeJogTimer();
                                            }

                                            if(isJogUpdating === false) {
                                                var setData = {};
                                                setData.Channel = 0;
                                                setData.NormalizedSpeed = 'True';
                                                setData.Zoom = ui.value;

                                                isPtzControlStart = true;
                                                SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
                                                    function (response) {
                                                    },
                                                    function (errorData) {
                                                    },'', true);
                                                isJogUpdating = true;
                                            }
                                        },
                                        stop: function(){
                                            $( "#ptz-privacy-zoom-slider" ).slider('value', 0);
                                            ptzStop();
                                        }
                                    });
                                }
                            })();
                            scope.ok = function() {
                                getZoomValue().then(function(returnZoomValue){
                                    if(returnZoomValue > $scope.MaxZoom){
                                        var modalInstance3 = $uibModal.open({
                                            templateUrl: "privacyPopup3.html",
                                            backdrop: false,
                                            controller: ['$scope', '$uibModalInstance', '$timeout', 'Attributes', 'COMMONUtils', 'sketchbookService', function($scope, $uibModalInstance, $timeout, Attributes, COMMONUtils, sketchbookService){
                                                $scope.message = getMessagePrivacyZoom();
                                                $scope.ok = function() {
                                                    var coordinates = {};
                                                    coordinates = {name:"", color:"", selectedMask: true, x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                                                    sketchbookService.set(coordinates);
                                                    $uibModalInstance.dismiss();
                                                };
                                                $timeout(function(){
                                                    var privacyDialog = $("#privacy-popup-3");
                                                    var width = (privacyDialog.parent().width() + 30);
                                                    var height = (privacyDialog.parent().height() + 30);
                                                    privacyDialog
                                                    .parents(".modal")
                                                    .draggable()
                                                    .css({
                                                        width: (privacyDialog.width() + 30) + "px",
                                                        height: (privacyDialog.height() + 30) + "px",
                                                        top: "calc(50% - " + (height/2) + "px)",
                                                        left: "calc(50% - " + (width/2) + "px)"
                                                    })
                                                        .find(".modal-dialog")
                                                        .css({
                                                            margin: 0
                                                        });
                                                });
                                            }]
                                        });
                                        modalInstance3.result.finally(
                                            function() {
                                                $("[type='radio'][name='VideoOutput']").prop("disabled", false);
                                                bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                                            }
                                        );
                                    } else {
                                        var updateData = {};
                                        updateData["MaskIndex"] = setData["MaskIndex"];
                                        updateData["ZoomThresholdEnable"] = data.thresholdEnable;

                                        if($scope.isMultiChannel) {
                                            var currentChannel = UniversialManagerService.getChannelId();
                                            updateData.Channel = currentChannel;
                                        }
                                        SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=update', updateData,
                                        function (response) {
                                            privacyAreaView(setData["MaskIndex"]);
                                            $uibModalInstance.close();
                                        },
                                        function (errorData) {
                                            console.log(errorData);
                                        },'',true);
                                    }
                                });
                            };

                            scope.cancel = function() {
                                $uibModalInstance.dismiss();
                            };

                            $timeout(function(){
                                var privacyDialog = $("#privacy-popup-2");
                                var width = (privacyDialog.parent().width() + 30);
                                var height = (privacyDialog.parent().height() + 30);
                                privacyDialog
                                    .parents(".modal")
                                    .draggable()
                                    .css({
                                        width: (privacyDialog.width() + 30) + "px",
                                        height: (privacyDialog.height() + 30) + "px",
                                        top: "calc(50% - " + (height/2) + "px)",
                                        left: "calc(50% - " + (width/2) + "px)"
                                    })
                                        .find(".modal-dialog")
                                        .css({
                                            margin: 0
                                        });
                            });
                        }]
                    });

                    modalInstance2.result.then(
                        function(){
                            $("[type='radio'][name='VideoOutput']").prop("disabled", false);
                            $scope.coordinates = {};
                            $scope.coordinates = {name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                        }
                        , function(){
                            $scope.deletePrivacy(setData["MaskIndex"]);
                            var coordinates = {};
                            coordinates = {name:"", color:"", selectedMask: true, x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                            sketchbookService.set(coordinates);
                        }
                    );
                }else{
                    doNotMoveFunction = true;
                    $("[type='radio'][name='VideoOutput']").prop("disabled", false);
                    privacyAreaView(setData["MaskIndex"]);
                    $scope.coordinates = {};
                    $scope.coordinates = {name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                }
            },
            function (errorData) {
                console.log(errorData);
            },'',true);

        }
    });

    // $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
    //     currentChannel = index;

    //     $timeout(flipView);
    //     $timeout(videoOutputView);
    //     $timeout(privacyAreaView);

    //     $timeout(flipSet);

        

    // }, $scope);

    $rootScope.$saveOn('channelSelector:showInfo', function(event, response){
        $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/video&audio/modal/ModalVideoSetupInfo.html',
            controller: 'ModalInstanceVideoSetupInfoCtrl',
            resolve: {
                infoTableData: function(){
                    return $scope.infoTableData;
                }
            }
        });
    }, $scope);

    function digitalFlipView() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=view', getData,
            function (response) {
                $scope.PTZSettings = response.data.PTZSettings;
                pageData.PTZSettings = angular.copy($scope.PTZSettings);
            },
            function (errorData) {
                console.log(errorData);
            },'',true);
    }

    function videoSourceSet() {

        var setData = {};

        setData.SensorCaptureFrameRate = pageData.VideoSources[$scope.SelectedChannel].SensorCaptureFrameRate = $scope.VideoSources[$scope.SelectedChannel].SensorCaptureFrameRate;

        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            setData.Channel = currentChannel;
        }
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            },'',true);

    }

    function flipSet() {
        var setData = {},
            ignoredKeys,
            changed = true;

        ignoredKeys = ['Channel'];

        changed = COMMONUtils.fillSetData(setData, $scope.Flip[$scope.SelectedChannel], pageData.Flip[$scope.SelectedChannel],
            ignoredKeys, false);

        if (changed) {
            if($scope.isMultiChannel) {
                var currentChannel = UniversialManagerService.getChannelId();
                setData.Channel = currentChannel;
            }
            return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=set', setData,
                function (response) {
                    COMMONUtils.updatePageData($scope.Flip[$scope.SelectedChannel], pageData.Flip[$scope.SelectedChannel], ignoredKeys);
                },
                function (errorData) {
                    console.log(errorData);
                },'',true);
        }
    }

    function videoOutputSet() {

        var setData = {};

        if (pageData.VideoOutputs[$scope.SelectedChannel].Type !== $scope.VideoOutputs[$scope.SelectedChannel].Type) {
            setData.Type = pageData.VideoOutputs[$scope.SelectedChannel].Type = $scope.VideoOutputs[$scope.SelectedChannel].Type;
        }

        if (pageData.VideoOutputs[$scope.SelectedChannel].Enable !== $scope.VideoOutputs[$scope.SelectedChannel].Enable) {
            setData.Enable = pageData.VideoOutputs[$scope.SelectedChannel].Enable = $scope.VideoOutputs[$scope.SelectedChannel].Enable;
        }

        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            setData.Channel = currentChannel;
        }

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videooutput&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            },'',true);

    }

    function privacyAreaSet() {

        var setData = {};

        setData.Enable = pageData.PrivacyMask[$scope.SelectedChannel].Enable = $scope.PrivacyMask[$scope.SelectedChannel].Enable;

        if ($scope.PrivacyMasGlobalColor === true) {
            setData.CommonMaskColor = pageData.PrivacyMask[$scope.SelectedChannel].CommonMaskColor = $scope.PrivacyMask[$scope.SelectedChannel].CommonMaskColor;
        }
    
        if($scope.PrivacyMask[$scope.SelectedChannel].Enable === true){
            setData.MaskPattern = pageData.PrivacyMask[$scope.SelectedChannel].MaskPattern = $scope.PrivacyMask[$scope.SelectedChannel].MaskPattern;
        } else {
            $scope.PrivacyMask[$scope.SelectedChannel].MaskPattern = pageData.PrivacyMask[$scope.SelectedChannel].MaskPattern;
        }

        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            setData.Channel = currentChannel;
        }

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            },'',true);
    }

    function digitalFlipSet() {

        var setData = {};

        setData.AutoFlipEnable = pageData.PTZSettings[$scope.SelectedChannel].AutoFlipEnable = $scope.PTZSettings[$scope.SelectedChannel].AutoFlipEnable;

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            },'',true);

    }


    function fishEyeSetupSet() {
        var setData = {};

        setData.ViewModeIndex = $scope.viewModes.ViewModeIndex;
        setData.CameraPosition = $scope.viewModes.CameraPosition;

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=set', setData,
            function (response) {
               pageData.viewModes.CameraPosition = $scope.viewModes.CameraPosition;
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);

    }

    $scope.$on("$destroy", function(){
        $uibModalStack.dismissAll();
    });

    $scope.setVideoSetupEnable = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function ()
                {
                    return 'lang_apply_question';
                }
            }
        });

        modalInstance.result.then(
            function (){
                var setData = {};

                if (pageData.PrivacyMask[$scope.SelectedChannel].Enable !== $scope.PrivacyMask[$scope.SelectedChannel].Enable)
                {
                    setData.Enable = $scope.PrivacyMask[$scope.SelectedChannel].Enable;
                }

                if($scope.isMultiChannel) {
                    var currentChannel = UniversialManagerService.getChannelId();
                    setData.Channel = currentChannel;
                }

                return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=set', setData,
                    function (response)
                    {
                        pageData.PrivacyMask[$scope.SelectedChannel].Enable = $scope.PrivacyMask[$scope.SelectedChannel].Enable;
                    },
                    function (errorData)
                    {
                        $scope.PrivacyMask[$scope.SelectedChannel].Enable = angular.copy(pageData.PrivacyMask[$scope.SelectedChannel].Enable);
                        console.log(errorData);
                    }, '', true);
            },
            function ()
            {
                $scope.PrivacyMask[$scope.SelectedChannel].Enable = angular.copy(pageData.PrivacyMask[$scope.SelectedChannel].Enable);
            }
        );
    };

    function view() {
        getAttributes();

        var functionlist = [];

        if($scope.VideoTypeOptions !== undefined)
        {
            functionlist.push(videoOutputView);
        }
//        if($scope.SensorModeOptions !== undefined)
//        {
//            functionlist.push(videoSourceView);
//        }

        functionlist.push(flipView);

        if($scope.MaxPrivacyMask !== undefined && $scope.MaxPrivacyMask > 0)
        {
            functionlist.push(privacyAreaView);
        }

        if ($scope.PTZModel === true) {
            functionlist.push(digitalFlipView);
        }

        if ($scope.cameraPositionList != undefined) {
            functionlist.push(fisheyeSetupView);
        }

        if($scope.isMultiChannel) {
            functionlist.push(getFlipInfoData);
            functionlist.push(getPrivacyInfoData);
            functionlist.push(getVideoOutputInfoData);
        }

        getDisValue();
        
        $q.seqAll(functionlist).then(
            function(){
                runWatcher();

                $scope.pageLoaded = true;
                showVideo();
                $("#videosetuppage").show();
                $rootScope.$emit('changeLoadingBar', false);
                $rootScope.$emit("channelSelector:changeChannel", $scope.targetChannel);
                UniversialManagerService.setChannelId($scope.targetChannel);
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    function set() {
        var tMessage = null;
        var rotateChanged = false;
        var flipChanged = false;
        for (var i = 0 ; i < pageData.Flip.length && i < $scope.Flip.length; i++) {
            if (pageData.Flip[i].Rotate !== $scope.Flip[i].Rotate) {
                rotateChanged = true;
            }
            if (pageData.Flip[i].VerticalFlipEnable !== $scope.Flip[i].VerticalFlipEnable) {
                flipChanged = true;
            }
            if (pageData.Flip[i].HorizontalFlipEnable !== $scope.Flip[i].HorizontalFlipEnable) {
                flipChanged = true;
            }
        }
        if(flipChanged === true && rotateChanged === false) {
            tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva')).replace('%1', $translate.instant('lang_filpMirror'));
        } else if(flipChanged === true && rotateChanged === true) {
            tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva') + ', ' + $translate.instant('lang_faceDetection')).replace('%1', $translate.instant('lang_videosrc'));
        } else if(flipChanged === false && rotateChanged === true) {
            tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva') + ', ' + $translate.instant('lang_faceDetection')).replace('%1', $translate.instant('lang_hallwayView'));
        }
        if(tMessage !== null) {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/setup/common/errorMessage.html',
                controller: 'errorMessageCtrl',
                resolve: {
                    Message: function () {
                        return tMessage;
                    },
                    Header: function () {
                        return 'lang_Confirm';
                    }
                }
            });
            modalInstance.result.then(function() {
                COMMONUtils.ApplyConfirmation(saveSettings);
            },
            function() {
            });
        } else {
            COMMONUtils.ApplyConfirmation(saveSettings);
        }
    }

    function saveSettings() {

        var rotateChanged = false;
        var mountModeChanged = false;
        var functionlist = [];

        if (!angular.equals(pageData.Flip, $scope.Flip)) {
            var i, rotateChanged = false;
            for ( i=0 ; i<pageData.Flip.length && i<$scope.Flip.length ; i++ ) {
                if ( pageData.Flip[i].Rotate !== $scope.Flip[i].Rotate ) {
                    rotateChanged = true;
                }
            }

            functionlist.push(flipSet);
        }
//        if($scope.SensorModeOptions !== undefined)
//        {
//            if (!angular.equals(pageData.VideoSources, $scope.VideoSources)) {
//                functionlist.push(videoSourceSet);
//            }
//        }
        if($scope.VideoTypeOptions !== undefined)
        {
            if (!angular.equals(pageData.VideoOutputs, $scope.VideoOutputs)) {
                 functionlist.push(videoOutputSet);
            }
        }

        if($scope.MaxPrivacyMask !== undefined && $scope.MaxPrivacyMask > 0)
        {
             if (!angular.equals(pageData.PrivacyMask, $scope.PrivacyMask)) {
                functionlist.push(privacyAreaSet);
            }
        }

        if ($scope.PTZModel === true) {
            if (!angular.equals(pageData.PTZSettings, $scope.PTZSettings)) {
                functionlist.push(digitalFlipSet);
            }
        }

        if(functionlist.length > 0){
            $q.seqAll(functionlist).then(
                function() {

                    if ($scope.cameraPositionList !== undefined) {
                        if (!angular.equals(pageData.viewModes, $scope.viewModes)) {
                            COMMONUtils.ShowConfirmation(changeMountMode, 'lang_msg_mountModeChange_Profile', 'md');
                            mountModeChanged = true;
                        }
                    }

                    if (rotateChanged) {
                        var modalInstance = $uibModal.open({
                            templateUrl: 'views/setup/common/errorMessage.html',
                            controller: 'errorMessageCtrl',
                            resolve: {
                                Message: function () {
                                    return 'lang_msg_windowClose';
                                },
                                Header: function () {
                                    return 'lang_Confirm';
                                }
                            }
                        });
                        modalInstance.result.then(COMMONUtils.onLogout, COMMONUtils.onLogout);
                    }
                    UniversialManagerService.setChannelId($scope.targetChannel);
                    view();
                },
                function(errorData){
                }
            );
        }
    }


    function changeMountMode() {
        var fisheyeSetupStatus =  fishEyeSetupSet();
        fisheyeSetupStatus.then(COMMONUtils.onLogout, COMMONUtils.onLogout);
    }

    $scope.deletePrivacy = function(maskIndex) {
        if($scope.PrivacyMaskSelected || maskIndex){
            var setData = {};
            setData["MaskIndex"] = maskIndex? maskIndex : $scope.PrivacyMaskSelected;
            
            if($scope.isMultiChannel) {
                var currentChannel = UniversialManagerService.getChannelId();
                setData.Channel = currentChannel;
            }

            SunapiClient.get('/stw-cgi/image.cgi?msubmenu=privacy&action=remove', setData,
                function (response) {
                    privacyAreaView();
                    $scope.coordinates = {};
                    $scope.coordinates = {name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                    if(!mAttr.PTZModel){
                        sketchbookService.set($scope.coordinates);
                    }
                },
                function (errorData) {
                    console.log(errorData);
                },'',true);
        }
    }

    function runWatcher() {
        //update privacy enable/disable for sketchbook
        $scope.$watch(function() {if(pageData.PrivacyMask != undefined) return pageData.PrivacyMask[$scope.SelectedChannel].Enable;}, function(newVal, oldVal) {
            if(newVal != oldVal){
                if (newVal == true) {
                    var drawType = $scope.privacyMaskDrawType;
                    var drawMax = 0;
                    if(drawType == 0){
                        drawMax = mAttr.PrivacyMaskRectangle;
                    }else{
                        drawMax = mAttr.PrivacyMaskPolygon;
                    }
                    var privacyCount = 0;
                    if($scope.PrivacyMask[$scope.SelectedChannel].Masks !== undefined){
                        $scope.PrivacyMaskListCheck = true;
                        privacyCount = parseInt($scope.PrivacyMask[$scope.SelectedChannel].Masks.length, 10);
                    }

                    $scope.coordinates = {};
                    $scope.coordinates = {name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
                    $scope.sketchinfo = {
                        workType: "privacy",
                        shape: drawType,
                        maxNumber: drawMax,
                        currentNumber: privacyCount,
                        modalId: "privacyPopup.html",
                        disValue: disValue,
                        getZoomValue : getZoomValue,
                        MaxZoomValue : $scope.MaxZoom,
                        message : getMessagePrivacyZoom()
                    };

                    if(privacyCount != 0){
                        $scope.PrivacyMaskSelected = $scope.PrivacyMask[$scope.SelectedChannel].Masks[0].MaskIndex;
                    }
                } else {
                    $scope.PrivacyMaskListCheck = false;
                    $scope.coordinates = null;
                    $scope.sketchinfo = {
                        workType: "privacy",
                        shape: null,
                        maxNumber: null,
                        currentNumber: null,
                        modalId: null
                    };
                }
            }
        });

        $scope.$watch(function(){if($scope.PrivacyMask[$scope.SelectedChannel].Masks != undefined) return $scope.PrivacyMask[$scope.SelectedChannel].Masks.length;}, function(newVal,oldVal){
            if(newVal != oldVal){
                if(newVal == undefined){
                    $scope.sketchinfo.currentNumber = 0;
                }else{
                    var privacyCount = parseInt($scope.PrivacyMask[$scope.SelectedChannel].Masks.length, 10);
                    $scope.sketchinfo.currentNumber = privacyCount;
                }
            }
        });
        //update Flip for sketchbook
        $scope.$watch(function() {if(pageData.Flip != undefined) return pageData.Flip[$scope.SelectedChannel].VerticalFlipEnable;}, function(newVal, oldVal) {
            if(newVal != oldVal && oldVal != undefined){
                privacyAreaView();
                showVideo();
            }

        });
        //update Mirror for sketchbook
        $scope.$watch(function() {if(pageData.Flip != undefined) return pageData.Flip[$scope.SelectedChannel].HorizontalFlipEnable;}, function(newVal, oldVal) {
            if(newVal != oldVal && oldVal != undefined){
                privacyAreaView();
                showVideo();
            }
        });

        $scope.$watch('PrivacyMaskSelected', function(newVal, oldVal) {
            if((mAttr.PTZModel || mAttr.ZoomOnlyModel) && doNotMoveFunction){
                sketchbookService.set({name:"", color:"", x1:0, y1:0, x2:0, y2:0, selectedMask:true});
                doNotMoveFunction = false;
            } else {
                updatePrivacyMaskCoordinate(newVal);
            }
        });
    }

    function showVideo(){
        var viewerWidth = 640;
        var viewerHeight = 360;
        var maxWidth = mAttr.MaxROICoordinateX;
        var maxHeight = mAttr.MaxROICoordinateY;
        var rotate = $scope.Flip[$scope.SelectedChannel].Rotate;
        var flip = $scope.Flip[$scope.SelectedChannel].VerticalFlipEnable;
        var mirror = $scope.Flip[$scope.SelectedChannel].HorizontalFlipEnable;
        var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

        $scope.videoinfo = {
            width: viewerWidth,
            height: viewerHeight,
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            flip: flip,
            mirror: mirror,
            support_ptz: mAttr.PTZModel,
            support_zoomOnly: mAttr.ZoomOnlyModel,
            rotate: rotate,
            adjust: adjust,
            channelId: UniversialManagerService.getChannelId()
        };
        $scope.ptzinfo = {
            type: 'none'
        };

        var drawType = $scope.privacyMaskDrawType;
        var drawMax = 0;
        if(drawType == 0){
            drawMax = mAttr.PrivacyMaskRectangle;
        }else{
            drawMax = mAttr.PrivacyMaskPolygon;
        }

        if (pageData.PrivacyMask[$scope.SelectedChannel].Enable == true) {
            $scope.coordinates = {};
            $scope.coordinates = {name:"", color:"", x1:0, y1:0, x2:0, y2:0, x3:0, y3:0, x4:0, y4:0};
            var privacyCount = 0;
            if($scope.PrivacyMask[$scope.SelectedChannel].Masks !== undefined)
                privacyCount = parseInt($scope.PrivacyMask[$scope.SelectedChannel].Masks.length, 10);

            $scope.sketchinfo = {
                workType: "privacy",
                shape: drawType,
                maxNumber: drawMax,
                currentNumber: privacyCount,
                modalId: "privacyPopup.html",
                disValue: disValue,
                getZoomValue : getZoomValue,
                MaxZoomValue : $scope.MaxZoom,
                message : getMessagePrivacyZoom()
            };
        }else{
            $scope.coordinates = null;
            $scope.sketchinfo = {
                workType: "privacy",
                shape: null,
                maxNumber: null,
                currentNumber: null,
                modalId: null
            };
        }
    }

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        var tMessage = null;
        var rotateChanged = false;
        var flipChanged = false;
        for (var i = 0 ; i < pageData.Flip.length && i < $scope.Flip.length; i++) {
            if (pageData.Flip[i].Rotate !== $scope.Flip[i].Rotate) {
                rotateChanged = true;
            }
            if (pageData.Flip[i].VerticalFlipEnable !== $scope.Flip[i].VerticalFlipEnable) {
                flipChanged = true;
            }
            if (pageData.Flip[i].HorizontalFlipEnable !== $scope.Flip[i].HorizontalFlipEnable) {
                flipChanged = true;
            }
        }

        if(rotateChanged || 
            flipChanged || 
            !angular.equals(pageData.Flip, $scope.Flip) ||
            !angular.equals(pageData.VideoOutputs, $scope.VideoOutputs) ||
            !angular.equals(pageData.PrivacyMask, $scope.PrivacyMask) ||
            ($scope.PTZModel === true && !angular.equals(pageData.PTZSettings, $scope.PTZSettings)))
            {
            COMMONUtils
                .confirmChangeingChannel().then(function() {
                if(flipChanged === true && rotateChanged === false) {
                    tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva')).replace('%1', $translate.instant('lang_filpMirror'));
                } else if(flipChanged === true && rotateChanged === true) {
                    tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva') + ', ' + $translate.instant('lang_faceDetection')).replace('%1', $translate.instant('lang_videosrc'));
                } else if(flipChanged === false && rotateChanged === true) {
                    tMessage = $translate.instant('lang_msg_initialized_video_rotation_changed').replace('[%1]', $translate.instant('lang_menu_iva') + ', ' + $translate.instant('lang_faceDetection')).replace('%1', $translate.instant('lang_hallwayView'));
                }
                if(tMessage !== null) {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'views/setup/common/errorMessage.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function () {
                                return tMessage;
                            },
                            Header: function () {
                                return 'lang_Confirm';
                            }
                        }
                    });
                    modalInstance.result.then(function() {
                        $rootScope.$emit('changeLoadingBar', true);
                        $scope.targetChannel = data;
                        saveSettings();
                    },
                    function() {
                    });
                } else {
                    $rootScope.$emit('changeLoadingBar', true);
                    $scope.targetChannel = data;
                    saveSettings();
                }
            },
            function() {
            });
        } else {
            $rootScope.$emit('changeLoadingBar', true);
            $scope.targetChannel = data;
            UniversialManagerService.setChannelId(data);
            $rootScope.$emit("channelSelector:changeChannel", data);
            view();
        }
    }, $scope);

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

    $scope.submit = set;
    $scope.view = view;
});
