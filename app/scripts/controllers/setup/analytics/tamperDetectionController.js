kindFramework.controller('tamperDetectionCtrl', function ($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $interval, ConnectionSettingService, SessionOfUserManager, kindStreamInterface, AccountService, $rootScope)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();

    var pageData = {};

    $scope.TamperDetectChartOptions = {
        showInputBox : true,
        ThresholdLevel : 50,
        floor: 0,
        ceil: 100,
        width: 400,
        height: 150,
        disabled:false,
        onEnd: function () {}
    };

    $scope.TamperDetectDurationSliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    $scope.TamperDetectDurationSliderModel = {
        data: 5
    };

    $scope.TamperDetectSensitivitySliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    $scope.TamperDetectSensitivitySliderModel = {
        data: 5
    };

    function setSizeChart(){
        var chart = "#tamper-line-chart";
        var width = $(chart).parent().width();
        if(width > 480){
            width = 480;
        }

        width -= 80;
        $scope.TamperDetectChartOptions.width = width;

        $(chart+" .graph").css("width", width + "px");
        $(chart+" .graph-border").css("width", (width - 27) + "px");
        $(chart+".level-threshold-slider").css("width", (width + 140) + "px");

        $scope.$broadcast('reCalcViewDimensions');
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', setSizeChart);
    });


    //sketchbook 에서 쓰이는 미사용 변수
    $scope.coordinates = null;
    $scope.sketchinfo = null;

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
                        adjust: adjust,
                        currentPage: 'TamperingDetection'
                    };
                    $scope.ptzinfo = {
                        type: 'none'
                    };

                },
                function (errorData) {
                    //alert(errorData);
                }, '', true);
    }

    $scope.$watch('TamperDetectChartOptions', function(newValue, oldValue) {
        if(newValue.ThresholdLevel)
        {
            if($scope.TamperDetect !== undefined)
            {
                $scope.TamperDetect.ThresholdLevel = $scope.TamperDetectChartOptions.ThresholdLevel;
            }
        }
    },true);

    $scope.$watch('TamperDetectDurationSliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.TamperDetect !== undefined)
            {
                $scope.TamperDetect.Duration = $scope.TamperDetectDurationSliderModel.data;
            }
        }
    },true);

    $scope.$watch('TamperDetectSensitivitySliderModel.data', function(newValue, oldValue) {
        if(newValue)
        {
            if($scope.TamperDetect !== undefined)
            {
                $scope.TamperDetect.SensitivityLevel = $scope.TamperDetectSensitivitySliderModel.data;
            }
        }
    },true);

    var mStopMonotoringTamperingLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;
    function startMonitoringTamperingLevel()
    {
        (function update()
        {
            getTamperingLevel(function (data) {
                if(destroyInterrupt) return;
                var newTamperLevel = angular.copy(data);

                if (!mStopMonotoringTamperingLevel)
                {
                    var index = newTamperLevel.length;

                    if(newTamperLevel.length >= maxSample)
                    {
                        while(index--)
                        {
                            var level = validateLevel(newTamperLevel[index]);

                            if(level === null) continue;

                            if($scope.TamperDetectChartOptions.EnqueueData)
                            {
                                $scope.TamperDetectChartOptions.EnqueueData(level);
                            }
                        }
                    }
                    monitoringTimer = $timeout(update,300); //300 msec
                }
            });
        })();
    }

    function stopMonitoringTamperingLevel(){
        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringTamperingLevel();
    });

    var mLastSequenceLevel = 0;

    function validateLevel(tamperLevelObject)
    {  
        if(mLastSequenceLevel > tamperLevelObject.SequenceID)
        {
            return null;
        }

        mLastSequenceLevel = tamperLevelObject.SequenceID;

        return tamperLevelObject.Level;        
    }

    function getTamperingLevel(func)
    {       
        var newTamperLevel = {};

        var getData = {};

        getData.MaxSamples = maxSample;
        getData.EventSourceType = 'TamperingDetection';
        
        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

        return SunapiClient.get(sunapiURL, getData,
                function (response)
                {
                    newTamperLevel = angular.copy(response.data.TamperingDetection[0].Samples);
                    if (func !== undefined) {
                        func(newTamperLevel);
                    }
                },
                function (errorData)
                {
                    console.log("getTamperingLevel Error : ", errorData);
                    startMonitoringTamperingLevel();
                }, '', true);
    }    

    function initPTZUI () {
        $scope.supportPTZ = (AccountService.isPTZAble() || mAttr.isDigitalPTZ);
        $scope.ptzinfo = {
          type: (mAttr.isDigitalPTZ ? 'DPTZ' : 'PTZ')
        };        
    }

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes()
    {
        var defer = $q.defer();

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

        if (mAttr.TamperDetectThreshold !== undefined)
        {
            $scope.TamperDetectChartOptions.ceil = mAttr.TamperDetectThreshold.maxValue;
            $scope.TamperDetectChartOptions.floor = mAttr.TamperDetectThreshold.minValue;
        }

        if(mAttr.TamperDetectDuration !== undefined)
        {
            $scope.TamperDetectDurationSliderProperty.ceil = mAttr.TamperDetectDuration.maxValue;
            $scope.TamperDetectDurationSliderProperty.floor = mAttr.TamperDetectDuration.minValue;

            $scope.TamperDetectSensitivitySliderProperty.floor = mAttr.TamperDetectSensitivityLevel.minValue;
            $scope.TamperDetectSensitivitySliderProperty.ceil = mAttr.TamperDetectSensitivityLevel.maxValue;
        }

        if (mAttr.AlarmoutDurationOptions !== undefined)
        {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (Attributes.isSupportGoToPreset() === true)
        {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        $scope.EventActions = COMMONUtils.getSupportedEventActions("TamperingDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;

        defer.resolve("success");
        return defer.promise;
    }

    function refreshSlider()
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

    function getTamperDetection()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=view', getData,
                function (response)
                {
                    $scope.TamperDetect = response.data.TamperingDetection[0];
                    pageData.TamperDetect = angular.copy($scope.TamperDetect);

                    $scope.TamperDetectChartOptions.ThresholdLevel = $scope.TamperDetect.ThresholdLevel;
                    $scope.TamperDetectDurationSliderModel.data = $scope.TamperDetect.Duration;
                    $scope.TamperDetectSensitivitySliderModel.data = $scope.TamperDetect.SensitivityLevel;
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    function getEventRules()
    {
        var getData = {};

        getData.EventSource = 'TamperingDetection';

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
                function (response)
                {
                    prepareEventRules(response.data.EventRules);
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    function setTamperDetection()
    {
        var setData = {};

        setData.Channel = 0;

        if (pageData.TamperDetect.Enable !== $scope.TamperDetect.Enable)
        {
            setData.Enable = $scope.TamperDetect.Enable;
        }

        if (pageData.TamperDetect.ThresholdLevel !== $scope.TamperDetect.ThresholdLevel)
        {
            setData.ThresholdLevel = $scope.TamperDetect.ThresholdLevel;
        }

        if (pageData.TamperDetect.SensitivityLevel !== $scope.TamperDetect.SensitivityLevel)
        {
            setData.SensitivityLevel = $scope.TamperDetect.SensitivityLevel;
        }

        if (pageData.TamperDetect.Duration !== $scope.TamperDetect.Duration)
        {
            setData.Duration = $scope.TamperDetect.Duration;
        }

        if (pageData.TamperDetect.DarknessDetection !== $scope.TamperDetect.DarknessDetection)
        {
            setData.DarknessDetection = $scope.TamperDetect.DarknessDetection;
        }

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=set', setData,
                function (response)
                {
                    pageData.TamperDetect = angular.copy($scope.TamperDetect);
                },
                function (errorData)
                {
                    pageData.TamperDetect = angular.copy($scope.TamperDetect);
                    console.log(errorData);
                }, '', true);
    }

    $scope.setTamperDetectionEnable = function() {
        stopMonitoringTamperingLevel();
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

                setData.Channel = 0;

                if (pageData.TamperDetect.Enable !== $scope.TamperDetect.Enable)
                {
                    setData.Enable = $scope.TamperDetect.Enable;
                }

                return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=set', setData,
                    function ()
                    {
                        pageData.TamperDetect.Enable = angular.copy($scope.TamperDetect.Enable);
                    },
                    function (errorData)
                    {
                        $scope.TamperDetect.Enable = angular.copy(pageData.TamperDetect.Enable);
                        console.log(errorData);
                    }, '', true);
            },
            function ()
            {
                $scope.TamperDetect.Enable = angular.copy(pageData.TamperDetect.Enable);
            }
         ).finally(function(){
           startMonitoringTamperingLevel();
        });
    };

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
        return true;
    }

    function view(data)
    {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];

        promises.push(getTamperDetection);
        promises.push(getEventRules);
        promises.push(showVideo);
        promises.push(getTamperingLevel);

        $q.seqAll(promises).then(
                function () {
                    $scope.pageLoaded = true;
                    $timeout(setSizeChart);
                },
                function (errorData) {
                    console.log(errorData);
                }
        );
    }

    function set()
    {
        if (validatePage())
        {
            if (!angular.equals(pageData.TamperDetect, $scope.TamperDetect) || !angular.equals(pageData.EventRule, $scope.EventRule))
            {
                stopMonitoringTamperingLevel();
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

                    if (!angular.equals(pageData.TamperDetect, $scope.TamperDetect))
                    {
                        functionList.push(setTamperDetection);
                    }

                    if (!angular.equals(pageData.EventRule, $scope.EventRule))
                    {
                        functionList.push(setEventRules);
                    }

                    $q.seqAll(functionList).then(
                        function () {
                            view();

                        },
                        function (errorData) {
                            console.log(errorData);
                        }
                    ).finally(function(){
                        startMonitoringTamperingLevel();
                    });

                }, function ()
                {

                });
            }
        }
    }

    function inArray(arr, str) {
        for(var i = 0; i < arr.length; i++) {
            var tArray = arr[i].split(".");
            tArray = tArray[0] + "." + tArray[1];
            if(tArray == str){
                return i;
            }
        }
        return -1;
    }

    $scope.setColor = function (day, hour, isAlways)
    {
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
            {
                if (isAlways)
                {
                    return 'setMiniteFaded';
                } else
                {
                    return 'setMinite already-selected ui-selected';
                }
            }
        }

        if ($scope.EventRule.ScheduleIds.indexOf(day + '.' + hour) !== -1)
        {
            if (isAlways)
            {
                return 'setHourFaded';
            } else
            {
                return 'setHour already-selected ui-selected';
            }
        }
    };

    $scope.mouseOver = function (day, hour)
    {
        var index = inArray($scope.EventRule.ScheduleIds, day + '.' + hour);
        if(index !== -1) {
            $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[index].split('.');
        }
        // $scope.MouseOverMessage = [];
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        // {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0)
        //     {
        //         $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
        //         break;
        //     }
        // }
    };

    $scope.mouseLeave = function ()
    {
        $scope.MouseOverMessage = [];
    };

    $(document).ready(function ()
    {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $scope.getTooltipMessage = function ()
    {
        if (typeof $scope.MouseOverMessage !== 'undefined')
        {
            var hr, fr, to;

            if($scope.MouseOverMessage.length === 2) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = '00';
                var to = '59';
            } else if($scope.MouseOverMessage.length === 4) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[2], 2);
                var to = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[3], 2);
            } else {
                return;
            }

            return "(" + $translate.instant($scope.MouseOverMessage[0]) + ") " + hr + ":" + fr + " ~ " + hr + ":" + to;
        }
    };

    $scope.clearAll = function ()
    {
        $timeout(function(){
            $scope.EventRule.ScheduleIds = [];
        });
    };

    $scope.open = function (day, hour)
    {
        $scope.SelectedDay = day;
        $scope.SelectedHour = hour;

        $scope.SelectedFromMinute = 0;
        $scope.SelectedToMinute = 59;
        
        var index = inArray($scope.EventRule.ScheduleIds, day + '.' + hour);
        if(index !== -1){
            var str = $scope.EventRule.ScheduleIds[index].split('.');
            if (str.length === 4) {
                $scope.SelectedFromMinute = Math.round(str[2]);
                $scope.SelectedToMinute = Math.round(str[3]);
            }
        }
        
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        // {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
        //     {
        //         var str = $scope.EventRule.ScheduleIds[i].split('.');

        //         if (str.length === 4)
        //         {
        //             $scope.SelectedFromMinute = Math.round(str[2]);
        //             $scope.SelectedToMinute = Math.round(str[3]);
        //         }
        //         break;
        //     }
        // }

        var modalInstance = $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/common/schedulePopup.html',
            controller: 'modalInstanceCtrl',
            resolve: {
                SelectedDay: function ()
                {
                    return $scope.SelectedDay;
                },
                SelectedHour: function ()
                {
                    return $scope.SelectedHour;
                },
                SelectedFromMinute: function ()
                {
                    return $scope.SelectedFromMinute;
                },
                SelectedToMinute: function ()
                {
                    return $scope.SelectedToMinute;
                },
                Rule: function ()
                {
                    return $scope.EventRule;
                }
            }
        });

        modalInstance.result.then(function (selectedItem)
        {
            //console.log("Selected : ",selectedItem);
        }, function ()
        {
            //$log.info('Modal dismissed at: ' + new Date());
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
            getAttributes().finally(function () {
                view();
                startMonitoringTamperingLevel();
            });
        }
    })();
});
