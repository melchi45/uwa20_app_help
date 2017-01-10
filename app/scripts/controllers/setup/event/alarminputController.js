kindFramework.controller('alarminputCtrl', function($scope, $location, $rootScope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    $scope.AlarmData = {};
    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes() {
        var defer = $q.defer();
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        if (mAttr.EnableOptions !== undefined) {
            $scope.EnableOptions = mAttr.EnableOptions;
        }
        if (mAttr.ActivateOptions !== undefined) {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }
        if (mAttr.WeekDays !== undefined) {
            $scope.WeekDays = mAttr.WeekDays;
        }
        $scope.EventActions = [];
        $scope.AlarmInputOptions = [];
        for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
            $scope.AlarmInputOptions.push(ai + 1);
            $scope.EventActions[ai] = [];
            $scope.EventActions[ai] = COMMONUtils.getSupportedEventActions("AlarmInput." + (ai + 1));
        }
        if (mAttr.AlarmInputStateOptions !== undefined) {
            $scope.AlarmInputStateOptions = mAttr.AlarmInputStateOptions;
        }
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }
        /*if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }*/
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
        defer.resolve("success");
        return defer.promise;
    }

    function getAlarmInputs() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=alarminput&action=view', getData, function(response) {
            $scope.AlarmInputs = response.data.AlarmInputs;
            pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function cameraView() {
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', '', function(response) {
            $scope.Camera = response.data.Camera[0];
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function prepareEventRules(eventRules) {
        $scope.EventRules = [];
        for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
            var mRule = {};
            mRule.FtpEnable = false;
            mRule.SmtpEnable = false;
            mRule.RecordEnable = false;
            var sourceName = 'AlarmInput.' + (ai + 1);
            for (var i = 0; i < eventRules.length; i++) {
                if (eventRules[i].EventSource === sourceName) {
                    mRule.Enable = eventRules[i].Enable;
                    mRule.RuleIndex = eventRules[i].RuleIndex;
                    mRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[i].Schedule));
                    mRule.ScheduleType = eventRules[i].ScheduleType;
                    if (typeof eventRules[i].EventAction !== 'undefined') {
                        if (eventRules[i].EventAction.indexOf('FTP') !== -1) {
                            mRule.FtpEnable = true;
                        }
                        if (eventRules[i].EventAction.indexOf('SMTP') !== -1) {
                            mRule.SmtpEnable = true;
                        }
                        if (eventRules[i].EventAction.indexOf('Record') !== -1) {
                            mRule.RecordEnable = true;
                        }
                    }
                    mRule.AlarmOutputs = [];
                    if (typeof eventRules[i].AlarmOutputs === 'undefined') {
                        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                            mRule.AlarmOutputs[ao] = {};
                            mRule.AlarmOutputs[ao].Duration = 'Off';
                        }
                    } else {
                        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                            mRule.AlarmOutputs[ao] = {};
                            var duration = 'Off';
                            for (var j = 0; j < eventRules[i].AlarmOutputs.length; j++) {
                                if (ao + 1 === eventRules[i].AlarmOutputs[j].AlarmOutput) {
                                    duration = eventRules[i].AlarmOutputs[j].Duration;
                                    break;
                                }
                            }
                            mRule.AlarmOutputs[ao].Duration = duration;
                        }
                    }
                    if (typeof eventRules[i].PresetNumber === 'undefined') {
                        mRule.PresetNumber = 'Off';
                    } else {
                        mRule.PresetNumber = eventRules[i].PresetNumber + '';
                    }
                    $scope.EventRules.push(mRule);
                    break;
                }
            }
        }
        pageData.EventRules = angular.copy($scope.EventRules);
    }

    function getEventRules() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
            prepareEventRules(response.data.EventRules);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getSelectedAlarm() {
        if (typeof mAttr.DefaultAlarmIndex === 'undefined') {
            $scope.AlarmData.SelectedAlarm = 0;
        } else {
            $scope.AlarmData.SelectedAlarm = mAttr.DefaultAlarmIndex;
            Attributes.setDefaultAlarmIndex(0);
        }
    }

    function setAlarmInputs(i) {
        var setData = {};
        setData["AlarmInput." + (i + 1) + ".Enable"] = $scope.AlarmInputs[i].Enable;
        setData["AlarmInput." + (i + 1) + ".State"] = $scope.AlarmInputs[i].State;

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=alarminput&action=set',setData, function(response) {}, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setEventRules(i) {
        var setData = {};
        setData.RuleIndex = $scope.EventRules[i].RuleIndex;
        setData.EventAction = "";
        if ($scope.EventRules[i].FtpEnable) {
            setData.EventAction += 'FTP,';
        }
        if ($scope.EventRules[i].SmtpEnable) {
            setData.EventAction += 'SMTP,';
        }
        if ($scope.EventRules[i].RecordEnable) {
            setData.EventAction += 'Record,';
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
            if ($scope.EventRules[i].AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRules[i].AlarmOutputs[ao].Duration;
            }
        }
        if ($scope.EventRules[i].PresetNumber !== 'Off') {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRules[i].PresetNumber;
        }
        if (setData.EventAction.length) {
            setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }
        setData.ScheduleType = $scope.EventRules[i].ScheduleType;
        //if ($scope.EventRules[i].ScheduleType === 'Scheduled')
        {
            var diff = $(pageData.EventRules[i].ScheduleIds).not($scope.EventRules[i].ScheduleIds).get();
            var sun = 0,
                mon = 0,
                tue = 0,
                wed = 0,
                thu = 0,
                fri = 0,
                sat = 0;
            for (var s = 0; s < diff.length; s++) {
                var str = diff[s].split('.');
                for (var d = 0; d < mAttr.WeekDays.length; d++) {
                    if (str[0] === mAttr.WeekDays[d]) {
                        switch (d) {
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
            for (var s = 0; s < $scope.EventRules[i].ScheduleIds.length; s++) {
                var str = $scope.EventRules[i].ScheduleIds[s].split('.');
                for (var d = 0; d < mAttr.WeekDays.length; d++) {
                    if (str[0] === mAttr.WeekDays[d]) {
                        switch (d) {
                            case 0:
                                sun = 1;
                                setData["SUN" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 1:
                                mon = 1;
                                setData["MON" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 2:
                                tue = 1;
                                setData["TUE" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 3:
                                wed = 1;
                                setData["WED" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 4:
                                thu = 1;
                                setData["THU" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 5:
                                fri = 1;
                                setData["FRI" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            case 6:
                                sat = 1;
                                setData["SAT" + str[1]] = 1;
                                if (str.length === 4) {
                                    setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
            if (sun) {
                setData.SUN = 1;
            }
            if (mon) {
                setData.MON = 1;
            }
            if (tue) {
                setData.TUE = 1;
            }
            if (wed) {
                setData.WED = 1;
            }
            if (thu) {
                setData.THU = 1;
            }
            if (fri) {
                setData.FRI = 1;
            }
            if (sat) {
                setData.SAT = 1;
            }
        }
        var reqData = setData;
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', reqData, function(response) {}, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function validatePage() {
        for (var i = 0; i < $scope.EventRules.length; i++) {
            if ($scope.EventRules[i].ScheduleType === 'Scheduled' && $scope.EventRules[i].ScheduleIds.length === 0) {
                COMMONUtils.ShowError('lang_msg_checkthetable');
                return false;
            }
        }
        return true;
    }

    function checkDayNightModeDependency() {
        if ($scope.Camera !== undefined) {
            if (mAttr.MaxAlarmInput === 0 || $scope.Camera.DayNightMode === 'ExternalBW') {
                $location.path($rootScope.monitoringPath);
            }
        }
    }

    function view(data) {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];
        promises.push(getAlarmInputs);
        promises.push(getEventRules);
        promises.push(cameraView);
        getSelectedAlarm();
        $q.seqAll(promises).then(function() {
            checkDayNightModeDependency();
            $scope.pageLoaded = true;
        }, function(errorData) {
            console.log(errorData);
        });
    }

    function set() {
        var promises = [];
        if (validatePage()) {
            if (!angular.equals(pageData.AlarmInputs, $scope.AlarmInputs) || !angular.equals(pageData.EventRules, $scope.EventRules)) {
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
                    if (!angular.equals(pageData.AlarmInputs, $scope.AlarmInputs)) {
                        $scope.EventRules.forEach(function(elem, index){
                            if (!angular.equals(pageData.AlarmInputs[index], $scope.AlarmInputs[index])) {
                                promises.push(function() { return setAlarmInputs(index); });
                            }
                        });
                    }
                    if (!angular.equals(pageData.EventRules, $scope.EventRules)) {
                        $scope.EventRules.forEach(function(elem, index){
                            if (!angular.equals(pageData.EventRules[index], $scope.EventRules[index])) {
                                promises.push(function() { return setEventRules(index); });
                            }
                        });
                    }
                    $q.seqAll(promises).then(function() {
                        pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
                        pageData.EventRules = angular.copy($scope.EventRules);
                        view();
                    }, function(errorData) {});
                }, function() {});
            }
        }
    }

    function inArray(arr, str) {
        for(var i = 0; i < arr.length; i++) {
            var tArray = arr[i].split(".");
            tArray = tArray[0] + "." + tArray[1];
            if(tArray === str){
                return i;
            }
        }
        return -1;
    }

    $scope.setColor = function(day, hour, isAlways) {
        var index = parseInt($scope.AlarmData.SelectedAlarm);
        for (var i = 0; i < $scope.EventRules[index].ScheduleIds.length; i++) {
            if ($scope.EventRules[index].ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
                if (isAlways) {
                    return 'setMiniteFaded';
                } else {
                    return 'setMinite already-selected ui-selected';
                }
            }
        }
        if ($scope.EventRules[index].ScheduleIds.indexOf(day + '.' + hour) !== -1) {
            if (isAlways) {
                return 'setHourFaded';
            } else {
                return 'setHour already-selected ui-selected';
            }
        }
    };
    $scope.mouseOver = function(day, hour) {
        var index = parseInt($scope.AlarmData.SelectedAlarm);
        var tIndex = inArray($scope.EventRules[index].ScheduleIds, day + '.' + hour);
        if(tIndex !== -1) {
            $scope.MouseOverMessage = $scope.EventRules[index].ScheduleIds[tIndex].split('.');
        }
        // $scope.MouseOverMessage = [];
        // for (var i = 0; i < $scope.EventRules[index].ScheduleIds.length; i++) {
        //     if ($scope.EventRules[index].ScheduleIds[i].indexOf(day + '.' + hour) >= 0) {
        //         $scope.MouseOverMessage = $scope.EventRules[index].ScheduleIds[i].split('.');
        //         break;
        //     }
        // }
    };
    $scope.mouseLeave = function() {
        $scope.MouseOverMessage = [];
    };
    $(document).ready(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });
    $scope.getTooltipMessage = function() {
        if (typeof $scope.MouseOverMessage !== 'undefined') {
            var hr, fr, to;
            if ($scope.MouseOverMessage.length === 2) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = '00';
                var to = '59';
            } else if ($scope.MouseOverMessage.length === 4) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[2], 2);
                var to = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[3], 2);
            } else {
                return;
            }
            return "(" + $translate.instant($scope.MouseOverMessage[0]) + ") " + hr + ":" + fr + " ~ " + hr + ":" + to;
        }
    };
    $scope.clearAll = function() {
        $timeout(function() {
            var index = parseInt($scope.AlarmData.SelectedAlarm);
            $scope.EventRules[index].ScheduleIds = [];
        });
    };
    $scope.open = function(day, hour) {
        $scope.SelectedDay = day;
        $scope.SelectedHour = hour;
        $scope.SelectedFromMinute = 0;
        $scope.SelectedToMinute = 59;
        var index = parseInt($scope.AlarmData.SelectedAlarm);
        var tIndex = inArray($scope.EventRules[index].ScheduleIds, day + '.' + hour);
        if(tIndex !== -1) {
            var str = $scope.EventRules[index].ScheduleIds[tIndex].split('.');

            if (str.length === 4)
            {
                $scope.SelectedFromMinute = Math.round(str[2]);
                $scope.SelectedToMinute = Math.round(str[3]);
            }
        }
        // for (var i = 0; i < $scope.EventRules[index].ScheduleIds.length; i++) {
        //     if ($scope.EventRules[index].ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
        //         var str = $scope.EventRules[index].ScheduleIds[i].split('.');
        //         if (str.length === 4) {
        //             $scope.SelectedFromMinute = Math.round(str[2]);
        //             $scope.SelectedToMinute = Math.round(str[3]);
        //         }
        //         break;
        //     }
        // }
        var modalInstance = $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/common/schedulePopup.html',
            controller: 'alarmScheduleCtrl',
            resolve: {
                SelectedDay: function() {
                    return $scope.SelectedDay;
                },
                SelectedHour: function() {
                    return $scope.SelectedHour;
                },
                SelectedFromMinute: function() {
                    return $scope.SelectedFromMinute;
                },
                SelectedToMinute: function() {
                    return $scope.SelectedToMinute;
                },
                SelectedAlarm: function() {
                    return index;
                },
                Rules: function() {
                    return $scope.EventRules;
                }
            }
        });
        modalInstance.result.then(function(selectedItem) {
            //console.log("Selected : ",selectedItem);
        }, function() {
            //$log.info('Modal dismissed at: ' + new Date());
        });
    };
    $scope.submit = set;
    $scope.view = view;
    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function() {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().finally(function() {
                view();
            });
        }
    })();
});