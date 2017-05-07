/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('fogDetectionCtrl', function ($scope, SunapiClient, XMLParser, Attributes,COMMONUtils, $timeout, CameraSpec, $interval, $q, ConnectionSettingService, kindStreamInterface, SessionOfUserManager, AccountService, $uibModal, $rootScope, $translate, eventRuleService, UniversialManagerService) {
    "use strict";

    var mAttr = Attributes.get();
    $scope.SelectedChannel = 0;
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
    var pageData = {};

    //sketchbook 에서 쓰이는 미사용 변수
    $scope.coordinates = null;
    $scope.sketchinfo = null;

    $scope.FogDetectChartOptions = {
        showInputBox : true,
        ThresholdLevel : 0,
        floor: 1,
        ceil: 100,
        width: 400,
        height: 150,
        disabled: false,
        onEnd: function(){}
    };

    $scope.FogDetectDurationSliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };

    $scope.FogDetectDurationSliderModel = {
        data:5
    };

    $scope.FogDetectSensitivitySliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };

    $scope.FogDetectSensitivitySliderModel = {
        data:5
    };

    $scope.EventSource = 'FogDetection';

    $scope.EventRule = {};

    function setSizeChart(){
        var chart = "#fog-line-chart";
        var width = $(chart).parent().width();
        if(width > 480){
            width = 480;
        }

        width -= 80;
        $scope.FogDetectChartOptions.width = width;

        $(chart+" .graph").css("width", width + "px");

        $(chart+" .graph-border").css("width", (width - 27) + "px");
        $(chart+".level-threshold-slider").css("width", (width + 140) + "px");

        $scope.$broadcast('reCalcViewDimensions');
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', setSizeChart);
    });

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
                    currentPage: 'Fog'
                };
                $scope.ptzinfo = {
                    type: 'none'
                };

            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    $scope.$watch('FogDetectDurationSliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.FogDetect !== undefined)
            {
                $scope.FogDetect.Duration = $scope.FogDetectDurationSliderModel.data;
            }
        }
    },true);

    $scope.$watch('FogDetectSensitivitySliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.FogDetect !== undefined)
            {
                $scope.FogDetect.SensitivityLevel = $scope.FogDetectSensitivitySliderModel.data;
            }
        }
    },true);

    $scope.$watch('FogDetectChartOptions', function(newValue, oldValue) {
        if(newValue.ThresholdLevel)
        {
            if($scope.FogDetect !== undefined)
            {
                $scope.FogDetect.ThresholdLevel = $scope.FogDetectChartOptions.ThresholdLevel;
            }
        }
    },true);  

    var mStopMonotoringFogLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;
    function startMonitoringFogLevel()
    {
        mStopMonotoringFogLevel = false;

        if(monitoringTimer == null)
        {
            (function update()
            {
                getFogLevel(function (data) {
                    if(destroyInterrupt) return;
                    var newFogLevel = angular.copy(data);
                    if (!mStopMonotoringFogLevel)
                    {
                        if (newFogLevel.length >= maxSample)
                        {
                            var index = newFogLevel.length;
                            while(index--)
                            {
                                var level = validateLevel(newFogLevel[index]);

                                if(level === null) continue;

                                if($scope.FogDetectChartOptions.EnqueueData)
                                {
                                    $scope.FogDetectChartOptions.EnqueueData(level);
                                }
                            }
                        }
                        monitoringTimer = $timeout(update, 500); //300 msec
                    }
                });
            })();
        }
    }

    function stopMonitoringFogLevel(){
        mStopMonotoringFogLevel = true;

        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
            monitoringTimer = null;
            $scope.FogDetectChartOptions.EnqueueData(0)
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringFogLevel();
    });

    var mLastSequenceLevel = 0;

    function validateLevel(fogLevelObject)
    {
        if(mLastSequenceLevel > fogLevelObject.SequenceID)
        {
            return null;
        }

        mLastSequenceLevel = fogLevelObject.SequenceID;

        return fogLevelObject.Level;
    }

    function getFogLevel(func)
    {      
        var newFogLevel = {};

        var getData = {};

        getData.MaxSamples = maxSample;

        getData.EventSourceType = 'FogDetection';
        
        getData.Channel = UniversialManagerService.getChannelId();

        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

        return SunapiClient.get(sunapiURL, getData,
                function (response)
                {
                    newFogLevel = angular.copy(response.data.FogDetection[0].Samples);
                    if (func !== undefined) {
                        func(newFogLevel);
                    }
                },
                function (errorData)
                {
                    console.log("getFogLevel Error : ", errorData);
                    stopMonitoringFogLevel();
                    startMonitoringFogLevel();
                }, '', true);
    }     

    function getFogDetection()
    {
        var getData = {
            Channel: UniversialManagerService.getChannelId()
        };

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=fogdetection&action=view', getData,
            function (response)
            {
                $scope.FogDetect = response.data.FogDetection[0];
                pageData.FogDetect = angular.copy($scope.FogDetect);
                
                $scope.FogDetectChartOptions.ThresholdLevel = $scope.FogDetect.ThresholdLevel;
                $scope.FogDetectDurationSliderModel.data = $scope.FogDetect.Duration;
                $scope.FogDetectSensitivitySliderModel.data = $scope.FogDetect.SensitivityLevel;
            },
            function (errorData)
            {
                console.log(errorData);
            }, '', true);
    }  

    function setFogDetection()
    {
        var setData = {};

        setData.Channel = UniversialManagerService.getChannelId();

        if (pageData.FogDetect.Enable !== $scope.FogDetect.Enable)
        {
            setData.Enable = $scope.FogDetect.Enable;
        }

        if (pageData.FogDetect.SensitivityLevel !== $scope.FogDetect.SensitivityLevel)
        {
            setData.SensitivityLevel = $scope.FogDetect.SensitivityLevel;
        }

        if (pageData.FogDetect.ThresholdLevel !== $scope.FogDetect.ThresholdLevel)
        {
            setData.ThresholdLevel = $scope.FogDetect.ThresholdLevel;
        }        

        if (pageData.FogDetect.AutoDefog !== $scope.FogDetect.AutoDefog)
        {
            setData.AutoDefog = $scope.FogDetect.AutoDefog;
        }

        if (pageData.FogDetect.Duration !== $scope.FogDetect.Duration)
        {
            setData.Duration = $scope.FogDetect.Duration;
        }

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=fogdetection&action=set', setData,
                function (response)
                {
                    pageData.FogDetect = angular.copy($scope.FogDetect);
                },
                function (errorData)
                {
                    pageData.FogDetect = angular.copy($scope.FogDetect);
                    console.log(errorData);
                }, '', true);
    }

    $scope.DefogOnClickEventHandler = function() {
        if($scope.FogDetect.AutoDefog === true)
        {
            var msg = $translate.instant('lang_msg_defog_set_atuo_maintained') + $translate.instant('lang_msg_applied_only_when_fog_disabled');
            COMMONUtils.ShowDeatilInfo(msg,'','md');
        }
    };

    $scope.setFogDetectionEnable = function () {
        var successCallback = function (){
            $rootScope.$emit('changeLoadingBar', true);
            var setData = {};

            setData.Channel = UniversialManagerService.getChannelId();

            if (pageData.FogDetect.Enable !== $scope.FogDetect.Enable)
            {
                setData.Enable = $scope.FogDetect.Enable;
            }

            return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=fogdetection&action=set', setData,
                function (response)
                {
                    $rootScope.$emit('changeLoadingBar', false);
                    pageData.FogDetect.Enable = angular.copy($scope.FogDetect.Enable);

                    if($scope.FogDetect.Enable)
                    {
                        startMonitoringFogLevel();
                    }
                    else
                    {
                        stopMonitoringFogLevel();
                    }
                },
                function (errorData)
                {
                    $rootScope.$emit('changeLoadingBar', false);
                    $scope.FogDetect.Enable = angular.copy(pageData.FogDetect.Enable);
                    console.log(errorData);
                }, '', true);
        };
        var errorCallback = function ()
        {
            $scope.FogDetect.Enable = angular.copy(pageData.FogDetect.Enable);
        };

        COMMONUtils.ShowConfirmation(successCallback, 'lang_apply_question','sm', errorCallback);
    };

    function getAttributes() {
        var defer = $q.defer();

        $scope.MaxChannel = mAttr.MaxChannel;

        if (mAttr.ActivateOptions !== undefined)
        {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }
        
        if (mAttr.EnableOptions !== undefined)
        {
            $scope.EnableOptions = mAttr.EnableOptions;
        }

        if (mAttr.WeekDays !== undefined)
        {
            $scope.WeekDays = mAttr.WeekDays;
        }

        if (mAttr.FogDetectThreshold !== undefined)
        {
            $scope.FogDetectChartOptions.ceil = mAttr.FogDetectThreshold.maxValue;
            $scope.FogDetectChartOptions.floor = mAttr.FogDetectThreshold.minValue;
        }

        if (mAttr.AlarmoutDurationOptions !== undefined)
        {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (Attributes.isSupportGoToPreset() === true)
        {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        if (mAttr.FogDetectDuration !== undefined)
        {
            $scope.FogDetectDurationSliderProperty.ceil = mAttr.FogDetectDuration.maxValue;
            $scope.FogDetectDurationSliderProperty.floor = mAttr.FogDetectDuration.minValue;

            $scope.FogDetectSensitivitySliderProperty.ceil = mAttr.FogDetectSensitivityLevel.maxValue;
            $scope.FogDetectSensitivitySliderProperty.floor = mAttr.FogDetectSensitivityLevel.minValue;
        }

        $scope.EventActions = COMMONUtils.getSupportedEventActions("TamperingDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;

        defer.resolve("success");
        return defer.promise;
    }

    $scope.clearAll = function ()
    {
        $timeout(function(){
            $scope.EventRule.ScheduleIds = [];
        });
    };

    function validatePage() {
        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

    function view(data) {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];

        promises.push(showVideo);
        promises.push(getFogDetection);

        $q.seqAll(promises).then(
            function(){
                $rootScope.$emit('changeLoadingBar', false);
                $scope.pageLoaded = true;
                $scope.$emit('pageLoaded', $scope.EventSource);
                $("#imagepage").show();
                $timeout(setSizeChart);

                if($scope.FogDetect.Enable)
                {
                    startMonitoringFogLevel();
                }
                else
                {
                    stopMonitoringFogLevel();
                }
            },
            function(errorData){
                $rootScope.$emit('changeLoadingBar', false);
                alert(errorData);
            }
        );
    }

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };


    function set() {
        if(validatePage())
        {
            COMMONUtils.ApplyConfirmation(setChangedData);    
        }
    }

    function saveSettings() {
        if (checkChangedData()){
            setChangedData();
        }
    }

    function setChangedData(){
        var deferred = $q.defer();

        setFogDetection().then(
            function () {
                $scope.$emit('applied', UniversialManagerService.getChannelId());
                view();
                deferred.resolve(true);
            },
            function (errorData) {console.info(11);
                console.log(errorData);
                deferred.reject(errorData);
            }
        );

        return deferred.promise;
    }

    function checkChangedData(){
        return !angular.equals(pageData.FogDetect, $scope.FogDetect);
    }

    function changeChannel(index){
        $rootScope.$emit("channelSelector:changeChannel", index);
        $rootScope.$emit('changeLoadingBar', true);
        UniversialManagerService.setChannelId(index);
        view();
    }

    $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
        if(checkChangedData() || !eventRuleService.checkEventRuleValidation()){
            COMMONUtils
                .confirmChangeingChannel()
                .then(function(){
                    if(validatePage() === true){
                        setChangedData().then(function(){
                            changeChannel(index);
                        });
                    }
                }, function(){
                    console.log("canceled");
                });    
        }else{
            changeChannel(index);
        }
    }, $scope);


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

    $scope.submit = set;
    $scope.view = view;
});
