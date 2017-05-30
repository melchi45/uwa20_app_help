kindFramework.controller('defocusDetectionCtrl', function ($rootScope, $location, $scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, eventRuleService, UniversialManagerService)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();

    var pageData = {};

    $scope.EventSource = 'DefocusDetection';

    $scope.EventRule = {};

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.DefocusChartOptions = {
        showInputBox : true,   //(Input 입력 박스 표시여부)
        ThresholdLevel : 0,   //(Threshold 값)
        floor: 1,                       //(Y축 최소값)
        ceil: 100,                     //(Y축 최대값)
        width: 400,                  //(차트 넓이)
        height: 150,                  //(차트 높이)
        disabled: false,
        onEnd: function(){}
    };

    function setSizeChart(){
        var chart = "#defocus-line-chart";
        var width = $(chart).parent().width();
        if(width > 480){
            width = 480;
        }

        width -= 80;
        $scope.DefocusChartOptions.width = width;

        $(chart+" .graph").css("width", width + "px");
        $(chart+" .graph-border").css("width", (width - 27) + "px");
        $(chart+".level-threshold-slider").css("width", (width + 140) + "px");

        $scope.$broadcast('reCalcViewDimensions');
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', setSizeChart);
    });

    $scope.$watch('DefocusChartOptions', function(newValue, oldValue) {
        if(newValue.ThresholdLevel)
        {
            if($scope.DefocusDetect !== undefined)
            {
                $scope.DefocusDetect.ThresholdLevel = $scope.DefocusChartOptions.ThresholdLevel;
            }
        }
    },true);  

    $scope.DefocusDetectDurationSliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    $scope.DefocusDetectDurationSliderModel = {
        data: 1
    };

    $scope.$watch('DefocusDetectDurationSliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.DefocusDetect !== undefined)
            {
                $scope.DefocusDetect.Duration = $scope.DefocusDetectDurationSliderModel.data;
            }
        }
    },true);

    $scope.DefocusDetectSensitivitySliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    $scope.DefocusDetectSensitivitySliderModel = {
        data: 1
    };

    $scope.$watch('DefocusDetectSensitivitySliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.DefocusDetect !== undefined)
            {
                $scope.DefocusDetect.Sensitivity = $scope.DefocusDetectSensitivitySliderModel.data;
            }
        }
    },true);

    function getAttributes()
    {
        var defer = $q.defer();
        $scope.MaxChannel = mAttr.MaxChannel;
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
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

        $scope.EventActions = COMMONUtils.getSupportedEventActions("DefocusDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

        if (mAttr.DefocusDetectThreshold !== undefined)
        {
            $scope.DefocusChartOptions.floor = mAttr.DefocusDetectThreshold.minValue;
            $scope.DefocusChartOptions.ceil = mAttr.DefocusDetectThreshold.maxValue;
        }

        if (mAttr.DefocusDetectDuration !== undefined)
        {
            $scope.DefocusDetectDurationSliderProperty.floor = mAttr.DefocusDetectDuration.minValue;
            $scope.DefocusDetectDurationSliderProperty.ceil = mAttr.DefocusDetectDuration.maxValue;
        }

        if(mAttr.DefocusDetectSensitivityLevelRange !== undefined){
            $scope.DefocusDetectSensitivitySliderProperty.floor = mAttr.DefocusDetectSensitivityLevelRange.minValue;
            $scope.DefocusDetectSensitivitySliderProperty.ceil = mAttr.DefocusDetectSensitivityLevelRange.maxValue;
        }

        defer.resolve("success");
        return defer.promise;
    }

    function between(x, min, max) {
        return (x >= min && x <= max);
    }

    function getDefocusDetection()
    {
        var getData = {
            Channel: UniversialManagerService.getChannelId()
        };

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=defocusdetection&action=view', getData,
                function (response)
                {
                    $scope.DefocusDetect = response.data.DefocusDetection[0];
                    $scope.DefocusChartOptions.ThresholdLevel = $scope.DefocusDetect.ThresholdLevel;

                    if( between($scope.DefocusDetect.Duration, $scope.DefocusDetectDurationSliderProperty.floor, $scope.DefocusDetectDurationSliderProperty.ceil) ){
                        $scope.DefocusDetectDurationSliderModel.data = $scope.DefocusDetect.Duration;
                    }

                    if( between($scope.DefocusDetect.Sensitivity, $scope.DefocusDetectSensitivitySliderProperty.floor, $scope.DefocusDetectSensitivitySliderProperty.ceil) ){
                        $scope.DefocusDetectSensitivitySliderModel.data = $scope.DefocusDetect.Sensitivity;
                    }

                    pageData.DefocusDetect = angular.copy($scope.DefocusDetect);
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    $scope.SimpleFocusClickEventHandler = function() {
        if($scope.DefocusDetect.AutoSimpleFocus === true)
        {
            var msg = '';
            if(mAttr.PTZModel || mAttr.ZoomOnlyModel){
                msg = $translate.instant('lang_msg_auto_focus_activated');
            } else {
                msg = $translate.instant('lang_msg_simple_focus_activated');
            }
            COMMONUtils.ShowDeatilInfo(msg,'','md');
        }
    };

    function setDefocusDetection()
    {
        var setData = {};

        setData.Channel = UniversialManagerService.getChannelId();

        if (pageData.DefocusDetect.Enable !== $scope.DefocusDetect.Enable)
        {
            setData.Enable = $scope.DefocusDetect.Enable;
        }

        if (pageData.DefocusDetect.ThresholdLevel !== $scope.DefocusDetect.ThresholdLevel)
        {
            setData.ThresholdLevel = $scope.DefocusDetect.ThresholdLevel;
        }

        if (pageData.DefocusDetect.Duration !== $scope.DefocusDetect.Duration)
        {
            setData.Duration = $scope.DefocusDetect.Duration;
        }

        if (pageData.DefocusDetect.Sensitivity !== $scope.DefocusDetect.Sensitivity)
        {
            setData.Sensitivity = $scope.DefocusDetect.Sensitivity;
        }

        if (pageData.DefocusDetect.AutoSimpleFocus !== $scope.DefocusDetect.AutoSimpleFocus)
        {
            setData.AutoSimpleFocus = $scope.DefocusDetect.AutoSimpleFocus;
        }


        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=defocusdetection&action=set', setData,
                function (response)
                {
                    pageData.DefocusDetect = angular.copy($scope.DefocusDetect);
                },
                function (errorData)
                {
                    pageData.DefocusDetect = angular.copy($scope.DefocusDetect);
                    console.log(errorData);
                }, '', true);
    }

    function validatePage() {
        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

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
                        currentPage: 'DefocusDetection',
                        channelId: UniversialManagerService.getChannelId()
                    };
                    $scope.ptzinfo = {
                        type: 'none'
                    };
                },
                function (errorData) {
                    //alert(errorData);
                }, '', true);
    }

    function view(data)
    {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];

        promises.push(showVideo);
        promises.push(getDefocusDetection);

        if(promises.length > 0) {
        $q.seqAll(promises).then(
            function () {
                $timeout(function(){
                    $rootScope.$emit('changeLoadingBar', false);
                    $scope.pageLoaded = true;
                    $scope.$emit('pageLoaded', $scope.EventSource);
                    $timeout(setSizeChart);
                });

                if($scope.DefocusDetect.Enable)
                {
                    startMonitoringDefocusLevel();
                }
                else
                {
                    stopMonitoringDefocusLevel();
                }
            },
            function (errorData) {
                $rootScope.$emit('changeLoadingBar', false);
                console.log(errorData);
            }
        );
        } else {
            $timeout(function(){
                $scope.pageLoaded = true;
                $timeout(setSizeChart);
            });
        }
    }

    function saveSettings(){
        var deferred = $q.defer();
        var promises = [];

        if (!angular.equals(pageData.DefocusDetect, $scope.DefocusDetect))
        {
            promises.push(setDefocusDetection);
        }

        var endSettings = function(){
            $scope.$emit('applied', true);
            deferred.resolve(true);
            view();
        };

        if(promises.length > 0){
            $q.seqAll(promises).then(function(){
                endSettings();
            }, function(errorData){
                console.error(errorData);
            });
        } else {
            endSettings();
        }

        return deferred.promise;
    }

    function set()
    {
        if (validatePage())
        {
            // if (!angular.equals(pageData.DefocusDetect, $scope.DefocusDetect) || !eventRuleService.checkEventRuleValidation()){
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

                modalInstance.result.then(function ()
                {
                    saveSettings();
                }, function ()
                {

                });
            // }
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

    var mStopMonotoringDefocusLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;
    function startMonitoringDefocusLevel()
    {
        mStopMonotoringDefocusLevel = false;

        if(monitoringTimer == null)
        {
            (function update()
            {
                getDefocusLevel(function (data) {
                    if(destroyInterrupt) return;
                    var newDefocusLevel = angular.copy(data);

                    if (!mStopMonotoringDefocusLevel)
                    {
                        if(newDefocusLevel.length >= maxSample)
                        {
                            var index = newDefocusLevel.length;

                            while(index--)
                            {
                                var level = validateLevel(newDefocusLevel[index]);

                                if(level === null) continue;

                                if($scope.DefocusChartOptions.EnqueueData)
                                {
                                    $scope.DefocusChartOptions.EnqueueData(level);
                                }
                            }
                        }
                        monitoringTimer = $timeout(update, 500); //300 msec
                    }
                });
            })();
        }
    }

    var mLastSequenceLevel = 0;

    function validateLevel(defocusLeveObject)
    {
        if(mLastSequenceLevel > defocusLeveObject.SequenceID)
        {
            return null;
        }

        mLastSequenceLevel = defocusLeveObject.SequenceID;

        return defocusLeveObject.Level;
    }

    function getDefocusLevel(func)
    {
        var newDefocusLevel = {};

        var getData = {
            Channel: UniversialManagerService.getChannelId()
        };

        getData.MaxSamples = maxSample;
        getData.EventSourceType = 'DefocusDetection';
        
        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

        return SunapiClient.get(sunapiURL, getData,
                function (response)
                {
                    newDefocusLevel = angular.copy(response.data.DefocusDetection[0].Samples);
                    if (func !== undefined) {
                        func(newDefocusLevel);
                    }
                },
                function (errorData)
                {
                    console.log("getDefocusLevel Error : ", errorData);
                    stopMonitoringDefocusLevel();
                    startMonitoringDefocusLevel();
                }, '', true);
    }

    function stopMonitoringDefocusLevel(){
        mStopMonotoringDefocusLevel = true;

        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
            monitoringTimer = null;
            $scope.DefocusChartOptions.EnqueueData(0);
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringDefocusLevel();
    });

    $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){

        if (!angular.equals(pageData.DefocusDetect, $scope.DefocusDetect) || !eventRuleService.checkEventRuleValidation()){
            if(validatePage()){
                COMMONUtils
                    .confirmChangeingChannel()
                    .then(function(){
                        $rootScope.$emit('changeLoadingBar', true);
                        saveSettings().then(function(){
                            changeChannel(index);
                        });
                    }, function(){
                        console.log("canceled");
                    });    
            }
        }else{
            $rootScope.$emit('changeLoadingBar', true);
            changeChannel(index);
        }

    }, $scope);

    function changeChannel(index){
        // $rootScope.$emit('changeLoadingBar', true);
        $rootScope.$emit("channelSelector:changeChannel", index);
        view();
    }

    $scope.submit = set;
    $scope.view = view;

    $scope.submitEnable = function(){
        stopMonitoringDefocusLevel();

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

        modalInstance.result.then(function ()
        {
            var setData = {
                Channel: UniversialManagerService.getChannelId(),
                Enable: $scope.DefocusDetect.Enable
            };

            return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=defocusdetection&action=set', setData,
                    function (response)
                    {
                        pageData.DefocusDetect.Enable = $scope.DefocusDetect.Enable;

                        if($scope.DefocusDetect.Enable)
                        {
                            startMonitoringDefocusLevel();
                        }
                    },
                    function (errorData)
                    {
                        if($scope.DefocusDetect.Enable)
                        {
                            startMonitoringDefocusLevel();
                        }
                    }, '', true);
        }, function ()
        {
            $scope.DefocusDetect.Enable = pageData.DefocusDetect.Enable;
            if($scope.DefocusDetect.Enable)
            {
                startMonitoringDefocusLevel();
            }
        });
    };

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
            getAttributes().finally(function () {
                view();
            });
        }
    })();
});
