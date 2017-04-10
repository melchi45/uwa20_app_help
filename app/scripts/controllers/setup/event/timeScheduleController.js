kindFramework.controller('timeScheduleCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, eventRuleService) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    $scope.EventSource = 'Timer';
    $scope.EventRule = {};

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

    function getTimer() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=timer&action=view', getData, function(response) {
            $scope.Timer = response.data;
            pageData.Timer = angular.copy($scope.Timer);
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
        promises.push(getTimer);

        if(promises.length > 0) {
            $q.seqAll(promises).then(function() {
                $scope.pageLoaded = true;
            }, function(errorData) {
                console.log(errorData);
            });
        } else {
            $scope.pageLoaded = true;
            $scope.$emit('pageLoaded', $scope.EventSource);
        }
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
                    if(promises.length > 0) {
                        $q.seqAll(promises).then(function() {
                            $scope.$emit('applied', true);
                            view();
                        }, function(errorData) {});
                    } else {
                        $scope.$emit('applied', true);
                        view();
                    }
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