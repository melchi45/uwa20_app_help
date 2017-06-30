kindFramework.controller('tamperDetectionCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $interval, ConnectionSettingService, SessionOfUserManager, kindStreamInterface, AccountService, $rootScope, eventRuleService, UniversialManagerService) {

  "use strict";

  COMMONUtils.getResponsiveObjects($scope);

  var mAttr = Attributes.get();

  var pageData = {};



  $scope.TamperDetectChartOptions = {
    showInputBox: true,
    ThresholdLevel: 50,
    floor: 0,
    ceil: 100,
    width: 400,
    height: 150,
    disabled: false,
    onEnd: function() {},
  };

  $scope.TamperDetectDurationSliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {},
  };
  $scope.TamperDetectDurationSliderModel = {
    data: 5,
  };

  $scope.TamperDetectSensitivitySliderProperty = {
    ceil: 100,
    floor: 1,
    showSelectionBar: true,
    vertical: false,
    showInputBox: true,
    disabled: false,
    onEnd: function() {},
  };
  $scope.TamperDetectSensitivitySliderModel = {
    data: 5,
  };

  $scope.EventSource = 'TamperingDetection';

  $scope.EventRule = {};

  function setSizeChart() {
    var chart = "#tamper-line-chart";
    var width = $(chart).parent().width();
    if (width > 480) {
      width = 480;
    }

    width -= 80;
    $scope.TamperDetectChartOptions.width = width;

    $(chart + " .graph").css("width", width + "px");
    $(chart + " .graph-border").css("width", (width - 27) + "px");
    $(chart + ".level-threshold-slider").css("width", (width + 140) + "px");

    $scope.$broadcast('reCalcViewDimensions');
  }

  window.addEventListener('resize', setSizeChart);
  $scope.$on("$destroy", function() {
    window.removeEventListener('resize', setSizeChart);
  });


  //sketchbook ?��?�� ?��?��?�� 미사?�� �??��
  $scope.coordinates = null;
  $scope.sketchinfo = null;

  function showVideo() {
    var getData = {
      Channel: UniversialManagerService.getChannelId(),
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
          currentPage: 'TamperingDetection',
          channelId: UniversialManagerService.getChannelId(),
        };
        $scope.ptzinfo = {
          type: 'none',
        };

      },
      function(errorData) {
        console.log(errorData)
      }, '', true);
  }

  $scope.$watch('TamperDetectChartOptions', function(newValue) {
    if (newValue.ThresholdLevel) {
      if (typeof $scope.TamperDetect !== 'undefined') {
        console.log($scope.TamperDetect);
        $scope.TamperDetect.ThresholdLevel = $scope.TamperDetectChartOptions.ThresholdLevel;
      }
    }
  }, true);

  $scope.$watch('TamperDetectDurationSliderModel.data', function(newValue) {
    if (newValue) {
      if (typeof $scope.TamperDetect !== 'undefined') {
        $scope.TamperDetect.Duration = $scope.TamperDetectDurationSliderModel.data;
      }
    }
  }, true);

  $scope.$watch('TamperDetectSensitivitySliderModel.data', function(newValue) {
    if (newValue) {
      if (typeof $scope.TamperDetect !== 'undefined') {
        $scope.TamperDetect.SensitivityLevel = $scope.TamperDetectSensitivitySliderModel.data;
      }
    }
  }, true);

  var mStopMonotoringTamperingLevel = false;
  var monitoringTimer = null;
  var maxSample = 6;

  function startMonitoringTamperingLevel() {
    mStopMonotoringTamperingLevel = false;
    $scope.$broadcast('liveChartStart');

    if (monitoringTimer === null) {
      (function update() {
        getTamperingLevel(function(data) {
          if (destroyInterrupt) {
            return;
          } 
          var newTamperLevel = angular.copy(data);

          if (!mStopMonotoringTamperingLevel) {
            var index = newTamperLevel.length;

            if (newTamperLevel.length >= maxSample) {
              while (index--) {
                var level = validateLevel(newTamperLevel[index]);

                if (level === null) {
                  continue;
                } 

                if ($scope.TamperDetectChartOptions.EnqueueData) {
                  $scope.TamperDetectChartOptions.EnqueueData(level);
                }
              }
            }

            monitoringTimer = $timeout(update, 300); //300 msec
          }
        });
      })();
    }
  }

  function stopMonitoringTamperingLevel() {
    mStopMonotoringTamperingLevel = true;
    mLastSequenceLevel = 0;
    $scope.$broadcast('liveChartStop');

    if (monitoringTimer !== null) {
      $timeout.cancel(monitoringTimer);
      monitoringTimer = null;
      $scope.TamperDetectChartOptions.EnqueueData(0);
    }
  }

  var destroyInterrupt = false;
  $scope.$on("$destroy", function() {
    destroyInterrupt = true;
    stopMonitoringTamperingLevel();
  });

  var mLastSequenceLevel = 0;

  function validateLevel(tamperLevelObject) {
    if (mLastSequenceLevel > tamperLevelObject.SequenceID) {
      return null;
    }

    mLastSequenceLevel = tamperLevelObject.SequenceID;

    return tamperLevelObject.Level;
  }

  function getTamperingLevel(func) {
    var newTamperLevel = {};

    var getData = {
      Channel: UniversialManagerService.getChannelId(),
    };

    getData.MaxSamples = maxSample;
    getData.EventSourceType = 'TamperingDetection';



    var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

    return SunapiClient.get(sunapiURL, getData,
      function(response) {
        newTamperLevel = angular.copy(response.data.TamperingDetection[0].Samples);
        if (typeof func !== 'undefined') {
          func(newTamperLevel);
        }
      },
      function(errorData) {
        console.log("getTamperingLevel Error : ", errorData);
        stopMonitoringTamperingLevel();
        startMonitoringTamperingLevel();
      }, '', true);
  }

  // function initPTZUI() {
  //   $scope.supportPTZ = (AccountService.isPTZAble() || mAttr.isDigitalPTZ);
  //   $scope.ptzinfo = {
  //     type: (mAttr.isDigitalPTZ ? 'DPTZ' : 'PTZ')
  //   };
  // }

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    var defer = $q.defer();

    if (mAttr.EnableOptions !== 'undefined') {
      $scope.EnableOptions = mAttr.EnableOptions;
    }

    if (mAttr.ActivateOptions !== 'undefined') {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }

    if (mAttr.WeekDays !== 'undefined') {
      $scope.WeekDays = mAttr.WeekDays;
    }

    if (mAttr.TamperDetectThreshold !== 'undefined') {
      $scope.TamperDetectChartOptions.ceil = mAttr.TamperDetectThreshold.maxValue;
      $scope.TamperDetectChartOptions.floor = mAttr.TamperDetectThreshold.minValue;
    }

    if (mAttr.TamperDetectDuration !== 'undefined') {
      $scope.TamperDetectDurationSliderProperty.ceil = mAttr.TamperDetectDuration.maxValue;
      $scope.TamperDetectDurationSliderProperty.floor = mAttr.TamperDetectDuration.minValue;

      $scope.TamperDetectSensitivitySliderProperty.floor = mAttr.TamperDetectSensitivityLevel.minValue;
      $scope.TamperDetectSensitivitySliderProperty.ceil = mAttr.TamperDetectSensitivityLevel.maxValue;
    }

    if (mAttr.AlarmoutDurationOptions !== 'undefined') {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }

    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }

    $scope.EventActions = COMMONUtils.getSupportedEventActions("TamperingDetection");
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

    $scope.PTZModel = mAttr.PTZModel;
    $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
    $scope.MaxChannel = mAttr.MaxChannel;


    defer.resolve("success");
    return defer.promise;
  }

  // function refreshSlider() {
  //   $timeout(function() {
  //     $scope.$broadcast('rzSliderForceRender');
  //     $scope.$broadcast('reCalcViewDimensions');
  //   });
  // }

  // function getSliderColor() {
  //   return mAttr.sliderEnableColor;
  // }

  function getTamperDetection() {
    var getData = {
      Channel: UniversialManagerService.getChannelId()
    };



    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=view', getData,
      function(response) {
        $scope.TamperDetect = response.data.TamperingDetection[0];
        pageData.TamperDetect = angular.copy($scope.TamperDetect)

        console.log($scope.TamperDetect);

        $scope.TamperDetectChartOptions.ThresholdLevel = $scope.TamperDetect.ThresholdLevel;

        $scope.TamperDetectDurationSliderModel.data = $scope.TamperDetect.Duration;
        $scope.TamperDetectSensitivitySliderModel.data = $scope.TamperDetect.SensitivityLevel;


      },
      function(errorData) {
        console.log(errorData);
      }, '', true);


  }

  function setTamperDetection() {
    var setData = {};

    if (pageData.TamperDetect.Enable !== $scope.TamperDetect.Enable) {
      setData.Enable = $scope.TamperDetect.Enable;
    }

    if (pageData.TamperDetect.ThresholdLevel !== $scope.TamperDetect.ThresholdLevel) {
      setData.ThresholdLevel = $scope.TamperDetect.ThresholdLevel;
    }

    if (pageData.TamperDetect.SensitivityLevel !== $scope.TamperDetect.SensitivityLevel) {
      setData.SensitivityLevel = $scope.TamperDetect.SensitivityLevel;
    }

    if (pageData.TamperDetect.Duration !== $scope.TamperDetect.Duration) {
      setData.Duration = $scope.TamperDetect.Duration;
    }

    if (pageData.TamperDetect.DarknessDetection !== $scope.TamperDetect.DarknessDetection) {
      setData.DarknessDetection = $scope.TamperDetect.DarknessDetection;
    }

    setData.Channel = UniversialManagerService.getChannelId();



    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=set', setData,
      function() {
        pageData.TamperDetect = angular.copy($scope.TamperDetect);
      },
      function(errorData) {
        pageData.TamperDetect = angular.copy($scope.TamperDetect);
        console.log(errorData);
      }, '', true);
  }

  $scope.setTamperDetectionEnable = function() {
    COMMONUtils.ApplyConfirmation(
      function() {
        $rootScope.$emit('changeLoadingBar', true);
        var setData = {};

        setData.Channel = UniversialManagerService.getChannelId();

        if (pageData.TamperDetect.Enable !== $scope.TamperDetect.Enable) {
          setData.Enable = $scope.TamperDetect.Enable;
        }

        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=set', setData,
          function() {
            $rootScope.$emit('changeLoadingBar', false);
            pageData.TamperDetect.Enable = angular.copy($scope.TamperDetect.Enable);

            if ($scope.TamperDetect.Enable) {
              startMonitoringTamperingLevel();
            }
          },
          function(errorData) {
            if ($scope.TamperDetect.Enable) {
              startMonitoringTamperingLevel();
            }

            console.log(errorData);

            $rootScope.$emit('changeLoadingBar', false);
            $scope.TamperDetect.Enable = angular.copy(pageData.TamperDetect.Enable);
          }, '', true);
      },
      'sm',
      function() {
        $scope.TamperDetect.Enable = angular.copy(pageData.TamperDetect.Enable);
        if ($scope.TamperDetect.Enable) {
          startMonitoringTamperingLevel();
        }
      }
    );
  };

  function changeChannel(index) {
    $rootScope.$emit("channelSelector:changeChannel", index);
    $rootScope.$emit('changeLoadingBar', true);
    view();
  }

  function checkChangedData() {
    return !angular.equals(pageData.TamperDetect, $scope.TamperDetect) || !eventRuleService.checkEventRuleValidation();
  }

  function validatePage() {
    if (!eventRuleService.checkSchedulerValidation()) {
      COMMONUtils.ShowError('lang_msg_checkthetable');
      return false;
    }
    return true;
  }

  function setChangedData() {
    var deferred = $q.defer();
    var queue = [];

    if (!angular.equals(pageData.TamperDetect, $scope.TamperDetect)) {
      setTamperDetection();
    }

    if (queue.length > 0) {
      SunapiClient.sequence(queue, function() {
        $scope.$emit('applied', UniversialManagerService.getChannelId());
        $timeout(function() {
          view();
          deferred.resolve(true);
        });
      }, function(errorData) {
        console.error(errorData);
        deferred.reject(errorData);
      });
    } else {
      $scope.$emit('applied', UniversialManagerService.getChannelId());
      $timeout(function() {
        view();
        deferred.resolve(true);
      });
    }

    return deferred.promise;
  }


  $rootScope.$saveOn('channelSelector:selectChannel', function(event, index) {
    stopMonitoringTamperingLevel();

    if (checkChangedData()) {
      COMMONUtils.confirmChangeingChannel().then(function() {
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




  function view(data) {
    if (data === 0) {
      $rootScope.$emit('resetScheduleData', true);
    }
    var promises = [];

    promises.push(getTamperDetection);
    promises.push(showVideo);
    promises.push(getTamperingLevel);

    if (promises.length > 0) {
      $q.seqAll(promises).then(
        function() {
          $rootScope.$emit('changeLoadingBar', false);
          $scope.pageLoaded = true;
          $scope.$emit('pageLoaded', $scope.EventSource);
          $timeout(setSizeChart);

          if ($scope.TamperDetect.Enable) {
            startMonitoringTamperingLevel();
          } else {
            stopMonitoringTamperingLevel();
          }
        },
        function(errorData) {
          $rootScope.$emit('changeLoadingBar', false);
          console.log(errorData);
        }
      );
    } else {
      $scope.pageLoaded = true;
      $timeout(setSizeChart);
    }
  }

  function set() {


    if (validatePage()) {
      if (!angular.equals(pageData.TamperDetect, $scope.TamperDetect) || !angular.equals(pageData.EventRule, $scope.EventRule)) {
        stopMonitoringTamperingLevel();
        COMMONUtils.ApplyConfirmation(function() {
          var functionList = [];

          if (!angular.equals(pageData.TamperDetect, $scope.TamperDetect)) {
            functionList.push(setTamperDetection);
          }

          if (functionList.length > 0) {
            $q.seqAll(functionList).then(
              function() {
                $scope.$emit('applied', true);
                view();
              },
              function(errorData) {
                console.log(errorData);
              }
            );
          } else {
            $scope.$emit('applied', true);
            view();
          }

        }, 
        'sm',
        function() {

        });
      }
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