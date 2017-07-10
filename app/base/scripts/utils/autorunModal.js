kindFramework.
controller('autorunModalCtrl', function($scope, $uibModalInstance, $translate, Attributes, 
COMMONUtils, SelectedDay, SelectedHour, AutoRunScheduler) {
  'use strict';
  var mAttr = Attributes.get();
  $scope.OnlyNumStr = mAttr.OnlyNumStr;

  var pageData = {};

  function initialize() {
    $scope.WeekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    $scope.MaxPreset = mAttr.MaxPreset;
    $scope.MaxGroupCount = mAttr.MaxGroupCount;
    $scope.MaxTraceCount = mAttr.MaxTraceCount;
    $scope.PresetOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxPreset);
    $scope.GroupOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxGroupCount);
    $scope.TraceOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxTraceCount);

    if (typeof mAttr.AutoPanSpeed !== "undefined") {
      $scope.AutoPanMinSpeed = mAttr.AutoPanSpeed.minValue;
      $scope.AutoPanMaxSpeed = mAttr.AutoPanSpeed.maxValue;
    }

    if (typeof mAttr.AutoPanTiltAngle !== "undefined") {
      $scope.AutoPanTiltMinAngle = mAttr.AutoPanTiltAngle.minValue;
      $scope.AutoPanTiltMaxAngle = mAttr.AutoPanTiltAngle.maxValue;
    }

    if (typeof mAttr.AutoRunScheduleModes !== "undefined") {
      $scope.AutoRunScheduleModes = mAttr.AutoRunScheduleModes;
    }

    if (typeof mAttr.SwingModes !== "undefined") {
      $scope.SwingModes = mAttr.SwingModes;
    }

    $scope.FromDay = SelectedDay;
    $scope.ToDay = SelectedDay;
    pageData.ToDay = $scope.ToDay;

    $scope.FromOptions = [];
    $scope.ToOptions = [];
    for (var hour = 0; hour < mAttr.MaxHours; hour++) {
      var fromOption = COMMONUtils.getFormatedInteger(hour, 2) + ':00';
      $scope.FromOptions.push(fromOption);

      var toOption = COMMONUtils.getFormatedInteger(hour, 2) + ':59';
      $scope.ToOptions.push(toOption);

      if (SelectedHour === hour) {
        $scope.FromTime = fromOption;
        $scope.ToTime = toOption;
        pageData.ToTime = $scope.ToTime;
      }
    }

    $scope.AutoRunScheduler = AutoRunScheduler;
    $scope.SelectedSchedule = angular.copy($scope.AutoRunScheduler[SelectedDay][SelectedHour]);
    pageData.SelectedSchedule = angular.copy($scope.SelectedSchedule);
  }

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function validatePage() {
    if ($scope.SelectedSchedule.Mode === 'Preset') {
      if ((typeof $scope.SelectedSchedule.Preset === 'undefined') || 
          ($scope.SelectedSchedule.Preset < 1) || 
          ($scope.SelectedSchedule.Preset > mAttr.MaxPreset)) {
        COMMONUtils.ShowError($translate.instant('lang_range_alert').
                              replace('%1', 1).replace('%2', mAttr.MaxPreset));
        return false;
      }
    }

    if ($scope.SelectedSchedule.Mode === 'Group') {
      if ((typeof $scope.SelectedSchedule.Group === 'undefined') || 
          ($scope.SelectedSchedule.Group < 1) || 
          ($scope.SelectedSchedule.Group > $scope.MaxGroupCount)) {
        COMMONUtils.ShowError($translate.instant('lang_range_alert').
                              replace('%1', 1).replace('%2', $scope.MaxGroupCount));
        return false;
      }
    }

    if ($scope.SelectedSchedule.Mode === 'Trace') {
      if ((typeof $scope.SelectedSchedule.Trace === 'undefined') || 
          ($scope.SelectedSchedule.Trace < 1) || 
          ($scope.SelectedSchedule.Trace > $scope.MaxTraceCount)) {
        COMMONUtils.ShowError($translate.instant('lang_range_alert').
                              replace('%1', 1).replace('%2', $scope.MaxTraceCount));
        return false;
      }
    }

    if ($scope.SelectedSchedule.Mode === 'AutoPan') {
      if ((typeof $scope.SelectedSchedule.AutoPanSpeed === 'undefined') || 
          ($scope.SelectedSchedule.AutoPanSpeed === '') || 
          ($scope.SelectedSchedule.AutoPanSpeed < $scope.AutoPanMinSpeed) || 
          ($scope.SelectedSchedule.AutoPanSpeed > $scope.AutoPanMaxSpeed)) {
        COMMONUtils.ShowError($translate.instant('lang_range_alert').
                              replace('%1', $scope.AutoPanMinSpeed).
                              replace('%2', $scope.AutoPanMaxSpeed));
        return false;
      }

      if ((typeof $scope.SelectedSchedule.AutoPanTiltAngle === 'undefined') || 
          ($scope.SelectedSchedule.AutoPanTiltAngle === '') || 
          ($scope.SelectedSchedule.AutoPanTiltAngle < $scope.AutoPanTiltMinAngle) || 
          ($scope.SelectedSchedule.AutoPanTiltAngle > $scope.AutoPanTiltMaxAngle)) {
        COMMONUtils.ShowError($translate.instant('lang_range_alert').
                    replace('%1', $scope.AutoPanTiltMinAngle).
                    replace('%2', $scope.AutoPanTiltMaxAngle));
        return false;
      }
    }

    return true;
  }

  $scope.apply = function() {
    if (validatePage()) {
      if (!angular.equals(pageData.SelectedSchedule, $scope.SelectedSchedule) || 
        pageData.ToDay !== $scope.ToDay || pageData.ToTime !== $scope.ToTime) {
        var fdIndex = $scope.WeekDays.indexOf($scope.FromDay);
        var ftIndex = $scope.FromOptions.indexOf($scope.FromTime);

        var tdIndex = $scope.WeekDays.indexOf($scope.ToDay);
        var ttIndex = $scope.ToOptions.indexOf($scope.ToTime);

        var day=0, hour=0;

        if (fdIndex === tdIndex) {
          if (ftIndex > ttIndex) {
            for (day = 0; day < $scope.WeekDays.length; day++) {
              if (day === fdIndex) {
                for (hour = 0; hour <= ttIndex; hour++) {
                  $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
                }
                for (hour = ftIndex; hour < mAttr.MaxHours; hour++) {
                  $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
                }
              } else {
                for (hour = 0; hour < mAttr.MaxHours; hour++) {
                  $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
                }
              }
            }
          } else {
            for (hour = ftIndex; hour <= ttIndex; hour++) {
              $scope.AutoRunScheduler[$scope.ToDay][hour] = $scope.SelectedSchedule;
            }
          }
        } else if (fdIndex < tdIndex) {
          for (day = fdIndex; day <= tdIndex; day++) {
            if (day === fdIndex) {
              for (hour = ftIndex; hour < mAttr.MaxHours; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            } else if (day === tdIndex) {
              for (hour = 0; hour <= ttIndex; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            } else {
              for (hour = 0; hour < mAttr.MaxHours; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            }
          }
        } else if (fdIndex > tdIndex) {
          for (day = fdIndex; day < $scope.WeekDays.length; day++) {
            if (day === fdIndex) {
              for ( hour = ftIndex; hour < mAttr.MaxHours; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            } else if (day === tdIndex) {
              for (hour = 0; hour <= ttIndex; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            } else {
              for (hour = 0; hour < mAttr.MaxHours; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            }
          }

          for (day = 0; day <= tdIndex; day++) {
            if (day === tdIndex) {
              for (hour = 0; hour <= ttIndex; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            } else {
              for (hour = 0; hour < mAttr.MaxHours; hour++) {
                $scope.AutoRunScheduler[$scope.WeekDays[day]][hour] = $scope.SelectedSchedule;
              }
            }
          }
        }
      }
      $uibModalInstance.close($scope.AutoRunScheduler);
    }
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  initialize();
});