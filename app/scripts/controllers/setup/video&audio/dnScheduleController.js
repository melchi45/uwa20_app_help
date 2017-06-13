kindFramework.controller('dnScheduleCtrl', function($scope, $uibModalInstance, $translate, Attributes, COMMONUtils, selectedDay, camera) {
  var mAttr = Attributes.get();

  $scope.SelectedDay = selectedDay;

  $scope.getTranslation = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  $scope.HourOptions = [];
  for (var h = 0; h < mAttr.MaxHours; h++) {
    $scope.HourOptions.push(h);
  }

  $scope.MinuteOptions = [];
  for (var m = 0; m < mAttr.MaxMinutes; m++) {
    $scope.MinuteOptions.push(m);
  }

  function parseStartEndTime() {
    var day = {};
    if (typeof camera.DayNightModeSchedules !== "undefined") {
      if (camera.DayNightModeSchedules.hasOwnProperty(selectedDay)) {
        day = camera.DayNightModeSchedules[selectedDay];
      }

      var timelist = day.FromTo.split('-'),
        fromlist = [],
        toList = [];

      if (timelist.length > 0) {
        fromlist = timelist[0].split(':');
        toList = timelist[1].split(':');
      }

      if (fromlist.length > 0) {
        $scope.SelectedFromHour = parseInt(fromlist[0], 10);
        $scope.SelectedFromMinute = parseInt(fromlist[1], 10);
      }

      if (toList.length > 0) {
        $scope.SelectedToHour = parseInt(toList[0], 10);
        $scope.SelectedToMinute = parseInt(toList[1], 10);
      }

    } else {
      $scope.SelectedFromHour = 0;
      $scope.SelectedFromMinute = 0;
      $scope.SelectedToHour = 23;
      $scope.SelectedToMinute = 59;
    }
  }


  parseStartEndTime();

  function validatePage() {
    var compareStartTime = new Date(2000, 1, 1, $scope.SelectedFromHour, $scope.SelectedFromMinute, 0).valueOf();
    var compareEndTime = new Date(2000, 1, 1, $scope.SelectedToHour, $scope.SelectedToMinute, 0).valueOf();

    if (compareStartTime > compareEndTime) {
      document.getElementById('selectedToHour').focus();
      if ($scope.SelectedFromHour >= $scope.SelectedToHour) {
        document.getElementById('selectedToHour').focus();
        if (($scope.SelectedFromHour === $scope.SelectedToHour) && ($scope.SelectedFromMinute > $scope.SelectedToMinute)) {
          document.getElementById('selectedToMinute').focus();
        }
      }
      COMMONUtils.ShowError("lang_msg_invalid_activation_time");
      return false;
    }
    return true;
  }

  $scope.ok = function() {
    if (validatePage() === true) {
      var day = {};
      if (typeof camera.DayNightModeSchedules !== "undefined") {
        if (camera.DayNightModeSchedules.hasOwnProperty(selectedDay)) {
          day = camera.DayNightModeSchedules[selectedDay];
          day.FromTo = COMMONUtils.getFormatedInteger($scope.SelectedFromHour, 2) + ':' + COMMONUtils.getFormatedInteger($scope.SelectedFromMinute, 2) +
            '-' + COMMONUtils.getFormatedInteger($scope.SelectedToHour, 2) + ':' + COMMONUtils.getFormatedInteger($scope.SelectedToMinute, 2);

          if ((selectedDay === 'EveryDay') && (day.DayNightSchedule === true)) {

            $.each(camera.DayNightModeSchedules, function(key, value) {

              if (key === 'EveryDay') {
                return;
              }
              value.FromTo = day.FromTo;
            });
          }

        }
      }
      $uibModalInstance.close('ok');
    }
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});

kindFramework.controller('heaterScheduleCtrl', function($scope, $uibModalInstance, $translate, Attributes, COMMONUtils, selectedDay, heater) {
  var mAttr = Attributes.get();

  $scope.SelectedDay = selectedDay;

  $scope.getTranslation = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  $scope.HourOptions = [];
  for (var h = 0; h < mAttr.MaxHours; h++) {
    $scope.HourOptions.push(h);
  }

  $scope.MinuteOptions = [];
  for (var m = 0; m < mAttr.MaxMinutes; m++) {
    $scope.MinuteOptions.push(m);
  }

  function parseStartEndTime() {
    var day = {};
    if (typeof heater !== "undefined") {
      if (heater.hasOwnProperty(selectedDay)) {
        day = heater[selectedDay];
      }

      var timelist = day.FromTo.split('-'),
        fromlist = [],
        toList = [];

      if (timelist.length > 0) {
        fromlist = timelist[0].split(':');
        toList = timelist[1].split(':');
      }

      if (fromlist.length > 0) {
        $scope.SelectedFromHour = parseInt(fromlist[0], 10);
        $scope.SelectedFromMinute = parseInt(fromlist[1], 10);
      }

      if (toList.length > 0) {
        $scope.SelectedToHour = parseInt(toList[0], 10);
        $scope.SelectedToMinute = parseInt(toList[1], 10);
      }

    } else {
      $scope.SelectedFromHour = 0;
      $scope.SelectedFromMinute = 0;
      $scope.SelectedToHour = 23;
      $scope.SelectedToMinute = 59;
    }
  }


  parseStartEndTime();

  function validatePage() {
    var compareStartTime = new Date(2000, 1, 1, $scope.SelectedFromHour, $scope.SelectedFromMinute, 0).valueOf();
    var compareEndTime = new Date(2000, 1, 1, $scope.SelectedToHour, $scope.SelectedToMinute, 0).valueOf();

    if (compareEndTime <= compareStartTime) {
      COMMONUtils.ShowError("lang_msg_invalid_activation_time");
      return false;
    }

    return true;
  }

  $scope.ok = function() {
    if (validatePage() === true) {
      var day = {};
      if (typeof heater !== "undefined") {
        if (heater.hasOwnProperty(selectedDay)) {
          day = heater[selectedDay];
          day.FromTo = COMMONUtils.getFormatedInteger($scope.SelectedFromHour, 2) + ':' + COMMONUtils.getFormatedInteger($scope.SelectedFromMinute, 2) +
            '-' + COMMONUtils.getFormatedInteger($scope.SelectedToHour, 2) + ':' + COMMONUtils.getFormatedInteger($scope.SelectedToMinute, 2);

          if ((selectedDay === 'EveryDay') && (day.Enable === true)) {

            $.each(heater, function(key, value) {

              if (key === 'EveryDay') {
                return;
              }
              value.FromTo = day.FromTo;
            });
          }

        }
      }
      $uibModalInstance.close('ok');
    }
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
});