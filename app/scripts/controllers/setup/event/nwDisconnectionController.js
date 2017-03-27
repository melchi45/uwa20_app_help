kindFramework.controller('nwDisconnectionCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, eventRuleService) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    $scope.EventSource = 'NetworkEvent';
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
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }
        $scope.EventActions = COMMONUtils.getSupportedEventActions("NetworkEvent");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
        defer.resolve("success");
        return defer.promise;
    }

    function getNetworkDisconnect() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=networkdisconnect&action=view', getData, function(response) {
            $scope.ND = response.data.NetworkDisconnect[0];
            pageData.ND = angular.copy($scope.ND);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setNetworkDisconnect() {
        var setData = {};
        setData.Channel = 0;
        setData.Enable = $scope.ND.Enable;
        
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=networkdisconnect&action=set', setData, function(response) {
            pageData.ND = angular.copy($scope.ND);
        }, function(errorData) {
            pageData.ND = angular.copy($scope.ND);
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
        promises.push(getNetworkDisconnect);

        if(promises.length > 0) {
            $q.seqAll(promises).then(function() {
                $scope.pageLoaded = true;
            }, function(errorData) {
                console.log(errorData);
            });
        } else {
            $scope.pageLoaded = true;
        }
    }

    function set() {
        var promises = [];
        if (validatePage()) {
            if (!angular.equals(pageData.ND, $scope.ND) || !angular.equals(pageData.EventRule, $scope.EventRule)) {
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
                    if (!angular.equals(pageData.ND, $scope.ND)) {
                        promises.push(setNetworkDisconnect);
                    }

                    if(promises.length > 0) {
                        $q.seqAll(promises).then(function(){
                            $scope.$emit('applied', true);
                            view();
                        }, function(){});
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