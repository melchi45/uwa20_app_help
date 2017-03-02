/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('fogDetectionCtrl', function ($scope, SunapiClient, XMLParser, Attributes,COMMONUtils, $timeout, CameraSpec, $interval, $q, ConnectionSettingService, kindStreamInterface, SessionOfUserManager, AccountService, $uibModal, $rootScope, $translate) {
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
                    monitoringTimer = $timeout(update, 300); //300 msec
                }
            });
        })();
    }

    function stopMonitoringFogLevel(){
        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
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
                    startMonitoringFogLevel();
                }, '', true);
    }     

    function getFogDetection()
    {
        var getData = {};

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

        setData.Channel = 0;

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
        stopMonitoringFogLevel();
        var successCallback = function (){
            var setData = {};

            setData.Channel = 0;

            if (pageData.FogDetect.Enable !== $scope.FogDetect.Enable)
            {
                setData.Enable = $scope.FogDetect.Enable;
            }

            return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=fogdetection&action=set', setData,
                function (response)
                {
                    pageData.FogDetect.Enable = angular.copy($scope.FogDetect.Enable);
                    startMonitoringFogLevel();
                },
                function (errorData)
                {
                    $scope.FogDetect.Enable = angular.copy(pageData.FogDetect.Enable);
                    startMonitoringFogLevel();
                    console.log(errorData);
                }, '', true);
        };
        var errorCallback = function ()
        {
            $scope.FogDetect.Enable = angular.copy(pageData.FogDetect.Enable);
            startMonitoringFogLevel();
        };

        COMMONUtils.ShowConfirmation(successCallback, 'lang_apply_question','sm', errorCallback);
    };

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

    function getEventRules()
    {
        var getData = {};

        getData.EventSource = 'FogDetection';

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

    function setEventRules()
    {
        var setData = {};

        setData.RuleIndex = $scope.EventRule.RuleIndex;
        setData.EventSource = "FogDetection";

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

    function getAttributes() {
        var defer = $q.defer();

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
        $scope.MouseOverMessage = [];
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0)
            {
                $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
                break;
            }
        }
    };

    $scope.mouseLeave = function ()
    {
        $scope.MouseOverMessage = [];
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
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
            {
                var str = $scope.EventRule.ScheduleIds[i].split('.');

                if (str.length === 4)
                {
                    $scope.SelectedFromMinute = Math.round(str[2]);
                    $scope.SelectedToMinute = Math.round(str[3]);
                }
                break;
            }
        }

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

    function validatePage()
    {
        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0)
        {
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
        promises.push(getEventRules);

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                $("#imagepage").show();
                $timeout(setSizeChart);
            },
            function(errorData){
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
            COMMONUtils.ApplyConfirmation(saveSettings);    
        }
    }

    function saveSettings() {
        var functionList = [];

        if (!angular.equals(pageData.FogDetect, $scope.FogDetect) || !angular.equals(pageData.EventRule, $scope.EventRule))
        {
            stopMonitoringFogLevel();
            if (!angular.equals(pageData.FogDetect, $scope.FogDetect))
            {
                functionList.push(setFogDetection);
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
                startMonitoringFogLevel();
            });
        }
    }


    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes();
            view();
            startMonitoringFogLevel();
        }
    })();

    $scope.submit = set;
    $scope.view = view;
});
