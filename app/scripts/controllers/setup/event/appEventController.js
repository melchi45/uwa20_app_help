kindFramework.controller('appEventCtrl', function($rootScope, $scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, eventRuleService) {
  "use strict";
  COMMONUtils.getResponsiveObjects($scope);
  var mAttr = Attributes.get();
  // var pageData = {};
  $scope.EventSource = 'OpenSDK';
  $scope.EventRule = {};

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    var defer = $q.defer();
    $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
    if (typeof mAttr.EnableOptions !== 'undefined') {
      $scope.EnableOptions = mAttr.EnableOptions;
    }
    if (typeof mAttr.ActivateOptions !== 'undefined') {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }
    if (typeof mAttr.WeekDays !== 'undefined') {
      $scope.WeekDays = mAttr.WeekDays;
    }
    if (typeof mAttr.AlarmoutDurationOptions !== 'undefined') {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }
    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }
    $scope.EventActions = COMMONUtils.getSupportedEventActions("OpenSDK");
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    defer.resolve("success");
    return defer.promise;
  }

  function validatePage() {
    if (!eventRuleService.checkSchedulerValidation()) {
      COMMONUtils.ShowError('lang_msg_checkthetable');
      return false;
    }
    return true;
  }

  function view(data) {
    if (data === 0) {
      $rootScope.$emit('resetScheduleData', true);
    }

    $scope.pageLoaded = true;
    $scope.$emit('pageLoaded', $scope.EventSource);
  }

  // $scope.$on('setEventRuleCompleted', function(event, data) {
  //     if(data === true) {
  //         view();
  //     }
  // });

  function set() {
    if (validatePage()) {
      // if (!angular.equals(pageData.EventRule, $scope.EventRule)) {
      COMMONUtils.ApplyConfirmation(function() {
        $scope.$emit('applied', true);
        //view();
      }, 'sm', function() {});
      // }
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