kindFramework.controller('ivaCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, sketchbookService, $rootScope, $q) {
    "use strict";
    /*jshint sub:true*/
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    pageData.VA = [];
    $scope.VA = [];
    $scope.presetTypeData = {};
    $scope.presetTypeData.PresetIndex = 0;
    $scope.presetTypeData.SelectedPreset = 0;
    $scope.presetTypeData.SelectedPresetType = 0;
    $scope.SelectedSizeType = 0;
    $scope.activeTab = {
        title: 'Virtual Line',
        active: true
    };
    $scope.analyticsType = "Entering";
    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.IPv6PatternStr = mAttr.IPv6PatternStr;
    $scope.OnlyNumStr = mAttr.OnlyNumStr;

    $scope.ivaDurationSliderProperty = {
        ceil: 100,
        floor: 1,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    
    $scope.tabs = [{
        title: 'Virtual Line',
        active: true
    }, {
        title: 'Virtual Area',
        active: false
    }, {
        title: 'Excluded Area',
        active: false
    }, {
        title: 'Common',
        active: false
    }];

    $scope.commonConfigTab = {
        title: 'Common Config',
        active: false
    };

    $scope.tempDuration = ['Off', 'Always', '10s', '15s'];
    $scope.IntelligentVideoEnable = false;
    $scope.changeEnable = function(val){
        $scope.IntelligentVideoEnable = val;
    };
    $scope.includeTableData = null;
    $scope.excludeTableData = null;
    $scope.lineTableData = null;
    $scope.currentTableData = null;
    $scope.analyticEnableOptions = [{
        index: null,
        title: 'Entering',
        isEnabled: false,
        isSet: false
    }, {
        index: null,
        title: 'Exiting',
        isEnabled: false,
        isSet: false
    }, {
        index: null,
        title: 'AppearingDisappearing',
        isEnabled: false,
        isSet: false
    }, {
        index: null,
        title: 'Intrusion',
        isEnabled: false,
        isSet: false
    }, {
        index: null,
        title: 'Loitering',
        isEnabled: false,
        isSet: false
    }];
    $scope.passingEnableOption = {
        index: null,
        title: 'Passing',
        isEnabled: false,
        isSet: false
    };
    $scope.currentAnalyticEnableOption = $scope.analyticEnableOptions[0];
    $scope.currentTableDataIndex = 0;

    $scope.virtualAreaMode = {};

    $scope.virtualLineMode = {};

    $scope.accordionAlreadyCreated = false;

    $scope.minSizeData = {};
    $scope.maxSizeData = {};

    $scope.currentSelectedLineColumn = null;
    $scope.currentSelectedIncludeColumn = null;
    $scope.currentSelectedExcludeColumn = null;

    $scope.VideoAnalysis2Support = false;

    $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis';

    $scope.previousTab = null;

    var LINE_MODE = {
        RIGHT: 'Right',
        LEFT: 'Left',
        OFF: 'Off',
        BOTH: 'BothDirections'
    };

    function getCommonCmd(){
        if($scope.VideoAnalysis2Support !== undefined && $scope.VideoAnalysis2Support === true){
            $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis2';
        } else {
            $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis';
        }
    }

    function resetVirtualAreaMode(){
        $scope.virtualAreaMode = {
            defindAreasIndex: null,
            instrusion: null,
            enter: null,
            exit: null,
            appearDisappear: null,
            appearanceDuration: null,
            loitering: null,
            loiteringDuration: null
        };

        changeSliderState(true);
    }

    function resetVirtualLineMode(){
        $scope.virtualLineMode = {
            lineIndex: null,
            passing: null,
            right: null,
            left: null,
            both: null
        };
    }

    function setVirtualLineMode(index){
        var lineIndex = findLinesIndex(index);
        var line = $scope.VA[0].Lines[lineIndex];
        $scope.virtualLineMode.lineIndex = lineIndex;
        if(line.Coordinates.length > 0) {
            $scope.virtualLineMode.passing = true;
            if(line.Mode.indexOf(LINE_MODE.OFF) > -1) {
                $scope.virtualLineMode.passing = false;
                $scope.virtualLineMode.right = false;
                $scope.virtualLineMode.left = false;
                $scope.virtualLineMode.both = false;
                $scope.virtualLineMode.currentDirection = 'off';
                $scope.virtualLineMode.passing = false;
            } else if(line.Mode.indexOf(LINE_MODE.RIGHT) > -1 && (line.Mode.indexOf(LINE_MODE.LEFT) === -1)){
                $scope.virtualLineMode.right = true;
                $scope.virtualLineMode.left = false;
                $scope.virtualLineMode.both = false;
                $scope.virtualLineMode.currentDirection = 'right';
            } else if(line.Mode.indexOf(LINE_MODE.LEFT) > -1 && (line.Mode.indexOf(LINE_MODE.RIGHT) === -1)){
                $scope.virtualLineMode.right = false;
                $scope.virtualLineMode.left = true;
                $scope.virtualLineMode.both = false;
                $scope.virtualLineMode.currentDirection = 'left';
            } else if(line.Mode.indexOf(LINE_MODE.BOTH) > -1){
                $scope.virtualLineMode.right = true;
                $scope.virtualLineMode.left = true;
                $scope.virtualLineMode.both = true;
                $scope.virtualLineMode.currentDirection = 'both';
            }
        }
    }

    function setVirtualAreaMode(index){
        changeSliderState(false);

        var defindAreaIndex = findAreasIndex(index);
        var definedArea = $scope.VA[0].DefinedAreas[defindAreaIndex];
        var modes = definedArea.Mode;

        $scope.virtualAreaMode.defindAreasIndex = angular.copy(defindAreaIndex);
        
        if(definedArea.AppearanceDuration === 0){
            $scope.virtualAreaMode.appearanceDuration = 10;
        }else{
            $scope.virtualAreaMode.appearanceDuration = parseInt(definedArea.AppearanceDuration);   
        }

        if(definedArea.LoiteringDuration === 0){
            $scope.virtualAreaMode.loiteringDuration = 10;
        }else{
            $scope.virtualAreaMode.loiteringDuration = parseInt(definedArea.LoiteringDuration);   
        }

        if(modes.indexOf("AppearDisappear") > -1){
            $scope.virtualAreaMode.appearDisappear = true;
        }else{
            $scope.virtualAreaMode.appearDisappear = false;
        }
        if(modes.indexOf("Entering") > -1){
            $scope.virtualAreaMode.enter = true;
        }else{
            $scope.virtualAreaMode.enter = false;
        }
        if(modes.indexOf("Exiting") > -1){
            $scope.virtualAreaMode.exit = true;
        }else{
            $scope.virtualAreaMode.exit = false;
        }
        if(modes.indexOf("Intrusion") > -1){
            $scope.virtualAreaMode.instrusion = true;
        }else{
            $scope.virtualAreaMode.instrusion = false;
        }
        if(modes.indexOf("Loitering") > -1){
            $scope.virtualAreaMode.loitering = true;
        }else{
            $scope.virtualAreaMode.loitering = false;
        }

        $scope.aSliderModel = {
            data: $scope.virtualAreaMode.appearanceDuration
        };

        $scope.lSliderModel = {
            data: $scope.virtualAreaMode.loiteringDuration
        };
    }

    $scope.changeVirtualLineMode = function(flag){
        var mode = null;
        if(flag === 'right') {
            $scope.virtualLineMode.right = true;
            $scope.virtualLineMode.left = false;
            $scope.virtualLineMode.both = false;
            mode = LINE_MODE.RIGHT;
            $scope.virtualLineMode.currentDirection = 'right';
            sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'R');
        } else if(flag === 'left') {
            $scope.virtualLineMode.right = false;
            $scope.virtualLineMode.left = true;
            $scope.virtualLineMode.both = false;
            mode = LINE_MODE.LEFT;
            $scope.virtualLineMode.currentDirection = 'left';
            sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'L');
        } else if(flag === 'both') {
            $scope.virtualLineMode.right = false;
            $scope.virtualLineMode.left = false;
            $scope.virtualLineMode.both = true;
            mode = LINE_MODE.BOTH;
            $scope.virtualLineMode.currentDirection = 'both';
            sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'LR');
        } else { // crossing checkbox changed
            if($scope.virtualLineMode.passing) { // temporarily default right
                if($scope.virtualLineMode.right) {
                    mode = LINE_MODE.RIGHT;
                    $scope.virtualLineMode.currentDirection = 'right';
                    sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'R');
                } else if($scope.virtualLineMode.left) {
                    mode = LINE_MODE.LEFT;
                    $scope.virtualLineMode.currentDirection = 'left';
                    sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'L');
                } else if($scope.virtualLineMode.both) {
                    mode = LINE_MODE.BOTH;
                    $scope.virtualLineMode.currentDirection = 'both';
                    sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'LR');
                } else { //Default
                    $scope.virtualLineMode.right = true;
                    $scope.virtualLineMode.currentDirection = 'right';
                    mode = LINE_MODE.RIGHT;
                    sketchbookService.changeArrow($scope.currentSelectedLineColumn, 'R');
                }
            } else {
                mode = LINE_MODE.OFF;
            }console.info(mode);
        }

        var lineIndex = findLinesIndex($scope.currentSelectedLineColumn + 1);
        var line = $scope.VA[0].Lines[lineIndex];
        line.Mode = mode;
        $scope.VA[0].Lines[lineIndex] = line;
    };

    $scope.changeVirtualAreaMode = function(){
        var defindAreasIndex = $scope.virtualAreaMode.defindAreasIndex;
        if(defindAreasIndex === null) {return;}
        var mode = [];

        $scope.VA[0].DefinedAreas[defindAreasIndex].AppearanceDuration = $scope.virtualAreaMode.appearanceDuration;
        $scope.VA[0].DefinedAreas[defindAreasIndex].LoiteringDuration = $scope.virtualAreaMode.loiteringDuration;

        if($scope.virtualAreaMode.appearDisappear === true){
            mode.push("AppearDisappear");
        }
        if($scope.virtualAreaMode.enter === true){
            mode.push("Entering");
        }
        if($scope.virtualAreaMode.exit === true){
            mode.push("Exiting");
        }
        if($scope.virtualAreaMode.instrusion === true){
            mode.push("Intrusion");
        }
        if($scope.virtualAreaMode.loitering === true){
            mode.push("Loitering");
        }

        $scope.VA[0].DefinedAreas[defindAreasIndex].Mode = mode;
    };

    function changeSliderState(stateType){
        $scope.sliderOptions.disabled = stateType;
        refreshSensitivitySlider();
    }

    function refreshSensitivitySlider(){
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');
        });
    }

    $scope.selectColumn = function(target){
        var index = target;
        if(index === undefined || index === null) {
            index = 0;
        }
        if(
            $scope.currentTableData[index] === undefined ||
            $scope.currentTableData[index].isEnabled === null ||
            $scope.currentTableData[index].isEnabled === undefined 
            ){
            return;
        }

        $timeout(function(){
            for(var i = 0, ii = $scope.currentTableData.length; i < ii; i++){
                var isSelected = i === index ? true : false;
                $scope.currentTableData[i].isSelected = isSelected;
            }

            activeShape(index);

            if($scope.activeTab.title === "Virtual Area"){
                setVirtualAreaMode(index + 1);
                $scope.currentSelectedIncludeColumn = index;
            } else if($scope.activeTab.title === "Virtual Line"){
                setVirtualLineMode(index + 1);
                $scope.currentSelectedLineColumn = index;
            } else if($scope.activeTab.title === "Excluded Area"){
                $scope.currentSelectedExcludeColumn = index;
            }
        });
    };

    function activeShape(index){
        sketchbookService.activeShape(index);
    }

    $scope.IncreaseSlider = function (key){
        if($scope.sliderOptions.disabled) return;

        if ($scope.virtualAreaMode[key] < $scope.sliderOptions.ceil){
            $scope.virtualAreaMode[key]++;
            refreshSensitivitySlider();
        }
    };

    $scope.DecreaseSlider = function (key){
        if($scope.sliderOptions.disabled) return;

        if ($scope.virtualAreaMode[key] > $scope.sliderOptions.floor){
            $scope.virtualAreaMode[key]--;
            refreshSensitivitySlider();
        }
    };

    $scope.sizeCoordinateChange = function (flag){
        flag = parseInt(flag);
        var maxWidth = null;
        var maxHeight = null;
        var minWidth = null;
        var minHeight = null;

        minWidth = parseInt($scope.VA[0].MinWidth);
        minHeight = parseInt($scope.VA[0].MinHeight);
        maxWidth = parseInt($scope.VA[0].MaxWidth);
        maxHeight = parseInt($scope.VA[0].MaxHeight);

        if(minWidth > maxWidth || minHeight > maxHeight) { // min size must be small than max size
            $scope.VA[0].MinWidth = $scope.prevMinWidth;
            $scope.VA[0].MinHeight = $scope.prevMinHeight;
            $scope.VA[0].MaxWidth = $scope.prevMaxWidth;
            $scope.VA[0].MaxHeight = $scope.prevMaxHeight;
            return;
        }
        if(flag === 0) { // min
            if(sketchbookService.changeMinSizeOption(minWidth, minHeight) === false){
                $scope.VA[0].MinHeight = $scope.prevMinHeight;
                $scope.VA[0].MinWidth = $scope.prevMinWidth;
                sketchbookService.changeRectangleToSize(0, $scope.prevMinWidth, $scope.prevMinHeight);
                $scope.$apply();
                return;
            }

            $scope.VA[0].MinWidth = minWidth;
            $scope.VA[0].MinHeight = minHeight;

            sketchbookService.changeRectangleToSize(0, minWidth, minHeight);

            $scope.prevMinWidth = minWidth;
            $scope.prevMinHeight = minHeight;
        } else if(flag === 1) { // max
            if(sketchbookService.changeMaxSizeOption(maxWidth, maxHeight) === false){
                $scope.VA[0].MaxHeight = $scope.prevMaxHeight;
                $scope.VA[0].MaxWidth = $scope.prevMaxWidth;
                sketchbookService.changeRectangleToSize(1, $scope.prevMaxWidth, $scope.prevMaxHeight);
                $scope.$apply();
                return;
            }

            $scope.VA[0].MaxWidth = maxWidth;
            $scope.VA[0].MaxHeight = maxHeight;

            sketchbookService.changeRectangleToSize(1, maxWidth, maxHeight);

            $scope.prevMaxWidth = maxWidth;
            $scope.prevMaxHeight = maxHeight;
        }

        convertSizeCoordinates(null);
    };  

    $scope.onPresetChange = function(Preset) {
        $scope.presetTypeData.SelectedPreset = parseInt(Preset) + 1;
        $scope.changeCurrentTab($scope.tabs[0]);
        for (var i = 1; i < $scope.tabs.length; i++) {
            $scope.tabs[i].active = false;
        }
    };
    $scope.onPresetTypeChange = function(Type) {
        if (Type === 'Global') {
            $scope.presetTypeData.SelectedPreset = 0;
        } else {
            $scope.presetTypeData.SelectedPreset = 1;
            $scope.presetTypeData.PresetIndex = 0;
            gotoPreset();
        }
        $scope.changeCurrentTab($scope.tabs[0]);
        for (var i = 1; i < $scope.tabs.length; i++) {
            $scope.tabs[i].active = false;
        }
    };
    $scope.$watch('presetTypeData.SelectedPreset', function(newVal, oldVal) {
        if (newVal > 0) gotoPreset();
    });

    var maxLine = 8;

    function gotoPreset() {
        if ($scope.presetTypeData.SelectedPresetType === 0) return;
        var getData = {};
        getData.Channel = 0;
        if ($scope.VA.length > 1 && typeof $scope.VA[$scope.presetTypeData.SelectedPreset].Preset !== 'undefined') {
            getData.Preset = $scope.VA[$scope.presetTypeData.SelectedPreset].Preset;
        } else {
            var Preset = $scope.PresetNameValueOptions[$scope.presetTypeData.PresetIndex].split(' : ');
            getData.Preset = parseInt(Preset[0]);
        }
        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control', getData, function(response) {}, function(errorData) {
            console.log(errorData);
        }, '', true);
    }
    $scope.getDisableStatus = function(type) {
        if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined' && $scope.VA[$scope.presetTypeData.SelectedPreset].DetectionType === "Off") {
            return true;
        } else if (type === "Analytics" && typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined' && $scope.VA[$scope.presetTypeData.SelectedPreset].DetectionType === "MotionDetection") {
            return true;
        }
        /* else if (type === "Area" && typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined' && $scope.VA[$scope.presetTypeData.SelectedPreset].DetectionType === "IntelligentVideo")
         {
         return true;
         }
         */
        return false;
    };
    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };
    $scope.getMinWidthArray = function() {
        if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined') {
            return COMMONUtils.getArrayWithMinMax($scope.VA[$scope.presetTypeData.SelectedPreset].MinWidthMin, $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth);
        }
    };
    $scope.getMinHeightArray = function() {
        if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined') {
            return COMMONUtils.getArrayWithMinMax($scope.VA[$scope.presetTypeData.SelectedPreset].MinHeightMin, $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight);
        }
    };
    $scope.getMaxWidthArray = function() {
        if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined') {
            return COMMONUtils.getArrayWithMinMax($scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth, $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidthMax);
        }
    };
    $scope.getMaxHeightArray = function() {
        if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== 'undefined') {
            return COMMONUtils.getArrayWithMinMax($scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight, $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeightMax);
        }
    };

    function getSliderColor(){
        return mAttr.sliderEnableColor;
    }

    function getAttributes() {
        $scope.VideoAnalysis2Support = mAttr.VideoAnalysis2Support;
        $scope.MotionDetectionOverlay = mAttr.MotionDetectionOverlay;
        $scope.isPTZModel = mAttr.PTZModel;
        if($scope.isPTZModel === undefined) {
            $scope.isPTZModel = false;
        }
        $scope.HttpMaxPort = mAttr.Http.maxValue;
        if (mAttr.PresetTypes !== undefined) {
            $scope.PresetTypes = mAttr.PresetTypes;
        }
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        if (mAttr.EnableOptions !== undefined) {
            $scope.EnableOptions = mAttr.EnableOptions;
        }
        if (mAttr.ActivateOptions !== undefined) {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }
        if (mAttr.WeekDays !== undefined) {
            $scope.WeekDays = mAttr.WeekDays;
        }
        if (mAttr.MotionDetectSensitivityTypes !== undefined) {
            $scope.SensitivityTypes = mAttr.MotionDetectSensitivityTypes;
        }
        if (mAttr.MotionDetectModes !== undefined) {
            $scope.MotionDetectModes = ["Off", "IntelligentVideo"];
        }
        if (mAttr.ROIType !== undefined) {
            $scope.ROIType = mAttr.ROIType;
        }
        if (mAttr.VideoAnalyticTypes !== undefined) {
            $scope.VideoAnalyticTypes = ['Passing', 'Entering', 'Exiting', 'AppearDisappear', 'Intrusion', 'Loitering'];
            $scope.VideoAnalyticTypes.shift();
            $scope.LineAnalyticTypes = ['Passing'];
        }
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        $scope.sliderOptions = {
            showInputBox : true,
            floor: mAttr.AppearanceDuration.minValue,
            ceil: mAttr.AppearanceDuration.maxValue,
            vertical: false,
            disabled: true,
            showSelectionBar: true,
            onEnd: function(){}
        };

        $scope.aSliderModel = {
            data: 10
        };

        $scope.lSliderModel = {
            data: 10
        };

        $scope.$watch('aSliderModel.data', function(newValue, oldValue) {
            if(newValue && newValue !== oldValue)
            {
                if($scope.virtualAreaMode !== undefined)
                {
                    $scope.virtualAreaMode.appearanceDuration = $scope.aSliderModel.data;
                    $scope.changeVirtualAreaMode();
                }
            }
        },true);

        $scope.$watch('lSliderModel.data', function(newValue, oldValue) {
            if(newValue && newValue !== oldValue)
            {
                if($scope.virtualAreaMode !== undefined)
                {
                    $scope.virtualAreaMode.loiteringDuration = $scope.lSliderModel.data;
                    $scope.changeVirtualAreaMode();
                }
            }
        },true);

        $scope.DetectionResultOverlay = mAttr.DetectionResultOverlay;
        $scope.DisplayRules = mAttr.DisplayRules;
        
        for (var i = 0; i < mAttr.EventSourceOptions.length; i++) {
            if (mAttr.EventSourceOptions[i].EventSource === 'VideoAnalysis') {
                $scope.EventSourceOption = mAttr.EventSourceOptions[i];
                break;
            }
        }
        $scope.EventActions = COMMONUtils.getSupportedEventActions("VideoAnalysis");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    }

    function getSelectedPreset() {
        if (typeof mAttr.DefaultPresetNumber === 'undefined' || !mAttr.DefaultPresetNumber) {
            $scope.presetTypeData.PresetIndex = 0;
            $scope.presetTypeData.SelectedPreset = 0;
            $scope.presetTypeData.SelectedPresetType = 0;
        } else {
            var isCheck = false;
            for (var i = 0; i < $scope.PresetNameValueOptions.length; i++) {
                var Preset = $scope.PresetNameValueOptions[i].split(' : ');
                if (mAttr.DefaultPresetNumber === parseInt(Preset[0])) {
                    $scope.presetTypeData.PresetIndex = i;
                    $scope.presetTypeData.SelectedPreset = i + 1;
                    isCheck = true;
                    break;
                }
            }
            if (!isCheck) {
                $scope.presetTypeData.PresetIndex = 0;
                $scope.presetTypeData.SelectedPreset = 1;
            }
            $scope.presetTypeData.SelectedPresetType = 1;
            Attributes.setDefaultPresetNumber(0);
        }
    }

    function prepareEventRules(eventRules) {
        $scope.EventRule = {};
        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;
        //$scope.EventRule.Enable = eventRules[0].Enable;
        $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;
        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));
        $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;
        if (typeof eventRules[0].EventAction !== 'undefined') {
            if (eventRules[0].EventAction.indexOf('FTP') !== -1) {
                $scope.EventRule.FtpEnable = true;
            }
            if (eventRules[0].EventAction.indexOf('SMTP') !== -1) {
                $scope.EventRule.SmtpEnable = true;
            }
            if (eventRules[0].EventAction.indexOf('Record') !== -1) {
                $scope.EventRule.RecordEnable = true;
            }
        }
        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[0].AlarmOutputs === 'undefined') {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                var duration = 'Off';
                for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++) {
                    if ((ao + 1) === eventRules[0].AlarmOutputs[j].AlarmOutput) {
                        duration = eventRules[0].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }
        if (typeof eventRules[0].PresetNumber === 'undefined') {
            $scope.EventRule.PresetNumber = 'Off';
        } else {
            $scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
        }
        pageData.EventRule = angular.copy($scope.EventRule);
    }


    function getVideoAnalysis(detectionType) {
        var getData = {};

        if (detectionType) {
            getData.DetectionType = detectionType;
        } else {
            getData.DetectionType = "IntelligentVideo";
        }

        return SunapiClient.get($scope.va2CommonCmd + '&action=view', getData, function(response) {
            var videoAnalysis = response.data.VideoAnalysis[0];

            if(!("DefinedAreas" in videoAnalysis)){
                videoAnalysis.DefinedAreas = [];
            }

            if(!("Lines" in videoAnalysis)){
                videoAnalysis.Lines = [];
            }

            $scope.VA[0] = videoAnalysis;
            $scope.orgDetectionType = $scope.VA[0].DetectionType;
            if (detectionType) {
                $scope.VA[0].DetectionType = detectionType;
            } else {
                if($scope.orgDetectionType === "MotionDetection" || $scope.orgDetectionType === "Off") {
                    // $scope.VA[0].DetectionType = "Off"
                    $scope.IntelligentVideoEnable = false;
                } else if($scope.orgDetectionType === "MDAndIV" || $scope.orgDetectionType === "IntelligentVideo"){
                    // $scope.VA[0].DetectionType = orgDetectionType;
                    $scope.IntelligentVideoEnable = true;
                }
            }
            var str = response.data.VideoAnalysis[0].ObjectSizeByDetectionTypes[1].MinimumObjectSizeInPixels.split(',');
            $scope.VA[0].MinWidth = Math.round(str[0]);
            $scope.VA[0].MinHeight = Math.round(str[1]);
            var str = response.data.VideoAnalysis[0].ObjectSizeByDetectionTypes[1].MaximumObjectSizeInPixels.split(',');
            $scope.VA[0].MaxWidth = Math.round(str[0]);
            $scope.VA[0].MaxHeight = Math.round(str[1]);
            $scope.VA[0].MinWidthMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Width; // eventsourceoption is undefined !
            $scope.VA[0].MinWidthMax = $scope.VA[0].MaxWidth;
            $scope.VA[0].MinHeightMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Height;
            $scope.VA[0].MinHeightMax = $scope.VA[0].MaxHeight;
            $scope.VA[0].MaxWidthMin = $scope.VA[0].MinWidth;
            $scope.VA[0].MaxWidthMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Width;
            $scope.VA[0].MaxHeightMin = $scope.VA[0].MinHeight;
            $scope.VA[0].MaxHeightMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Height;
            if($scope.VA[0].SensitivityLevel <= 0) {
                $scope.VA[0].SensitivityLevel = 80;
                $scope.ivaDurationSliderModel = {
                    data : $scope.VA[0].SensitivityLevel
                };
            } else {
                $scope.ivaDurationSliderModel = {
                    data: $scope.VA[0].SensitivityLevel
                };
            }
            // setInitialObjectSize();
            pageData.VA[0] = angular.copy($scope.VA[0]);
            pageData.VA[0].IntelligentVideoEnable = $scope.IntelligentVideoEnable;
        }, function(errorData) {
            //alert(errorData);
        }, '', true);
    }

    function setInitialObjectSize() {
        $scope.minHeightLimit = Math.ceil(mAttr.MaxROICoordinateY * 0.022);
        $scope.minWidthLimit = $scope.minHeightLimit;
        $scope.maxWidthLimit = Math.ceil(mAttr.MaxROICoordinateX) + 1;
        $scope.maxHeightLimit = Math.ceil(mAttr.MaxROICoordinateY) + 1;

        if($scope.rotate !== "0") {
            var temp;
            temp = $scope.maxWidthLimit;
            $scope.maxWidthLimit = $scope.maxHeightLimit;
            $scope.maxHeightLimit = temp;
        }

        if($scope.VA[0].MinWidth !== $scope.minWidthLimit) {
            $scope.VA[0].MinWidth += 1;
        }
        if($scope.VA[0].MinHeight !== $scope.minWidthLimit) {
            $scope.VA[0].MinHeight += 1;
        }
        if($scope.VA[0].MaxWidth !== $scope.minWidthLimit) {
            $scope.VA[0].MaxWidth += 1;
        }
        if($scope.VA[0].MaxHeight !== $scope.minWidthLimit) {
            $scope.VA[0].MaxHeight += 1;
        }

        if($scope.VA[0].MinWidth < $scope.minWidthLimit) {
            $scope.VA[0].MinWidth = $scope.VA[0].MinWidthMin;
        }
        if($scope.VA[0].MinHeight < $scope.minHeightLimit) {
            $scope.VA[0].MinHeight = $scope.VA[0].MinHeightMin;
        }
        if($scope.VA[0].MaxWidth < $scope.minWidthLimit) { // $scope.VA[0].MaxWidthMin) {
            $scope.VA[0].MaxWidth = $scope.VA[0].MinWidth; // $scope.VA[0].MaxWidthMin;
        }
        if($scope.VA[0].MaxHeight < $scope.minHeightLimit) { // $scope.VA[0].MaxHeightMin) {
            $scope.VA[0].MaxHeight = $scope.VA[0].MinHeight; //$scope.VA[0].MaxHeightMin;
        }
        $scope.prevMinWidth = $scope.VA[0].MinWidth;
        $scope.prevMinHeight = $scope.VA[0].MinHeight;
        $scope.prevMaxWidth = $scope.VA[0].MaxWidth;
        $scope.prevMaxHeight = $scope.VA[0].MaxHeight;
        convertSizeCoordinates(null, null);
    }

    function convertSizeCoordinates(data, flag) {
        if(data === null) {
            $scope.minSizeData.Coordinates = [];
            $scope.minSizeData.Coordinates.push([0,0]);
            $scope.minSizeData.Coordinates.push([0,$scope.VA[0].MinHeight]);
            $scope.minSizeData.Coordinates.push([$scope.VA[0].MinWidth,$scope.VA[0].MinHeight]);
            $scope.minSizeData.Coordinates.push([$scope.VA[0].MinWidth,0]);
            $scope.maxSizeData.Coordinates = [];
            $scope.maxSizeData.Coordinates.push([0,0]);
            $scope.maxSizeData.Coordinates.push([0,$scope.VA[0].MaxHeight]);
            $scope.maxSizeData.Coordinates.push([$scope.VA[0].MaxWidth,$scope.VA[0].MaxHeight]);
            $scope.maxSizeData.Coordinates.push([$scope.VA[0].MaxWidth,0]);
        } else {
            var coordinates = data;
            if(flag === 'max') {
                $scope.maxSizeData.Coordinates = [];
                for(var i = 0; i < data.length; i++) {
                    $scope.maxSizeData.Coordinates.push([data[i].x,data[i].y]);
                }
            } else if(flag === 'min') {
                $scope.minSizeData.Coordinates = [];
                for(var i = 0; i < data.length; i++) {
                    $scope.minSizeData.Coordinates.push([data[i].x,data[i].y]);
                }
            }
        }
    }

    function getEventRules() {
        var getData = {};
        getData.EventSource = 'VideoAnalysis';
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
            prepareEventRules(response.data.EventRules);
        }, function(errorData) {
            //alert(errorData);
        }, '', true);
    }

    function sunapiQueueRequest(queue, successCallback, errorCallback){
        
        function reqCallback(){
            if(queue.length > 0){
                sunapiQueueRequest(queue, successCallback, errorCallback);
            }else{
                successCallback();
            }
        }

        var currentItem = queue.shift();
        if(currentItem === undefined) {return;}
        SunapiClient.get(
            currentItem.url, 
            currentItem.reqData, 
            function(response){

            }, 
            errorCallback, 
            '', 
            true
        ).then(reqCallback);
    }

    function setVideoAnalysis() {

        function getRemovedIndex(isArea){
            var obj = isArea ? "DefinedAreas" : "Lines";
            var indexKey = isArea ? "DefinedArea" : "Line";
            var removeIndexs = [];

            for(var i = 0, ii = pageData.VA[0][obj].length; i < ii; i++){
                var self = pageData.VA[0][obj][i];
                removeIndexs.push(self[indexKey]);
            }

            for(var i = 0, ii = $scope.VA[0][obj].length; i < ii; i++){
                var self = $scope.VA[0][obj][i];
                var pageDataLineIndex = removeIndexs.indexOf(self[indexKey]);
                if(pageDataLineIndex > -1){
                    removeIndexs.splice(pageDataLineIndex, 1);
                }
            }

            return removeIndexs;
        }

        var setData = {};
        var removeData = {};
        var queue = [];
        setData.Channel = 0;
        var isRemoved = 0;
        var isSetted = 0;
        var detectionType = getCurrentDetectionType();
        var pageDetectionType = pageData.VA[0].DetectionType;

        if (pageData.VA[0].DetectionResultOverlay !== $scope.VA[0].DetectionResultOverlay) {
            setData.DetectionResultOverlay = $scope.VA[0].DetectionResultOverlay;
            isSetted++;
        }

        if ($scope.IntelligentVideoEnable !== false) {
            if (pageData.VA[0].SensitivityLevel !== $scope.VA[0].SensitivityLevel) {
                setData.SensitivityLevel = $scope.VA[0].SensitivityLevel;
                isSetted++;
            }
            if (pageData.VA[0].DisplayRules !== $scope.VA[0].DisplayRules) {
                if ($scope.VA[0].DetectionType === "IntelligentVideo" || $scope.VA[0].DetectionType === "MDAndIV") {
                    setData.DisplayRules = $scope.VA[0].DisplayRules;
                    isSetted++;
                }
            }
            if (pageData.VA[0].ROIMode !== $scope.VA[0].ROIMode) {
                setData.ROIMode = $scope.VA[0].ROIMode;
                isSetted++;
            }
            if ((pageData.VA[0].MinWidth !== $scope.VA[0].MinWidth) || (pageData.VA[0].MinHeight !== $scope.VA[0].MinHeight)) {
                if($scope.VA[0].MinWidth !== $scope.minWidthLimit) {
                    $scope.VA[0].MinWidth -= 1;
                }
                if($scope.VA[0].MinHeight !== $scope.minWidthLimit) {
                    $scope.VA[0].MinHeight -= 1;
                }
                setData['DetectionType.IntelligentVideo.MinimumObjectSizeInPixels'] = $scope.VA[0].MinWidth + ',' + $scope.VA[0].MinHeight;
                isSetted++;
            }
            if ((pageData.VA[0].MaxWidth !== $scope.VA[0].MaxWidth) || (pageData.VA[0].MaxHeight !== $scope.VA[0].MaxHeight)) {
                if($scope.VA[0].MaxWidth !== $scope.minWidthLimit) {
                    $scope.VA[0].MaxWidth -= 1;
                }
                if($scope.VA[0].MaxHeight !== $scope.minWidthLimit) {
                    $scope.VA[0].MaxHeight -= 1;
                }
                setData['DetectionType.IntelligentVideo.MaximumObjectSizeInPixels'] = $scope.VA[0].MaxWidth + ',' + $scope.VA[0].MaxHeight;
                isSetted++;
            }
            //Passing
            if (!angular.equals(pageData.VA[0].Lines, $scope.VA[0].Lines)) {
                if ($scope.VA[0].Lines.length) {
                    for (var i = 0; i < $scope.VA[0].Lines.length; i++) {
                        var coor = [];

                        for (var j = 0, jLen = $scope.VA[0].Lines[i].Coordinates.length; j < jLen; j++) {
                            coor.push([
                                $scope.VA[0].Lines[i].Coordinates[j].x,
                                $scope.VA[0].Lines[i].Coordinates[j].y
                            ]);
                        }

                        var VA_Lines = coor.join(',');
                        var lineIndex = $scope.VA[0].Lines[i].Line;
                        setData["Line." + lineIndex + ".Coordinate"] = VA_Lines;
                        setData["Line." + lineIndex + ".Mode"] = $scope.VA[0].Lines[i].Mode;
                        // if (typeof $scope.VA[0].Lines[i].Mode[1] !== "undefined") {
                        //     setData["Line." + lineIndex + ".Mode"] += "," + $scope.VA[0].Lines[i].Mode[1];
                        // }


                        var removeIndex = getRemovedIndex(false);

                        if(removeIndex.length > 0){
                            removeData["LineIndex"] = removeIndex.join(',');
                            isRemoved++;
                        }
                    }
                } else {
                    if (pageData.VA[0].Lines !== undefined) {
                        removeData["LineIndex"] = 'All';
                        isRemoved++;
                    }
                }

                isSetted++;
                setData["DetectionType"] = detectionType;
            }
            //EnterExit, Appearing
            if (!angular.equals(pageData.VA[0].DefinedAreas, $scope.VA[0].DefinedAreas)) {
                if ($scope.VA[0].DefinedAreas.length) {
                    for (var i = 0; i < $scope.VA[0].DefinedAreas.length; i++) {
                        var coor = [];

                        for (var j = 0, jLen = $scope.VA[0].DefinedAreas[i].Coordinates.length; j < jLen; j++) {
                            coor.push([
                                $scope.VA[0].DefinedAreas[i].Coordinates[j].x,
                                $scope.VA[0].DefinedAreas[i].Coordinates[j].y
                            ]);
                        }

                        var VA_Defineds = coor.join(',');
                        var definedAreaIndex = $scope.VA[0].DefinedAreas[i].DefinedArea;

                        setData["DefinedArea." + definedAreaIndex + ".Coordinate"] = VA_Defineds;
                        setData["DefinedArea." + definedAreaIndex + ".Type"] = $scope.VA[0].DefinedAreas[i].Type;
                        
                        if(definedAreaIndex < 9){
                            setData["DefinedArea." + definedAreaIndex + ".Mode"] = $scope.VA[0].DefinedAreas[i].Mode.join(',');
                            setData["DefinedArea." + definedAreaIndex + ".AppearanceDuration"] = $scope.VA[0].DefinedAreas[i].AppearanceDuration;
                            setData["DefinedArea." + definedAreaIndex + ".LoiteringDuration"] = $scope.VA[0].DefinedAreas[i].LoiteringDuration;   
                        }
                    }

                    //removeData 찾기
                    var removeIndex = getRemovedIndex(true);

                    if(removeIndex.length > 0){
                        removeData["DefinedAreaIndex"] = removeIndex.join(',');
                        isRemoved++;
                    }
                } else {
                    if (pageData.VA[0].DefinedAreas !== undefined) {
                        removeData["DefinedAreaIndex"] = 'All';
                        isRemoved++;
                    }
                }

                setData["DetectionType"] = detectionType;
                isSetted++;
            }

            setData['DetectionType'] = detectionType;
            isSetted++;

            if (isRemoved) {
                queue.push({
                    url: $scope.va2CommonCmd + '&action=remove',
                    reqData: removeData
                });
            }

            if (isSetted) {
                queue.push({
                    url: $scope.va2CommonCmd + '&action=set',
                    reqData: setData
                });
            }
        } else {
            var url = '';
            if($scope.orgDetectionType === "MDAndIV") {
                url = $scope.va2CommonCmd + '&action=set&DetectionType=MotionDetection';
            } else if($scope.orgDetectionType === "IntelligentVideo" || $scope.orgDetectionType === "Off") {
                url = $scope.va2CommonCmd + '&action=set&DetectionType=Off';
            }
            var getData = {};
            SunapiClient.get(url, getData, function(response) {
                // console.info(response);
                $scope.sketchinfo = {};
                // $scope.currentTableData = null;
            },
            function(errorData) {
                console.log(errorData);
            });
        }

        return queue;
    }

    function setEventRules() {
        var setData = {};
        //setData.Enable = $scope.EventRule.Enable;
        setData.RuleIndex = $scope.EventRule.RuleIndex;
        setData.EventAction = "";
        if ($scope.EventRule.FtpEnable) {
            setData.EventAction += 'FTP,';
        }
        if ($scope.EventRule.SmtpEnable) {
            setData.EventAction += 'SMTP,';
        }
        if ($scope.EventRule.RecordEnable) {
            setData.EventAction += 'Record,';
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
            if ($scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRule.AlarmOutputs[ao].Duration;
            }
        }
        if ($scope.EventRule.PresetNumber !== 'Off') {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRule.PresetNumber;
        }
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

        return {
            url: '/stw-cgi/eventrules.cgi?msubmenu=rules&action=update',
            reqData: setData
        };
       /* return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData, function(response) {
            pageData.EventRule = angular.copy($scope.EventRule);
        }, function(errorData) {
            pageData.EventRule = angular.copy($scope.EventRule);
            //alert(errorData);
        }, '', true);*/
    }

    function openAccordionAll() {
        $('.ui-accordion-header')
            .removeClass('ui-corner-all')
            .addClass('ui-accordion-header-active ui-state-active ui-corner-top')
            .attr({'aria-selected':'true','tabindex':'0'})
            .find(".ui-icon")
            .removeClass('ui-icon-triangle-1-e')
            .addClass('ui-icon-triangle-1-s');
        $('.ui-accordion-content')
            .addClass('ui-accordion-content-active')
            .attr({'aria-expanded':'true','aria-hidden':'false'})
            .show();
    }

    function createAccordion() {
        $( "#va-virtual-area-mode" ).accordion({
            header: "> div > label",
            heightStyle: "content",
            collapsible: false,
            active: false,
            disabled: true
        });

        $( "#va-virtual-area-mode2" ).accordion({
            header: "> div > label",
            heightStyle: "content",
            collapsible: false,
            active: false,
            disabled: true
        });
        openAccordionAll();
    }

    function validatePage() {
        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

    function view(data) {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        sketchbookService.removeDrawingGeometry();
        
        var promises = [];
        getAttributes();
        getCommonCmd();
        resetVirtualAreaMode();
        resetVirtualLineMode();
        promises.push(getVideoAnalysis);
        promises.push(getEventRules);

        $q.seqAll(promises).then(function() {
            showVideo();
            $timeout(function(){
                if(!$scope.accordionAlreadyCreated) {
                    createAccordion();
                    $scope.accordionAlreadyCreated = true;
                }
            });
        }, function(errorData) {
            console.log(errorData);
        });
    }

    function showVideo() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
            var viewerWidth = 640;
            var viewerHeight = 360;
            var maxWidth = mAttr.MaxROICoordinateX;
            var maxHeight = mAttr.MaxROICoordinateY;
            var rotate = response.data.Flip[0].Rotate;
            $scope.rotate = rotate + '';
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
                currentPage: 'VideoAnalytics'
            };
            $scope.ptzinfo = {
                autoOpen: false,
                type: 'none'
            };
            //To run $digest
            $timeout(function(){
                setInitialObjectSize();
                updateMDVARegion2($scope.activeTab);
                $scope.pageLoaded = true;
            });
        }, function(errorData) {
            //alert(errorData);
        }, '', true);
    }

    function getCurrentDetectionType(){
        var detectionType = null;
        var pageDetectionType = pageData.VA[0].DetectionType;

        if($scope.IntelligentVideoEnable){
            if(pageDetectionType === "Off"){
                detectionType = "IntelligentVideo";
            }else if(pageDetectionType === "MotionDetection"){
                detectionType = "MDAndIV";      
            }else{
                detectionType = pageDetectionType;
            }
        }else{
            if(pageDetectionType === "MDAndIV"){
                detectionType = "MotionDetection";
            }else if(pageDetectionType === "IntelligentVideo"){
                detectionType = "Off";
            }else{
                detectionType = pageDetectionType; 
            }
        }

        return detectionType;
    }

    $scope.setOnlyEnable = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function() {
                    return 'lang_apply_question';
                }
            }
        });
        modalInstance.result.then(function() {
            var url = '';
            if($scope.IntelligentVideoEnable === true) {
                if($scope.orgDetectionType === "MotionDetection") {
                    url = $scope.va2CommonCmd + '&action=set&DetectionType=MDAndIV';
                } else if($scope.orgDetectionType === "Off") {
                    url = $scope.va2CommonCmd + '&action=set&DetectionType=IntelligentVideo';
                }
            } else {
                if($scope.orgDetectionType === "MDAndIV") {
                    url = $scope.va2CommonCmd + '&action=set&DetectionType=MotionDetection';
                } else if($scope.orgDetectionType === "IntelligentVideo" || $scope.orgDetectionType === "Off") {
                    url = $scope.va2CommonCmd + '&action=set&DetectionType=Off';
                }
            }
            var getData = {};
            SunapiClient.get(url, getData, function(response) {
                // $scope.sketchinfo = {};
                // $scope.currentTableData = null;
                view();
            },
            function(errorData) {
                console.log(errorData);
            });
        },
        function() {

        });
    };

    function set(isEnabledChanged) {
        var queue = [];
        var detectionType = getCurrentDetectionType();
        var pageDetectionType = pageData.VA[0].DetectionType;

        sketchbookService.removeDrawingGeometry();

        if (validatePage()) {
            if (
                !angular.equals(pageData.VA, $scope.VA) ||
                !angular.equals(pageData.EventRule, $scope.EventRule) || (detectionType !== $scope.orgDetectionType)
                ) {
                // !angular.equals(pageData.VA, $scope.VA) ||
                // !angular.equals(pageData.EventRule, $scope.EventRule) ||
                // detectionType !== pageDetectionType || ((pageDetectionType === "IntelligentVideo" ||
                //  pageDetectionType === "MDAndIV") && $scope.IntelligentVideoEnable ||
                //   pageData.VA[0].IntelligentVideoEnable != $scope.IntelligentVideo)
                // ) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'views/setup/common/confirmMessage.html',
                    controller: 'confirmMessageCtrl',
                    size: 'sm',
                    resolve: {
                        Message: function() {
                            return 'lang_apply_question';
                        }
                    }
                });
                modalInstance.result.then(function() {
                    if (!angular.equals(pageData.VA[0], $scope.VA[0]) || detectionType !== pageDetectionType) {
                        queue = queue.concat(setVideoAnalysis());
                    }
                    if (!angular.equals(pageData.EventRule, $scope.EventRule)) {
                        queue.push(setEventRules());
                    }
                    if(queue.length === 0) {
                        $timeout(view);
                    } else {
                        sunapiQueueRequest(queue, function(){
                            $timeout(view);
                        }, function(errorData){
                            console.error(errorData);
                        });
                    }
                    // $timeout(view);
                }, function() {
                    if(isEnabledChanged) {
                        $scope.IntelligentVideoEnable = !$scope.IntelligentVideoEnable;
                    }
                });
            }
        }
    }

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args) {
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var modifiedDirection = args[3];
        var vaLinesIndex = null;
        var vaAreaIndex = null;

        // console.log("updateCoordinates", modifiedIndex, modifiedType, modifiedPoints, modifiedDirection);

        var coordinates = [];
        var mode = [];

        if(modifiedPoints !== undefined){
            for(var i = 0, ii = modifiedPoints.length; i < ii; i++){
                coordinates.push({
                    x: modifiedPoints[i][0],
                    y: modifiedPoints[i][1]
                });
            }   
        }

        // if ($scope.tabs[0].active || $scope.tabs[1].active || $scope.tabs[2].active || $scope.tabs[3].active) { // Virtual Line, Virtual Area, Excluded Area
            switch($scope.activeTab.title){
                case "Virtual Line":
                    var line = modifiedIndex + 1;
                    switch(modifiedDirection){
                        case 'LR':
                            mode = LINE_MODE.BOTH;
                        break;
                        case 'R':
                            mode = LINE_MODE.RIGHT;
                        break;
                        case 'L':
                            mode = LINE_MODE.LEFT;
                        break;
                        case 'null':
                            mode = LINE_MODE.OFF;
                        break;
                    }

                    vaLinesIndex = findLinesIndex(line);

                    switch(modifiedType){
                        case "create":
                            $scope.VA[0].Lines.push({
                                Line: line,
                                Mode: mode,
                                Coordinates: coordinates
                            });
                        break;
                        case "mouseup":
                            $scope.VA[0].Lines[vaLinesIndex] = {
                                Line: line,
                                Mode: mode,
                                Coordinates: coordinates
                            };
                        break;
                        case "delete":
                            $scope.VA[0].Lines.splice(vaLinesIndex, 1);
                            if($scope.activeTab.title === "Virtual Area"){
                                resetVirtualLineMode();
                            }
                        break;
                    }

                break;
                case "Virtual Area":
                case "Excluded Area":
                    var definedArea = $scope.activeTab.title === "Virtual Area" ? modifiedIndex + 1 : modifiedIndex + 9;

                    // console.log(definedArea);
                    vaAreaIndex = findAreasIndex(definedArea);

                    switch(modifiedType){
                        case "create":
                            var newDefinedArea = {
                                Mode: [],
                                Type: $scope.activeTab.title === "Virtual Area" ? "Inside" : "Outside",
                                Coordinates: coordinates,
                                DefinedArea: definedArea
                            };

                            if($scope.activeTab.title === "Virtual Area"){
                                newDefinedArea.LoiteringDuration = 10;
                                newDefinedArea.AppearanceDuration = 10;
                            }

                            $scope.VA[0].DefinedAreas.push(newDefinedArea);
                        break;
                        case "mouseup":
                            $scope.VA[0].DefinedAreas[vaAreaIndex].Coordinates = coordinates;
                        break;
                        case "delete":
                            $scope.VA[0].DefinedAreas.splice(vaAreaIndex, 1);

                            if($scope.activeTab.title === "Virtual Area"){
                                resetVirtualAreaMode();
                            }
                        break;
                    }

                    // console.log($scope.VA[0].DefinedAreas);
                break;
                case 'Common':
                    switch(modifiedType){
                        case "create":
                        case "mouseup":
                        var w = null;
                        var h = null;
                        if(modifiedIndex === 0) { // min
                            w = coordinates[2].x - coordinates[0].x + 1;
                            h = coordinates[2].y - coordinates[0].y + 1;
                            if(w > $scope.VA[0].MaxWidth){
                                w = $scope.VA[0].MaxWidth;
                            }
                            if(h > $scope.VA[0].MaxHeight){
                                h = $scope.VA[0].MaxHeight;
                            }

                            $scope.VA[0].MinWidth = w;
                            $scope.VA[0].MinHeight = h;
                            $scope.prevMinWidth = w;
                            $scope.prevMinHeight = h;
                            convertSizeCoordinates(coordinates, 'min');
                        } else if(modifiedIndex === 1) { // max
                            w = coordinates[2].x - coordinates[0].x + 1;
                            h = coordinates[2].y - coordinates[0].y + 1;
                            if(w < $scope.VA[0].MinWidth){
                                w = $scope.VA[0].MinWidth;
                            }
                            if(h < $scope.VA[0].MinHeight){
                                h = $scope.VA[0].MinHeight;
                            }

                            $scope.VA[0].MaxWidth = w;
                            $scope.VA[0].MaxHeight = h;
                            $scope.prevMaxWidth = w;
                            $scope.prevMaxHeight = h;
                            convertSizeCoordinates(coordinates, 'max');
                        }

                            // console.info("modifiedIndex", modifiedIndex, "w", w, "h", h);
                        break;
                    }
                break;
            }
            $timeout(function(){
                if($scope.activeTab.title !== 'Common') {
                    updateMDVARegion2($scope.activeTab, true);

                    if(modifiedType !== "delete"){
                        $scope.selectColumn(modifiedIndex);
                    }
                }
            });
        // }
    }, $scope);

    function findLinesIndex(lineIndex){
        var index = null;

        for(var i = 0, ii = $scope.VA[0].Lines.length; i < ii; i++){
            var self = $scope.VA[0].Lines[i];
            if(self.Line === lineIndex){
                index = i;
                break;
            }
        }

        return index;
    }

    function findAreasIndex(areaIndex){
        var index = null;

        for(var i = 0; i < $scope.VA[0].DefinedAreas.length; i++){
            var self = $scope.VA[0].DefinedAreas[i];
            if(self.DefinedArea === areaIndex){
                index = i;
                break;
            }
        }

        return index;
    }

    $scope.changeCurrentTab = function(option) {
        sketchbookService.removeDrawingGeometry();
        $scope.activeTab = option;
        $scope.activeTab.active = true;
        $scope.previousTab = $scope.activeTab;
    };

    $scope.$watch(function() {
        if ($scope.VA !== undefined && $scope.presetTypeData.SelectedPreset !== undefined) {
            if (typeof $scope.VA[$scope.presetTypeData.SelectedPreset] !== "undefined") return $scope.VA[$scope.presetTypeData.SelectedPreset].DetectionType;
        }
    }, function(newVal, oldVal) {
        if (newVal !== oldVal) {
            if($scope.previousTab === null) {
                $scope.changeCurrentTab($scope.tabs[0]);
                for (var i = 1; i < $scope.tabs.length; i++) {
                    $scope.tabs[i].active = false;
                }
            }
        }
    });
    $scope.$watch('analyticsType', function(newVal, oldVal) {
        if (newVal === oldVal) return;
        // console.info('watch analyticsType :: ');console.info(newVal);
        $scope.analyticsType = newVal;
        if(newVal === "Entering") {
            for(var i = 0; i < $scope.analyticEnableOptions.length; i++) {
                if($scope.analyticEnableOptions[i].title === "Entering") {
                    if($scope.analyticEnableOptions[i].isSet === true) {
                        // $scope.$apply(function(){
                            $scope.currentAnalyticEnableOption.isEnabled = $scope.analyticEnableOptions[i].isEnabled;
                        // });
                    }
                }
            }
        } else if(newVal === "Exiting") {
            for(var i = 0; i < $scope.analyticEnableOptions.length; i++) {
                if($scope.analyticEnableOptions[i].title === "Exiting") {
                    if($scope.analyticEnableOptions[i].isSet === true) {
                        // $scope.$apply(function(){
                            $scope.currentAnalyticEnableOption = $scope.analyticEnableOptions[i].isEnabled;
                        // });
                    }
                }
            }
        } else if(newVal === "AppearingDisappearing") {
            for(var i = 0; i < $scope.analyticEnableOptions.length; i++) {
                if($scope.analyticEnableOptions[i].title === "AppearingDisappearing") {
                    if($scope.analyticEnableOptions[i].isSet === true) {
                        // $scope.$apply(function(){
                            $scope.currentAnalyticEnableOption.isEnabled = $scope.analyticEnableOptions[i].isEnabled;
                        // });
                    }
                }
            } 
        } else if(newVal === "Intrusion") {
            for(var i = 0; i < $scope.analyticEnableOptions.length; i++) {
                if($scope.analyticEnableOptions[i].title === "Intrusion") {
                    if($scope.analyticEnableOptions[i].isSet === true) {
                        // $scope.$apply(function(){
                            $scope.currentAnalyticEnableOption.isEnabled = $scope.analyticEnableOptions[i].isEnabled;
                        // });
                    }
                }
            }
        } else if(newVal === "Loitering") {
            for(var i = 0; i < $scope.analyticEnableOptions.length; i++) {
                if($scope.analyticEnableOptions[i].title === "Loitering") {
                    if($scope.analyticEnableOptions[i].isSet === true) {
                        // $scope.$apply(function(){
                            $scope.currentAnalyticEnableOption.isEnabled = $scope.analyticEnableOptions[i].isEnabled;
                        // });
                    }
                }
            }
        }
        if (newVal === "Passing") {
            drawVaLine();
        } else if (newVal === "Entering" || newVal === "Exiting" || newVal === "AppearingDisappearing" || newVal === "Loitering" || newVal === "Intrusion") {
            drawVaArea('Include');
        }
    });

    $scope.$watch('activeTab', function(newVal, oldVal) { // console.info('watch activeTab :: ');console.info(newVal);
        if(newVal === oldVal) {return;}
        if(newVal.title === 'Virtual Line') {
            $scope.VA.SelectedAnalysis = 'Passing';
            resetVirtualLineMode();
        } else if(newVal.title === 'Virtual Area') {
            $scope.VA.SelectedAnalysis = $scope.VideoAnalyticTypes[0];
            $scope.currentAnalyticEnableOption.isEnabled = $scope.analyticEnableOptions[0].isEnabled;
            refreshSensitivitySlider();
            resetVirtualAreaMode();
        } else if(newVal.title === 'Common') {
            refreshSensitivitySlider();
        }
        $timeout(function(){
            updateMDVARegion2(newVal);
            if(newVal.title === 'Common') {
                window.setTimeout(function(){
                    sketchbookService.alignCenter();
                });
            }
        });
    });

    $scope.$watch('ivaDurationSliderModel.data', function(newVal, oldVal) {
        if(newVal) {
            if($scope.VA[0] !== undefined) {
                $scope.VA[0].SensitivityLevel = $scope.ivaDurationSliderModel.data;
            }
        }
    },true);

    function setCommonMenuDisabled() {
        $("#common").attr('disabled', true);
        $("#common .slider-fields").css("pointer-events", "none");
    }

    function setCommonMenuAbled() {
        $("#common").attr('disabled', false);
        $("#common .slider-fields").css("pointer-events", "auto");
    }

    function updateMDVARegion2(tabVal, changeOnlyTableData) { // According to tabVal, set $scope.tableData

        function setTableBuffer(){
            for(var i = 0; i < 8; i++){
                result.push({
                    index: null,
                    Type: null,
                    Mode: '',
                    isEnabled: null,
                    Coordinates: null
                });
            }
        }

        function updateTableData(startIndex, isArea){

            setTableBuffer();

            var obj = isArea ? definedAreas : lines;
            var indexKey = isArea ? "DefinedArea" : "Line";

            for(var i = 0, ii = obj.length; i < ii; i++){
                var self = obj[i];
                var index = self[indexKey];
                if(index >= startIndex && index <= startIndex + 8){
                    var isEnabled = true;
                    // if($scope.currentTableData !== null) { // set as current isEnabled info except for initial setting when the info is null
                    //     if($scope.currentTableData[i].isEnabled !== null) {
                    //         isEnabled = $scope.currentTableData[i].isEnabled;
                    //     }
                    // }
                    result[index - startIndex - 1] = {
                        index: index,
                        Type: self.Type,
                        Mode: self.Mode,
                        isEnabled: isEnabled,
                        Coordinates: self.Coordinates
                    };
                }
            }
        }

        var detectionType = getCurrentDetectionType();
        if($scope.VA[0] === undefined || detectionType === "Off" || detectionType === "MotionDetection") {
            setCommonMenuDisabled();
            $scope.sketchinfo = {}
            var tTable = [];
            for(var i = 0; i < 8; i++){
                tTable.push({
                    index: null,
                    Type: null,
                    Mode: '',
                    isEnabled: null,
                    Coordinates: null
                });
            }
            $scope.currentTableData = tTable;
            // return;
        } else {
            var result = [];
            var startIndex = 0;
            var va = $scope.VA[$scope.presetTypeData.SelectedPreset];
            var definedAreas = va.DefinedAreas;
            var lines = va.Lines;

            if($scope.activeTab.title === "Virtual Area") {
                if ($scope.VA.SelectedAnalysis === undefined) {
                    $scope.VA.SelectedAnalysis = $scope.VideoAnalyticTypes[0];
                }

                updateTableData(0, true);

                $scope.includeTableData = result;
                $scope.currentTableData = $scope.includeTableData;
                $scope.SelectedAnalysis = "Entering"; // set inital type
                // console.info('updateMDVARegion2 :: Virtual Area');
                if(changeOnlyTableData !== true){
                    drawVaArea('Include'); 
                }
                $scope.selectColumn($scope.currentSelectedIncludeColumn);
            } else if($scope.activeTab.title === "Excluded Area") {
                updateTableData(8, true);

                $scope.excludeTableData = result;
                $scope.currentTableData = $scope.excludeTableData;

                $scope.SelectedAnalysis = "Entering"; // set inital type
                // console.info('updateMDVARegion2 :: Excluded Area');
                if(changeOnlyTableData !== true){
                    drawVaArea('Exclude');
                }
                $scope.selectColumn($scope.currentSelectedExcludeColumn);
            } else if($scope.activeTab.title === "Virtual Line") {
                updateTableData(0, false);

                $scope.lineTableData = result;
                $scope.currentTableData = $scope.lineTableData;
                // console.info('updateMDVARegion2 :: Virtual Line');
                $scope.SelectedAnalysis = "Passing"; // set inital type
                if(changeOnlyTableData !== true){
                    drawVaLine();
                }
                $scope.selectColumn($scope.currentSelectedLineColumn);
            } else if($scope.activeTab.title === "Common") {
                // setInitialObjectSize();
                drawSizeArea();
                setCommonMenuAbled();
            }
        }
    }

    $scope.toggleEnable = function(setData, index){
        setData.isEnabled = !setData.isEnabled;
        sketchbookService.setEnableForSVG(index, setData.isEnabled);
        for(var i = 0; i < $scope.currentTableData.length; i++) {
            if($scope.currentTableData[i].index === setData.index) {
                $scope.currentTableData[i] = setData;
            }
        }
    };

    $scope.changeTableData = function(changedData) {
        // console.info('changeTableData :: ');console.info(changedData);console.info($scope.currentTableData);
        if($scope.activeTab.title === 'Virtual Line') {
            $scope.lineTableData = $scope.currentTableData;
            drawVaLine();
        } else if($scope.activeTab.title === 'Virtual Area') {
            $scope.includeTableData = $scope.currentTableData;
            drawVaArea('Include');
        } else if($scope.activeTab.title === 'Excluded Area') {
            $scope.excludeTableData = $scope.currentTableData;
            drawVaArea('Exclude');
        }
    };

    $scope.changeTableIndex = function(index) {
        var selected = $scope.currentTableData[index];
        for(var i = 0; i < selected.Mode.length; i++) {
            for(var j = 0; j < $scope.VideoAnalyticTypes.length; j++) {
                if(selected.Mode[i] === $scope.VideoAnalyticTypes[j]) {

                }
            }
        }
    };

    function setPointsToDraw(data, flag) { // set points to $scope.coordinates for sketchInfo
        // console.info('setPointsToDraw :: ');console.info(data);
        var points = [];
        if(flag === 'line') { // line
            var line = data;
            var direction;
            for(var i = 0; i < line.Coordinates.length; i++) {
                points.push([line.Coordinates[i].x, line.Coordinates[i].y]);
            }
            if ((line.Mode === LINE_MODE.BOTH)) {
                direction = 2;
            } else if (line.Mode === LINE_MODE.RIGHT) {
                direction = 1;
            } else if (line.Mode === LINE_MODE.LEFT) {
                direction = 0;
            } else { // Off
                direction = '';
            }

            $scope.coordinates[data.index - 1] = {
                isSet: true,
                enable: true,
                points: points,
                direction: direction
            };
        } else if(flag === 'area') { // defined area
            var area = data;
            for(var i = 0; i < area.Coordinates.length; i++) {
                points.push([area.Coordinates[i].x, area.Coordinates[i].y]);
            }

            if($scope.activeTab.title === "Excluded Area"){
                $scope.coordinates[data.index - 9] = {
                    isSet: true,
                    enable: true,
                    points: points
                };   
            }else{
                $scope.coordinates[data.index - 1] = {
                    isSet: true,
                    enable: true,
                    points: points
                };   
            }
        } else if(flag === 'minSize') {
            var minSize = data;
            for(var i = 0; i < minSize.Coordinates.length; i++) {
                points.push([minSize.Coordinates[i][0], minSize.Coordinates[i][1]]);
            }
            $scope.coordinates[0] = {  // min area coordinates
                isSet: true,
                enable: true,
                points: points
                // 1 4
                // 2 3
            };
        } else if(flag === 'maxSize') {
            var maxSize = data;
            for(var k = 0; k < maxSize.Coordinates.length; k++) {
                points.push([maxSize.Coordinates[k][0], maxSize.Coordinates[k][1]]);
            }
            $scope.coordinates[1] = {  // max area coordinates
                isSet: true,
                enable: true,
                points: points
                // 1 4
                // 2 3
            };
        }
    }

    function getSketchinfo(color, flag){ // console.info('getSketchinfo :: selected VAType : ');console.info($scope.SelectedAnalysis);
        var tMinLineLength = Math.round(Math.sqrt(Math.pow(mAttr.MaxROICoordinateX, 2) + Math.pow(mAttr.MaxROICoordinateY, 2)) * 0.05);
        if(flag === "area") {
            if($scope.SelectedAnalysis === "Entering" || $scope.SelectedAnalysis === "Exiting") {
                return {
                    workType: "vaEntering",
                    color: color,
                    shape: 1,
                    maxNumber: maxLine,
                    minLineLength: tMinLineLength,
                    modalId: "./views/setup/common/confirmMessage.html"
                };
            } else if($scope.SelectedAnalysis === "AppearingDisappearing") {
                return {
                    workType: "vaAppearing",
                    // mode: option,
                    color: color,
                    shape: 1,
                    maxNumber: maxLine,
                    minLineLength: tMinLineLength,
                    modalId: "./views/setup/common/confirmMessage.html"
                };
            } else if($scope.SelectedAnalysis === "Loitering") {
                return {
                    workType: "vaAppearing",
                    mode: "Loitering",
                    color: color,
                    shape: 1,
                    maxNumber: maxLine,
                    minLineLength: tMinLineLength,
                    modalId: "./views/setup/common/confirmMessage.html"
                };
            } else if($scope.SelectedAnalysis === "Intrusion") {
                return {
                    workType: "vaAppearing",
                    mode: "Intrusion",
                    color: color,
                    shape: 1,
                    maxNumber: maxLine,
                    minLineLength: tMinLineLength,
                    modalId: "./views/setup/common/confirmMessage.html"
                };
            }
        } else if(flag === "line") {
            return {
                workType: "vaPassing",
                shape: 2,
                maxNumber: maxLine,
                minLineLength: tMinLineLength,
                modalId: "./views/setup/common/confirmMessage.html"
            };
        } else if(flag === "size") {
            return {
                workType: "commonArea",
                shape: 1,
                maxNumber: 2,
                initCenter: true,
                minSize: {
                    width: $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth,
                    height: $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight 
                },
                maxSize: {
                    width: $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth,
                    height: $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight
                },
                minSizePercentage: 2.2,
                modalId: "./views/setup/common/confirmMessage.html"
            };
        }
    }

    $scope.vaTypeChange = function(Option) {
        $scope.analyticsType = Option;
        // if (Option === "Passing")
        // {
        //     drawVaPassing();
        // }
        // else if (Option === "EnterExit" || Option === "AppearDisapper")
        // {
        //     drawVaEnteringAppearing(Option);
        // }
    };

    function drawVaLine() { // set sketch info with data which is enabled from current $scope.lineTableData so it draws line
        if ($scope.lineTableData === null) return;
        var lines = $scope.lineTableData;
        $scope.coordinates = [];

        for(var i = 0; i < lines.length; i++) {
            if(lines[i].isEnabled === true) {
                setPointsToDraw(lines[i], 'line');
            }
        }

        $scope.currentTableData = $scope.lineTableData;
        $scope.sketchinfo = getSketchinfo(1, 'line');  //console.info('drawVaLine :: ');console.info($scope.sketchinfo);
    }

    function drawVaArea(flag) { // set sketch info with data which is enabled from current $scope.include/excludeTableData so it draws area
        // if($scope.includeTableData === null || $scope.excludeTableData === null) {return;}
        var startIndex;
        var color;
        var areas;
        var currentVAType = $scope.VA.SelectedAnalysis;
        if(flag === 'Include') {
            startIndex = 0;
            color = 0;
            areas = $scope.includeTableData;
            $scope.currentTableData = $scope.includeTableData;
        } else if(flag === 'Exclude'){
            startIndex = 8;
            color = 1;
            areas = $scope.excludeTableData;
            $scope.currentTableData = $scope.excludeTableData;
        }

        $scope.coordinates = [];

        for(var i = 0; i < areas.length; i++) {
            if(areas[i].isEnabled === true) {
                setPointsToDraw(areas[i], 'area');
            }
        }

        $scope.sketchinfo = getSketchinfo(color, 'area'); // console.info('drawVaArea :: ');console.info($scope.sketchinfo);
        // console.log($scope.sketchinfo);
    }

    function drawSizeArea() {
        var minAreas = $scope.minSizeData;
        var maxAreas = $scope.maxSizeData;
        $scope.coordinates = [];
        setPointsToDraw(minAreas, 'minSize');
        setPointsToDraw(maxAreas, 'maxSize');
        $scope.sketchinfo = getSketchinfo(0, 'size');
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
            view();
        }
    })();
});
