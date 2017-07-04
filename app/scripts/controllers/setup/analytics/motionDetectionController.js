/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller(
  'motionDetectionCtrl',
  function (
    $q,
    $scope,
    $rootScope,
    $translate,
    $uibModal,
    $timeout,
    ConnectionSettingService,
    SessionOfUserManager,
    kindStreamInterface,
    UniversialManagerService,
    sketchbookService,
    eventRuleService,
    SunapiClient,
    XMLParser,
    Attributes,
    COMMONUtils,
    CameraSpec,
    AccountService) {
    "use strict";

    var mAttr = Attributes.get();
    $scope.SelectedChannel = 0;
    COMMONUtils.getResponsiveObjects($scope);
    var pageData = {};
    pageData.MotionDetection = {};
    pageData.rois = [];
    pageData.MotionDetectionEnable = {};

    var defaultSensitivity = 80;
    var defaultThreshold = 5;

    $scope.checkAutoSubmit = false;

    ////////////////////////////////////////////////////////////////
    pageData.VA = [];

    $scope.VA = [];
    $scope.presetTypeData = {};
    $scope.presetTypeData.PresetIndex = 0;
    $scope.presetTypeData.SelectedPreset = 0;
    $scope.presetTypeData.SelectedPresetType = 0;
    $scope.SelectedSizeType = 0;
    $scope.activeTab = "Sensitivity";
    $scope.analyticsType = "Passing";

    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.IPv6PatternStr = mAttr.IPv6PatternStr;
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.FriendlyNameCharSetExpandedStr2 = mAttr.FriendlyNameCharSetExpandedStr2;
    $scope.PasswordCharSet = mAttr.PasswordCharSet;

    $scope.Handover = [{
      "HandoverList": []
    }];

    $scope.data = {
      'HandoverAreaIndex': 0
    };

    $scope.handoverStatus = {
      enDisable: 'Disable',
      set: true,
    };

    $scope.VideoAnalysis2Support = false;
    $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis';
    $scope.presetCmd = '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2';

    $scope.EventSource = 'MotionDetection';
    $scope.EventRule = {};

    $scope.presetData = {
      type: null,
      oldType: null,
      preset: null,
      oldPreset: null
    };

    $rootScope.$saveOn('channelSelector:selectChannel', function (event, index) {
      stopMonitoringMotionLevel();
      if (validatePage()) {
        COMMONUtils.
        confirmChangeingChannel().
        then(
          function () {
            $rootScope.$emit('changeLoadingBar', true);
            saveSettings().
            then(function () {
              changeChannel(index);
            });
          },
          function () {
            console.log("canceled");
          }
        );
      } else {
        $rootScope.$emit('changeLoadingBar', true);
        changeChannel(index);
      }
    }, $scope);

    function changeChannel(index) {
      $rootScope.$emit("channelSelector:changeChannel", index);
      UniversialManagerService.setChannelId(index);
      view();
    }

    function getCommonCmd() {
      if (typeof $scope.VideoAnalysis2Support !== "undefined" && $scope.VideoAnalysis2Support === true) {
        $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis2'
      } else {
        $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis'
      }
    }
    ////////////////////////////////////////////////////////////////

    //Sunapi에서 받은 Coordinates(ROIs) 값을 백업한다.
    var backupCoordinates = [
      [],
      []
    ];

    $scope.MotionDetection = {};

    $scope.tabs = [];
    $scope.activeTab = {};

    function resetTabData() {
      $scope.tabs = [
        {
          title: 'Include',
          active: true,
          name: 'IncludeArea'
        },
        {
          title: 'Exclude',
          active: false,
          name: 'ExcludeArea'
        }
      ];
      $scope.activeTab = $scope.tabs[0];
    }

    resetTabData();

    $scope.selectAllCheckbox = {
      include: true,
      exclude: true
    };

    $scope.resetSelectAllCheckbox = function () {
      $scope.selectAllCheckbox = {
        include: true,
        exclude: true
      };
    };

    $scope.checkCurrentEnableState = function () {
      var val = true;
      var idx = 0;
      if ($scope.activeTab.title === 'Include') {
        for (idx = 0; idx < $scope.selectInclude.length; idx++) {
          if (typeof $scope.selectInclude[idx].Mode !== "undefined") {
            if ($scope.selectInclude[idx].isEnable === false) {
              val = false;
              break;
            }
          }
        }

        $scope.selectAllCheckbox.include = val;
      } else if ($scope.activeTab.title === 'Exclude') {
        for (idx = 0; idx < $scope.selectExclude.length; idx++) {
          if (typeof $scope.selectExclude[idx].Mode !== "undefined") {
            if ($scope.selectExclude[idx].isEnable === false) {
              val = false;
              break;
            }
          }
        }

        $scope.selectAllCheckbox.exclude = val;
      }
    };

    $scope.selectInclude = [{
      "ROI": 1
    }, {
      "ROI": 2
    }, {
      "ROI": 3
    }, {
      "ROI": 4
    }, {
      "ROI": 5
    }, {
      "ROI": 6
    }, {
      "ROI": 7
    }, {
      "ROI": 8
    }];
    $scope.selectExclude = [{
      "ROI": 9
    }, {
      "ROI": 10
    }, {
      "ROI": 11
    }, {
      "ROI": 12
    }, {
      "ROI": 13
    }, {
      "ROI": 14
    }, {
      "ROI": 15
    }, {
      "ROI": 16
    }];

    $scope.isSelectedIncludeIndex = "0"; // "0" means no selected
    $scope.isSelectedExcludeIndex = "0"; // "0" means no selected

    // $scope.$watch('isSelectedIncludeIndex', function (newVal, oldVal) {
    //     $timeout(function(){
    //         $scope.$broadcast('liveChartDataClearAll');
    //         mLastSequenceLevel = 0;
    //     });
    //     if($scope.isSelectedIncludeIndex === undefined || parseInt($scope.isSelectedIncludeIndex) === 0){
    //         //$scope.SensitivitySliderOptions.data = 0;
    //     } else {
    //         $scope.SensitivitySliderModel.data = $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex)-1].Sensitivity;
    //         $scope.MDv2ChartOptions.ThresholdLevel = $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex)-1].Threshold;
    //         activeShape(newVal - 1);
    //     }
    // });

    function setSliderDisabled() {
      if (
        $scope.MotionDetection.MotionDetectionEnable === false ||
        typeof $scope.isSelectedIncludeIndex === "undefined" ||
        parseInt($scope.isSelectedIncludeIndex) === 0
      ) {
        $scope.MDv2ChartOptions.disabled = true;
        $scope.SensitivitySliderProperty.disabled = true;
      } else {
        $scope.MDv2ChartOptions.disabled = false;
        $scope.SensitivitySliderProperty.disabled = false;
      }
    }

    $scope.changeSelectedIncludeIndex = function (newVal) {
      $scope.isSelectedIncludeIndex = newVal;

      $timeout(function () {
        setSliderDisabled();
        $scope.$broadcast('liveChartDataClearAll');
      });

      if (typeof $scope.isSelectedIncludeIndex === "undefined" || parseInt($scope.isSelectedIncludeIndex) === 0) {
        //$scope.SensitivitySliderOptions.data = 0;
      } else {
        if (typeof $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex) - 1].SensitivityLevel !== "undefined") {
          $scope.SensitivitySliderModel.data = 
            $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex) - 1].SensitivityLevel;
        }
        if (typeof $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex) - 1].ThresholdLevel !== "undefined") {
          $scope.MDv2ChartOptions.ThresholdLevel = 
            $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex) - 1].ThresholdLevel;
        }
        activeShape(newVal - 1);
      }
    };

    $scope.changeSelectedExcludeIndex = function (newVal) {
      $scope.isSelectedExcludeIndex = newVal;
      activeShape(newVal - 1);
    };

    // $scope.$watch('isSelectedExcludeIndex', function (newVal, oldVal) {
    //     activeShape(newVal - 1);
    // });

    $scope.$watch('SensitivitySliderModel.data', function (newVal, oldVal) {
      if (typeof $scope.isSelectedIncludeIndex !== "undefined" && parseInt($scope.isSelectedIncludeIndex) !== 0) {
        $scope.selectInclude[$scope.isSelectedIncludeIndex - 1].SensitivityLevel = 
          $scope.SensitivitySliderModel.data;
      }
    });

    function activeShape(index) {
      sketchbookService.activeShape(index);
      sketchbookService.moveTopLayer(index);
    }

    $scope.$watch('MDv2ChartOptions.ThresholdLevel', function (newVal, oldVal) {
      if (typeof $scope.isSelectedIncludeIndex !== "undefined" && parseInt($scope.isSelectedIncludeIndex) !== 0) {
        $scope.selectInclude[$scope.isSelectedIncludeIndex - 1].ThresholdLevel = 
          $scope.MDv2ChartOptions.ThresholdLevel;
      }
    });

    $scope.MDv2ChartData = 0;
    $scope.MDv2ChartOptions = {
      showInputBox: true, // true = show / false = unshow
      ThresholdLevel: 5, // thresholdLevel value
      floor: 1, // min value of Y axis
      ceil: 100, // max value of Y axis
      width: 400, // width of chart
      height: 150, // height of chart
      disabled: false,
      onEnd: function () {}
    };

    function setSizeChart() {
      var chart = "#md-line-chart";
      var width = $(chart).parent().width();
      var maxWidth = 480;
      if (width > maxWidth) {
        width = maxWidth;
      }

      var widthCalc = {
        first: 80,
        second: 27,
        third: 140
      };
      width -= widthCalc.first;
      $scope.MDv2ChartOptions.width = width;

      $(chart + " .graph").css("width", width + "px");
      $(chart + " .graph-border").css("width", (width - widthCalc.second) + "px");
      $(chart + ".level-threshold-slider").css("width", (width + widthCalc.third) + "px");
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function () {
      window.removeEventListener('resize', setSizeChart);
    });

    $scope.SensitivitySliderProperty = {
      floor: 1,
      ceil: 100,
      showSelectionBar: true,
      vertical: false,
      showInputBox: true,
      disabled: false,
      onEnd: function () {}
    };
    $scope.SensitivitySliderModel = {
      data: 80
    };

    $scope.selectTableColumn = function (tableIndex, $event) {
      if (typeof $event !== "undefined") {
        if ($event.target.nodeName === 'BUTTON') {
          $scope['changeSelected' + $scope.activeTab.title + 'Index'](tableIndex);
          // toggleCheckbox(tableIndex);
          // $scope.checkCurrentEnableState();
          return;
        }
      }

      if (isVacant(tableIndex)) {
        return;
      }

      if ($scope.activeTab.title === 'Include') {
        if ($scope.isSelectedIncludeIndex === tableIndex) {
          $scope.changeSelectedIncludeIndex("0");
          return;
        }
        $scope.changeSelectedIncludeIndex(tableIndex); // -> $scope.$watch('isSelectedIndex', function (newVal, oldVal) {
      } else if ($scope.activeTab.title === 'Exclude') {
        if ($scope.isSelectedExcludeIndex === tableIndex) {
          $scope.changeSelectedExcludeIndex("0");
          return;
        }
        $scope.changeSelectedExcludeIndex(tableIndex); // -> $scope.$watch('isSelectedIndex', function (newVal, oldVal) {
      }
    };

    $scope.selectAllTableColumn = function () {
      var isValidCnt = 0;
      var isEnableCnt = 0;
      var idx = 0;
      var self = null;

      if ($scope.activeTab.title === 'Include') {
        for (idx = 0; idx < $scope.selectInidxlude.length; idx++) {
          if (typeof $scope.selectInclude[idx].Mode !== "undefined") {
            isValidCnt++;
            if ($scope.selectInclude[idx].isEnable === true) {
              isEnableCnt++;
            }
          }
        }
        if (isValidCnt - isEnableCnt > 0) {
          for (idx = 0; idx < $scope.selectInclude.length; idx++) {
            self = $scope.selectInclude[idx];
            if (typeof self.Mode !== "undefined") {
              self.isEnable = true;
              sketchbookService.setEnableForSVG(self.ROI - 1, true);
            }
          }
          $scope.selectAllCheckbox.include = true;
        } else if (isValidCnt - isEnableCnt === 0) {
          for (idx = 0; idx < $scope.selectInclude.length; idx++) {
            self = $scope.selectInclude[idx];
            self.isEnable = false;
            sketchbookService.setEnableForSVG(self.ROI - 1, false);
          }
          $scope.selectAllCheckbox.include = false;
        } else {
          console.log("count error");
        }
      }

      if ($scope.activeTab.title === 'Exclude') {
        var roiLen = 9;
        for (idx = 0; idx < $scope.selectExclude.length; idx++) {
          if (typeof $scope.selectExclude[idx].Mode !== "undefined") {
            isValidCnt++;
            if ($scope.selectExclude[idx].isEnable === true) {
              isEnableCnt++;
            }
          }
        }
        if (isValidCnt - isEnableCnt > 0) {
          for (idx = 0; idx < $scope.selectExclude.length; idx++) {
            self = $scope.selectExclude[idx];
            if (typeof self.Mode !== "undefined") {
              self.isEnable = true;
              sketchbookService.setEnableForSVG(self.ROI - roiLen, true);
            }
          }
          $scope.selectAllCheckbox.exclude = true;
        } else if (isValidCnt - isEnableCnt === 0) {
          for (idx = 0; idx < $scope.selectExclude.length; idx++) {
            self = $scope.selectExclude[idx];
            self.isEnable = false;
            sketchbookService.setEnableForSVG(self.ROI - roiLen, false);
          }
          $scope.selectAllCheckbox.exclude = false;
        } else {
          console.log("count error");
        }
      }
    }

    function isVacant(tableIndex) {
      if (
        $scope.activeTab.title === 'Include' &&
        typeof $scope.selectInclude[tableIndex - 1].Mode === "undefined"
      ) {
        return true;
      }

      if ($scope.activeTab.title === 'Exclude' && typeof $scope.selectExclude[tableIndex - 1].Mode === "undefined") {
        return true;
      }

      return false;
    }

    // function toggleCheckbox(tableIndex){
    //   var enableOption = null;
    //   var index = tableIndex - 1;

    //   if($scope.activeTab.title === 'Include'){
    //     $scope.selectInclude[index].isEnable = !$scope.selectInclude[index].isEnable;
    //     enableOption = $scope.selectInclude[index].isEnable;
    //   } 

    //   if($scope.activeTab.title === 'Exclude'){
    //     $scope.selectExclude[index].isEnable = !$scope.selectExclude[index].isEnable;
    //     enableOption = $scope.selectExclude[index].isEnable;
    //   } 

    //   sketchbookService.setEnableForSVG(index, enableOption);
    // }

    function getAttributes() {
      $scope.MaxChannel = mAttr.MaxChannel;
      if (typeof mAttr.EnableOptions !== "undefined") {
        $scope.EnableOptions = mAttr.EnableOptions;
      }

      refreshSensitivitySlider();

      /////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
      if (typeof mAttr.ActivateOptions !== "undefined") {
        $scope.ActivateOptions = mAttr.ActivateOptions;
      }

      if (typeof mAttr.WeekDays !== "undefined") {
        $scope.WeekDays = mAttr.WeekDays;
      }

      if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
        $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
      }

      if (Attributes.isSupportGoToPreset() === true) {
        $scope.PresetOptions = Attributes.getPresetOptions();
      }

      if (typeof mAttr.VideoAnalysis2Support !== "undefined" && mAttr.VideoAnalysis2Support === true) {
        $scope.VideoAnalysis2Support = true;
      } else {
        $scope.VideoAnalysis2Support = false;
      }

      // if (mAttr.MotionDetectDuration !== undefined)
      // {
      //     $scope.MotionDetectDurationSlider.floor = mAttr.MotionDetectDuration.minValue;
      //     $scope.MotionDetectDurationSlider.ceil = mAttr.MotionDetectDuration.maxValue;
      // }

      $scope.EventActions = COMMONUtils.getSupportedEventActions("MotionDetection");
      $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
      $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
      ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////

      if (typeof mAttr.HandoverRange !== "undefined") {
        $scope.HandoverSupport = true;
        $scope.HandoverEnableOptions = ['Enable', 'Disable'];

        $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
        $scope.MaxIPV6Len = mAttr.MaxIPV6Len;
        $scope.IPv4Pattern = mAttr.IPv4;
        $scope.IPv6Pattern = mAttr.IPv6;

        if (typeof mAttr.IpFilterIPType !== "undefined") {
          $scope.IPTypes = mAttr.IpFilterIPType;
        }

        if (typeof mAttr.HandoverUserMaxLen !== "undefined") {
          $scope.HandoverUserMinLen = 1;
          $scope.HandoverUserMaxLen = mAttr.HandoverUserMaxLen.maxLength;
        }

        if (typeof mAttr.HandoverPwdMaxLen !== "undefined") {
          $scope.HandoverPwdMinLen = 1;
          $scope.HandoverPwdMaxLen = mAttr.HandoverPwdMaxLen.maxLength;
        }

        if (typeof mAttr.HandoverPresetRange !== "undefined") {
          $scope.HandoverPresetMin = mAttr.HandoverPresetRange.minValue;
          $scope.HandoverPresetMax = mAttr.HandoverPresetRange.maxValue;
        }

        if (typeof mAttr.HandoverUserRange !== "undefined") {
          $scope.HandoverUserMin = mAttr.HandoverUserRange.minValue;
          $scope.HandoverUserMax = mAttr.HandoverUserRange.maxValue;
        }

        $scope.HandoverMin = mAttr.HandoverRange.minValue;
        $scope.HandoverMax = mAttr.HandoverRange.maxValue;
        $scope.data.HandoverAreaIndex = 0;
      } else {
        $scope.HandoverSupport = false;
      }

      $scope.PTZModel = mAttr.PTZModel;
      $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
    }

    function refreshSensitivitySlider() {
      $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
        $scope.$broadcast('reCalcViewDimensions');

        try {
          var rzslider = $("#md-line-chart rzslider");
          if (!rzslider.hasClass('vertical')) {
            rzslider.addClass('vertical');
          }
        } catch (err) {
          console.error(err);
        }
      });
    }

    function getSketchinfo(color) {
      return {
        workType: "mdArea",
        color: color, //0: blue, 1: red
        shape: 1,
        // shape: ($scope.ROIType == "Polygon" ? 1 : 0),
        minNumber: 4,
        maxNumber: 8,
        modalId: "./views/setup/common/confirmMessage.html"
      };
    }

    $scope.coordinates = null;

    $scope.changeMotionDetectionType = function (option, isDefault) {
      sketchbookService.removeDrawingGeometry();

      var title = option.title;
      var isIncludeTab = title === "Include";
      /**
      같은 탭을 두번 누를 때 백업하는 순간 문제가 발생하므로
      현재 탭을 누를 때는 실행하지 않는 다.
      */
      if ($scope.activeTab.title === title && typeof isDefault === "undefined") {
        // console.log("Return", $scope.activeTab.title, isDefault, prevMotionDetectionEnable);
        return;
      }

      //isChangeMdVaType = true;
      $scope.activeTab = option;

      /*
      Include, Exclude 구분은 0과 1로 구분이 된다.
      Include : 0, Exclude : 1
      */
      var color = isIncludeTab ? 0 : 1;
      var prevTag = isIncludeTab ? 1 : 0;
      var prevData = null;

      if (typeof isDefault === "undefined") {
        prevData = sketchbookService.get();

        /**
         * Enable를 설정한 다음 Tab 버튼을 계속 클릭했을 때
         * prevData 가 undefined이 된다.
         * 그럼 Area의 backupCoordinates가 undefined가 되기 때문에
         * 분기 처리를 추가한다.
         */
        if (typeof prevData !== "undefined") {
          backupCoordinates[prevTag] = prevData;
        }
      }

      if (isIncludeTab) {
        setTimeout(setSizeChart);
      }

      if ($scope.MotionDetection.MotionDetectionEnable === false) {
        // console.log("Return", $scope.activeTab.title, isDefault, prevMotionDetectionEnable);
        return;
      }

      /**
       * Sketch book은 $scope.coordinates에 뿌려주고 싶은 데이터를 설정한 뒤
       * $scope.sketchinfo의 값을 변경하면 $scope.coordinates의 값이 
       * sketchbook에 반영이 된다.
       */
      $scope.coordinates = backupCoordinates[color];
      $scope.sketchinfo = getSketchinfo(color);

      $timeout(function () {
        activeShape($scope['isSelected' + title + 'Index'] - 1);
        if (isIncludeTab) {
          setSizeChart();
        }
      });

      getAttributes();
    }

    function getFirstIncludeIndex() {
      var index = 0; //0은 아무것도 선택이 되지 않을 때

      for (var i = 0, len = $scope.selectInclude.length; i < len; i++) {
        var self = $scope.selectInclude[i];
        if ("Coordinates" in self) {
          if (self.Coordinates.length > 0) {
            index = self.ROI;
            break;
          }
        }
      }

      return index;
    }

    /**
     * 새로 생성됬을 때나 삭제 됬을 때
     */
    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function (obj, args) {
      var modifiedIndex = args[0];
      var modifiedType = args[1]; //생성: create, 삭제: delete
      var mode = null;
      var title = $scope.activeTab.title;
      var coordinates = {};
      var points = [];
      var roiLen = 8;

      $timeout(function () {
        if (modifiedType === "create" || modifiedType === "delete") {
          if (modifiedType === "create") {
            mode = title === 'Include' ? 'Inside' : 'Outside';

            coordinates = sketchbookService.get();
            points = coordinates[modifiedIndex].points;
            var roi = modifiedIndex + 1;
            if (mode === 'Outside') {
              roi += roiLen;
            }

            $scope['select' + title][modifiedIndex] = {
              ROI: roi,
              Mode: mode,
              SensitivityLevel: defaultSensitivity,
              ThresholdLevel: defaultThreshold,
              Coordinates: points,
              isEnable: true
            };
            activeShape(modifiedIndex);
            $scope['changeSelected' + title + 'Index'](modifiedIndex + 1);
          } else if (modifiedType === "delete") {
            $scope['select' + title][modifiedIndex] = {
              isEnable: false
            };

            if (title === "Include") {
              $scope['changeSelected' + title + 'Index'](getFirstIncludeIndex());
            } else {
              $scope['changeSelected' + title + 'Index'](0);
            }
            deleteRemovedROI($scope.presetData.type).then(function () {
              getHandoverList();
            }, saveSettings);
          }
        } else if (modifiedType === "mouseup") {
          activeShape(modifiedIndex);
          $scope['changeSelected' + title + 'Index'](modifiedIndex + 1);

          coordinates = sketchbookService.get();
          points = coordinates[modifiedIndex].points;

          $scope['select' + title][modifiedIndex].Coordinates = points;
        }
      });
    }, $scope);

    $scope.resetVariable = function () {
      try {
        if ($scope.MotionDetection.MotionDetectionEnable === false) {
          resetTabData();
        }

        pageData.rois = [];

        $scope.Handover = [{
          "HandoverList": []
        }];

        $scope.coordinates = null;
        $scope.sketchinfo = null;

        $scope.isSelectedIncludeIndex = "0"; // "0" means no selected
        $scope.isSelectedExcludeIndex = "0"; // "0" means no selected

        $scope.selectInclude = [{
          "ROI": 1
        }, {
          "ROI": 2
        }, {
          "ROI": 3
        }, {
          "ROI": 4
        }, {
          "ROI": 5
        }, {
          "ROI": 6
        }, {
          "ROI": 7
        }, {
          "ROI": 8
        }];
        $scope.selectExclude = [{
          "ROI": 9
        }, {
          "ROI": 10
        }, {
          "ROI": 11
        }, {
          "ROI": 12
        }, {
          "ROI": 13
        }, {
          "ROI": 14
        }, {
          "ROI": 15
        }, {
          "ROI": 16
        }];

        $scope.handoverStatus = {
          enDisable: 'Disable',
          set: true,
        };
        // $scope.SensitivitySliderModel.data = 80;
        // $scope.MDv2ChartOptions.ThresholdLevel = 5;
      } catch (err) {
        console.error(err);
      }
    };

    function setDefaultArea() {
      if ($scope.MotionDetection.MotionDetectionEnable === true) {
        $scope.changeMotionDetectionType($scope.activeTab, true);
      }
    }

    function view(data) {
      if (data === 0) {
        try {
          $rootScope.$emit('resetScheduleData', true);
        } catch (err) {
          console.error(err);
        }
      }

      try {
        sketchbookService.removeDrawingGeometry();
      } catch (err) {
        console.error(err);
      }

      $scope.resetVariable();

      getPresetList().then(function () {
        var promises = [];
        if (!$scope.PTZModel || ($scope.presetData.type !== "Preset")) {
          promises.push(updateMotionDetectionData);
        }
        promises.push(showVideo);
        promises.push(getHandoverSetting);
        if ($scope.PTZModel && $scope.presetData.type === "Preset") {
          promises.push(
            function () {
              //isPreset = true
              return updateMotionDetectionData(true);
            }
          );
        }

        $q.seqAll(promises).then(
          function () {
            $rootScope.$emit('changeLoadingBar', false);
            $scope.pageLoaded = true;
            $("#imagepage").show();
            $timeout(function () {
              $scope.$emit('pageLoaded', $scope.EventSource);
              setDefaultArea();
              setSizeChart();
              setSliderDisabled();
            });

            if ($scope.MotionDetection.MotionDetectionEnable) {
              startMonitoringMotionLevel();
            } else {
              stopMonitoringMotionLevel();
            }
          },
          function (errorData) {
            $rootScope.$emit('changeLoadingBar', false);
            $scope.pageLoaded = true;
            $scope.$emit('pageLoaded', $scope.EventSource);
            setSliderDisabled();
            console.log(errorData);
          }
        );
      }, function (err) {
        console.log(err);
      });
    }

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (fromState.controller === 'motionDetectionCtrl') {
        if ($scope.presetData.type === "Preset") {
          gotoPreset('Stop', $scope.presetData.preset);
        }
      }
    });

    function getHandoverSetting() {
      if ($scope.HandoverSupport) {
        //promises.push(getHandoverList);
        getHandoverList();
        if ($scope.PTZModel) {
          getPresetHandoverList;
        }
      }
    }

    function getMotionDetectionData(successCallback, isPreset) {
      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };
      var cmd = (isPreset ? $scope.presetCmd : $scope.va2CommonCmd) + '&action=view';

      return SunapiClient.get(cmd, getData,
        successCallback,
        function (errorData) {
          console.log(errorData);
        }, '', true);
    }

    function updateMotionDetectionData(isPreset) {
      var successCallback = function (response) {
        var data = null;
        if (isPreset) {
          var presets = response.data.PresetVideoAnalysis[0].Presets;
          for (var i = 0; i < presets.length; i++) {
            if (presets[i].Preset === $scope.presetData.preset) {
              data = presets[i];
            }
          }
        } else {
          data = response.data.VideoAnalysis[0];
        }

        prepareMotionDetectionData(data, isPreset);
      };

      return getMotionDetectionData(successCallback, isPreset);
    }

    function prepareMotionDetectionData(mdResponseData, isPreset) {
      setMotionDetectionEnable(mdResponseData.DetectionType);
      setMotionDetectionRules(mdResponseData.ROIs);
    }

    function setMotionDetectionEnable(detectionType) {
      // DetectionType : MDAndIV, Off, MotionDetection, IntelligentVideo

      if (detectionType === "Off" || detectionType === "IntelligentVideo") {
        $scope.MotionDetection.MotionDetectionEnable = false;
      } else if (detectionType === "MotionDetection" || detectionType === "MDAndIV") {
        $scope.MotionDetection.MotionDetectionEnable = true;
      } else {
        console.log("detectionType error");
        $scope.MotionDetection.MotionDetectionEnable = false;
      }

      pageData.MotionDetection.MotionDetectionEnable = $scope.MotionDetection.MotionDetectionEnable;
    }

    function updateROIData(rois) {
      var includeIndex = "0";
      var excludeIndex = "0";
      pageData.rois = angular.copy(rois);

      var roiLen = 8;
      for (var i = rois.length - 1; i >= 0; i--) {
        if (rois[i].ROI <= roiLen) {
          $scope.selectInclude[rois[i].ROI - 1] = angular.copy(rois[i]);
          //$scope.isSelectedIncludeIndex = rois[i].ROI;
          includeIndex = rois[i].ROI;
        } else {
          $scope.selectExclude[rois[i].ROI - (roiLen + 1)] = angular.copy(rois[i]);
          //$scope.isSelectedExcludeIndex = rois[i].ROI - 8;
          excludeIndex = rois[i].ROI - roiLen;
        }
      }

      if ($scope.isSelectedIncludeIndex !== "0") {
        includeIndex = $scope.isSelectedIncludeIndex;
      }

      if ($scope.isSelectedExcludeIndex !== "0") {
        excludeIndex = $scope.isSelectedExcludeIndex;
      }

      return [includeIndex, excludeIndex];
    }

    function setMotionDetectionRules(rois) {
      var updatedROIData = [];

      if ($scope.MotionDetection.MotionDetectionEnable === false) {
        return;
      }
      if (typeof rois !== "undefined") {
        updatedROIData = updateROIData(rois);
        $scope.changeSelectedIncludeIndex(updatedROIData[0]);
        $scope.changeSelectedExcludeIndex(updatedROIData[1]);
      }

      var idx = 0;
      // TODO :: SET CHECK BOX 
      for (idx = 0; idx < $scope.selectInclude.length; idx++) {
        if (typeof $scope.selectInclude[idx].Mode !== "undefined") {
          $scope.selectInclude[idx].isEnable = true;
        }
      }

      for (idx = 0; idx < $scope.selectExclude.length; idx++) {
        if (typeof $scope.selectExclude[idx].Mode !== "undefined") {
          $scope.selectExclude[idx].isEnable = true;
        }
      }

      /**
       * SketchManager에서 사용가능한 형태로 범위를 세팅한다.
       *
       * Include/Exclude의 합은 16이므로 일단 16으로 하드 코딩을 하고
       * 추후에 Sunapi에서 받아올 수 있으면 수정을 한다.
       */
      backupCoordinates = [
        [],
        []
      ];

      var areaType = 0;
      var roiLen = {
        one: 8,
        two: 16
      };
      for (idx = 1; idx <= roiLen.two; idx++) {
        areaType = idx > roiLen.one ? 1 : 0; //include: 0, exclude: 1
        backupCoordinates[areaType].push({ //SketchManager에서 사용하는 포맷
          isSet: false,
          points: [],
          enable: false,
          enExAppear: areaType
        });
      }

      /**
       * ROIs 값을 사용하여, Include/Exclude 영역을 그리기 위한 
       * SketchManager에서 사용가능한 Interface로 수정한다.
       */
      if (typeof rois !== "undefined") {
        for (idx = 0; idx < rois.length; idx++) {
          var self = rois[idx];
          var roi = self.ROI;
          var isExclude = roi > roiLen.one;
          var coordinates = self.Coordinates;
          areaType = isExclude ? 1 : 0; //include: 0, exclude: 1
          var points = [];

          if (coordinates.length === 0) {
            continue;
          }

          if (isExclude) {
            roi -= 8;
          }

          for (var j = 0, jj = coordinates.length; j < jj; j++) {
            points.push([
              coordinates[j].x,
              coordinates[j].y
            ]);
          }

          backupCoordinates[areaType][roi - 1].isSet = true;
          backupCoordinates[areaType][roi - 1].points = points;
          backupCoordinates[areaType][roi - 1].enable = true;
        }
      }
    }

    function showVideo() {
      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
        function (response) {
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
            currentPage: 'MotionDetection'
          };
          $scope.ptzinfo = {
            type: 'none'
          };
        },
        function (errorData) {
          //alert(errorData);
        }, '', true);
    }

    var mStopMonotoringMotionLevel = false;
    var monitoringTimer = null;
    var maxSample = 6;

    function startMonitoringMotionLevel() {
      mStopMonotoringMotionLevel = false;
      $scope.$broadcast('liveChartStart');

      if (monitoringTimer === null) {
        (function update() {
          getMotionLevel(function (data, _index) {
            if (destroyInterrupt) {
              return;
            }
            var newMotionLevel = angular.copy(data);

            if (!mStopMonotoringMotionLevel) {
              if (newMotionLevel.length >= maxSample) {
                var index = newMotionLevel.length;

                while (index--) {
                  var level = newMotionLevel[index].Level;

                  if (level === null) {
                    continue;
                  }

                  if ($scope.MDv2ChartOptions.EnqueueData) {
                    $scope.MDv2ChartOptions.EnqueueData(level);
                  }
                }
              }

              var mTimeout = 300;
              monitoringTimer = $timeout(update, mTimeout); //300 msec
            }
          });
        })();
      }
    }

    function getMotionLevel(func) {
      var newMotionLevel = {};

      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };

      getData.MaxSamples = maxSample;
      getData.EventSourceType = 'MotionDetection';
      getData.Index = $scope.isSelectedIncludeIndex;

      var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

      return SunapiClient.get(sunapiURL, getData,
        function (response) {
          newMotionLevel = angular.copy(response.data.MotionDetection[0].Samples);
          if (typeof func !== "undefined") {
            func(newMotionLevel, getData.Index);
          }
        },
        function (errorData) {
          console.log("getMotionLevel Error : ", errorData);
          stopMonitoringMotionLevel();
          startMonitoringMotionLevel();
        }, '', true);
    }

    function stopMonitoringMotionLevel() {
      mStopMonotoringMotionLevel = true;
      $scope.$broadcast('liveChartStop');

      if (monitoringTimer !== null) {
        $timeout.cancel(monitoringTimer);
        monitoringTimer = null;
        $scope.MDv2ChartOptions.EnqueueData(0);
      }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function () {
      destroyInterrupt = true;
      stopMonitoringMotionLevel();
    });

    $scope.getTranslatedOption = function (Option) {
      return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.submitEnable = function () {
      stopMonitoringMotionLevel();
      var modalInstance = $uibModal.open({
        animation: false,
        templateUrl: 'views/setup/common/confirmMessage.html',
        controller: 'confirmMessageCtrl',
        resolve: {
          Message: function () {
            return 'lang_apply_question';
          }
        }
      });

      modalInstance.result.then(
        function () {
          $rootScope.$emit('changeLoadingBar', true);

          var functionlist = [];
          functionlist.push(setOnlyEnable);
          $q.seqAll(functionlist).then(
            function () {
              if ($scope.MotionDetection.MotionDetectionEnable) {
                startMonitoringMotionLevel();
              }

              view();
            },
            function (errorData) {
              if ($scope.MotionDetection.MotionDetectionEnable) {
                startMonitoringMotionLevel();
              }
              console.log(errorData);
            }
          );
        },
        function () {
          $scope.MotionDetection.MotionDetectionEnable = 
            pageData.MotionDetection.MotionDetectionEnable;

          if ($scope.MotionDetection.MotionDetectionEnable) {
            startMonitoringMotionLevel();
          }
        }
      );
    };



    function setOnlyEnable() {
      var deferred = $q.defer();
      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };

      var presetType = $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
      var presetNo = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
      var isPreset = $scope.PTZModel && (presetType === "Preset");

      var cmd = $scope.va2CommonCmd + '&action=view';
      if (isPreset) {
        cmd = $scope.presetCmd + '&action=view';
        getData.Preset = presetNo;
      }
      SunapiClient.get(cmd, getData,
        function (response) {
          var detectionType = null;
          if (isPreset) {
            detectionType = response.data.PresetVideoAnalysis[0].Presets[0].DetectionType;
          } else {
            detectionType = response.data.VideoAnalysis[0].DetectionType;
          }

          var setData = {
            Channel: UniversialManagerService.getChannelId()
          };
          if ($scope.MotionDetection.MotionDetectionEnable === true) {
            if (detectionType === "Off" || detectionType === "MotionDetection") {
              setData.DetectionType = "MotionDetection";
            }
            if (detectionType === "IntelligentVideo" || detectionType === "MDAndIV") {
              setData.DetectionType = "MDAndIV";
            }
          } else {
            if (detectionType === "Off" || detectionType === "MotionDetection") {
              setData.DetectionType = "Off";
            }
            if (detectionType === "IntelligentVideo" || detectionType === "MDAndIV") {
              setData.DetectionType = "IntelligentVideo";
            }
          }

          var cmd = $scope.va2CommonCmd + '&action=set';
          if ($scope.PTZModel && (presetType === "Preset")) {
            cmd = $scope.presetCmd + '&action=set';
            setData.Preset = presetNo;
          }

          SunapiClient.get(cmd, setData,
            function (response) {
              deferred.resolve();
            },
            function (errorData) {
              console.log(errorData);
              deferred.resolve();
            }, '', true);
        },
        function (errorData) {
          console.log(errorData);
          deferred.resolve();
        }); // 삭제와 Get을 같이함.                    

      return deferred.promise;
    }

    function set() {
      if (validatePage()) {
        sketchbookService.removeDrawingGeometry();
        var modalInstance = $uibModal.open({
          templateUrl: 'views/setup/common/confirmMessage.html',
          controller: 'confirmMessageCtrl',
          size: 'sm',
          resolve: {
            Message: function () {
              return 'lang_apply_question';
            }
          }
        });

        modalInstance.result.then(
          function () {
            if ($scope.PTZModel && $scope.presetData.type === "Preset") {
              addPreset();
            }
            saveSettings();
          },
          function () {}
        );
      }
    }

    function saveSettings(checkAuto) {
      $rootScope.$emit('changeLoadingBar', true);

      if (checkAuto === 'Auto') {
        $scope.checkAutoSubmit = true;
      }

      var deferred = $q.defer();
      var functionlist = [];
      // SUNAPI SET
      ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
      //setHandoverList($scope.isSelectedIncludeIndex).then(updateHandoverList($scope.isSelectedIncludeIndex-1)).then(setEnable()).then(setEventRules);

      var oldSelectedIncludeIndex = angular.copy($scope.isSelectedIncludeIndex);
      var oldSelectedExcludeIndex = angular.copy($scope.isSelectedExcludeIndex);

      functionlist.push(function () {
        return setEnable();
      });

      if ($scope.MotionDetection.MotionDetectionEnable === true) {
        //setEnable().then(setHandoverList($scope.isSelectedIncludeIndex-1)).then(saveHandoverFunction).then(setEventRules).then(view);    
        functionlist.push(function () {
          return setHandoverList($scope.isSelectedIncludeIndex - 1);
        });

        saveHandoverFunction(functionlist);
      }

      var endSettings = function () {
        $rootScope.$emit('changeLoadingBar', false);
        $scope.$emit('applied', true);
        deferred.resolve(true);
        $scope.checkAutoSubmit = false;
        $scope.changeSelectedIncludeIndex(oldSelectedIncludeIndex);
        $scope.changeSelectedExcludeIndex(oldSelectedExcludeIndex);
      };

      //functionlist.push(view);
      if (functionlist.length > 0) {
        $q.seqAll(functionlist).then(
          function () {
            getHandoverList(view).then(
              function () {
                endSettings();
              },
              function (errorData) {
                console.log(errorData);
                endSettings();
              }
            );
          },
          function (errorData) {
            console.log(errorData);
            view();
            endSettings();
          }
        );
      } else {
        getHandoverList(view).then(
          function () {
            endSettings();
          },
          function (errorData) {
            console.log(errorData);
            view();
            endSettings();
          }
        );
      }

      return deferred.promise;
    }

    (function wait() {
      if (!mAttr.Ready) {
        var waitTimeout = 500;
        $timeout(function () {
          mAttr = Attributes.get();
          wait();
        }, waitTimeout);
      } else {
        mAttr = Attributes.get();
        getAttributes();
        getCommonCmd();
        view();
      }
    })();

    $scope.submit = set;
    $scope.view = view;


    function sunapiQueueRequest(queue, callback) {
      var currentItem = null;

      if (queue.length > 0) {
        currentItem = queue.shift();
        currentItem.reqData.Channel = UniversialManagerService.getChannelId();

        SunapiClient.get(
          currentItem.url,
          currentItem.reqData,
          function () {

          },
          function () {
            //alert(errorData);
          }, '', true).then(reqCallback);
      } else {
        callback();
      }

      function reqCallback() {
        if (queue.length > 0) {
          sunapiQueueRequest(queue, callback);
        } else {
          callback();
        }
      }
    }

    var globalQueue = [];

    function sendUpdateHandoverList() {
      var deferred = $q.defer();

      sunapiQueueRequest(angular.copy(globalQueue), function () {
        deferred.resolve();
      });

      return deferred.promise;
    }

    function saveHandoverFunction(functionlist) {
      var item = null;
      var queue = [];
      globalQueue = [];

      if (
        $scope.HandoverSupport && 
        pageData.Handover && 
        !angular.equals(
          pageData.Handover[$scope.presetTypeData.SelectedPreset].HandoverList, 
          $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList
        )
      ) {
        var handoverLen = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList.length;
        for (var i = 0; i < handoverLen; i++) {
          if (
            !angular.equals(
              pageData.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i], 
              $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i]
            )
          ) {
            //promises.push(function(){return setHandoverList(index, $scope.presetTypeData.SelectedPreset);});
            // functionlist.push(function(){
            //     return setHandoverList(index, $scope.presetTypeData.SelectedPreset);
            // });

            functionlist.push((function (_index, _selectedPreset) {
              var index = _index;
              var selectedPreset = _selectedPreset;
              return function () {
                return setHandoverList(index, selectedPreset);
              };
            })(i, $scope.presetTypeData.SelectedPreset));

            var userLen = 
              $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i].UserList.length;
            if (
              typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i] !== "undefined" && 
              userLen
            ) {
              for (var j = 0; j < userLen; j++) {
                item = updateHandoverList(i, j, $scope.presetTypeData.SelectedPreset);
                queue.push(item);
              }
            }
          }
        }

        globalQueue = queue;
        functionlist.push(function () {
          return sendUpdateHandoverList();
        });
        //promises.push(sendUpdateHandoverList);

        if ($scope.presetTypeData.SelectedPreset > 0) {
          functionlist.push(function () {
            return getPresetHandoverList();
          });
          //promises.push(getPresetHandoverList);
        } else {
          functionlist.push(function () {
            return getHandoverList();
          });
          //promises.push(getHandoverList);
        }

      }
      ///console.log(" ::::: saveHandoverFunction end ::::: ");


      // if(promises.length > 0){
      //     return $q.seqAll(promises);
      // } else {
      //     return;
      // }

    }

    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////

    function deleteRemovedROI(checkPresetType) {
      //삭제된 Index 찾아서 삭제 요청
      var deferred = $q.defer();
      var removedROIIndex = [];

      // console.log(pageData.rois);

      if (!($scope.MotionDetection.MotionDetectionEnable === false)) {
        for (var i = 0, ii = pageData.rois.length; i < ii; i++) {
          var roi = pageData.rois[i].ROI;
          var self = null;
          var roiLen = 8;
          if (roi > roiLen) {
            self = $scope.selectExclude[roi - (roiLen + 1)];
          } else {
            self = $scope.selectInclude[roi - 1];
          }

          if (typeof self.Mode === "undefined") {
            removedROIIndex.push(roi);
          }
        }
      }

      if (removedROIIndex.length > 0) {
        var setData = {
          Channel: UniversialManagerService.getChannelId(),
          ROIIndex: removedROIIndex.join(',')
        };
        var cmd = $scope.va2CommonCmd + '&action=remove';
        if ($scope.PTZModel && (checkPresetType === "Preset")) {
          cmd = $scope.presetCmd + '&action=remove';
          setData.Preset = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
        }
        SunapiClient.get(cmd,
          //SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=remove', 
          setData,
          function (response) {
            // console.log("removed");
            deferred.resolve(removedROIIndex);
          },
          function (errorData) {
            console.log(errorData);
            deferred.resolve();
          }, '', true);
      } else {
        $timeout(function () {
          deferred.resolve(removedROIIndex);
        });
      }

      return deferred.promise;
    }

    function getUnmodifiedROIIndex() {
      var unmodifiedROIIndex = [];

      for (var i = 0, ii = pageData.rois.length; i < ii; i++) {
        var pageDataItem = pageData.rois[i];
        var roi = pageDataItem.ROI;
        var self = null;
        var roiLen = 8;
        if (roi > roiLen) {
          self = $scope.selectExclude[roi - (roiLen + 1)];
        } else {
          self = $scope.selectInclude[roi - 1];
        }

        var coor = [];
        var selfCoor = [];
        for (var j = 0, jj = pageDataItem.Coordinates.length; j < jj; j++) {
          coor.push([
            pageDataItem.Coordinates[j].x,
            pageDataItem.Coordinates[j].y
          ]);
        }

        if (typeof self.Mode !== "undefined") {
          if (self.Coordinates[0].toString() === "[object Object]") {
            for (var qq = 0; qq < self.Coordinates.length; qq++) {
              selfCoor.push([
                self.Coordinates[qq].x,
                self.Coordinates[qq].y
              ]);
            }
          } else {
            selfCoor = self.Coordinates;
          }
          if (
            self.SensitivityLevel === pageDataItem.SensitivityLevel &&
            self.ThresholdLevel === pageDataItem.ThresholdLevel &&
            selfCoor.join(',') === coor.join(',')
          ) {
            unmodifiedROIIndex.push(roi);
          }
        }
      }

      return unmodifiedROIIndex;
    }

    function getModifiedROIIndex(unmodifiedROIIndex, deletedROIIndex) {
      var modifiedIndex = [];
      var roiLen = {
        one: 8,
        two: 16
      };
      for (var i = 1; i <= roiLen.two; i++) {
        var isOk = true;
        var self = null;

        var j = 0;
        for (j = 0; j < unmodifiedROIIndex.length; j++) {
          if (unmodifiedROIIndex[j] === i) {
            isOk = false;
          }
        }

        for (j = 0; j < deletedROIIndex.length; j++) {
          if (deletedROIIndex[j] === i) {
            isOk = false;
          }
        }

        if (isOk) {
          if (i > roiLen.one) {
            self = $scope.selectExclude[i - (roiLen.one + 1)];
          } else {
            self = $scope.selectInclude[i - 1];
          }

          if ('Mode' in self) {
            modifiedIndex.push(i);
          }
        }
      }

      return modifiedIndex;
    }


    function setEnable() {
      var deferred = $q.defer();
      setOnlyEnable().finally(function () {
        var setData = {
          Channel: UniversialManagerService.getChannelId()
        };

        var unmodifiedROIIndex = getUnmodifiedROIIndex();
        var setPresetType = 
          $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
        deleteRemovedROI(setPresetType).then(
          function (deletedROIIndex) {
            var modifiedIndex = getModifiedROIIndex(unmodifiedROIIndex, deletedROIIndex);

            if (modifiedIndex.length > 0) {
              for (var i = 0, ii = modifiedIndex.length; i < ii; i++) {
                var self = modifiedIndex[i];
                var property = '';
                var index = self - 1;
                var roiLen = 8;
                if (self > roiLen) {
                  property = 'selectExclude';
                  index -= roiLen;
                } else {
                  property = 'selectInclude';
                }
                var data = $scope[property][index];
                var coor = [];

                if (typeof data.Mode !== "undefined") {
                  if (data.Coordinates[0].toString() === "[object Object]") {
                    for (var j = 0, jj = data.Coordinates.length; j < jj; j++) {
                      coor.push([
                        data.Coordinates[j].x,
                        data.Coordinates[j].y
                      ]);
                    }
                  } else {
                    coor = data.Coordinates;
                  }

                  setData['ROI.' + self + '.Coordinate'] = coor.join(',');
                  setData['ROI.' + self + '.SensitivityLevel'] = data.SensitivityLevel;
                  setData['ROI.' + self + '.ThresholdLevel'] = data.ThresholdLevel;
                }
              }
            }

            var cmd = $scope.va2CommonCmd + '&action=set';
            if ($scope.PTZModel && setPresetType === 'Preset') {
              setData.Preset = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
              cmd = $scope.presetCmd + '&action=set';
            }
            SunapiClient.get(cmd, setData,
              function (response) {
                setHandoverList(0).finally(function () {
                  deferred.resolve();
                });
              },
              function (errorData) {
                console.log(errorData);
                deferred.resolve();
              },
              '', true);
          },
          function (errorData) {
            console.log(errorData);
            deferred.resolve();
          }
        ); // 삭제와 Get을 같이함.   
      });

      return deferred.promise;
    }

    function validatePage() {
      var returnVal = true;
      var errorMessage = null;
      var handoverList = $scope.Handover[0].HandoverList;

      function validateHandOverItem(handoverData) {
        //IPv4
        if (handoverData.IPType === $scope.IPTypes[0]) {
          if (typeof handoverData.IPV4Address === "undefined") {
            return 'lang_msg_chkIPAddress';
          } else if (COMMONUtils.CheckValidIPv4Address(handoverData.IPV4Address) === false) {
            return 'lang_msg_chkIPAddress';
          }
          //IPv6
        } else {
          if (typeof handoverData.IPV6Address === "undefined") {
            return 'lang_msg_chkIPv6Address';
          } else if (COMMONUtils.CheckValidIPv6Address(handoverData.IPV6Address) === false) {
            return 'lang_msg_chkIPv6Address';
          }
        }

        //Port
        if (
          typeof handoverData.Port === "undefined" ||
          parseInt(handoverData.Port) <= 0 ||
          parseInt(handoverData.Port) > mAttr.Http.maxValue) {
          return 'lang_msg_Theportshouldbebetween1and65535';
        }

        //UserName
        if (typeof handoverData.Username === "undefined") {
          return 'lang_msg_invalid_userID';
        }

        //Password
        if (typeof handoverData.Password === "undefined") {
          return 'lang_msg_invalid_pw';
        }

        //PresetNumber
        if (
          typeof handoverData.PresetNumber === "undefined" ||
          parseInt(handoverData.PresetNumber) < $scope.HandoverPresetMin ||
          parseInt(handoverData.PresetNumber) > $scope.HandoverPresetMax) {
          return $translate.
            instant('lang_range_alert').
            replace('%1', $scope.HandoverPresetMin).
            replace('%2', $scope.HandoverPresetMax);
        }

        return true;
      }

      if (!eventRuleService.checkSchedulerValidation()) {
        errorMessage = 'lang_msg_checkthetable';
        returnVal = false;
      } else {
        for (var i = 0, ii = handoverList.length; i < ii; i++) {
          var userList = handoverList[i].UserList;
          var userListLength = userList.length;
          if (userListLength > 0) {
            for (var j = 0; j < userListLength; j++) {
              var isOk = validateHandOverItem(userList[j]);
              if (isOk !== true) {
                errorMessage = isOk;
                returnVal = false;
                break;
              }
            }

            if (returnVal === false) {
              break;
            }
          }
        }
      }

      if (errorMessage !== null) {
        COMMONUtils.ShowError(errorMessage);
      }

      return returnVal;
    }

    $(document).ready(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });

    $scope.clearAll = function () {
      $timeout(function () {
        $scope.EventRule.ScheduleIds = [];
      });
    };

    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////


    ///////////////////////////////////////////////////////////////////////////////////////////////////

    var getHandoverList = function (successCallback) {
      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };
      if ($scope.PTZModel && ($scope.presetData.type === "Preset")) {
        getData.PresetIndex = $scope.presetData.preset;
      }
      return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=view', getData,
        function (response) {
          var idx = 0;
          //Enable이 비활성화 일 때 Handover는 필요없으므로 Return
          // if($scope.MotionDetection.MotionDetectionEnable === false) {
          //     if(successCallback !== undefined){
          //         successCallback();
          //     }
          //     return;
          // }
          if ($scope.PTZModel && ($scope.presetData.type === "Preset")) {
            var presetList = response.data.Handover[0].PresetList;
            var listIndex = 0;
            for (idx = 0; idx < presetList.length; idx++) {
              if (presetList[idx].PresetIndex === $scope.presetData.preset) {
                listIndex = idx;
                break;
              }
            }
            $scope.Handover[0].HandoverList = typeof presetList[listIndex] === 'undefined' ? [] : presetList[listIndex].HandoverList;
          } else {
            $scope.Handover[0].HandoverList = response.data.Handover[0].HandoverList;
          }
          for (idx = 0; idx < $scope.Handover[0].HandoverList.length; idx++) {
            $scope.Handover[0].HandoverList[idx].CheckAll = false;
            $scope.Handover[0].HandoverList[idx].Enable = 
              $scope.Handover[0].HandoverList[idx].Enable ? 
              $scope.HandoverEnableOptions[0] : $scope.HandoverEnableOptions[1];

            for (var j = 0; j < $scope.Handover[0].HandoverList[idx].UserList.length; j++) {
              $scope.Handover[0].HandoverList[idx].UserList[j].SelectedHandoverIndex = false;

              if ($scope.Handover[0].HandoverList[idx].UserList[j].IPType === $scope.IPTypes[0]) {
                $scope.Handover[0].HandoverList[idx].UserList[j].IPV4Address = 
                  $scope.Handover[0].HandoverList[idx].UserList[j].IPAddress;
                $scope.Handover[0].HandoverList[idx].UserList[j].IPV6Address = 'fe80::209:18ff:fee1:61f';
              } else {
                $scope.Handover[0].HandoverList[idx].UserList[j].IPV4Address = "1.1.1.1";
                $scope.Handover[0].HandoverList[idx].UserList[j].IPV6Address = 
                  $scope.Handover[0].HandoverList[idx].UserList[j].IPAddress;
              }
            }
          }

          pageData.Handover = angular.copy($scope.Handover);
          if ($scope.handoverStatus.set === true && $scope.Handover[0].HandoverList.length > 0) {
            $scope.handoverStatus.enDisable = 
              $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[0].Enable;
            $scope.handoverStatus.set = false;
          }

          if (typeof successCallback !== "undefined") {
            successCallback();
          }
          $scope.$apply();
        },
        function (errorData) {
          /*
          if (errorData !== "Configuration Not Found")
          {
              alert(errorData);
          }*/
          $scope.Handover[0].HandoverList = [];
          pageData.Handover = angular.copy($scope.Handover);
          if (typeof successCallback !== "undefined") {
            successCallback();
          }
        }, '', true);
    };

    var getPresetHandoverList = function () {
      var getData = {
        Channel: UniversialManagerService.getChannelId()
      };
      getData.PresetIndex = "All";

      return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=view', getData,
        function (response) {
          var handoverViewTimeout = 100;
          $timeout(function () {
            var presetHandover = angular.copy(response.data.Handover[0].PresetList);

            for (var aa = 0; aa < $scope.PresetNameValueOptions.length; aa++) {
              var index = aa + 1;

              var idx = -1;
              for (var bb = 0; bb < presetHandover.length; bb++) {
                var Preset = $scope.PresetNameValueOptions[aa].split(' : ');
                if (parseInt(Preset[0], 10) === parseInt(presetHandover[bb].PresetIndex, 10)) {
                  idx = bb;
                  break;
                }
              }
              $scope.Handover[index] = {};
              $scope.Handover[index].PresetIndex = $scope.PresetNameValueOptions[aa].Preset;
              $scope.Handover[index].HandoverList = [];
              if (idx !== -1) {
                $scope.Handover[index].HandoverList = 
                  angular.copy(presetHandover[idx].HandoverList);
              }

              for (var i = 0; i < $scope.Handover[index].HandoverList.length; i++) {
                $scope.Handover[index].HandoverList[i].CheckAll = false;
                $scope.Handover[index].HandoverList[i].Enable = 
                  $scope.Handover[index].HandoverList[i].Enable ? 
                  $scope.HandoverEnableOptions[0] : $scope.HandoverEnableOptions[1];
                if (typeof $scope.Handover[index].HandoverList[i].UserList === 'undefined') {
                  $scope.Handover[index].HandoverList[i].UserList = [];
                }
                for (var j = 0; j < $scope.Handover[index].HandoverList[i].UserList.length; j++) {
                  $scope.Handover[index].HandoverList[i].UserList[j].SelectedHandoverIndex = false;

                  if (
                    $scope.Handover[index].HandoverList[i].UserList[j].IPType === $scope.IPTypes[0]
                  ) {
                    $scope.Handover[index].HandoverList[i].UserList[j].IPV4Address = 
                      $scope.Handover[index].HandoverList[i].UserList[j].IPAddress;
                    $scope.Handover[index].HandoverList[i].UserList[j].IPV6Address = 'fe80::209:18ff:fee1:61f';
                  } else {
                    $scope.Handover[index].HandoverList[i].UserList[j].IPV4Address = "1.1.1.1";
                    $scope.Handover[index].HandoverList[i].UserList[j].IPV6Address = 
                      $scope.Handover[index].HandoverList[i].UserList[j].IPAddress;
                  }
                }
              }
            }
            pageData.Handover = angular.copy($scope.Handover);
            $scope.$apply();
          }, handoverViewTimeout);

        },
        function (errorData) {
          if ($scope.Handover.length <= 1) {
            for (var aa = 0; aa < $scope.PresetNameValueOptions.length; aa++) {
              var index = aa + 1;
              $scope.Handover[index] = {};
              $scope.Handover[index].PresetIndex = $scope.PresetNameValueOptions[aa].Preset;
              $scope.Handover[index].HandoverList = [];
            }
            viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
          }
          pageData.Handover = angular.copy($scope.Handover);
        }, '', true);
    }

    function viewHandoverAreaOptions(presetIdx) {
      var index = presetIdx;
      if (typeof presetIdx === 'undefined') {
        index = 0;
      }

      var HandoverAreaOptionsArray = [];

      if (typeof $scope.Handover[index] !== 'undefined' && $scope.Handover[index].HandoverList.length) {
        for (var i = 0; i < $scope.Handover[index].HandoverList.length; i++) {
          if (typeof $scope.Handover[index].HandoverList[i] !== 'undefined') {
            HandoverAreaOptionsArray.push($scope.Handover[index].HandoverList[i].ROIIndex);
          }
        }
        $scope.HandoverAreaOptions = HandoverAreaOptionsArray;
      } else {
        $scope.HandoverAreaOptions = 
          COMMONUtils.getArrayWithMinMax($scope.HandoverMin, $scope.HandoverMin);
      }
    }

    function setHandoverList(handoverlistIndex, _index) {
      var index = _index;
      //console.log(" ::::: setHandoverList START ::::: ");
      var deferred = $q.defer();
      if (typeof index === 'undefined') {
        index = 0;
      }
      // if(handoverlistIndex > 0){
      // handoverlistIndex--;
      // }
      // console.log("::: handover", $scope.Handover[index]);
      // if ($scope.Handover[index].HandoverList[handoverlistIndex] !== undefined)
      // {
      var setData = {
        Channel: UniversialManagerService.getChannelId()
      };
      try {
        setData.ROIIndex = $scope.Handover[index].HandoverList[handoverlistIndex].ROIIndex;
      } catch (err) {
        setData.ROIIndex = $scope.isSelectedIncludeIndex;
      }

      setData.Enable = 
        ($scope.handoverStatus.enDisable === $scope.HandoverEnableOptions[0]) ? true : false;

      // if (index > 0){
      //     setData.PresetIndex = index;
      // }



      var presetType = $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
      if ($scope.PTZModel && (presetType === "Preset")) {
        var presetNo = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
        setData.PresetIndex = presetNo;
      }

      //console.log(" ::: setData", setData);
      SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=set', setData,
        function (response) {
          deferred.resolve(response);
        },
        function (errorData) {
          for (var i = 0; i < $scope.Handover[index].HandoverList.length; i++) {
            var self = $scope.Handover[index].HandoverList[i];
            if (self.ROIIndex) {
              setData.ROIIndex = self.ROIIndex;
            }
          }
          SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=set', setData,
            function (response) {
              deferred.resolve(response);
            },
            function () {
              if (errorData === "Error Parsing response") {
                deferred.resolve();
              } else {
                deferred.resolve();
              }
            }
          );
          //console.log(" ::::: ERR ::::: ");
          //alert(errorData);
        }, '', true);

      return deferred.promise;
    }


    function updateHandoverList(roiIndex, _userIndex, _index) {
      var userIndex = _userIndex;
      var index = _index;
      //console.log(" ::::: roiIndex, userIndex, index", roiIndex, userIndex, index);
      if (typeof index === 'undefined') {
        index = 0;
      }
      if (typeof userIndex === 'undefined') {
        userIndex = 0;
      }

      var setData = {};
      var userList = $scope.Handover[index].HandoverList[roiIndex].UserList[userIndex];
      var pageDataUserList = pageData.Handover[index].HandoverList[roiIndex].UserList[userIndex];

      setData.ROIIndex = $scope.Handover[index].HandoverList[roiIndex].ROIIndex;
      //console.log("$scope.Handover", $scope.Handover);

      //console.log("HandoverIndex", HandoverIndex);

      //HandoverIndex = $scope.isSelectedIncludeIndex-1;
      setData.HandoverIndex = userList.HandoverIndex;

      if (typeof pageDataUserList.IPType !== "undefined" && pageDataUserList.IPType !== userList.IPType) {
        setData.IPType = userList.IPType;
      }

      if (userList.IPType === $scope.IPTypes[0]) {
        if (pageDataUserList.IPAddress !== userList.IPV4Address) {
          setData.IPAddress = userList.IPV4Address;
        }
      } else {
        if (pageDataUserList.IPAddress !== userList.IPV6Address) {
          setData.IPAddress = userList.IPV6Address;
        }
      }

      if (pageDataUserList.Port !== userList.Port) {
        setData.Port = userList.Port;
      }

      if (pageDataUserList.Username !== userList.Username) {
        setData.Username = userList.Username;
      }

      if (pageDataUserList.Password !== userList.Password) {
        setData.Password = encodeURIComponent(userList.Password);
      }

      if (pageDataUserList.PresetNumber !== userList.PresetNumber) {
        setData.PresetNumber = userList.PresetNumber;
      }

      // if (index > 0) {
      //     setData.PresetIndex = index;
      // }

      var presetType = $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
      if ($scope.PTZModel && (presetType === "Preset")) {
        var presetNo = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
        setData.PresetIndex = presetNo;
      }

      //console.log(" ::::: setData", setData);
      return {
        url: '/stw-cgi/eventrules.cgi?msubmenu=handover&action=update',
        reqData: setData
      };
    }

    function addUserToHandover(roiIndex, _index, usetListData) {
      var index = _index;

      //console.log(" ::: roiIndex, index", roiIndex, index);
      var deferred = $q.defer();
      if (typeof index === 'undefined') {
        index = 0;
      }
      var setData = {
        Channel: UniversialManagerService.getChannelId()
      };

      //var areaIndex = roiIndex - 1;
      // var areaIndex = $scope.findHandoverIndex();
      // var userIndex = $scope.Handover[index].HandoverList[areaIndex].UserList.length - 1;
      //console.log(" ::: roiIndex, index, areaIndex, userIndex", roiIndex, index, areaIndex, userIndex);

      setData.ROIIndex = roiIndex;
      setData.IPType = usetListData.IPType;
      // $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex]
      if (setData.IPType === $scope.IPTypes[0]) {
        setData.IPAddress = usetListData.IPV4Address;
      } else {
        setData.IPAddress = usetListData.IPV6Address;
      }

      setData.Port = usetListData.Port;
      setData.Username = usetListData.Username;
      setData.Password = encodeURIComponent(usetListData.Password);
      setData.PresetNumber = usetListData.PresetNumber;
      // if (index > 0) {
      //     setData.PresetIndex = index;
      // }

      var presetType = $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
      if ($scope.PTZModel && (presetType === "Preset")) {
        var presetNo = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
        setData.PresetIndex = presetNo;
      }

      //console.log(" ::: setData", setData);
      SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=add', setData,
        function (response) {
          deferred.resolve();
          pageData.Handover = angular.copy($scope.Handover);
        },
        function (errorData) {
          deferred.resolve();
          pageData.Handover = angular.copy($scope.Handover);
          console.log(" ::: errorData", errorData);
          //alert(errorData);
        }, '', true);

      return deferred.promise;
    }

    function removeUserFromHandover(roiIndex, userIndexArray, index) {
      var setData = {
        Channel: UniversialManagerService.getChannelId()
      };

      setData.ROIIndex = roiIndex;

      if (userIndexArray !== null && userIndexArray.length) {
        setData.HandoverIndex = '';

        for (var i = 0; i < userIndexArray.length; i++) {
          setData.HandoverIndex += userIndexArray[i] + ',';
        }

        if (setData.HandoverIndex.length) {
          setData.HandoverIndex = 
            setData.HandoverIndex.substring(0, setData.HandoverIndex.length - 1);
        }
      }
      // if (index > 0){
      //     setData.PresetIndex = index;
      // }

      var presetType = $scope.checkAutoSubmit ? $scope.presetData.oldType : $scope.presetData.type;
      if ($scope.PTZModel && (presetType === "Preset")) {
        var presetNo = ($scope.checkAutoSubmit && $scope.presetData.oldType === "Preset" && $scope.presetData.type === "Preset") ? $scope.presetData.oldPreset : $scope.presetData.preset;
        setData.PresetIndex = presetNo;
      }

      return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=remove', setData,
        function (response) {
          pageData.Handover = angular.copy($scope.Handover);
        },
        function (errorData) {
          //alert(errorData);
        }, '', true);
    }

    $scope.removeHandover = function () {
      var functionlist = [];
      functionlist.push(function () {
        var setHandoverTimeout = 200;
        return $timeout(function () {
          setHandoverList();
        }, setHandoverTimeout);
      });
      functionlist.push(function () {
        return removeHandoverFunction();
      });
      $q.seqAll(functionlist).then(
        function () {},
        function (errorData) {
          console.log(errorData);
        }
      );
    };

    function removeHandoverFunction() {
      var promises = [];
      var promise = null;

      //var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);

      var areaIndex = getHandoverListIndex();
      //console.log(" ::: removeHandover", areaIndex);

      if (typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList !== 'undefined' && typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex] !== 'undefined') {
        var userList = 
          $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList;
        if (userList.length) {
          var userIndexArray = [];

          for (var i = 0; i < userList.length; i++) {
            if (userList[i].SelectedHandoverIndex) {
              userIndexArray.push(userList[i].HandoverIndex);
            }
          }

          if (userIndexArray.length) {
            var modalInstance = $uibModal.open({
              templateUrl: 'views/setup/common/confirmMessage.html',
              controller: 'confirmMessageCtrl',
              size: 'sm',
              resolve: {
                Message: function () {
                  return 'lang_msg_confirm_remove_profile';
                }
              }
            });

            modalInstance.result.then(function () {
              // if (!angular.equals(pageData.VA[$scope.presetTypeData.SelectedPreset], $scope.VA[$scope.presetTypeData.SelectedPreset])) {
              //   if ($scope.presetTypeData.SelectedPreset > 0) {
              //     setPresetVideoAnalysis($scope.presetTypeData.SelectedPreset, promises);
              //   } else {
              //     setVideoAnalysis(promises);
              //   }
              // }

              var handoverList = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
              if (userIndexArray.length === $scope.HandoverUserMax) {
                promise = function () {
                  return removeUserFromHandover(
                    handoverList[areaIndex].ROIIndex, 
                    null, 
                    $scope.presetTypeData.SelectedPreset
                  );
                };
              } else {
                promise = function () {
                  return removeUserFromHandover(
                    handoverList[areaIndex].ROIIndex, 
                    userIndexArray, 
                    $scope.presetTypeData.SelectedPreset
                  );
                };
              }

              promises.push(promise);

              $q.seqAll(promises).then(function () {
                var promises2 = [];
                if ($scope.presetTypeData.SelectedPreset > 0) {
                  promises2.push(getPresetHandoverList);
                } else {
                  promises2.push(getHandoverList);
                }
                $q.seqAll(promises2).then(function () {
                  viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                }, function (errorData2) {});
              }, function (errorData) {
                //alert(errorData);
              });
            }, function () {

            });
          }
        }
      }
    }

    $scope.addHandover = function () {
      var prevIsSelectedIncludeIndex = $scope.isSelectedIncludeIndex;

      var functionlist = [];
      functionlist.push(function () {
        var setHandoverListTimeout = 200;
        return $timeout(function () {
          setHandoverList();
        }, setHandoverListTimeout);
      });
      functionlist.push(function () {
        return addHandoverFunction(prevIsSelectedIncludeIndex);
      });
      $q.seqAll(functionlist).then(
        function () {},
        function (errorData) {
          console.log(errorData);
        }
      );
    };


    var modalInstance = null;

    function addHandoverFunction(prevIsSelectedIncludeIndex) {
      var promises = [];
      //        var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);
      //        var areaIndex = $scope.isSelectedIncludeIndex - 1;
      $scope.isSelectedIncludeIndex = prevIsSelectedIncludeIndex;
      var areaIndex = prevIsSelectedIncludeIndex - 1;

      if (modalInstance !== null) {
        modalInstance.dismiss();
      }
      modalInstance = $uibModal.open({
        templateUrl: 'views/setup/common/handoverAddCamera.html',
        controller: 'handoverAddCameraCtrl',
        resolve: {
          HandoverList: function () {
            //console.log(" ::: $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList", $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList);
            return $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
          },
          SelectedArea: function () {
            //console.log(" ::: areaIndex", areaIndex);
            return areaIndex;
          }
        }
      });

      var gUserList = [];
      modalInstance.result.then(function (returnValue) {
        modalInstance = null;
        //console.log(" ::: returnValue, userList", returnValue[0],returnValue[1]);
        gUserList = returnValue[1];
        setEnable().then(function () {
          getHandoverList(function () {
            try {
              var handoverList = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
              handoverList[$scope.findHandoverIndex()].UserList.push(gUserList);
            } catch (err) {
              console.error(err);
            }

            if (returnValue) {
              if (
                !angular.equals(
                  pageData.VA[$scope.presetTypeData.SelectedPreset], 
                  $scope.VA[$scope.presetTypeData.SelectedPreset]
                )
              ) {
                // if ($scope.presetTypeData.SelectedPreset > 0) {
                //   setPresetVideoAnalysis($scope.presetTypeData.SelectedPreset, promises);
                // } else {
                //   setVideoAnalysis(promises);
                // }
                $q.seqAll(promises).then(function () {
                  var promises2 = [];
                  promises2.push(function () {
                    return addUserToHandover(
                      areaIndex + 1, 
                      $scope.presetTypeData.SelectedPreset, 
                      gUserList
                    );
                  });
                  $q.seqAll(promises2).then(function () {
                    var promises3 = [];
                    if ($scope.presetTypeData.SelectedPreset > 0) {
                      promises3.push(getPresetHandoverList);
                    } else {
                      promises3.push(getHandoverList);
                    }
                    $q.seqAll(promises3).then(function () {
                      viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                    }, function (errorData3) {
                      //alert(errorData);
                    });
                  }, function (errorData2) {
                    //alert(errorData);
                  });
                }, function (errorData) {
                  //alert(errorData);
                });

              } else {
                promises.push(function () {
                  return addUserToHandover(
                    areaIndex + 1, 
                    $scope.presetTypeData.SelectedPreset, 
                    gUserList
                  );
                });
                $q.seqAll(promises).then(function () {
                  var promises3 = [];
                  if ($scope.presetTypeData.SelectedPreset > 0) {
                    promises3.push(getPresetHandoverList);
                  } else {
                    promises3.push(getHandoverList);
                  }
                  $q.seqAll(promises3).then(function () {
                    var isPreset = false;
                    if ($scope.PTZModel) {
                      var presetType = 
                        $scope.checkAutoSubmit ? 
                        $scope.presetData.oldType : $scope.presetData.type;
                      if (presetType === "Preset") {
                        isPreset = true;
                      }
                    }

                    getMotionDetectionData(
                      function (response) {
                        if (isPreset) {
                          var presetList = response.data.PresetVideoAnalysis[0].Presets;
                          var i = 0;
                          for (i = 0; i < presetList.length; i++) {
                            if (presetList[i].Preset === $scope.presetData.preset) {
                              break;
                            }
                          }

                          updateROIData(presetList[i].ROIs);
                          viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                        } else {
                          updateROIData(response.data.VideoAnalysis[0].ROIs);
                          viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                        }
                      },
                      isPreset
                    );
                  }, function (errorData3) {
                    //alert(errorData);
                  });
                }, function (errorData2) {
                  //alert(errorData);
                });
              }
            }
          });
        });
      }, function () {
        modalInstance = null;
        //$log.info('Modal dismissed at: ' + new Date());
      });
    }

    function getHandoverListIndex() {
      var handoverListIndex = null;
      var handoverList = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
      for (var i = 0, ii = handoverList.length; i < ii; i++) {
        var self = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i];
        try {
          if ("ROIIndex" in self) {
            if ($scope.isSelectedIncludeIndex === self.ROIIndex) {
              handoverListIndex = i;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      return handoverListIndex;
    }

    $scope.SelectAll = function () {
      if (typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList !== 'undefined') {
        var checkboxValue = false;

        if ($("#CheckAllId").is(":checked")) {
          checkboxValue = true;
        }

        //var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);
        var handoverListIndex = getHandoverListIndex();

        var handoverList = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
        var userList = handoverList[handoverListIndex].UserList;
        for (var i = 0; i < userList.length; i++) {
          userList[i].SelectedHandoverIndex = checkboxValue;
        }
      }
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////
    $scope.isOccupied = function () {
      var returnValue = 0;
      var idx = 0;
      if ($scope.activeTab.title === 'Include') {
        for (idx = 0; idx < $scope.selectInclude.length; idx++) {
          if (typeof $scope.selectInclude[idx].Coordinates !== "undefined") {
            returnValue++;
          }
        }
      }
      if ($scope.activeTab.title === 'Exclude') {
        for (idx = 0; idx < $scope.selectExclude.length; idx++) {
          if (typeof $scope.selectExclude[idx].Coordinates === "undefined") {
            returnValue++;
          }
        }
      }
      return returnValue;
    };

    $scope.findHandoverIndex = function () {
      var handoverList = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
      for (var i = 0; i < handoverList.length; i++) {
        if (handoverList[i].ROIIndex === $scope.isSelectedIncludeIndex) {
          return i;
        }
      }
      return -1;
    };

    function getPresetList() {
      var deferred = $q.defer();
      if ((!$scope.PTZModel) || $scope.presetData.preset !== null) {
        deferred.resolve();
      } else {
        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', '',
          function (response) {
            var data = response.data.PTZPresets[0].Presets;
            $scope.presetList = [];
            if (data) {
              for (var i = 0; i < data.length; i++) {
                $scope.presetList[i] = {
                  Preset: data[i].Preset,
                  Name: data[i].Name,
                  Text: data[i].Preset + ' : ' + data[i].Name
                };
              }
            }

            getSelectedPreset();
            deferred.resolve();
          },
          function (errorData) {
            if (errorData !== "Configuration Not Found") {
              console.log(errorData);
            } else {
              $scope.presetList = [];
            }
            deferred.resolve();
          }, '', true);
      }

      return deferred.promise;
    }

    function getSelectedPreset() {
      if (!(typeof mAttr.DefaultPresetNumber === "undefined" || !mAttr.DefaultPresetNumber)) {
        var isCheck = false;
        for (var i = 0; i < $scope.presetList.length; i++) {
          var Preset = $scope.presetList[i].Preset;
          if (mAttr.DefaultPresetNumber === parseInt(Preset, 10)) {
            $scope.presetData.preset = Preset;
            isCheck = true;
            break;
          }
        }
        if (!isCheck) {
          $scope.presetData.preset = 0;
        }

        $scope.presetData.type = 'Preset';

        Attributes.setDefaultPresetNumber(0);
      } else {
        $scope.presetData.type = 'Global';
        if ($scope.presetList.length !== 0) {
          $scope.presetData.preset = $scope.presetList[0].Preset;
        }
      }
    }

    function changePresetType(newVal, oldVal) {
      if (newVal === 'Global') {
        return gotoPreset('Stop', $scope.presetData.preset);
      } else {
        return gotoPreset('Start', $scope.presetData.preset);
      }
    }

    $scope.$watch('presetData.type', function (newVal, oldVal) {
      if (oldVal === null) {
        $scope.presetData.oldType = newVal;
        if (newVal === "Preset") {
          changePresetType(newVal);
        }
      } else {
        $scope.presetData.oldType = oldVal;

        if ($scope.MotionDetection.MotionDetectionEnable === true) {
          if (validatePage()) {
            $rootScope.$emit('changeLoadingBar', true);
            sketchbookService.removeDrawingGeometry();
            saveSettings('Auto').finally(
              function () {
                changePresetType(newVal, oldVal);
              }
            );
          }
        } else {
          changePresetType(newVal, oldVal).finally(view);
        }
      }
    });

    function changePreset(newVal, oldVal) {
      return gotoPreset('Start', newVal, true, oldVal);
    }

    $scope.$watch('presetData.preset', function (newVal, oldVal) {
      if (oldVal === null) {
        $scope.presetData.oldPreset = newVal;
      } else {
        $scope.presetData.oldType = 'Preset';
        $scope.presetData.oldPreset = oldVal;

        if ($scope.MotionDetection.MotionDetectionEnable === true) {
          if (validatePage()) {
            $rootScope.$emit('changeLoadingBar', true);
            sketchbookService.removeDrawingGeometry();
            saveSettings('Auto').finally(
              function () {
                changePreset(newVal, oldVal);
              }
            );
          }
        } else {
          changePreset(newVal, oldVal).finally(view);
        }
      }
    });

    function setPreset(mode, preset) {
      var setData = {};
      setData.Channel = 0;
      setData.ImagePreview = mode;
      setData.Preset = preset;

      return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
        function (response) {},
        function (errorData) {},
        '', true);
    }

    function gotoPreset(mode, preset, isChange, oldPreset) {
      var deferred = $q.defer();
      var promises = [];

      if (mode === 'Stop') {
        promises.push(
          function () {
            return setPreset(mode, preset);
          }
        );
      } else {
        if (isChange) {
          promises.push(
            function () {
              return setPreset('Stop', oldPreset);
            }
          );
        }
        promises.push(
          function () {
            return setPreset(mode, preset);
          }
        );
      }

      $q.seqAll(promises).finally(
        function () {
          deferred.resolve();
        }
      );

      return deferred.promise;
    }

    function addPreset() {
      var setData = {};
      var presetIndex = $scope.presetData.preset - 1;
      setData.Preset = $scope.presetList[presetIndex].Preset;
      setData.Name = $scope.presetList[presetIndex].Name;

      return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add', setData,
        function (response) {},
        function (errorData) {},
        '', true);
    }
  });