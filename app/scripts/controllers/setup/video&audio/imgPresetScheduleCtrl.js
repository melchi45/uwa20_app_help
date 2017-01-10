kindFramework.controller('imgPresetScheduleCtrl', function ($scope, $uibModalInstance, $translate, Attributes, COMMONUtils, ImagePreset, $rootScope) {
    var mAttr = Attributes.get();
    var presetCnt = 0,
        from = '',
        to = '',
        schedule = {};

    $scope.resetScheduleTime = function(index) {
        /*var schedule = $scope.ImagePreset.Schedules[index];

        if ( schedule.Mode === 'Off' ) {
            schedule.SelectedFromHour = 0;
            schedule.SelectedFromMinute = 0;
            schedule.SelectedToHour = 0;
            schedule.SelectedToMinute = 0;
        }*/
        $scope.extendPreviewMode();
    };

    $scope.extendPreviewMode = function() {
        $rootScope.$broadcast('extendPreviewMode');
    };

    $scope.getTranslation = COMMONUtils.getTranslatedOption;

    $scope.HourOptions = [];
    for (var h = 0; h < mAttr.MaxHours; h++) {
        $scope.HourOptions.push(h);
    }

    $scope.MinuteOptions = [];
    for (var m = 0; m < mAttr.MaxMinutes; m++) {
        $scope.MinuteOptions.push(m);
    }

    if (mAttr.ImagePresetSchedModeOptions !== undefined) {
        $scope.ImagePresetSchedModeOptions = mAttr.ImagePresetSchedModeOptions;
    }

    $scope.ImagePreset = ImagePreset;

    function validatePage() {
        var i = 0,
            j = 0,
            temp = {};

        var timeNotSet = new Date(2000, 1, 1, 0, 0, 0).valueOf();

        /** Check if there are any duplicate schedules  */
        for (i = 0; i < $scope.ImagePreset.Schedules.length; i++) {
            schedule = $scope.ImagePreset.Schedules[i];

            /** If there is not schedule skip it */
            if (schedule.Mode === 'Off') {
                continue;
            }

            var baseStartTime = new Date(2000, 1, 1, schedule.SelectedFromHour, schedule.SelectedFromMinute, 0).valueOf();
            var baseEndTime = new Date(2000, 1, 1, schedule.SelectedToHour, schedule.SelectedToMinute, 0).valueOf();

            if (baseStartTime >= baseEndTime) {
                COMMONUtils.ShowError("lang_msg_invalid_time");
                return false;
            }

            for (j = i + 1; j < $scope.ImagePreset.Schedules.length; j++) {

                temp = $scope.ImagePreset.Schedules[j];
                var compareStartTime = new Date(2000, 1, 1, temp.SelectedFromHour, temp.SelectedFromMinute, 0).valueOf();
                var compareEndTime = new Date(2000, 1, 1, temp.SelectedToHour, temp.SelectedToMinute, 0).valueOf();

                /** If there is not schedule skip it */
                if (temp.Mode === 'Off') {
                    continue;
                }

                if ((baseStartTime <= compareStartTime && compareStartTime <= baseEndTime) || (baseStartTime <= compareEndTime && compareEndTime <= baseEndTime)) {
                    COMMONUtils.ShowError('lang_msg_preset_duplicate');
                    return false;
                }

                if ((compareStartTime <= baseStartTime && baseStartTime <= compareEndTime) || (compareStartTime <= baseEndTime && baseEndTime <= compareEndTime)) {
                    COMMONUtils.ShowError('lang_msg_preset_duplicate');
                    return false;
                }
            }
        }
        return true;
    }

    function updatePresetSchedule() {
        var i = 0,
            temp;
        for (i = 0; i < $scope.ImagePreset.Schedules.length; i++) {
            schedule = $scope.ImagePreset.Schedules[i];

            if (schedule.Mode !== 'Off') {
                temp = '';

                temp = COMMONUtils.getFormatedInteger(schedule.SelectedFromHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedFromMinute, 2);
                temp += '-';
                temp += COMMONUtils.getFormatedInteger(schedule.SelectedToHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedToMinute, 2);
                schedule.EveryDay.FromTo = temp;
            }
        }
    }

    $scope.ok = function () {
        if (validatePage() === true) {
            updatePresetSchedule();
            $uibModalInstance.close('ok');
        }
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
