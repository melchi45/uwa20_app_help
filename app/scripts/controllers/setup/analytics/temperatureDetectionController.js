/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('temperatureDetectionCtrl', function($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $interval, $q, ConnectionSettingService, kindStreamInterface, SessionOfUserManager, AccountService, $uibModal, $rootScope, $translate, eventRuleService, UniversialManagerService) {
  "use strict";

  var mAttr = Attributes.get();
  $scope.SelectedChannel = 0;
  COMMONUtils.getResponsiveObjects($scope);
  var pageData = {};

  //sketchbook 에서 쓰이는 미사용 변수
  $scope.coordinates = null;
  $scope.sketchinfo = null;

  $scope.TemperatureDetectChartOptions = {
    showInputBox: true,
    ThresholdLevel: 0,
    floor: 1,
    ceil: 100,
    width: 400,
    height: 150,
    disabled: false,
    onEnd: function() {}
  };

  $scope.TemperatureDetectDurationSliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {}
  };

  $scope.TemperatureDetectDurationSliderModel = {
    data: 5
  };

  $scope.TemperatureDetectSensitivitySliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {}
  };

  $scope.TemperatureDetectSensitivitySliderModel = {
    data: 5
  };

  $scope.EventSource = 'TemperatureDetection';

  $scope.EventRule = {};

  function setSizeChart() {
    var chart = "#temperature-line-chart";
    var width = $(chart).parent().width();
    if (width > 480) {
      width = 480;
    }

    width -= 80;
    $scope.TemperatureDetectChartOptions.width = width;

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
          currentPage: 'Temperature',
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

  $scope.$watch('TemperatureDetectDurationSliderModel.data', function(newValue, oldValue) {
    if (newValue) {
      if (typeof $scope.TemperatureDetect !== "undefined") {
        $scope.TemperatureDetect.Duration = $scope.TemperatureDetectDurationSliderModel.data;
      }
    }
  }, true);

  $scope.$watch('TemperatureDetectSensitivitySliderModel.data', function(newValue, oldValue) {
    if (newValue) {
      if (typeof $scope.TemperatureDetect !== "undefined") {
        $scope.TemperatureDetect.SensitivityLevel = $scope.TemperatureDetectSensitivitySliderModel.data;
      }
    }
  }, true);

  $scope.$watch('TemperatureDetectChartOptions', function(newValue, oldValue) {
    if (newValue.ThresholdLevel) {
      if (typeof $scope.TemperatureDetect !== "undefined") {
        $scope.TemperatureDetect.ThresholdLevel = $scope.TemperatureDetectChartOptions.ThresholdLevel;
      }
    }
  }, true);

  var mStopMonotoringTemperatureLevel = false;
  var monitoringTimer = null;
  var maxSample = 4;

  function startMonitoringTemperatureLevel() {
    mStopMonotoringTemperatureLevel = false;
    $scope.$broadcast('liveChartStart');

    if (monitoringTimer === null) {
      (function update() {
        getTemperatureLevel(function(data) {
          if (destroyInterrupt){
            return;
          }
          var newTemperatureLevel = angular.copy(data);
          if (!mStopMonotoringTemperatureLevel) {
            if (newTemperatureLevel.length >= maxSample) {
              var index = newTemperatureLevel.length;
              while (index--) {
                var level = validateLevel(newTemperatureLevel[index]);

                if (level === null) {
                  continue;
                }

                if ($scope.TemperatureDetectChartOptions.EnqueueData) {
                  $scope.TemperatureDetectChartOptions.EnqueueData(level);
                }
              }
            }
            monitoringTimer = $timeout(update, 300); //300 msec
          }
        });
      })();
    }
  }

  function stopMonitoringTemperatureLevel() {
    mStopMonotoringTemperatureLevel = true;
    mLastSequenceLevel = 0;
    $scope.$broadcast('liveChartStop');

    if (monitoringTimer !== null) {
      $timeout.cancel(monitoringTimer);
      monitoringTimer = null;
      $scope.TemperatureDetectChartOptions.EnqueueData(0)
    }
  }

  var destroyInterrupt = false;
  $scope.$on("$destroy", function() {
    destroyInterrupt = true;
    stopMonitoringTemperatureLevel();
  });

  var mLastSequenceLevel = 0;

  function validateLevel(temperatureLevelObject) {
    if (mLastSequenceLevel > temperatureLevelObject.SequenceID) {
      return null;
    }

    mLastSequenceLevel = temperatureLevelObject.SequenceID;

    return temperatureLevelObject.Level;
  }

  function getTemperatureLevel(func) {
    var newTemperatureLevel = {};

    var getData = {};

    getData.MaxSamples = maxSample;

    getData.EventSourceType = 'TemperatureDetection';

    getData.Channel = UniversialManagerService.getChannelId();

    var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

    return SunapiClient.get(sunapiURL, getData,
      function(response) {
        newTemperatureLevel = angular.copy(response.data.TemperatureDetection[0].Samples);
        if (typeof func !== "undefined") {
          func(newTemperatureLevel);
        }
      },
      function(errorData) {
        console.log("getTemperatureLevel Error : ", errorData);
        stopMonitoringTemperatureLevel();
        startMonitoringTemperatureLevel();
      }, '', true);
  }

  function getTemperatureDetection() {
    var getData = {
      Channel: UniversialManagerService.getChannelId()
    };

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=temperaturedetection&action=view', getData,
      function(response) {
        $scope.TemperatureDetect = response.data.TemperatureDetection[0];
        pageData.TemperatureDetect = angular.copy($scope.TemperatureDetect);

        $scope.TemperatureDetectChartOptions.ThresholdLevel = $scope.TemperatureDetect.ThresholdLevel;
        $scope.TemperatureDetectDurationSliderModel.data = $scope.TemperatureDetect.Duration;
        $scope.TemperatureDetectSensitivitySliderModel.data = $scope.TemperatureDetect.SensitivityLevel;
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function setTemperatureDetection() {
    var setData = {};

    setData.Channel = UniversialManagerService.getChannelId();

    if (pageData.TemperatureDetect.Enable !== $scope.TemperatureDetect.Enable) {
      setData.Enable = $scope.TemperatureDetect.Enable;
    }

    if (pageData.TemperatureDetect.SensitivityLevel !== $scope.TemperatureDetect.SensitivityLevel) {
      setData.SensitivityLevel = $scope.TemperatureDetect.SensitivityLevel;
    }

    if (pageData.TemperatureDetect.ThresholdLevel !== $scope.TemperatureDetect.ThresholdLevel) {
      setData.ThresholdLevel = $scope.TemperatureDetect.ThresholdLevel;
    }

    if (pageData.TemperatureDetect.AutoDefog !== $scope.TemperatureDetect.AutoDefog) {
      setData.AutoDefog = $scope.TemperatureDetect.AutoDefog;
    }

    if (pageData.TemperatureDetect.Duration !== $scope.TemperatureDetect.Duration) {
      setData.Duration = $scope.TemperatureDetect.Duration;
    }

    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=temperaturedetection&action=set', setData,
      function(response) {
        pageData.TemperatureDetect = angular.copy($scope.TemperatureDetect);
      },
      function(errorData) {
        pageData.TemperatureDetect = angular.copy($scope.TemperatureDetect);
        console.log(errorData);
      }, '', true);
  }

  $scope.setTemperatureDetectionEnable = function() {
    stopMonitoringTemperatureLevel();
    COMMONUtils.ApplyConfirmation(function() {
      $rootScope.$emit('changeLoadingBar', true);
      var setData = {};

      setData.Channel = UniversialManagerService.getChannelId();

      if (pageData.TemperatureDetect.Enable !== $scope.TemperatureDetect.Enable) {
        setData.Enable = $scope.TemperatureDetect.Enable;
      }

      return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=temperaturedetection&action=set', setData,
        function(response) {
          $rootScope.$emit('changeLoadingBar', false);
          pageData.TemperatureDetect.Enable = angular.copy($scope.TemperatureDetect.Enable);
          if ($scope.TemperatureDetect.Enable) {
            startMonitoringTemperatureLevel();
          }
        },
        function(errorData) {
          $rootScope.$emit('changeLoadingBar', false);
          $scope.TemperatureDetect.Enable = angular.copy(pageData.TemperatureDetect.Enable);
          if ($scope.TemperatureDetect.Enable) {
            startMonitoringTemperatureLevel();
          }
        }, '', true);
    }, 
    'sm',
    function() {
      $scope.TemperatureDetect.Enable = angular.copy(pageData.TemperatureDetect.Enable);
      if ($scope.TemperatureDetect.Enable) {
        startMonitoringTemperatureLevel();
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

    if (typeof mAttr.TemperatureDetectThreshold !== "undefined") {
      $scope.TemperatureDetectChartOptions.ceil = mAttr.TemperatureDetectThreshold.maxValue;
      $scope.TemperatureDetectChartOptions.floor = mAttr.TemperatureDetectThreshold.minValue;
    }

    if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }

    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }

    if (typeof mAttr.TemperatureDetectDuration !== "undefined") {
      $scope.TemperatureDetectDurationSliderProperty.ceil = mAttr.TemperatureDetectDuration.maxValue;
      $scope.TemperatureDetectDurationSliderProperty.floor = mAttr.TemperatureDetectDuration.minValue;

      $scope.TemperatureDetectSensitivitySliderProperty.ceil = mAttr.TemperatureDetectSensitivityLevel.maxValue;
      $scope.TemperatureDetectSensitivitySliderProperty.floor = mAttr.TemperatureDetectSensitivityLevel.minValue;
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
    promises.push(getTemperatureDetection);

    $q.seqAll(promises).then(
      function() {
        $rootScope.$emit('changeLoadingBar', false);
        $scope.pageLoaded = true;
        $scope.$emit('pageLoaded', $scope.EventSource);
        $("#imagepage").show();
        $timeout(setSizeChart);

        if ($scope.TemperatureDetect.Enable) {
          startMonitoringTemperatureLevel();
        } else {
          stopMonitoringTemperatureLevel();
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

    setTemperatureDetection().then(
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
    return !angular.equals(pageData.TemperatureDetect, $scope.TemperatureDetect);
  }

  function changeChannel(index) {
    $rootScope.$emit("channelSelector:changeChannel", index);
    $rootScope.$emit('changeLoadingBar', true);
    view();
  }

  $rootScope.$saveOn('channelSelector:selectChannel', function(event, index) {
    stopMonitoringTemperatureLevel();

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