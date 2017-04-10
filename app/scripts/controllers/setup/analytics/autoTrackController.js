kindFramework.controller('autoTrackEventCtrl', function ($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, eventRuleService)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();

    var pageData = {};

    $scope.EventSource = 'Tracking';

    $scope.EventRule = {};

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes()
    {
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

        $scope.EventActions = COMMONUtils.getSupportedEventActions("Tracking");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    }

    function validatePage() {
        if(!eventRuleService.checkSchedulerValidation()) {
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
        getAttributes();
                $scope.pageLoaded = true;
            }

    function set()
    {
        if (validatePage())
        {
            COMMONUtils.ApplyConfirmation(function() {
                $scope.applied = true;
            });
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
            view();
        }
    })();
});