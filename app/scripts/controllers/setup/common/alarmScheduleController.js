kindFramework.controller('alarmScheduleCtrl', function($scope, $uibModalInstance, Attributes, SelectedDay, SelectedHour, SelectedFromMinute, SelectedToMinute, SelectedAlarm, Rules, COMMONUtils) {
  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();

  var pageData = {};

  $scope.SelectedDay = SelectedDay;
  $scope.SelectedHour = SelectedHour;
  pageData.SelectedFromMinute = $scope.SelectedFromMinute = SelectedFromMinute;
  pageData.SelectedToMinute = $scope.SelectedToMinute = SelectedToMinute;
  $scope.SelectedAlarm = SelectedAlarm;
  $scope.EventRules = Rules;

  $scope.OnFromMinuteChange = function() {
    if ($scope.SelectedFromMinute > $scope.SelectedToMinute) {
      $scope.SelectedToMinute = $scope.SelectedFromMinute;
    }
  };

  $scope.OnToMinuteChange = function() {
    if ($scope.SelectedToMinute < $scope.SelectedFromMinute) {
      $scope.SelectedFromMinute = $scope.SelectedToMinute;
    }
  };

  $scope.HourOptions = [];
  for (var h = 0; h < mAttr.MaxHours; h++) {
    $scope.HourOptions.push(h);
  }

  $scope.MinuteOptions = [];
  for (var m = 0; m < mAttr.MaxMinutes; m++) {
    $scope.MinuteOptions.push(m);
  }

  // var index = $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.indexOf($scope.SelectedDay + '.' + $scope.SelectedHour);

  function inArray(arr, str) {
    for (var i = 0; i < arr.length; i++) {
      var tArray = arr[i].split(".");
      tArray = tArray[0] + "." + tArray[1];
      if (tArray === str) {
        return i;
      }
    }
    return -1;
  }

  $scope.ok = function() {
    var foundId = inArray($scope.EventRules[$scope.SelectedAlarm].ScheduleIds, $scope.SelectedDay + '.' + $scope.SelectedHour);
    // for (var i = 0; i < $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.length; i++)
    // {
    //     if ($scope.EventRules[$scope.SelectedAlarm].ScheduleIds[i].indexOf($scope.SelectedDay + '.' + $scope.SelectedHour) >= 0)
    //     {
    //         foundId = i;
    //         break;
    //     }
    // }
    if (foundId !== -1) {
      $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.splice(foundId, 1);
    }

    if ($scope.SelectedToMinute - $scope.SelectedFromMinute >= 59) {
      $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.push($scope.SelectedDay + '.' + $scope.SelectedHour);
    } else {
      $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.push($scope.SelectedDay + '.' + $scope.SelectedHour + '.' + $scope.SelectedFromMinute + '.' + $scope.SelectedToMinute);
    }

    $uibModalInstance.close($scope.EventRules);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var foundId = -1;
    for (var i = 0; i < $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.length; i++) {
      if ($scope.EventRules[$scope.SelectedAlarm].ScheduleIds[i].indexOf($scope.SelectedDay + '.' + $scope.SelectedHour) >= 0) {
        foundId = i;
        break;
      }
    }
    if (foundId !== -1) {
      $scope.EventRules[$scope.SelectedAlarm].ScheduleIds.splice(foundId, 1);
    }

    $uibModalInstance.dismiss('delete');
  };
});