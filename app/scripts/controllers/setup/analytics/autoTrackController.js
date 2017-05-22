kindFramework.controller('autoTrackEventCtrl', function ($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, eventRuleService, sketchbookService)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();
    $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
    $scope.AutoTrackingNameMaxLen = 10;
    
    var pageData = {};

    $scope.EventSource = 'Tracking';

    $scope.EventRule = {};

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };
    $scope.getTranslatedMaintainSizeOption = function (Option)
    {
    	if (Option == "Medium") return COMMONUtils.getTranslatedOption("MediumOrig");
    	return COMMONUtils.getTranslatedOption(Option);
    	
    };
    
    var sliderStep = 10;

    $scope.IncreaseCamHeight = function ()
    {
        var sVal = $scope.AutoTracking.CameraHeight + sliderStep;

        if (sVal >= $scope.MinCameraHeight && sVal <= $scope.MaxCameraHeight){
            $scope.AutoTracking.CameraHeight = sVal;
        }
    };

    $scope.DecreaseCamHeight = function ()
    {
        var sVal = $scope.AutoTracking.CameraHeight - sliderStep;

        if (sVal >= $scope.MinCameraHeight && sVal <= $scope.MaxCameraHeight){
            $scope.AutoTracking.CameraHeight = sVal;
        }
    };

    $scope.getSliderValue = function ()
    {
        if(typeof $scope.AutoTracking !== 'undefined')
        {
            return $scope.AutoTracking.CameraHeight / 100 + " m";
        }
    };

    $scope.$on('<app/scripts/directives>::<updateCoordinates>', function (args, data)
    {

    	if(mAttr.PTZModel == true) {
    		var coordi = sketchbookService.get();
    		var setData = {};
    		setData["Mode"] = "Start";
    		setData["TrackingCoordinate"] = coordi.x1 + "," + coordi.y1 + "," + coordi.x2 + "," + coordi.y2;

    		SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=control', setData,
    				function (response) {
    			var coordinates = {};
    			coordinates.x1 = response.data.TrackingArea[0].TrackingCoordinate[0].x;
    			coordinates.y1 = response.data.TrackingArea[0].TrackingCoordinate[0].y;
    			coordinates.x2 = response.data.TrackingArea[0].TrackingCoordinate[1].x;
    			coordinates.y2 = response.data.TrackingArea[0].TrackingCoordinate[1].y;
    			coordinates.selectedMask = true;

    			sketchbookService.set(coordinates);

    		},
    		function (errorData) {
    			//alert(errorData);
    		},'',true);
    	}
    });
    
    $scope.$on('<app/scripts/directives>::<autoTrackingUpdate>', function (args, data)
    {
        if (data === null) {    //autoTracking setting cancel
    	} else {
            var autotrackAdd = function(){
                var setData = {'TrackingAreaID':data.name, 'Coordinate':data.position};
                return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=add', setData,
                    function (response) {},
                    function (errorData) {
                        console.log(errorData);
                    },'',true);
            };
            var autotrackingView = function(){
                return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view', {},
                    function (response) {
                        $scope.AutoTracking.TrackingAreas = response.data.AutoTracking[0].TrackingAreas;
                        if(!$scope.AutoTracking.TrackingAreas) $scope.AutoTracking.TrackingAreas = [];
                        $scope.ptzinfo = {
                            type: 'AT',
                            TrackingAreas : angular.copy($scope.AutoTracking.TrackingAreas),
                            isViewTrackingData : true,
                            autoTrackingFlag : response.data.AutoTracking[0].Enable,
                            selectTrackingArea : data.name
                        };
                    },
                    function (errorData) {
                        console.log(errorData);
                    },'',true);
            };
            var promises = [];
            promises.push(autotrackAdd);
            promises.push(autotrackingView);
            $q.seqAll(promises).then(
                function(){
                },
                function(errorData){
                    console.log(errorData);
                }
            );
    	}
    });
    $scope.$on('changeAutoTracking', function (args, data)
    {
        if (data === null) {
        } else {
            $scope.AutoTracking.TrackingAreas = data;
            $scope.sketchinfo.currentNumber = parseInt(data.length, 10);
        }
    });
    
    function getAttributes()
    {
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;

        if (mAttr.EnableOptions !== undefined)
        {
            $scope.EnableOptions = mAttr.EnableOptions;
        }

        if (mAttr.ActivateOptions !== undefined)
        {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }

        if (mAttr.WeekDays !== undefined)
        {
            $scope.WeekDays = mAttr.WeekDays;
        }

        if (mAttr.AlarmoutDurationOptions !== undefined)
        {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (Attributes.isSupportGoToPreset() === true)
        {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        $scope.EventActions = COMMONUtils.getSupportedEventActions("Tracking");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
        
        
        $scope.EnableOptions = ['Enable', 'Disable'];
        $scope.AutoModes = ['LostEnd', 'Unlimited'];

        if (mAttr.CameraHeights !== undefined)
        {
            $scope.CameraHeights = {};
            $scope.CameraHeights.minValue = parseInt(mAttr.CameraHeights[0].split('cm')[0]) / 100;
            $scope.CameraHeights.maxValue = parseInt(mAttr.CameraHeights[mAttr.CameraHeights.length - 1].split('cm')[0]) / 100;
            initCameraHeightsSlider();
        }

        if (mAttr.AutoTrackObjectSize !== undefined)
        {
            $scope.AutoTrackObjectSize = mAttr.AutoTrackObjectSize;
        }
    }

    function initCameraHeightsSlider()
    {
        if ($scope.CameraHeights !== undefined) {
            $scope.CameraHeightsSliderOptions = {
                floor: $scope.CameraHeights.minValue,
                ceil: $scope.CameraHeights.maxValue,
                showSelectionBar: true,
                step: 0.1,
                showInputBox: true,
                vertical: false
            };
        }
    }

    function getSliderColor()
    {
        return mAttr.sliderEnableColor;
    }

    function getAutoTrackingSetup()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view', getData,
            function (response) {
                $scope.AutoTracking = response.data.AutoTracking[0];
                $scope.AutoTracking.CameraHeight = parseInt($scope.AutoTracking.CameraHeight.split('cm')[0]) / 100;
                $scope.AutoTracking.Zoom = $scope.AutoTracking.ZoomControl === 'On' ? true : false;
                $scope.AutoTracking.IndicatorDisplay = $scope.AutoTracking.DisplayIndicator === 'On' ? true : false;
                $scope.AutoTracking.AreaActivation = $scope.AutoTracking.TrackingAreaEnable ? true : false;
                $scope.AutoTracking.AutoMode = $scope.AutoTracking.LostMode === 'Research' ? 'Unlimited' : 'LostEnd';

                if (!$scope.AutoTracking.TrackingAreas) $scope.AutoTracking.TrackingAreas = [];
                $scope.ptzinfo = {
                    type: 'AT',
                    TrackingAreas: angular.copy($scope.AutoTracking.TrackingAreas),
                    isViewTrackingData: true,
                    autoTrackingFlag : response.data.AutoTracking[0].Enable
                };

                pageData.AutoTracking = angular.copy($scope.AutoTracking);
                initCameraHeightsSlider();
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function setAutoTrackingSetup()
    {
        var setData = {};

        setData.Channel = 0;
        setData.CameraHeight = ($scope.AutoTracking.CameraHeight * 100) + 'cm';
        setData.ZoomControl = $scope.AutoTracking.Zoom === true ? 'On' : 'Off';
        setData.ObjectSize = $scope.AutoTracking.ObjectSize;
        setData.DisplayIndicator = $scope.AutoTracking.IndicatorDisplay === true ? 'On' : 'Off';
        setData.TrackingAreaEnable = $scope.AutoTracking.AreaActivation === true ? true : false;
        setData.LostMode = $scope.AutoTracking.AutoMode === 'Unlimited' ? 'Research' : 'Stop';

        SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=set', setData,
            function (response) {

            },
            function (errorData) {
                console.log(errorData);
            }, '', true);

        pageData.AutoTracking = angular.copy($scope.AutoTracking);
    }
    function runWatcher() {
        $scope.$watch(function(){return $scope.AutoTracking.TrackingAreas.length;}, function(newVal,oldVal){
            if(newVal != oldVal){
                if(newVal == undefined){
                    $scope.sketchinfo.currentNumber = 0;
                }else{
                    $scope.sketchinfo.currentNumber = parseInt($scope.AutoTracking.TrackingAreas.length, 10);
                }
            }
        });
    }
    
    function validatePage() {
        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

    function view(data)
    {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        getAttributes();
        
        var promises = [];
        promises.push(getAutoTrackingSetup);
        $q.seqAll(promises).then(
            function(){
                runWatcher();
                $scope.pageLoaded = true;
                $scope.$emit('pageLoaded', $scope.EventSource);
                showVideo().finally(function(){
                    $("#imagepage").show();
                });
            },
            function(errorData){
                console.log(errorData);
            }
        );
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
                    adjust: adjust,
                    currentPage: "AutoTracking"
                };

                $scope.ptzinfo = {
                    type: 'AT'
                };

                var trackingCount = parseInt($scope.AutoTracking.TrackingAreas.length,10);
                $scope.sketchinfo = {
                    workType: "autoTracking",
                    shape: 0,
                    maxNumber: mAttr.MaxTrackingArea,
                    currentNumber: trackingCount,
                    modalId: "autoTrackingPopup.html"
                };

            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }
    
    function set()
    {
        if (validatePage())
        {
            COMMONUtils.ApplyConfirmation(function() {
                if (!angular.equals(pageData.AutoTracking, $scope.AutoTracking))
                {
                    setAutoTrackingSetup();
                }
                $scope.$emit('applied', true);
            });
        }
    }

    $(document).ready(function ()
    {
        $('[data-toggle="tooltip"]').tooltip();
    });


    $scope.clearAll = function ()
    {
        $timeout(function(){
            $scope.EventRule.ScheduleIds = [];
        });
    };

    $scope.submit = set;
    $scope.view = view;

    (function wait()
    {
        if (!mAttr.Ready)
        {
            $timeout(function ()
            {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else
        {
            view();
        }
    })();
});