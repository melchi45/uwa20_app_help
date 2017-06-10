/*global kindFramework */
/*global console */
/*global alert */
kindFramework.controller('frostDetectionCtrl', function($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $q, $uibModal, $translate, eventRuleService) {
  "use strict";
  var mAttr = Attributes.get();
  $scope.SelectedChannel = 0;
  COMMONUtils.getResponsiveObjects($scope);
  var idx;
  var pageData = {};
  $scope.EventSource = "FrostDetection";

  function getAttributes() {
    var defer = $q.defer();
    if (mAttr.EnableOptions !== undefined) {
      $scope.EnableOptions = mAttr.EnableOptions;
    }
    if (mAttr.ActivateOptions !== undefined) {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }
    if (mAttr.WeekDays !== undefined) {
      $scope.WeekDays = mAttr.WeekDays;
    }
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    defer.resolve("success");
    return defer.promise;
  }

  function prepareEventRules(eventRules) {
    $scope.EventRule = {};
    $scope.EventRule.Enable = eventRules[0].Enable;
    $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;
    $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));
    $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;
    pageData.EventRule = angular.copy($scope.EventRule);
  }

  function getFrostDetection() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=frostdetection&action=view', getData, function(response) {
      $scope.FrostDetect = response.data.FrostDetection[0];
      pageData.FrostDetect = angular.copy($scope.FrostDetect);
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function getEventRules() {
    var getData = {};
    getData.EventSource = 'DefocusDetection';
    return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
      prepareEventRules(response.data.EventRules);
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  function setFrostDetection() {
    var setData = {};
    setData.Channel = 0;
    if (pageData.FrostDetect.Enable !== $scope.FrostDetect.Enable) {
      setData.Enable = $scope.FrostDetect.Enable;
    }
    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=frostdetection&action=set', setData, function(response) {
      pageData.FrostDetect = angular.copy($scope.FrostDetect);
    }, function(errorData) {
      pageData.FrostDetect = angular.copy($scope.FrostDetect);
      console.log(errorData);
    }, '', true);
  }

  function setEventRules() {
    var setData = {};
    setData.RuleIndex = $scope.EventRule.RuleIndex;
    setData.EventAction = "";
    if (setData.EventAction.length) {
      setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
    }
    setData.ScheduleType = $scope.EventRule.ScheduleType;
    //if ($scope.EventRule.ScheduleType === 'Scheduled')
    {
      var diff = $(pageData.EventRule.ScheduleIds).not($scope.EventRule.ScheduleIds).get();
      var sun = 0,
        mon = 0,
        tue = 0,
        wed = 0,
        thu = 0,
        fri = 0,
        sat = 0;
      for (var s = 0; s < diff.length; s++) {
        var str = diff[s].split('.');
        for (var d = 0; d < mAttr.WeekDays.length; d++) {
          if (str[0] === mAttr.WeekDays[d]) {
            switch (d) {
              case 0:
                sun = 1;
                setData["SUN" + str[1]] = 0;
                break;
              case 1:
                mon = 1;
                setData["MON" + str[1]] = 0;
                break;
              case 2:
                tue = 1;
                setData["TUE" + str[1]] = 0;
                break;
              case 3:
                wed = 1;
                setData["WED" + str[1]] = 0;
                break;
              case 4:
                thu = 1;
                setData["THU" + str[1]] = 0;
                break;
              case 5:
                fri = 1;
                setData["FRI" + str[1]] = 0;
                break;
              case 6:
                sat = 1;
                setData["SAT" + str[1]] = 0;
                break;
              default:
                break;
            }
          }
        }
      }
      for (var s = 0; s < $scope.EventRule.ScheduleIds.length; s++) {
        var str = $scope.EventRule.ScheduleIds[s].split('.');
        for (var d = 0; d < mAttr.WeekDays.length; d++) {
          if (str[0] === mAttr.WeekDays[d]) {
            switch (d) {
              case 0:
                sun = 1;
                setData["SUN" + str[1]] = 1;
                if (str.length === 4) {
                  setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 1:
                mon = 1;
                setData["MON" + str[1]] = 1;
                if (str.length === 4) {
                  setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 2:
                tue = 1;
                setData["TUE" + str[1]] = 1;
                if (str.length === 4) {
                  setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 3:
                wed = 1;
                setData["WED" + str[1]] = 1;
                if (str.length === 4) {
                  setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 4:
                thu = 1;
                setData["THU" + str[1]] = 1;
                if (str.length === 4) {
                  setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 5:
                fri = 1;
                setData["FRI" + str[1]] = 1;
                if (str.length === 4) {
                  setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              case 6:
                sat = 1;
                setData["SAT" + str[1]] = 1;
                if (str.length === 4) {
                  setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                }
                break;
              default:
                break;
            }
          }
        }
      }
      if (sun) {
        setData.SUN = 1;
      }
      if (mon) {
        setData.MON = 1;
      }
      if (tue) {
        setData.TUE = 1;
      }
      if (wed) {
        setData.WED = 1;
      }
      if (thu) {
        setData.THU = 1;
      }
      if (fri) {
        setData.FRI = 1;
      }
      if (sat) {
        setData.SAT = 1;
      }
    }
    return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData, function(response) {
      pageData.EventRule = angular.copy($scope.EventRule);
    }, function(errorData) {
      pageData.EventRule = angular.copy($scope.EventRule);
      console.log(errorData);
    }, '', true);
  }

  function validatePage() {
    if (!eventRuleService.checkSchedulerValidation()) {
      COMMONUtils.ShowError('lang_msg_checkthetable');
      return false;
    }
    return true;
  }

  function set() {
    if (validatePage()) {
      if (!angular.equals(pageData.FrostDetect, $scope.FrostDetect) || !angular.equals(pageData.EventRule, $scope.EventRule)) {
        COMMONUtils.ShowConfirmation(function() {
          if (!angular.equals(pageData.FrostDetect, $scope.FrostDetect)) {
            setFrostDetection();
          }
          if (!angular.equals(pageData.EventRule, $scope.EventRule)) {
            setEventRules();
          }
        }, 
        'lang_apply',
        'sm',
        function() {});
      }
    }
  }
  $scope.setColor = function(day, hour, isAlways) {
    for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
      if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
        if (isAlways) {
          return 'setMiniteFaded';
        } else {
          return 'setMinite';
        }
      }
    }
    if ($scope.EventRule.ScheduleIds.indexOf(day + '.' + hour) !== -1) {
      if (isAlways) {
        return 'setHourFaded';
      } else {
        return 'setHour';
      }
    }
  };
  $scope.mouseOver = function(day, hour) {
    $scope.MouseOverMessage = [];
    for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
      if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0) {
        $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
        break;
      }
    }
  };
  $scope.mouseLeave = function() {
    $scope.MouseOverMessage = [];
  };
  $(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
  });
  $scope.getTooltipMessage = function() {
    if (typeof $scope.MouseOverMessage !== 'undefined') {
      var hr, fr, to;
      if ($scope.MouseOverMessage.length === 2) {
        var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
        var fr = '00';
        var to = '59';
      } else if ($scope.MouseOverMessage.length === 4) {
        var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
        var fr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[2], 2);
        var to = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[3], 2);
      } else {
        return;
      }
      return "(" + $translate.instant($scope.MouseOverMessage[0]) + ") " + hr + ":" + fr + " ~ " + hr + ":" + to;
    }
  };
  $scope.clearAll = function() {
    $scope.EventRule.ScheduleIds = [];
  };
  $scope.open = function(day, hour) {
    $scope.SelectedDay = day;
    $scope.SelectedHour = hour;
    $scope.SelectedFromMinute = 0;
    $scope.SelectedToMinute = 59;
    for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
      if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
        var str = $scope.EventRule.ScheduleIds[i].split('.');
        if (str.length === 4) {
          $scope.SelectedFromMinute = Math.round(str[2]);
          $scope.SelectedToMinute = Math.round(str[3]);
        }
        break;
      }
    }
    var modalInstance = $uibModal.open({
      size: 'lg',
      templateUrl: 'views/setup/common/schedulePopup.html',
      controller: 'modalInstanceCtrl',
      windowClass: 'modal-position-middle',
      resolve: {
        SelectedDay: function() {
          return $scope.SelectedDay;
        },
        SelectedHour: function() {
          return $scope.SelectedHour;
        },
        SelectedFromMinute: function() {
          return $scope.SelectedFromMinute;
        },
        SelectedToMinute: function() {
          return $scope.SelectedToMinute;
        },
        Rule: function() {
          return $scope.EventRule;
        }
      }
    });
    modalInstance.result.then(function(selectedItem) {
      //console.log("Selected : ",selectedItem);
    }, function() {
      //$log.info('Modal dismissed at: ' + new Date());
    });
  };

  function view() {
    var promises = [];
    // promises.push(getFrostDetection);
    promises.push(getEventRules);
    $q.seqAll(promises).then(function() {
      $scope.pageLoaded = true;
      $("#frostdetectionpage").show();
    }, function(errorData) {
      console.log(errorData);
    });
  }
  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };
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
  $scope.submit = set;
  $scope.view = view;
});