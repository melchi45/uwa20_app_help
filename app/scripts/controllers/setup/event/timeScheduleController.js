kindFramework.controller('timeScheduleCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
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
        if (mAttr.ScheduleIntervalUnits !== undefined) {
            $scope.ScheduleIntervalUnits = mAttr.ScheduleIntervalUnits;
        }
        if (mAttr.ScheduleIntervalOptions !== undefined) {
            $scope.ScheduleIntervalOptions = mAttr.ScheduleIntervalOptions;
        }
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }
        $scope.EventActions = COMMONUtils.getSupportedEventActions("Timer");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
        defer.resolve("success");
        return defer.promise;
    }

    function prepareEventRules(eventRules) {
        $scope.EventRule = {};
        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;
        $scope.EventRule.Enable = eventRules[0].Enable;
        $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;
        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));
        $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;
        if (typeof eventRules[0].EventAction !== 'undefined') {
            if (eventRules[0].EventAction.indexOf('FTP') !== -1) {
                $scope.EventRule.FtpEnable = true;
            }
            if (eventRules[0].EventAction.indexOf('SMTP') !== -1) {
                $scope.EventRule.SmtpEnable = true;
            }
            if (eventRules[0].EventAction.indexOf('Record') !== -1) {
                $scope.EventRule.RecordEnable = true;
            }
        }
        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[0].AlarmOutputs === 'undefined') {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                var duration = 'Off';
                for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++) {
                    if (ao + 1 === eventRules[0].AlarmOutputs[j].AlarmOutput) {
                        duration = eventRules[0].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }
        if (typeof eventRules[0].PresetNumber === 'undefined') {
            $scope.EventRule.PresetNumber = 'Off';
        } else {
            $scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
        }
        pageData.EventRule = angular.copy($scope.EventRule);
    }

    function getTimer() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=timer&action=view', getData, function(response) {
            $scope.Timer = response.data;
            pageData.Timer = angular.copy($scope.Timer);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getEventRules() {
        var getData = {};
        getData.EventSource = 'Timer';
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
            prepareEventRules(response.data.EventRules);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setTimer() {
        var setData = {};
        if (pageData.Timer.Enable !== $scope.Timer.Enable) {
            setData.Enable = $scope.Timer.Enable;
        }
        if (pageData.Timer.ScheduleInterval !== $scope.Timer.ScheduleInterval) {
            setData.ScheduleInterval = $scope.Timer.ScheduleInterval;
        }
        if (pageData.Timer.ScheduleIntervalUnit !== $scope.Timer.ScheduleIntervalUnit) {
            setData.ScheduleIntervalUnit = $scope.Timer.ScheduleIntervalUnit;
        }
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=timer&action=set', setData, function(response) {}, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setEventRules() {
        var setData = {};
        setData.RuleIndex = $scope.EventRule.RuleIndex;
        setData.EventAction = "";
        if ($scope.EventRule.FtpEnable) {
            setData.EventAction += 'FTP,';
        }
        if ($scope.EventRule.SmtpEnable) {
            setData.EventAction += 'SMTP,';
        }
        if ($scope.EventRule.RecordEnable) {
            setData.EventAction += 'Record,';
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
            if ($scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRule.AlarmOutputs[ao].Duration;
            }
        }
        if ($scope.EventRule.PresetNumber !== 'Off') {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRule.PresetNumber;
        }
        if (setData.EventAction.length) {
            setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }
        setData.ScheduleType = $scope.EventRule.ScheduleType;
        //if ($scope.EventRule.ScheduleType === 'Scheduled')
        {
            var diff = $(pageData.EventRule.ScheduleIds).not($scope.EventRule.ScheduleIds).get();
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
            for (var s = 0; s < $scope.EventRule.ScheduleIds.length; s++) {
                var str = $scope.EventRule.ScheduleIds[s].split('.');
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
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData, function(response) {
            pageData.EventRule = angular.copy($scope.EventRule);
        }, function(errorData) {
            pageData.EventRule = angular.copy($scope.EventRule);
            console.log(errorData);
        }, '', true);
    }

    function validatePage() {
        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0) {
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
        promises.push(getTimer);
        promises.push(getEventRules);
        $q.seqAll(promises).then(function() {
            $scope.pageLoaded = true;
        }, function(errorData) {
            console.log(errorData);
        });
    }

    function set() {
        var promises = [];
        if (validatePage()) {
            if (!angular.equals(pageData.Timer, $scope.Timer) || !angular.equals(pageData.EventRule, $scope.EventRule)) {
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
                    if (!angular.equals(pageData.Timer, $scope.Timer)) {
                        promises.push(setTimer);
                    }
                    if (!angular.equals(pageData.EventRule, $scope.EventRule)) {
                        promises.push(setEventRules);
                    }
                    $q.seqAll(promises).then(function() {
                        view();
                    }, function(errorData) {});
                }, function() {});
            }
        }
    }

    $(document).ready(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $scope.clearAll = function() {
        $timeout(function() {
            $scope.EventRule.ScheduleIds = [];
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