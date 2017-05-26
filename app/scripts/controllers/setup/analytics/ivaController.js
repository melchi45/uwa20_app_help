kindFramework.controller('ivaCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, sketchbookService, $rootScope, $q, eventRuleService, $location, UniversialManagerService) {
    "use strict";
    /*jshint sub:true*/
    COMMONUtils.getResponsiveObjects($scope);

    $rootScope.isCameraSetupPreview = false;
    $rootScope.cameraSetupPreviewCount = 0;
    $rootScope.cameraSetupPreviewMaxCount = 10;
    $rootScope.cameraSetupToLive = false;

    $scope.PresetNameValueOptions = [];

    $scope.previewMode = false;

    $scope.viewEndFlag = '';

    var mAttr = Attributes.get();
    var pageData = {};
    pageData.VA = [];
    $scope.VA = [];
    $scope.orgDetectionType = [];
    $scope.presetTypeData = {};
    $scope.presetTypeData.PresetIndex = 0;
    $scope.presetTypeData.SelectedPreset = 0;
    $scope.presetTypeData.SelectedPresetType = 0;
    $scope.ptzToPreset = false;
    var viewEndCnt = 1;
    var viewEndMax = 3;
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

    $scope.EventSource = 'VideoAnalysis';

    $scope.EventRule = {};

    $scope.isMultiChannel = false;

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
        var line = $scope.VA[$scope.presetTypeData.SelectedPreset].Lines[lineIndex];
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
        var definedArea = $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[defindAreaIndex];
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
        var line = $scope.VA[$scope.presetTypeData.SelectedPreset].Lines[lineIndex];
        line.Mode = mode;
        $scope.VA[$scope.presetTypeData.SelectedPreset].Lines[lineIndex] = line;
    };

    $scope.changeVirtualAreaMode = function(){
        var defindAreasIndex = $scope.virtualAreaMode.defindAreasIndex;
        if(defindAreasIndex === null) {return;}
        var mode = [];

        $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[defindAreasIndex].AppearanceDuration = $scope.virtualAreaMode.appearanceDuration;
        $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[defindAreasIndex].LoiteringDuration = $scope.virtualAreaMode.loiteringDuration;

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

        $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[defindAreasIndex].Mode = mode;
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
        sketchbookService.moveTopLayer(index);
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

        minWidth = parseInt($scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth);
        minHeight = parseInt($scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight);
        maxWidth = parseInt($scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth);
        maxHeight = parseInt($scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight);

        if(minWidth > maxWidth || minHeight > maxHeight) { // min size must be small than max size
            $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth = $scope.prevMinWidth;
            $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight = $scope.prevMinHeight;
            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth = $scope.prevMaxWidth;
            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight = $scope.prevMaxHeight;
            return;
        }
        if(flag === 0) { // min
            if(sketchbookService.changeMinSizeOption(minWidth, minHeight) === false){
                $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight = $scope.prevMinHeight;
                $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth = $scope.prevMinWidth;
                sketchbookService.changeRectangleToSize(0, $scope.prevMinWidth, $scope.prevMinHeight);
                $scope.$apply();
                return;
            }

            $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth = minWidth;
            $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight = minHeight;

            sketchbookService.changeRectangleToSize(0, minWidth, minHeight);

            $scope.prevMinWidth = minWidth;
            $scope.prevMinHeight = minHeight;
        } else if(flag === 1) { // max
            if(sketchbookService.changeMaxSizeOption(maxWidth, maxHeight) === false){
                $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight = $scope.prevMaxHeight;
                $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth = $scope.prevMaxWidth;
                sketchbookService.changeRectangleToSize(1, $scope.prevMaxWidth, $scope.prevMaxHeight);
                $scope.$apply();
                return;
            }

            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth = maxWidth;
            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight = maxHeight;

            sketchbookService.changeRectangleToSize(1, maxWidth, maxHeight);

            $scope.prevMaxWidth = maxWidth;
            $scope.prevMaxHeight = maxHeight;
        }

        convertSizeCoordinates(null);
    };  

    // ======================= ptz preset ================================

    $scope.onPresetChange = function (Preset)
    {
        $scope.presetTypeData.SelectedPreset = parseInt(Preset) + 1;
        
        $scope.changeMdVaType($scope.tabs[0]);
        $scope.tabs[0].active = true;
        for (var i = 1; i < $scope.tabs.length; i++) {
            $scope.tabs[i].active = false;
        }
        if($scope.IVAPresetReady !== undefined && $scope.IVAPresetReady === true) {
            setInitialObjectSize();
            updateMDVARegion2($scope.activeTab);
            if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MotionDetection" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                $scope.IntelligentVideoEnable = false;
            } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MDAndIV" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "IntelligentVideo"){
                $scope.IntelligentVideoEnable = true;
            }
        }
    };

    $scope.onPresetTypeChange = function (Type)
    {
        if (Type === 'Global'){
            $scope.presetTypeData.SelectedPreset = 0;
            gotoPreset('stop');
        } else {
            $scope.presetTypeData.SelectedPreset = 1;
            $scope.presetTypeData.PresetIndex = 0;
            gotoPreset('Start',1);
        }
        $scope.changeMdVaType($scope.tabs[0]);
        $scope.tabs[0].active = true;
        for (var i = 1; i < $scope.tabs.length; i++) {
            $scope.tabs[i].active = false;
        }
        if($scope.IVAPresetReady !== undefined && $scope.IVAPresetReady === true) {
            setInitialObjectSize();
            updateMDVARegion2($scope.activeTab);
            if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MotionDetection" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                $scope.IntelligentVideoEnable = false;
            } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MDAndIV" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "IntelligentVideo"){
                $scope.IntelligentVideoEnable = true;
            }
        }
    };

    $scope.$watch('presetTypeData.SelectedPreset',function(newVal,oldVal){
        if(newVal === undefined || newVal === oldVal) {
            return;
        }
        if(newVal > 0 && oldVal == 0) {
            if($scope.presetTypeData.SelectedPresetType==1){
                if($scope.ptzToPreset == true){
                    $scope.ptzToPreset = false;
                    return;
                }
                gotoPreset('Start',findPresetNumber(newVal));
            }
        } else if(newVal > 0 && oldVal > 0) {
            if($scope.presetTypeData.SelectedPresetType==1){
                gotoPreset('Start',findPresetNumber(newVal),true,findPresetNumber(oldVal));
            }
        } else if(newVal == 0 && oldVal > 0) {
            if($scope.presetTypeData.SelectedPresetType==0) {
                gotoPreset('Stop', findPresetNumber(oldVal));
                return;
            }
        }

        if($scope.IVAPresetReady !== undefined && $scope.IVAPresetReady === true) {
            setInitialObjectSize();
            updateMDVARegion2($scope.activeTab);
        }
        
        // if ($scope.HandoverSupport){
        //     if(typeof $scope.Handover[newVal] != 'undefined' 
        //         && typeof $scope.Handover[newVal].HandoverList !== 'undefined')
        //     {
        //         viewHandoverAreaOptions(newVal);
        //     }
        // }
    });

    var maxLine = 8;

    function gotoPreset(mode,Preset,presetChanged,oldPreset){
        function oldPresetStop(){
            showLoadingBar(true);
            var stopData = {};
            stopData.ImagePreview = 'Stop';
            stopData.Channel = 0;
            stopData.Preset = oldPreset;
            return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', stopData,
                function (response){
                    $timeout(function(){
                        newPreset();
                    },500);
                },
                function (errorData){
                }, '', true);
        }
        function newPreset(){
            var setData = {};
            setData.Channel = 0;
            setData.Preset = Preset==0 ? 1 : Preset;
            if(mode=='Start'){
                $scope.presetPreview = true;
                $scope.previewMode = true;
            }else{
                $scope.presetPreview = false;
            }
            setData.ImagePreview = mode;
            return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
                function (response){
                    showLoadingBar(false);
                },
                function (errorData){
                    showLoadingBar(false);
                }, '', true);
        }
        function oldPresetGo(){
            var getData = {};
            getData.Channel = 0;
            getData.Preset = Preset;
            return SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control',getData,
                function (response){},
                function (errorData){
                }, '', true);
        }

        var promises = [];

        if(presetChanged == false){

        }else if(presetChanged == true){
            if(oldPreset !== undefined){
                promises.push(oldPresetStop);
            }
        }
        if(presetChanged == false || typeof presetChanged == 'undefined'){
            promises.push(newPreset);
        }
        if(mode=='Stop'){
            promises.push(oldPresetGo);
        }
        $q.seqAll(promises).then(
            function(){
            },
            function(errorData){
            }
        );
    }
    function findPresetNumber(presetIdx){
        var presetIndex = 0;
        if (typeof presetIdx === 'undefined'){
            presetIndex = $scope.presetTypeData.PresetIndex;
        } else {
            presetIndex = parseInt(presetIdx)-1;
        }
        var Preset = $scope.PresetNameValueOptions[presetIndex].split(' : ');
        return parseInt(Preset[0]);
    }
    var showLoadingBar = function(_val) {
        $scope.isLoading = _val;
        $timeout(function(){
            $scope.$digest();
        });
    };

    $rootScope.$watch(function $locationWatch() {
        var changedUrl = $location.absUrl();
        //console.log(changedUrl);
        if (changedUrl.indexOf('analytics_iva') === -1) {
            if (($rootScope.cameraSetupToLive != true) && ($scope.previewMode === true)) {
                stopLivePreviewMode();
            }
        }
    });

    $scope.$watch(function() {
        return $rootScope.cameraSetupToLive;
    }, function(newVal, oldVal) {
        if(newVal == true){
            if($scope.previewMode == false){
                $rootScope.isCameraSetupPreview = false;
            }else{
                stopLivePreviewMode();
            }
        }
    }, true);

    $scope.$watch('previewMode', function (newVal, oldVal) {
        if(newVal === undefined) {
            return;
        }
        if(newVal === true) $rootScope.isCameraSetupPreview = true;
    });

    $(window).unload( function () {
        stopLivePreviewMode('unload');
    });
    
    function stopLivePreviewMode(event) {
        if ($scope.previewMode === true) {
            $scope.previewMode = false;
            livePreviewMode('Stop',event);
        }
    }

    function livePreviewMode(mode,event) {
        var asyncVal = true;
        if(typeof event !== 'undefined' && event == 'unload'){
            asyncVal = false;
        }
        var setData = {};
        setData.ImagePreview = mode;
        if($scope.presetTypeData.SelectedPresetType==1){
            if(mode=='Stop'){
                //$scope.presetPreview = false;
                setData.Channel = 0;
                setData.Preset = findPresetNumber();
                SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', setData,
                    function (response){
                        $rootScope.isCameraSetupPreview = false;
                    },
                    function (errorData){
                        $rootScope.isCameraSetupPreview = false;
                    }, '', asyncVal);
            }
        }else{
            SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set', setData,
                function (response) {
                    $rootScope.isCameraSetupPreview = false;
                },
                function (errorData) {
                    $rootScope.isCameraSetupPreview = false;
                }, '', asyncVal);
        }
    }
    $scope.livePreviewMode = livePreviewMode;

    function getPresets()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', getData,
            function (response)
            {
                $scope.PresetNameValueOptions = [];
                for (var i = 0; i < response.data.PTZPresets[0].Presets.length; i++)
                {
                    $scope.PresetNameValueOptions[i] = response.data.PTZPresets[0].Presets[i].Preset + ' : ' + response.data.PTZPresets[0].Presets[i].Name;
                }
                if($scope.presetTypeData.SelectedPresetType == 0){
                    getSelectedPreset();
                }
                $scope.viewEndFlag = 'preset';
            },
            function (errorData)
            {
                console.log(errorData);
            }, '', true);
    }

    function getPresetVideoAnalysis(detectionType)
    {
        var getData = {};

        if (detectionType) {
            getData.DetectionType = detectionType;
        } else {
            getData.DetectionType = "IntelligentVideo";
        }

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=view', getData,
                function (response)
                {
                    $timeout(function(){
                        var presetVAArray = angular.copy(response.data.PresetVideoAnalysis[0].Presets);

                        for(var i = 0; i < presetVAArray.length; i++) {
                            var index = i + 1;
                            var presetVA = presetVAArray[i];

                            if(!("DefinedAreas" in presetVA)){
                                presetVA.DefinedAreas = [];
                            }

                            if(!("Lines" in presetVA)){
                                presetVA.Lines = [];
                            }

                            $scope.VA[index] = presetVA;

                            $scope.orgDetectionType[index] = $scope.VA[index].DetectionType;

                            if(index === $scope.presetTypeData.SelectedPreset) { // when enable of current preset changed, in order to update enable with new data, reset enable UI 
                                if($scope.orgDetectionType[index] === "MotionDetection" || $scope.orgDetectionType[index] === "Off") {
                                    $scope.IntelligentVideoEnable = false;
                                } else if($scope.orgDetectionType[index] === "MDAndIV" || $scope.orgDetectionType[index] === "IntelligentVideo"){
                                    $scope.IntelligentVideoEnable = true;
                                }
                            }

                            var str = presetVA.ObjectSizeByDetectionTypes[1].MinimumObjectSizeInPixels.split(',');
                            $scope.VA[index].MinWidth = Math.round(str[0]);
                            $scope.VA[index].MinHeight = Math.round(str[1]);
                            var str = presetVA.ObjectSizeByDetectionTypes[1].MaximumObjectSizeInPixels.split(',');
                            $scope.VA[index].MaxWidth = Math.round(str[0]);
                            $scope.VA[index].MaxHeight = Math.round(str[1]);
                            $scope.VA[index].MinWidthMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Width; // eventsourceoption is undefined !
                            $scope.VA[index].MinWidthMax = $scope.VA[index].MaxWidth;
                            $scope.VA[index].MinHeightMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Height;
                            $scope.VA[index].MinHeightMax = $scope.VA[index].MaxHeight;
                            $scope.VA[index].MaxWidthMin = $scope.VA[index].MinWidth;
                            $scope.VA[index].MaxWidthMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Width;
                            $scope.VA[index].MaxHeightMin = $scope.VA[index].MinHeight;
                            $scope.VA[index].MaxHeightMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Height;
                            
                            $scope.VA[index].SensitivityLevel = presetVA.SensitivityLevel;
                            if($scope.VA[index].SensitivityLevel <= 0) {
                                $scope.VA[index].SensitivityLevel = 80;
                                if($scope.presetTypeData.SelectedPreset !== 0) {
                                    $scope.ivaDurationSliderModel = {
                                        data : $scope.VA[index].SensitivityLevel
                                    };
                                }
                            } else {
                                if($scope.presetTypeData.SelectedPreset !== 0) {
                                    $scope.ivaDurationSliderModel = {
                                        data: $scope.VA[index].SensitivityLevel
                                    };
                                }
                            }
                            pageData.VA[index] = angular.copy($scope.VA[index]);
                        }                        
                        $scope.viewEndFlag = 'presetvideoanalysis';
                        $scope.IVAPresetReady = true;
                   },100);
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    function setPresetVideoAnalysis()
    {
        function getRemovedIndex(isArea){
            var obj = isArea ? "DefinedAreas" : "Lines";
            var indexKey = isArea ? "DefinedArea" : "Line";
            var removeIndexs = [];

            for(var i = 0, ii = pageData.VA[$scope.presetTypeData.SelectedPreset][obj].length; i < ii; i++){
                var self = pageData.VA[$scope.presetTypeData.SelectedPreset][obj][i];
                removeIndexs.push(self[indexKey]);
            }

            for(var i = 0, ii = $scope.VA[$scope.presetTypeData.SelectedPreset][obj].length; i < ii; i++){
                var self = $scope.VA[$scope.presetTypeData.SelectedPreset][obj][i];
                var pageDataLineIndex = removeIndexs.indexOf(self[indexKey]);
                if(pageDataLineIndex > -1){
                    removeIndexs.splice(pageDataLineIndex, 1);
                }
            }

            return removeIndexs;
        }

        var queue = [];

        for (var i = 0; i < $scope.VA.length - 1; i++) {
            var index = i + 1;
            var setData = {};
            var removeData = {};
            var currentChannel = UniversialManagerService.getChannelId();
            setData.Channel = currentChannel;
            setData.Preset = $scope.VA[index].Preset;
            var isRemoved = 0;
            var isSetted = 0;
            var detectionType = getCurrentDetectionType();

            if (pageData.VA[index].DetectionResultOverlay !== $scope.VA[index].DetectionResultOverlay) {
                setData.DetectionResultOverlay = $scope.VA[index].DetectionResultOverlay;
                isSetted++;
            }

            if ($scope.IntelligentVideoEnable !== false) {
                if (pageData.VA[index].SensitivityLevel !== $scope.VA[index].SensitivityLevel) {
                    setData.SensitivityLevel = $scope.VA[index].SensitivityLevel;
                    isSetted++;
                }
                if (pageData.VA[index].DisplayRules !== $scope.VA[index].DisplayRules) {
                    if ($scope.VA[index].DetectionType === "IntelligentVideo" || $scope.VA[index].DetectionType === "MDAndIV") {
                        setData.DisplayRules = $scope.VA[index].DisplayRules;
                        isSetted++;
                    }
                }
                if (pageData.VA[index].ROIMode !== $scope.VA[index].ROIMode) {
                    setData.ROIMode = $scope.VA[index].ROIMode;
                    isSetted++;
                }
                if ((pageData.VA[index].MinWidth !== $scope.VA[index].MinWidth) || (pageData.VA[index].MinHeight !== $scope.VA[index].MinHeight)) {
                    setData['DetectionType.IntelligentVideo.MinimumObjectSizeInPixels'] = $scope.VA[index].MinWidth + ',' + $scope.VA[index].MinHeight;
                    isSetted++;
                }
                if ((pageData.VA[index].MaxWidth !== $scope.VA[index].MaxWidth) || (pageData.VA[index].MaxHeight !== $scope.VA[index].MaxHeight)) {
                    setData['DetectionType.IntelligentVideo.MaximumObjectSizeInPixels'] = $scope.VA[index].MaxWidth + ',' + $scope.VA[index].MaxHeight;
                    isSetted++;
                }
                //Passing
                if (!angular.equals(pageData.VA[index].Lines, $scope.VA[index].Lines)) {
                    if ($scope.VA[index].Lines.length) {
                        for (var i = 0; i < $scope.VA[index].Lines.length; i++) {
                            var coor = [];

                            for (var j = 0, jLen = $scope.VA[index].Lines[i].Coordinates.length; j < jLen; j++) {
                                coor.push([
                                    $scope.VA[index].Lines[i].Coordinates[j].x,
                                    $scope.VA[index].Lines[i].Coordinates[j].y
                                ]);
                            }

                            var VA_Lines = coor.join(',');
                            var lineIndex = $scope.VA[index].Lines[i].Line;
                            setData["Line." + lineIndex + ".Coordinate"] = VA_Lines;
                            setData["Line." + lineIndex + ".Mode"] = $scope.VA[index].Lines[i].Mode;
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
                        if (pageData.VA[index].Lines !== undefined) {
                            removeData["LineIndex"] = 'All';
                            isRemoved++;
                        }
                    }

                    isSetted++;
                    setData["DetectionType"] = detectionType;
                }
                //EnterExit, Appearing
                if (!angular.equals(pageData.VA[index].DefinedAreas, $scope.VA[index].DefinedAreas)) {
                    if ($scope.VA[index].DefinedAreas.length) {
                        for (var i = 0; i < $scope.VA[index].DefinedAreas.length; i++) {
                            var coor = [];
                            if($scope.VA[index].DefinedAreas[i] !== undefined) { 
                                for (var j = 0, jLen = $scope.VA[index].DefinedAreas[i].Coordinates.length; j < jLen; j++) {
                                    coor.push([
                                        $scope.VA[index].DefinedAreas[i].Coordinates[j].x,
                                        $scope.VA[index].DefinedAreas[i].Coordinates[j].y
                                    ]);
                                }

                                var VA_Defineds = coor.join(',');
                                var definedAreaIndex = $scope.VA[index].DefinedAreas[i].DefinedArea;

                                setData["DefinedArea." + definedAreaIndex + ".Coordinate"] = VA_Defineds;
                                setData["DefinedArea." + definedAreaIndex + ".Type"] = $scope.VA[index].DefinedAreas[i].Type;
                                
                                if(definedAreaIndex < 9){
                                    setData["DefinedArea." + definedAreaIndex + ".Mode"] = $scope.VA[index].DefinedAreas[i].Mode.join(',');
                                    setData["DefinedArea." + definedAreaIndex + ".AppearanceDuration"] = $scope.VA[index].DefinedAreas[i].AppearanceDuration;
                                    setData["DefinedArea." + definedAreaIndex + ".LoiteringDuration"] = $scope.VA[index].DefinedAreas[i].LoiteringDuration;   
                                }
                            }
                        }

                        //removeData 찾기
                        var removeIndex = getRemovedIndex(true);

                        if(removeIndex.length > 0){
                            removeData["DefinedAreaIndex"] = removeIndex.join(',');
                            isRemoved++;
                        }
                    } else {
                        if (pageData.VA[index].DefinedAreas !== undefined) {
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
                        // url: $scope.va2CommonCmd + '&action=remove',
                        url: '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=remove',
                        reqData: removeData
                    });
                }

                if (isSetted) {
                    queue.push({
                        // url: $scope.va2CommonCmd + '&action=set',
                        url: '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=set',
                        reqData: setData
                    });
                }
            } else {
                var url = '';
                if($scope.orgDetectionType[index] === "MDAndIV") {
                    url = $scope.va2CommonCmd + '&action=set&DetectionType=MotionDetection';
                } else if($scope.orgDetectionType[index] === "IntelligentVideo" || $scope.orgDetectionType[index] === "Off") {
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
        }

        return queue;
    }
    
    function getPresetVideoAnalysisDetectionPreset()
    {
        var detectionPreset = {
            'DetectionType' : $scope.VA[$scope.presetTypeData.SelectedPreset].DetectionType,
            //'Preset' : $scope.presetTypeData.SelectedPreset
            'Preset' : findPresetNumber()
        };

        var getData = {};
        getData.DetectionType = detectionPreset.DetectionType;
        getData.Preset = detectionPreset.Preset;
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=view', getData,
                function (response)
                {
                    $timeout(function(){
                        var index = detectionPreset.Preset;
                        var presetVA = angular.copy(response.data.PresetVideoAnalysis[0].Presets[0]);
                        $scope.VA[index] = angular.copy(response.data.PresetVideoAnalysis[0].Presets[0]);
                        $scope.VA[index].DetectionType = detectionPreset.DetectionType;

                        var str = presetVA.ObjectSizeByDetectionTypes[1].MinimumObjectSizeInPixels.split(',');
                        $scope.VA[index].MinWidth = Math.round(str[0]);
                        $scope.VA[index].MinHeight = Math.round(str[1]);
                        var str = presetVA.ObjectSizeByDetectionTypes[1].MaximumObjectSizeInPixels.split(',');
                        $scope.VA[index].MaxWidth = Math.round(str[0]);
                        $scope.VA[index].MaxHeight = Math.round(str[1]);

                        // var str = presetVA.MinimumObjectSizeInPixels.split(',');
                        // $scope.VA[index].MinWidth = Math.round(str[0]);
                        // $scope.VA[index].MinHeight = Math.round(str[1]);

                        // var str = presetVA.MaximumObjectSizeInPixels.split(',');
                        // $scope.VA[index].MaxWidth = Math.round(str[0]);
                        // $scope.VA[index].MaxHeight = Math.round(str[1]);

                        $scope.VA[index].MinWidthMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Width;
                        $scope.VA[index].MinWidthMax = $scope.VA[index].MaxWidth;

                        $scope.VA[index].MinHeightMin = $scope.EventSourceOption.MinimumObjectSizeInPixels.Height;
                        $scope.VA[index].MinHeightMax = $scope.VA[index].MaxHeight;

                        $scope.VA[index].MaxWidthMin = $scope.VA[index].MinWidth;
                        $scope.VA[index].MaxWidthMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Width;

                        $scope.VA[index].MaxHeightMin = $scope.VA[index].MinHeight;
                        $scope.VA[index].MaxHeightMax = $scope.EventSourceOption.MaximumObjectSizeInPixels.Height;
                        
                        pageData.VA[index] = angular.copy($scope.VA[index]);
                        pageData.VA[index].DetectionType = presetVA.DetectionType;
                        $scope.viewEndFlag = 'presetvideoanalysisdetection';
                    },100);
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    var isChangeMdVaType = false;
    $scope.changeMdVaType = function (option) {
        isChangeMdVaType = true;
        $scope.activeTab = option;
    }

    // =======================================================

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
        if(mAttr.MaxChannel > 1) {
            $scope.isMultiChannel = true;
        }
        $scope.VideoAnalysis2Support = mAttr.VideoAnalysis2Support;
        $scope.MotionDetectionOverlay = mAttr.MotionDetectionOverlay;
        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
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

    function getVideoAnalysis(detectionType) {
        var getData = {};

        if (detectionType) {
            getData.DetectionType = detectionType;
        } else {
            getData.DetectionType = "IntelligentVideo";
        }

        if($scope.isMultiChannel) {
            var currentChannel = UniversialManagerService.getChannelId();
            getData.Channel = currentChannel;
        }

        return SunapiClient.get($scope.va2CommonCmd + '&action=view', getData, function(response) {
            var videoAnalysis = response.data.VideoAnalysis[0];//console.info('getVideoAnalysis::');console.info(response.data);

            if(!("DefinedAreas" in videoAnalysis)){
                videoAnalysis.DefinedAreas = [];
            }

            if(!("Lines" in videoAnalysis)){
                videoAnalysis.Lines = [];
            }

            $scope.VA[0] = videoAnalysis;

            $scope.orgDetectionType[0] = $scope.VA[0].DetectionType;
            if (detectionType) {
                $scope.VA[0].DetectionType = detectionType;
            } else {
                if($scope.presetTypeData.SelectedPreset === 0) {
                    if($scope.orgDetectionType[0] === "MotionDetection" || $scope.orgDetectionType[0] === "Off") {
                        // $scope.VA[0].DetectionType = "Off"
                        $scope.IntelligentVideoEnable = false;
                    } else if($scope.orgDetectionType[0] === "MDAndIV" || $scope.orgDetectionType[0] === "IntelligentVideo"){
                        // $scope.VA[0].DetectionType = orgDetectionType;
                        $scope.IntelligentVideoEnable = true;
                    }
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
                if($scope.presetTypeData.SelectedPreset === 0) {
                    $scope.ivaDurationSliderModel = {
                        data : $scope.VA[0].SensitivityLevel
                    };
                }
            } else {
                if($scope.presetTypeData.SelectedPreset === 0) {
                    $scope.ivaDurationSliderModel = {
                        data: $scope.VA[0].SensitivityLevel
                    };
                }
            }
            // setInitialObjectSize();
            pageData.VA[0] = angular.copy($scope.VA[0]);
            pageData.VA[0].IntelligentVideoEnable = $scope.IntelligentVideoEnable;
        }, function(errorData) {
            //alert(errorData);
        }, '', true);
    }

    function setInitialObjectSize() {
        var maxResolution = mAttr.MaxResolution;
        maxResolution = maxResolution.split('x');
        var maxWidth = parseInt(maxResolution[0]);
        var maxHeight = parseInt(maxResolution[1]);
        $scope.minHeightLimit = Math.round(maxHeight * 0.022);
        $scope.minWidthLimit = $scope.minHeightLimit;
        $scope.maxWidthLimit = Math.ceil(maxWidth);
        $scope.maxHeightLimit = Math.ceil(maxHeight);

        if($scope.rotate !== 'undefined') {
            if($scope.rotate !== '0') {
                var temp;
                temp = $scope.maxWidthLimit;
                $scope.maxWidthLimit = $scope.maxHeightLimit;
                $scope.maxHeightLimit = temp;
            }
        }

        // if($scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth !== $scope.minWidthLimit) {
        //     $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth += 1;
        // }
        // if($scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight !== $scope.minWidthLimit) {
        //     $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight += 1;
        // }
        // if($scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth !== $scope.minWidthLimit) {
        //     $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth += 1;
        // }
        // if($scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight !== $scope.minWidthLimit) {
        //     $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight += 1;
        // }

        if($scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth < $scope.minWidthLimit) {
            $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth = $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidthMin;
        }
        if($scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight < $scope.minHeightLimit) {
            $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight = $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeightMin;
        }
        if($scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth < $scope.minWidthLimit) { // $scope.VA[0].MaxWidthMin) {
            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth = $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth; // $scope.VA[0].MaxWidthMin;
        }
        if($scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight < $scope.minHeightLimit) { // $scope.VA[0].MaxHeightMin) {
            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight = $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight; //$scope.VA[0].MaxHeightMin;
        }
        $scope.prevMinWidth = $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth;
        $scope.prevMinHeight = $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight;
        $scope.prevMaxWidth = $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth;
        $scope.prevMaxHeight = $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight;
        convertSizeCoordinates(null, null);

        pageData.VA[$scope.presetTypeData.SelectedPreset] = angular.copy($scope.VA[$scope.presetTypeData.SelectedPreset]);
    }

    function convertSizeCoordinates(data, flag) {
        if(data === null) {
            $scope.minSizeData.Coordinates = [];
            $scope.minSizeData.Coordinates.push([0,0]);
            $scope.minSizeData.Coordinates.push([0,$scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight]);
            $scope.minSizeData.Coordinates.push([$scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth,$scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight]);
            $scope.minSizeData.Coordinates.push([$scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth,0]);
            $scope.maxSizeData.Coordinates = [];
            $scope.maxSizeData.Coordinates.push([0,0]);
            $scope.maxSizeData.Coordinates.push([0,$scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight]);
            $scope.maxSizeData.Coordinates.push([$scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth,$scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight]);
            $scope.maxSizeData.Coordinates.push([$scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth,0]);
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
        var currentChannel = UniversialManagerService.getChannelId();
        setData.Channel = currentChannel;
        removeData.Channel = currentChannel;
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
                setData['DetectionType.IntelligentVideo.MinimumObjectSizeInPixels'] = $scope.VA[0].MinWidth + ',' + $scope.VA[0].MinHeight;
                isSetted++;
            }
            if ((pageData.VA[0].MaxWidth !== $scope.VA[0].MaxWidth) || (pageData.VA[0].MaxHeight !== $scope.VA[0].MaxHeight)) {
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
            if($scope.orgDetectionType[0] === "MDAndIV") {
                url = $scope.va2CommonCmd + '&action=set&DetectionType=MotionDetection';
            } else if($scope.orgDetectionType[0] === "IntelligentVideo" || $scope.orgDetectionType[0] === "Off") {
                url = $scope.va2CommonCmd + '&action=set&DetectionType=Off';
            }
            var getData = {};
            var currentChannel = UniversialManagerService.getChannelId();
            getData.Channel = currentChannel;
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
        if(!eventRuleService.checkSchedulerValidation()) {
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
        viewEndCnt = 1;
        getAttributes();
        getCommonCmd();
        resetVirtualAreaMode();
        resetVirtualLineMode();
        promises.push(getVideoAnalysis);

        if ($scope.PTZModel)
        {
            promises.push(getPresets);
            promises.push(getPresetVideoAnalysis);
            if($scope.presetTypeData.SelectedPresetType == 0){
                viewEndMax = 5;
            }else{
                // promises.push(getPresetVideoAnalysisDetectionPreset);
                viewEndMax = 6;
            }
        }
        else
        {
            viewEndMax = 3;
        }

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
        var currentChannel = UniversialManagerService.getChannelId();
        getData.Channel = currentChannel;
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
                type: 'none'
            };
            //To run $digest
            $timeout(function(){
                setInitialObjectSize();
                updateMDVARegion2($scope.activeTab);
                $scope.pageLoaded = true;
                $scope.$emit('pageLoaded', $scope.EventSource);
                $rootScope.$emit('changeLoadingBar', false);
            });
        }, function(errorData) {
            //alert(errorData);
        }, '', true);
    }

    function getCurrentDetectionType(){
        var detectionType = null;
        var pageDetectionType = pageData.VA[$scope.presetTypeData.SelectedPreset].DetectionType;

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
                if($scope.presetTypeData.SelectedPreset === 0) { // global type
                    if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MotionDetection") {
                        url = $scope.va2CommonCmd + '&action=set&DetectionType=MDAndIV';
                    } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                        url = $scope.va2CommonCmd + '&action=set&DetectionType=IntelligentVideo';
                    }
                } else { // preset type
                    if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MotionDetection") {
                        url =  '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=set&DetectionType=MDAndIV';
                    } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                        url =  '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=set&DetectionType=IntelligentVideo';
                    }
                }
            } else {
                if($scope.presetTypeData.SelectedPreset === 0) { // global type
                    if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MDAndIV") {
                        url = $scope.va2CommonCmd + '&action=set&DetectionType=MotionDetection';
                    } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "IntelligentVideo" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                        url = $scope.va2CommonCmd + '&action=set&DetectionType=Off';
                    }
                } else { // preset type
                    if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "MDAndIV") {
                        url = '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=set&DetectionType=MotionDetection';
                    } else if($scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "IntelligentVideo" || $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset] === "Off") {
                        url = '/stw-cgi/ptzconfig.cgi?msubmenu=presetvideoanalysis2&action=set&DetectionType=Off';
                    }
                }
            }
            var setData = {};
            var currentChannel = UniversialManagerService.getChannelId();
            setData.Channel = currentChannel;
            if($scope.presetTypeData.SelectedPreset > 0) {
                setData.Preset = $scope.VA[$scope.presetTypeData.SelectedPreset].Preset;
            }
            SunapiClient.get(url, setData, function(response) {
                // $scope.sketchinfo = {};
                // $scope.currentTableData = null;
                view();
            },
            function(errorData) {
                console.log(errorData);
            });
        },
        function() {
            $scope.IntelligentVideoEnable = !$scope.IntelligentVideoEnable;
        });
    };

    function comparePageData() {
        var isSame = true;
        if(!angular.equals(pageData.VA[0].DefinedAreas, $scope.VA[0].DefinedAreas)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].Lines, $scope.VA[0].Lines)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].MaxHeight, $scope.VA[0].MaxHeight)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].MinHeight, $scope.VA[0].MinHeight)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].MaxWidth, $scope.VA[0].MaxWidth)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].MinWidth, $scope.VA[0].MinWidth)) {
            isSame = false;
        }
        if(!angular.equals(pageData.VA[0].SensitivityLevel, $scope.VA[0].SensitivityLevel)) {
            isSame = false;
        }
        return isSame;
    }

    function set(isEnabledChanged) {
        var queue = [];
        var detectionType = getCurrentDetectionType();
        var pageDetectionType = pageData.VA[$scope.presetTypeData.SelectedPreset].DetectionType;

        sketchbookService.removeDrawingGeometry();

        if (validatePage()) {
            if (
                !angular.equals(pageData.VA, $scope.VA) ||
                !angular.equals(pageData.EventRule, $scope.EventRule) || (detectionType !== $scope.orgDetectionType[$scope.presetTypeData.SelectedPreset])
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
                    
                    showLoadingBar(true);
                    
                    if (!angular.equals(pageData.VA[0], $scope.VA[0]))
                    {
                        queue = queue.concat(setVideoAnalysis());
                    }

                    if ($scope.PTZModel && $scope.VA.length > 1) {
                        queue = queue.concat(setPresetVideoAnalysis());
                        // for (var i = 0; i < $scope.VA.length - 1; i++)
                        // {
                        //     var index = i + 1;
                        //     if (!angular.equals(pageData.VA[index], $scope.VA[index]))
                        //     {
                        //         queue = queue.concat(setPresetVideoAnalysis(index));
                        //     }
                        // }
                    }

                    if(queue.length > 0) {
                        sunapiQueueRequest(queue, function(){
                            $scope.$emit('applied', true);
                            $timeout(view);
                        }, function(errorData){
                            console.error(errorData);
                        });
                    } else {
                        $scope.$emit('applied', true);
                        $timeout(view);
                    }
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
                        case null:
                            mode = LINE_MODE.OFF;
                        break;
                    }

                    vaLinesIndex = findLinesIndex(line);

                    switch(modifiedType){
                        case "create":
                            $scope.VA[$scope.presetTypeData.SelectedPreset].Lines.push({
                                Line: line,
                                Mode: mode,
                                Coordinates: coordinates
                            });
                        break;
                        case "mouseup":
                            $scope.VA[$scope.presetTypeData.SelectedPreset].Lines[vaLinesIndex] = {
                                Line: line,
                                Mode: mode,
                                Coordinates: coordinates
                            };
                        break;
                        case "delete":
                            $scope.VA[$scope.presetTypeData.SelectedPreset].Lines.splice(vaLinesIndex, 1);
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

                            $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas.push(newDefinedArea);
                        break;
                        case "mouseup":
                            $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[vaAreaIndex].Coordinates = coordinates;
                        break;
                        case "delete":
                            $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas.splice(vaAreaIndex, 1);

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
                            w = coordinates[2].x - coordinates[0].x;
                            h = coordinates[2].y - coordinates[0].y;
                            if(w > $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth){
                                w = $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth;
                            }
                            if(h > $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight){
                                h = $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight;
                            }

                            $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth = w;
                            $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight = h;
                            $scope.prevMinWidth = w;
                            $scope.prevMinHeight = h;
                            convertSizeCoordinates(coordinates, 'min');
                        } else if(modifiedIndex === 1) { // max
                            w = coordinates[2].x - coordinates[0].x;
                            h = coordinates[2].y - coordinates[0].y;
                            if(w < $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth){
                                w = $scope.VA[$scope.presetTypeData.SelectedPreset].MinWidth;
                            }
                            if(h < $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight){
                                h = $scope.VA[$scope.presetTypeData.SelectedPreset].MinHeight;
                            }

                            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxWidth = w;
                            $scope.VA[$scope.presetTypeData.SelectedPreset].MaxHeight = h;
                            $scope.prevMaxWidth = w;
                            $scope.prevMaxHeight = h;
                            convertSizeCoordinates(coordinates, 'max');
                        }

                            // console.info("modifiedIndex", modifiedIndex, "w", w, "h", h);
                        break;
                    }
                break;console.info('update coordinates :: ');console.info($scope.VA[$scope.presetTypeData.SelectedPreset]);
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

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        if(UniversialManagerService.getChannelId() !== data) {
            if(!comparePageData() || !eventRuleService.checkEventRuleValidation()
                ) {
                COMMONUtils
                .confirmChangeingChannel().then(function() {
                    var queue = [];
                    var detectionType = getCurrentDetectionType();
                    var pageDetectionType = pageData.VA[0].DetectionType;

                    sketchbookService.removeDrawingGeometry();

                    if(validatePage()) {
                        $rootScope.$emit('changeLoadingBar', true);
                        if (!angular.equals(pageData.VA, $scope.VA)) {
                            queue = queue.concat(setVideoAnalysis());
                        }

                        if(queue.length > 0) {
                            sunapiQueueRequest(queue, function(){
                                $scope.$emit('applied', UniversialManagerService.getChannelId());
                                $rootScope.$emit("channelSelector:changeChannel", data);
                                $timeout(view);
                            }, function(errorData){
                                console.error(errorData);
                            });
                        } else {
                            $scope.$emit('applied', UniversialManagerService.getChannelId())
                            $rootScope.$emit("channelSelector:changeChannel", data);
                            $timeout(view);
                        }
                    }
                },
                function() {

                });
            } else {
                $rootScope.$emit('changeLoadingBar', true);
                $rootScope.$emit("channelSelector:changeChannel", data);
                $timeout(view);
            }
        }
    }, $scope);

    function findLinesIndex(lineIndex){
        var index = null;

        for(var i = 0, ii = $scope.VA[$scope.presetTypeData.SelectedPreset].Lines.length; i < ii; i++){
            var self = $scope.VA[$scope.presetTypeData.SelectedPreset].Lines[i];
            if(self.Line === lineIndex){
                index = i;
                break;
            }
        }

        return index;
    }

    function findAreasIndex(areaIndex){
        var index = null;

        for(var i = 0; i < $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas.length; i++){
            var self = $scope.VA[$scope.presetTypeData.SelectedPreset].DefinedAreas[i];
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
        if(typeof newVal === "undefined"){
            return;
        }
        if(newVal) {
            if($scope.VA[$scope.presetTypeData.SelectedPreset] !== undefined) {
                $scope.VA[$scope.presetTypeData.SelectedPreset].SensitivityLevel = $scope.ivaDurationSliderModel.data;
            }
        }
    },true);

    function setCommonMenuDisabled() {
        $("#iva-setup-tab-size button").attr('disabled', true);
        $("#iva-setup-tab-sensitivity .slider-fields")
            .css("pointer-events", "none")
            .addClass("cm-opacity");
    }

    function setCommonMenuAbled() {
        $("#iva-setup-tab-size button").attr('disabled', false);
        $("#iva-setup-tab-sensitivity .slider-fields")
            .css("pointer-events", "auto")
            .removeClass("cm-opacity");
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
        if($scope.VA[$scope.presetTypeData.SelectedPreset] === undefined || detectionType === "Off" || detectionType === "MotionDetection") {
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
