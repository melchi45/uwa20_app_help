kindFramework.controller('audioDetectionCtrl', function ($scope, $uibModal, $translate, $timeout, $rootScope, $location, SunapiClient, Attributes, COMMONUtils, $q, eventRuleService)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();
    $scope.levelPattern = mAttr.OnlyNumStr;

    var pageData = {};
    $scope.data = {};

    $scope.AudioDetectChartOptions = {
        showInputBox : true,
        ThresholdLevel : 50,
        floor: 1,
        ceil: 100,
        width: 400,
        height: 150,
        disabled: false,
        onEnd: function(){}
    };

    $scope.EventSource = 'AudioDetection';

    $scope.EventRule = {};

    $scope.$watch('AudioDetectChartOptions', function(newValue, oldValue) {
        if(newValue.ThresholdLevel)
        {
            if($scope.AD !== undefined)
            {
                $scope.AD.InputThresholdLevel = $scope.AudioDetectChartOptions.ThresholdLevel;
            }
        }
    },true);    

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes()
    {
        var defer = $q.defer();
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

        if (mAttr.InputThresholdLevelRange !== undefined)
        {
            $scope.InputThresholdMin = mAttr.InputThresholdLevelRange.minValue;
            $scope.InputThresholdMax = mAttr.InputThresholdLevelRange.maxValue;

            $scope.AudioDetectChartOptions.ceil = $scope.InputThresholdMax;
            $scope.AudioDetectChartOptions.floor = $scope.InputThresholdMin;
        }

        $scope.audioDegrees = ['Off', '10%', '20%', '30%', '40%', '50%']; // temporary

        $scope.EventActions = COMMONUtils.getSupportedEventActions("AudioDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

        defer.resolve("success");
        return defer.promise;
    }

    function getAudioDetection()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=audiodetection&action=view', getData,
                function (response)
                {
                    $scope.AD = response.data.AudioDetection[0];
                    $scope.AudioDetectChartOptions.ThresholdLevel = $scope.AD.InputThresholdLevel;
                    pageData.AD = angular.copy($scope.AD);
                },
                function (errorData)
                {
                    //alert(errorData);
                }, '', true);
    }

    function setAudioDetection()
    {
        var setData = {};

        setData.Channel = 0;

        if (pageData.AD.Enable !== $scope.AD.Enable)
        {
            setData.Enable = $scope.AD.Enable;
        }

        if (pageData.AD.InputThresholdLevel !== $scope.AD.InputThresholdLevel)
        {
            setData.InputThresholdLevel = $scope.AD.InputThresholdLevel;
        }

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=audiodetection&action=set', setData,
                function (response)
                {
                    pageData.AD = angular.copy($scope.AD);
                },
                function (errorData)
                {
                    pageData.AD = angular.copy($scope.AD);
                    console.log(errorData);
                }, '', true);
    }

    function validatePage()
    {
        // if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0)
        // {
        //     COMMONUtils.ShowError('lang_msg_checkthetable');
        //     return false;
        // }

        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        
        if($scope.AD.InputThresholdLevel < $scope.InputThresholdMin || $scope.AD.InputThresholdLevel > $scope.InputThresholdMax)
        {
            COMMONUtils.ShowError('lang_msg_check_level');
            return false;
        }

        return true;
    }
   

    function setSizeChart(){
        var chart = "#audio-line-chart";
        var width = $(chart).parent().width();
        if(width > 480){
            width = 480;
        }

        width -= 80;
        $scope.AudioDetectChartOptions.width = width;

        $(chart+" .graph").css("width", width + "px");
        $(chart+" .graph-border").css("width", (width - 27) + "px");
        $(chart+".level-threshold-slider").css("width", (width + 100) + "px");
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', setSizeChart);
    });

    function view(data)
    {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];

        promises.push(getAudioDetection);
        promises.push(getAudioLevel);

        if(promises.length > 0) {
            $q.seqAll(promises).then(
                    function () {
                        $scope.pageLoaded = true;
                        $scope.$emit('pageLoaded', $scope.EventSource);
                        $timeout(setSizeChart);

                        if($scope.AD.Enable)
                        {
                            startMonitoringAudioLevel();
                        }
                        else
                        {
                            stopMonitoringAudioLevel();
                        }
                    },
                    function (errorData) {
                        //alert(errorData);
                    }
            );
        } else {
            $scope.pageLoaded = true;
        }
    }

    function set(isEnabledChanged)
    {
        if(isEnabledChanged) { // when enable checkbox changed.
            var modalInstance = $uibModal.open({
                    templateUrl: 'views/setup/common/confirmMessage.html',
                    controller: 'confirmMessageCtrl',
                    size: 'sm',
                    resolve: {
                        Message: function() {
                            return 'lang_apply_question';
                        }
                    }
                });
            modalInstance.result.then(function() {
                var setData = {};

                setData.Channel = 0;

                setData.Enable = $scope.AD.Enable;

                SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=audiodetection&action=set', setData,
                    function (response)
                    {
                        if($scope.AD.Enable)
                        {
                            startMonitoringAudioLevel();
                        }
                        else
                        {
                            stopMonitoringAudioLevel();
                        }
                    },
                    function (errorData)
                    {
                        console.log(errorData);
                    }, '', true);
            }, function() {
                if(isEnabledChanged) {
                    $scope.AD.Enable = !$scope.AD.Enable;
                }
            });

            return;
        }

        if (validatePage())
        {
            if (!angular.equals(pageData.AD, $scope.AD) || !angular.equals(pageData.EventRule, $scope.EventRule))
            {
                //stopMonitoringAudioLevel();
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
                    var functionList = [];
                    if (!angular.equals(pageData.AD, $scope.AD))
                    {
                        functionList.push(setAudioDetection);
                    }

                    if(functionList.length > 0) {
                        $q.seqAll(functionList).then(
                            function(){
                                $scope.$emit('applied', true);
                                view();
                            },function(errorData){
                                console.log(errorData);
                            }
                        );
                    } else {
                        $scope.$emit('applied', true);
                        view();
                    }

                }, function ()
                {

                });
            }
        }
    }

    var mStopMonotoringAudioLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;
    function startMonitoringAudioLevel()
    {
        mStopMonotoringAudioLevel = false;

        (function update()
        {
            getAudioLevel(function (data) {
                if(destroyInterrupt) return;
                var newAudioLevel = angular.copy(data);

                if (!mStopMonotoringAudioLevel)
                {
                    if (newAudioLevel.length >= maxSample)
                    {
                        var index = newAudioLevel.length;

                        while(index--)
                        {
                            var level = newAudioLevel[index].Level;

                            if(level === null) continue;

                            if($scope.AudioDetectChartOptions.EnqueueData)
                            {
                                $scope.AudioDetectChartOptions.EnqueueData(level);
                            }
                        }
                    }
                    monitoringTimer = $timeout(update, 500);
                }
            });
        })();
    }

    function stopMonitoringAudioLevel(){
        mStopMonotoringAudioLevel = true;

        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringAudioLevel();
    });

    var mLastSequenceLevel = 0;

    function getAudioLevel(func)
    {
        var newAudioLevel = {};

        var getData = {};

        getData.MaxSamples = maxSample;
        
        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=audiodetection&action=check';

        return SunapiClient.get(sunapiURL, getData,
                function (response)
                {
                    newAudioLevel = angular.copy(response.data.AudioDetection[0].Samples);

                    if (func !== undefined) {
                        func(newAudioLevel);
                    }
                },
                function (errorData)
                {
                    console.log("getAudioLevel Error : ", errorData);
                    //startMonitoringAudioLevel();
                }, '', true);
    }
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
            getAttributes().finally(function () {
                view();
            });
        }
    })();
});
