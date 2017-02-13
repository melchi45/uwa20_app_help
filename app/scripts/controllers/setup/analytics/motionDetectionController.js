/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('motionDetectionCtrl', function ($scope, $rootScope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $q, ConnectionSettingService, SessionOfUserManager, kindStreamInterface, AccountService, sketchbookService, $translate, $uibModal) {
"use strict";

    var mAttr = Attributes.get();
    $scope.SelectedChannel = 0;
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
    var pageData = {};
    pageData.MotionDetection = {};
    pageData.rois = {};
    pageData.MotionDetectionEnable = {};

    var defaultSensitivity = 80;
    var defaultThreshold = 50;

    var mLastSequenceLevel = 0;

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

    $scope.Handover = [{"HandoverList":[]}];

    $scope.data = {
        'HandoverAreaIndex' : 0
    };

    $scope.handoverEnDisable = 'Disable';

    $scope.VideoAnalysis2Support = false;
    $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis';
    function getCommonCmd(){
        if($scope.VideoAnalysis2Support !== undefined && $scope.VideoAnalysis2Support === true){
            $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis2'
        } else {
            $scope.va2CommonCmd = '/stw-cgi/eventsources.cgi?msubmenu=videoanalysis'
        }
    }
    ////////////////////////////////////////////////////////////////

    //Sunapi에서 받은 Coordinates(ROIs) 값을 백업한다.
    var backupCoordinates = [[],[]];

    $scope.MotionDetection = {};

    $scope.tabs = [];
    $scope.activeTab = {};

    function resetTabData(){
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

    $scope.resetSelectAllCheckbox = function(){
        $scope.selectAllCheckbox = {
            include: true,
            exclude: true
        };
    };

    $scope.checkCurrentEnableState = function(){
        var val = true;
        if($scope.activeTab.title === 'Include'){
            for(var i = 0; i < $scope.selectInclude.length; i++){
                if($scope.selectInclude[i].Mode !== undefined){
                    if($scope.selectInclude[i].isEnable === false){
                        val = false;
                        break;
                    }   
                }
            }

            $scope.selectAllCheckbox.include = val;
        }else if($scope.activeTab.title === 'Exclude'){
            for(var i = 0; i < $scope.selectExclude.length; i++){
                if($scope.selectExclude[i].Mode !== undefined){
                    if($scope.selectExclude[i].isEnable === false){
                        val = false;
                        break;
                    }
                }
            }

            $scope.selectAllCheckbox.exclude = val;
        }
    };

    $scope.indexNumber = [1, 2, 3, 4, 5, 6, 7, 8];
    $scope.selectInclude = [{"ROI":1},{"ROI":2},{"ROI":3},{"ROI":4},{"ROI":5},{"ROI":6},{"ROI":7},{"ROI":8}];
    $scope.selectExclude = [{"ROI":9},{"ROI":10},{"ROI":11},{"ROI":12},{"ROI":13},{"ROI":14},{"ROI":15},{"ROI":16}];

    $scope.isSelectedIncludeIndex = "0";    // "0" means no selected
    $scope.isSelectedExcludeIndex = "0";    // "0" means no selected

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
    $scope.changeSelectedIncludeIndex = function(newVal){
        $scope.isSelectedIncludeIndex = newVal;

        $timeout(function(){
            $scope.$broadcast('liveChartDataClearAll');
            mLastSequenceLevel = 0;
        });
        if($scope.isSelectedIncludeIndex === undefined || parseInt($scope.isSelectedIncludeIndex) === 0){
            //$scope.SensitivitySliderOptions.data = 0;
        } else {
            $scope.SensitivitySliderModel.data = $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex)-1].SensitivityLevel;
            $scope.MDv2ChartOptions.ThresholdLevel = $scope.selectInclude[parseInt($scope.isSelectedIncludeIndex)-1].ThresholdLevel;
            activeShape(newVal - 1);
        }
    };

    $scope.changeSelectedExcludeIndex = function(newVal){
        $scope.isSelectedExcludeIndex = newVal;
        activeShape(newVal - 1);
    };

    // $scope.$watch('isSelectedExcludeIndex', function (newVal, oldVal) {
    //     activeShape(newVal - 1);
    // });

    $scope.$watch('SensitivitySliderModel.data', function (newVal, oldVal) {
        if($scope.isSelectedIncludeIndex !== undefined && parseInt($scope.isSelectedIncludeIndex) !== 0){
            $scope.selectInclude[$scope.isSelectedIncludeIndex - 1].SensitivityLevel = $scope.SensitivitySliderModel.data;
        }
    });

    function activeShape(index){
        sketchbookService.activeShape(index);
    }

    $scope.$watch('MDv2ChartOptions.ThresholdLevel', function (newVal, oldVal) {
        if($scope.isSelectedIncludeIndex !== undefined && parseInt($scope.isSelectedIncludeIndex) !== 0){
            $scope.selectInclude[$scope.isSelectedIncludeIndex - 1].ThresholdLevel = $scope.MDv2ChartOptions.ThresholdLevel;
        }
    });

    $scope.MDv2ChartData = 0;
    $scope.MDv2ChartOptions = {
        showInputBox : true,       // true = show / false = unshow
        ThresholdLevel : 50,        // thresholdLevel value
        floor: 1,                   // min value of Y axis
        ceil: 100,                  // max value of Y axis
        width: 400,                 // width of chart
        height: 150,                 // height of chart
        disabled: false,
        onEnd: function(){}
    };

    function setSizeChart(){
        var chart = "#md-line-chart";
        var width = $(chart).parent().width();
        if(width > 480){
            width = 480;
        }

        width -= 80;
        $scope.MDv2ChartOptions.width = width;

        $(chart+" .graph").css("width", width + "px");
        $(chart+" .graph-border").css("width", (width - 27) + "px");
        $(chart+".level-threshold-slider").css("width", (width + 140) + "px");
    }

    window.addEventListener('resize', setSizeChart);
    $scope.$on("$destroy", function(){
        window.removeEventListener('resize', setSizeChart);
    });

    $scope.SensitivitySliderProperty = {
        floor: 1,
        ceil: 100,
        showSelectionBar: true,
        vertical: false,
        showInputBox: true,
        disabled: false,
        onEnd: function(){}
    };
    $scope.SensitivitySliderModel = {
        data: 80
    };

    $scope.selectTableColumn = function(tableIndex, $event){
         if($event !== undefined){
            if($event.target.nodeName === 'BUTTON'){
                activeShape(tableIndex);
                $scope['changeSelected' + $scope.activeTab.title + 'Index'](tableIndex);
                // toggleCheckbox(tableIndex);
                // $scope.checkCurrentEnableState();
                return;
            }
        }

        if(isVacant(tableIndex)){
            return;
        }

        if($scope.activeTab.title === 'Include'){
            if($scope.isSelectedIncludeIndex === tableIndex){
                $scope.changeSelectedIncludeIndex("0");
                return;
            }
            $scope.changeSelectedIncludeIndex(tableIndex);    // -> $scope.$watch('isSelectedIndex', function (newVal, oldVal) {
        } else if ($scope.activeTab.title === 'Exclude') {
            if($scope.isSelectedExcludeIndex === tableIndex){
                $scope.changeSelectedExcludeIndex("0");
                return;
            }
            $scope.changeSelectedExcludeIndex(tableIndex);    // -> $scope.$watch('isSelectedIndex', function (newVal, oldVal) {
        }
    };

    $scope.selectAllTableColumn = function(){

        var isValidCnt = 0;
        var isEnableCnt = 0;

        if($scope.activeTab.title === 'Include'){

            for(var i = 0; i < $scope.selectInclude.length; i++){
                if($scope.selectInclude[i].Mode !== undefined){
                    isValidCnt++;
                    if($scope.selectInclude[i].isEnable === true){
                        isEnableCnt++;
                    }
                }
            }
            if(isValidCnt - isEnableCnt > 0){
                for(var i = 0; i < $scope.selectInclude.length; i++){
                    var self = $scope.selectInclude[i];
                    if(self.Mode !== undefined){
                        self.isEnable = true;
                        sketchbookService.setEnableForSVG(self.ROI - 1, true);
                    }
                }
                $scope.selectAllCheckbox.include = true;
            } else if(isValidCnt - isEnableCnt === 0) {
                for(var i = 0; i < $scope.selectInclude.length; i++){
                    var self = $scope.selectInclude[i];
                    self.isEnable = false;
                    sketchbookService.setEnableForSVG(self.ROI - 1, false);
                }
                $scope.selectAllCheckbox.include = false;
            } else {
                console.log("count error");
            }

        }

        if($scope.activeTab.title === 'Exclude'){

            for(var i = 0; i < $scope.selectExclude.length; i++){
                if($scope.selectExclude[i].Mode !== undefined){
                    isValidCnt++;
                    if($scope.selectExclude[i].isEnable === true){
                        isEnableCnt++;
                    }
                }
            }
            if(isValidCnt - isEnableCnt > 0){
                for(var i = 0; i < $scope.selectExclude.length; i++){
                    var self = $scope.selectExclude[i];
                    if(self.Mode !== undefined){
                        self.isEnable = true;
                        sketchbookService.setEnableForSVG(self.ROI - 9, true);
                    }
                }
                $scope.selectAllCheckbox.exclude = true;
            } else if(isValidCnt - isEnableCnt === 0) {
                for(var i = 0; i < $scope.selectExclude.length; i++){
                    var self = $scope.selectExclude[i];
                    self.isEnable = false;
                    sketchbookService.setEnableForSVG(self.ROI - 9, false);
                }
                $scope.selectAllCheckbox.exclude = false;
            } else {
                console.log("count error");
            }
        }
    }

    function isVacant(tableIndex){
        
        if($scope.activeTab.title === 'Include' && $scope.selectInclude[tableIndex-1].Mode === undefined){
            return true;
        }

        if($scope.activeTab.title === 'Exclude' && $scope.selectExclude[tableIndex-1].Mode === undefined){
            return true;
        }

        return false;

    }

    function toggleCheckbox(tableIndex){
        var enableOption = null;
        var index = tableIndex - 1;

        if($scope.activeTab.title === 'Include'){
            $scope.selectInclude[index].isEnable = !$scope.selectInclude[index].isEnable;
            enableOption = $scope.selectInclude[index].isEnable;
        } 

        if($scope.activeTab.title === 'Exclude'){
            $scope.selectExclude[index].isEnable = !$scope.selectExclude[index].isEnable;
            enableOption = $scope.selectExclude[index].isEnable;
        } 

        sketchbookService.setEnableForSVG(index, enableOption);
    }

    function getAttributes() {
        if (mAttr.EnableOptions !== undefined)
        {
            $scope.EnableOptions = mAttr.EnableOptions;
        }

        refreshSensitivitySlider();

        /////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
        if (mAttr.ActivateOptions !== undefined)
        {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }

        if (mAttr.WeekDays !== undefined)
        {
            $scope.WeekDays = mAttr.WeekDays;
        }

        if (mAttr.AlarmoutDurationOptions !== undefined)
        {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (Attributes.isSupportGoToPreset() === true)
        {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        if(mAttr.VideoAnalysis2Support !== undefined && mAttr.VideoAnalysis2Support === true){
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

        if (mAttr.HandoverRange !== undefined)
        {
            $scope.HandoverSupport = true;
            $scope.HandoverEnableOptions = ['Enable', 'Disable'];

            $scope.MaxIPV4Len = mAttr.MaxIPV4Len;
            $scope.MaxIPV6Len = mAttr.MaxIPV6Len;
            $scope.IPv4Pattern = mAttr.IPv4;
            $scope.IPv6Pattern = mAttr.IPv6;

            if (mAttr.IpFilterIPType !== undefined)
            {
                $scope.IPTypes = mAttr.IpFilterIPType;
            }

            if (mAttr.HandoverUserMaxLen !== undefined)
            {
                $scope.HandoverUserMinLen = 1;
                $scope.HandoverUserMaxLen = mAttr.HandoverUserMaxLen.maxLength;
            }

            if (mAttr.HandoverPwdMaxLen !== undefined)
            {
                $scope.HandoverPwdMinLen = 1;
                $scope.HandoverPwdMaxLen = mAttr.HandoverPwdMaxLen.maxLength;
            }

            if (mAttr.HandoverPresetRange !== undefined)
            {
                $scope.HandoverPresetMin = mAttr.HandoverPresetRange.minValue;
                $scope.HandoverPresetMax = mAttr.HandoverPresetRange.maxValue;
            }

            if (mAttr.HandoverUserRange !== undefined)
            {
                $scope.HandoverUserMin = mAttr.HandoverUserRange.minValue;
                $scope.HandoverUserMax = mAttr.HandoverUserRange.maxValue;
            }

            $scope.HandoverMin = mAttr.HandoverRange.minValue;
            $scope.HandoverMax = mAttr.HandoverRange.maxValue;
            $scope.data.HandoverAreaIndex = 0;
        } else
        {
            $scope.HandoverSupport = false;
        }



    }

    function getSliderColor()
    {
        return mAttr.sliderEnableColor;
    }

    function refreshSensitivitySlider()
    {
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');

            try{
                var rzslider = $("#md-line-chart rzslider");
                if(!rzslider.hasClass('vertical')){
                    rzslider.addClass('vertical');
                }
            }catch(e){

            }
        });
    }

    function getSketchinfo(color){
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
        if(($scope.activeTab.title === title && isDefault === undefined) ||
           prevMotionDetectionEnable === "Off" ||
           prevMotionDetectionEnable === "IntelligentVideo"){
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

        if(isDefault === undefined){
            prevData = sketchbookService.get();

            /**
             * Enable를 설정한 다음 Tab 버튼을 계속 클릭했을 때
             * prevData 가 undefined이 된다.
             * 그럼 Area의 backupCoordinates가 undefined가 되기 때문에
             * 분기 처리를 추가한다.
             */
            if(prevData !== undefined){
                backupCoordinates[prevTag] = prevData;
            }
        }

        /**
         * Sketch book은 $scope.coordinates에 뿌려주고 싶은 데이터를 설정한 뒤
         * $scope.sketchinfo의 값을 변경하면 $scope.coordinates의 값이 
         * sketchbook에 반영이 된다.
         */
        $scope.coordinates = backupCoordinates[color];
        $scope.sketchinfo = getSketchinfo(color);

        $timeout(function(){
            activeShape($scope['isSelected' + title + 'Index'] - 1);
            if(isIncludeTab){
                setSizeChart();
            }
        });

        getAttributes();
    }

    function getFirstIncludeIndex(){
        var index = 0; //0은 아무것도 선택이 되지 않을 때

        for(var i = 0, len = $scope.selectInclude.length; i < len; i++){
            var self = $scope.selectInclude[i];
            if("Coordinates" in self){
                if(self.Coordinates.length > 0){
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
    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args){
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var mode = null;
        var isEnable = null;
        var title = $scope.activeTab.title;
        var setData = {};
        var roiIndex = modifiedIndex + 1;

        if(title === 'Exclude'){
            roiIndex += 8;            
        }

        $timeout(function(){
            if(modifiedType === "create" || modifiedType === "delete"){
                if(modifiedType === "create"){
                    mode = title === 'Include' ? 'Inside' : 'Outside';
                    isEnable = true;

                    var coordinates = sketchbookService.get();
                    var points = coordinates[modifiedIndex].points;
                    var roi = modifiedIndex + 1;
                    if(mode === 'Outside'){
                        roi += 8;
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
                }else if(modifiedType === "delete"){
                    $scope['select' + title][modifiedIndex] = {
                        Mode: undefined,
                        isEnable: false
                    };
                    if(title === "Include"){
                        $scope['changeSelected' + title + 'Index'](getFirstIncludeIndex());   
                    }else{
                        $scope['changeSelected' + title + 'Index'](0);   
                    }
                    deleteRemovedROI().then(function(){getHandoverList();}, saveSettings);
                }
            }else if(modifiedType === "mouseup"){
                activeShape(modifiedIndex);
                $scope['changeSelected' + title + 'Index'](modifiedIndex + 1);

                var coordinates = sketchbookService.get();
                var points = coordinates[modifiedIndex].points;

                $scope['select' + title][modifiedIndex].Coordinates = points;
            }
        });
    }, $scope);

    $scope.resetVariable = function(){
        try{
            if($scope.MotionDetection.MotionDetectionEnable === false){
                resetTabData();
            }

            $scope.Handover = [{"HandoverList":[]}];

            $scope.coordinates = null;
            $scope.sketchinfo = null;   
            
            $scope.selectInclude = [{"ROI":1},{"ROI":2},{"ROI":3},{"ROI":4},{"ROI":5},{"ROI":6},{"ROI":7},{"ROI":8}];
            $scope.selectExclude = [{"ROI":9},{"ROI":10},{"ROI":11},{"ROI":12},{"ROI":13},{"ROI":14},{"ROI":15},{"ROI":16}];

            $scope.SensitivitySliderModel.data = 80;
            $scope.MDv2ChartOptions.ThresholdLevel = 50;
        }catch(e){
            console.error(e);
        }
    };

    function setDefaultArea(){
        if(prevMotionDetectionEnable === "MotionDetection" || prevMotionDetectionEnable === "MDAndIV"){
            $scope.changeMotionDetectionType($scope.activeTab, true);
        }
    }

    function view(data) {
        if(data === 0) {
            try{
                $rootScope.$emit('resetScheduleData', true);
            }catch(e){
                console.error(e);
            }
        }

        try{
            sketchbookService.removeDrawingGeometry();
        }catch(e){
            console.error(e);
        }
        
        $scope.resetVariable();

        var promises = [];
        promises.push(updateMotionDetectionData);
        promises.push(showVideo);
        promises.push(getEventRules);
        promises.push(getHandoverSetting);

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                $("#imagepage").show();
                $timeout(setDefaultArea);
                $timeout(setSizeChart);
            },
            function(errorData){
                alert(errorData);
            }
        );
    }
    

    function getHandoverSetting(){
        if ($scope.HandoverSupport){
            //promises.push(getHandoverList);
            getHandoverList();
            if ($scope.isPTZModel){
                promises.push(getPresetHandoverList);
            }
        }
    }

    function getMotionDetectionData(successCallback){
        var getData = {};
        var cmd = $scope.va2CommonCmd + '&action=view';
        return SunapiClient.get(cmd, getData,
                successCallback,
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    function updateMotionDetectionData(){
        var successCallback = function(response){
            prepareMotionDetectionData(response.data.VideoAnalysis[0]);
        };

        return getMotionDetectionData(successCallback);
    }

    function prepareMotionDetectionData(mdResponseData){
        setMotionDetectionEnable(mdResponseData.DetectionType);
        setMotionDetectionRules(mdResponseData.ROIs);
    }

    var prevMotionDetectionEnable = null;
    function setMotionDetectionEnable(detectionType){

        prevMotionDetectionEnable = detectionType;
        // DetectionType : MDAndIV, Off, MotionDetection, IntelligentVideo

        if(detectionType === "Off" || detectionType === "IntelligentVideo"){
            $scope.MotionDetection.MotionDetectionEnable = false;
        } else if(detectionType === "MotionDetection" || detectionType === "MDAndIV"){
            $scope.MotionDetection.MotionDetectionEnable = true;
        } else {
            console.log("detectionType error");
            $scope.MotionDetection.MotionDetectionEnable = false;
        }

        pageData.MotionDetection.MotionDetectionEnable = $scope.MotionDetection.MotionDetectionEnable;

    }

    function updateROIData(rois){
        var includeIndex = "0";
        var excludeIndex = "0";
        pageData.rois = angular.copy(rois);

        for(var i = rois.length-1; i >= 0; i--){
            if(rois[i].ROI <= 8){
                $scope.selectInclude[rois[i].ROI-1] = angular.copy(rois[i]);
                //$scope.isSelectedIncludeIndex = rois[i].ROI;
                includeIndex = rois[i].ROI;
            } else {
                $scope.selectExclude[rois[i].ROI-9] = angular.copy(rois[i]);
                //$scope.isSelectedExcludeIndex = rois[i].ROI - 8;
                excludeIndex = rois[i].ROI - 8;
            }
        }

        if($scope.isSelectedIncludeIndex !== "0"){
            includeIndex = $scope.isSelectedIncludeIndex;
        }

        if($scope.isSelectedExcludeIndex !== "0"){
            excludeIndex = $scope.isSelectedExcludeIndex;
        }

        return [includeIndex, excludeIndex];
    }

    function setMotionDetectionRules(rois){
       var updatedROIData = [];

       if(prevMotionDetectionEnable === "Off" || prevMotionDetectionEnable === "IntelligentVideo"){
            return;
       }
        if(rois !== undefined ){
            updatedROIData = updateROIData(rois);
            $scope.changeSelectedIncludeIndex(updatedROIData[0]);
            $scope.changeSelectedExcludeIndex(updatedROIData[1]);
        }

        // TODO :: SET CHECK BOX 
        for(var i = 0; i < $scope.selectInclude.length; i++){
            if($scope.selectInclude[i].Mode !== undefined){
                $scope.selectInclude[i].isEnable = true;
            }
        }

        for(var i = 0; i < $scope.selectExclude.length; i++){
            if($scope.selectExclude[i].Mode !== undefined){
                $scope.selectExclude[i].isEnable = true;
            }
        }

        /**
         * SketchManager에서 사용가능한 형태로 범위를 세팅한다.
         *
         * Include/Exclude의 합은 16이므로 일단 16으로 하드 코딩을 하고
         * 추후에 Sunapi에서 받아올 수 있으면 수정을 한다.
         */
        backupCoordinates = [[],[]];

        for(var i = 1; i <= 16; i++){
            var areaType = i > 8 ? 1 : 0; //include: 0, exclude: 1
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
        if(rois !== undefined){
            for(var i = 0, ii = rois.length; i < ii; i++){
                var self = rois[i];
                var roi = self.ROI;
                var isExclude = roi > 8;
                var coordinates = self.Coordinates;
                var areaType = isExclude ? 1 : 0; //include: 0, exclude: 1
                var points = [];

                if(coordinates.length === 0){
                    continue;
                }

                if(isExclude){
                    roi -= 8;
                }

                for(var j = 0, jj = coordinates.length; j < jj; j++){
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

    function showVideo(){

        var getData = {};
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
                        autoOpen: false,
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
    function startMonitoringMotionLevel()
    {
        (function update()
        {
            getMotionLevel(function (data, index) {
                if(destroyInterrupt) return;
                var newMotionLevel = angular.copy(data);

                if (!mStopMonotoringMotionLevel)
                {
                    if(newMotionLevel.length >= maxSample)
                    {
                        var index = newMotionLevel.length;

                        while(index--)
                        {
                            var level = validateLevel(newMotionLevel[index]);

                            if(level === null) continue;

                            if($scope.MDv2ChartOptions.EnqueueData)
                            {
                                $scope.MDv2ChartOptions.EnqueueData(level);
                            }
                        }
                    }

                    monitoringTimer = $timeout(update, 300); //300 msec
                }
            });
        })();
    }

    function validateLevel(motionLeveObject)
    {
        if(mLastSequenceLevel > motionLeveObject.SequenceID)
        {
            return null;
        }

        mLastSequenceLevel = motionLeveObject.SequenceID;

        return motionLeveObject.Level;
    }

    function getMotionLevel(func)
    {
        var newMotionLevel = {};

        var getData = {};

        getData.MaxSamples = maxSample;
        getData.EventSourceType = 'MotionDetection';
        getData.Index = $scope.isSelectedIncludeIndex;
        
        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

        return SunapiClient.get(sunapiURL, getData,
                function (response)
                {
                    newMotionLevel = angular.copy(response.data.MotionDetection[0].Samples);
                    if (func !== undefined) {
                        func(newMotionLevel, getData.Index);
                    }
                },
                function (errorData)
                {
                    console.log("getMotionLevel Error : ", errorData);
                    startMonitoringMotionLevel();
                }, '', true);
    }

    function stopMonitoringMotionLevel(){
        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
        }
    }

    var destroyInterrupt = false;
    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringMotionLevel();
    });

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.submitEnable = function(){
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function ()
                {
                    return 'lang_apply_question';
                }
            }
        });

        modalInstance.result.then(function(){
            var functionlist = [];
            functionlist.push(setOnlyEnable);
            $q.seqAll(functionlist).then(
                function(){
                    view();
                },
                function(errorData){
                    console.log(errorData);
                }
            );
        }, function (){
            $scope.MotionDetection.MotionDetectionEnable = pageData.MotionDetection.MotionDetectionEnable;
        });
    };



    function setOnlyEnable(){
        var deferred = $q.defer();
        var getData = {};

        var cmd = $scope.va2CommonCmd + '&action=view';
        SunapiClient.get(cmd, getData,
            function (response)
            {
                var detectionType = response.data.VideoAnalysis[0].DetectionType;
                
                var setData = {};
                if($scope.MotionDetection.MotionDetectionEnable === true){
                    if(detectionType === "Off" || detectionType === "MotionDetection"){
                        setData.DetectionType = "MotionDetection";
                    }
                    if(detectionType === "IntelligentVideo" || detectionType === "MDAndIV"){
                        setData.DetectionType = "MDAndIV";
                    }
                } else {

                    if(detectionType === "Off" || detectionType === "MotionDetection"){
                        setData.DetectionType = "Off";
                    }   
                    if(detectionType === "IntelligentVideo" || detectionType === "MDAndIV"){
                        setData.DetectionType = "IntelligentVideo";   
                    }
                }

                var cmd = $scope.va2CommonCmd + '&action=set';
                SunapiClient.get(cmd, setData,
                function (response){
                    deferred.resolve();
                },
                function (errorData){
                    console.log(errorData);
                    deferred.reject(errorData);
                }, '', true);
            }, function(errorData){
                console.log(errorData);
                deferred.reject(errorData);
            }); // 삭제와 Get을 같이함.                    

        return deferred.promise;          
    }

    function set() {
        if(validatePage()){
            sketchbookService.removeDrawingGeometry();
            COMMONUtils.ApplyConfirmation(saveSettings);   
        }
    }

    function saveSettings() {

        var functionlist = [];
        // SUNAPI SET
        ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
        //setHandoverList($scope.isSelectedIncludeIndex).then(updateHandoverList($scope.isSelectedIncludeIndex-1)).then(setEnable()).then(setEventRules);
        
        functionlist.push(function(){
            return setEnable();
        });

        if($scope.MotionDetection.MotionDetectionEnable === true){
            //setEnable().then(setHandoverList($scope.isSelectedIncludeIndex-1)).then(saveHandoverFunction).then(setEventRules).then(view);    
            functionlist.push(function(){
                return setHandoverList($scope.isSelectedIncludeIndex-1);
            });

            saveHandoverFunction(functionlist);
        }

        functionlist.push(setEventRules);
        //functionlist.push(view);
        $q.seqAll(functionlist).then(
            function(){
                getHandoverList(view);
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            mAttr = Attributes.get();
            getAttributes();
            getCommonCmd();
            view();
            startMonitoringMotionLevel();
        }
    })();

    $scope.submit = set;
    $scope.view = view;


    function sunapiQueueRequest(queue, callback){
        var currentItem = queue.shift();
        SunapiClient.get(
            currentItem.url, 
            currentItem.reqData, 
            function(response){

            }, 
            function(errorData) {
            //alert(errorData);
            }, 
            '', 
            true
        ).then(reqCallback);

        function reqCallback(){
            if(queue.length > 0){
                sunapiQueueRequest(queue, callback);
            }else{
                callback();
            }
        }
    }

    var globalQueue = [];
    function sendUpdateHandoverList(){
        var deferred = $q.defer();

        sunapiQueueRequest(angular.copy(globalQueue), function(){
            deferred.resolve();
        });

        return deferred.promise;
    }

    function saveHandoverFunction(functionlist){

        var promise = null;
        var item = null;
        var queue = [];
        globalQueue = [];

        if ($scope.HandoverSupport && !angular.equals(pageData.Handover[$scope.presetTypeData.SelectedPreset].HandoverList, $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList))
        {
            for (var i = 0; i < $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList.length; i++)
            {
                if (!angular.equals(pageData.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i], $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i]))
                {
                    var index = i;
                    //promises.push(function(){return setHandoverList(index, $scope.presetTypeData.SelectedPreset);});
                    // functionlist.push(function(){
                    //     return setHandoverList(index, $scope.presetTypeData.SelectedPreset);
                    // });

                    functionlist.push((function(index, selectedPreset){
                        var index = index;
                        var selectedPreset = selectedPreset;
                        return function(){
                            return setHandoverList(index, selectedPreset);
                        };
                    })(i, $scope.presetTypeData.SelectedPreset));

                    if($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i] !== undefined)
                    {
                        if ($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i].UserList.length)
                        {
                            for (var j = 0; j < $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i].UserList.length; j++)
                            {
                                item = updateHandoverList(i, j, $scope.presetTypeData.SelectedPreset);
                                queue.push(item);
                            }
                        }
                    }
                }
            }

            globalQueue = queue;
            functionlist.push(function(){
                return sendUpdateHandoverList();
            });
            //promises.push(sendUpdateHandoverList);

            if($scope.presetTypeData.SelectedPreset > 0){
                functionlist.push(function(){
                    return getPresetHandoverList();
                });
                //promises.push(getPresetHandoverList);
            } else {
                functionlist.push(function(){
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
    function getEventRules() {
        var getData = {};
        getData.EventSource = 'MotionDetection';

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
                function (response){
                    prepareEventRules(response.data.EventRules);
                },
                function (errorData){
                    console.log(errorData);
                }, '', true);
    }

    function prepareEventRules(eventRules) {
        $scope.EventRule = {};

        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;

        $scope.EventRule.Enable = eventRules[0].Enable;
        $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;

        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));

        $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;

        if (typeof eventRules[0].EventAction !== 'undefined')
        {
            if (eventRules[0].EventAction.indexOf('FTP') !== -1)
            {
                $scope.EventRule.FtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('SMTP') !== -1)
            {
                $scope.EventRule.SmtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('Record') !== -1)
            {
                $scope.EventRule.RecordEnable = true;
            }
        }

        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[0].AlarmOutputs === 'undefined')
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};

                var duration = 'Off';
                for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++)
                {
                    if (ao + 1 === eventRules[0].AlarmOutputs[j].AlarmOutput)
                    {
                        duration = eventRules[0].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }

        if (typeof eventRules[0].PresetNumber === 'undefined')
        {
            $scope.EventRule.PresetNumber = 'Off';
        } else
        {
            $scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
        }

        pageData.EventRule = angular.copy($scope.EventRule);
    }

    function deleteRemovedROI(){
        //삭제된 Index 찾아서 삭제 요청
        var deferred = $q.defer();
        var removedROIIndex = [];
        var promises = [];

        // console.log(pageData.rois);

        if(!(prevMotionDetectionEnable === "Off" || prevMotionDetectionEnable === "IntelligentVideo")){
            for(var i = 0, ii = pageData.rois.length; i < ii; i++){
                var roi = pageData.rois[i].ROI;
                var self = null;
                if(roi > 8){
                    self = $scope.selectExclude[roi - 9];
                }else{
                    self = $scope.selectInclude[roi - 1];
                }

                if(self.Mode === undefined){
                    removedROIIndex.push(roi);
                }
            }
        }

        if(removedROIIndex.length > 0){
            var cmd = $scope.va2CommonCmd + '&action=remove';
            SunapiClient.get(cmd,            
            //SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=remove', 
                {
                    ROIIndex: removedROIIndex.join(',')
                },
                function (response){
                    // console.log("removed");
                    deferred.resolve(removedROIIndex);
                },
                function (errorData){
                    console.log(errorData);
                    deferred.reject(errorData);
                }, '', true);
        }else{
            $timeout(function(){
                deferred.resolve(removedROIIndex);
            });
        }

        return deferred.promise;
    }

    function getUnmodifiedROIIndex(){
        var unmodifiedROIIndex = [];

        for(var i = 0, ii = pageData.rois.length; i < ii; i++){
            var pageDataItem = pageData.rois[i];
            var roi = pageDataItem.ROI;
            var self = null;
            if(roi > 8){
                self = $scope.selectExclude[roi - 9];
            }else{
                self = $scope.selectInclude[roi - 1];
            }

            var coor = [];
            var selfCoor = [];
            for(var j = 0, jj = pageDataItem.Coordinates.length; j < jj; j++){
                coor.push([
                    pageDataItem.Coordinates[j].x,
                    pageDataItem.Coordinates[j].y
                ]);
            }

            if(self.Mode !== undefined){
                if(self.Coordinates[0].toString() === "[object Object]"){
                    for(var j = 0, jj = self.Coordinates.length; j < jj; j++){
                        selfCoor.push([
                            self.Coordinates[j].x,
                            self.Coordinates[j].y
                        ]);
                    }
                }else{
                    selfCoor = self.Coordinates;
                }
                if(
                    self.SensitivityLevel === pageDataItem.SensitivityLevel &&
                    self.ThresholdLevel === pageDataItem.ThresholdLevel &&
                    selfCoor.join(',') === coor.join(',')
                    ){
                    unmodifiedROIIndex.push(roi);
                }
            }
        }

        return unmodifiedROIIndex;
    }

    function getModifiedROIIndex(unmodifiedROIIndex, deletedROIIndex){
        var modifiedIndex = [];
        for(var i = 1; i <= 16; i++){
            var isOk = true;
            var self = null;

            for(var j = 0, jj = unmodifiedROIIndex.length; j < jj; j++){
                if(unmodifiedROIIndex[j] === i){
                    isOk = false;
                }
            }

            for(var j = 0, jj = deletedROIIndex.length; j < jj; j++){
                if(deletedROIIndex[j] === i){
                    isOk = false;
                }
            }

            if(isOk){
                if(i > 8){
                    self = $scope.selectExclude[i - 9];
                }else{
                    self = $scope.selectInclude[i - 1];
                }

                if('Mode' in self){
                    modifiedIndex.push(i);   
                }
            }
        }

        return modifiedIndex;
    }


    function setEnable(){

        //console.log(" ::::: SET ENABLE START ::::: ");
        var deferred = $q.defer();
        var getData = {};
        //getData.DetectionType = 'MotionDetection';

        //return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=view', getData,
        var cmd = $scope.va2CommonCmd + '&action=view';
        SunapiClient.get(cmd, getData,
        //SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=view', getData,
                function (response)
                {
                    //console.log(" ::: response.data.VideoAnalysis[0]", response.data.VideoAnalysis[0].DetectionType);
                    // DetectionType : MDAndIV, Off, MotionDetection, IntelligentVideo

                    var detectionType = response.data.VideoAnalysis[0].DetectionType;
                    
                    var setData = {};
                    if($scope.MotionDetection.MotionDetectionEnable === true){

                        if(detectionType === "Off" || detectionType === "MotionDetection"){
                            setData.DetectionType = "MotionDetection";
                        }
                        if(detectionType === "IntelligentVideo" || detectionType === "MDAndIV"){
                            setData.DetectionType = "MDAndIV";
                        }

                    } else {

                        if(detectionType === "Off" || detectionType === "MotionDetection"){
                            setData.DetectionType = "Off";
                        }   
                        if(detectionType === "IntelligentVideo" || detectionType === "MDAndIV"){
                            setData.DetectionType = "IntelligentVideo";   
                        }
                    }

                    var unmodifiedROIIndex = getUnmodifiedROIIndex();
                    deleteRemovedROI().then(function(deletedROIIndex){
                        var modifiedIndex = getModifiedROIIndex(unmodifiedROIIndex, deletedROIIndex);

                        if(modifiedIndex.length > 0){
                            for(var i = 0, ii = modifiedIndex.length; i < ii; i++){
                                var self = modifiedIndex[i];
                                var property = '';
                                var index = self - 1;
                                if(self > 8){
                                    property = 'selectExclude';
                                    index -= 8;
                                }else{
                                    property = 'selectInclude';
                                }
                                var data = $scope[property][index];
                                var coor = [];

                                if(data.Mode !== undefined){
                                    if(data.Coordinates[0].toString() === "[object Object]"){
                                        for(var j = 0, jj = data.Coordinates.length; j < jj; j++){
                                            coor.push([
                                                data.Coordinates[j].x,
                                                data.Coordinates[j].y
                                            ]);
                                        }
                                    }else{
                                        coor = data.Coordinates;
                                    }

                                    setData['ROI.' + self + '.Coordinate'] = coor.join(',');
                                    setData['ROI.' + self + '.SensitivityLevel'] = data.SensitivityLevel;
                                    setData['ROI.' + self + '.ThresholdLevel'] = data.ThresholdLevel;   
                                }
                            }
                        }

                        //console.log(" ///// setData", setData);

                        var cmd = $scope.va2CommonCmd + '&action=set';
                        SunapiClient.get(cmd, setData,
                        //SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=videoanalysis&action=set', setData,
                        function (response){
                            // console.log("modified");
                            //console.log(" ::::: SET ENABLE END ::::: ");
                            deferred.resolve();
                        },
                        function (errorData){
                            console.log(errorData);
                            deferred.reject(errorData);
                        }, '', true);
                    }, function(errorData){
                        console.log(errorData);
                        deferred.reject(errorData);
                    }); // 삭제와 Get을 같이함.                    
                },
                function (errorData)
                {
                    console.log(errorData);
                    deferred.reject(errorData);
                }, '', true);


        return deferred.promise;
    }


    function setEventRules()
    {
        var setData = {};

        setData.RuleIndex = $scope.EventRule.RuleIndex;

        setData.EventAction = "";
        if ($scope.EventRule.FtpEnable)
        {
            setData.EventAction += 'FTP,';
        }

        if ($scope.EventRule.SmtpEnable)
        {
            setData.EventAction += 'SMTP,';
        }

        if ($scope.EventRule.RecordEnable)
        {
            setData.EventAction += 'Record,';
        }

        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
        {
            if ($scope.EventRule.AlarmOutputs[ao].Duration !== 'Off')
            {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRule.AlarmOutputs[ao].Duration;
            }
        }

        if ($scope.EventRule.PresetNumber !== 'Off')
        {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRule.PresetNumber;
        }

        if (setData.EventAction.length)
        {
            setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }

        setData.ScheduleType = $scope.EventRule.ScheduleType;
        //if ($scope.EventRule.ScheduleType === 'Scheduled')
        {
            var diff = $(pageData.EventRule.ScheduleIds).not($scope.EventRule.ScheduleIds).get();

            var sun = 0, mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0;

            for (var s = 0; s < diff.length; s++)
            {
                var str = diff[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
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

            for (var s = 0; s < $scope.EventRule.ScheduleIds.length; s++)
            {
                var str = $scope.EventRule.ScheduleIds[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
                            case 0:
                                sun = 1;
                                setData["SUN" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 1:
                                mon = 1;
                                setData["MON" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 2:
                                tue = 1;
                                setData["TUE" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 3:
                                wed = 1;
                                setData["WED" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 4:
                                thu = 1;
                                setData["THU" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 5:
                                fri = 1;
                                setData["FRI" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 6:
                                sat = 1;
                                setData["SAT" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            default:
                                break;
                        }
                    }
                }
            }

            if (sun)
            {
                setData.SUN = 1;
            }

            if (mon)
            {
                setData.MON = 1;
            }

            if (tue)
            {
                setData.TUE = 1;
            }

            if (wed)
            {
                setData.WED = 1;
            }

            if (thu)
            {
                setData.THU = 1;
            }

            if (fri)
            {
                setData.FRI = 1;
            }

            if (sat)
            {
                setData.SAT = 1;
            }
        }

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData,
                function (response)
                {
                    pageData.EventRule = angular.copy($scope.EventRule);
                },
                function (errorData)
                {
                    pageData.EventRule = angular.copy($scope.EventRule);
                    console.log(errorData);
                }, '', true);
    }

    function validatePage(){
        var returnVal = true;
        var errorMessage = null;
        var handoverList = $scope.Handover[0].HandoverList;

        function validateHandOverItem(handoverData){
            //IPv4
            if(handoverData.IPType === $scope.IPTypes[0]){
                if(handoverData.IPV4Address === undefined){
                    return 'lang_msg_chkIPAddress';
                }else if(COMMONUtils.CheckValidIPv4Address(handoverData.IPV4Address) === false){
                    return 'lang_msg_chkIPAddress';
                }
            //IPv6
            }else{
                if(handoverData.IPV6Address === undefined){
                    return 'lang_msg_chkIPv6Address';
                }else if(COMMONUtils.CheckValidIPv6Address(handoverData.IPV6Address) === false){
                    return 'lang_msg_chkIPv6Address';
                }
            }

            //Port
            if(
                handoverData.Port === undefined || 
                parseInt(handoverData.Port) <= 0 || 
                parseInt(handoverData.Port) > mAttr.Http.maxValue){
                return 'lang_msg_Theportshouldbebetween1and65535';
            }

            //UserName
            if (handoverData.Username === undefined){
                return 'lang_msg_invalid_userID';
            }

            //Password
            if (handoverData.Password === undefined){
                return 'lang_msg_invalid_pw';
            }

            //PresetNumber
            if (
                handoverData.PresetNumber === undefined ||
                parseInt(handoverData.PresetNumber) < $scope.HandoverPresetMin ||
                parseInt(handoverData.PresetNumber) > $scope.HandoverPresetMax){
                return $translate
                            .instant('lang_range_alert')
                            .replace('%1', $scope.HandoverPresetMin)
                            .replace('%2', $scope.HandoverPresetMax);
            }

            return true;
        }


        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0){
            errorMessage = 'lang_msg_checkthetable';
            returnVal = false;
        }else{
            for(var i = 0, ii = handoverList.length; i < ii; i++){
                var userList = handoverList[i].UserList;
                var userListLength = userList.length;
                if(userListLength > 0){
                    for(var j = 0; j < userListLength; j++){
                        var isOk = validateHandOverItem(userList[j]);
                        if(isOk !== true){
                            errorMessage = isOk;
                            returnVal = false;
                            break;
                        }
                    }

                    if(returnVal === false){
                        break;
                    }
                }
            }
        }

        if(errorMessage !== null){
            COMMONUtils.ShowError(errorMessage);   
        }

        return returnVal;
    }

    function inArray(arr, str) {
        for(var i = 0; i < arr.length; i++) {
            var tArray = arr[i].split(".");
            tArray = tArray[0] + "." + tArray[1];
            if(tArray == str){
                return i;
            }
        }
        return -1;
    }

    $scope.setColor = function (day, hour, isAlways)
    {
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
            {
                if (isAlways)
                {
                    return 'setMiniteFaded';
                } else
                {
                    return 'setMinite already-selected ui-selected';
                }
            }
        }

        if ($scope.EventRule.ScheduleIds.indexOf(day + '.' + hour) !== -1)
        {
            if (isAlways)
            {
                return 'setHourFaded';
            } else
            {
                return 'setHour already-selected ui-selected';
            }
        }
    };

    $scope.mouseOver = function (day, hour)
    {   
        var index = inArray($scope.EventRule.ScheduleIds, day + '.' + hour);
        if(index !== -1){
            $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[index].split('.');
        }
        // $scope.MouseOverMessage = [];
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        // {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0)
        //     {
        //         $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
        //         break;
        //     }
        // }
    };

    $scope.mouseLeave = function ()
    {
        $scope.MouseOverMessage = [];
    };

    $(document).ready(function ()
    {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $scope.getTooltipMessage = function ()
    {
        if (typeof $scope.MouseOverMessage !== 'undefined')
        {
            var hr, fr, to;

            if($scope.MouseOverMessage.length === 2) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = '00';
                var to = '59';
            } else if($scope.MouseOverMessage.length === 4) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[2], 2);
                var to = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[3], 2);
            } else {
                return;
            }

            return "(" + $translate.instant($scope.MouseOverMessage[0]) + ") " + hr + ":" + fr + " ~ " + hr + ":" + to;
        }
    };

    $scope.clearAll = function ()
    {
        $timeout(function(){
            $scope.EventRule.ScheduleIds = [];
        });
    };

    $scope.open = function (day, hour)
    {
        $scope.SelectedDay = day;
        $scope.SelectedHour = hour;

        $scope.SelectedFromMinute = 0;
        $scope.SelectedToMinute = 59;

        var index = inArray($scope.EventRule.ScheduleIds, day + '.' + hour);
        if(index !== -1){
            var str = $scope.EventRule.ScheduleIds[index].split('.');
            if (str.length === 4) {
                $scope.SelectedFromMinute = Math.round(str[2]);
                $scope.SelectedToMinute = Math.round(str[3]);
            }
        }
        
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        // {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
        //     {
        //         var str = $scope.EventRule.ScheduleIds[i].split('.');

        //         if (str.length === 4)
        //         {
        //             $scope.SelectedFromMinute = Math.round(str[2]);
        //             $scope.SelectedToMinute = Math.round(str[3]);
        //         }
        //         break;
        //     }
        // }

        var modalInstance = $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/common/schedulePopup.html',
            controller: 'modalInstanceCtrl',
            resolve: {
                SelectedDay: function ()
                {
                    return $scope.SelectedDay;
                },
                SelectedHour: function ()
                {
                    return $scope.SelectedHour;
                },
                SelectedFromMinute: function ()
                {
                    return $scope.SelectedFromMinute;
                },
                SelectedToMinute: function ()
                {
                    return $scope.SelectedToMinute;
                },
                Rule: function ()
                {
                    return $scope.EventRule;
                }
            }
        });

        modalInstance.result.then(function (selectedItem)
        {
            //console.log("Selected : ",selectedItem);
                }, function ()
                {
                    modalInstance = null;
                    //$log.info('Modal dismissed at: ' + new Date());
                });
    };
    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////

    var getHandoverList = function(successCallback){
        var getData = {};
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=view', getData,
                function (response){
                    //Enable이 비활성화 일 때 Handover는 필요없으므로 Return
                    if($scope.MotionDetection.MotionDetectionEnable === false) return;

                    $scope.Handover[0].HandoverList = response.data.Handover[0].HandoverList;

                    for (var i = 0; i < $scope.Handover[0].HandoverList.length; i++)
                    {
                        $scope.Handover[0].HandoverList[i].CheckAll = false;
                        $scope.Handover[0].HandoverList[i].Enable = $scope.Handover[0].HandoverList[i].Enable ? $scope.HandoverEnableOptions[0] : $scope.HandoverEnableOptions[1];

                        for (var j = 0; j < $scope.Handover[0].HandoverList[i].UserList.length; j++)
                        {
                            $scope.Handover[0].HandoverList[i].UserList[j].SelectedHandoverIndex = false;

                            if ($scope.Handover[0].HandoverList[i].UserList[j].IPType === $scope.IPTypes[0])
                            {
                                $scope.Handover[0].HandoverList[i].UserList[j].IPV4Address = $scope.Handover[0].HandoverList[i].UserList[j].IPAddress;
                                $scope.Handover[0].HandoverList[i].UserList[j].IPV6Address = 'fe80::209:18ff:fee1:61f';
                            } else
                            {
                                $scope.Handover[0].HandoverList[i].UserList[j].IPV4Address = "1.1.1.1";
                                $scope.Handover[0].HandoverList[i].UserList[j].IPV6Address = $scope.Handover[0].HandoverList[i].UserList[j].IPAddress;
                            }
                        }
                    }

                    pageData.Handover = angular.copy($scope.Handover);

                    $scope.handoverEnDisable = ($scope.findHandoverIndex() === -1) ? 'Disable' : $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[$scope.findHandoverIndex()].Enable;

                    if(successCallback !== undefined){
                        successCallback();
                    }

                    $scope.$apply();
                },
                function (errorData)
                {
                    /*
                    if (errorData !== "Configuration Not Found")
                    {
                        alert(errorData);
                    }*/
                    $scope.Handover[0].HandoverList = [];
                    pageData.Handover = angular.copy($scope.Handover);
                }, '', true);
    };
    
    var getPresetHandoverList = function()
    {
        var getData = {};
        getData.PresetIndex = "All";
        
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=view', getData,
                function (response)
                {
            $timeout(function(){
                var presetHandover = angular.copy(response.data.Handover[0].PresetList);
                
                for (var a = 0; a < $scope.PresetNameValueOptions.length; a++)
                {
                    var index = a + 1;

                    var idx = -1;
                    for (var b = 0; b < presetHandover.length; b++)
                    {
                        var Preset = $scope.PresetNameValueOptions[a].split(' : ');
                        if (Preset[0] == presetHandover[b].PresetIndex)
                        {
                            idx = b;
                            break;
                        }
                    }
                    $scope.Handover[index] = {};
                    $scope.Handover[index].PresetIndex = $scope.PresetNameValueOptions[a].Preset;
                    $scope.Handover[index].HandoverList = [];
                    if (idx != -1)
                    {
                        $scope.Handover[index].HandoverList = angular.copy(presetHandover[idx].HandoverList);
                    }
                    
                    for (var i = 0; i < $scope.Handover[index].HandoverList.length; i++)
                    {
                        $scope.Handover[index].HandoverList[i].CheckAll = false;
                        $scope.Handover[index].HandoverList[i].Enable = $scope.Handover[index].HandoverList[i].Enable ? $scope.HandoverEnableOptions[0] : $scope.HandoverEnableOptions[1];
                        if (typeof $scope.Handover[index].HandoverList[i].UserList == 'undefined') $scope.Handover[index].HandoverList[i].UserList = [];
                        for (var j = 0; j < $scope.Handover[index].HandoverList[i].UserList.length; j++)
                        {
                            $scope.Handover[index].HandoverList[i].UserList[j].SelectedHandoverIndex = false;

                            if ($scope.Handover[index].HandoverList[i].UserList[j].IPType === $scope.IPTypes[0])
                            {
                                $scope.Handover[index].HandoverList[i].UserList[j].IPV4Address = $scope.Handover[index].HandoverList[i].UserList[j].IPAddress;
                                $scope.Handover[index].HandoverList[i].UserList[j].IPV6Address = 'fe80::209:18ff:fee1:61f';
                            } else
                            {
                                $scope.Handover[index].HandoverList[i].UserList[j].IPV4Address = "1.1.1.1";
                                $scope.Handover[index].HandoverList[i].UserList[j].IPV6Address = $scope.Handover[index].HandoverList[i].UserList[j].IPAddress;
                            }
                        }
                    }
                }
                pageData.Handover = angular.copy($scope.Handover);
                $scope.$apply();                    

           },100);          
            
                },
                function (errorData)
                {
                    if ($scope.Handover.length <= 1) 
                    {
                        for (var a = 0; a < $scope.PresetNameValueOptions.length; a++)
                        {
                            var index = a + 1;
                            $scope.Handover[index] = {};
                            $scope.Handover[index].PresetIndex = PresetNameValueOptions[a].Preset;
                            $scope.Handover[index].HandoverList = [];
                        }
                        viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                    }
                    pageData.Handover = angular.copy($scope.Handover);
                }, '', true);
    }

    function viewHandoverAreaOptions(presetIdx)
    {
        var index = presetIdx;
        if (typeof presetIdx == 'undefined') index = 0;

        var HandoverAreaOptionsArray = [];

        if(typeof $scope.Handover[index] != 'undefined' && $scope.Handover[index].HandoverList.length)
        {
            for(var i=0; i < $scope.Handover[index].HandoverList.length; i++)
            {
                if(typeof $scope.Handover[index].HandoverList[i] != 'undefined')
                {
                    HandoverAreaOptionsArray.push($scope.Handover[index].HandoverList[i].ROIIndex);
                }
            }
            $scope.HandoverAreaOptions = HandoverAreaOptionsArray;
        } else
        {
            $scope.HandoverAreaOptions = COMMONUtils.getArrayWithMinMax($scope.HandoverMin, $scope.HandoverMin);
        }
    }

    function setHandoverList(handoverlistIndex, index){
        //console.log(" ::::: setHandoverList START ::::: ");
        var deferred = $q.defer();
        if (typeof index == 'undefined') index = 0;
        // if(handoverlistIndex > 0){
        // handoverlistIndex--;
        // }
        // console.log("::: handover", $scope.Handover[index]);
        // if ($scope.Handover[index].HandoverList[handoverlistIndex] !== undefined)
        // {
        var setData = {};
        try{
            setData.ROIIndex = $scope.Handover[index].HandoverList[handoverlistIndex].ROIIndex;   
        }catch(e){
            setData.ROIIndex = $scope.isSelectedIncludeIndex;
        }

        setData.Enable = ($scope.handoverEnDisable === $scope.HandoverEnableOptions[0]) ? true : false;

        if (index > 0){
            setData.PresetIndex = index;
        }

        //console.log(" ::: setData", setData);
        SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=set', setData,
            function (response){
                deferred.resolve(response);
            },
            function (errorData){
                if(errorData === "Error Parsing response"){
                    deferred.resolve();
                }else{
                    deferred.reject(errorData);
                }
                //console.log(" ::::: ERR ::::: ");
                //alert(errorData);
            }, '', true);

        return deferred.promise;
    }


    function updateHandoverList(roiIndex, userIndex, index)
    {
        //console.log(" ::::: roiIndex, userIndex, index", roiIndex, userIndex, index);
        if (typeof index == 'undefined') index = 0;
        if (typeof userIndex == 'undefined') userIndex = 0;

        var setData = {};
        var userList = $scope.Handover[index].HandoverList[roiIndex].UserList[userIndex];
        var pageDataUserList = pageData.Handover[index].HandoverList[roiIndex].UserList[userIndex];

        setData.ROIIndex = $scope.Handover[index].HandoverList[roiIndex].ROIIndex;
        //console.log("$scope.Handover", $scope.Handover);
        
        //console.log("HandoverIndex", HandoverIndex);

        //HandoverIndex = $scope.isSelectedIncludeIndex-1;
        setData.HandoverIndex = userList.HandoverIndex;

        if(pageDataUserList.IPType !== userList.IPType){
            setData.IPType = userList.IPType;
        }

        if (userList.IPType === $scope.IPTypes[0])
        {
            if(pageDataUserList.IPAddress !== userList.IPV4Address){
                setData.IPAddress = userList.IPV4Address;
            }
        } else
        {
            if(pageDataUserList.IPAddress !== userList.IPV6Address){
                setData.IPAddress = userList.IPV6Address;
            }
        }

        if(pageDataUserList.Port !== userList.Port){
            setData.Port = userList.Port;
        }

        if(pageDataUserList.Username !== userList.Username){
            setData.Username = userList.Username;
        }

        if(pageDataUserList.Password !== userList.Password){
            setData.Password = userList.Password;
        }

        if(pageDataUserList.PresetNumber !== userList.PresetNumber){
            setData.PresetNumber = userList.PresetNumber;   
        }

        if (index > 0) {
            setData.PresetIndex = index;
        }

        //console.log(" ::::: setData", setData);
        return {
            url: '/stw-cgi/eventrules.cgi?msubmenu=handover&action=update', 
            reqData: setData
        };
    }

    function addUserToHandover(roiIndex, index)
    {
        
        //console.log(" ::: roiIndex, index", roiIndex, index);

        if (typeof index == 'undefined') index = 0;
        var setData = {};

        //var areaIndex = roiIndex - 1;
        var areaIndex = $scope.findHandoverIndex();
        var userIndex = $scope.Handover[index].HandoverList[areaIndex].UserList.length - 1;
        //console.log(" ::: roiIndex, index, areaIndex, userIndex", roiIndex, index, areaIndex, userIndex);

        setData.ROIIndex = roiIndex;
        setData.IPType = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].IPType;

        if (setData.IPType === $scope.IPTypes[0])
        {
            setData.IPAddress = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].IPV4Address;
        } else
        {
            setData.IPAddress = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].IPV6Address;
        }

        setData.Port = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].Port;
        setData.Username = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].Username;
        setData.Password = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].Password;
        setData.PresetNumber = $scope.Handover[index].HandoverList[areaIndex].UserList[userIndex].PresetNumber;
        if (index > 0) {
            setData.PresetIndex = index;
        }

        //console.log(" ::: setData", setData);
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=add', setData,
                function (response)
                {
                    pageData.Handover = angular.copy($scope.Handover);
                },
                function (errorData)
                {
                    console.log(" ::: errorData", errorData);
                    //alert(errorData);
                }, '', true);
    }

    function removeUserFromHandover(roiIndex, userIndexArray, index)
    {
        var setData = {};

        setData.ROIIndex = roiIndex;

        if (typeof userIndexArray !== 'undefined' && userIndexArray.length)
        {
            setData.HandoverIndex = '';

            for (var i = 0; i < userIndexArray.length; i++)
            {
                setData.HandoverIndex += userIndexArray[i] + ',';
            }

            if (setData.HandoverIndex.length)
            {
                setData.HandoverIndex = setData.HandoverIndex.substring(0, setData.HandoverIndex.length - 1);
            }
        }
        if (index > 0){
            setData.PresetIndex = index;
        }

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=handover&action=remove', setData,
                function (response)
                {
                    pageData.Handover = angular.copy($scope.Handover);
                },
                function (errorData)
                {
                   //alert(errorData);
                }, '', true);
    }

    $scope.removeHandover = function (){
        var functionlist = [];
        functionlist.push(function(){return $timeout(function(){setHandoverList();}, 200);});
        functionlist.push(function(){return removeHandoverFunction();});
        $q.seqAll(functionlist).then(
            function(){
            },
            function(errorData){
                console.log(errorData);
            }
        );
    };

    function removeHandoverFunction(){
        var promises = [];
        var promise;

        //var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);
        
        var areaIndex = getHandoverListIndex();
        //console.log(" ::: removeHandover", areaIndex);

        if (typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList !== 'undefined' && typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex] !== 'undefined')
        {
            if ($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList.length)
            {
                var userIndexArray = [];

                for (var i = 0; i < $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList.length; i++)
                {
                    if ($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList[i].SelectedHandoverIndex)
                    {
                        userIndexArray.push($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList[i].HandoverIndex);
                    }
                }

                if (userIndexArray.length)
                {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'views/setup/common/confirmMessage.html',
                        controller: 'confirmMessageCtrl',
                        size: 'sm',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_confirm_remove_profile';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        if (!angular.equals(pageData.VA[$scope.presetTypeData.SelectedPreset], $scope.VA[$scope.presetTypeData.SelectedPreset]))
                        {
                            if ($scope.presetTypeData.SelectedPreset > 0){
                                setPresetVideoAnalysis($scope.presetTypeData.SelectedPreset, promises);
                            } else {
                                setVideoAnalysis(promises);
                            }
                        }

                        if (userIndexArray.length === $scope.HandoverUserMax)
                        {
                            promise = function(){return removeUserFromHandover($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].ROIIndex, undefined, $scope.presetTypeData.SelectedPreset);}; 
                        } else
                        {
                            promise = function(){return removeUserFromHandover($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].ROIIndex, userIndexArray, $scope.presetTypeData.SelectedPreset);};
                        }

                        promises.push(promise);

                        $q.seqAll(promises).then(function () {
                            var promises2 = [];
                            if ($scope.presetTypeData.SelectedPreset > 0){
                                promises2.push(getPresetHandoverList);
                            } else {
                                promises2.push(getHandoverList);
                            }
                            $q.seqAll(promises2).then(function () {
                                viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                            }, function (errorData2) {
                            });
                        }, function (errorData) {
                            //alert(errorData);
                        });
                    }, function ()
                    {

                    });
                }
            }
        }
    };

    $scope.addHandover = function (){
        var prevIsSelectedIncludeIndex = $scope.isSelectedIncludeIndex;

        var functionlist = [];
        functionlist.push(function(){return $timeout(function(){setHandoverList();}, 200);});
        functionlist.push(function(){return addHandoverFunction(prevIsSelectedIncludeIndex);});
        $q.seqAll(functionlist).then(
            function(){
            },
            function(errorData){
                console.log(errorData);
            }
        );
    };


    var modalInstance = null;
    function addHandoverFunction(prevIsSelectedIncludeIndex){
        var promises = [];
        var promise;
//        var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);
//        var areaIndex = $scope.isSelectedIncludeIndex - 1;
        $scope.isSelectedIncludeIndex = prevIsSelectedIncludeIndex;
        var areaIndex = prevIsSelectedIncludeIndex - 1;
        
        if(true)
        //if (typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList !== 'undefined' && typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex] !== 'undefined')
        {
            //if ($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList.length < $scope.HandoverUserMax)
            if(true)
            //if ($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList.length < $scope.HandoverUserMax)
            {
                if(modalInstance !== null){
                    modalInstance.dismiss();   
                }
                modalInstance = $uibModal.open({
                    templateUrl: 'views/setup/common/handoverAddCamera.html',
                    controller: 'handoverAddCameraCtrl',
                    resolve: {
                        HandoverList: function ()
                        {
                            //console.log(" ::: $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList", $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList);
                            return $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList;
                        },
                        SelectedArea: function ()
                        {
                            //console.log(" ::: areaIndex", areaIndex);
                            return areaIndex;
                        }
                    }
                });

                var g_userList = [];
                modalInstance.result.then(function (returnValue){
                    modalInstance = null;
                    //console.log(" ::: returnValue, userList", returnValue[0],returnValue[1]);

                    g_userList = returnValue[1];
                    setEnable().then(function(){
                        getHandoverList(function(){
                        
                        //$scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[areaIndex].UserList.push(g_userList);
                        $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[$scope.findHandoverIndex()].UserList.push(g_userList);
                        
                        if (returnValue)
                        {
                            if (!angular.equals(pageData.VA[$scope.presetTypeData.SelectedPreset], $scope.VA[$scope.presetTypeData.SelectedPreset]))
                            {
                                if ($scope.presetTypeData.SelectedPreset > 0){
                                    setPresetVideoAnalysis($scope.presetTypeData.SelectedPreset, promises);
                                } else {
                                    setVideoAnalysis(promises);
                                }
                                $q.seqAll(promises).then(function () {
                                    var promises2 = [];
                                    promises2.push(function(){return addUserToHandover(areaIndex + 1, $scope.presetTypeData.SelectedPreset);});
                                    $q.seqAll(promises2).then(function () {
                                        var promises3 = [];
                                        if ($scope.presetTypeData.SelectedPreset > 0){
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
                                promises.push(function(){return addUserToHandover(areaIndex + 1, $scope.presetTypeData.SelectedPreset);});
                                $q.seqAll(promises).then(function () {
                                    var promises3 = [];
                                    if ($scope.presetTypeData.SelectedPreset > 0){
                                        promises3.push(getPresetHandoverList);
                                    } else {
                                        promises3.push(getHandoverList);
                                    }
                                    $q.seqAll(promises3).then(function () {
                                        getMotionDetectionData(function(response){
                                            updateROIData(response.data.VideoAnalysis[0].ROIs);
                                            viewHandoverAreaOptions($scope.presetTypeData.SelectedPreset);
                                        });
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


                    
                }, function ()
                {
                    modalInstance = null;
                    //$log.info('Modal dismissed at: ' + new Date());
                });
            } else
            {
                $uibModal.open({
                    templateUrl: 'views/setup/common/errorMessage.html',
                    controller: 'errorMessageCtrl',
                    size: 'sm',
                    resolve: {
                        Message: function ()
                        {
                            return 'lang_msg_cannot_add';
                        },
                        Header: function ()
                        {
                            return 'lang_error';
                        }
                    }
                });
            }
        }
    }

    function getHandoverListIndex(){
        var handoverListIndex = null;
        for(var i = 0, ii = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList.length; i < ii; i++){
            var self = $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i];
            try{
                if("ROIIndex" in self){
                    if($scope.isSelectedIncludeIndex === self.ROIIndex){
                        handoverListIndex = i;
                    }
                }   
            }catch(e){
                console.error(e);
            }
        }

        return handoverListIndex;
    }

    $scope.SelectAll = function ()
    {
        if (typeof $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList !== 'undefined')
        {
            var checkboxValue = false;

            if ($("#CheckAllId").is(":checked"))
            {
                checkboxValue = true;
            }

            //var areaIndex = parseInt($('#SelectedHandoverAreaId').val().split(':')[1]);
            var handoverListIndex = getHandoverListIndex();

            for (var i = 0; i < $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[handoverListIndex].UserList.length; i++)
            {
                $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[handoverListIndex].UserList[i].SelectedHandoverIndex = checkboxValue;
            }
        }
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////
    $scope.isOccupied = function(){
        var returnValue = 0;
        if($scope.activeTab.title === 'Include'){
            for(var i = 0; i < $scope.selectInclude.length; i++){
                if($scope.selectInclude[i].Coordinates !== undefined){
                    returnValue++;
                }
            }         
        }
        if ($scope.activeTab.title === 'Exclude') {
            for(var i = 0; i < $scope.selectExclude.length; i++){
                if($scope.selectExclude[i].Coordinates === undefined){
                    returnValue++;   
                }   
            }
        } 
        return returnValue;
    };

    $scope.findHandoverIndex = function (){
        for(var i = 0; i < $scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList.length; i++){
            if($scope.Handover[$scope.presetTypeData.SelectedPreset].HandoverList[i].ROIIndex === $scope.isSelectedIncludeIndex){
                return i;
            }
        }
        return -1;
    };

    $scope.changeHandoverEnDisable = function(){
        if($scope.handoverEnDisable === 'Enable'){
            $scope.handoverEnDisable = 'Disable';
        } else {
            $scope.handoverEnDisable = 'Enable';
        }
    };

});