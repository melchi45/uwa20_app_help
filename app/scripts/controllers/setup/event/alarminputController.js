kindFramework.controller('alarminputCtrl', function($scope, $location, $rootScope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, eventRuleService) {
  "use strict";
  COMMONUtils.getResponsiveObjects($scope);
  var mAttr = Attributes.get();
  var pageData = {};
  $scope.AlarmData = {};
  $scope.EventSource = 'AlarmInput';
  $scope.EventRules = [];

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    var defer = $q.defer();
    $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
    if (typeof mAttr.EnableOptions !== "undefined") {
      $scope.EnableOptions = mAttr.EnableOptions;
    }
    if (typeof mAttr.ActivateOptions !== "undefined") {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }
    if (typeof mAttr.WeekDays !== "undefined") {
      $scope.WeekDays = mAttr.WeekDays;
    }
    $scope.EventActions = [];
    $scope.AlarmInputOptions = [];
    for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
      $scope.AlarmInputOptions.push(ai + 1);
      $scope.EventActions[ai] = [];
      $scope.EventActions[ai] = COMMONUtils.getSupportedEventActions("AlarmInput." + (ai + 1));
    }
    if (typeof mAttr.AlarmInputStateOptions !== "undefined") {
      $scope.AlarmInputStateOptions = mAttr.AlarmInputStateOptions;
    }
    if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }
    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }
    /*if (Attributes.isSupportGoToPreset() === true) {
        $scope.PresetOptions = Attributes.getPresetOptions();
    }*/
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    defer.resolve("success");
    return defer.promise;
  }

  function getAlarmInputs() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=alarminput&action=view', getData, function(response) {
      $scope.AlarmInputs = response.data.AlarmInputs;
      pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function cameraView() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', '', function(response) {
      $scope.Camera = response.data.Camera[0];
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function getSelectedAlarm() {
    if (typeof mAttr.DefaultAlarmIndex === 'undefined') {
      $scope.AlarmData.SelectedAlarm = 0;
    } else {
      $scope.AlarmData.SelectedAlarm = mAttr.DefaultAlarmIndex;
      Attributes.setDefaultAlarmIndex(0);
    }
  }

  function setAlarmInputs(i) {
    var setData = {};
    setData["AlarmInput." + (i + 1) + ".Enable"] = $scope.AlarmInputs[i].Enable;
    setData["AlarmInput." + (i + 1) + ".State"] = $scope.AlarmInputs[i].State;

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=alarminput&action=set', setData, function(response) {}, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function validatePage() {
    // for (var i = 0; i < $scope.EventRules.length; i++) {
    if (!eventRuleService.checkSchedulerValidation()) {
      COMMONUtils.ShowError('lang_msg_checkthetable');
      return false;
    }
    // }
    return true;
  }

  function checkDayNightModeDependency() {
    if (typeof $scope.Camera !== "undefined") {
      if (mAttr.MaxAlarmInput === 0 || $scope.Camera.DayNightMode === 'ExternalBW') {
        $location.path($rootScope.monitoringPath);
      }
    }
  }

  function view(data) {
    if (data === 0) {
      $rootScope.$emit('resetScheduleData', true);
    }
    var promises = [];
    promises.push(getAlarmInputs);
    promises.push(cameraView);
    getSelectedAlarm();

    if (promises.length > 0) {
      $q.seqAll(promises).then(function() {
        checkDayNightModeDependency();
        $scope.pageLoaded = true;
        $scope.$emit('pageLoaded', $scope.EventSource);
      }, function(errorData) {
        console.log(errorData);
      });
    } else {
      checkDayNightModeDependency();
      $scope.pageLoaded = true;
    }
  }

  function set() {
    var promises = [];
    if (validatePage()) {
      if (!angular.equals(pageData.AlarmInputs, $scope.AlarmInputs) || !angular.equals(pageData.EventRules, $scope.EventRules)) {
        COMMONUtils.ApplyConfirmation(function() {
          if (!angular.equals(pageData.AlarmInputs, $scope.AlarmInputs)) {
            $scope.AlarmInputs.forEach(function(elem, index) {
              if (!angular.equals(pageData.AlarmInputs[index], elem)) {
                promises.push(function() {
                  return setAlarmInputs(index);
                });
              }
            });
          }

          if (promises.length > 0) {
            $q.seqAll(promises).then(function() {
              $scope.$emit('applied', true);
              pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
              // pageData.EventRules = angular.copy($scope.EventRules);
              view();
            }, function(errorData) {});
          } else {
            pageData.AlarmInputs = angular.copy($scope.AlarmInputs);
            // pageData.EventRules = angular.copy($scope.EventRules);
            $scope.$emit('applied', true);
            view();
          }
        },
        'sm',
        function() {});
      }
    }
  }

  $(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
  });

  $scope.clearAll = function() {
    $timeout(function() {
      var index = parseInt($scope.AlarmData.SelectedAlarm);
      $scope.EventRules[index].ScheduleIds = [];
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