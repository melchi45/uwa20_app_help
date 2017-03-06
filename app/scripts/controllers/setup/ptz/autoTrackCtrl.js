kindFramework.controller('autoTrackCtrl', function ($scope, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, sketchbookService)
{
    "use strict";

    var mAttr = Attributes.get();
    $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
    $scope.AutoTrackingNameMaxLen = 10;

    var pageData = {};

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
        var sVal = $scope.AutoTracking.SliderLevel + sliderStep;

        if (sVal >= $scope.MinCameraHeight && sVal <= $scope.MaxCameraHeight){
            $scope.AutoTracking.SliderLevel = sVal;
        }
    };

    $scope.DecreaseCamHeight = function ()
    {
        var sVal = $scope.AutoTracking.SliderLevel - sliderStep;

        if (sVal >= $scope.MinCameraHeight && sVal <= $scope.MaxCameraHeight){
            $scope.AutoTracking.SliderLevel = sVal;
        }
    };

    $scope.getSliderValue = function ()
    {
        if(typeof $scope.AutoTracking !== 'undefined')
        {
            return $scope.AutoTracking.SliderLevel / 100 + " m";
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
            var autotrackAdd = function(addData){
                return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=add', addData,
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
                            isViewTrackingData : true
                        };
                    },
                    function (errorData) {
                        console.log(errorData);
                    },'',true);
            };
            var setData = {'TrackingAreaID':data.name, 'Coordinate':data.position};
            var promises = [];
            promises.push(autotrackAdd(setData));
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
            $scope.sketchinfo.currentNumber = parseInt(data.length, 10);
        }
    });

    function getAttributes()
    {
        $scope.EnableOptions = ['Enable', 'Disable'];
        $scope.AutoModes = ['LostEnd', 'Unlimited'];

        if (mAttr.CameraHeights !== undefined)
        {
            $scope.MinCameraHeight = parseInt(mAttr.CameraHeights[0].split('cm')[0]);
            $scope.MaxCameraHeight = parseInt(mAttr.CameraHeights[mAttr.CameraHeights.length - 1].split('cm')[0]);

            $scope.SensitivitySliderOptions = {
                floor: $scope.MinCameraHeight,
                ceil: $scope.MaxCameraHeight,
                step: sliderStep,
                showSelectionBar: true,
                translate: function(val){
                    return val / 100 + ' m';
                }
            };

            //refreshSensitivitySlider();
        }

        if (mAttr.AutoTrackObjectSize !== undefined)
        {
            $scope.AutoTrackObjectSize = mAttr.AutoTrackObjectSize;
        }
    }


    function refreshSensitivitySlider()
    {
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');
        });
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
                $scope.AutoTracking.SliderLevel = parseInt($scope.AutoTracking.CameraHeight.split('cm')[0]);
                $scope.AutoTracking.Zoom = $scope.AutoTracking.ZoomControl === 'On' ? 'Enable' : 'Disable';
                $scope.AutoTracking.IndicatorDisplay = $scope.AutoTracking.DisplayIndicator === 'On' ? 'Enable' : 'Disable';
                $scope.AutoTracking.AreaActivation = $scope.AutoTracking.TrackingAreaEnable ? 'Enable' : 'Disable';
                $scope.AutoTracking.AutoMode = $scope.AutoTracking.LostMode === 'Research' ? 'Unlimited' : 'LostEnd';

                if (!$scope.AutoTracking.TrackingAreas) $scope.AutoTracking.TrackingAreas = [];
                $scope.ptzinfo = {
                    type: 'AT',
                    TrackingAreas: angular.copy($scope.AutoTracking.TrackingAreas),
                    isViewTrackingData: true
                };

                pageData.AutoTracking = angular.copy($scope.AutoTracking);
                refreshSensitivitySlider();
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function setAutoTrackingSetup()
    {
        var setData = {};

        setData.Channel = 0;
        setData.CameraHeight = $scope.AutoTracking.SliderLevel + 'cm';
        setData.ZoomControl = $scope.AutoTracking.Zoom === 'Enable' ? 'On' : 'Off';
        setData.ObjectSize = $scope.AutoTracking.ObjectSize;
        setData.DisplayIndicator = $scope.AutoTracking.IndicatorDisplay === 'Enable' ? 'On' : 'Off';
        setData.TrackingAreaEnable = $scope.AutoTracking.AreaActivation === 'Enable' ? true : false;
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

    function validatePage()
    {
        return true;
    }

    function view()
    {
        getAttributes();
        var promises = [];
        promises.push(getAutoTrackingSetup);
        $q.seqAll(promises).then(
            function(){
                runWatcher();
                $scope.pageLoaded = true;
                showVideo().finally(function(){
                    $("#autotrackpage").show();
                    $timeout(function(){
                        refreshSensitivitySlider();
                    },100);
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
                    adjust: adjust
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
            if (!angular.equals(pageData.AutoTracking, $scope.AutoTracking))
            {
                COMMONUtils.ApplyConfirmation(setAutoTrackingSetup);
            }
        }
    }

    $scope.submit = set;
    $scope.view = view;

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

});