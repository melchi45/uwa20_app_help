kindFramework.controller('alarmoutputCtrl', function($scope, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q) {
  "use strict";
  COMMONUtils.getResponsiveObjects($scope);
  var mAttr = Attributes.get();
  var pageData = {};
  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    var defer = $q.defer();
    $scope.SelectedAlarm = 0;
    $scope.AlarmOutOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxAlarmOutput);
    if (typeof mAttr.AlarmOutputIdleStateOptions !== "undefined") {
      $scope.AlarmOutputIdleStateOptions = mAttr.AlarmOutputIdleStateOptions;
    }
    if (typeof mAttr.AlarmoutModes !== "undefined") {
      $scope.AlarmoutModes = mAttr.AlarmoutModes;
    }
    if (typeof mAttr.AlarmoutManualDurations !== "undefined") {
      $scope.ActiveAlarmDurations = ['Always'];
      $scope.PulseAlarmDurations = mAttr.AlarmoutManualDurations;
      var index = mAttr.AlarmoutManualDurations.indexOf('Always');
      if (index !== -1) {
        $scope.PulseAlarmDurations.splice(index, 1);
      }
    }
    defer.resolve("success");
    return defer.promise;
  }

  function getAlarmOutputs() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/io.cgi?msubmenu=alarmoutput&action=view', getData, function(response) {
      $scope.AlarmOutputs = response.data.AlarmOutputs;
      for (var i = 0; i < $scope.AlarmOutputs.length; i++) {
        $scope.AlarmOutputs[i].ActiveDuration = $scope.ActiveAlarmDurations[0];
        if ($scope.AlarmOutputs[i].ManualDuration === 'Always') {
          $scope.AlarmOutputs[i].Mode = mAttr.AlarmoutModes[1];
          $scope.AlarmOutputs[i].ManualDuration = $scope.PulseAlarmDurations[0];
        } else {
          $scope.AlarmOutputs[i].Mode = mAttr.AlarmoutModes[0];
        }
      }
      pageData.AlarmOutputs = angular.copy($scope.AlarmOutputs);
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function setAlarmOutputs(promises) {
    for (var i = 0; i < $scope.AlarmOutputs.length; i++) {
      if (!angular.equals(pageData.AlarmOutputs[i], $scope.AlarmOutputs[i])) {
        promises.push(function() {
          var setData = {};
          setData["AlarmOutput." + (i + 1) + ".IdleState"] = $scope.AlarmOutputs[i].IdleState;
          if ($scope.AlarmOutputs[i].Mode === mAttr.AlarmoutModes[1]) {
            setData["AlarmOutput." + (i + 1) + ".ManualDuration"] = $scope.AlarmOutputs[i].ActiveDuration;
          } else {
            setData["AlarmOutput." + (i + 1) + ".ManualDuration"] = $scope.AlarmOutputs[i].ManualDuration;
          }

          return function() {
            return SunapiClient.get('/stw-cgi/io.cgi?msubmenu=alarmoutput&action=set', setData, function(response) {}, function(errorData) {
              console.log(errorData);
            }, '', true);
          };
        }());
      }
    }
    pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
  }

  function validatePage() {
    return true;
  }

  function view() {
    var promises = [];
    promises.push(getAlarmOutputs);
    $q.seqAll(promises).then(function() {
      $scope.pageLoaded = true;
    }, function(errorData) {
      console.log(errorData);
    });
  }

  function set() {
    var promises = [];
    if (validatePage()) {
      if (!angular.equals(pageData.AlarmOutputs, $scope.AlarmOutputs)) {
        COMMONUtils.ApplyConfirmation(function() {
          setAlarmOutputs(promises);
          $q.seqAll(promises).then(function() {
            view();
          }, function(errorData) {});
        }, 'sm', function() {});
      }
    }
  }
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