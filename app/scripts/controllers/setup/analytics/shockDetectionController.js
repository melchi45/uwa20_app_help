/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('shockDetectionCtrl', function($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $interval, $q, ConnectionSettingService, kindStreamInterface, SessionOfUserManager, AccountService, $uibModal, $rootScope, $translate, eventRuleService, UniversialManagerService) {
  "use strict";

  var mAttr = Attributes.get();
  $scope.SelectedChannel = 0;
  COMMONUtils.getResponsiveObjects($scope);
  var pageData = {};

  //sketchbook 에서 쓰이는 미사용 변수
  $scope.coordinates = null;
  $scope.sketchinfo = null;

  $scope.ShockDetectChartOptions = {
    showInputBox: true,
    ThresholdLevel: 0,
    floor: 1,
    ceil: 100,
    width: 400,
    height: 150,
    disabled: false,
    onEnd: function() {}
  };

  $scope.ShockDetectDurationSliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {}
  };

  $scope.ShockDetectDurationSliderModel = {
    data: 5
  };

  $scope.ShockDetectSensitivitySliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {}
  };

  $scope.ShockDetectSensitivitySliderModel = {
    data: 5
  };

  $scope.EventSource = 'ShockDetection';

  $scope.EventRule = {};

  function setSizeChart() {
    var chart = "#shock-line-chart";
    var width = $(chart).parent().width();
    if (width > 480) {
      width = 480;
    }

    width -= 80;
    $scope.ShockDetectChartOptions.width = width;

    $(chart + " .graph").css("width", width + "px");

    $(chart + " .graph-border").css("width", (width - 27) + "px");
    $(chart + ".level-threshold-slider").css("width", (width + 140) + "px");

    $scope.$broadcast('reCalcViewDimensions');
  }

  window.addEventListener('resize', setSizeChart);
  $scope.$on("$destroy", function() {
    window.removeEventListener('resize', setSizeChart);
  });

  function showVideo() {
    var getData = {
      Channel: UniversialManagerService.getChannelId()
    };
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
      function(response) {
        var viewerWidth = 640;
        var viewerHeight = 360;
        var maxWidth = mAttr.MaxROICoordinateX;
        var maxHeight = mAttr.MaxROICoordinateY;
        var rotate = response.data.Flip[0].Rotate;
        var flip = response.data.Flip[0].VerticalFlipEnable;
        var mirror = response.data.Flip[0].HorizontalFlipEnable;
        var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

        $scope.videoinfo = {
          width: viewerWidth,
          height: viewerHeight,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          flip: flip,
          mirror: mirror,
          support_ptz: false,
          rotate: rotate,
          adjust: adjust,
          currentPage: 'Shock',
          channelId: UniversialManagerService.getChannelId()
        };
        $scope.ptzinfo = {
          type: 'none'
        };

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  $scope.$watch('ShockDetectDurationSliderModel.data', function(newValue, oldValue) {
    if (newValue) {
      if (typeof $scope.ShockDetect !== "undefined") {
        $scope.ShockDetect.Duration = $scope.ShockDetectDurationSliderModel.data;
      }
    }
  }, true);

  $scope.$watch('ShockDetectSensitivitySliderModel.data', function(newValue, oldValue) {
    if (newValue) {
      if (typeof $scope.ShockDetect !== "undefined") {
        $scope.ShockDetect.SensitivityLevel = $scope.ShockDetectSensitivitySliderModel.data;
      }
    }
  }, true);

  $scope.$watch('ShockDetectChartOptions', function(newValue, oldValue) {
    if (newValue.ThresholdLevel) {
      if (typeof $scope.ShockDetect !== "undefined") {
        $scope.ShockDetect.ThresholdLevel = $scope.ShockDetectChartOptions.ThresholdLevel;
      }
    }
  }, true);

  var mStopMonotoringShockLevel = false;
  var monitoringTimer = null;
  var maxSample = 4;

  function startMonitoringShockLevel() {
    mStopMonotoringShockLevel = false;
    $scope.$broadcast('liveChartStart');

    if (monitoringTimer === null) {
      (function update() {
        getShockLevel(function(data) {
          if (destroyInterrupt){
            return;
          }
          var newShockLevel = angular.copy(data);
          if (!mStopMonotoringShockLevel) {
            if (newShockLevel.length >= maxSample) {
              var index = newShockLevel.length;
              while (index--) {
                var level = validateLevel(newShockLevel[index]);

                if (level === null) {
                  continue;
                }

                if ($scope.ShockDetectChartOptions.EnqueueData) {
                  $scope.ShockDetectChartOptions.EnqueueData(level);
                }
              }
            }
            monitoringTimer = $timeout(update, 300); //300 msec
          }
        });
      })();
    }
  }

  function stopMonitoringShockLevel() {
    mStopMonotoringShockLevel = true;
    mLastSequenceLevel = 0;
    $scope.$broadcast('liveChartStop');

    if (monitoringTimer !== null) {
      $timeout.cancel(monitoringTimer);
      monitoringTimer = null;
      $scope.ShockDetectChartOptions.EnqueueData(0)
    }
  }

  var destroyInterrupt = false;
  $scope.$on("$destroy", function() {
    destroyInterrupt = true;
    stopMonitoringShockLevel();
  });

  var mLastSequenceLevel = 0;

  function validateLevel(shockLevelObject) {
    if (mLastSequenceLevel > shockLevelObject.SequenceID) {
      return null;
    }

    mLastSequenceLevel = shockLevelObject.SequenceID;

    return shockLevelObject.Level;
  }

  function getShockLevel(func) {
    var newShockLevel = {};

    var getData = {};

    getData.MaxSamples = maxSample;

    getData.EventSourceType = 'ShockDetection';

    getData.Channel = UniversialManagerService.getChannelId();

    var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

    return SunapiClient.get(sunapiURL, getData,
      function(response) {
        newShockLevel = angular.copy(response.data.ShockDetection[0].Samples);
        if (typeof func !== "undefined") {
          func(newShockLevel);
        }
      },
      function(errorData) {
        console.log("getShockLevel Error : ", errorData);
        stopMonitoringShockLevel();
        startMonitoringShockLevel();
      }, '', true);
  }

  function getShockDetection() {
    var getData = {
      Channel: UniversialManagerService.getChannelId()
    };

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=shockdetection&action=view', getData,
      function(response) {
        $scope.ShockDetect = response.data.ShockDetection[0];
        pageData.ShockDetect = angular.copy($scope.ShockDetect);

        $scope.ShockDetectChartOptions.ThresholdLevel = $scope.ShockDetect.ThresholdLevel;
        $scope.ShockDetectDurationSliderModel.data = $scope.ShockDetect.Duration;
        $scope.ShockDetectSensitivitySliderModel.data = $scope.ShockDetect.SensitivityLevel;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setShockDetection() {
    var setData = {};

    setData.Channel = UniversialManagerService.getChannelId();

    if (pageData.ShockDetect.Enable !== $scope.ShockDetect.Enable) {
      setData.Enable = $scope.ShockDetect.Enable;
    }

    if (pageData.ShockDetect.SensitivityLevel !== $scope.ShockDetect.SensitivityLevel) {
      setData.SensitivityLevel = $scope.ShockDetect.SensitivityLevel;
    }

    if (pageData.ShockDetect.ThresholdLevel !== $scope.ShockDetect.ThresholdLevel) {
      setData.ThresholdLevel = $scope.ShockDetect.ThresholdLevel;
    }

    if (pageData.ShockDetect.Duration !== $scope.ShockDetect.Duration) {
      setData.Duration = $scope.ShockDetect.Duration;
    }

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=shockdetection&action=set', setData,
      function(response) {
        pageData.ShockDetect = angular.copy($scope.ShockDetect);
      },
      function(errorData) {
        pageData.ShockDetect = angular.copy($scope.ShockDetect);
        console.log(errorData);
      }, '', true);
  }

  $scope.setShockDetectionEnable = function() {
    stopMonitoringShockLevel();
    COMMONUtils.ApplyConfirmation(function() {
      $rootScope.$emit('changeLoadingBar', true);
      var setData = {};

      setData.Channel = UniversialManagerService.getChannelId();

      if (pageData.ShockDetect.Enable !== $scope.ShockDetect.Enable) {
        setData.Enable = $scope.ShockDetect.Enable;
      }

      return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=shockdetection&action=set', setData,
        function(response) {
          $rootScope.$emit('changeLoadingBar', false);
          pageData.ShockDetect.Enable = angular.copy($scope.ShockDetect.Enable);
          if ($scope.ShockDetect.Enable) {
            startMonitoringShockLevel();
          }
        },
        function(errorData) {
          $rootScope.$emit('changeLoadingBar', false);
          $scope.ShockDetect.Enable = angular.copy(pageData.ShockDetect.Enable);
          if ($scope.ShockDetect.Enable) {
            startMonitoringShockLevel();
          }
        }, '', true);
    }, 
    'sm',
    function() {
      $scope.ShockDetect.Enable = angular.copy(pageData.ShockDetect.Enable);
      if ($scope.ShockDetect.Enable) {
        startMonitoringShockLevel();
      }
    });
  };

  function getAttributes() {
    var defer = $q.defer();

    $scope.MaxChannel = mAttr.MaxChannel;

    if (typeof mAttr.ActivateOptions !== "undefined") {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }

    if (typeof mAttr.EnableOptions !== "undefined") {
      $scope.EnableOptions = mAttr.EnableOptions;
    }

    if (typeof mAttr.WeekDays !== "undefined") {
      $scope.WeekDays = mAttr.WeekDays;
    }

    if (typeof mAttr.ShockDetectThreshold !== "undefined") {
      $scope.ShockDetectChartOptions.ceil = mAttr.ShockDetectThreshold.maxValue;
      $scope.ShockDetectChartOptions.floor = mAttr.ShockDetectThreshold.minValue;
    }

    if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }

    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }

    if (typeof mAttr.ShockDetectDuration !== "undefined") {
      $scope.ShockDetectDurationSliderProperty.ceil = mAttr.ShockDetectDuration.maxValue;
      $scope.ShockDetectDurationSliderProperty.floor = mAttr.ShockDetectDuration.minValue;

      $scope.ShockDetectSensitivitySliderProperty.ceil = mAttr.ShockDetectSensitivityLevel.maxValue;
      $scope.ShockDetectSensitivitySliderProperty.floor = mAttr.ShockDetectSensitivityLevel.minValue;
    }

    $scope.EventActions = COMMONUtils.getSupportedEventActions("TamperingDetection");
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

    $scope.PTZModel = mAttr.PTZModel;
    $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;

    defer.resolve("success");
    return defer.promise;
  }

  $scope.clearAll = function() {
    $timeout(function() {
      $scope.EventRule.ScheduleIds = [];
    });
  };

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
    var promises = [];

    promises.push(showVideo);
    promises.push(getShockDetection);

    $q.seqAll(promises).then(
      function() {
        $rootScope.$emit('changeLoadingBar', false);
        $scope.pageLoaded = true;
        $scope.$emit('pageLoaded', $scope.EventSource);
        $("#imagepage").show();
        $timeout(setSizeChart);

        if ($scope.ShockDetect.Enable) {
          startMonitoringShockLevel();
        } else {
          stopMonitoringShockLevel();
        }
      },
      function(errorData) {
        $rootScope.$emit('changeLoadingBar', false);
      }
    );
  }

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };


  function set() {
    if (validatePage()) {
      COMMONUtils.ApplyConfirmation(setChangedData);
    }
  }

  function setChangedData() {
    var deferred = $q.defer();

    setShockDetection().then(
      function() {
        $scope.$emit('applied', UniversialManagerService.getChannelId());
        view();
        deferred.resolve(true);
      },
      function(errorData) {
        console.info(11);
        console.log(errorData);
        deferred.reject(errorData);
      }
    );

    return deferred.promise;
  }

  function checkChangedData() {
    return !angular.equals(pageData.ShockDetect, $scope.ShockDetect);
  }

  function changeChannel(index) {
    $rootScope.$emit("channelSelector:changeChannel", index);
    $rootScope.$emit('changeLoadingBar', true);
    view();
  }

  $rootScope.$saveOn('channelSelector:selectChannel', function(event, index) {
    stopMonitoringShockLevel();

    if (checkChangedData() || !eventRuleService.checkEventRuleValidation()) {
      COMMONUtils.
        confirmChangeingChannel().
        then(function() {
          if (validatePage() === true) {
            setChangedData().then(function() {
              changeChannel(index);
            });
          }
        }, function() {
          console.log("canceled");
        });
    } else {
      changeChannel(index);
    }
  }, $scope);


  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      getAttributes();
      view();
    }
  })();

  $scope.submit = set;
  $scope.view = view;
});