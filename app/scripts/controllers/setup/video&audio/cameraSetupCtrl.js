kindFramework.controller('cameraSetupCtrl', function($scope, $uibModal, $uibModalStack, SunapiClient, Attributes, COMMONUtils, LogManager, CameraSpec, $timeout, $location, MultiLanguage, $rootScope, $q, UniversialManagerService) {
  "use strict";

  $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

  var mAttr = Attributes.get(),
    pageData = {},
    previewData = {};

  $rootScope.isCameraSetupPreview = false;
  $rootScope.cameraSetupPreviewCount = 0;
  $rootScope.cameraSetupPreviewMaxCount = 10;
  $rootScope.cameraSetupToLive = false;

  pageData.recentUpdate = "None";
  $scope.sliderRefreshInProgress = false;
  $scope.data = {};
  $scope.presetPreview = false;
  $scope.presetTypeData = {};
  $scope.presetTypeData.PresetIndex = 0;
  $scope.presetTypeData.SelectedPreset = 0;
  $scope.presetTypeData.SelectedPresetType = 0;
  $scope.PresetImageConfig = [];
  $scope.disDisable = {};
  $scope.ptzToPreset = false;
  $scope.disChanged = {
    global: false,
    preset: false
  };

  $scope.ImageEnhancements = {
    SharpnessEnable: false,
    Contrast: 0
  };

  $scope.targetChannel = UniversialManagerService.getChannelId();

  /**
   * 탭 사용 조건 정의
   */
  $scope.tabMenu = {};
  $scope.tabUI = {};

  COMMONUtils.getResponsiveObjects($scope);
  // var BrowserDetect = COMMONUtils.getBrowserDetect();
  $scope.TableElementClass = COMMONUtils.getTableElementClass(5);
  $scope.IsImageInstalled = false;

  $scope.SSDRTabReady = false;
  $scope.SensorTabReady = false;
  $scope.imagePresetReady = false;
  $scope.imagePresetAFLKDefaultMode = 'Off';

  $scope.previewMode = false;

  var previewTimeout = 240000;

  $scope.ImageFile = '';
  $scope.ImageOptionsIndex = 0;

  $scope.ch = 0;
  $scope.HourArray = COMMONUtils.getArray(mAttr.MaxHours);
  $scope.MinutesInHoursArray = COMMONUtils.getArray(mAttr.MaxHours * mAttr.MaxMinutes);
  $scope.ScheduleColor = [];
  $scope.ImagePresetOffTitle = COMMONUtils.getTranslatedOption('Mode') + ' : ' + COMMONUtils.getTranslatedOption('UserPreset');
  $scope.ImagePresetOffTitle += '\r\n' + COMMONUtils.getTranslatedOption('Time') + ' : 00:00 - 23:59';

  $scope.showPTZControlBLC = false;

  $scope.Camera = {
    AGCMode: 'Off',
    DayNightModeSchedules: false
  };
  $scope.IRled = {
    Mode: 'Off'
  };

  $scope.WhiteBalance = {
    WhiteBalanceMode: 'Manual'
  };

  // $scope.HeaterSupport = mAttr.AuxCommands[0] == 'HeaterOn' ? true : false;

  $scope.ModelType = mAttr.ModelType;

  $scope.tabActiveData = {
    sensor: true,
    ssdr: false,
    whiteBalance: false,
    backLight: false,
    exposure: false,
    dayNight: false,
    special: false,
    osd: false,
    focus: false,
    heater: false,
    ir: false
  };

  $scope.isMultiChannel = false;

  $scope.channelChanged = false;

  $scope.gettingMultiLineOSD = false;

  $scope.loading = false;

  $scope.HLCOnOffChange = function() {
    if (typeof $scope.Camera.HLCOnOff === 'undefined') {
      $scope.Camera.HLCOnOff = 'HLCOff';
    }
  }

  $scope.HLCMaskChange = function() {
    if (typeof $scope.Camera.HLCMask === 'undefined') {
      $scope.Camera.HLCMask = 'MaskOff';
    }

    $scope.refreshSliders();
  }

  $scope.HLCMaskColorChange = function() {
    if (typeof $scope.Camera.HLCMaskColor === 'undefined') {
      $scope.Camera.HLCMaskColor = 'MaskColorBlack';
    }
  }


  // function getHLCSliderColor(value) {
  //   if ($scope.Camera.CompensationMode !== 'HLC') {
  //     return mAttr.sliderDisableColor;
  //   } else {
  //     return mAttr.sliderEnableColor;
  //   }
  // }

  function initHLCSliders() {
    initHLCBoundary();

    if (typeof $scope.Camera.HLCAreaTop !== 'undefined') {
      $scope.HLCAreaTopAdj.minValue = $scope.Camera.HLCAreaBottom - $scope.maxHLCLength;
      $scope.HLCAreaTopAdj.maxValue = $scope.Camera.HLCAreaBottom - $scope.minHLCHeightLength;

      if ($scope.HLCAreaTopAdj.minValue < 1) {
        $scope.HLCAreaTopAdj.minValue = 1;
      }

      if ($scope.HLCAreaTopAdj.maxValue > 100) {
        $scope.HLCAreaTopAdj.maxValue = 100;
      }

      $scope.HLCAreaBottomAdj.minValue = $scope.Camera.HLCAreaTop + $scope.minHLCHeightLength;
      $scope.HLCAreaBottomAdj.maxValue = $scope.Camera.HLCAreaTop + $scope.maxHLCLength;

      if ($scope.HLCAreaBottomAdj.minValue < 1) {
        $scope.HLCAreaBottomAdj.minValue = 1;
      }

      if ($scope.HLCAreaBottomAdj.maxValue > 100) {
        $scope.HLCAreaBottomAdj.maxValue = 100;
      }

      $scope.HLCAreaLeftAdj.minValue = $scope.Camera.HLCAreaRight - $scope.maxHLCLength;
      $scope.HLCAreaLeftAdj.maxValue = $scope.Camera.HLCAreaRight - $scope.minHLCWidthLength;

      if ($scope.HLCAreaLeftAdj.minValue < 1) {
        $scope.HLCAreaLeftAdj.minValue = 1;
      }

      if ($scope.HLCAreaLeftAdj.maxValue > 100) {
        $scope.HLCAreaLeftAdj.maxValue = 100;
      }

      $scope.HLCAreaRightAdj.minValue = $scope.Camera.HLCAreaLeft + $scope.minHLCWidthLength;
      $scope.HLCAreaRightAdj.maxValue = $scope.Camera.HLCAreaLeft + $scope.maxHLCLength;

      if ($scope.HLCAreaRightAdj.minValue < 1) {
        $scope.HLCAreaRightAdj.minValue = 1;
      }

      if ($scope.HLCAreaRightAdj.maxValue > 100) {
        $scope.HLCAreaRightAdj.maxValue = 100;
      }

      if (typeof $scope.Camera.HLCAreaTop !== 'undefined') {
        $scope.HLCTopSliderOptions = {
          floor: $scope.HLCAreaTopAdj.minValue,
          ceil: $scope.HLCAreaTopAdj.maxValue,
          showSelectionBar: true,
          onEnd: function() {
            return SetAreaRange('HLCAreaTop');
          },
          step: 1,
          keyboardSupport: false, //Bocz call backs are not working
          showInputBox: true,
          vertical: false
        };

        $scope.HLCBottomSliderOptions = {
          floor: $scope.HLCAreaBottomAdj.minValue,
          ceil: $scope.HLCAreaBottomAdj.maxValue,
          showSelectionBar: true,
          onEnd: function() {
            return SetAreaRange('HLCAreaBottom');
          },
          step: 1,
          keyboardSupport: false,
          showInputBox: true,
          vertical: false
        };

        $scope.HLCLeftSliderOptions = {
          floor: $scope.HLCAreaLeftAdj.minValue,
          ceil: $scope.HLCAreaLeftAdj.maxValue,
          showSelectionBar: true,
          onEnd: function() {
            return SetAreaRange('HLCAreaLeft');
          },
          step: 1,
          keyboardSupport: false,
          showInputBox: true,
          vertical: false
        };

        $scope.HLCRightSliderOptions = {
          floor: $scope.HLCAreaRightAdj.minValue,
          ceil: $scope.HLCAreaRightAdj.maxValue,
          showSelectionBar: true,
          onEnd: function() {
            return SetAreaRange('HLCAreaRight');
          },
          step: 1,
          keyboardSupport: false,
          showInputBox: true,
          vertical: false
        };

        $scope.HLCMaskToneSliderOptions = {
          floor: $scope.HLCMaskTone.minValue,
          ceil: $scope.HLCMaskTone.maxValue,
          showSelectionBar: true,
          onEnd: function() {
            return cameraChangeHandler();
          },
          step: 1,
          keyboardSupport: false, //Bocz call backs are not working
          showInputBox: true,
          vertical: false
        };
      }

      $scope.compensationModeChange(false);
    }
  }

  function initCommonSettings() {
    var deferred = $q.defer();
    $scope.HourOptions = [];
    for (var h = 0; h < mAttr.MaxHours; h++) {
      $scope.HourOptions.push(h);
    }

    $scope.MinuteOptions = [];
    for (var m = 0; m < mAttr.MaxMinutes; m++) {
      $scope.MinuteOptions.push(m);
    }

    var promise = imageOptionsView();
    if (typeof mAttr.MaxZoom !== 'undefined') {
        $scope.MaxZoom = mAttr.MaxZoom.maxValue;
    }
    $scope.PTZModel = mAttr.PTZModel;
    $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
    $scope.CurrentLanguage = mAttr.CurrentLanguage;
    $scope.OSDTitleLang = '';
    if ($scope.CurrentLanguage === "Chinese") {
      $scope.OSDCharSet = "^[^\\s\\\\~!@#&+;:<>,_=?{}\\[\\]|$%^*()]*$";
      $scope.OSDTitleLang = '中国语,';
    } else if ($scope.CurrentLanguage === "Korean") {
      $scope.OSDCharSet = "^[^\\s\\\\~!@#&+;:<>,_=?{}\\[\\]|$%^*()]*$";
      $scope.OSDTitleLang = '한글,';
    } else {
      $scope.OSDCharSet = mAttr.OSDCharSet;
    }
    $scope.defaultOSDPoint = {};
    $scope.defaultOSDPoint.dateTime = {
      pointX: 1,
      pointY: 2
    };
    if ($scope.PTZModel) {
      $scope.defaultOSDPoint.dateTime.pointY = 3;
    }

    $scope.EnableOptions = mAttr.EnableOptions;
    $scope.EnableDropdownOptions = mAttr.EnableDropdownOptions;
    $scope.ImagePresetModeOptions = mAttr.ImagePresetModeOptions;
    $scope.MaxOSDTitles = mAttr.MaxOSDTitles;

    promise.then(
      function() {
        deferred.resolve('Success');
      },
      function() {
        deferred.reject('Failure');
      }
    );
    return deferred.promise;
  }

  function getSelectedPreset() {
    if (typeof mAttr.DefaultPresetNumber === 'undefined' || !mAttr.DefaultPresetNumber) {
      $scope.presetTypeData.PresetIndex = 0;
      if ($scope.PresetNameValueOptions.length > 0) { 
        $scope.presetTypeData.SelectedPreset = $scope.PresetNameValueOptions[0].Preset; 
}      else { 
        $scope.presetTypeData.SelectedPreset = 0; 
      }
      $scope.presetTypeData.SelectedPresetType = 0;
    } else {
      var isCheck = false;
      for (var i = 0; i < $scope.PresetNameValueOptions.length; i++) {
        if (mAttr.DefaultPresetNumber == $scope.PresetNameValueOptions[i].Preset) {
          $scope.presetTypeData.PresetIndex = i;
          $scope.presetTypeData.SelectedPreset = $scope.PresetNameValueOptions[i].Preset;
          isCheck = true;
          $scope.ptzToPreset = true;
          break;
        }
      }
      if (!isCheck) {
        $scope.presetTypeData.PresetIndex = 0;
        if ($scope.PresetNameValueOptions.length > 0) {
          $scope.presetTypeData.SelectedPreset = $scope.PresetNameValueOptions[0].Preset;
        }        else {
          $scope.presetTypeData.SelectedPreset = 0;
      }
      }
      $scope.presetTypeData.SelectedPresetType = 1;
      Attributes.setDefaultPresetNumber(0);
    }
  }

  $scope.onPresetChange = function(Preset) {
    if ($scope.PresetNameValueOptions.length > 0) { 
      $scope.presetTypeData.SelectedPreset = $scope.PresetNameValueOptions[Preset].Preset;
    }    else {
      $scope.presetTypeData.SelectedPreset = 0;
    }
  };

  function onPresetTypeChange(Type) {
    if (Type === 'Global') {
      $scope.presetTypeData.SelectedPresetType = 0;
      $scope.presetTypeData.SelectedPreset = 0;
    } else {
      $scope.presetTypeData.SelectedPresetType = 1;
      $scope.presetTypeData.PresetIndex = 0;
      if ($scope.PresetNameValueOptions.length > 0) {
        $scope.presetTypeData.SelectedPreset = $scope.PresetNameValueOptions[0].Preset; 
}      else {
        $scope.presetTypeData.SelectedPreset = 0; 
      }
      //gotoPreset('Start',$scope.presetTypeData.SelectedPreset,false);
    }
    view();
  }
  $scope.onPresetTypeChange = onPresetTypeChange;
  $scope.$watch('presetTypeData.SelectedPresetType', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.refreshSliders(200);
      initTabActiveData();
    }
  });
  $scope.$watch('presetTypeData.SelectedPreset', function(newVal, oldVal) {
    if (newVal > 0 && oldVal === 0) {
      if ($scope.presetTypeData.SelectedPresetType === 1) {
        if ($scope.ptzToPreset === true) {
          $scope.ptzToPreset = false;
          return;
        }
        gotoPreset('Start', newVal);
      }
    } else if (newVal > 0 && oldVal > 0) {
      if ($scope.presetTypeData.SelectedPresetType == 1) {
        gotoPreset('Start', newVal, true, oldVal);
        initPresetImageConfig();
      }
    } else if (newVal === 0 && oldVal > 0) {
      if ($scope.presetTypeData.SelectedPresetType === 0) {
        gotoPreset('Stop', oldVal);
      }
    }
  });

  function gotoPreset(mode, Preset, presetChanged, oldPreset) {
    var promises = [];

    if (presetChanged === false) {
      promises.push(cameraStop);
    } else if (presetChanged === true) {
      if (typeof oldPreset !== 'undefined') {
        promises.push(oldPresetStop);
      }
    }
    if (presetChanged === false || typeof presetChanged === 'undefined') {
      promises.push(newPreset);
    }
    if (mode === 'Stop') {
      //promises.push(oldPresetGo);
    }
    $q.seqAll(promises).then(
      function() {},
      function(errorData) {}
    );

    function cameraStop() {
      var setData = {};
      setData.ImagePreview = 'Stop';
      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
        function(response) {},
        function(errorData) {}, '', true);
    }

    function oldPresetStop() {
      showLoadingBar(true);
      var stopData = {};
      stopData.ImagePreview = 'Stop';
      stopData.Channel = 0;
      stopData.Preset = oldPreset;
      return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', stopData,
        function(response) {
          $timeout(function() {
            newPreset();
          }, 500);
        },
        function(errorData) {}, '', true);

    }

    function newPreset() {
      var setData = {};
      setData.Channel = 0;
      setData.Preset = Preset === 0 ? 1 : Preset;
      if (mode === 'Start') {
        $scope.presetPreview = true;
        $scope.previewMode = true;
        extendPreviewMode();
      } else {
        $scope.presetPreview = false;
      }
      setData.ImagePreview = mode;
      return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
        function(response) {
          showLoadingBar(false);
        },
        function(errorData) {
          showLoadingBar(false);
        }, '', true);
    }

    function oldPresetGo() {
      var getData = {};
      getData.Channel = 0;
      getData.Preset = Preset;
      return SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control', getData,
        function(response) {},
        function(errorData) {}, '', true);
    }
  }

  function stopPreset() {
    var stopData = {};
    stopData.ImagePreview = 'Stop';
    stopData.Channel = 0;
    stopData.Preset = 1;
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', stopData,
      function(response) {},
      function(errorData) {}, '', true);
  }

  /**
   * 모든 탭을 비활성화 시킨 뒤,
   * 페이지 접근 시 가장 처음으로 보여줄 탭을 활성화.
   */
  function initTabActiveData() {
    initTabOrder();
    for (var k in $scope.tabActiveData) {
      $scope.tabActiveData[k] = false;
    }
    //        if($scope.PTZModel){
    //            $scope.tabActiveData.ssdr = true;
    //        }else{
    //            $scope.tabActiveData.sensor = true;
    //        }
    if ($scope.tabMenu.Sensor) {
      $scope.tabActiveData.sensor = true;
    } else {
      $scope.tabActiveData.ssdr = true;
    }
  }

  /**
   * 탭 사용 유무 정의
   */
  function initTabOrder() {
    if ($scope.PTZModel) {
      // PTZ Model
      $scope.tabMenu.Sensor = true;
      $scope.tabMenu.DayNight = true;

      if ($scope.presetTypeData.SelectedPresetType === 0) {
        //Global
        $scope.tabMenu.Sensor = true;
        $scope.tabMenu.SSDR = true;
        $scope.tabMenu.WhiteBalance = true;
        $scope.tabMenu.BackLight = true;
        $scope.tabMenu.Exposure = true;
        $scope.tabMenu.Special = true;
        $scope.tabMenu.OSD = $scope.MaxOSDTitles ? true : false;
        $scope.tabMenu.Focus = true;
        $scope.tabMenu.Heater = $scope.HeaterSupport;
        $scope.tabMenu.IR = (typeof $scope.IRledModeOptions !== 'undefined') ? true : false;
        $scope.tabMenu.DayNight = true;

        $scope.tabUI.SSDR = 0;
        $scope.tabUI.WhiteBalance = 0;
        $scope.tabUI.Exposure = 0;
        $scope.tabUI.Special = 0;
        $scope.tabUI.Focus = 0;
        $scope.tabUI.DayNight = 0;
      } else {
        //Preset
        $scope.tabMenu.Sensor = false;
        $scope.tabMenu.SSDR = true;
        $scope.tabMenu.WhiteBalance = true;
        $scope.tabMenu.BackLight = false;
        $scope.tabMenu.Exposure = true;
        $scope.tabMenu.Special = true;
        $scope.tabMenu.OSD = false;
        $scope.tabMenu.Focus = true;
        $scope.tabMenu.Heater = false; //$scope.HeaterSupport;
        $scope.tabMenu.IR = false;
        $scope.tabMenu.DayNight = true;

        $scope.tabUI.SSDR = 1;
        $scope.tabUI.WhiteBalance = 1;
        $scope.tabUI.Exposure = 1;
        $scope.tabUI.Special = 1;
        $scope.tabUI.Focus = 1;
        $scope.tabUI.DayNight = 1;
      }
    } else if ($scope.ZoomOnlyModel) {
      $scope.tabMenu.Sensor = true;
      $scope.tabMenu.SSDR = true;
      $scope.tabMenu.WhiteBalance = true;
      $scope.tabMenu.BackLight = true;
      $scope.tabMenu.Exposure = true;
      $scope.tabMenu.DayNight = true;
      $scope.tabMenu.Special = true;
      $scope.tabMenu.OSD = $scope.MaxOSDTitles ? true : false;
      $scope.tabMenu.Focus = true;
      $scope.tabMenu.Heater = $scope.HeaterSupport;
      $scope.tabMenu.IR = (typeof $scope.IRledModeOptions !== 'undefined');

      $scope.tabUI.SSDR = 0;
      $scope.tabUI.WhiteBalance = 0;
      $scope.tabUI.Exposure = 0;
      $scope.tabUI.Special = 0;
    } else {
      //default
      $scope.tabMenu.Sensor = true;
      $scope.tabMenu.SSDR = true;
      $scope.tabMenu.WhiteBalance = true;
      $scope.tabMenu.BackLight = true;
      $scope.tabMenu.Exposure = true;
      $scope.tabMenu.DayNight = true;
      $scope.tabMenu.Special = true;
      $scope.tabMenu.OSD = $scope.MaxOSDTitles ? true : false;
      $scope.tabMenu.Focus = false;
      $scope.tabMenu.Heater = $scope.HeaterSupport;
      $scope.tabMenu.IR = (typeof $scope.IRledModeOptions !== 'undefined') ? true : false;

      $scope.tabUI.SSDR = 0;
      $scope.tabUI.WhiteBalance = 0;
      $scope.tabUI.Exposure = 0;
      $scope.tabUI.Special = 0;
    }
  }
  $scope.$watch('tabActiveData.backLight', function(newVal, oldVal) {
    if (oldVal === false && newVal === true) {
      $timeout(function() {
        if ($scope.Camera.CompensationMode === 'BLC') {
          $scope.ptzinfo = {
            type: 'BLC',
            disable: false
          };
        } else if ($scope.Camera.CompensationMode === 'HLC') {
          $scope.ptzinfo = {
            type: 'HLC',
            disable: false
          };
        } else {
          $scope.ptzinfo = {
            type: 'BLC',
            disable: true
          };
        }
      });
    } else if (oldVal === true && newVal === false) {
      $scope.ptzinfo = {
        type: 'none'
      };
    }
  });
  $scope.$watch('tabActiveData.osd', function(newVal, oldVal) {
    if (oldVal === false && newVal === true) {
      $timeout(function() {
        $scope.ptzinfo = {
          type: 'OSD'
        };
      });
    } else if (oldVal === true && newVal === false) {
      $scope.ptzinfo = {
        type: 'none'
      };
    }
  });
  $scope.$on('changeBlcArea', function(args, data) {
    if (data.mode === 'top') {
      if (data.type === 'BLC') {
        if (data.direction === 'up') {
          $scope.Camera.BLCAreaTop = $scope.Camera.BLCAreaTop + data.step;
        } else if (data.direction === 'down') {
          $scope.Camera.BLCAreaTop = $scope.Camera.BLCAreaTop - data.step;
        }
        if ($scope.BLCTopSliderOptions.ceil <= $scope.Camera.BLCAreaTop) {
          $scope.Camera.BLCAreaTop = $scope.BLCTopSliderOptions.ceil;
        } else if ($scope.BLCTopSliderOptions.floor >= $scope.Camera.BLCAreaTop) {
          $scope.Camera.BLCAreaTop = $scope.BLCTopSliderOptions.floor;
        }
      } else {
        if (data.direction === 'up') {
          $scope.Camera.HLCAreaTop = $scope.Camera.HLCAreaTop + data.step;
        } else if (data.direction === 'down') {
          $scope.Camera.HLCAreaTop = $scope.Camera.HLCAreaTop - data.step;
        }
        if ($scope.HLCTopSliderOptions.ceil <= $scope.Camera.HLCAreaTop) {
          $scope.Camera.HLCAreaTop = $scope.HLCTopSliderOptions.ceil;
        } else if ($scope.HLCTopSliderOptions.floor >= $scope.Camera.HLCAreaTop) {
          $scope.Camera.HLCAreaTop = $scope.HLCTopSliderOptions.floor;
        }
      }
      //SetBlcRange('blcAreaTop');
      SetAreaRange(data.type + 'AreaTop');
    } else if (data.mode === 'left') {
      if (data.type === 'BLC') {
        if (data.direction === 'left') {
          $scope.Camera.BLCAreaLeft = $scope.Camera.BLCAreaLeft - data.step;
        } else if (data.direction === 'right') {
          $scope.Camera.BLCAreaLeft = $scope.Camera.BLCAreaLeft + data.step;
        }
        if ($scope.BLCLeftSliderOptions.ceil <= $scope.Camera.BLCAreaLeft) {
          $scope.Camera.BLCAreaLeft = $scope.BLCLeftSliderOptions.ceil;
        } else if ($scope.BLCLeftSliderOptions.floor >= $scope.Camera.BLCAreaLeft) {
          $scope.Camera.BLCAreaLeft = $scope.BLCLeftSliderOptions.floor;
        }
      } else {
        if (data.direction === 'left') {
          $scope.Camera.HLCAreaLeft = $scope.Camera.HLCAreaLeft - data.step;
        } else if (data.direction === 'right') {
          $scope.Camera.HLCAreaLeft = $scope.Camera.HLCAreaLeft + data.step;
        }
        if ($scope.HLCLeftSliderOptions.ceil <= $scope.Camera.HLCAreaLeft) {
          $scope.Camera.HLCAreaLeft = $scope.HLCLeftSliderOptions.ceil;
        } else if ($scope.HLCLeftSliderOptions.floor >= $scope.Camera.HLCAreaLeft) {
          $scope.Camera.HLCAreaLeft = $scope.HLCLeftSliderOptions.floor;
        }
      }
      //SetBlcRange('blcAreaLeft');
      SetAreaRange(data.type + 'AreaLeft');
    } else if (data.mode === 'right') {
      if (data.type === 'BLC') {
        if (data.direction === 'left') {
          $scope.Camera.BLCAreaRight = $scope.Camera.BLCAreaRight - data.step;
        } else if (data.direction === 'right') {
          $scope.Camera.BLCAreaRight = $scope.Camera.BLCAreaRight + data.step;
        }
        if ($scope.BLCRightSliderOptions.ceil <= $scope.Camera.BLCAreaRight) {
          $scope.Camera.BLCAreaRight = $scope.BLCRightSliderOptions.ceil;
        } else if ($scope.BLCRightSliderOptions.floor >= $scope.Camera.BLCAreaRight) {
          $scope.Camera.BLCAreaRight = $scope.BLCRightSliderOptions.floor;
        }
      } else {
        if (data.direction === 'left') {
          $scope.Camera.HLCAreaRight = $scope.Camera.HLCAreaRight - data.step;
        } else if (data.direction === 'right') {
          $scope.Camera.HLCAreaRight = $scope.Camera.HLCAreaRight + data.step;
        }
        if ($scope.HLCRightSliderOptions.ceil <= $scope.Camera.HLCAreaRight) {
          $scope.Camera.HLCAreaRight = $scope.HLCRightSliderOptions.ceil;
        } else if ($scope.HLCRightSliderOptions.floor >= $scope.Camera.HLCAreaRight) {
          $scope.Camera.HLCAreaRight = $scope.HLCRightSliderOptions.floor;
        }
      }
      //SetBlcRange('blcAreaRight');
      SetAreaRange(data.type + 'AreaRight');
    } else if (data.mode === 'bottom') {
      if (data.type === 'BLC') {
        if (data.direction === 'up') {
          $scope.Camera.BLCAreaBottom = $scope.Camera.BLCAreaBottom + data.step;
        } else if (data.direction === 'down') {
          $scope.Camera.BLCAreaBottom = $scope.Camera.BLCAreaBottom - data.step;
        }
        if ($scope.BLCBottomSliderOptions.ceil <= $scope.Camera.BLCAreaBottom) {
          $scope.Camera.BLCAreaBottom = $scope.BLCBottomSliderOptions.ceil;
        } else if ($scope.BLCBottomSliderOptions.floor >= $scope.Camera.BLCAreaBottom) {
          $scope.Camera.BLCAreaBottom = $scope.BLCBottomSliderOptions.floor;
        }
      } else {
        if (data.direction === 'up') {
          $scope.Camera.HLCAreaBottom = $scope.Camera.HLCAreaBottom + data.step;
        } else if (data.direction === 'down') {
          $scope.Camera.HLCAreaBottom = $scope.Camera.HLCAreaBottom - data.step;
        }
        if ($scope.HLCBottomSliderOptions.ceil <= $scope.Camera.HLCAreaBottom) {
          $scope.Camera.HLCAreaBottom = $scope.HLCBottomSliderOptions.ceil;
        } else if ($scope.HLCBottomSliderOptions.floor >= $scope.Camera.HLCAreaBottom) {
          $scope.Camera.HLCAreaBottom = $scope.HLCBottomSliderOptions.floor;
        }
      }
      //SetBlcRange('blcAreaBottom');
      SetAreaRange(data.type + 'AreaBottom');
    }
  });

  function SetBlcRange(direction) {
    // BLC Mode ON - Allow to set BLC Range
    if ($scope.Camera.CompensationMode !== 'BLC') {
      return;
    }

    if (direction == "blcAreaTop") {

      if ($scope.Camera.BLCAreaTop + $scope.maxBlcLength <= $scope.BLCAbsMax) {
        $scope.BLCBottomSliderOptions.ceil = $scope.Camera.BLCAreaTop + $scope.maxBlcLength;
      } else {
        $scope.BLCBottomSliderOptions.ceil = $scope.BLCAbsMax;
      }

      if ($scope.Camera.BLCAreaTop + $scope.minBLCHeightLength >= $scope.minBLCHeightLength) {
        $scope.BLCBottomSliderOptions.floor = $scope.Camera.BLCAreaTop + $scope.minBLCHeightLength;
      } else {
        $scope.BLCBottomSliderOptions.floor = $scope.minBLCHeightLength;
      }

    } else if (direction == "blcAreaBottom") {

      if ($scope.Camera.BLCAreaBottom - $scope.minBLCHeightLength <= $scope.BLCAbsMax - $scope.minBLCHeightLength) {
        $scope.BLCTopSliderOptions.ceil = $scope.Camera.BLCAreaBottom - $scope.minBLCHeightLength;
      } else {
        $scope.BLCTopSliderOptions.ceil = $scope.BLCAbsMax - $scope.minBLCHeightLength;
      }

      if ($scope.Camera.BLCAreaBottom - $scope.maxBlcLength > 0) {
        $scope.BLCTopSliderOptions.floor = $scope.Camera.BLCAreaBottom - $scope.maxBlcLength;
      } else {
        $scope.BLCTopSliderOptions.floor = $scope.BLCAbsMin;
      }

    } else if (direction == "blcAreaLeft") {

      if ($scope.Camera.BLCAreaLeft + $scope.maxBlcLength <= $scope.BLCAbsMax) {
        $scope.BLCRightSliderOptions.ceil = $scope.Camera.BLCAreaLeft + $scope.maxBlcLength;
      } else {
        $scope.BLCRightSliderOptions.ceil = $scope.BLCAbsMax;
      }

      if ($scope.Camera.BLCAreaLeft + $scope.minBLCWidthLength >= $scope.minBLCWidthLength) {
        $scope.BLCRightSliderOptions.floor = $scope.Camera.BLCAreaLeft + $scope.minBLCWidthLength;
      } else {
        $scope.BLCRightSliderOptions.floor = $scope.minBLCWidthLength;
      }

    } else if (direction == "blcAreaRight") {

      if ($scope.Camera.BLCAreaRight - $scope.minBLCWidthLength <= $scope.BLCAbsMax - $scope.minBLCWidthLength) {
        $scope.BLCLeftSliderOptions.ceil = $scope.Camera.BLCAreaRight - $scope.minBLCWidthLength;
      } else {
        $scope.BLCLeftSliderOptions.ceil = $scope.BLCAbsMax - $scope.minBLCWidthLength;
      }

      if ($scope.Camera.BLCAreaRight - $scope.maxBlcLength > 0) {
        $scope.BLCLeftSliderOptions.floor = $scope.Camera.BLCAreaRight - $scope.maxBlcLength;
      } else {
        $scope.BLCLeftSliderOptions.floor = $scope.BLCAbsMin;
      }
    }

    $scope.refreshSliders();
    cameraChangeHandler();
  }

  function initPresetGlobalType() {
    if (typeof mAttr.PresetTypes !== 'undefined') {
      $scope.PresetTypes = mAttr.PresetTypes;
    }
  }

  function getScheduleColorByMode(mode, addSchdeuleInfo) {
    var scheduleColor = '';

    if (mode === 'DefinitionFocus') {
      scheduleColor = 'cm-legend-sky-blue';
    } else if (mode === 'MotionFocus') {
      scheduleColor = 'cm-legend-orange';
    } else if (mode === 'ReducedNoise') {
      scheduleColor = 'cm-legend-green';
    } else if (mode === 'BrightVideo') {
      scheduleColor = 'cm-legend-purple';
    } else if (mode === 'MotionFocus+ReducedNoise') {
      scheduleColor = 'cm-legend-pink';
    } else if (mode === 'MotionFocus+BrightVideo') {
      scheduleColor = 'cm-legend-yellow';
    } else if (mode === 'VividVideo') {
      scheduleColor = 'cm-legend-red';
    } else if (mode === 'UserPreset') {
      scheduleColor = 'cm-legend-blue';
    }

    if (addSchdeuleInfo === true) {
      scheduleColor += ' schedule-color-info'
    }

    return scheduleColor;
  }
  $scope.getScheduleColorByMode = getScheduleColorByMode;

  $scope.setScheduleColor = function() {
    var n = 0,
      scheduleColor = '',
      preset = 0,
      schedule = {},
      range = [],
      fromMin = 0,
      fromHour = 0,
      toMin = 0,
      toHour = 0,
      schedCnt = 0,
      schedFrom = 0,
      schedTo = 0;

    /** Fill Common Schedule first  */
    scheduleColor = $scope.getScheduleColorByMode($scope.ImagePreset[$scope.ch].Mode);

    for (n in $scope.MinutesInHoursArray) {
      $scope.ScheduleColor[n] = scheduleColor;
    }

    /** If any particular schedule is applicable, check here */
    if ($scope.ImagePreset[$scope.ch].ScheduleEnable === true) {

      if (typeof $scope.ImagePreset[$scope.ch].Schedules !== 'undefined') {
        for (preset = 0; preset < $scope.ImagePreset[$scope.ch].Schedules.length; preset += 1) {
          schedule = $scope.ImagePreset[$scope.ch].Schedules[preset];
          range = schedule.EveryDay.FromTo.split('-');

          /** If Schedule mode is OFf then skip it, no need to check further  */
          if (schedule.Mode === 'Off') {
            continue;
          }

          /** If there is valid schedule available */
          if (range.length === 2) {
            fromHour = parseInt(range[0].split(':')[0], 10);
            fromMin = parseInt(range[0].split(':')[1], 10);
            toHour = parseInt(range[1].split(':')[0], 10);
            toMin = parseInt(range[1].split(':')[1], 10);

            schedFrom = (fromHour * 60) + fromMin;
            schedTo = (toHour * 60) + toMin;

            scheduleColor = $scope.getScheduleColorByMode(schedule.Mode);

            for (schedCnt = schedFrom; schedCnt <= schedTo; schedCnt += 1) {
              $scope.ScheduleColor[schedCnt] = scheduleColor;
            }
          }
        }
      }
    }
    $scope.imagePresetScheduleReady = true;
  }

  function refreshSliders(timeOutValue) {
    if ($scope.sliderRefreshInProgress === false) {
      $scope.sliderRefreshInProgress = true;

      $timeout(function() {
        $scope.$broadcast('rzSliderForceRender');
        $scope.$broadcast('reCalcViewDimensions');
        $scope.sliderRefreshInProgress = false;
      });

      if (typeof timeOutValue !== 'undefined') {
        $timeout(function() {
          $scope.$broadcast('rzSliderForceRender');
          $scope.$broadcast('reCalcViewDimensions');
          $scope.sliderRefreshInProgress = false;
        }, timeOutValue);
      }
    }

    $timeout(function() {
      $scope.$digest();
    });
  }

  $scope.refreshSliders = refreshSliders;

  $scope.openImagePresetSched = function(day, hour) {
    var prevSchedules = angular.copy($scope.ImagePreset[$scope.ch].Schedules);
    var modalInstance = $uibModal.open({
      size: 'lg',
      templateUrl: 'imagePresetScheduleModal.html',
      controller: 'imgPresetScheduleCtrl',
      windowClass: 'modal-position-middle',
      resolve: {
        ImagePreset: function() {
          return $scope.ImagePreset[$scope.ch];
        }
      }
    });

    modalInstance.result.then(function(selectedItem) {
      $scope.setScheduleColor();
      calcImagePresetScheduleStyle();
    }, function() {
      /** Discard changes done by user, when cancel button is clicked  */
      if (!angular.equals($scope.ImagePreset[$scope.ch].Schedules, prevSchedules)) {
        $scope.ImagePreset[$scope.ch].Schedules = angular.copy(prevSchedules);
        calcImagePresetScheduleStyle();
      }
    });
  }

  function isSSDRModeEnabled() {
    if (typeof $scope.SSDR !== 'undefined') {
      if ($scope.SSDR[$scope.ch].Enable === true) {
        return true;
      }
    }
    return false;
  }


  // function getSSDRSliderColor(value) {
  //   if (isSSDRModeEnabled() === false || isNotUserpresetMode() === true) {
  //     return mAttr.sliderDisableColor;
  //   } else {
  //     return mAttr.sliderEnableColor;
  //   }
  // }

  function initSSDRSlider() {
    $scope.SSDRSliderOptions = {
      floor: $scope.SSDRLevel.minValue,
      ceil: $scope.SSDRLevel.maxValue,
      showSelectionBar: true,
      disabled: true,
      step: 1,
      showInputBox: true,
      vertical: false
    };

    if (isSSDRModeEnabled() === false || isNotUserpresetMode() === true) {
      $scope.SSDRSliderOptions.disabled = true;
    } else {
      $scope.SSDRSliderOptions.disabled = false;
    }
  }

  function initSSDRSettings() {
    $scope.SensorModeOptions = mAttr.SensorModeOptions;
    $scope.MaxSensorFrameRate = parseInt($scope.SensorModeOptions[$scope.SensorModeOptions.length - 1]);
    $scope.SSDRDynamicRangeOptions = mAttr.SSDRDynamicRangeOptions;
    $scope.SSDRLevel = mAttr.SSDRLevel;

    if (typeof $scope.SSDRLevel !== 'undefined') {
      initSSDRSlider();
    }

    $scope.refreshSliders();
  }

  $scope.initSSDRSettings = initSSDRSettings;


  // function getWBSliderColor(value) {
  //   if (isWBManualMode() === false) {
  //     return mAttr.sliderDisableColor;
  //   } else {
  //     return mAttr.sliderEnableColor;
  //   }
  // }

  function isWBManualMode() {
    if (typeof $scope.WhiteBalance !== 'undefined') {
      if ($scope.WhiteBalance.WhiteBalanceMode === 'Manual') {
        return true;
      }
    }
    return false;
  }

  function whiteBalanceChangeHandler() {
    whiteBalanceSet(true);
    initWhiteBalanceSettings();
  }
  $scope.whiteBalanceChangeHandler = whiteBalanceChangeHandler;

  function initWhiteBalanceSettings() {
    $scope.WhiteBalanceModeOptions = mAttr.WhiteBalanceModeOptions;
    $scope.WBBlueLevel = mAttr.WhiteBalanceManualBlueLevel;
    $scope.WBRedLevel = mAttr.WhiteBalanceManualRedLevel;

    if (typeof $scope.WBBlueLevel !== 'undefined') {
      $scope.WBBlueSliderOptions = {
        floor: $scope.WBBlueLevel.minValue,
        ceil: $scope.WBBlueLevel.maxValue,
        showSelectionBar: true,
        onEnd: whiteBalanceChangeHandler,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      $scope.WBRedSliderOptions = {
        floor: $scope.WBRedLevel.minValue,
        ceil: $scope.WBRedLevel.maxValue,
        showSelectionBar: true,
        onEnd: whiteBalanceChangeHandler,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if (isWBManualMode() === false) {
        $scope.WBBlueSliderOptions.disabled = true;
        $scope.WBRedSliderOptions.disabled = true;
      } else {
        $scope.WBBlueSliderOptions.disabled = false;
        $scope.WBRedSliderOptions.disabled = false;
      }
    }
    $scope.refreshSliders();
  }
  $scope.initWhiteBalanceSettings = initWhiteBalanceSettings;

  function getBLCSliderColor(value) {

    if ($scope.Camera !== undefined) {
      if ($scope.Camera.CompensationMode === 'BLC' || $scope.Camera.CompensationMode === 'HLC') {
        return mAttr.sliderEnableColor;
      } else {
        return mAttr.sliderDisableColor;
      }
    } else {
      return mAttr.sliderDisableColor;
    }
  }

  $scope.compensationModeChange = function(isChanged) {
    if (isBLCCompensataionMode() === false) {
      $scope.BLCTopSliderOptions.disabled = true;
      $scope.BLCBottomSliderOptions.disabled = true;
      $scope.BLCLeftSliderOptions.disabled = true;
      $scope.BLCRightSliderOptions.disabled = true;
    } else {
      $scope.BLCTopSliderOptions.disabled = false;
      $scope.BLCBottomSliderOptions.disabled = false;
      $scope.BLCLeftSliderOptions.disabled = false;
      $scope.BLCRightSliderOptions.disabled = false;
    }

    var prevValue = previewData.Camera.CompensationMode,
      currentValue = $scope.Camera.CompensationMode,
      isAdjustShutterSpeed = false;

    /** off > WDR : changing to min(1/5), max(1/240)
        BLC > WDR : changing to min(1/5), max(1/240)

        WDR > BLC : changing to min(1/5), max(1/12000)
        WDR > off : changing to min(1/5), max(1/12000)

        off > BLC : not adjust
        BLC > off : not adjust

    */

    /** When moving to WDR or leaving WDR mode always adjust  */
    if (currentValue === 'WDR' || prevValue === 'WDR') {
      isAdjustShutterSpeed = true;
    }

    if (isAdjustShutterSpeed) {
      /** Adjust the shutter speeds */
      initShutterSpeeds(isChanged);
    }

    if ($scope.tabActiveData.backLight) {
      if ($scope.Camera.CompensationMode === 'BLC') {
        $scope.ptzinfo = {
          type: 'BLC',
          disable: false
        };
      } else if ($scope.Camera.CompensationMode === 'HLC') {
        $scope.ptzinfo = {
          type: 'HLC',
          disable: false
        };
      } else {
        $scope.ptzinfo = {
          type: 'BLC',
          disable: true
        };
      }
    }

    cameraChangeHandler();
    $scope.refreshSliders();
  };

  function isBLCCompensataionMode() {
    if (typeof $scope.Camera !== 'undefined') {
      if ($scope.Camera.CompensationMode === 'BLC') {
        return true;
      }
    }
    return false;
  }

  function initBLCSliders() {
    initBLCBoundary();

    if (typeof $scope.Camera.BLCAreaTop !== 'undefined') {
      $scope.BLCAreaTopAdj.minValue = $scope.Camera.BLCAreaBottom - $scope.maxBLCLength;
      $scope.BLCAreaTopAdj.maxValue = $scope.Camera.BLCAreaBottom - $scope.minBLCHeightLength;

      if ($scope.BLCAreaTopAdj.minValue < 1) {
        $scope.BLCAreaTopAdj.minValue = 1;
      }

      if ($scope.BLCAreaTopAdj.maxValue > 100) {
        $scope.BLCAreaTopAdj.maxValue = 100;
      }

      $scope.BLCAreaBottomAdj.minValue = $scope.Camera.BLCAreaTop + $scope.minBLCHeightLength;
      $scope.BLCAreaBottomAdj.maxValue = $scope.Camera.BLCAreaTop + $scope.maxBLCLength;

      if ($scope.BLCAreaBottomAdj.minValue < 1) {
        $scope.BLCAreaBottomAdj.minValue = 1;
      }

      if ($scope.BLCAreaBottomAdj.maxValue > 100) {
        $scope.BLCAreaBottomAdj.maxValue = 100;
      }

      $scope.BLCAreaLeftAdj.minValue = $scope.Camera.BLCAreaRight - $scope.maxBLCLength;
      $scope.BLCAreaLeftAdj.maxValue = $scope.Camera.BLCAreaRight - $scope.minBLCWidthLength;

      if ($scope.BLCAreaLeftAdj.minValue < 1) {
        $scope.BLCAreaLeftAdj.minValue = 1;
      }

      if ($scope.BLCAreaLeftAdj.maxValue > 100) {
        $scope.BLCAreaLeftAdj.maxValue = 100;
      }

      $scope.BLCAreaRightAdj.minValue = $scope.Camera.BLCAreaLeft + $scope.minBLCWidthLength;
      $scope.BLCAreaRightAdj.maxValue = $scope.Camera.BLCAreaLeft + $scope.maxBLCLength;

      if ($scope.BLCAreaRightAdj.minValue < 1) {
        $scope.BLCAreaRightAdj.minValue = 1;
      }

      if ($scope.BLCAreaRightAdj.maxValue > 100) {
        $scope.BLCAreaRightAdj.maxValue = 100;
      }

      $scope.BLCTopSliderOptions = {
        floor: $scope.BLCAreaTopAdj.minValue,
        ceil: $scope.BLCAreaTopAdj.maxValue,
        showSelectionBar: true,
        onEnd: function() {
          return SetAreaRange('BLCAreaTop');
        },
        step: 1,
        keyboardSupport: false, //Bocz call backs are not working
        showInputBox: true,
        vertical: false
      };
      $scope.BLCBottomSliderOptions = {
        floor: $scope.BLCAreaBottomAdj.minValue,
        ceil: $scope.BLCAreaBottomAdj.maxValue,
        showSelectionBar: true,
        onEnd: function() {
          return SetAreaRange('BLCAreaBottom');
        },
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };
      $scope.BLCLeftSliderOptions = {
        floor: $scope.BLCAreaLeftAdj.minValue,
        ceil: $scope.BLCAreaLeftAdj.maxValue,
        showSelectionBar: true,
        onEnd: function() {
          return SetAreaRange('BLCAreaLeft');
        },
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };
      $scope.BLCRightSliderOptions = {
        floor: $scope.BLCAreaRightAdj.minValue,
        ceil: $scope.BLCAreaRightAdj.maxValue,
        showSelectionBar: true,
        onEnd: function() {
          return SetAreaRange('BLCAreaRight');
        },
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      $scope.compensationModeChange(false);
    }
  }

  function initBLCBoundary() {



    // if (typeof $scope.Flip !== 'undefined') {
    //   rotate = $scope.Flip.Rotate;
    // }

    $scope.minBLCHeightLength = $scope.BLCAreaBottom.maxValue - $scope.BLCAreaTop.maxValue;
    $scope.minBLCWidthLength = $scope.BLCAreaRight.maxValue - $scope.BLCAreaLeft.maxValue;
    $scope.maxBLCLength = $scope.BLCAreaTop.maxValue;

    //if($scope.PTZModel){
    //    if (rotate == '90' || rotate == '270'){
    //        $scope.maxBlcLength = $scope.BLCAreaLeft.maxValue;
    //    } else {
    //        $scope.maxBlcLength = $scope.BLCAreaTop.maxValue;
    //    }
    //}
  }

  function initHLCBoundary() {



    // if ($scope.Flip !== undefined) {
    //   rotate = $scope.Flip.Rotate;
    // }

    $scope.minHLCHeightLength = $scope.HLCAreaBottom.maxValue - $scope.HLCAreaTop.maxValue;
    $scope.minHLCWidthLength = $scope.HLCAreaRight.maxValue - $scope.HLCAreaLeft.maxValue;
    $scope.maxHLCLength = $scope.HLCAreaTop.maxValue;

    // if (rotate == '90' || rotate == '270'){
    //     $scope.maxHLCLength = $scope.HLCAreaLeft.maxValue;
    // } else {
    //     $scope.maxHLCLength = $scope.HLCAreaTop.maxValue;
    // }
  }

  function cameraChangeHandler() {
    if (typeof $scope.Camera.CompensationMode !== 'undefined') {
      cameraSet(true);
    }
  }
  $scope.cameraChangeHandler = cameraChangeHandler;

  function initCameraSettings() {
    $scope.CompensationModeOptions = mAttr.CompensationModeOptions;
    $scope.WDRLevelOptions = mAttr.WDRLevelOptions;
    $scope.HLCLevelOptions = mAttr.HLCLevelOptions;
    $scope.HLCMaskTone = mAttr.HLCMaskTone;
    $scope.BLCLevelOptions = mAttr.BLCLevelOptions;
    $scope.BLCAreaTop = mAttr.BLCAreaTop;
    $scope.BLCAreaLeft = mAttr.BLCAreaLeft;
    $scope.BLCAreaRight = mAttr.BLCAreaRight;
    $scope.BLCAreaBottom = mAttr.BLCAreaBottom;
    $scope.HLCModeOptions = mAttr.HLCModeOptions;
    $scope.HLCMaskColorOptions = mAttr.HLCMaskColorOptions;
    $scope.HLCDimmingOptions = mAttr.HLCDimmingOptions;
    $scope.HLCAreaTop = mAttr.HLCAreaTop;
    $scope.HLCAreaLeft = mAttr.HLCAreaLeft;
    $scope.HLCAreaRight = mAttr.HLCAreaRight;
    $scope.HLCAreaBottom = mAttr.HLCAreaBottom;
    $scope.WDRSeamlessTransitionOptions = mAttr.WDRSeamlessTransitionOptions;
    $scope.WDRLowLightOptions = mAttr.WDRLowLightOptions;
    $scope.WDRIRLEDEnableOptions = mAttr.WDRIRLEDEnableOptions;
    $scope.CAROptions = mAttr.CAROptions;

    if (typeof $scope.BLCAreaTop !== 'undefined') {
      $scope.BLCAreaTopAdj = angular.copy($scope.BLCAreaTop);
      $scope.BLCAreaLeftAdj = angular.copy($scope.BLCAreaLeft);
      $scope.BLCAreaRightAdj = angular.copy($scope.BLCAreaRight);
      $scope.BLCAreaBottomAdj = angular.copy($scope.BLCAreaBottom);
      $scope.BLCAbsMin = $scope.BLCAreaTop.minValue;
      $scope.BLCAbsMax = $scope.BLCAreaBottom.maxValue;
      initBLCSliders();
    }

    if (typeof $scope.HLCAreaTop !== 'undefined') {
      $scope.HLCAreaTopAdj = angular.copy($scope.HLCAreaTop);
      $scope.HLCAreaLeftAdj = angular.copy($scope.HLCAreaLeft);
      $scope.HLCAreaRightAdj = angular.copy($scope.HLCAreaRight);
      $scope.HLCAreaBottomAdj = angular.copy($scope.HLCAreaBottom);
      $scope.HLCAbsMin = $scope.HLCAreaTop.minValue;
      $scope.HLCAbsMax = $scope.HLCAreaBottom.maxValue;
      initHLCSliders();
    }

    $scope.MinShutterOptions = mAttr.MinShutterOptions;
    $scope.MaxShutterOptions = mAttr.MaxShutterOptions;

    if (typeof mAttr.PreferShutterOptions !== 'undefined') {
      $scope.PreferShutterOptions = mAttr.PreferShutterOptions;
    }

    $scope.AFLKModeOptions = mAttr.AFLKModeOptions;

    $scope.SSNRModeOptions = mAttr.SSNRModeOptions;
    if (typeof mAttr.SSNRLevel !== 'undefined') {
      $scope.SSNRLevelOptions = COMMONUtils.getArray(mAttr.SSNRLevel.maxValue, true);
    }
    $scope.IrisModeOptions = mAttr.IrisModeOptions;
    $scope.IrisFnoOptions = mAttr.IrisFnoOptions;
    $scope.PIrisModeOptions = mAttr.PIrisModeOptions;
    $scope.PIrisPosition = mAttr.PIrisPosition;
    if (mAttr.PTZModel === true) {
      $scope.AGCModeOptions = [];
      for (var i = 0; i < mAttr.AGCModeOptions.length; i++) {
        if (mAttr.AGCModeOptions[i] !== 'Manual') {
          $scope.AGCModeOptions.push(mAttr.AGCModeOptions[i]);
        }
      }
    } else {
      $scope.AGCModeOptions = mAttr.AGCModeOptions;
    }

    if (typeof mAttr.AGCLevel !== 'undefined') {
      $scope.AGCLevelOptions = COMMONUtils.getArray(mAttr.AGCLevel.maxValue, false);
    }

    $scope.DayNightModeOptions = mAttr.DayNightModeOptions;
    $scope.DayNightSwitchingTimeOptions = mAttr.DayNightSwitchingTimeOptions;
    $scope.DayNightSwitchingModeOptions = mAttr.DayNightSwitchingModeOptions;
    $scope.DayNightAlarmInOptions = mAttr.DayNightAlarmInOptions;

    $scope.HeaterSupport = (mAttr.AuxCommands[0] === 'HeaterOn') ? true : false;

    initExposureSliders();
  }

  $scope.isSSNRLevelDisabled = function() {
    if (isNotUserpresetMode() || $scope.Camera.AGCMode === 'Off') {
      return true;
    }

    if (typeof $scope.Camera.SSNRMode !== 'undefined') {
      return ($scope.Camera.SSNRMode === 'Off')
    } else {
      return ($scope.Camera.SSNREnable === 'false' || $scope.Camera.SSNREnable === false);
    }
  };

  $scope.dayNames = [
    'SUN',
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT'
  ];

  $scope.dayNightEveryDayChanged = function() {

    /** nothing to do while disabling daynight schedule  */
    if ($scope.Camera.DayNightModeSchedules.EveryDay.DayNightSchedule === false) {
      return;
    }

    var everyDayFromTo = $scope.Camera.DayNightModeSchedules.EveryDay.FromTo;

    $.each($scope.Camera.DayNightModeSchedules, function(day, dayDetails) {
      if (day !== 'EveryDay') {
        dayDetails.FromTo = everyDayFromTo;
      }
    });
  };

  $scope.getHeaterTranslation = function () {
      if (mAttr.PTZModel && $scope.MaxZoom == 12) {
          return COMMONUtils.getTranslatedOption('Heater');
      } else {
          return COMMONUtils.getTranslatedOption('Fan');
      }
  };
  $scope.heaterEveryDayChanged = function() {

    /** nothing to do while disabling daynight schedule  */
    if ($scope.HeaterSchedules.EveryDay.Enable === false) {
      return;
    }

    var everyDayFromTo = $scope.HeaterSchedules.EveryDay.FromTo;

    $.each($scope.HeaterSchedules, function(day, dayDetails) {
      if (day !== 'EveryDay') {
        dayDetails.FromTo = everyDayFromTo;
      }
    });
  };

  function initShutterSpeeds(isChanged) {
    if ((typeof $scope.ImageOptions !== 'undefined') && (typeof $scope.ImageOptions.ShutterSpeedDetails !== 'undefined')) {
      var compMode = 'Off',
        sensorMode = 30,
        ShutterSpeedDetails = {},
        sensorModeCnt = 0,
        compModeCnt = 0;

      if (typeof $scope.ImageOptions.ShutterSpeedDetails !== 'undefined') {
        ShutterSpeedDetails = $scope.ImageOptions.ShutterSpeedDetails;
      } else {
        LogManager.debug("initShutterSpeeds: Image options doesnt have shutter speed details");
      }

      if (typeof $scope.Camera !== 'undefined') {
        compMode = $scope.Camera.CompensationMode;
      } else {
        LogManager.debug("initShutterSpeeds: compensation mode not initilaized ");
      }

      if (typeof $scope.VideoSources !== 'undefined') {
        sensorMode = parseInt($scope.VideoSources.SensorCaptureFrameRate);
      } else {
        LogManager.debug(" initShutterSpeeds: sensor capture ");
      }

      if (typeof ShutterSpeedDetails.CompensationModes !== 'undefined') {
        for (compModeCnt = 0; compModeCnt < ShutterSpeedDetails.CompensationModes.length; compModeCnt += 1) {
          if (ShutterSpeedDetails.CompensationModes[compModeCnt].CompensationMode === compMode) {
            var modeDetails = ShutterSpeedDetails.CompensationModes[compModeCnt];
            for (sensorModeCnt = 0; sensorModeCnt < modeDetails.SensorCaptureFrameRates.length; sensorModeCnt += 1) {
              if (modeDetails.SensorCaptureFrameRates[sensorModeCnt].SensorCaptureFrameRate === sensorMode) {
                $scope.selectedShutterDetails = modeDetails.SensorCaptureFrameRates[sensorModeCnt];

                /** Adjust Shutter Speeds  based on compenstation mode */
                if ((typeof $scope.Camera !== 'undefined') && (isChanged === true)) {
                  LogManager.debug("Min Shutter Adjusted ", $scope.Camera.AutoShortShutterSpeed, " -> ", modeDetails.DefaultAutoShortShutterSpeed);
                  LogManager.debug("Max Shutter Adjusted ", $scope.Camera.AutoLongShutterSpeed, " -> ", modeDetails.DefaultAutoLongShutterSpeed);
                  LogManager.debug("Prefer Shutter Adjusted ", $scope.Camera.PreferShutterSpeed, " -> ", modeDetails.DefaultPreferShutterSpeed);
                  //$scope.Camera.AutoShortShutterSpeed = modeDetails.DefaultAutoShortShutterSpeed;
                  //$scope.Camera.AutoLongShutterSpeed = modeDetails.DefaultAutoLongShutterSpeed;
                  var defaultShutterSpeed = CameraSpec.getDefaultShutterSpeed($scope.MaxSensorFrameRate).ShutterSpeedDetails.CompensationModes[compModeCnt];
                  $scope.Camera.AutoShortShutterSpeed = defaultShutterSpeed.SensorCaptureFrameRates[sensorModeCnt].DefaultAutoShortShutterSpeed;
                  $scope.Camera.AutoLongShutterSpeed = defaultShutterSpeed.SensorCaptureFrameRates[sensorModeCnt].DefaultAutoLongShutterSpeed;
                  if($scope.isHDMIOutSupported) {
                    $scope.Camera.PreferShutterSpeed = $scope.Camera.AutoShortShutterSpeed;
                  } else {
                    $scope.Camera.PreferShutterSpeed = modeDetails.SensorCaptureFrameRates[sensorModeCnt].DefaultPreferShutterSpeed;
                  }
                  changePreferShutterByFPS();
                }
                return true;
              }
            }
          }
        }
      } else {
        LogManager.debug(" initShutterSpeeds: init Shutter speec failed  ");
      }
    }

    return false;
  }
  $scope.initShutterSpeeds = initShutterSpeeds;

  $scope.isShutterSpeedDisabled = function() {
    if (isNotUserpresetMode() || $scope.Camera.AFLKMode !== 'Off') {
      return true;
    }
    return false;
  };

  function isSupportesShutterSpeed(shutterSpeed, type) {
    if (typeof $scope.selectedShutterDetails !== 'undefined') {
      var minShutterList = {},
        maxShutterList = {},
        preferShutterList = {},
        retVal = false,
        minShutterIndex = 0,
        curMinIndex = 0,
        maxShutterIndex = 0,
        curMaxIndex = 0,
        preferShutterIndex = 0,
        curPrefIndex = 0;

      minShutterList = $scope.selectedShutterDetails.AutoShortShutterSpeed;
      maxShutterList = $scope.selectedShutterDetails.AutoLongShutterSpeed;

      if (type === 'min') {
        retVal = (minShutterList.indexOf(shutterSpeed) === -1) ? true : false;

        /* If valid then check if min > max, min > prefer*/
        if ((retVal === false) && (typeof $scope.Camera !== 'undefined')) {
          maxShutterIndex = $scope.MinShutterOptions.indexOf($scope.Camera.AutoLongShutterSpeed);
          preferShutterIndex = $scope.PreferShutterOptions.indexOf($scope.Camera.PreferShutterSpeed);
          curMinIndex = $scope.MinShutterOptions.indexOf(shutterSpeed);

          if (curMinIndex > maxShutterIndex || curMinIndex > preferShutterIndex) {
            retVal = true;
            //console.log('Min and max dependency', shutterSpeed, type, curMinIndex, maxShutterIndex);
          }
        }
        /*else {
         console.log('Not supported speeed', shutterSpeed, type);
         }*/
      } else if (type === 'max') {
        retVal = (maxShutterList.indexOf(shutterSpeed) === -1) ? true : false;

        /* If valid then check if max < min, max < prefer */
        if ((retVal === false) && (typeof $scope.Camera !== 'undefined')) {
          minShutterIndex = $scope.MaxShutterOptions.indexOf($scope.Camera.AutoShortShutterSpeed);
          preferShutterIndex = $scope.PreferShutterOptions.indexOf($scope.Camera.PreferShutterSpeed);
          curMaxIndex = $scope.MaxShutterOptions.indexOf(shutterSpeed);

          if (curMaxIndex < minShutterIndex || curMaxIndex < preferShutterIndex) {
            retVal = true;
            //console.log('Min and max dependency', shutterSpeed, type, curMaxIndex, minShutterIndex);
          }

        }
        /*else {
         console.log('Not supported speeed', shutterSpeed, type);
         }*/
      }

      if (typeof $scope.PreferShutterOptions !== 'undefined') {
        preferShutterList = $scope.selectedShutterDetails.PreferShutterSpeed;
        if (type === 'prefer') {
          retVal = (preferShutterList.indexOf(shutterSpeed) === -1) ? true : false;

          /* If valid then check if prefer < min, prefer > max */
          if ((retVal === false) && (typeof $scope.Camera !== 'undefined')) {
            minShutterIndex = $scope.MaxShutterOptions.indexOf($scope.Camera.AutoShortShutterSpeed);
            maxShutterIndex = $scope.MinShutterOptions.indexOf($scope.Camera.AutoLongShutterSpeed);
            curPrefIndex = $scope.PreferShutterOptions.indexOf(shutterSpeed);

            if (curPrefIndex < minShutterIndex || curPrefIndex > maxShutterIndex) {
              retVal = true;
            }
          }
        }
      }

      return retVal;
    }
    return true;
  }
  $scope.isSupportesShutterSpeed = isSupportesShutterSpeed;

  function isPirisManualMode() {
    if (typeof $scope.Camera !== 'undefined') {
      if ($scope.Camera.IrisMode !== 'Auto' && $scope.Camera.IrisMode !== 'Manual' && $scope.Camera.PIrisMode === 'Manual') {
        return true;
      }
    }
    return false;
  }


  // function getPIrisSliderColor() {
  //   if (isPirisManualMode() === true) {
  //     return mAttr.sliderEnableColor;
  //   } else {
  //     return mAttr.sliderDisableColor;
  //   }
  // }

  function initExposureSliders() {
    if (typeof $scope.Brightness !== 'undefined') {
      $scope.BrigntnesSliderOptions = {
        floor: $scope.Brightness.minValue,
        ceil: $scope.Brightness.maxValue,
        showSelectionBar: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };
    }
    if (typeof $scope.PIrisPosition !== 'undefined') {
      $scope.PIrisSliderOptions = {
        floor: $scope.PIrisPosition.minValue,
        ceil: $scope.PIrisPosition.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        onEnd: cameraChangeHandler,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if (isPirisManualMode() === true) {
        $scope.PIrisSliderOptions.disabled = false;
      } else {
        $scope.PIrisSliderOptions.disabled = true;
      }
    }

    if (typeof $scope.SharpnessLevel !== 'undefined') {
      $scope.SharpnessSliderOptions = {
        floor: $scope.SharpnessLevel.minValue,
        ceil: $scope.SharpnessLevel.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        //onEnd: cameraChangeHandler,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if ($scope.ImageEnhancements.SharpnessEnable === false) {
        $scope.SharpnessSliderOptions.disabled = true;
      } else {
        $scope.SharpnessSliderOptions.disabled = false;
      }
    }

    if (typeof $scope.Contrast !== 'undefined') {
      $scope.ContrastSliderOptions = {
        floor: $scope.Contrast.minValue,
        ceil: $scope.Contrast.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        //onEnd: cameraChangeHandler,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if ($scope.ImageEnhancements.Contrast === false) {
        $scope.ContrastSliderOptions.disabled = true;
      } else {
        $scope.ContrastSliderOptions.disabled = false;
      }
    }

    if (typeof $scope.Saturation !== 'undefined') {
      $scope.SaturationSliderOptions = {
        floor: $scope.Saturation.minValue,
        ceil: $scope.Saturation.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if ($scope.isNotUserpresetMode() === false) {
        $scope.SaturationSliderOptions.disabled = false;
      } else {
        $scope.SaturationSliderOptions.disabled = true;
      }
    }

    if (typeof $scope.DefogLevel !== 'undefined') {
      $scope.DefogSliderOptions = {
        floor: $scope.DefogLevel.minValue,
        ceil: $scope.DefogLevel.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if ($scope.ImageEnhancements.DefogMode === 'Off' || $scope.ImageEnhancements.DefogMode === 'Auto') {
        $scope.DefogSliderOptions.disabled = true;
      } else {
        $scope.DefogSliderOptions.disabled = false;
      }
    }

    if (typeof $scope.LDCLevel !== 'undefined') {
      $scope.LDCSliderOptions = {
        floor: $scope.LDCLevel.minValue,
        ceil: $scope.LDCLevel.maxValue,
        showSelectionBar: true,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };

      if ($scope.ImageEnhancements.LDCMode !== 'Manual') {
        $scope.LDCSliderOptions.disabled = true;
      } else {
        $scope.LDCSliderOptions.disabled = false;
      }
    }

    $scope.refreshSliders();
    //cameraChangeHandler();
  }

  $scope.initExposureSliders = initExposureSliders;

  $scope.prepareToTranslateDayName = function(dayName) {
    return 'lang_' + dayName.toLowerCase();
  };

  function initImageEnhancementSettings() {
    $scope.Brightness = mAttr.Brightness;
    $scope.SharpnessLevel = mAttr.SharpnessLevel;
    $scope.Gamma = mAttr.Gamma;

    if (typeof mAttr.Gamma !== 'undefined') {
      var offset = mAttr.Gamma.minValue;
      $scope.GammaOptions = [];
      for (var i = mAttr.Gamma.minValue; i <= mAttr.Gamma.maxValue; i++) {
        var option = {};
        option.Text = CameraSpec.GammaOptions[i - offset];
        option.Value = parseInt(i, 10);
        $scope.GammaOptions.push(option);
      }
    }
    $scope.Contrast = mAttr.Contrast;
    $scope.Saturation = mAttr.Saturation;
    $scope.DefogModeOptions = mAttr.DefogModeOptions;
    $scope.DefogLevel = mAttr.DefogLevel;
    $scope.LDCModeOptions = mAttr.LDCModeOptions;
    $scope.LDCLevel = mAttr.LDCLevel;

    initExposureSliders();
  }

  $scope.isDigitalZoomDisabled = function() {
    if (typeof $scope.ImageEnhancements === 'undefined') {
      return; 
    }
    return ($scope.ImageEnhancements.DISEnable === 'true' || $scope.ImageEnhancements.DISEnable === true);
  };
  $scope.isDigitalZoomLimitDisabled = function() {
    if ($scope.PTZSettings.DigitalZoomEnable === 'false' || $scope.PTZSettings.DigitalZoomEnable === false) {
      return true;
    }
    if (typeof $scope.ImageEnhancements === 'undefined') { 
      return; 
    }
    return ($scope.ImageEnhancements.DISEnable === 'true' || $scope.ImageEnhancements.DISEnable === true);
  };
  $scope.isDisDisabled = function() {
    if (typeof $scope.ImageEnhancements === 'undefined') {
      return; 
    }

    if (mAttr.PTZModel || mAttr.ZoomOnlyModel) {
      return ($scope.disDisable.TamperDetectEnable === true || $scope.disDisable.DetectionType !== 'Off');
    } else {
      return false;
    }
  };


  function initFocusSettings() {
    $scope.FocusModeOptions = mAttr.FocusModeOptions;
    $scope.ZoomTrackingModeOptions = mAttr.ZoomTrackingModeOptions;
    $scope.ZoomTrackingSpeedOptions = mAttr.ZoomTrackingSpeedOptions;
    $scope.LensResetScheduleOptions = mAttr.LensResetScheduleOptions;
    $scope.DigitalZoomEnable = mAttr.DigitalZoomEnable;
    $scope.MaxDigitalZoomOptions = mAttr.MaxDigitalZoomOptions;
  }

  function initIRLedSliders() {
    if (typeof $scope.IRledLevel !== 'undefined') {
      $scope.IRledSliderOptions = {
        floor: $scope.IRledLevel.minValue,
        ceil: $scope.IRledLevel.maxValue,
        showSelectionBar: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        disabled: true,
        vertical: false
      };

      if ($scope.IRled.Mode !== 'Manual') {
        $scope.IRledSliderOptions.disabled = true;
      } else {
        $scope.IRledSliderOptions.disabled = false;
      }
    }

    if (typeof $scope.LEDOnLevel !== 'undefined') {
      $scope.LEDOnLevelSliderOptions = {
        floor: $scope.LEDOnLevel.minValue,
        ceil: $scope.LEDOnLevel.maxValue,
        showSelectionBar: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        disabled: true,
        vertical: false,
        onEnd: $scope.irLedOnLevelChanged
      };

      if ($scope.IRled.Mode !== 'Sensor') {
        $scope.LEDOnLevelSliderOptions.disabled = true;
      } else {
        $scope.LEDOnLevelSliderOptions.disabled = false;
      }
    }

    if (typeof $scope.LEDOffLevel !== 'undefined') {
      $scope.LEDOffLevelSliderOptions = {
        floor: $scope.LEDOffLevel.minValue,
        ceil: $scope.LEDOffLevel.maxValue,
        showSelectionBar: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        disabled: true,
        vertical: false,
        onEnd: $scope.irLedOffLevelChanged
      };

      if ($scope.IRled.Mode !== 'Sensor') {
        $scope.LEDOffLevelSliderOptions.disabled = true;
      } else {
        $scope.LEDOffLevelSliderOptions.disabled = false;
      }
    }

    //$scope.irledChangeHandler();
  }

  function initIRLedSetting() {
    $scope.IRledModeOptions = mAttr.IRledModeOptions;
    $scope.IRledLevel = mAttr.IRledLevel;
    $scope.LEDOnLevel = mAttr.LEDOnLevel;
    $scope.LEDOffLevel = mAttr.LEDOffLevel;
    $scope.LEDPowerControlModeOptions = mAttr.LEDPowerControlModeOptions;
    $scope.LEDMaxPowerOptions = mAttr.LEDMaxPowerOptions;

    initIRLedSliders();
  }
  $scope.irLedOnLevelChanged = function() {
    if ($scope.IRled.LEDOnLevel + 10 >= $scope.IRled.LEDOffLevel) {
      $scope.IRled.LEDOffLevel = $scope.IRled.LEDOnLevel + 10;
    }
  };
  $scope.irLedOffLevelChanged = function() {
    if ($scope.IRled.LEDOffLevel - 10 <= $scope.IRled.LEDOnLevel) {
      $scope.IRled.LEDOnLevel = $scope.IRled.LEDOffLevel - 10;
    }
  };

  function isPresetSSDRModelEnabled() {
    if (typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex] !== 'undefined') {
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Enable === true) {
        return true;
      }
    }
    return false;
  }


  // function getPresetSSDRSliderColor() {
  //   if (isPresetSSDRModelEnabled() === false) {
  //     return mAttr.sliderDisableColor;
  //   } else {
  //     return mAttr.sliderEnableColor;
  //   }
  // }

  function initPresetSSDRSlider() {
    $scope.PresetSSDRSliderOptions = {
      floor: $scope.PresetSSDRLevel.minValue,
      ceil: $scope.PresetSSDRLevel.maxValue,
      showSelectionBar: true,
      disabled: true,
      step: 1,
      showInputBox: true,
      vertical: false
    };
    if (isPresetSSDRModelEnabled() === false) {
      $scope.PresetSSDRSliderOptions.disabled = true;
    } else {
      $scope.PresetSSDRSliderOptions.disabled = false;
    }
  }

  function initPresetSSDRSettings() {
    $scope.PresetDynamicRangeOptions = mAttr.PresetDynamicRangeOptions;
    $scope.PresetSSDRLevel = mAttr.PresetSSDRLevel;
    if (typeof $scope.PresetSSDRLevel !== 'undefined') {
      initPresetSSDRSlider();
    }
    refreshSliders();
  }
  $scope.initPresetSSDRSettings = initPresetSSDRSettings;

  function registerPresetSsdrWatcher() {
    if ($scope.PresetSSDRWatcherReady === true) {
      return;
    }

    $scope.PresetSSDRWatcherReady = true;
    $scope.$watch('PresetImageConfig[presetTypeData.PresetIndex].SSDR', function(newVal, oldVal) {
      setPresetSSDR(true);
    }, true);
  }

  function setPresetSSDR(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;
    if ($scope.PresetImageConfig.length === 0) {
      return; 
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR)) {
        return;
      }
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Enable === false) {
      ignoredKeys = ['Level', 'DynamicRange'];
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR,
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR,
        ignoredKeys, false);
    }


    if (changed) {
      var uri = '/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set';
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      if (setData.hasOwnProperty('Enable')) {
        setData.SSDREnable = setData.Enable;
        delete setData.Enable;
      }
      if (setData.hasOwnProperty('Level')) {
        setData.SSDRLevel = setData.Level;
        delete setData.Level;
      }
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      SunapiClient.get(uri, setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, '');
          } else {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR, '');
          }
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDREnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Enable;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDRLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Level;
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }


  // function getPresetWBSliderColor() {
  //   if (isPresetWBManualMode() === false) {
  //     return mAttr.sliderDisableColor;
  //   } else {
  //     return mAttr.sliderEnableColor;
  //   }
  // }

  function isPresetWBManualMode() {
    if (typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex] !== 'undefined') {
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode === 'Manual') {
        return true;
      }
    }
    return false;
  }

  function presetWhiteBalanceChangeHandler() {
    presetWhiteBalanceSet(true);
    initPresetWhiteBalanceSettings();
  }
  $scope.presetWhiteBalanceChangeHandler = presetWhiteBalanceChangeHandler;

  function initPresetWhiteBalanceSettings() {
    $scope.PresetWhiteBalanceModeOptions = mAttr.PresetWhiteBalanceModeOptions;
    $scope.PresetWBRedLevel = mAttr.PresetWhiteBalanceManualRedLevel;
    $scope.PresetWBBlueLevel = mAttr.PresetWhiteBalanceManualBlueLevel;
    if (typeof $scope.PresetWBRedLevel !== 'undefined') {
      $scope.PresetWBRedSliderOptions = {
        floor: $scope.PresetWBRedLevel.minValue,
        ceil: $scope.PresetWBRedLevel.maxValue,
        showSelectionBar: true,
        onEnd: presetWhiteBalanceChangeHandler,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };
      $scope.PresetWBBlueSliderOptions = {
        floor: $scope.PresetWBBlueLevel.minValue,
        ceil: $scope.PresetWBBlueLevel.maxValue,
        showSelectionBar: true,
        onEnd: presetWhiteBalanceChangeHandler,
        disabled: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false
      };
      if (isPresetWBManualMode() === false) {
        $scope.PresetWBRedSliderOptions.disabled = true;
        $scope.PresetWBBlueSliderOptions.disabled = true;
      } else {
        $scope.PresetWBRedSliderOptions.disabled = false;
        $scope.PresetWBBlueSliderOptions.disabled = false;
      }
      refreshSliders();
    }
  }
  $scope.initPresetWhiteBalanceSettings = initPresetWhiteBalanceSettings;

  function presetWhiteBalanceSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;
    if ($scope.PresetImageConfig.length === 0) {
      return;
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance)) {
        return;
      }
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode !== 'Manual') {
      ignoredKeys = ['WhiteBalanceManualRedLevel', 'WhiteBalanceManualBlueLevel'];
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance,
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance,
        ignoredKeys, true);
    }

    if (changed) {
      var uri = '/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set';
      setData = {};
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      setData.WhiteBalanceMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode;
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode === 'Manual') {
        setData.WhiteBalanceManualRedLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualRedLevel;
        setData.WhiteBalanceManualBlueLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualBlueLevel;
      }
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      SunapiClient.get(uri, setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, ignoredKeys);
            $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode;
            $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceManualRedLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualRedLevel;
            $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceManualBlueLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualBlueLevel;
          } else {
            /** Get the latest White balance values form camera  */
            if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode !== 'Manual') {
              whitebalanceView();
            } else {
              COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance, ignoredKeys);
              $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceMode;
              $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceManualRedLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualRedLevel;
              $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalanceManualBlueLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].WhiteBalance.WhiteBalanceManualBlueLevel;
            }
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function registerPresetImgEnhancementsWatcher() {
    if ($scope.PresetImageEnhaneWatcherReady === true) {
      return;
    }

    $scope.PresetImageEnhaneWatcherReady = true;

    $scope.$watch('PresetImageConfig[presetTypeData.PresetIndex].ImageEnhancements', function(newVal, oldVal) {
      if (!mAttr.PTZModel || $scope.disChanged.preset !== true) {
        presetImageenhancementsSet(true);
      }
    }, true);
  }

  function presetImageenhancementsSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;
    if ($scope.PresetImageConfig.length === 0) {
      return;
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements)) {
        return;
      }
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode === 'Off') {
      ignoredKeys.push('DefogLevel');
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessEnable !== true) {
      ignoredKeys.push('SharpnessLevel');
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements,
        ignoredKeys, false);
    }

    if (changed) {
      var uri = '/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set';
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if (setData.hasOwnProperty('DefogMode') || setData.hasOwnProperty('DefogLevel')) {
        setData.DefogMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode;
        if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode !== 'Off') {
          setData.DefogLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogLevel;
        }
      }

      if (setData.hasOwnProperty('SharpnessEnable') || setData.hasOwnProperty('SharpnessLevel')) {
        setData.SharpnessEnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessEnable;
        if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessEnable === true) {
          setData.SharpnessLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessLevel;
        }
      }

      SunapiClient.get(uri, setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements,
              ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements,
              ignoredKeys);
          }
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DISEnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Brightness = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.Brightness;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SharpnessEnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessEnable;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SharpnessLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessLevel;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Saturation = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.Saturation;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DefogMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DefogLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogLevel;
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function initPresetExposureSliders() {
    $scope.PresetBrigntnesSliderOptions = {
      floor: $scope.PresetBrightness.minValue,
      ceil: $scope.PresetBrightness.maxValue,
      showSelectionBar: true,
      step: 1,
      keyboardSupport: false,
      showInputBox: true,
      vertical: false,
      disabled: false
    };

    $scope.PresetSharpnessSliderOptions = {
      floor: $scope.PresetSharpnessLevel.minValue,
      ceil: $scope.PresetSharpnessLevel.maxValue,
      showSelectionBar: true,
      step: 1,
      keyboardSupport: false,
      showInputBox: true,
      vertical: false,
      disabled: false
    };
    if ($scope.PresetImageConfig.length > 0 &&
      (typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex] !== 'undefined')) {
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.SharpnessEnable === false) {
        $scope.PresetSharpnessSliderOptions.disabled = true;
      } else {
        $scope.PresetSharpnessSliderOptions.disabled = false;
      }
    }


    $scope.PresetSaturationSliderOptions = {
      floor: $scope.PresetSaturation.minValue,
      ceil: $scope.PresetSaturation.maxValue,
      showSelectionBar: true,
      step: 1,
      keyboardSupport: false,
      showInputBox: true,
      vertical: false,
      disabled: false
    };

    if (typeof $scope.PresetDefogLevel !== 'undefined') {
      $scope.PresetDefogLevelSliderOptions = {
        floor: $scope.PresetDefogLevel.minValue,
        ceil: $scope.PresetDefogLevel.maxValue,
        showSelectionBar: true,
        step: 1,
        keyboardSupport: false,
        showInputBox: true,
        vertical: false,
        disabled: false
      };
      if ($scope.PresetImageConfig.length > 0 &&
        (typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex] !== 'undefined')) {


        if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode === 'Off' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode === 'Auto') {
          $scope.PresetDefogLevelSliderOptions.disabled = true;
        } else {
          $scope.PresetDefogLevelSliderOptions.disabled = false;
        }
      }
    }

    refreshSliders();
    presetCameraChangeHandler();
  }
  $scope.initPresetExposureSliders = initPresetExposureSliders;

  function initPresetImageEnhancementSettings() {
    $scope.PresetBrightness = mAttr.PresetBrightness;
    $scope.PresetSharpnessLevel = mAttr.PresetSharpnessLevel;
    $scope.PresetSaturation = mAttr.PresetSaturation;
    $scope.PresetDefogModeOptions = mAttr.PresetDefogModeOptions;
    $scope.PresetDefogLevel = mAttr.PresetDefogLevel;

    initPresetExposureSliders();
  }

  function presetCameraChangeHandler() {
    if (typeof $scope.Camera.CompensationMode !== 'undefined') {
      presetCameraSet(true);
    }
  }
  $scope.presetCameraChangeHandler = presetCameraChangeHandler;
  $scope.isPresetSSNRLevelDisabled = function() {
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off') {
      return true;
    }

    return ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNREnable === 'false' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNREnable === false);
  };
  $scope.onPresetAGCModeChange = function(mode) {
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off') {
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode === 'Auto') {
        LogManager.debug(" Adjust DayNightMode ", $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode, " -> ", "Color");
        $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode = 'Color';
      }
    }
    presetCameraChangeHandler();
  };
  $scope.onPresetDISEnableChange = function() {
    if (typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings === 'undefined' ||
      typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable === 'undefined')      {
      return;
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === true && $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable === true) {
      $scope.disChanged.preset = true;
      $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable = false;
    } else {
      $scope.disChanged.preset = false;
    }
  };
  $scope.onPresetDefogEnableChange = function() {
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DefogMode === true) {
      $scope.PresetDefogLevel.preset = true;
      $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable = false;
    } else {
      $scope.disChanged.preset = false;
    }
  };
    
  $scope.iSSupportedPresetDayNightMode = function () {
      var retVal = true;
      if(mAttr.PTZModel && mAttr.IRLedSupport && ($scope.IRled.Mode == 'On' || $scope.IRled.Mode == 'Sensor' || $scope.IRled.Mode == 'Schedule' || $scope.IRled.Mode == 'DayNight')){
          retVal = false;
      } else if (mAttr.PTZModel && $scope.Camera.DayNightMode==='Schedule') {
          retVal = false;
      }
      return retVal;
  };
  $scope.iSSupportedPresetDayNightModeOption = function (mode) {
    var retVal = true;

    if (mode === 'Auto') {
      if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off') {
        retVal = false;
      }
    }

    return retVal;
  };
  $scope.iSSupportedPresetDwellTimeDuration = function () {
    var retVal = true;
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode !== 'Auto' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off' ||
      (mAttr.PTZModel && mAttr.IRLedSupport && ($scope.IRled.Mode === 'On' || $scope.IRled.Mode === 'Sensor' || $scope.IRled.Mode === 'Schedule'))) {
        retVal = false;
    } else if (mAttr.PTZModel && $scope.Camera.DayNightMode==='Schedule') {
      retVal = false;
    }
    return retVal;
  };

  function presetCameraSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = ['DayNightModeSchedules'],
      changed = false;
      // key = null,
      // scheduleList = [];
    if ($scope.PresetImageConfig.length === 0) { 
      return;
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera)) {
        return;
      }
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode !== 'Auto') {
      ignoredKeys.push('DayNightSwitchingTime');
      ignoredKeys.push('DayNightSwitchingMode');
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera,
        ignoredKeys, false);
    }

    if (changed) {
      var uri = '/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set';
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if (setData.hasOwnProperty('IrisFno')) {
        setData.IrisMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.IrisMode;
      }

      /* If Any od the Day Night Settings are changed, then conside the dependency */
      if (setData.hasOwnProperty('DayNightMode') || setData.hasOwnProperty('DayNightSwitchingTime') || setData.hasOwnProperty('DayNightSwitchingMode')) {
        setData.DayNightMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode;

        if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode === 'Auto') {
          setData.DayNightSwitchingTime = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingTime;
          setData.DayNightSwitchingMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingMode;
        }
      }


      /*If SSNR Level is set then SSNR Mode/ SSND Enable shall be set */
      if (setData.hasOwnProperty('SSNRLevel')) {
        setData.SSNREnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNREnable;
      }

      /* If either of long or shor shutter speed is available, then send both */
      if (setData.hasOwnProperty('AFLKModeOptions')) {
        if ($scope.AFLKModeOptions) {
          setData.AFLKMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AFLKMode;
        }
      }

      SunapiClient.get(uri, setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, ignoredKeys);
          }
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].AFLKMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AFLKMode;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSNREnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNREnable;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSNRLevel = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNRLevel;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].IrisMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.IrisMode;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].IrisFno = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.IrisFno;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].AGCMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightSwitchingTime = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingTime;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightSwitchingMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingMode;
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function presetCameraDayNightPreview() {
    var setData = {},
      ignoredKeys = [];
    if ($scope.PresetImageConfig.length === 0) { 
      return; 
    }
    $scope.previewMode = true;
    extendPreviewMode();
    setData.ImagePreview = 'Start';
    setData.Preset = $scope.presetTypeData.SelectedPreset;
    setData.DayNightMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode;
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode === 'Auto') {
      setData.DayNightSwitchingTime = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingTime;
      setData.DayNightSwitchingMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingMode;
    }
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
      function(response) {
        COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera, ignoredKeys);
        $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode;
        $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightSwitchingTime = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingTime;
        $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DayNightSwitchingMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightSwitchingMode;
      },
      function(errorData) {}, '', true);
  }

  function initPresetCameraSettings() {
    $scope.PresetAFLKModeOptions = mAttr.PresetAFLKModeOptions;
    if (typeof mAttr.PresetSSNRLevel !== 'undefined') {
      $scope.PresetSSNRLevel = COMMONUtils.getArray(mAttr.PresetSSNRLevel.maxValue, true);
    }
    $scope.PresetIrisModeOptions = mAttr.PresetIrisModeOptions;
    $scope.PresetIrisFnoOptions = mAttr.PresetIrisFnoOptions;
    $scope.PresetAGCModeOptions = mAttr.PresetAGCModeOptions;
    if (typeof mAttr.PresetAGCLevel !== 'undefined') {
      $scope.PresetAGCLevel = COMMONUtils.getArray(mAttr.PresetAGCLevel.maxValue, false);
    }
    $scope.PresetDayNightModeOptions = mAttr.PresetDayNightModeOptions;
    $scope.PresetDayNightSwitchingTimeOptions = mAttr.PresetDayNightSwitchingTimeOptions;
    $scope.PresetDayNightSwitchingModeOptions = mAttr.PresetDayNightSwitchingModeOptions;
    initPresetExposureSliders();
  }

  function registerPresetFocusWatcher() {
    if ($scope.PresetFocusWatcherReady === true) {
      return;
    }

    $scope.PresetFocusWatcherReady = true;

    $scope.$watch('PresetImageConfig[presetTypeData.PresetIndex].Focus', function(newVal, oldVal) {
      presetPtzsettingsSet(true);
    }, true);
  }

  function presetFocusSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;
    if ($scope.PresetImageConfig.length === 0) {
      return; 
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus)) {
        return;
      }
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus,
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus,
        ignoredKeys, false);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      if (setData.hasOwnProperty('Mode')) {
        setData.FocusMode = setData.Mode;
        delete setData.Mode;
      }
      SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, '');
          } else {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus, '');
          }
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].FocusMode = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Focus.Mode;
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }
  $scope.isPresetDigitalZoomDisabled = function() {
    return ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === 'true' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === true);
  };
  $scope.isPresetDigitalZoomLimitDisabled = function() {
    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable === 'false' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable === false) {
      return true;
    }
    return ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === 'true' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === true);
  };
  $scope.isPresetDisDisabled = function() {
    if (mAttr.PTZModel) {
      return ($scope.disDisable.TamperDetectEnable === true || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].AfterAction == 'VideoAnalytics');
    } else {
      return false;
    }
  };

  function presetAdd() {
    var deferred = $q.defer();
    if (typeof $scope.PresetNameValueOptions === 'undefined' || $scope.PresetNameValueOptions.length === 0) {
      return; 
    }
    var setData = {};
    setData.Preset = $scope.PresetNameValueOptions[$scope.presetTypeData.PresetIndex].Preset;
    setData.Name = $scope.PresetNameValueOptions[$scope.presetTypeData.PresetIndex].Name
    SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add", setData,
      function(response) {
        deferred.resolve();
      },
      function(errorData) {
        //alert(errorData);
        deferred.reject('Failure');
      }, '', true);
    return deferred.promise;
  }

  function registerPresetPTZSettingsWatcher() {
    if ($scope.PresetPTZSettingWatcherReady === true) {
      return;
    }

    $scope.PresetPTZSettingWatcherReady = true;

    $scope.$watch('PresetImageConfig[presetTypeData.PresetIndex].PTZSettings', function(newVal, oldVal) {
      presetPtzsettingsSet(true);
      if (mAttr.PTZModel && $scope.disChanged.preset === true) {
        presetImageenhancementsSet(true);
      }
    }, true);
  }


  function presetPtzsettingsSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;
    if ($scope.PresetImageConfig.length === 0) { 
      return; 
    }
    if (isPreview === true) {
      if (angular.equals(previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings)) {
        return;
      }
    }

    if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable === false) {
      ignoredKeys.push('MaxDigitalZoom');
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings,
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings,
        ignoredKeys, false);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }
      setData.Preset = $scope.presetTypeData.SelectedPreset;
      SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, previewData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, '');
          } else {
            COMMONUtils.updatePageData($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings, '');
          }
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].DigitalZoomEnable = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.DigitalZoomEnable;
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].MaxDigitalZoom = $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].PTZSettings.MaxDigitalZoom;
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function initPresetFocusSettings() {
    $scope.PresetFocusModeOptions = mAttr.PresetFocusModeOptions;
    $scope.PresetMaxDigitalZoomOptions = mAttr.PresetMaxDigitalZoomOptions;
  }

  // function setDefaultPresetForPreset() {
  //   var presetName = $scope.ImagePreset[$scope.ch].Mode;

  //   if (presetName === 'UserPreset') {
  //     /** reset all the values back to page data  */
  //     $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements = angular.copy(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements);
  //     $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera = angular.copy(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera);
  //     $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR = angular.copy(pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR);
  //   } else {
  //     var newVal = getDefaultPresetValue(presetName);

  //     /** Enable SSDR, Reset SSDR Level */
  //     if (typeof mAttr.PresetSSDRLevel !== 'undefined') {
  //       if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Enable === false) {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Enable = true;
  //       }

  //       if (newVal.SSDRLevel !== $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Level) {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].SSDR.Level = newVal.SSDRLevel;
  //       }
  //     }

  //     /** Reset AFLK Mode */
  //     if (typeof $scope.PresetAFLKModeOptions !== 'undefined') {
  //       if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AFLKMode !== 'Off') {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AFLKMode = 'Off';
  //       }
  //     }

  //     /** Reset SSNR3 Level */
  //     if (typeof mAttr.PresetSSNRLevel !== 'undefined') {
  //       if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNRLevel !== newVal.SSNRLevel) {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.SSNRLevel = newVal.SSNRLevel;
  //       }
  //     }

  //     /** Reset AGC Mode */
  //     if (typeof $scope.PresetAGCModeOptions !== 'undefined') {
  //       if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode !== newVal.AGCMode) {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode = newVal.AGCMode;
  //       }
  //     }

  //     /** Reset Color Level */
  //     if (typeof $scope.PresetSaturation !== 'undefined') {
  //       if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.Saturation !== newVal.Saturation) {
  //         $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.Saturation = newVal.Saturation;
  //       }
  //     }
  //   }
  //   presetCameraChangeHandler();
  // }

  function initPresetImageConfig() {
    initPresetSSDRSettings();
    initPresetWhiteBalanceSettings();
    initPresetImageEnhancementSettings();
    initPresetCameraSettings();
    initPresetFocusSettings();

    refreshSliders();
  }

  function getAttributes() {
    if (mAttr.MaxChannel > 1) {
      $scope.isMultiChannel = true;
    }
    if(typeof mAttr.MaxHDMIOut !== 'undefined') {
      $scope.isHDMIOutSupported = true;
    } else {
      $scope.isHDMIOutSupported = false;
    }
    var deferred = $q.defer();
    var promise = initCommonSettings();
    initPresetGlobalType();
    initSSDRSettings();
    initWhiteBalanceSettings();
    initCameraSettings();
    initImageEnhancementSettings();
    initOverlaySettings();

    if (mAttr.PTZModel === true || mAttr.ZoomOnlyModel === true) {
      initFocusSettings();
    }
    if (mAttr.PTZModel === true) {
      initPresetImageConfig();
    }
    initIRLedSetting();
    initTabActiveData();

    if (typeof mAttr.VideoAnalysis2Support !== 'undefined' && mAttr.VideoAnalysis2Support === true) {
      $scope.VideoAnalysis2Support = true;
    } else {
      $scope.VideoAnalysis2Support = false;
    }

    promise.then(
      function() {
        deferred.resolve('Success');
      },
      function() {
        deferred.reject('Failure');
      }
    );
    return deferred.promise;
  }

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };
  $scope.getDayNightModeTranslatedOption = function(option) {
    if (mAttr.PTZModel && mAttr.IRLedSupport && ($scope.IRled.Mode === 'On' || $scope.IRled.Mode === 'Sensor' || $scope.IRled.Mode === 'Schedule')) {
      return '---';
    } else {
      return COMMONUtils.getTranslatedOption(option)
    }
  };
  $scope.getSSNRModeTranslation = function(option) {
    if (option === 'Auto') {
      return $scope.getTranslatedOption('wiseNR');
    } else if (option === 'Manual') {
      return $scope.getTranslatedOption('On');
    } else {
      return $scope.getTranslatedOption(option)
    }
  };
  $scope.getLedMaxPowerTranslation = function(Option) {
    if (Option === "Medium") { 
      return COMMONUtils.getTranslatedOption("MediumOrig");
    }
    return COMMONUtils.getTranslatedOption(Option);

  };

  function validatePage() {
    if (titleOSDCheckAllowedChars() === false) {
      return false;
    }

    if (typeof $scope.TitleOSD !== 'undefined') {
      for (var i = 0; i < $scope.TitleOSD.length; i++) {
        if (typeof $scope.TitleOSD[i].OSD === 'undefined' || !$scope.TitleOSD[i].OSD.length) {
          COMMONUtils.ShowError("lang_msg_enter_osd");
          return false;
        }
      }
    }
    return true;
  }

  $scope.iSSupportedAGCMode = function(mode) {
    if (mAttr.PTZModel && mAttr.IRLedSupport) {
      if ($scope.IRled.Mode === 'DayNight' && (mode === 'Off' || mode === 'Manual')) {
        return false;
      }
    }
    return true;
  };

  $scope.onAGCModeChange = function(mode) {
    if ($scope.Camera.AGCMode === 'Off') {
      if ($scope.Camera.DayNightMode === 'Auto') {
        LogManager.debug(" Adjust DayNightMode ", $scope.Camera.DayNightMode, " -> ", "Color");
        $scope.Camera.DayNightMode = 'Color';
      }
    }
    cameraChangeHandler();
  };

  $scope.onDISEnableChange = function() {
    if (typeof $scope.PTZSettings === 'undefined' ||
      typeof $scope.PTZSettings.DigitalZoomEnable === 'undefined')      {
      return;
    }
    if ($scope.ImageEnhancements.DISEnable === true && $scope.PTZSettings.DigitalZoomEnable === true) {
      $scope.disChanged.global = true;
      $scope.PTZSettings.DigitalZoomEnable = false;
    } else {
      $scope.disChanged.global = false;
    }
  };

  $scope.iSSupportedDayNightModeOption = function(mode) {
    var retVal = true;

    if (mode === 'Auto') {
      if ($scope.Camera.AGCMode === 'Off' ||
        (mAttr.PTZModel && mAttr.IRLedSupport && $scope.IRled.Mode === 'DayNight')) {
        retVal = false;
      }
    }

    return retVal;
  };
  $scope.iSSupportedDayNightMode = function() {
    var retVal = true;
    if (mAttr.PTZModel && mAttr.IRLedSupport && ($scope.IRled.Mode === 'On' || $scope.IRled.Mode === 'Sensor' || $scope.IRled.Mode === 'Schedule' || $scope.IRled.Mode === 'DayNight')) {
      retVal = false;
    }
    return retVal;
  };
  $scope.iSSuportedDwellTimeDuration = function() {
    var retVal = true;
    if ($scope.Camera.DayNightMode !== 'Auto' || $scope.Camera.AGCMode === 'Off' ||
      (mAttr.PTZModel && mAttr.IRLedSupport && ($scope.IRled.Mode === 'On' || $scope.IRled.Mode === 'Sensor' || $scope.IRled.Mode === 'Schedule'))) {
      retVal = false;
    }
    return retVal;
  };

  function isNotUserpresetMode() {
    var retVal = false;

    if (typeof $scope.ImagePreset !== 'undefined') {
      retVal = ($scope.ImagePreset[$scope.ch].Mode !== 'UserPreset');
    }

    return retVal;
  }
  $scope.isNotUserpresetMode = isNotUserpresetMode;

  $scope.dNScheduleUpdate = function(day) {

    $scope.SelectedDay = day;

    var modalInstance = $uibModal.open({
      size: 'lg',
      templateUrl: 'dayNightSchedulePopup.html',
      controller: 'dnScheduleCtrl',
      windowClass: 'modal-position-middle',
      resolve: {
        selectedDay: function() {
          return $scope.SelectedDay;
        },
        camera: function() {
          return $scope.Camera;
        },
        HourOptions: function() {
          return $scope.HourOptions;
        },
        MinuteOptions: function() {
          return $scope.MinuteOptions;
        }
      }
    });

    modalInstance.result.then(function(selectedItem) {
      //console.log("Selected : ", selectedItem);
    }, function() {
      //console.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.heaterScheduleUpdate = function(day) {

    $scope.SelectedDay = day;

    var modalInstance = $uibModal.open({
      size: 'lg',
      templateUrl: 'dayNightSchedulePopup.html',
      controller: 'heaterScheduleCtrl',
      windowClass: 'modal-position-middle',
      resolve: {
        selectedDay: function() {
          return $scope.SelectedDay;
        },
        heater: function() {
          return $scope.HeaterSchedules;
        },
        HourOptions: function() {
          return $scope.HourOptions;
        },
        MinuteOptions: function() {
          return $scope.MinuteOptions;
        }
      }
    });

    modalInstance.result.then(function(selectedItem) {
      //console.log("Selected : ", selectedItem);
    }, function() {
      //console.info('Modal dismissed at: ' + new Date());
    });
  };



  function setSSDR(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (isPreview === true) {
      if (angular.equals(previewData.SSDR, $scope.SSDR)) {
        return;
      }
    } else {
      if (angular.equals(pageData.SSDR, $scope.SSDR)) {
        return;
      }
    }

    if ($scope.SSDR[$scope.ch].Enable === false) {
      ignoredKeys = ['Level', 'DynamicRange'];
    }

    if (typeof $scope.ImagePreset !== 'undefined') {
      if ($scope.ImagePreset[$scope.ch].Mode !== 'UserPreset') {
        ignoredKeys.push('Level');
      }
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.SSDR[$scope.ch], previewData.SSDR[$scope.ch],
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.SSDR[$scope.ch], pageData.SSDR[$scope.ch],
        ignoredKeys, true);
    }


    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=ssdr&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.SSDR[$scope.ch], previewData.SSDR[$scope.ch], '');
          } else {
            COMMONUtils.updatePageData($scope.SSDR[$scope.ch], pageData.SSDR[$scope.ch], '');
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function setImagePresetShedule(setData) {
    var i = 0,
      schedule = null, changed = false;

    if (!angular.equals($scope.ImagePreset[$scope.ch].Schedules, pageData.ImagePreset[$scope.ch].Schedules)) {
      changed = true;
      if ($scope.ImagePreset[$scope.ch].ScheduleEnable === true) {
        setData.ScheduleEnable = 'True';
        for (i = 0; i < $scope.ImagePreset[$scope.ch].Schedules.length; i++) {
          schedule = $scope.ImagePreset[$scope.ch].Schedules[i];

          setData['Schedule.' + (i + 1) + '.Mode'] = schedule.Mode;
          if (schedule.Mode !== 'Off') {
            setData['Schedule.' + (i + 1) + '.EveryDay.FromTo'] = schedule.EveryDay.FromTo;
          }
        }
      } else {
        setData.ScheduleEnable = 'False';
      }
    }

    return changed;
  }

  function setImagePreset(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = null,
      changed = false,
      scheduleChanged = false;

    if (isPreview === true) {
      if (angular.equals(previewData.ImagePreset, $scope.ImagePreset)) {
        return;
      }
    } else {
      if (angular.equals(pageData.ImagePreset, $scope.ImagePreset)) {
        return;
      }
    }

    ignoredKeys = ['Schedules', 'ScheduleEnable'];

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(
        setData,
        $scope.ImagePreset[$scope.ch],
        previewData.ImagePreset[$scope.ch],
        ignoredKeys,
        false
      );
    } else {
      changed = COMMONUtils.fillSetData(
        setData,
        $scope.ImagePreset[$scope.ch],
        pageData.ImagePreset[$scope.ch],
        ignoredKeys,
        false
      );
    }


    // Schedule is not supported in Preview feature
    if ((isPreview !== true) || (typeof isPreview === 'undefined')) {
      scheduleChanged = setImagePresetShedule(setData);
    }

    if (changed || scheduleChanged) {
      //For schedule changes preview is not enabled
      if (isPreview === true && (scheduleChanged === true && changed === false)) {
        return;
      }

      if (isPreview === true && changed === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imagepreset&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.ImagePreset[$scope.ch], previewData.ImagePreset[$scope.ch], ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.ImagePreset[$scope.ch], pageData.ImagePreset[$scope.ch], ignoredKeys);
            for (var i = 0; i < $scope.ImagePreset[$scope.ch].Schedules.length; i++) {
              COMMONUtils.updatePageData($scope.ImagePreset[$scope.ch].Schedules[i], pageData.ImagePreset[$scope.ch].Schedules[i], ignoredKeys);
            }
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function videoSourceSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      changed = false;

    if (isPreview === true) {
      if (angular.equals(previewData.VideoSources, $scope.VideoSources)) {
        return;
      }
    } else {
      if (angular.equals(pageData.VideoSources, $scope.VideoSources)) {
        return;
      }
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.VideoSources, previewData.VideoSources, '', false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.VideoSources, pageData.VideoSources, '', false);
    }


    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=set', setData,
        function(response) {
          if (isPreview === true) {
            $scope.isChangedSensorCaptureFrameRate = previewData.VideoSources.SensorCaptureFrameRate !== $scope.VideoSources.SensorCaptureFrameRate;
            if ($scope.isChangedSensorCaptureFrameRate === true) {
              $timeout(function() {
              cameraChangeHandler();
            }, 300);
            }
            COMMONUtils.updatePageData($scope.VideoSources, previewData.VideoSources, '');
          } else {
            $scope.isChangedSensorCaptureFrameRate = pageData.VideoSources.SensorCaptureFrameRate !== $scope.VideoSources.SensorCaptureFrameRate;
            if ($scope.isChangedSensorCaptureFrameRate === true) {
              $timeout(function() {
              cameraSet();
            }, 300);
            }
            COMMONUtils.updatePageData($scope.VideoSources, pageData.VideoSources, '');
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function whiteBalanceSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (isPreview === true) {
      if (angular.equals(previewData.WhiteBalance, $scope.WhiteBalance)) {
        return;
      }
    } else {
      if (angular.equals(pageData.WhiteBalance, $scope.WhiteBalance)) {
        return;
      }
    }

    if ($scope.WhiteBalance.WhiteBalanceMode !== 'Manual') {
      ignoredKeys = ['WhiteBalanceManualRedLevel', 'WhiteBalanceManualBlueLevel'];
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.WhiteBalance, previewData.WhiteBalance,
        ignoredKeys, true);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.WhiteBalance, pageData.WhiteBalance,
        ignoredKeys, true);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=whitebalance&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.WhiteBalance, previewData.WhiteBalance, ignoredKeys);
          } else {
            /** Get the latest White balance values form camera  */
            if ($scope.WhiteBalance.WhiteBalanceMode !== 'Manual') {
              whitebalanceView();
            } else {
              COMMONUtils.updatePageData($scope.WhiteBalance, pageData.WhiteBalance, ignoredKeys);
            }
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function setDaynightSchedule(setData) {
    $.each($scope.Camera.DayNightModeSchedules, function(day, dayDetails) {
      var setCmd = '';

      setCmd = 'DayNightModeSchedule.' + day;
      if (dayDetails.DayNightSchedule === true) {
        setData[setCmd] = 1;
      } else {
        setData[setCmd] = 0;
      }

      // if (dayDetails.DayNightSchedule == true)
      {
        setCmd += '.FromTo';
        setData[setCmd] = dayDetails.FromTo;
      }
    });
  }

  function cameraSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = ['DayNightModeSchedules'],
      changed = false,
      scheduleChanged = false,
      key = null,
      scheduleList = [];

    if (isPreview === true) {
      if (angular.equals(previewData.Camera, $scope.Camera) && $scope.isChangedSensorCaptureFrameRate !== true) {
        return;
      }
    } else {
      if (angular.equals(pageData.Camera, $scope.Camera) && $scope.isChangedSensorCaptureFrameRate !== true) {
        return;
      }
    }

    if ($scope.Camera.SSNRMode === 'Off') {
      ignoredKeys.push('SSNRLevel');
    }

    if ($scope.Camera.CompensationMode !== 'BLC') {
      ignoredKeys.push('BLCLevel');
      ignoredKeys.push('BLCAreaTop');
      ignoredKeys.push('BLCAreaBottom');
      ignoredKeys.push('BLCAreaLeft');
      ignoredKeys.push('BLCAreaRight');
    }

    if ($scope.Camera.CompensationMode !== 'HLC') {
      ignoredKeys.push('HLCMode');
      ignoredKeys.push('HLCMaskTone');
      ignoredKeys.push('HLCDimming');
      ignoredKeys.push('HLCAreaTop');
      ignoredKeys.push('HLCAreaBottom');
      ignoredKeys.push('HLCAreaLeft');
      ignoredKeys.push('HLCAreaRight');
      if ($scope.Camera.HLCMode === 'Off') {
        ignoredKeys.push('HLCMaskColor'); 
    }
    }

    if ($scope.Camera.CompensationMode !== 'WDR') {
      ignoredKeys.push('WDRLevel');
      ignoredKeys.push('WDRSeamlessTransition');
      ignoredKeys.push('WDRLowLight');
      ignoredKeys.push('WDRIRLEDEnable');
    }

    if ($scope.Camera.IrisMode === 'Auto' || $scope.Camera.IrisMode === 'Manual' || $scope.Camera.PIrisMode !== 'Manual') {
      ignoredKeys.push('PIrisPosition');
    }
    if ($scope.Camera.IrisMode !== undefined && $scope.Camera.IrisMode !== 'Manual') {
      ignoredKeys.push('IrisFno');
    }
      
    if ($scope.Camera.DayNightMode !== 'ExternalBW') {
      ignoredKeys.push('DayNightAlarmIn');
    }

    if ($scope.Camera.DayNightMode !== 'Auto') {
      ignoredKeys.push('DayNightSwitchingTime');
      ignoredKeys.push('DayNightSwitchingMode');
    }

    /** Min and Max Shutter should not be set when AFLK Mode is ON */
    if ($scope.Camera.AFLKMode !== 'Off') {
      ignoredKeys.push('AutoShortShutterSpeed');
      ignoredKeys.push('AutoLongShutterSpeed');
      ignoredKeys.push('PreferShutterSpeed');
    }

    if (typeof $scope.ImagePreset !== 'undefined') {
      if ($scope.ImagePreset[$scope.ch].Mode !== 'UserPreset') {
        ignoredKeys.push('AutoShortShutterSpeed');
        ignoredKeys.push('AutoLongShutterSpeed');
        ignoredKeys.push('PreferShutterSpeed');
        ignoredKeys.push('AGCMode');
        ignoredKeys.push('SSNRLevel');
        ignoredKeys.push('AFLKMode');
      }
    }


    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.Camera, previewData.Camera,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.Camera, pageData.Camera,
        ignoredKeys, false);
    }
    if ($scope.isChangedSensorCaptureFrameRate === true) {
      changed = true;
      $scope.isChangedSensorCaptureFrameRate = false;
      setData.AutoShortShutterSpeed = $scope.Camera.AutoShortShutterSpeed;
      setData.AutoLongShutterSpeed = $scope.Camera.AutoLongShutterSpeed;
      setData.PreferShutterSpeed = $scope.Camera.PreferShutterSpeed;
    }

    if ((typeof $scope.Camera.DayNightModeSchedules !== 'undefined') && (isPreview !== true || typeof isPreview === 'undefined')) {
      if (!angular.equals(pageData.Camera.DayNightModeSchedules, $scope.Camera.DayNightModeSchedules)) {
        scheduleChanged = true;
        setDaynightSchedule(setData);
      }
    }

    if (changed || scheduleChanged) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      setData.CompensationMode = $scope.Camera.CompensationMode;

      if ($scope.Camera.CompensationMode === 'BLC') {
        setData.BLCLevel = $scope.Camera.BLCLevel;
        setData.BLCAreaTop = $scope.Camera.BLCAreaTop;
        setData.BLCAreaBottom = $scope.Camera.BLCAreaBottom;
        setData.BLCAreaLeft = $scope.Camera.BLCAreaLeft;
        setData.BLCAreaRight = $scope.Camera.BLCAreaRight;
      }

      if ($scope.Camera.CompensationMode === 'WDR') {
        setData.WDRLevel = $scope.Camera.WDRLevel;
        // setData.WDRSeamlessTransition = $scope.Camera.WDRSeamlessTransition;
        // setData.WDRLowLight = $scope.Camera.WDRLowLight;
        // setData.WDRIRLEDEnable = $scope.Camera.WDRIRLEDEnable;
        setData.WDRSeamlessTransition = ($scope.Camera.WDRSeamlessTransition === true) ? 'On' : 'Off';
        setData.WDRLowLight = ($scope.Camera.WDRLowLight === true) ? 'On' : 'Off';
        setData.WDRIRLEDEnable = ($scope.Camera.WDRIRLEDEnable === true) ? 'On' : 'Off';
      }

      if ($scope.Camera.CompensationMode === 'HLC') {
        setData.HLCMode = $scope.Camera.HLCMode;
        if ($scope.Camera.HLCMode !== 'Off') {
          setData.HLCMaskColor = $scope.Camera.HLCMaskColor;
        }
        setData.HLCMaskTone = $scope.Camera.HLCMaskTone;
        // setData.HLCDimming = ($scope.Camera.HLCDimming === true)? 'On' : 'Off';
        setData.HLCAreaTop = $scope.Camera.HLCAreaTop;
        setData.HLCAreaBottom = $scope.Camera.HLCAreaBottom;
        setData.HLCAreaLeft = $scope.Camera.HLCAreaLeft;
        setData.HLCAreaRight = $scope.Camera.HLCAreaRight;
      }

      if (setData.hasOwnProperty('IrisMode') || setData.hasOwnProperty('PIrisMode') || setData.hasOwnProperty('PIrisPosition')) {
        setData.IrisMode = $scope.Camera.IrisMode;

        if (($scope.Camera.IrisMode !== 'Auto' && $scope.Camera.IrisMode !== 'Manual') && $scope.Camera.PIrisMode === 'Manual') {
          setData.PIrisMode = $scope.Camera.PIrisMode;
          setData.PIrisPosition = $scope.Camera.PIrisPosition;
        }
      }

      /* If Any od the Day Night Settings are changed, then conside the dependency */
      if (setData.hasOwnProperty('DayNightMode') || setData.hasOwnProperty('DayNightAlarmIn') ||
        setData.hasOwnProperty('DayNightSwitchingTime') || setData.hasOwnProperty('DayNightSwitchingMode')) {
        setData.DayNightMode = $scope.Camera.DayNightMode;

        if ($scope.Camera.DayNightMode === 'ExternalBW') {
          setData.DayNightAlarmIn = $scope.Camera.DayNightAlarmIn;
        }

        if ($scope.Camera.DayNightMode === 'Auto') {
          setData.DayNightSwitchingTime = $scope.Camera.DayNightSwitchingTime;
          setData.DayNightSwitchingMode = $scope.Camera.DayNightSwitchingMode;
        }
      }


      /*If SSNR Level is set then SSNR Mode/ SSND Enable shall be set */
      if (setData.hasOwnProperty('SSNRLevel')) {
        if (typeof $scope.SSNRModeOptions !== 'undefined') {
          setData.SSNRMode = $scope.Camera.SSNRMode;
        } else {
          setData.SSNREnable = $scope.Camera.SSNREnable;
        }
      }

      /* If either of long or shor shutter speed is available, then send both */
      if (setData.hasOwnProperty('AutoShortShutterSpeed') || setData.hasOwnProperty('AutoLongShutterSpeed') ||
        setData.hasOwnProperty('PreferShutterSpeed')) {
        setData.AutoShortShutterSpeed = $scope.Camera.AutoShortShutterSpeed;
        setData.AutoLongShutterSpeed = $scope.Camera.AutoLongShutterSpeed;
        setData.PreferShutterSpeed = $scope.Camera.PreferShutterSpeed;

        if ($scope.AFLKModeOptions) {
          setData.AFLKMode = $scope.Camera.AFLKMode;
        }
      }

      for (key in setData) {
        if (key.search('DayNightModeSchedule') !== -1 && typeof setData[key] !== 'undefined') {
          scheduleChanged = true;
          scheduleList.push(key);
        }
      }

      if ($scope.Camera.DayNightMode !== 'Schedule' && scheduleChanged) {
        for (key = 0; key < scheduleList.length; key++) {
          delete setData[scheduleList[key]];
        }
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.Camera, previewData.Camera, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.Camera, pageData.Camera, ignoredKeys);
            pageData.Camera.DayNightModeSchedules = $scope.Camera.DayNightModeSchedules;
            if (typeof mAttr.MaxAlarmInput !== 'undefined') {
              if ($scope.Camera.DayNightMode === 'ExternalBW' && mAttr.MaxAlarmInput > 0) {
                mAttr.MaxAlarmInput = 0;
                $rootScope.$broadcast('menureload', "Alarmin disabled");
              } else if ($scope.Camera.DayNightMode !== 'ExternalBW' && mAttr.MaxAlarmInputOriginal !== mAttr.MaxAlarmInput) {
                mAttr.MaxAlarmInput = mAttr.MaxAlarmInputOriginal;
                $rootScope.$broadcast('menureload', "Alarmin enabled");
              }
            }
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function cameraDayNightPreview() {
    var setData = {},
      ignoredKeys = [];

    $scope.previewMode = true;
    extendPreviewMode();
    setData.ImagePreview = 'Start';
    setData.CompensationMode = $scope.Camera.CompensationMode;
    setData.DayNightMode = $scope.Camera.DayNightMode;
    if ($scope.Camera.DayNightMode === 'Auto') {
      setData.DayNightSwitchingTime = $scope.Camera.DayNightSwitchingTime;
      setData.DayNightSwitchingMode = $scope.Camera.DayNightSwitchingMode;
    }

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
      function(response) {
        COMMONUtils.updatePageData($scope.Camera, previewData.Camera, ignoredKeys);
      },
      function(errorData) {}, '', true);
  }

  function imageenhancementsSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (isPreview === true) {
      if (angular.equals(previewData.ImageEnhancements, $scope.ImageEnhancements)) {
        return;
      }
    } else {
      if (angular.equals(pageData.ImageEnhancements, $scope.ImageEnhancements)) {
        return;
      }
    }

    if ($scope.ImageEnhancements.DefogMode === 'Off') {
      ignoredKeys.push('DefogLevel');
    }

    if ($scope.ImageEnhancements.SharpnessEnable !== true) {
      ignoredKeys.push('SharpnessLevel');
    }

    if ($scope.Camera.LDCMode === false) {
      ignoredKeys.push('LDCLevel');
    }

    if (typeof $scope.ImagePreset !== 'undefined') {
      if ($scope.ImagePreset[$scope.ch].Mode !== 'UserPreset') {
        ignoredKeys.push('Saturation');
      }
    }


    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.ImageEnhancements, previewData.ImageEnhancements,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.ImageEnhancements, pageData.ImageEnhancements,
        ignoredKeys, false);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if (setData.hasOwnProperty('DefogMode') || setData.hasOwnProperty('DefogLevel')) {
        setData.DefogMode = $scope.ImageEnhancements.DefogMode;
        if ($scope.ImageEnhancements.DefogMode !== 'Off') {
          setData.DefogLevel = $scope.ImageEnhancements.DefogLevel;
        }
      }

      if (setData.hasOwnProperty('SharpnessEnable') || setData.hasOwnProperty('SharpnessLevel')) {
        setData.SharpnessEnable = $scope.ImageEnhancements.SharpnessEnable;
        if ($scope.ImageEnhancements.SharpnessEnable === true) {
          setData.SharpnessLevel = $scope.ImageEnhancements.SharpnessLevel;
        }
      }

      if (setData.hasOwnProperty('LDCMode') || setData.hasOwnProperty('LDCLevel')) {
        setData.LDCMode = $scope.ImageEnhancements.LDCMode;
        if ($scope.ImageEnhancements.LDCMode === false) {
          delete setData.LDCLevel;
        }
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.ImageEnhancements, previewData.ImageEnhancements,
              ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.ImageEnhancements, pageData.ImageEnhancements,
              ignoredKeys);
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function focusSet(isPreview) {
    if (isPreview === true) {
      if (angular.equals(previewData.Focus, $scope.Focus)) {
        return;
      }
    } else {
      if (angular.equals(pageData.Focus, $scope.Focus)) {
        return;
      }
    }
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.Focus, previewData.Focus, ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.Focus, pageData.Focus, ignoredKeys, false);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.Focus, previewData.Focus, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.Focus, pageData.Focus, ignoredKeys);
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function heaterScheduleSet() {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (angular.equals(pageData.HeaterSchedules, $scope.HeaterSchedules)) {
      return;
    } else {
      changed = true;
    }

    if (changed) {
      $.each($scope.HeaterSchedules, function(day, dayDetails) {
        var setCmd = '';

        setCmd = day + '.Enable';
        setData[setCmd] = dayDetails.Enable;
        setCmd = day + '.FromTo';
        setData[setCmd] = dayDetails.FromTo;
      });

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=scheduler&action=set', setData,
        function(response) {
          COMMONUtils.updatePageData($scope.HeaterSchedules, pageData.HeaterSchedules, ignoredKeys);
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
    /**/
  }

  $scope.heaterSet = function() {
    return SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=aux&action=control&Command=HeaterOn',
      function(response) {},
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function ptzsettingsSet(isPreview) {
    if (isPreview === true) {
      if (angular.equals(previewData.PTZSettings, $scope.PTZSettings)) {
        return;
      }
    } else {
      if (angular.equals(pageData.PTZSettings, $scope.PTZSettings)) {
        return;
      }
    }
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if ($scope.PTZSettings.DigitalZoomEnable === false) {
      ignoredKeys.push('MaxDigitalZoom');
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.PTZSettings, previewData.PTZSettings, ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.PTZSettings, pageData.PTZSettings, ignoredKeys, false);
    }

    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }
      SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.PTZSettings, previewData.PTZSettings, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.PTZSettings, pageData.PTZSettings, ignoredKeys);
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function setIRLedSchedule(setData) {
    var fromToString = '',
      schedule = $scope.IRled.Schedule.EveryDay;

    fromToString = COMMONUtils.getFormatedInteger(schedule.SelectedFromHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedFromMinute, 2);
    fromToString += '-';
    fromToString += COMMONUtils.getFormatedInteger(schedule.SelectedToHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedToMinute, 2);

    setData['Schedule.EveryDay.FromTo'] = fromToString;
  }

  function irLedSet(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = ['Schedule'],
      changed = false,
      scheduleChanged = false;

    if (isPreview === true) {
      if (angular.equals(previewData.IRled, $scope.IRled)) {
        return;
      }
    } else {
      if (angular.equals(pageData.IRled, $scope.IRled)) {
        return;
      }
    }

    if ($scope.IRled.Mode !== 'Manual') {
      ignoredKeys.push('Level');
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.IRled, previewData.IRled,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.IRled, pageData.IRled,
        ignoredKeys, false);
    }

    if (!angular.equals(pageData.IRled.Schedule, $scope.IRled.Schedule)) {
      scheduleChanged = true;
    }

    if (changed || scheduleChanged) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }

      setData.Mode = $scope.IRled.Mode;

      if ($scope.IRled.Mode === 'Schedule') {
        setIRLedSchedule(setData);
      }

      if ($scope.IRled.Mode === 'Manual') {
        setData.Level = $scope.IRled.Level;
      }

      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=irled&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.IRled, previewData.IRled, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.IRled, pageData.IRled, ignoredKeys);
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }
  $scope.setLensReset = function() {
    var setData = {};
    setData.Channel = 0;
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }
    SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control&Mode=LensInitialize', setData,
      function(response) {},
      function(errorData) {}, '', true);
    COMMONUtils.ShowInfo('lang_apply');
  };
  $scope.setAWCMode = function() {
    livePreviewMode('AWC');

    COMMONUtils.ShowInfo('lang_apply');
  };

  function livePreviewMode(mode, event) {
    var asyncVal = true;
    if (typeof event !== 'undefined' && event === 'unload') {
      asyncVal = false;
    }
    var setData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }
    setData.ImagePreview = mode;
    if ($scope.presetTypeData.SelectedPresetType === 1) {
      if (mode === 'Stop') {
        $scope.presetPreview = false;
        setData.Channel = 0;
        setData.Preset = $scope.presetTypeData.SelectedPreset === 0 ? 1 : $scope.presetTypeData.SelectedPreset;
        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
          function(response) {
            $rootScope.isCameraSetupPreview = false;
          },
          function(errorData) {
            $rootScope.isCameraSetupPreview = false;
          }, '', asyncVal);
      }
    } else {
      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
        function(response) {
          $rootScope.isCameraSetupPreview = false;
        },
        function(errorData) {
          //console.log('Stop preview failed ', errorData);
          //alert(errorData);
          $rootScope.isCameraSetupPreview = false;
        }, '', asyncVal);
    }
  }
  $scope.livePreviewMode = livePreviewMode;

  $scope.$watch(function() {
    return $rootScope.cameraSetupToLive;
  }, function(newVal, oldVal) {
    if (newVal === true) {
      if ($scope.previewMode === true || typeof $scope.previewTimer !== 'undefined' || $scope.previewTimer !== null) {
        if (typeof $scope.previewTimer !== 'undefined') {
          $timeout.cancel($scope.previewTimer);
          $scope.previewTimer = null;
        }
        if ($scope.previewMode === false) {
          $rootScope.isCameraSetupPreview = false;
        } else {
          stopLivePreviewMode();
        }
      }
    }
  }, true);

  $rootScope.$watch(function $locationWatch() {
    var changedUrl = $location.absUrl();

    if (($rootScope.cameraSetupToLive !== true) && ($scope.previewMode === true || typeof $scope.previewTimer !== 'undefined' || $scope.previewTimer !== null)) {
      if (changedUrl.indexOf('videoAudio_cameraSetup') === -1) {
        if (typeof $scope.previewTimer !== 'undefined') {
          //LogManager.debug(' Preview timer cancelled ');
          $timeout.cancel($scope.previewTimer);
          $scope.previewTimer = null;
        }
        $rootScope.isCameraSetupPreview = false;
        stopLivePreviewMode();
      }
    }

  });

  $(window).unload(function() {
    stopLivePreviewMode('unload');
  });


  function saveSettings() {
    showLoadingBar(true);

    var deferred = $q.defer();
    var functionList = [];
    //if (mAttr.PTZModel !== true) {
    ///stw-cgi/media.cgi?msubmenu=videosource&action=set
    functionList.push(videoSourceSet);
    //}

    if (typeof $scope.ImagePresetModeOptions !== 'undefined') {
      ///stw-cgi/image.cgi?msubmenu=imagepreset&action=set
      functionList.push(setImagePreset);
    }

    if (typeof mAttr.SSDRLevel !== 'undefined') {
      ///stw-cgi/image.cgi?msubmenu=ssdr&action=set
      functionList.push(setSSDR);
    }

    if (typeof mAttr.WhiteBalanceModeOptions !== 'undefined') {
      ///stw-cgi/image.cgi?msubmenu=whitebalance&action=set
      functionList.push(whiteBalanceSet);
    }

    if (mAttr.IRLedSupport === true) {
      ///stw-cgi/image.cgi?msubmenu=irled&action=set
      functionList.push(irLedSet);
    }

    if (typeof mAttr.CompensationModeOptions !== 'undefined') {
      ///stw-cgi/image.cgi?msubmenu=camera&action=set
      functionList.push(cameraSet);
    }

    if (typeof mAttr.FocusModeOptions !== 'undefined' && (mAttr.PTZModel === true || mAttr.ZoomOnlyModel === true)) {
      ///stw-cgi/image.cgi?msubmenu=focus&action=set
      functionList.push(focusSet);
    }

    if ($scope.HeaterSupport && $scope.PTZModel !== true) {
      functionList.push(heaterScheduleSet);
    }

    if (mAttr.PTZModel === true) {
      if (typeof $scope.ImageEnhancements !== 'undefined' &&
        pageData.ImageEnhancements.DISEnable === false &&
        $scope.ImageEnhancements.DISEnable === true) {
        ///stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set
        functionList.push(ptzsettingsSet);
        if (typeof mAttr.Brightness !== 'undefined') {
          ///stw-cgi/image.cgi?msubmenu=imageenhancements&action=set
          functionList.push(imageenhancementsSet);
        }
      } else {
        if (typeof mAttr.Brightness !== 'undefined') {
          ///stw-cgi/image.cgi?msubmenu=imageenhancements&action=set
          functionList.push(imageenhancementsSet);
        }
        ///stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set
        functionList.push(ptzsettingsSet);
      }


      if ($scope.presetTypeData.SelectedPresetType === 1) {
        if (typeof mAttr.PresetSSDRLevel !== 'undefined') {
          ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
          functionList.push(setPresetSSDR);
        }
        if (typeof mAttr.PresetWhiteBalanceModeOptions !== 'undefined') {
          ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
          functionList.push(presetWhiteBalanceSet);
        }
        if (typeof mAttr.PresetAFLKModeOptions !== 'undefined') {
          ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
          functionList.push(presetCameraSet);
        }
        if (typeof mAttr.PresetFocusModeOptions !== 'undefined') {
          ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
          functionList.push(presetFocusSet);
        }
        if (typeof $scope.PresetImageConfig !== 'undefined' &&
          typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex] !== 'undefined' &&
          typeof $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements !== 'undefined' &&
          pageData.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === false &&
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].ImageEnhancements.DISEnable === true) {
          if (typeof mAttr.PresetMaxDigitalZoomOptions !== 'undefined') {
            ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
            functionList.push(presetPtzsettingsSet);
          }
          if (typeof mAttr.PresetBrightness !== 'undefined') {
            ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
            functionList.push(presetImageenhancementsSet);
          }
        } else {
          if (typeof mAttr.PresetBrightness !== 'undefined') {
            ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
            functionList.push(presetImageenhancementsSet);
          }
          if (typeof mAttr.PresetMaxDigitalZoomOptions !== 'undefined') {
            ///stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set
            functionList.push(presetPtzsettingsSet);
          }
        }
        functionList.push(presetAdd);
      }
    } else if (mAttr.ZoomOnlyModel === true) {
      if (typeof $scope.ImageEnhancements !== 'undefined' &&
        pageData.ImageEnhancements.DISEnable === false &&
        $scope.ImageEnhancements.DISEnable === true) {
        ///stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set
        functionList.push(ptzsettingsSet);
        if (typeof mAttr.Brightness !== 'undefined') {
          ///stw-cgi/image.cgi?msubmenu=imageenhancements&action=set
          functionList.push(imageenhancementsSet);
        }
      } else {
        if (typeof mAttr.Brightness !== 'undefined') {
          ///stw-cgi/image.cgi?msubmenu=imageenhancements&action=set
          functionList.push(imageenhancementsSet);
        }
        ///stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set
        functionList.push(ptzsettingsSet);
      }
    } else {
      if (typeof mAttr.Brightness !== 'undefined') {
        ///stw-cgi/image.cgi?msubmenu=imageenhancements&action=set
        functionList.push(imageenhancementsSet);
      }
    }

    if (mAttr.MaxOSDTitles) {
      ///stw-cgi/image.cgi?msubmenu=multilineosd&action=update
      ///stw-cgi/image.cgi?msubmenu=multilineosd&action=add

      //functionList.push(setMultiLineOSD);
      setMultiLineOSD(functionList);
    }

    if (mAttr.PTZPositionEnable ||
      mAttr.PresetNameEnable ||
      mAttr.CameraIDEnable ||
      mAttr.AzimuthEnable) {
      ///stw-cgi/image.cgi?msubmenu=overlay&action=set
      functionList.push(setOverlay);
    }

    if (functionList.length > 0) {
      $q.seqAll(functionList).then(
        function() {
          deferred.resolve();
          if ($scope.isMultiChannel && $scope.channelChanged) {
            $scope.pageLoaded = false;
            UniversialManagerService.setChannelId($scope.targetChannel);
            var promise = getAttributes();
            promise.then(function() {
              view();
            });
          } else {
            view();
          }
        },
        function(errorData) {
          deferred.reject(errorData);
          showLoadingBar(false);
        }
      );
    } else {
      setTimeout(function() {
        deferred.resolve();
      });
    }

    return deferred.promise;
  }

  function set() {
    if (validatePage()) {
      COMMONUtils.ApplyConfirmation(saveSettings);
    }
  }

  /**
   * Frame Rate and WDR Dependancy
   */
  $scope.iSWDRSupported = function(mode) {
    if (typeof $scope.ImageOptions === 'undefined' || typeof $scope.ImageOptions.MaxAGCSensorFrameRate === 'undefined') {
      return true;
    }
    var maxAllowdFrameRate = parseInt($scope.ImageOptions.MaxAGCSensorFrameRate, 10);
    if (mode === 'WDR') {
      if (typeof $scope.VideoSources !== 'undefined') {
        if (parseInt($scope.VideoSources.SensorCaptureFrameRate, 10) <= maxAllowdFrameRate) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  $scope.iSSupportedSensorMode = function(frameRate) {
    if (typeof $scope.ImageOptions === 'undefined' || typeof $scope.ImageOptions.MaxAGCSensorFrameRate === 'undefined') {
      return true;
    }

    if (typeof $scope.Camera === 'undefined') {
      return true;
    }

    var maxAllowdFrameRate = parseInt($scope.ImageOptions.MaxAGCSensorFrameRate, 10);
    if ($scope.Camera.CompensationMode === 'WDR') {
      if (typeof frameRate !== 'undefined') {
        if (parseInt(frameRate, 10) <= maxAllowdFrameRate) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  };

  $scope.OnTabClick = function(tab) {
    $scope.refreshSliders(500);
  };

  $scope.setImageFile = function(fname) {
    $scope.$apply(function($scope) {
      $scope.ImageFile = fname.files[0].name;
      $scope.ImageFilesize = fname.files[0].size;
      $scope.ImageFileFull = fname.files[0];
    });
  };

  $scope.UploadImage = function() {

    COMMONUtils.ShowConfirmation(uploadoverlayimage, 'lang_do_you_wanlang_image_upload');

  };

  function uploadoverlayimage() {
    var element = '';
    var fileName = '';
    var ext = '';

    element = document.getElementById("ImageFile");
    fileName = element.value.split('/').pop().split('\\').pop();
    ext = fileName.split('.').pop();


    //Check for file extension validity.
    if (ext.toUpperCase() !== "BMP") {
      COMMONUtils.ShowError('lang_msg_no_bitmap_file');
      $scope.ImageFile = "";
      $scope.ImageFileFull = {};
      //reset the file name after remove
      if (document.getElementById('ImageField')) { 
        document.getElementById('ImageField').value = null; 
      }
      return;
    }

    if ($scope.ImageFilesize > (52 * 1024)) {
      COMMONUtils.ShowError("File size larger than supported");
      $scope.ImageFile = "";
      $scope.ImageFileFull = {};
      //reset the file name after remove
      if (document.getElementById('ImageField')) { 
        document.getElementById('ImageField').value = null; 
      }
      return;
    }

    if (typeof $scope.ImageFileFull !== 'undefined') {
      var setData = {};
      var specialHeaders = [];
      specialHeaders[0] = {};
      specialHeaders[0].Type = 'Content-Type';
      specialHeaders[0].Header = 'application/x-www-form-urlencoded;';
      var reader = new FileReader();
      reader.readAsArrayBuffer($scope.ImageFileFull);
      reader.onload = function(evt) {
        var fileData = evt.target.result;
        var bytes = new Uint8Array(fileData);

        var fileToPost = '';
        for (var index = 0; index < bytes.byteLength; index++) {
          fileToPost += String.fromCharCode(bytes[index]);
        }

        setData.Channel = 0;
        setData.Index = 1;
        setData.FileType = ext.toUpperCase();

        SunapiClient.post('/stw-cgi/image.cgi?msubmenu=multiimageosd&action=install', setData,
          function(response) {
            multiimageoverlayView();
            $scope.$apply();
          },
          function(errorData, errorCode) {
            if (errorCode === 604) {
              COMMONUtils.ShowError("Bitmap file format not matching the specification");
            } else if (errorCode === 610) {
              COMMONUtils.ShowError("Bitamp file write error, try re-sending the file");
            } else {
              COMMONUtils.ShowError('lang_msg_no_bitmap_file');
            }
            multiimageoverlayView();
            $scope.$apply();
          }, $scope, btoa(fileToPost), specialHeaders);
      };
    }


    return true;
  }




  function parseImagePresetSchedule() {
    var schedule = null,
      from = null,
      to = null;

    for (var presetCnt = 0; presetCnt < $scope.ImagePreset[$scope.ch].Schedules.length; presetCnt++) {
      schedule = $scope.ImagePreset[$scope.ch].Schedules[presetCnt];

      if (schedule.EveryDay.FromTo.length > 0) {
        from = schedule.EveryDay.FromTo.split('-')[0];
        to = schedule.EveryDay.FromTo.split('-')[1];

        schedule.SelectedFromHour = parseInt(from.split(':')[0], 10);
        schedule.SelectedFromMinute = parseInt(from.split(':')[1], 10);

        schedule.SelectedToHour = parseInt(to.split(':')[0], 10);
        schedule.SelectedToMinute = parseInt(to.split(':')[1], 10);
      } else {
        schedule.SelectedFromHour = 0;
        schedule.SelectedFromMinute = 0;
        schedule.SelectedToHour = 0;
        schedule.SelectedToMinute = 0;
      }
    }
  }

  function calcImagePresetScheduleStyle() {
    var schedules = $scope.ImagePreset[$scope.ch].Schedules;
    var schedule = null;
    var calcedStyle = null;
    var i = 0;

    var height = 39;
    var headerWidthPercent = 100 / 24; //100 / 24;
    var width = 0;

    var enabled = $scope.ImagePreset[$scope.ch].ScheduleEnable;

    for (i = 0; i < schedules.length; i++) {
      calcedStyle = {};
      schedule = schedules[i];

      calcedStyle.top = '-' + ((i + 1) * height) + 'px';

      calcedStyle.left = headerWidthPercent * schedule.SelectedFromHour;
      calcedStyle.left += headerWidthPercent * (schedule.SelectedFromMinute / 60);
      calcedStyle.left += '%';

      width = headerWidthPercent * (schedule.SelectedToHour - schedule.SelectedFromHour);
      width += headerWidthPercent * ((schedule.SelectedToMinute / 60) - (schedule.SelectedFromMinute / 60));
      if(width >= 99.93){
          width = 100;
      }

      if(width <= 0.1){
          width = '2px';
      }else{
          width += '%';
      }
      
      calcedStyle.width = width;

      calcedStyle.visibility = schedule.Mode === 'Off' ? 'hidden' : 'visible';
      calcedStyle.visibility = enabled ? calcedStyle.visibility : 'hidden';

      schedule.style = calcedStyle;

      schedule.tooltip = COMMONUtils.getTranslatedOption('Mode') + ' : ' + COMMONUtils.getTranslatedOption(schedule.Mode);
      schedule.tooltip += '\r\n' + COMMONUtils.getTranslatedOption('Time') + ' : ' + COMMONUtils.getFormatedInteger(schedule.SelectedFromHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedFromMinute, 2);
      schedule.tooltip += '-' + COMMONUtils.getFormatedInteger(schedule.SelectedToHour, 2) + ':' + COMMONUtils.getFormatedInteger(schedule.SelectedToMinute, 2);
    }

    calcUserPresetSchedule();
  }

  function getDatetimeFromHourMin(hour, min) {
    return new Date(0, 0, 0, hour, min);
  }

  function calcUserPresetSchedule() {
    var schedules = angular.copy($scope.ImagePreset[$scope.ch].Schedules);

    // sort schedule by time
    schedules = schedules.sort(COMMONUtils.sortArray('SelectedFromMinute', true));
    schedules = schedules.sort(COMMONUtils.sortArray('SelectedFromHour', true));

    var result = [];
    var userPreset = null;
    var key = null;
    var schedule = null;
    var end = new Date(0, 0, 0, 23, 59);
    var cur = null;
    for (key in schedules) {
      schedule = schedules[key];
      userPreset = {};

      if (schedule.Mode === 'Off') {
        continue;
      }

      cur = getDatetimeFromHourMin(schedule.SelectedToHour, schedule.SelectedToMinute);

      // need 1 min diff to another schedule
      cur.setMinutes(cur.getMinutes() + 1);
      if (end.getHours() !== 23 || end.getMinutes() !== 59) {
        end.setMinutes(end.getMinutes() - 1);
      }

      userPreset.fromHour = cur.getHours();
      userPreset.fromMin = cur.getMinutes();
      userPreset.toHour = end.getHours();
      userPreset.toMin = end.getMinutes();

      // restore
      cur.setMinutes(cur.getMinutes() - 1);
      if (end.getHours() !== 23 || end.getMinutes() !== 59) {
        end.setMinutes(end.getMinutes() + 1);
      }

      if (end - cur > 60000) { // 0~1 minute is not usable
        result.push(userPreset);
      }

      end = getDatetimeFromHourMin(schedule.SelectedFromHour, schedule.SelectedFromMinute);
    }

    // first userpreset schedule
    var start = new Date(0, 0, 0, 0, 0);
    // need 1 min diff to next schedule
    if (end.getHours() !== 23 || end.getMinutes() !== 59) {
      end.setMinutes(end.getMinutes() - 1);
    }
    userPreset = {};
    userPreset.fromHour = start.getHours();
    userPreset.fromMin = start.getMinutes();
    userPreset.toHour = end.getHours();
    userPreset.toMin = end.getMinutes();
    if (end.getHours() !== 23 || end.getMinutes() !== 59) {
      end.setMinutes(end.getMinutes() + 1);
    }

    if (end - start > 60000) { // 0~1 minute is not usable
      result.push(userPreset);
    }

    var calcedStyle = null;
    var width = 0;
    var height = 39;
    var headerWidthPercent = 100 / 24; //100 / 24;
    var i = 0;
    var enabled = $scope.ImagePreset[$scope.ch].ScheduleEnable;
    for (i = 0; i < result.length; i++) {
      userPreset = result[i];
      calcedStyle = {};

      calcedStyle.visibility = enabled ? calcedStyle.visibility : 'hidden';
      calcedStyle.top = '-' + ((i + $scope.ImagePreset[$scope.ch].Schedules.length + 1) * height) + 'px';

      calcedStyle.left = headerWidthPercent * userPreset.fromHour;
      calcedStyle.left += headerWidthPercent * (userPreset.fromMin / 60);
      calcedStyle.left += '%';

      width = headerWidthPercent * (userPreset.toHour - userPreset.fromHour);
      width += headerWidthPercent * ((userPreset.toMin / 60) - (userPreset.fromMin / 60));
      if(width >= 99.93){
          width = 100;
      }

      if(width <= 0.1){
          width = '2px';
      }else{
          width += '%';
      }

      calcedStyle.width = width;

      userPreset.tooltip = COMMONUtils.getTranslatedOption('Mode') + ' : ' + COMMONUtils.getTranslatedOption($scope.ImagePreset[$scope.ch].Mode);
      userPreset.tooltip += '\r\n' + COMMONUtils.getTranslatedOption('Time') + ' : ' + COMMONUtils.getFormatedInteger(userPreset.fromHour, 2) + ':' + COMMONUtils.getFormatedInteger(userPreset.fromMin, 2);
      userPreset.tooltip += '-' + COMMONUtils.getFormatedInteger(userPreset.toHour, 2) + ':' + COMMONUtils.getFormatedInteger(userPreset.toMin, 2);

      userPreset.style = calcedStyle;
    }

    $scope.UserPreset = result;
  }

  function setDefaultPreset() {
    var presetName = $scope.ImagePreset[$scope.ch].Mode;

    if (presetName === 'UserPreset') {
      /** reset all the values back to page data  */
      $scope.ImageEnhancements = angular.copy(pageData.ImageEnhancements);
      $scope.Camera = angular.copy(pageData.Camera);
      $scope.SSDR = angular.copy(pageData.SSDR);
    } else {
      var newVal = getDefaultPresetValue(presetName)

      /**
       * Enable SSDR
       */
      if (typeof mAttr.SSDRLevel !== 'undefined') {
        if ($scope.SSDR[$scope.ch].Enable === false) {
          LogManager.debug('SSDR Enable is adjusted ', $scope.SSDR[$scope.ch].Enable, ' -> ', true);
          $scope.SSDR[$scope.ch].Enable = true;
        }
      }

      /**
       * Reset SSDR Level
       */
      if (typeof mAttr.SSDRLevel !== 'undefined') {
        if (newVal.SSDRLevel !== $scope.SSDR[$scope.ch].Level) {
          LogManager.debug('SSDR Value is adjusted ', $scope.SSDR[$scope.ch].Level, ' -> ', newVal.SSDRLevel);
          $scope.SSDR[$scope.ch].Level = newVal.SSDRLevel;
          pageData.SSDR[$scope.ch].Level = $scope.SSDR[$scope.ch].Level;
        }
      }

      /**
       * Reset Min Shutter
       */
      if (typeof mAttr.MinShutterOptions !== 'undefined') {
        if ($scope.Camera.AutoShortShutterSpeed !== newVal.AutoShortShutterSpeed) {
          LogManager.debug('Min Shutter Value is adjusted ', $scope.Camera.AutoShortShutterSpeed, ' -> ', newVal.AutoShortShutterSpeed);
          $scope.Camera.AutoShortShutterSpeed = newVal.AutoShortShutterSpeed;
        }
      }


      /**
       * Reset Max Shutter
       */
      if (typeof mAttr.MinShutterOptions !== 'undefined') {
        /** In case of WDR mode, max value is only 1/240 so dont adjust Max shutter speed */
        if ($scope.Camera.CompensationMode !== 'WDR') {
          if ($scope.Camera.AutoLongShutterSpeed !== newVal.AutoLongShutterSpeed) {
            LogManager.debug('Max Shutter Value is adjusted ', $scope.Camera.AutoLongShutterSpeed, ' -> ', newVal.AutoLongShutterSpeed);
            $scope.Camera.AutoLongShutterSpeed = newVal.AutoLongShutterSpeed;
          }
        }
      }

      /**
       * Reset AFLK Mode
       */
      if (typeof $scope.AFLKModeOptions !== 'undefined') {
        if ($scope.Camera.AFLKMode !== 'Off') {
          LogManager.debug('AFLK Value is adjusted ', $scope.Camera.AFLKMode, ' -> ', 'Off');
          $scope.Camera.AFLKMode = 'Off';
        }
      }

      /**
       * Reset SSNR3 Mode
       */
      if (typeof mAttr.SSNRLevel !== 'undefined') {
        if ($scope.Camera.SSNRMode === 'Off') {
          LogManager.debug('SSNR Mode is adjusted ', $scope.Camera.SSNRMode, ' ->  Manual');
          $scope.Camera.SSNRMode = 'Manual';
        }
      }

      /**
       * Reset SSNR3 Level
       */
      if (typeof mAttr.SSNRLevel !== 'undefined') {
        if ($scope.Camera.SSNRLevel !== newVal.SSNRLevel) {
          LogManager.debug('SSNR Level is adjusted ', $scope.Camera.SSNRLevel, ' -> ', newVal.SSNRLevel);
          $scope.Camera.SSNRLevel = newVal.SSNRLevel;
        }
      }

      /**
       * Reset AGC Mode
       */
      if (typeof $scope.AGCModeOptions !== 'undefined') {
        if ($scope.Camera.AGCMode !== newVal.AGCMode) {
          LogManager.debug('AGC Mode is adjusted ', $scope.Camera.AGCMode, ' -> ', newVal.AGCMode);
          $scope.Camera.AGCMode = newVal.AGCMode;
        }
      }

      /**
       * Reset Color Level
       */
      if (typeof $scope.Saturation !== 'undefined') {
        if ($scope.ImageEnhancements.Saturation !== newVal.Saturation) {
          LogManager.debug('Color Level is adjusted ', $scope.ImageEnhancements.Saturation, ' -> ', newVal.Saturation);
          $scope.ImageEnhancements.Saturation = newVal.Saturation;
          pageData.ImageEnhancements.Saturation = $scope.ImageEnhancements.Saturation;
        }
      }
    }
    cameraChangeHandler();
  }


  function SetAreaRange(direction) {
    // BLC Mode ON - Allow to set BLC Range
    var compenstationMode = direction.substring(0, 3);
    var areaDirection = direction.substring(3, direction.length);

    if (compenstationMode !== $scope.Camera.CompensationMode) {
      return;
    }
    /*if ($scope.Camera.CompensationMode !== 'BLC') {
        return;
    }*/

    var maxLength = 'max' + compenstationMode + 'Length';
    var minHeightLength = 'min' + compenstationMode + 'HeightLength';
    var minWidthLength = 'min' + compenstationMode + 'WidthLength';
    var AbsMax = compenstationMode + 'AbsMax';
    var AbsMin = compenstationMode + 'AbsMin';
    var BottomSliderOptions = compenstationMode + 'BottomSliderOptions';
    var TopSliderOptions = compenstationMode + 'TopSliderOptions';
    var RightSliderOptions = compenstationMode + 'RightSliderOptions';
    var LeftSliderOptions = compenstationMode + 'LeftSliderOptions';

    if (areaDirection === "AreaTop") {

      if (Number($scope.Camera[direction]) + Number($scope[maxLength]) <= Number($scope[AbsMax])) {
        $scope[BottomSliderOptions].ceil = Number($scope.Camera[direction]) + Number($scope[maxLength]);
      } else {
        $scope[BottomSliderOptions].ceil = Number($scope[AbsMax]);
      }

      if (Number($scope.Camera[direction]) + Number($scope[minHeightLength]) >= Number($scope[minHeightLength])) {
        $scope[BottomSliderOptions].floor = Number($scope.Camera[direction]) + Number($scope[minHeightLength]);
      } else {
        $scope[BottomSliderOptions].floor = Number($scope[minHeightLength]);
      }

    } else if (areaDirection === "AreaBottom") {

      if (Number($scope.Camera[direction]) - Number($scope[minHeightLength]) <= Number($scope[AbsMax]) - Number($scope[minHeightLength])) {
        $scope[TopSliderOptions].ceil = Number($scope.Camera[direction]) - Number($scope[minHeightLength]);
      } else {
        $scope[TopSliderOptions].ceil = Number($scope[AbsMax]) - Number($scope[minHeightLength]);
      }

      if (Number($scope.Camera[direction]) - Number($scope[maxLength]) > 0) {
        $scope[TopSliderOptions].floor = Number($scope.Camera[direction]) - Number($scope[maxLength]);
      } else {
        $scope[TopSliderOptions].floor = Number($scope[AbsMin]);
      }

    } else if (areaDirection === "AreaLeft") {

      if (Number($scope.Camera[direction]) + Number($scope[maxLength]) <= Number($scope[AbsMax])) {
        $scope[RightSliderOptions].ceil = Number($scope.Camera[direction]) + Number($scope[maxLength]);
      } else {
        $scope[RightSliderOptions].ceil = Number($scope[AbsMax]);
      }

      if (Number($scope.Camera[direction]) + Number($scope[minWidthLength]) >= Number($scope[minWidthLength])) {
        $scope[RightSliderOptions].floor = Number($scope.Camera[direction]) + Number($scope[minWidthLength]);
      } else {
        $scope[RightSliderOptions].floor = Number($scope[minWidthLength]);
      }

    } else if (areaDirection === "AreaRight") {

      if (Number($scope.Camera[direction]) - Number($scope[minWidthLength]) <= Number($scope[AbsMax]) - Number($scope[minWidthLength])) {
        $scope[LeftSliderOptions].ceil = Number($scope.Camera[direction]) - Number($scope[minWidthLength]);
      } else {
        $scope[LeftSliderOptions].ceil = Number($scope[AbsMax]) - Number($scope[minWidthLength]);
      }

      if (Number($scope.Camera[direction]) - Number($scope[maxLength]) > 0) {
        $scope[LeftSliderOptions].floor = Number($scope.Camera[direction]) - Number($scope[maxLength]);
      } else {
        $scope[LeftSliderOptions].floor = Number($scope[AbsMin]);
      }
    }

    $scope.refreshSliders();
    cameraChangeHandler();
  }

  function handlePresetChange() {
    $scope.ImageOptionsIndex = getDefaultPresetIndex($scope.ImagePreset[$scope.ch].Mode);
    setDefaultPreset();
    //if(mAttr.PTZModel==true){
    //    setDefaultPresetForPreset();
    //}
    initSSDRSlider();
    initExposureSliders();
    calcImagePresetScheduleStyle();
    $scope.setScheduleColor();

    //to refresh slider width
    setTimeout(function() {
      $scope.$broadcast('reCalcViewDimensions');
    }, 10);
  }
  $scope.handlePresetChange = handlePresetChange;

  function getDefaultPresetIndex(preset) {
    var ImagePresetModes = $scope.ImageOptions.ImagePresetModes,
      presetCnt = 0;

    if (typeof ImagePresetModes !== 'undefined') {
      for (presetCnt = 0; presetCnt < ImagePresetModes.length; presetCnt++) {
        var presetDetail = ImagePresetModes[presetCnt];

        if (presetDetail.ImagePresetMode == preset) {
          return presetCnt;
        }
      }
    }
  }

  function getDefaultPresetValue(preset, parameter) {
    var ImagePresetModes = $scope.ImageOptions.ImagePresetModes,
      presetCnt = 0;

    if (typeof ImagePresetModes !== 'undefined') {
      changePreferShutterByFPS();
      for (presetCnt = 0; presetCnt < ImagePresetModes.length; presetCnt++) {
        var presetDetail = ImagePresetModes[presetCnt];

        if (presetDetail.ImagePresetMode == preset) {
          return presetDetail;
        }
      }
    }
  }

  function changePreferShutterByFPS() {
    if ($scope.VideoSources.SensorCaptureFrameRate === '25' || $scope.VideoSources.SensorCaptureFrameRate === '50') {
      if ($scope.ImagePreset[$scope.ch].Mode === 'DefinitionFocus' || $scope.ImagePreset[$scope.ch].Mode === 'ReducedNoise' ||
        $scope.ImagePreset[$scope.ch].Mode === 'BrightVideo' || $scope.ImagePreset[$scope.ch].Mode === 'VividVideo') {
        $scope.ImageOptions.ImagePresetModes[$scope.ImageOptionsIndex].PreferShutterSpeed = "1/50";
      }
    } else {
      if ($scope.ImagePreset[$scope.ch].Mode === 'DefinitionFocus' || $scope.ImagePreset[$scope.ch].Mode === 'ReducedNoise' ||
        $scope.ImagePreset[$scope.ch].Mode === 'BrightVideo' || $scope.ImagePreset[$scope.ch].Mode === 'VividVideo') {
        $scope.ImageOptions.ImagePresetModes[$scope.ImageOptionsIndex].PreferShutterSpeed = "1/60";
      }
    }
  }

  function stopLivePreviewMode(event) {
    if ($scope.previewMode === true) {
      $scope.previewMode = false;
      livePreviewMode('Stop', event);
    }
  }

  function extendPreviewMode() {
    if (typeof $scope.previewTimer !== 'undefined') {
      $timeout.cancel($scope.previewTimer);
    }
    $scope.previewTimer = $timeout(stopLivePreviewMode, previewTimeout);
  }
  $scope.$on('extendPreviewMode', extendPreviewMode);

  /*Start Preview mode as soon as page is loaded, inorder to match with old web viewer spec.
   Ideally it is not required.*/

  //By default preview will be disabled only when something changes its enabled
  // $scope.previewMode = true;
  extendPreviewMode();

  function handlePreviewTimeout() {
    // select first tab
    initTabActiveData();
    stopLivePreviewMode();
    view();
    /**
     * Infinitely extend the timer as long as user stays in that page.
     * It is un ndecsary, added to match with old web viewer
     */
    extendPreviewMode();
    //$scope.previewMode = true;
  }

  $scope.$watch('previewMode', function(newVal, oldVal) {
    if (newVal === true) { 
      $rootScope.isCameraSetupPreview = true; 
    }
    if ($rootScope.cameraSetupToLive === true) { 
      return; 
    }
    if (oldVal === false && newVal === true) {
      extendPreviewMode();
    }

    if (oldVal === true && newVal === false) {
      var changedUrl = $location.absUrl();
      /** Timeout message should be shown only when we are camera setup page.
       This condition is to avoid timout message being shown in login page sometimes */
      if (changedUrl.indexOf('videoAudio_cameraSetup') !== -1) {
        $uibModalStack.dismissAll('closing');
        COMMONUtils.ShowInfo('lang_timeout', handlePreviewTimeout);
      } else {
        handlePreviewTimeout();
      }
    }
  });

  function registerVideoSourceWatcher() {
    if ($scope.videoSourceWatcherReady === true) {
      return;
    }

    $scope.videoSourceWatcherReady = true;
    $scope.$watch('VideoSources', function(newVal, oldVal) {
      videoSourceSet(true);
    }, true);
  }

  function videoSourceView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }

    return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videosource&action=view', getData,
      function(response) {
        $scope.VideoSources = response.data.VideoSources[$scope.ch];
        pageData.VideoSources = angular.copy($scope.VideoSources);
        previewData.VideoSources = angular.copy($scope.VideoSources);
        $scope.SensorTabReady = true;
        registerVideoSourceWatcher();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function registerSsdrWatcher() {
    if ($scope.SSDRWatcherReady === true) {
      return;
    }

    $scope.SSDRWatcherReady = true;
    $scope.$watch('SSDR', function(newVal, oldVal) {
      setSSDR(true);
    }, true);
  }

  function viewSSDR() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=ssdr&action=view', getData,
      function(response) {
        $scope.SSDR = response.data.SSDR;
        pageData.SSDR = angular.copy($scope.SSDR);
        previewData.SSDR = angular.copy($scope.SSDR);
        $scope.SSDRTabReady = true;
        registerSsdrWatcher();
        initSSDRSettings();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function registerimagePresetWatcher() {
    if ($scope.imgPresetWatcherReady === true) {
      return;
    }

    $scope.imgPresetWatcherReady = true;
    $scope.$watch('ImagePreset', function(newVal, oldVal) {
      setImagePreset(true);
    }, true);

    $scope.$watch('ImagePreset[ch].ScheduleEnable', function(newVal, oldVal) {
      calcImagePresetScheduleStyle();
    });
  }

  function viewImagePreset() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imagepreset&action=view', getData,
      function(response) {
        $scope.imagePresetListReady = true;
        $scope.ImagePreset = response.data.ImagePreset;
        $scope.imagePresetReady = true;
        parseImagePresetSchedule();
        pageData.ImagePreset = angular.copy($scope.ImagePreset);
        previewData.ImagePreset = angular.copy($scope.ImagePreset);
        $scope.setScheduleColor();
        calcImagePresetScheduleStyle();
        registerimagePresetWatcher();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function whitebalanceView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=whitebalance&action=view', getData,
      function(response) {
        $scope.WhiteBalance = response.data.WhiteBalance[$scope.ch];
        pageData.WhiteBalance = angular.copy($scope.WhiteBalance);
        previewData.WhiteBalance = angular.copy($scope.WhiteBalance);
        initWhiteBalanceSettings();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function cameraView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', getData,
      function(response) {
        $scope.Camera = response.data.Camera[$scope.ch];
        if (typeof mAttr.MaxAlarmInput !== 'undefined') {
          if ($scope.Camera.DayNightMode === 'ExternalBW' && mAttr.MaxAlarmInput > 0) {
            mAttr.MaxAlarmInput = 0;
            mAttr.cameraCommandResponse = response.data.Camera[0];
            $rootScope.$broadcast('menureload', "Alarmin disabled");
          } else if ($scope.Camera.DayNightMode !== 'ExternalBW' && mAttr.MaxAlarmInputOriginal !== mAttr.MaxAlarmInput) {
            mAttr.MaxAlarmInput = mAttr.MaxAlarmInputOriginal;
            mAttr.cameraCommandResponse = response.data.Camera[0];
            $rootScope.$broadcast('menureload', "Alarmin enabled");
          }
        }

        $scope.Camera.WDRSeamlessTransition = ($scope.Camera.WDRSeamlessTransition === 'On') ? true : false;
        $scope.Camera.WDRLowLight = ($scope.Camera.WDRLowLight === 'On') ? true : false;
        $scope.Camera.WDRIRLEDEnable = ($scope.Camera.WDRIRLEDEnable === 'On') ? true : false;
        // $scope.Camera.HLCDimming = ($scope.Camera.HLCDimming === 'On') ? true : false;

        pageData.Camera = angular.copy($scope.Camera);
        previewData.Camera = angular.copy($scope.Camera);
        initBLCSliders();
        initHLCSliders();
        initExposureSliders();

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function flipView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
      function(response) {
        $scope.Flip = response.data.Flip[$scope.ch];
        pageData.Flip = angular.copy($scope.Flip);
        initBLCSliders();
        initHLCSliders();
        //AdjustFlipOnVideo();
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function heaterScheduleView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=scheduler&action=view', '',
      function(response) {
        $scope.HeaterSchedules = response.data.Scheduler[0].Schedule;
        pageData.HeaterSchedules = angular.copy($scope.HeaterSchedules);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function AdjustFlipOnVideo() {
    var viewerWidth = 640;
    var viewerHeight = 360;
    var maxWidth = mAttr.MaxROICoordinateX;
    var maxHeight = mAttr.MaxROICoordinateY;
    var rotate = $scope.Flip.Rotate;
    var flip = $scope.Flip.VerticalFlipEnable;
    var mirror = $scope.Flip.HorizontalFlipEnable;
    var ratio = (mAttr.MaxROICoordinateX / mAttr.MaxROICoordinateY).toFixed(1);

    if (ratio == 1.3) { //4:3
      viewerHeight = 480;
    } else if (ratio == 1.8) { //16:9
      viewerHeight = 360;
    } else if (ratio == 1.9) { //4096x2160
      viewerHeight = 337;
    }

    if (rotate == "90" || rotate == "270") {
      var temp = viewerWidth;
      viewerWidth = viewerHeight;
      viewerHeight = temp;
      temp = maxWidth;
      maxWidth = maxHeight;
      maxHeight = temp;
    }

    $scope.videoinfo = {
      width: viewerWidth,
      height: viewerHeight,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      flip: flip,
      mirror: mirror,
      support_ptz: false,
      rotate: rotate
    };
  }

  function registerImgEnhancementsWatcher() {
    if ($scope.ImageEnhaneWatcherReady === true) {
      return;
    }

    $scope.ImageEnhaneWatcherReady = true;

    $scope.$watch('ImageEnhancements', function(newVal, oldVal) {
      if (!(mAttr.ZoomOnlyModel || mAttr.PTZModel) || $scope.disChanged.global !== true) {
        imageenhancementsSet(true);
      }
    }, true);
  }

  function imageenhancementsView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', getData,
      function(response) {
        $scope.ImageEnhancements = response.data.ImageEnhancements[$scope.ch];
        pageData.ImageEnhancements = angular.copy($scope.ImageEnhancements);
        previewData.ImageEnhancements = angular.copy($scope.ImageEnhancements);
        registerImgEnhancementsWatcher();
        initExposureSliders();

        if (typeof $scope.ImageEnhancements.DISEnable !== 'undefined') {
          getTamperDetection();
          getVideoAnalysis();
        }
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function imageOptionsView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageoptions&action=view', getData,
      function(response) {
        $scope.ImageOptions = response.data.ImageOptions[$scope.ch];
        if ($scope.ImageOptions.ShutterSpeedDetails === 'undefined') {
          var temp = CameraSpec.getShutterSpeeds();
          $scope.ImageOptions.ShutterSpeedDetails = temp.ShutterSpeedDetails;
        }
        pageData.ImageOptions = angular.copy($scope.ImageOptions);

        if (mAttr.NormalizedOSDRange) {
          $scope.OffsetToReduceOnWeekDay = 0;
        } else {
          $scope.OffsetToReduceOnWeekDay = 4;
        }

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function focusView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=view', getData,
      function(response) {
        $scope.Focus = response.data.Focus[$scope.ch];
        pageData.Focus = angular.copy($scope.Focus);
        previewData.Focus = angular.copy($scope.Focus);
        registerFocusWatcher();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function registerFocusWatcher() {
    if ($scope.focusWatcherReady === true) {
      return;
    }

    $scope.focusWatcherReady = true;
    $scope.$watch('Focus', function(newVal, oldVal) {
      focusSet(true);
    }, true);
  }

  function multiimageoverlayView() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multiimageosd&action=view', '',
      function(response) {
        if (response.data.multiimageosd === 'undefined') {
          return;
        }

        if (response.data.multiimageosd[0].MaxResolution !== 'undefined') {
          $scope.OverlayImageMaxResolution = response.data.multiimageosd[0].MaxResolution;
          var indx = 0;
          for (indx = 0; indx < response.data.multiimageosd[0].Imageosds.length; indx++) {
            $scope.IsImageInstalled = response.data.multiimageosd[0].Imageosds[indx].IsInstalled;
          }
          $scope.ImageFile = "";
          $scope.ImageFileFull = {};
          if (document.getElementById('ImageField')) { 
            document.getElementById('ImageField').value = null;
        }
        }
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function ptzsettingsView() {
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=view', '',
      function(response) {
        $scope.PTZSettings = response.data.PTZSettings[$scope.ch];
        pageData.PTZSettings = angular.copy($scope.PTZSettings);
        previewData.PTZSettings = angular.copy($scope.PTZSettings);
        registerPTZSettingWatcher();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function registerPTZSettingWatcher() {
    if ($scope.PTZSettingWatcherReady === true) {
      return;
    }

    $scope.PTZSettingWatcherReady = true;
    $scope.$watch('PTZSettings', function(newVal, oldVal) {
      ptzsettingsSet(true);
      if ((mAttr.ZoomOnlyModel || mAttr.PTZModel) && $scope.disChanged.global === true) {
        imageenhancementsSet(true);
      }
    }, true);
  }

  function parseIrledSchedule() {
    var from = '', to = '', Fromto = '', everyDay = '';
    if (typeof $scope.IRled.Schedule !== 'undefined') {
      everyDay = $scope.IRled.Schedule.EveryDay;
      Fromto = everyDay.FromTo;
      from = Fromto.split('-')[0];
      to = Fromto.split('-')[1];

      everyDay.SelectedFromHour = parseInt(from.split(':')[0], 10);
      everyDay.SelectedFromMinute = parseInt(from.split(':')[1], 10);

      everyDay.SelectedToHour = parseInt(to.split(':')[0], 10);
      everyDay.SelectedToMinute = parseInt(to.split(':')[1], 10);
    }
  }

  function registerIRLedWatcher() {
    if ($scope.irLEDWatcherReady === true) {
      return;
    }

    $scope.irLEDWatcherReady = true;

    $scope.$watch('IRled', function(newVal, oldVal) {
      irLedSet(true);
    }, true);
  }

  function irLEDView() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=irled&action=view', getData,
      function(response) {
        $scope.IRled = response.data.IRled[$scope.ch];
        parseIrledSchedule();
        pageData.IRled = angular.copy($scope.IRled);
        previewData.IRled = angular.copy($scope.IRled);
        registerIRLedWatcher();
        initIRLedSetting();
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }
  $scope.getIRModeTranslation = function(option) {
    if (mAttr.PTZModel && option === 'Schedule') {
      return COMMONUtils.getTranslatedOption('Timed');
    } else if (mAttr.PTZModel && option === 'Heater') {
      return COMMONUtils.getTranslatedOption('Heater/Fan');
    } else {
      return COMMONUtils.getTranslatedOption(option)
    }
  };
  $scope.irledChangeHandler = function() {
    if (mAttr.PTZModel && mAttr.IRLedSupport) {
      if (mAttr.PTZModel && $scope.IRled.Mode === 'DayNight') {
        $scope.Camera.DayNightMode = 'Auto';
        if ($scope.Camera.AGCMode === 'Off' || $scope.Camera.AGCMode === 'Manual') {
          $scope.Camera.AGCMode = 'High';
        }
        if ($scope.PresetImageConfig.length > 0) {
          $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.DayNightMode = 'Auto';
          if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Manual') {
            $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode = 'High';
          }
        }
      }
      if ($scope.IRled.Mode === 'Off') {
        if ($scope.Camera.AGCMode === 'Off' || $scope.Camera.AGCMode === 'Manual') {
          $scope.Camera.AGCMode = 'High';
        }
        if ($scope.PresetImageConfig.length > 0) {
          if ($scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Off' || $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode === 'Manual') {
            $scope.PresetImageConfig[$scope.presetTypeData.PresetIndex].Camera.AGCMode = 'High';
          }
        }
      }
      if ($scope.presetTypeData.SelectedPresetType == 0) {
        cameraDayNightPreview();
      } else {
        presetCameraDayNightPreview();
      }
    }
    initIRLedSliders();
  };

  function ptzPresetsView() {
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', '',
      function(response) {
        $scope.PresetNameValueOptions = [];
        if (response.data.PTZPresets[$scope.ch].Presets) {
          for (var i = 0; i < response.data.PTZPresets[$scope.ch].Presets.length; i++) {
            $scope.PresetNameValueOptions[i] = {
              Preset: response.data.PTZPresets[$scope.ch].Presets[i].Preset,
              Name: response.data.PTZPresets[$scope.ch].Presets[i].Name,
              Text: response.data.PTZPresets[$scope.ch].Presets[i].Preset + ' : ' + response.data.PTZPresets[$scope.ch].Presets[i].Name
            };
          }
        }
        if ($scope.presetTypeData.SelectedPresetType == 0) {
          $timeout(function() {
            getSelectedPreset();
          }, 500);
        }
      },
      function(errorData) {
        if (errorData !== "Configuration Not Found") {
          console.log(errorData);
        } else {
          $scope.PresetNameValueOptions = [];
        }
      }, '', true);
  }

  function presetImageConfigView() {
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=view', '',
      function(response) {
        if (typeof response.data.PresetImageConfig !== 'undefined') {
          $scope.PresetImageConfig = response.data.PresetImageConfig[$scope.ch].Presets;
        } else {
          $scope.PresetImageConfig = [];
        }
        for (var index = 0; index < $scope.PresetImageConfig.length; index++) {
          $scope.PresetImageConfig[index].SSDR = {
            Channel: $scope.ch,
            Enable: $scope.PresetImageConfig[index].SSDREnable,
            Level: $scope.PresetImageConfig[index].SSDRLevel
          };
          $scope.PresetImageConfig[index].WhiteBalance = {
            Channel: $scope.ch,
            WhiteBalanceMode: $scope.PresetImageConfig[index].WhiteBalanceMode,
            WhiteBalanceManualRedLevel: $scope.PresetImageConfig[index].WhiteBalanceManualRedLevel,
            WhiteBalanceManualBlueLevel: $scope.PresetImageConfig[index].WhiteBalanceManualBlueLevel
          };
          $scope.PresetImageConfig[index].ImageEnhancements = {
            Channel: $scope.ch,
            DISEnable: $scope.PresetImageConfig[index].DISEnable,
            Brightness: $scope.PresetImageConfig[index].Brightness,
            SharpnessEnable: $scope.PresetImageConfig[index].SharpnessEnable,
            SharpnessLevel: $scope.PresetImageConfig[index].SharpnessLevel,
            Saturation: $scope.PresetImageConfig[index].Saturation,
            DefogMode: $scope.PresetImageConfig[index].DefogMode,
            DefogLevel: $scope.PresetImageConfig[index].DefogLevel
          };
          $scope.PresetImageConfig[index].Camera = {
            Channel: $scope.ch,
            AFLKMode: $scope.PresetImageConfig[index].AFLKMode,
            SSNREnable: $scope.PresetImageConfig[index].SSNREnable,
            SSNRLevel: $scope.PresetImageConfig[index].SSNRLevel,
            SSNR2DLevel: $scope.PresetImageConfig[index].SSNR2DLevel,
            SSNR3DLevel: $scope.PresetImageConfig[index].SSNR3DLevel,
            IrisMode: $scope.PresetImageConfig[index].IrisMode,
            IrisFno: $scope.PresetImageConfig[index].IrisFno,
            AGCMode: $scope.PresetImageConfig[index].AGCMode,
            DayNightMode: $scope.PresetImageConfig[index].DayNightMode,
            DayNightSwitchingTime: $scope.PresetImageConfig[index].DayNightSwitchingTime,
            DayNightSwitchingMode: $scope.PresetImageConfig[index].DayNightSwitchingMode
          };
          $scope.PresetImageConfig[index].Focus = {
            Channel: $scope.ch,
            Mode: $scope.PresetImageConfig[index].FocusMode
          };
          $scope.PresetImageConfig[index].PTZSettings = {
            Channel: $scope.ch,
            DigitalZoomEnable: $scope.PresetImageConfig[index].DigitalZoomEnable,
            MaxDigitalZoom: $scope.PresetImageConfig[index].MaxDigitalZoom
          };

        }
        pageData.PresetImageConfig = angular.copy($scope.PresetImageConfig);
        previewData.PresetImageConfig = angular.copy($scope.PresetImageConfig);
        registerPresetSsdrWatcher();
        registerPresetImgEnhancementsWatcher();
        registerPresetFocusWatcher();
        registerPresetPTZSettingsWatcher();
        initPresetImageConfig();
      },
      function(errorData) {
        if (errorData !== "Configuration Not Found") {
          console.log(errorData);
        } else {
          $scope.PresetImageConfig = [];
          pageData.PresetImageConfig = angular.copy($scope.PresetImageConfig);
          previewData.PresetImageConfig = angular.copy($scope.PresetImageConfig);
          initPresetImageConfig();
        }
      }, '', true);
  }

  function getTamperDetection() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=tamperingdetection&action=view', getData,
      function(response) {
        $scope.disDisable.TamperDetectEnable = response.data.TamperingDetection[0].Enable;
      },
      function(errorData) {}, '', true);
  }

  function getVideoAnalysis() {
    var cmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=view';
    if (typeof $scope.VideoAnalysis2Support !== 'undefined' && $scope.VideoAnalysis2Support === true) {
      cmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis2&action=view';
    }
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get(cmd, getData,
      //return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=view', getData,
      function(response) {
        $scope.disDisable.DetectionType = response.data.VideoAnalysis[0].DetectionType;
      },
      function(errorData) {}, '', true);
  }

  // function filterArrayByOSDType(data, filter) {
  //     var filteredArray = [];

  //     $.each(data, function (i, value) {
  //         if (data[i].OSDType === filter) {
  //             filteredArray.push(data[i]);
  //         }
  //     });

  //     return filteredArray;
  // }

  function initOverlaySettings() {
    $scope.MultilineOSDTitle = mAttr.MultilineOSDTitle;
    $scope.TimeFormatOptions = mAttr.TimeFormatOptions;
    $scope.PositionX = mAttr.PositionX;
    $scope.PositionY = mAttr.PositionY;
    $scope.FontSizeOptions = mAttr.FontSizeOptions;
    $scope.OSDColorOptions = mAttr.OSDColorOptions;
    $scope.OSDBlinkOptions = mAttr.OSDBlinkOptions;
    if (typeof mAttr.OSDTransparencyOptions !== 'undefined') {
      $scope.OSDTransparencyOptions = [];

      for (var i = 0; i < mAttr.OSDTransparencyOptions.length; i++) {
        var option = {};
        option.value = mAttr.OSDTransparencyOptions[i];
        if (mAttr.OSDTransparencyOptions[i] === 'Off') {
          option.text = "TransparencyOff";
        } else if (mAttr.OSDTransparencyOptions[i] === 'Low') {
          option.text = "TransparencyLow";
        } else if (mAttr.OSDTransparencyOptions[i] === 'Medium') {
          option.text = "TransparencyMedium";
        } else if (mAttr.OSDTransparencyOptions[i] === 'High') {
          option.text = "TransparencyHigh";
        }
        $scope.OSDTransparencyOptions.push(option);
      }
    }

    if (typeof mAttr.MultiImageIndex !== 'undefined') {
      if (mAttr.MultiImageIndex.maxValue > 0) {
        $scope.MultiImageOverlayFeature = true;
        $scope.ImageOverlayMaxResolution = mAttr.ImageOverlayMaxResolution;
      }
    } else {
      $scope.MultiImageOverlayFeature = false;
    }

    // Overlay
    $scope.PTZPositionEnable = (mAttr.PTZPositionEnable) ? true : false;
    $scope.PresetNameEnable = (mAttr.PresetNameEnable) ? true : false;
    $scope.CameraIDEnable = (mAttr.CameraIDEnable) ? true : false;
    $scope.AzimuthEnable = (mAttr.AzimuthEnable) ? true : false;

  }

  $scope.OnColorChange = function(selectedColor) {
    $scope.OSD.Color = selectedColor;

    if (pageData.recentUpdate === "Title") {
      if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
        for (var i = 0; i < $scope.TitleOSD.length; i++) {
          if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
            //if (pageData.TitleOSD[i].PositionX !== $scope.TitleOSD[i].PositionX || pageData.TitleOSD[i].PositionY !== $scope.TitleOSD[i].PositionY)
            {
              updateMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
              break;
            }
          }
        }
      }
    } else {
      updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', true, $scope.DateOSD[0]);
    }
  };

  $scope.OnTransparencyChange = function(selectedTransparency) {
    $scope.OSD.Transparency = selectedTransparency;

    if (pageData.recentUpdate === "Title") {
      if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
        for (var i = 0; i < $scope.TitleOSD.length; i++) {
          if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
            //if (pageData.TitleOSD[i].PositionX !== $scope.TitleOSD[i].PositionX || pageData.TitleOSD[i].PositionY !== $scope.TitleOSD[i].PositionY)
            {
              updateMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
              break;
            }
          }
        }
      }
    } else {
      updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', true, $scope.DateOSD[0]);
    }
  };

  function getOSDRanges(type, selectedFontSize) {
    var ret = {},
      i = 0,
      selectedOSDDetails = {};

    if (typeof $scope.ImageOptions.OSDOptions !== 'undefined') {
      /** If Fonr size is not supported  */
      if (typeof $scope.ImageOptions.OSDOptions.FontSizes === 'undefined') {
        if (typeof $scope.ImageOptions.OSDOptions.OSDTypes !== 'undefined') {
          selectedOSDDetails = $scope.ImageOptions.OSDOptions.OSDTypes;
        }
      } else {
        var fontSizeList = $scope.ImageOptions.OSDOptions.FontSizes;

        for (i = 0; i < fontSizeList.length; i++) {
          if (fontSizeList[i].FontSize === selectedFontSize) {
            selectedOSDDetails = fontSizeList[i].OSDTypes;
          }
        }
      }

      if (typeof selectedOSDDetails !== 'undefined') {
        for (i = 0; i < selectedOSDDetails.length; i++) {
          if (type === selectedOSDDetails[i].OSDType) {
            ret = selectedOSDDetails[i];
          }
        }
      }

    }

    return ret;
  }

  $scope.OnFontSizeChange = function(selectedFontSize) {
    if (typeof selectedFontSize === 'undefined') {
      return;
    }

    $scope.titleMax = getOSDRanges('Title', selectedFontSize);
    $scope.dateMax = getOSDRanges('Date', selectedFontSize);

    var queue = [];

    if (typeof $scope.titleMax !== 'undefined' && typeof $scope.dateMax !== 'undefined') {
      //if(pageData.OSDFontSize !== selectedFontSize)
      {
        $scope.OSD.FontSize = selectedFontSize;
      }

      if (typeof $scope.TitleOSD !== 'undefined') {
        for (var i = 0; i < $scope.TitleOSD.length; i++) {
          $scope.TitleOSD[i].TitlePositionXSliderOptions.floor = $scope.PositionX.minValue;
          $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.titleMax.PositionX;

          if (typeof mAttr.NormalizedOSDRange === 'undefined' || !mAttr.NormalizedOSDRange) {
            $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.titleMax.PositionX - ($scope.TitleOSD[i].OSD.length - 1);

            if ($scope.TitleOSD[i].TitlePositionXSliderOptions.ceil < $scope.PositionX.minValue) {
              $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.PositionX.minValue;
            }
          }

          $scope.TitleOSD[i].TitlePositionYSliderOptions.floor = $scope.PositionY.minValue;
          $scope.TitleOSD[i].TitlePositionYSliderOptions.ceil = $scope.titleMax.PositionY;

          $scope.TitleOSD[i].PositionX = $scope.TitleOSD[i].TitlePositionXSliderOptions.floor;
          $scope.TitleOSD[i].PositionY = $scope.TitleOSD[i].TitlePositionYSliderOptions.floor;

          if ($scope.TitleOSD[i].IsOSDSelected) {
            if ($scope.TitleOSD[i].TitlePositionXSliderOptions.floor === 1 && $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil === 1) {
              $scope.TitleOSD[i].PositionX = 1;
              $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;
            } else {
              if ($scope.TitleOSD.Enable) {
                $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = false;
              }
            }
          }


          refreshSliders();

          updateMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i], queue);
        }
      }

      var xCeil = $scope.defaultOSDPoint.dateTime.pointX;

      if ($scope.DateOSD[0].WeekDay) {
        xCeil = $scope.dateMax.PositionX - $scope.OffsetToReduceOnWeekDay;
      } else {
        xCeil = $scope.dateMax.PositionX;
      }

      if (xCeil < $scope.PositionX.minValue) {
        xCeil = $scope.PositionX.minValue;
      }

      /** Date Sliders  X & Y */
      $scope.DatePositionXSliderOptions.floor = $scope.PositionX.minValue;
      $scope.DatePositionXSliderOptions.ceil = xCeil;
      $scope.DatePositionYSliderOptions.floor = $scope.PositionY.minValue;
      $scope.DatePositionYSliderOptions.ceil = $scope.dateMax.PositionY;

      var yFloor = $scope.defaultOSDPoint.dateTime.pointY;

      $scope.DateOSD[0].PositionX = $scope.DatePositionXSliderOptions.floor;
      $scope.DateOSD[0].PositionY = yFloor;

      if ($scope.DatePositionXSliderOptions.floor === 1 && $scope.DatePositionXSliderOptions.ceil === 1) {
        $scope.DateOSD[0].PositionX = 1;
        $scope.DatePositionXSliderOptions.disabled = true;
      } else {
        if ($scope.DateOSD.Enable) {
          $scope.DatePositionXSliderOptions.disabled = false;
        }
      }

      if (typeof $scope.DateOSD !== 'undefined') {
        updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', true, $scope.DateOSD[0], queue);
      }
      refreshSliders();
    }

    if(queue.length > 0) {
      SunapiClient.sequence(queue,
        function(){
        }, function(errorData){
            console.log(errorData);
      });
    }
  };

  $scope.OnPreviewSelect = function(selectedIndex, needtoAdd) {
    $scope.data.SelectedTitleIndex = selectedIndex;

    if (typeof $scope.TitleOSD !== 'undefined') {
      for (var i = 0; i < $scope.TitleOSD.length; i++) {
        if ($scope.TitleOSD[i].aIndex !== selectedIndex) {
          $scope.TitleOSD[i].IsOSDSelected = false;
          $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;

          $scope.TitleOSD[i].TitlePositionYSliderOptions.disabled = true;
        } else {
          $scope.TitleOSD[i].IsOSDSelected = true;
          $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = false;

          $scope.TitleOSD[i].TitlePositionYSliderOptions.disabled = false;

          if ($scope.TitleOSD[i].TitlePositionXSliderOptions.floor === 1 && $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil === 1) {
            $scope.TitleOSD[i].PositionX = 1;
            $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;
          } else {
            if ($scope.TitleOSD.Enable) {
              $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = false;
            }
          }

          if (needtoAdd) {
            if (typeof pageData.TitleOSD !== 'undefined' && pageData.TitleOSD.length) {
              for (var j = 0; j < pageData.TitleOSD.length; j++) {
                if (pageData.TitleOSD[j].Index === $scope.TitleOSD[i].Index) {
                  if (!angular.equals(pageData.TitleOSD[j], $scope.TitleOSD[i])) {
                    addMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
                  }
                  break
                }
              }
            } else {
              addMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
            }
          }
        }
      }
      refreshSliders();
    }
  };

  $scope.OnOSDTitleStatusChange = function() {
    if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
      if (!$scope.TitleOSD.Enable) {
        for (var i = 0; i < $scope.TitleOSD.length; i++) {
          $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;

          $scope.TitleOSD[i].TitlePositionYSliderOptions.disabled = true;
        }

        addMultiLineOSD($scope.TitleOSD[0].Index, 'Title', true, $scope.TitleOSD[0]);
      } else {
        $scope.OnPreviewSelect($scope.data.SelectedTitleIndex, true);
        addMultiLineOSD($scope.TitleOSD[0].Index, 'Title', true);
      }
    }
  };

  $scope.OnOSDDateStatusChange = function() {
    //$scope.DatePositionXSliderOptions.disabled = ($scope.DateOSD.length) ? !$scope.DateOSD.Enable : false;
    //$scope.DatePositionYSliderOptions.disabled = ($scope.DateOSD.length) ? !$scope.DateOSD.Enable : false;


    if ($scope.DateOSD.Enable) {
      $scope.DatePositionXSliderOptions.disabled = false;

      $scope.DatePositionYSliderOptions.disabled = false;
    } else {
      $scope.DatePositionXSliderOptions.disabled = true;

      $scope.DatePositionYSliderOptions.disabled = true;
    }

    updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', true);
  };

  $scope.OnOSDBlinkStatusChange = function() {
    updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', false);
  };

  // function getTitleSliderDisableColor() {
  //   return mAttr.sliderDisableColor;
  // }

  // function getTitleSliderEnableColor() {
  //   return mAttr.sliderEnableColor;
  // }

  // function getDateSliderColor() {
  //   if ($scope.DateOSD !== 'undefined') {
  //     if ($scope.DateOSD.Enable) {
  //       return mAttr.sliderEnableColor;
  //     }
  //   }
  //   return mAttr.sliderDisableColor;
  // }

  $scope.addTitleOSD = function() {
    if ($scope.TitleOSD.length < mAttr.MaxOSDTitles) {
      var availableIndex = 0;

      if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
        var usedIndex = [mAttr.MaxOSDTitle];

        for (var j = 0; j < $scope.TitleOSD.length; j++) {
          usedIndex[$scope.TitleOSD[j].Index - 1] = true;
        }

        for (var i = 0; i < mAttr.MaxOSDTitles; i++) {
          if (!usedIndex[i]) {
            availableIndex = i + 1;
            break;
          }
        }
      } else {
        availableIndex = 1;
      }

      var newTitle = {};

      newTitle.aIndex = $scope.TitleOSD.length;
      newTitle.Index = availableIndex;
      newTitle.IsOSDSelected = true;
      newTitle.OSDType = 'Title';
      newTitle.PositionX = $scope.PositionX.minValue;
      newTitle.PositionY = $scope.PositionY.minValue;
      newTitle.OSDFontSize = $scope.OSD.FontSize;
      newTitle.OSDColor = $scope.OSD.Color;
      newTitle.OSDTransparency = $scope.OSD.Transparency;
      newTitle.Enable = $scope.TitleOSD.Enable;

      newTitle.TitlePositionXSliderOptions = {
        floor: $scope.PositionX.minValue,
        ceil: $scope.titleMax.PositionX,
        showSelectionBar: true,
        disabled: true,
        onEnd: OSDTitleChanged,
        showInputBox: true
      };

      newTitle.TitlePositionYSliderOptions = {
        floor: $scope.PositionX.minValue,
        ceil: $scope.titleMax.PositionY,
        showSelectionBar: true,
        disabled: true,
        onEnd: OSDTitleChanged,
        showInputBox: true
      };

      $scope.TitleOSD.push(newTitle);
      $scope.OnPreviewSelect(newTitle.aIndex);

      refreshSliders();
    } else {
      COMMONUtils.ShowError('lang_msg_cannot_add');
    }
  };

  $scope.removeTitleOSD = function(isPreview) {
    if (typeof $scope.TitleOSD !== 'undefined') {
      if ($scope.TitleOSD.length) {
        var indexToRemove = 0;
        var i = 0;
        for (i = 0; i < $scope.TitleOSD.length; i++) {
          if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
            indexToRemove = $scope.TitleOSD[i].Index;
            break;
          }
        }

        removeMultiLineOSD(indexToRemove, isPreview);
        for (i = 0; i < $scope.TitleOSD.length; i++) {
          if (indexToRemove === $scope.TitleOSD[i].Index) {
            $scope.TitleOSD.splice(i, 1);
            break;
          }
        }

        for (i = 0; i < $scope.TitleOSD.length; i++) {
          $scope.TitleOSD[i].aIndex = i;
        }

        if ($scope.TitleOSD.length) {
          $scope.data.SelectedTitleIndex = $scope.TitleOSD[0].aIndex;
          $scope.OnPreviewSelect($scope.data.SelectedTitleIndex);
        }
      }
    }
  };

  function setMultiLineOSD(functionList) {

    //var deferred = $q.defer();
    //var promises = [];
    var promise = null;

    if (typeof $scope.DateOSD !== 'undefined' && typeof pageData.DateOSD !== 'undefined') {
      if (!angular.equals(pageData.DateOSD, $scope.DateOSD) || pageData.DateOSD.Enable !== $scope.DateOSD.Enable) {
        promise = function() {
          return updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', false, $scope.DateOSD[0]);
        };
        //promises.push(promise);
        functionList.push(promise);
      } else {
        if ($scope.DateOSD[0].FontSize !== $scope.OSD.FontSize ||
          $scope.DateOSD[0].OSDColor !== $scope.OSD.Color || $scope.DateOSD[0].Transparency !== $scope.OSD.Transparency) {
          promise = function() {
            return updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', false, $scope.DateOSD[0]);
          };
          //promises.push(promise);
          functionList.push(promise);
        }
      }
    }

    if (typeof $scope.TitleOSD !== 'undefined' && typeof pageData.TitleOSD !== 'undefined') {
      if (pageData.TitleOSD.length) {
        if ($scope.TitleOSD.length && pageData.TitleOSD.Enable !== $scope.TitleOSD.Enable) {
          promise = function() {
            return updateMultiLineOSD($scope.TitleOSD[0].Index, 'Title', false, $scope.TitleOSD[0]);
          };
          //promises.push(promise);
          functionList.push(promise);
        }
      } else {
        if ($scope.TitleOSD.length && pageData.TitleOSD.Enable !== $scope.TitleOSD.Enable) {
          promise = function() {
            return addMultiLineOSD($scope.TitleOSD[0].Index, 'Title', false, $scope.TitleOSD[0]);
          };
          //promises.push(promise);
          functionList.push(promise);
        }
      }

      if (!angular.equals(pageData.TitleOSD, $scope.TitleOSD)) {
        var existedTitleIndex = [mAttr.MaxOSDTitles];
        var deletedTitleIndex = [];
        var i = 0;

        for (i = 0; i < mAttr.MaxOSDTitles; i++) {
          existedTitleIndex[i] = false;
          deletedTitleIndex[i] = false;
        }

        if (typeof pageData.TitleOSD !== 'undefined' && pageData.TitleOSD.length) {
          for (i = 0; i < pageData.TitleOSD.length; i++) {
            existedTitleIndex[pageData.TitleOSD[i].Index - 1] = true;
          }
        }

        $scope.TitleOSD.forEach(function(elem, index) {
          if (!angular.equals(pageData.TitleOSD[index], elem)) {
            if (existedTitleIndex[elem.Index - 1]) {
              promise = function() {
                return updateMultiLineOSD(elem.Index, 'Title', false, elem);
              };
              //promises.push(promise);
              functionList.push(promise);
            } else {
              promise = function() {
                return addMultiLineOSD(elem.Index, 'Title', false, elem);
              };
              //promises.push(promise);
              functionList.push(promise);
            }
          }
        });

        /* If Existed index is not available in page data, then it is deleted */
        for (var orig = 0; orig < existedTitleIndex.length; orig++) {
          if (existedTitleIndex[orig] === false) {
            continue;
          }

          deletedTitleIndex[orig] = true;
          for (var actual = 0; actual < $scope.TitleOSD.length; actual++) {
            if (orig + 1 === $scope.TitleOSD[actual].Index) {
              deletedTitleIndex[orig] = false;
              break;
            }
          }
        }

        deletedTitleIndex.forEach(function(elem, index) {
          if (elem === true) {
            promise = function() {
              return removeMultiLineOSD(index + 1, false);
            };
            //promises.push(promise);
            functionList.push(promise);
          }
        });
      }
    }

    // if(promises.length > 0){
    //     $q.seqAll(promises)
    //         .then(
    //             function(results) {
    //                 deferred.resolve(results)
    //             },
    //             function(errors) {
    //                 deferred.reject(errors);
    //             }
    //     );
    // }
    // return deferred.promise;
  }

  function overlayChangeHandler() {
    setOverlay(true);
  }
  $scope.overlayChangeHandler = overlayChangeHandler;

  function setOverlay(isPreview) {
    var deferred = $q.defer();
    var setData = {},
      ignoredKeys = [],
      changed = false;

    if (isPreview === true) {
      if (angular.equals(previewData.Overlay, $scope.Overlay)) {
        return;
      }
    } else {
      if (angular.equals(pageData.Overlay, $scope.Overlay)) {
        return;
      }
    }

    if (isPreview === true) {
      changed = COMMONUtils.fillSetData(setData, $scope.Overlay, previewData.Overlay,
        ignoredKeys, false);
    } else {
      changed = COMMONUtils.fillSetData(setData, $scope.Overlay, pageData.Overlay,
        ignoredKeys, false);
    }
    if (changed) {
      if (isPreview === true) {
        $scope.previewMode = true;
        extendPreviewMode();
        setData.ImagePreview = 'Start';
      }
      if ($scope.isMultiChannel) {
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
      }
      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=overlay&action=set', setData,
        function(response) {
          if (isPreview === true) {
            COMMONUtils.updatePageData($scope.Overlay, previewData.Overlay, ignoredKeys);
          } else {
            COMMONUtils.updatePageData($scope.Overlay, pageData.Overlay, ignoredKeys);
          }
          deferred.resolve();
        },
        function(errorData) {
          //alert(errorData);
          deferred.reject('Failure');
        }, '', true);
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }



  function removeMultiLineOSD(sIndex, isPreview) {
    var setData = {};

    setData.Channel = 0;

    if (sIndex > 0) {
      setData.Index = sIndex;
    } else {
      setData.Index = "";
      for (var i = 1; i <= mAttr.MaxOSDTitles; i++) {
        setData.Index += i + ',';
      }

      setData.Index = setData.Index.substring(0, setData.Index.length - 1);
    }

    if (isPreview) {
      $scope.previewMode = true;
      extendPreviewMode();
      setData.ImagePreview = 'Start';
    }

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multilineosd&action=remove', setData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function addMultiLineOSD(index, osdType, isPreview, OSDArrayElement) {
    var setData = {};

    setData.Channel = 0;

    setData.Index = index;
    setData.OSDType = osdType;

    if (isPreview) {
      $scope.previewMode = true;
      extendPreviewMode();
      setData.ImagePreview = 'Start';

    }

    if (osdType === 'Title') {
      setData.Enable = $scope.TitleOSD.Enable;

      if (typeof OSDArrayElement !== 'undefined' && (OSDArrayElement.isPreviewed || !isPreview)) {
        if (typeof OSDArrayElement.OSD === 'undefined') {
          setData.OSD = "";
        } else {
          //OSDArrayElement.OSD = COMMONUtils.UTF8ToGB2312(OSDArrayElement.OSD);
          setData.OSD = encodeURIComponent(OSDArrayElement.OSD);
        }

        OSDArrayElement.PositionX ? setData.PositionX = OSDArrayElement.PositionX : setData.PositionX = 1;
        OSDArrayElement.PositionY ? setData.PositionY = OSDArrayElement.PositionY : setData.PositionY = 1;
      }
    }

    if (osdType === 'Date') {
      setData.Enable = $scope.DateOSD.Enable;

      if (typeof OSDArrayElement !== 'undefined') {
        setData.DateFormat = OSDArrayElement.DateFormat;
        setData.PositionX = OSDArrayElement.PositionX;
        setData.PositionY = OSDArrayElement.PositionY;
        setData.WeekDay = OSDArrayElement.WeekDay;
      }
    }

    setData.FontSize = $scope.OSD.FontSize;
    setData.OSDColor = $scope.OSD.Color;
    setData.Transparency = $scope.OSD.Transparency;

    if (typeof $scope.OSDBlinkOptions !== 'undefined') {
      if ($scope.OSD.OSDBlink === true) {
        setData.OSDBlink = 'HDMI';
      } else {
        setData.OSDBlink = 'Off';
      }
    }

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }

    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multilineosd&action=add', setData,
      function(response) {

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }


  function updateMultiLineOSD(index, osdType, isPreview, OSDArrayElement, queue) {
    var setData = {};

    setData.Channel = 0;

    setData.Index = index;
    setData.OSDType = osdType;

    if (isPreview) {
      $scope.previewMode = true;
      extendPreviewMode();
      setData.ImagePreview = 'Start';
    }

    if (osdType === 'Title') {
      setData.Enable = $scope.TitleOSD.Enable;

      if (typeof OSDArrayElement !== 'undefined' && (OSDArrayElement.isPreviewed || !isPreview)) {
        if (typeof OSDArrayElement.OSD === 'undefined') {
          setData.OSD = "";
        } else {
          //OSDArrayElement.OSD = COMMONUtils.UTF8ToGB2312(OSDArrayElement.OSD);
          setData.OSD = encodeURIComponent(OSDArrayElement.OSD);
        }

        if (!setData.OSD || setData.OSD.length === 0) {
          setData.PositionX = 1;
          setData.PositionY = 1;
        } else {
          setData.PositionX = OSDArrayElement.PositionX;
          setData.PositionY = OSDArrayElement.PositionY;
        }
      }

    }

    if (osdType === 'Date') {
      setData.Enable = $scope.DateOSD.Enable;

      if (typeof OSDArrayElement !== 'undefined') {
        setData.DateFormat = OSDArrayElement.DateFormat;
        setData.PositionX = OSDArrayElement.PositionX;
        setData.PositionY = OSDArrayElement.PositionY;
        setData.WeekDay = OSDArrayElement.WeekDay;
      }
    }

    setData.FontSize = $scope.OSD.FontSize;
    setData.OSDColor = $scope.OSD.Color;
    setData.Transparency = $scope.OSD.Transparency;

    if (typeof $scope.OSDBlinkOptions !== 'undefined') {
      if ($scope.OSD.OSDBlink === true) {
        setData.OSDBlink = 'HDMI';
      } else {
        setData.OSDBlink = 'Off';
      }
    }

    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      setData.Channel = currentChannel;
    }

    if(typeof queue !== 'undefined') {
        queue.push({
            url: '/stw-cgi/image.cgi?msubmenu=multilineosd&action=update', 
            reqData: setData,
        });
    } else {
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multilineosd&action=update', setData,
        function(response) {

        },
        function(errorData) {
          //alert(errorData);
        }, '', true);
    }
  }


  function updateOSDArray(oldArr, newArr, type) {
    var i = 0;
    var newArrIdxMap = {};

    for (i = 0; i < newArr.length; i++) {
      if (type === newArr[i].OSDType) {
        newArrIdxMap[newArr[i].Index] = newArr[i];
      }
    }

    // update/remove obj
    var oldObj = null, newObj = null;
    var k = 0;
    for (i = 0; i < oldArr.length; i++) {
      newObj = newArrIdxMap[oldArr[i].Index];
      oldObj = oldArr[i];
      if (newObj) {
        for (k in newObj) {
          oldObj[k] = newObj[k];
        }
        delete newArrIdxMap[oldArr[i].Index];
      } else {
        oldArr.splice(i, 1);
        i--;
      }
    }

    // insert obj
    for (i in newArrIdxMap) {
      oldArr.push(newArrIdxMap[i]);
    }
  }

  function getMultiLineOSD() {
    $scope.gettingMultiLineOSD = true;
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multilineosd&action=view', getData,
      function(response) {
        $scope.OSD = {};

        $scope.TitleOSD = $scope.TitleOSD || [];
        $scope.DateOSD = $scope.DateOSD || [];

        // when assign new array to $scope.TitleOSD, $scope.DateOSD
        // then rzslider range issue invoke.
        // so, update array.
        updateOSDArray($scope.TitleOSD, response.data.MultiLineOSD[0].OSDs, 'Title');
        updateOSDArray($scope.DateOSD, response.data.MultiLineOSD[0].OSDs, 'Date');

        $scope.TitleOSD.CheckAllTitleOSD = false;
        $scope.TitleOSD.Enable = $scope.TitleOSD.length ? $scope.TitleOSD[0].Enable : false;
        $scope.DateOSD.Enable = $scope.DateOSD.length ? $scope.DateOSD[0].Enable : false;

        $scope.OSD.FontSize = $scope.DateOSD[0].FontSize;
        $scope.OSD.Color = $scope.DateOSD[0].OSDColor;
        $scope.OSD.Transparency = $scope.DateOSD[0].Transparency;
        $scope.titleMax = getOSDRanges('Title', $scope.OSD.FontSize);
        $scope.dateMax = getOSDRanges('Date', $scope.OSD.FontSize);
        var xCeil = 1;

        if (typeof $scope.OSDBlinkOptions !== 'undefined') {
          if ($scope.DateOSD[0].OSDBlink === 'HDMI') {
            $scope.OSD.OSDBlink = true;
          } else {
            $scope.OSD.OSDBlink = false;
          }
        }
        if ($scope.TitleOSD.length) {
          if (typeof $scope.data.SelectedTitleIndex === 'undefined') {
            $scope.data.SelectedTitleIndex = 0;
          }

          for (var i = 0; i < $scope.TitleOSD.length; i++) {
            $scope.TitleOSD[i].isPreviewed = true;
            $scope.TitleOSD[i].aIndex = i;

            if ($scope.TitleOSD.Enable && $scope.data.SelectedTitleIndex === i) {
              $scope.TitleOSD[i].IsOSDSelected = true;
            } else {
              $scope.TitleOSD[i].IsOSDSelected = false;
            }

            xCeil = $scope.titleMax.PositionX;

            if (typeof mAttr.NormalizedOSDRange === 'undefined' || !mAttr.NormalizedOSDRange) {
              if ($scope.TitleOSD[i].OSD.length) {
                xCeil -= ($scope.TitleOSD[i].OSD.length - 1);
              }

              if (xCeil < $scope.PositionX.minValue) {
                xCeil = $scope.PositionX.minValue;
              }
            }

            $scope.TitleOSD[i].TitlePositionXSliderOptions = {
              floor: $scope.PositionX.minValue,
              ceil: xCeil,
              showSelectionBar: true,
              disabled: $scope.TitleOSD[i].IsOSDSelected ? false : true,
              onEnd: OSDTitleChanged,
              showInputBox: true
            };

            $scope.TitleOSD[i].TitlePositionYSliderOptions = {
              floor: $scope.PositionY.minValue,
              ceil: $scope.titleMax.PositionY,
              showSelectionBar: true,
              disabled: $scope.TitleOSD[i].IsOSDSelected ? false : true,
              onEnd: OSDTitleChanged,
              showInputBox: true
            };

            if ($scope.TitleOSD[i].PositionX > $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil) {
              $scope.TitleOSD[i].PositionX = $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil;
            }

            if ($scope.TitleOSD[i].IsOSDSelected) {
              if ($scope.TitleOSD[i].TitlePositionXSliderOptions.floor === 1 && $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil === 1) {
                $scope.TitleOSD[i].PositionX = 1;
                $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;
              } else {
                if ($scope.TitleOSD.Enable) {
                  $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = false;
                }
              }
            }

          }
        }

        xCeil = 1;

        if ($scope.DateOSD[0].WeekDay) {
          xCeil = $scope.dateMax.PositionX - $scope.OffsetToReduceOnWeekDay;
        } else {
          xCeil = $scope.dateMax.PositionX;
        }

        if (xCeil < $scope.PositionX.minValue) {
          xCeil = $scope.PositionX.minValue;
        }

        $scope.DatePositionXSliderOptions = {
          floor: $scope.PositionX.minValue,
          ceil: xCeil,
          showSelectionBar: true,
          disabled: ($scope.DateOSD.length) ? !$scope.DateOSD[0].Enable : false,
          onEnd: OSDDateChanged,
          showInputBox: true
        };

        $scope.DatePositionYSliderOptions = {
          floor: $scope.PositionY.minValue,
          ceil: $scope.dateMax.PositionY,
          showSelectionBar: true,
          disabled: ($scope.DateOSD.length) ? !$scope.DateOSD[0].Enable : false,
          onEnd: OSDDateChanged,
          showInputBox: true
        };

        if ($scope.DateOSD[0].PositionX > $scope.DatePositionXSliderOptions.ceil) {
          $scope.DateOSD[0].PositionX = $scope.DatePositionXSliderOptions.ceil;
        }

        if ($scope.DatePositionXSliderOptions.floor === 1 && $scope.DatePositionXSliderOptions.ceil === 1) {
          $scope.DateOSD[0].PositionX = 1;
          $scope.DatePositionXSliderOptions.disabled = true;
        } else {
          if ($scope.DateOSD.Enable) {
            $scope.DatePositionXSliderOptions.disabled = false;
          }
        }

        refreshSliders();

        pageData.TitleOSD = angular.copy($scope.TitleOSD);
        pageData.TitleOSD.Enable = angular.copy($scope.TitleOSD.Enable);
        pageData.DateOSD = angular.copy($scope.DateOSD);
        pageData.DateOSD.Enable = angular.copy($scope.DateOSD.Enable);
        pageData.OSDFontSize = angular.copy($scope.OSD.FontSize);
        pageData.OSDColor = angular.copy($scope.OSD.Color);
        pageData.OSDTransparency = angular.copy($scope.OSD.Transparency);
        $scope.gettingMultiLineOSD = false;
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function getOverlay() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=overlay&action=view', getData,
      function(response) {
        $scope.Overlay = {};
        if (response && response.data && response.data.Overlay) {
          $scope.Overlay = angular.copy(response.data.Overlay[$scope.ch]);
        }
        pageData.Overlay = angular.copy($scope.Overlay);
        previewData.Overlay = angular.copy($scope.Overlay);

      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function titleOSDCheckAllowedChars() {
    var currentCharCount = 0,
      retVal = true,
      osdRange = {},
      i = 0;

    if (typeof $scope.ImageOptions === 'undefined') {
      return retVal;
    }

    //Assumed all font size uses same size
    osdRange = getOSDRanges('Title', 'Small');

    if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
      for (i = 0; i < $scope.TitleOSD.length; i++) {
        if (typeof $scope.TitleOSD[i].OSD !== 'undefined') {
          currentCharCount += $scope.TitleOSD[i].OSD.length;
        }
      }
    }

    if (currentCharCount > osdRange.MaxCharacterLimit) {
      COMMONUtils.ShowError('OSD Title maximum allowed characters count reached, Please reduce few characters ', 'md');
      retVal = false;
    }
    if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
      for (i = 0; i < $scope.TitleOSD.length; i++) {
        if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
          if (typeof $scope.TitleOSD[i].OSD !== 'undefined' && $scope.TitleOSD[i].OSD.length > 0) {
            if ($scope.CurrentLanguage === "Chinese") {
              //var hangul = new RegExp("[\u1100-\u11FF|\u3130-\u318F|\uA960-\uA97F|\uAC00-\uD7AF|\uD7B0-\uD7FF]");
              var china = new RegExp("[^a-zA-Z0-9-.\u4E00-\u9FFF\u2FF0-\u2FFF\u31C0-\u31EF\u3200-\u9FBF\uF900-\uFAFF]");
              if (china.exec($scope.TitleOSD[i].OSD) !== null) {
                COMMONUtils.ShowError("仅英文及中文和特殊字符 -.支持");
                // alert("只有英国语文及中国语言支持");
                $scope.TitleOSD[i].OSD = "";
                retVal = false;
              }
            } else if ($scope.CurrentLanguage === "Korean") {
              var hangul = new RegExp("[^a-zA-Z0-9-.가-힣\x20]");

              if (hangul.exec($scope.TitleOSD[i].OSD) !== null) {
                COMMONUtils.ShowError("한글이 아닙니다. (자음, 모음만 있는 한글은 처리하지 않습니다.)");
                // alert("한글이 아닙니다. (자음, 모음만 있는 한글은 처리하지 않습니다.)");
                $scope.TitleOSD[i].OSD = "";
                retVal = false;
              }
            }
          }
        }
      }
    }

    return retVal;
  }


  $scope.previewTitleOSD = function() {
    if (titleOSDCheckAllowedChars() === false) {
      return;
    }

    if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
      for (var i = 0; i < $scope.TitleOSD.length; i++) {
        if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
          $scope.TitleOSD[i].isPreviewed = true;
          addMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
          pageData.recentUpdate = "Title";
          break;
        }
      }
    }
  };

  function OSDTitleChanged(sliderId, modelValue, highValue) {

    if (typeof $scope.TitleOSD !== 'undefined' && $scope.TitleOSD.length) {
      for (var i = 0; i < $scope.TitleOSD.length; i++) {
        if ($scope.TitleOSD[i].aIndex === $scope.data.SelectedTitleIndex) {
          // $scope.TitleOSD[i].isPreviewed = false;

          if (typeof $scope.titleMax !== 'undefined') {
            if (typeof mAttr.NormalizedOSDRange === 'undefined' || !mAttr.NormalizedOSDRange) {
              if (typeof $scope.TitleOSD[i].OSD !== 'undefined' && $scope.TitleOSD[i].OSD.length) {
                $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.titleMax.PositionX - ($scope.TitleOSD[i].OSD.length - 1);
              } else {
                $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.titleMax.PositionX;
              }

              if ($scope.TitleOSD[i].TitlePositionXSliderOptions.ceil < $scope.PositionX.minValue) {
                $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil = $scope.PositionX.minValue;
              }


              if ($scope.TitleOSD[i].PositionX > $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil) {
                $scope.TitleOSD[i].PositionX = $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil;
              }
            }

            if ($scope.TitleOSD[i].TitlePositionXSliderOptions.floor === 1 && $scope.TitleOSD[i].TitlePositionXSliderOptions.ceil === 1) {
              $scope.TitleOSD[i].PositionX = 1;
              $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = true;
            } else {
              if ($scope.TitleOSD.Enable) {
                $scope.TitleOSD[i].TitlePositionXSliderOptions.disabled = false;
              }
            }

          }

          refreshSliders();
          //addMultiLineOSD($scope.TitleOSD[i].Index, 'Title', true, $scope.TitleOSD[i]);
          //pageData.recentUpdate = "Title";
          break;
        }
      }
    }
  }
  $scope.OSDTitleChanged = OSDTitleChanged;

  function OSDDateChanged(sliderId, modelValue, highValue) {
    if (typeof $scope.DateOSD !== 'undefined' && typeof pageData.DateOSD !== 'undefined') {
      if (typeof $scope.dateMax !== 'undefined') {
        var xCeil = 1;

        if ($scope.DateOSD[0].WeekDay) {
          xCeil = $scope.dateMax.PositionX - $scope.OffsetToReduceOnWeekDay;
        } else {
          xCeil = $scope.dateMax.PositionX;
        }

        if (xCeil < $scope.PositionX.minValue) {
          xCeil = $scope.PositionX.minValue;
        }

        /** Date Sliders  X & Y */
        $scope.DatePositionXSliderOptions.floor = $scope.PositionX.minValue;
        $scope.DatePositionXSliderOptions.ceil = xCeil;

        if ($scope.DateOSD[0].PositionX > $scope.DatePositionXSliderOptions.ceil) {
          $scope.DateOSD[0].PositionX = $scope.DatePositionXSliderOptions.ceil;
        }

        if ($scope.DatePositionXSliderOptions.floor === 1 && $scope.DatePositionXSliderOptions.ceil === 1) {
          $scope.DateOSD[0].PositionX = 1;
          $scope.DatePositionXSliderOptions.disabled = true;
        } else {
          if ($scope.DateOSD.Enable) {
            $scope.DatePositionXSliderOptions.disabled = false;
          }
        }

        refreshSliders();

        var imagePreview = true;
        if($scope.isMultiChannel) {
          if($scope.gettingMultiLineOSD) {
            imagePreview = false;
            // if(!$scope.loading) {
            //     $scope.gettingMultiLineOSD = false;
            // }
          }
        }
        updateMultiLineOSD($scope.DateOSD[0].Index, 'Date', imagePreview, $scope.DateOSD[0]);
        pageData.recentUpdate = "Date";
      }
    }
  }


  $scope.OSDDateChanged = OSDDateChanged;

  $scope.RemoveImage = function() {
    COMMONUtils.ShowConfirmation(removeoverlayimage, 'lang_do_you_wanlang_image_remove');
  };

  function removeoverlayimage() {
    if ($scope.IsImageInstalled === true) {
      var setData = {};
      setData.Channel = 0;
      setData.Index = 1;

      $scope.ImageFile = "";
      $scope.ImageFileFull = {};
      //reset the file name after remove
      if (document.getElementById('ImageField')) { 
        document.getElementById('ImageField').value = null;
      }

      SunapiClient.get('/stw-cgi/image.cgi?msubmenu=multiimageosd&action=remove', setData,
        function(response) {
          multiimageoverlayView();
        },
        function(errorData) {
          //alert(errorData);
        }, '', true);
    }
    return true;
  }

  function viewNoDependency(promises) {
    /** If there is not dependency between paramters that make calls at the same time  */

    if (typeof mAttr.SSDRLevel !== 'undefined') {
      promises.push(viewSSDR);
    }

    if (typeof mAttr.WhiteBalanceModeOptions !== 'undefined') {
      promises.push(whitebalanceView);
    }

    if (typeof mAttr.Brightness !== 'undefined') {
      promises.push(imageenhancementsView);
    }

    if (typeof mAttr.MultiImageIndex !== 'undefined') {
      promises.push(multiimageoverlayView);
    }

    if (typeof mAttr.RotateOptions !== 'undefined') {
      promises.push(flipView);
    }

    if (mAttr.IRLedSupport === true) {
      promises.push(irLEDView);
    }

    if (mAttr.MaxOSDTitles) {
      promises.push(getMultiLineOSD);
    }

    if (mAttr.PTZPositionEnable ||
      mAttr.PresetNameEnable ||
      mAttr.CameraIDEnable ||
      mAttr.AzimuthEnable) {
      promises.push(getOverlay);
    }

    if (typeof mAttr.FocusModeOptions !== 'undefined' && (mAttr.PTZModel === true || mAttr.ZoomOnlyModel === true)) {
      promises.push(focusView);
    }

    if (mAttr.PTZModel === true || mAttr.ZoomOnlyModel === true) {
      promises.push(ptzsettingsView);
    }

    if (mAttr.PTZModel === true) {
      promises.push(ptzPresetsView);
      promises.push(presetImageConfigView);
    }
  }

  var showLoadingBar = function(_val) {
    $scope.loading = _val;
    $rootScope.$emit('changeLoadingBar', _val);
  };

  function view() {
    var promises = [];
    $scope.channelChanged = false;
    if ($scope.pageLoaded === true && $scope.isLoading === false) { 
      showLoadingBar(true);
    }

    showVideo();

    /** Image preset is shown first, so call it first  */
    if (typeof $scope.ImagePresetModeOptions !== 'undefined') {
      promises.push(viewImagePreset);
    }

    /** Sensor mode menu is shown here only for Box Models
     * -> require Sensor data ::: $scope.VideoSources.SensorCaptureFrameRate
     * */
    //if (mAttr.PTZModel !== true) {
    promises.push(videoSourceView);
    //}

    if (typeof mAttr.CompensationModeOptions !== 'undefined') {
      promises.push(cameraView);
    }

    if ($scope.HeaterSupport && $scope.PTZModel !== true) {
      promises.push(heaterScheduleView);
    }

    if (typeof mAttr.ExternalPTZModel !== 'undefined') {
      if (mAttr.ExternalPTZModel === true) {
        $scope.isBoxModel = true; // Box
      } else {
        $scope.isBoxModel = false; // NO Box
      }
    }

    $q.seqAll(promises).then(
      function() {
        var dependencyPromises = [];
        viewNoDependency(dependencyPromises);
        $q.seqAll(dependencyPromises).then(
          function() {
            if ($scope.presetTypeData.SelectedPresetType == 0) {
              handlePresetChange();
            }
            excView();
          },
          excView
        );

        function excView() {
          initShutterSpeeds(false);
          $scope.pageLoaded = true;
          if (mAttr.PTZModel === true) {
            if ($scope.tabActiveData.backLight) {
              if ($scope.Camera.CompensationMode === 'BLC') {
                $scope.ptzinfo = {
                  type: 'BLC',
                  disable: false
                };
              } else if ($scope.Camera.CompensationMode === 'HLC') {
                $scope.ptzinfo = {
                  type: 'HLC',
                  disable: false
                };
              } else {
                $scope.ptzinfo = {
                  type: 'BLC',
                  disable: true
                };
              }
            } else if ($scope.tabActiveData.osd) {
              $scope.ptzinfo = {
                type: 'OSD'
              };
            }
          }
          $timeout(function() {
            if ($scope.presetTypeData.SelectedPresetType == 0) {
              //livePreviewMode('Start');
            } else {
              gotoPreset('Start', $scope.presetTypeData.SelectedPreset);
            }
            showLoadingBar(false);
            // for multi channel selection, copy final page data to detect changes 
            if ($scope.isMultiChannel) {
              pageData.ImagePreset = angular.copy($scope.ImagePreset);
              pageData.Camera = angular.copy($scope.Camera);
            }
          }, 500);
          refreshSliders();
          $("#camerasetuppage").show();
        }
      },
      function(errorData) {
        //alert(errorData);
        showLoadingBar(false);
      }
    );
  }

  function showVideo() {
    var getData = {};
    if ($scope.isMultiChannel) {
      var currentChannel = UniversialManagerService.getChannelId();
      getData.Channel = currentChannel;
    }
    SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
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
          channelId: UniversialManagerService.getChannelId()
        };

        $scope.ptzinfo = {
          type: 'none'
        };
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  $scope.imagePresetScheduleTableWidthChange = function() {
    var ul = $('#imagePresetScheduleTable');
    if (ul.length > 0) {
      var li_width = ul.width() / 24;
      $('.scheduleTime').css('width', li_width);
      $('.scheduleTime:eq(0)').css('width', li_width - 1);
      $('.scheduleTime:eq(23)').css('width', li_width - 1);
      $('.scheduleColorList.realWidthChild').css('width', li_width);
      $('.scheduleColorList.realWidthChild:eq(0)').css('width', li_width - 1);
      $('.scheduleColorList.realWidthChild:eq(23)').css('width', li_width - 1);
    }
  };
  $scope.imagePresetScheduleTableWidth = function(index, mode) {
    var ul = $('#imagePresetScheduleTable');
    var li_width = 0;
    if (ul.length > 0) {
      if (mode === 'time') {
        li_width = ul.width() / 24;
        if (index === 0)
          { 
li_width -= 1; }        else if (index === 23)
          { 
li_width -= 1; 
}
        return li_width + 'px';
      } else {
        if (index % 60 === 0) {
          li_width = ul.width() / 24;
          if (index === 0)
            { 
li_width -= 1; }          else if (index === 1380)            { li_width -= 1;
 }
          return li_width + 'px';
        } else {
          return '0px';
        }
      }
    } else {
      return '0px';
    }
  };
  $scope.imagePresetScheduleTableClass = function(n, index) {
    var classNames = $scope.ScheduleColor[n] + ' scheduleColorList';
    if (index === 0)      {
      classNames += ' firstChild';
}    else if (index === 1380)      {
      classNames += ' lastChild';
 }
    if (index % 60 === 0)      { 
      classNames += ' realWidthChild';
    }

    return classNames;
  };

  $scope.mediumToMiddle = function(option) {
    if (option === 'Medium') {
      return 'Middle';
    }
    return option;
  };

  $scope.mediumToMediumOrig = function(option) {
    if (option === 'Medium') {
      return 'MediumOrig';
    }
    return option;
  };

  function detectOSDChanges() {
    var isChanged = false;
    var osd = null;
    var pageOsd = null;

    if (!angular.equals(pageData.TitleOSD.Enable, $scope.TitleOSD.Enable)) {
      isChanged = true;
    } else {
      if ($scope.TitleOSD.length === pageData.TitleOSD.length) {
        for (var i = 0; i < $scope.TitleOSD.length; i++) {
          if (typeof $scope.TitleOSD[i] === 'object' && typeof pageData.TitleOSD[i] === 'object') {
            osd = $scope.TitleOSD[i];
            pageOsd = pageData.TitleOSD[i];
            if (!angular.equals(osd.Enable, pageOsd.Enable) ||
              !angular.equals(osd.FontSize, pageOsd.FontSize) ||
              !angular.equals(osd.Transparency, pageOsd.Transparency) ||
              !angular.equals(osd.OSDColor, pageOsd.OSDColor) ||
              !angular.equals(osd.PositionX, pageOsd.PositionX) ||
              !angular.equals(osd.PositionY, pageOsd.PositionY) ||
              !angular.equals(osd.OSD, pageOsd.OSD)) {
              isChanged = true;
            }
          } else {
            break;
          }
        }
      } else {
        isChanged = true;
      }
    }

    if (!angular.equals(pageData.DateOSD.Enable, $scope.DateOSD.Enable)) {
      isChanged = true;
    } else {
      if (typeof $scope.DateOSD[0] === 'object' && typeof pageData.DateOSD[0] === 'object') {
        osd = $scope.DateOSD[0];
        pageOsd = pageData.DateOSD[0];
        if (!angular.equals(osd.Enable, pageOsd.Enable) ||
          !angular.equals(osd.DateFormat, pageOsd.DateFormat) ||
          !angular.equals(osd.Transparency, pageOsd.Transparency) ||
          !angular.equals(osd.OSDColor, pageOsd.OSDColor) ||
          !angular.equals(osd.PositionX, pageOsd.PositionX) ||
          !angular.equals(osd.PositionY, pageOsd.PositionY) ||
          !angular.equals(osd.WeekDay, pageOsd.WeekDay) ||
          !angular.equals(osd.FontSize, pageOsd.FontSize)) {
          isChanged = true;
        }
      }
    }

    return isChanged;
  }

  $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
    $scope.channelChanged = true;
    if ((typeof $scope.ImagePresetModeOptions !== 'undefined' && !angular.equals(pageData.ImagePreset, $scope.ImagePreset)) ||
      !angular.equals(pageData.VideoSources, $scope.VideoSources) ||
      (typeof mAttr.CompensationModeOptions !== 'undefined' && !angular.equals(pageData.Camera, $scope.Camera)) ||
      ($scope.HeaterSupport && $scope.PTZModel !== true && !angular.equals(pageData.HeaterSchedules, $scope.HeaterSchedules)) ||
      !angular.equals(pageData.SSDR, $scope.SSDR) ||
      !angular.equals(pageData.WhiteBalance, $scope.WhiteBalance) ||
      !angular.equals(pageData.ImageEnhancements, $scope.ImageEnhancements) ||
      !angular.equals(pageData.Flip, $scope.Flip)
      // || !angular.equals(pageData.IRled, $scope.IRled)
      ||
      detectOSDChanges()) {
      COMMONUtils.
        confirmChangeingChannel().then(function() {
            if (validatePage()) {
              $scope.targetChannel = data;
              saveSettings().then(function() {
                $rootScope.$emit("channelSelector:changeChannel", data);
              });
            }
          },
          function() {});
    } else {
      $scope.pageLoaded = false;
      showLoadingBar(true);
      $scope.targetChannel = data;
      $rootScope.$emit("channelSelector:changeChannel", data);
      var promise = getAttributes();
      promise.then(function() {
        view();
      });
    }
  }, $scope);


  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {

      var promise = getAttributes();
      promise.then(function() {
        view();
      });
    }
  })();

  function cancel() {
    livePreviewMode('Stop');
    view();

    extendPreviewMode();
    $scope.previewMode = true;
  }

  $scope.submit = set;
  $scope.view = view;
  $scope.cancel = cancel;
});