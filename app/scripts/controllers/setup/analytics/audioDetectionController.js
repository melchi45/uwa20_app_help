kindFramework.controller('audioDetectionCtrl', function ($scope, $uibModal, $translate, $timeout, $rootScope, $location, SunapiClient, Attributes, COMMONUtils, $q)
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

    function prepareEventRules(eventRules)
    {
        $scope.EventRule = {};

        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;

        $scope.EventRule.Enable = eventRules[0].Enable;
        $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;

        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));

        $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;

        if (typeof eventRules[0].EventAction !== 'undefined')
        {
            if (eventRules[0].EventAction.indexOf('FTP') !== -1)
            {
                $scope.EventRule.FtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('SMTP') !== -1)
            {
                $scope.EventRule.SmtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('Record') !== -1)
            {
                $scope.EventRule.RecordEnable = true;
            }
        }

        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[0].AlarmOutputs === 'undefined')
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};

                var duration = 'Off';
                for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++)
                {
                    if (ao + 1 === eventRules[0].AlarmOutputs[j].AlarmOutput)
                    {
                        duration = eventRules[0].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }

        if (typeof eventRules[0].PresetNumber === 'undefined')
        {
            $scope.EventRule.PresetNumber = 'Off';
        } else
        {
            $scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
        }

        pageData.EventRule = angular.copy($scope.EventRule);
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

    function getEventRules()
    {
        var getData = {};

        getData.EventSource = 'AudioDetection';

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
                function (response)
                {
                    prepareEventRules(response.data.EventRules);
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

    function setEventRules()
    {
        var setData = {};

        setData.RuleIndex = $scope.EventRule.RuleIndex;

        setData.EventAction = "";
        if ($scope.EventRule.FtpEnable)
        {
            setData.EventAction += 'FTP,';
        }

        if ($scope.EventRule.SmtpEnable)
        {
            setData.EventAction += 'SMTP,';
        }

        if ($scope.EventRule.RecordEnable)
        {
            setData.EventAction += 'Record,';
        }

        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
        {
            if ($scope.EventRule.AlarmOutputs[ao].Duration !== 'Off')
            {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRule.AlarmOutputs[ao].Duration;
            }
        }

        if ($scope.EventRule.PresetNumber !== 'Off')
        {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRule.PresetNumber;
        }

        if (setData.EventAction.length)
        {
            setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }

        setData.ScheduleType = $scope.EventRule.ScheduleType;
        //if ($scope.EventRule.ScheduleType === 'Scheduled')
        {
            var diff = $(pageData.EventRule.ScheduleIds).not($scope.EventRule.ScheduleIds).get();

            var sun = 0, mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0;

            for (var s = 0; s < diff.length; s++)
            {
                var str = diff[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
                            case 0:
                                sun = 1;
                                setData["SUN" + str[1]] = 0;
                                break;

                            case 1:
                                mon = 1;
                                setData["MON" + str[1]] = 0;
                                break;

                            case 2:
                                tue = 1;
                                setData["TUE" + str[1]] = 0;
                                break;

                            case 3:
                                wed = 1;
                                setData["WED" + str[1]] = 0;
                                break;

                            case 4:
                                thu = 1;
                                setData["THU" + str[1]] = 0;
                                break;

                            case 5:
                                fri = 1;
                                setData["FRI" + str[1]] = 0;
                                break;

                            case 6:
                                sat = 1;
                                setData["SAT" + str[1]] = 0;
                                break;

                            default:
                                break;
                        }
                    }
                }
            }

            for (var s = 0; s < $scope.EventRule.ScheduleIds.length; s++)
            {
                var str = $scope.EventRule.ScheduleIds[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
                            case 0:
                                sun = 1;
                                setData["SUN" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 1:
                                mon = 1;
                                setData["MON" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 2:
                                tue = 1;
                                setData["TUE" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 3:
                                wed = 1;
                                setData["WED" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 4:
                                thu = 1;
                                setData["THU" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 5:
                                fri = 1;
                                setData["FRI" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 6:
                                sat = 1;
                                setData["SAT" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            default:
                                break;
                        }
                    }
                }
            }

            if (sun)
            {
                setData.SUN = 1;
            }

            if (mon)
            {
                setData.MON = 1;
            }

            if (tue)
            {
                setData.TUE = 1;
            }

            if (wed)
            {
                setData.WED = 1;
            }

            if (thu)
            {
                setData.THU = 1;
            }

            if (fri)
            {
                setData.FRI = 1;
            }

            if (sat)
            {
                setData.SAT = 1;
            }
        }

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData,
                function (response)
                {
                    pageData.EventRule = angular.copy($scope.EventRule);
                },
                function (errorData)
                {
                    pageData.EventRule = angular.copy($scope.EventRule);
                    console.log(errorData);
                }, '', true);
    }

    function validatePage()
    {
        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0)
        {
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

    function view(data)
    {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];

        promises.push(getAudioDetection);
        promises.push(getEventRules);
        promises.push(getAudioLevel);

        $q.seqAll(promises).then(
                function () {
                    $scope.pageLoaded = true;
                },
                function (errorData) {
                    //alert(errorData);
                }
        );
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
                stopMonitoringAudioLevel();
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

                    if (!angular.equals(pageData.EventRule, $scope.EventRule))
                    {
                        functionList.push(setEventRules);
                    }

                    $q.seqAll(functionList).then(
                        function(){
                            view();
                        },function(errorData){
                            console.log(errorData);
                        }
                    ).finally(
                        function(){
                            startMonitoringAudioLevel();
                        });

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
                            var level = validateLevel(newAudioLevel[index]);

                            if(level === null) continue;

                            if($scope.AudioDetectChartOptions.EnqueueData)
                            {
                                $scope.AudioDetectChartOptions.EnqueueData(level);
                            }
                        }
                    }
                    monitoringTimer = $timeout(update,300);
                }
            });
        })();
    }

    function stopMonitoringAudioLevel(){
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
    function validateLevel(audioLevelObject)
    {
        if (mLastSequenceLevel > audioLevelObject.SequenceID)
        {
          return null;  
        } 

        mLastSequenceLevel = audioLevelObject.SequenceID;

        return audioLevelObject.Level;
    }

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
                    startMonitoringAudioLevel();
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
                startMonitoringAudioLevel();
            });
        }
    })();
});
