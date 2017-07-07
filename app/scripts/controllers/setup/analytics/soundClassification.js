/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('soundClassificationCtrl', function($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $q, $translate, $uibModal, $rootScope, $location, eventRuleService) {
  "use strict";

  var mAttr = Attributes.get();
  $scope.SelectedChannel = 0;
  COMMONUtils.getResponsiveObjects($scope);
  var pageData = {};
  pageData.soundClassification = {};
  $scope.SoundClassfication = {};

  $scope.EventSource = 'AudioAnalysis';

  $scope.EventRule = {};

  // $scope.SensitivitySliderModel = {
  //     data: 5
  // };
  // $scope.SensitivitySliderProperty =   {
  //     floor: 1,
  //     ceil: 10,
  //     showSelectionBar: true,
  //     vertical: false,
  //     showInputBox: true
  // };

  var audioanalysisView = '/stw-cgi/eventsources.cgi?msubmenu=audioanalysis&action=view';
  var audioanalysisSet = '/stw-cgi/eventsources.cgi?msubmenu=audioanalysis&action=set';

  $scope.SoundClassificationtChartOptions = {
    showInputBox: true,
    ThresholdLevel: 50,
    floor: 1,
    ceil: 100,
    width: 400,
    height: 150,
    disabled: false,
    onEnd: function() {}
  };

  $scope.$watch('SoundClassificationtChartOptions', function(newValue) {
    if (newValue.ThresholdLevel) {
      if ($scope.SoundClassfication !== undefined) {
        $scope.SoundClassfication.ThresholdLevel = $scope.SoundClassificationtChartOptions.ThresholdLevel;
      }
    }
  }, true);

  function getAttributes() {

    if (mAttr.EnableOptions !== undefined) {
      $scope.EnableOptions = mAttr.EnableOptions;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////// TODO : Will Change -> get from mAttr ////////////////////
    //////////////////////////////////////////////////////////////////////////////


    /////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
    if (mAttr.ActivateOptions !== undefined) {
      $scope.ActivateOptions = mAttr.ActivateOptions;
    }

    if (mAttr.WeekDays !== undefined) {
      $scope.WeekDays = mAttr.WeekDays;
    }

    if (mAttr.AlarmoutDurationOptions !== undefined) {
      $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
    }

    if (mAttr.InputThresholdLevelRange !== undefined) {
      $scope.SoundClassificationtChartOptions.ceil = mAttr.InputThresholdLevelRange.maxValue;
      $scope.SoundClassificationtChartOptions.floor = mAttr.InputThresholdLevelRange.minValue;
    }

    if (Attributes.isSupportGoToPreset() === true) {
      $scope.PresetOptions = Attributes.getPresetOptions();
    }

    $scope.EventActions = COMMONUtils.getSupportedEventActions("AudioAnalysis"); // TODO : Will Change MotionDetectionV2
    $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////

  }

  // $scope.$watch('SensitivitySliderModel.data', function () {
  //     if($scope.SensitivitySliderModel && $scope.SensitivitySliderModel.data){
  //         $scope.SoundClassfication.SensitivityLevel = $scope.SensitivitySliderModel.data;    
  //     }
  // });

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  $scope.msgClick = function() {
    $location.path('/setup/videoAudio_audioSetup');
  };

  $scope.setAudioanalysisEnable = function() {
    stopMonitoringSoundLevel();
    COMMONUtils.ApplyConfirmation(
      function() {
        var setData = {};

        setData.Channel = 0;

        if (pageData.SoundClassfication.Enable !== $scope.SoundClassfication.Enable) {
          setData.Enable = $scope.SoundClassfication.Enable;
        }

        return SunapiClient.get(audioanalysisSet, setData,
          function(response) {
            pageData.SoundClassfication.Enable = angular.copy($scope.SoundClassfication.Enable);

            if ($scope.SoundClassfication.Enable) {
              startMonitoringSoundLevel();
            }
          },
          function(errorData) {
            $scope.SoundClassfication.Enable = angular.copy(pageData.SoundClassfication.Enable);
            if ($scope.SoundClassfication.Enable) {
              startMonitoringSoundLevel();
            }
          }, '', true);
      },
      'sm',
      function() {
        $scope.SoundClassfication.Enable = angular.copy(pageData.SoundClassfication.Enable);
        if ($scope.SoundClassfication.Enable) {
          startMonitoringSoundLevel();
        }
      }
    );
  };

  function view(data) {
    if (data === 0) {
      $rootScope.$emit('resetScheduleData', true);
    }
    var promises = [];
    promises.push(getSoundClassificationData);

    $q.seqAll(promises).then(
      function() {
        $scope.pageLoaded = true;
        $scope.$emit('pageLoaded', $scope.EventSource);
        $("#imagepage").show();
        $timeout(setSizeChart);

        if ($scope.SoundClassfication.Enable) {
          startMonitoringSoundLevel();
        } else {
          stopMonitoringSoundLevel();
        }
      },
      function(errorData) {
        alert(errorData);
      }
    );
  }

  function setSizeChart() {
    var chart = "#sound-line-chart";
    var width = $(chart).parent().width();
    if (width > 480) {
      width = 480;
    }

    width -= 80;
    $scope.SoundClassificationtChartOptions.width = width;

    $(chart + " .graph").css("width", width + "px");
    $(chart + " .graph-border").css("width", (width - 27) + "px");
    $(chart + ".level-threshold-slider").css("width", (width + 100) + "px");
  }

  window.addEventListener('resize', setSizeChart);
  $scope.$on("$destroy", function() {
    window.removeEventListener('resize', setSizeChart);
  });

  function getSoundClassificationData() {
    var getData = {};

    return SunapiClient.get(
      audioanalysisView,
      getData,
      function(response) {
        // if((response.data.AudioAnalysis[0].SensitivityLevel < 1) ||
        //    (response.data.AudioAnalysis[0].SensitivityLevel > 10)){
        //     response.data.AudioAnalysis[0].SensitivityLevel = 5;
        // }
        var responseData = response.data.AudioAnalysis;
        pageData.SoundClassfication = angular.copy(responseData[0]);

        $scope.SoundClassfication = responseData[0];

        // $scope.SensitivitySliderModel = {
        //     data : $scope.SoundClassfication.SensitivityLevel
        // };

        $scope.SoundClassificationtChartOptions.ThresholdLevel = responseData[0].ThresholdLevel;
        prepareSoundType();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);

  }

  var soundTypeList = [
    'lang_screamsound',
    'lang_gunshotsound',
    'lang_explosionsound',
    'lang_galsscrashsound'
  ];

  var soundTypeOptions = [
    "Scream",
    "Gunshot",
    "Explosion",
    "GlassBreak"
  ];

  function convertSoundTypeForSunapi(key) {
    for (var i = 0, ii = soundTypeList.length; i < ii; i++) {
      if (soundTypeList[i] === key) {
        return soundTypeOptions[i];
      }
    }

    return false;
  }

  function prepareSoundType() {

    var soundType = $scope.SoundClassfication.SoundType;

    $scope.SoundClassfication.SoundType = {};

    for (var i = 0, ii = soundTypeList.length; i < ii; i++) {
      var key = soundTypeList[i];
      var option = convertSoundTypeForSunapi(key);
      var val = soundType.indexOf(option) > -1;
      $scope.SoundClassfication.SoundType[key] = val;
    }
  }

  var mStopMonotoringSoundLevel = false;
  var monitoringTimer = null;
  var destroyInterrupt = false;
  var maxSample = 4;

  $scope.$on("$destroy", function() {
    destroyInterrupt = true;
    stopMonitoringSoundLevel();
  });

  function startMonitoringSoundLevel() {
    mStopMonotoringSoundLevel = false;
    $scope.$broadcast('liveChartStart');

    if (monitoringTimer == null) {
      (function update() {
        getSoundLevel(function(data) {
          if (destroyInterrupt) return;
          var newSoundLevel = angular.copy(data);

          if (!mStopMonotoringSoundLevel) {
            if (newSoundLevel.length >= maxSample) {
              var index = newSoundLevel.length;

              while (index--) {
                var level = validateLevel(newSoundLevel[index]);

                if (level === null) continue;

                if ($scope.SoundClassificationtChartOptions.EnqueueData) {
                  $scope.SoundClassificationtChartOptions.EnqueueData(level);
                }
              }
            }
            monitoringTimer = $timeout(update, 300); //300 msec
          }
        });
      })();
    }
  }

  function stopMonitoringSoundLevel() {
    mStopMonotoringSoundLevel = true;
    mLastSequenceLevel = 0;
    $scope.$broadcast('liveChartStop');

    if (monitoringTimer !== null) {
      $timeout.cancel(monitoringTimer);
      monitoringTimer = null;
      $scope.SoundClassificationtChartOptions.EnqueueData(0);
    }
  }

  var mLastSequenceLevel = 0;

  function validateLevel(soundLevelObject) {
    if (mLastSequenceLevel > soundLevelObject.SequenceID) {
      return null;
    }

    mLastSequenceLevel = soundLevelObject.SequenceID;

    return soundLevelObject.Level;
  }

  function getSoundLevel(func) {
    var newSoundLevel = {};

    var getData = {};

    getData.MaxSamples = maxSample;

    getData.EventSourceType = 'AudioAnalysis';

    var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

    return SunapiClient.get(sunapiURL, getData,
      function(response) {
        newSoundLevel = angular.copy(response.data.AudioAnalysis[0].Samples);
        if (func !== undefined) {
          func(newSoundLevel);
        }
      },
      function(errorData) {
        console.log("getSoundLevel Error : ", errorData);
        stopMonitoringSoundLevel();
        startMonitoringSoundLevel();
      }, '', true);
  }


  function set() {
    if (validatePage()) {
      COMMONUtils.ApplyConfirmation(saveSettings);
    }
  }

  function saveSettings() { // soundClassification set -> event set
    setSoundClassificationData(
      function() {
        $scope.$emit('applied', true);
        view();
      }
    );
  }

  function setSoundClassificationData(callBack) {
    var setData = {};

    if (validation()) {
      callBack();
    } else {
      for (var reqKey in pageData.SoundClassfication) {
        if (reqKey == "SoundType") continue;
        if (pageData.SoundClassfication[reqKey] !== $scope.SoundClassfication[reqKey]) {
          setData[reqKey] = $scope.SoundClassfication[reqKey];
        }
      }

      setData['SoundType'] = getSettedSoundType().join(',');

      SunapiClient.get(
        audioanalysisSet,
        setData,
        function(response) {
          callBack();
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    }

    function validation() {
      var isOk = true;
      var soundType = getSettedSoundType();

      if (!angular.equals(pageData.SoundClassfication, $scope.SoundClassfication) ||
        !angular.equals(pageData.SoundType, soundType)) {
        isOk = false;
      }

      return isOk;
    }

    function getSettedSoundType() {
      var soundType = [];

      for (var soundTypeKey in $scope.SoundClassfication.SoundType) {
        if ($scope.SoundClassfication.SoundType[soundTypeKey] === true) {
          soundType.push(convertSoundTypeForSunapi(soundTypeKey));
        }
      }

      return soundType;
    }
  }

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

  function validatePage() {
    if (!eventRuleService.checkSchedulerValidation()) {
      COMMONUtils.ShowError('lang_msg_checkthetable');
      return false;
    }
    return true;
  }

  $(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
  });

  $scope.clearAll = function() {
    $timeout(function() {
      $scope.EventRule.ScheduleIds = [];
    });
  };
});