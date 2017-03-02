kindFramework.controller('defocusDetectionCtrl', function ($rootScope, $location, $scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();

    var pageData = {};

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

    function between(x, min, max) {
        return (x >= min && x <= max);
    }

    function getDefocusDetection()
    {
        var getData = {};

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

    function getEventRules()
    {
        var getData = {};

        getData.EventSource = 'DefocusDetection';

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

    $scope.SimpleFocusClickEventHandler = function() {
        if($scope.DefocusDetect.AutoSimpleFocus === true)
        {
            var msg = $translate.instant('lang_msg_simple_focus_activated');
            COMMONUtils.ShowDeatilInfo(msg,'','md');
        }
    };

    function setDefocusDetection()
    {
        var setData = {};

        setData.Channel = 0;

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
                        currentPage: 'DefocusDetection'
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
        promises.push(getEventRules);

        $q.seqAll(promises).then(
            function () {
                $timeout(function(){
                    $scope.pageLoaded = true;
                    $timeout(setSizeChart);
                });
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
            if (!angular.equals(pageData.DefocusDetect, $scope.DefocusDetect) || !angular.equals(pageData.EventRule, $scope.EventRule))
            {
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
                    var promises = [];

                    if (!angular.equals(pageData.DefocusDetect, $scope.DefocusDetect))
                    {
                        promises.push(setDefocusDetection);
                    }

                    if (!angular.equals(pageData.EventRule, $scope.EventRule))
                    {
                        promises.push(setEventRules);
                    }

                    if(promises.length > 0){
                        $q.seqAll(promises).then(function(){
                            view();
                        }, function(errorData){
                            console.error(errorData);
                        });
                    }
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
        if(index !== -1){
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

    var mStopMonotoringDefocusLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;
    function startMonitoringDefocusLevel()
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
                    monitoringTimer = $timeout(update,300); //300 msec
                }
            });
        })();
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

        var getData = {};

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
                    startMonitoringDefocusLevel();
                }, '', true);
    }

    function stopMonitoringDefocusLevel(){
        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringDefocusLevel();
    });

    $scope.submit = set;
    $scope.view = view;

    $scope.submitEnable = function(){
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
                Channel: 0,
                Enable: $scope.DefocusDetect.Enable
            };

            return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=defocusdetection&action=set', setData,
                    function (response)
                    {
                        pageData.DefocusDetect.Enable = $scope.DefocusDetect.Enable;
                    },
                    function (errorData)
                    {
                    }, '', true);
        }, function ()
        {
            $scope.DefocusDetect.Enable = pageData.DefocusDetect.Enable;
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
                startMonitoringDefocusLevel();
            });
        }
    })();
});
