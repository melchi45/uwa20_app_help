kindFramework.
controller('modalInstanceCtrl', 
function($scope, $uibModalInstance, Attributes, SelectedDay, SelectedHour, 
SelectedFromMinute, SelectedToMinute, Rule, COMMONUtils) {
  "use strict";
  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();
  var MAX_MINUTES = 59;
  var pageData = {};

  $scope.SelectedDay = SelectedDay;
  $scope.SelectedHour = SelectedHour;
  pageData.SelectedFromMinute = $scope.SelectedFromMinute = SelectedFromMinute;
  pageData.SelectedToMinute = $scope.SelectedToMinute = SelectedToMinute;
  $scope.EventRule = Rule;

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
  for (var hour = 0; hour < mAttr.MaxHours; hour++) {
    $scope.HourOptions.push(hour);
  }

  $scope.MinuteOptions = [];
  for (var min = 0; min < mAttr.MaxMinutes; min++) {
    $scope.MinuteOptions.push(min);
  }

  function inArray(arr, str) {
    for (var idx = 0; idx < arr.length; idx++) {
      var tArray = arr[idx].split(".");
      tArray = tArray[0] + "." + tArray[1];
      if (tArray === str) {
        return idx;
      }
    }
    return -1;
  }

  $scope.ok = function() {
    var foundId = inArray($scope.EventRule.ScheduleIds, 
      $scope.SelectedDay + '.' + $scope.SelectedHour);
    // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
    // {
    //     if ($scope.EventRule.ScheduleIds[i].indexOf($scope.SelectedDay + '.' + $scope.SelectedHour) >= 0)
    //     {
    //         foundId = i;
    //         break;
    //     }
    // }
    if (foundId !== -1) {
      $scope.EventRule.ScheduleIds.splice(foundId, 1);
    }
    if ($scope.SelectedToMinute - $scope.SelectedFromMinute >= MAX_MINUTES) {
      $scope.EventRule.ScheduleIds.push($scope.SelectedDay + '.' + $scope.SelectedHour);
    } else {
      $scope.EventRule.ScheduleIds.push(
        $scope.SelectedDay + '.' + $scope.SelectedHour + '.' + $scope.SelectedFromMinute + 
        '.' + $scope.SelectedToMinute);
    }

    $uibModalInstance.close($scope.EventRule);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var foundId = -1;
    for (var idx = 0; idx < $scope.EventRule.ScheduleIds.length; idx++) {
      if ($scope.EventRule.ScheduleIds[idx].indexOf(
          $scope.SelectedDay + '.' + $scope.SelectedHour) >= 0) {
        foundId = idx;
        break;
      }
    }
    if (foundId !== -1) {
      $scope.EventRule.ScheduleIds.splice(foundId, 1);
    }

    $uibModalInstance.dismiss('delete');
  };
});