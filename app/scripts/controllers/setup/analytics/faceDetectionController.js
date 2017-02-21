/*global setTimeout */
kindFramework.controller('faceDetectionCtrl', function($scope, $uibModal, $translate, $timeout, SunapiClient, Attributes, COMMONUtils, sketchbookService, $q, $rootScope, WISE_FACE_DETECTION) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};

    $scope.channelSelectionSection = (function(){
        var currentChannel = 0;

        return {
            getCurrentChannel: function(){
                return currentChannel;
            },
            setCurrentChannel: function(index){
                currentChannel = index;
            }
        }
    })();

    var DetectionModes = ['Inside', 'Outside'];
    $scope.tabs = [{
        title: 'Include',
        lang: 'lang_include_area',
        active: true
    }, {
        title: 'Exclude',
        lang: 'lang_excluded_area',
        active: false
    }];
    $scope.activeTab = $scope.tabs[0];
    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.IncreaseSensitivityLevel = function (){
        // if(pageData.FD.Enable === false) return;
        
        if ($scope.FD.Sensitivity < mAttr.FaceDetectSensitivityTypes.maxValue){
            $scope.FD.Sensitivity++;
            refreshSlider();
        }
    };

    $scope.DecreaseSensitivityLevel = function (){
        // if(pageData.FD.Enable === false) return;

        if ($scope.FD.Sensitivity > mAttr.FaceDetectSensitivityTypes.minValue){
            $scope.FD.Sensitivity--;
            refreshSlider();
        }
    };

    $scope.wiseFaceDetection = true; //Temporary
    function isWiseFD(){
        return ($scope.wiseFaceDetection === true && $scope.activeTab.title === $scope.tabs[0].title);
    }

    $scope.$watch('SensitivitySliderModel.data', function (newVal, oldVal) {
        if(newVal !== undefined && $scope.FD !== undefined){
            $scope.FD.Sensitivity = $scope.SensitivitySliderModel.data;
        }
    });

    var startIndex = 2; //Temporary
    var endIndex = 9; //Temporary
    var eventSourceOption = {};//Temporary

    function getAttributes() {
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
        if (mAttr.DetectionAreaModes !== undefined) {
            $scope.DetectionAreaModes = mAttr.DetectionAreaModes;
        }
        if (mAttr.FaceDetectSensitivityTypes !== undefined && $scope.SensitivitySliderProperty === undefined) {
            $scope.SensitivitySliderProperty = {
                floor: mAttr.FaceDetectSensitivityTypes.minValue,
                ceil: mAttr.FaceDetectSensitivityTypes.maxValue,
                showSelectionBar: true,
                vertical: false,
                showInputBox: true
            };

            refreshSlider();
        }
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        for (var i = 0; i < mAttr.EventSourceOptions.length; i++) { //Temporary
            if (mAttr.EventSourceOptions[i].EventSource === 'MotionDetection') {
                eventSourceOption = mAttr.EventSourceOptions[i];
            }
        }

        // $scope.maxFaceDetectionArea = mAttr.MaxFaceDetectionArea;
        $scope.maxFaceDetectionArea = 8;

        $scope.EventActions = COMMONUtils.getSupportedEventActions("FaceDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    }

    function prepareEventRules(eventRules) {
        var currentChannel = $scope.channelSelectionSection.getCurrentChannel();
        $scope.EventRule = {};
        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;
        $scope.EventRule.Enable = eventRules[currentChannel].Enable;
        $scope.EventRule.RuleIndex = eventRules[currentChannel].RuleIndex;
        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[currentChannel].Schedule));
        $scope.EventRule.ScheduleType = eventRules[currentChannel].ScheduleType;
        if (typeof eventRules[currentChannel].EventAction !== 'undefined') {
            if (eventRules[currentChannel].EventAction.indexOf('FTP') !== -1) {
                $scope.EventRule.FtpEnable = true;
            }
            if (eventRules[currentChannel].EventAction.indexOf('SMTP') !== -1) {
                $scope.EventRule.SmtpEnable = true;
            }
            if (eventRules[currentChannel].EventAction.indexOf('Record') !== -1) {
                $scope.EventRule.RecordEnable = true;
            }
        }
        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[currentChannel].AlarmOutputs === 'undefined') {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                $scope.EventRule.AlarmOutputs[ao] = {};
                var duration = 'Off';
                for (var j = 0; j < eventRules[currentChannel].AlarmOutputs.length; j++) {
                    if (ao + 1 === eventRules[currentChannel].AlarmOutputs[j].AlarmOutput) {
                        duration = eventRules[currentChannel].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }
        if (typeof eventRules[currentChannel].PresetNumber === 'undefined') {
            $scope.EventRule.PresetNumber = 'Off';
        } else {
            $scope.EventRule.PresetNumber = eventRules[currentChannel].PresetNumber + '';
        }
        pageData.EventRule = angular.copy($scope.EventRule);
    }

    //Include, Exclude 에 출력 되는 테이블 데이터
    $scope.detectionAreas = [];
    var selectedDetectionArea = null;

    /**
     * 테이블에 뿌려줄 데이터 변경
     */
    $scope.setDetectionAreas = function(onlyDetectionArea){
        if(!('FD' in $scope)){
            console.info("FD is undefined in $scope");
        }

        if(!('DetectionAreas' in $scope.FD)){
            console.info("DetectionAreas is undefined in $scope.FD");
        }

        var detectionAreas = [];
        // var startIndex = $scope.activeTab.title === $scope.tabs[0].title ? 0 : $scope.maxFaceDetectionArea;
        // var endIndex = startIndex + $scope.maxFaceDetectionArea;

        if(
            !isWiseFD() &&
            ('DetectionAreas' in $scope.FD) &&
            pageData.FD.Enable === true
            ){
            for(var i = 0, ii = $scope.FD.DetectionAreas.length; i < ii; i++){
                var self = $scope.FD.DetectionAreas[i];
                var index = 0;
                if(self.DetectionArea >= startIndex && self.DetectionArea <= endIndex){
                    self.isEnable = true;
                    // index = self.DetectionArea - startIndex - 1;
                    index = self.DetectionArea - startIndex; //Temporary
                    detectionAreas[index] = self;   
                }
            }
        }

        for(var i = 0, ii = $scope.maxFaceDetectionArea; i < ii; i++){
            if(!detectionAreas[i]){
                detectionAreas[i] = {};
            }
        }

        $scope.detectionAreas = detectionAreas;

        /**
         * setDetectionAreas를 통해서 테이블에 출력할 데이터를
         * 변경 하였으므로, SketchManager를 통해 Geometry를 뿌려줘야 한다.
         */
        if(onlyDetectionArea !== true){
            $scope.changeGeometry();   
        }
    };

    $scope.sketchinfo = {};
    $scope.coordinates = [];

    function getDefaultWiseFDData(){
        var points = [];
        var definedVideoInfo = getDefinedVideoInfo();
        /**
         * 카메라에서 최대 해상도를 저장하지 못하여 보통 -1를 해서 보내지만
         * Face Detection은 짝수만 가능하기 때문에 -2를 해서 보냄
         */
        var maxWidth = definedVideoInfo[2] - 2;
        var maxHeight = definedVideoInfo[3] - 2;

        //Flip
        if($scope.videoinfo.flip === true && $scope.videoinfo.mirror === false){
            points = [
                [0, maxHeight],
                [0, 0],
                [maxWidth, 0],
                [maxWidth, maxHeight]
            ];

            // console.log("Flip", points);
        //Mirror
        }else if($scope.videoinfo.flip === false && $scope.videoinfo.mirror === true){
            points = [
                [maxWidth,0],
                [maxWidth, maxHeight],
                [0, maxHeight],
                [0, 0]
            ];
            // console.log("Mirror", points);
        //Flip/Mirror
        }else if($scope.videoinfo.flip === true && $scope.videoinfo.mirror === true){
            points = [
                [maxWidth, maxHeight],
                [maxWidth,0],
                [0, 0],
                [0, maxHeight]
            ];
            // console.log("Flip/Mirror", points);
        }else{
            points = [
                [0,0],
                [0, maxHeight],
                [maxWidth, maxHeight],
                [maxWidth, 0]
            ];
            // console.log("Normal", points);
        }

        return points;
    }

    $scope.activeGeometry = function(){
        var selectedIndex = 0;
        if(selectedDetectionArea !== null){
            selectedIndex = selectedDetectionArea;
        }else{
            for(var i = 0, ii = $scope.coordinates.length; i < ii; i++){
                if($scope.coordinates[i].isSet === true){
                    selectedIndex = i;
                    break; 
                }
            }   
        }

        $scope.selectColumn(selectedIndex);
    };

    $scope.changeGeometry = function(){
        function resetCoordinates(areaType, len){
            $scope.coordinates = [];

            for(var i = 0; i < len; i++){
                $scope.coordinates.push({
                    isSet: false,
                    points: [],
                    enable: false,
                    enExAppear: areaType
                });
            }
        }

        function updateCoordinates(){
            if('DetectionAreas' in $scope.FD){
                for(var i = 0, ii = $scope.FD.DetectionAreas.length; i < ii; i++){
                    var self = $scope.FD.DetectionAreas[i];
                    var points = [];
                    var index = null;

                    if(
                        !(
                            self.DetectionArea >= startIndex &&
                            self.DetectionArea <= endIndex
                        )
                        ){ //Coordinate는 현재 선택된 탭의 DetectionArea만 설정되어야 한다.
                        continue;
                    }

                    for(var j = 0, jj = self.Coordinates.length; j < jj; j++){
                        var jSelf = self.Coordinates[j];
                        
                        points.push([jSelf.x, jSelf.y]);
                    }

                    if(points.length > 0){
                        index = self.DetectionArea - startIndex;

                        $scope.coordinates[index].points = points;
                        $scope.coordinates[index].enable = true;
                        $scope.coordinates[index].isSet = true;
                    }
                }   
            }
        }

        var color = $scope.activeTab.title === $scope.tabs[0].title ? 0 : 1;
        // var startIndex = color * $scope.maxFaceDetectionArea + 1;
        // var endIndex = startIndex + $scope.maxFaceDetectionArea - 1;

        if(isWiseFD() && pageData.FD.Enable === true){
            // console.log("isWiseFD");
            var WISE_FD_INDEX = 1;

            resetCoordinates(color, 1);
            var fdIndex = findFDIndex(WISE_FD_INDEX);
            var points = [];
            var useEvent = pageData.FD.Enable;

            // console.log("fdIndex", fdIndex);

            if(fdIndex !== null){
                for(var i = 0, ii = $scope.FD.DetectionAreas[fdIndex].Coordinates.length; i < ii; i++){
                    var self = $scope.FD.DetectionAreas[fdIndex].Coordinates[i];
                    points[i] = [self.x, self.y];
                }   
            }

            if(points.length > 0){
                $scope.coordinates[0].points = points;
                $scope.coordinates[0].isSet = true;
                $scope.coordinates[0].enable = true;
            }

            $scope.sketchinfo = getSketchinfo(color, 1, true, useEvent);

            // console.log($scope.sketchinfo);
        }else if(pageData.FD.Enable === true){
            resetCoordinates(color, $scope.maxFaceDetectionArea);
            /**
             * SketchManager에 사용할 수 있는 포맷으로 Coordinate를 변경하여
             * points라는 프로퍼티를 만든다.
             */
            updateCoordinates();

            $scope.sketchinfo = getSketchinfo(color, $scope.maxFaceDetectionArea);

            setTimeout($scope.activeGeometry);
        }else{
            resetCoordinates(0, 1);
            $scope.sketchinfo = {};
        }
    };

    function findFDIndex(roiIndex){
        var index = null;

        if('DetectionAreas' in $scope.FD){
            for(var i = 0, ii = $scope.FD.DetectionAreas.length; i < ii; i++){
                if($scope.FD.DetectionAreas[i].DetectionArea === roiIndex){
                    index = i;
                    break;
                }
            }        
        }

        return index;
    }

    function getFaceDetection() {
        var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
        };
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=view', getData, function(response) {
            var currentChannel = $scope.channelSelectionSection.getCurrentChannel();
            $scope.FD = response.data.FaceDetection[currentChannel];

            pageData.FD = angular.copy($scope.FD);
            $scope.SensitivitySliderModel = {
                data : $scope.FD.Sensitivity
            };

            /*if(pageData.FD.Enable === false){
                $scope.SensitivitySliderOptions.disabled = !pageData.FD.Enable;
            }*/

            $scope.setDetectionAreas();
        },
        function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getEventRules() {
        var getData = {};
        getData.EventSource = 'FaceDetection';
        /*getData.Channel = $scope.channelSelectionSection.getCurrentChannel();*/
        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
            prepareEventRules(response.data.EventRules);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setFaceDetection(queue) {
        var setData = {};
        var initSetData = {};
        var removeData = {
            DetectionAreaIndex: null
        };
        var removeIndex = [];
        var currentChannel = $scope.channelSelectionSection.getCurrentChannel();

        setData.Channel = currentChannel;
        if (pageData.FD.Enable !== $scope.FD.Enable) {
            setData.Enable = $scope.FD.Enable;
        }
        if (
            pageData.FD.Sensitivity !== $scope.FD.Sensitivity &&
            pageData.FD.Enable === true && $scope.FD.Enable === true
            ) {
            setData.Sensitivity = $scope.FD.Sensitivity;
        }
        if (pageData.FD.MarkDetectedFaces !== $scope.FD.MarkDetectedFaces) {
            setData.MarkDetectedFaces = $scope.FD.MarkDetectedFaces;
        }
        if (pageData.FD.DetectionAreaMode !== $scope.FD.DetectionAreaMode) {
            setData.DetectionAreaMode = $scope.FD.DetectionAreaMode;
        }
        var changeCount = 0;
        if (typeof $scope.FD.DetectionAreas !== "undefined") {
            for (var i = 0; i < $scope.FD.DetectionAreas.length; i++) {
                var self = $scope.FD.DetectionAreas[i];
                var selfCoor = [];

                for(var j = 0, jj = self.Coordinates.length; j < jj; j++){
                    var coor = self.Coordinates[j];
                    selfCoor.push([ coor.x, coor.y ]);
                }

                setData["DetectionArea." + self.DetectionArea + ".Coordinate"] = selfCoor.join(',');
                changeCount++;
            }
        } else {
            if (!angular.equals(pageData.FD.DetectionAreas, $scope.FD.DetectionAreas)) {
                for (var i = 0; i < $scope.FD.DetectionAreas.length; i++) {
                    var self = $scope.FD.DetectionAreas[i];
                    var selfCoor = [];

                    for(var j = 0, jj = self.Coordinates.length; j < jj; j++){
                        var coor = self.Coordinates[j];
                        selfCoor.push([ coor.x, coor.y ]);
                    }

                    setData["DetectionArea." + self.DetectionArea + ".Coordinate"] = selfCoor.join(',');
                    changeCount++;
                }
            }
        }

        // console.log(removeIndex);

        try{
            for(var i = 0, ii = pageData.FD.DetectionAreas.length; i < ii; i++){
                var isOk = false;
                var index = pageData.FD.DetectionAreas[i].DetectionArea;

                for(var j = 0, jj = $scope.FD.DetectionAreas.length; j < jj; j++){
                    if(index === $scope.FD.DetectionAreas[j].DetectionArea){
                        isOk = true;
                    }
                }

                if(isOk === false){
                    removeIndex.push(index);
                }
            }

            if("DetectionAreas" in pageData.FD && "DetectionAreas" in $scope.FD){
                if($scope.FD.DetectionAreas.length === 0){
                    changeCount++;
                    removeData.DetectionAreaIndex = "All";
                }
            }
        }catch(e){
            
        }

        if(removeIndex.length > 0){
            removeData.DetectionAreaIndex = removeIndex.join(',');
        }

        if(removeData.DetectionAreaIndex !== null){
            removeData.Channel = currentChannel;
            queue.push({
                url: '/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=remove', 
                reqData: removeData
            });
        }

        queue.push({
            url: '/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=set', 
            reqData: setData
        });

        //초기 데이터 없을 때
        var defaultWiseFDPoints = [];
        if(!("DetectionAreas" in pageData.FD)){
            if(findFDIndex(1) === null){
                defaultWiseFDPoints = getDefaultWiseFDData();   
            }else{
                defaultWiseFDPoints = $scope.FD.DetectionAreas[findFDIndex(1)].Coordinates;
            }

            defaultWiseFDPoints = fixRatioForCoordinates(defaultWiseFDPoints);   
            defaultWiseFDPoints = changeOnlyEvenNumberOfWiseFD(defaultWiseFDPoints);

            initSetData['DetectionArea.1.Coordinate'] = defaultWiseFDPoints.join(',');
            initSetData.Channel = currentChannel;

            queue.push({
                url: '/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=set', 
                reqData: initSetData
            });
        }
    }


    function refreshSlider(){
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');
        });
    }  

    function setEventRules() {
        var setData = {};
        setData.Channel = $scope.channelSelectionSection.getCurrentChannel();
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
        
        getAttributes();

        var promises = [
            showVideo,
            getFaceDetection,
            getEventRules,
        ];

        $q.seqAll(promises).then(function(){
            $scope.pageLoaded = true;
        }, function(errorData){
            console.log(errorData);
        });
    }

    function showVideo() {
        var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
        };
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
            var currentChannel = $scope.channelSelectionSection.getCurrentChannel();
            var viewerWidth = 640;
            var viewerHeight = 360;
            var maxWidth = mAttr.MaxROICoordinateX;
            var maxHeight = mAttr.MaxROICoordinateY;
            var rotate = response.data.Flip[currentChannel].Rotate;
            var flip = response.data.Flip[currentChannel].VerticalFlipEnable;
            var mirror = response.data.Flip[currentChannel].HorizontalFlipEnable;
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
                currentPage: 'FaceDetection'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function set(isEnable) {
        sketchbookService.removeDrawingGeometry();

        var queue = [];
        if (validatePage()) {
            // setAreaScope();
            if (
                !angular.equals(pageData.FD, $scope.FD) || 
                !angular.equals(pageData.EventRule, $scope.EventRule) ||
                !("DetectionAreas" in pageData.FD) || //초기
                findFDIndex(1) === null //Include 가 없을 때
                ) {
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
                    if (
                        !angular.equals(pageData.FD, $scope.FD) ||
                        !("DetectionAreas" in pageData.FD) || //초기
                        findFDIndex(1) === null //Include 가 없을 때
                        ) {
                        setFaceDetection(queue);
                    }
                    if (!angular.equals(pageData.EventRule, $scope.EventRule)) {
                        queue.push(setEventRules());
                    }

                    if(queue.length > 0){
                        SunapiClient.sequence(queue, function(){
                            $timeout(view);
                        }, function(errorData){
                            console.error(errorData);
                        });
                    }
                }, function(){
                    if(isEnable === true){
                        $scope.FD.Enable = pageData.FD.Enable;
                    }
                });
            }
        }
    }

    function inArray(arr, str) {
        for(var i = 0; i < arr.length; i++) {
            var tArray = arr[i].split(".");
            tArray = tArray[0] + "." + tArray[1];
            if(tArray === str){
                return i;
            }
        }
        return -1;
    }

    $scope.setColor = function(day, hour, isAlways) {
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
                if (isAlways) {
                    return 'setMiniteFaded';
                } else {
                    return 'setMinite already-selected ui-selected';
                }
            }
        }
        if ($scope.EventRule.ScheduleIds.indexOf(day + '.' + hour) !== -1) {
            if (isAlways) {
                return 'setHourFaded';
            } else {
                return 'setHour already-selected ui-selected';
            }
        }
    };
    $scope.mouseOver = function(day, hour) {

        var index = inArray($scope.EventRule.ScheduleIds, day + '.' + hour);
        if(index !== -1){
            $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[index].split('.');
        }
        
        // $scope.MouseOverMessage = [];
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0) {
        //         $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
        //         break;
        //     }
        // }
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
        $timeout(function() {
            $scope.EventRule.ScheduleIds = [];
        });
    };
    $scope.open = function(day, hour) {
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
        
        // for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++) {
        //     if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0) {
        //         var str = $scope.EventRule.ScheduleIds[i].split('.');
        //         if (str.length === 4) {
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

    $scope.detectionAreaModeChange = function(value) {
        if (value === "Inside") {
            sketchbookService.changeFlag(0);
        } else {
            sketchbookService.changeFlag(1);
        }
    };

    $scope.changeType = function(type) {
        sketchbookService.removeDrawingGeometry();
        try{
            $scope.resetSelectColumn();
        }catch(e){
            console.error(e);
        }
        $scope.activeTab = type;
        $scope.setDetectionAreas();
    };

    function getDefinedVideoInfo(){
        var _2M = WISE_FACE_DETECTION._2M;
        var _5M = WISE_FACE_DETECTION._5M;

        var minWidth = 0;
        var minHeight = 0;
        var maxWidth = 0;
        var maxHeight = 0;
        var ratio = [];
        var CONFIG = {};
        var isHallway = $scope.videoinfo.rotate === "90" || $scope.videoinfo.rotate === "270";

        switch(mAttr.MaxResolution){
            case _2M.BASIC.MAX.WIDTH + 'x' + _2M.BASIC.MAX.HEIGHT :
                if(isHallway === true){
                    CONFIG = _2M.HALLWAY;
                }else{
                    CONFIG = _2M.BASIC;   
                }
            break;
            case _5M.BASIC.MAX.WIDTH + 'x' + _5M.BASIC.MAX.HEIGHT :
                if(isHallway === true){
                    CONFIG = _5M.HALLWAY;
                }else{
                    CONFIG = _5M.BASIC;
                }
            break;
        }

        minWidth = CONFIG.MIN.WIDTH;
        minHeight = CONFIG.MIN.HEIGHT;
        maxWidth = CONFIG.MAX.WIDTH;
        maxHeight = CONFIG.MAX.HEIGHT;
        ratio = CONFIG.RATIO;

        return [minWidth, minHeight, maxWidth, maxHeight, ratio];
    }

    function getSketchinfo(color, maxNumber, aspectRatio, useEvent){
        var sketchinfo = {
            workType: "fdArea",
            color: color, //0: blue, 1: red
            shape: 1,
            // shape: ($scope.ROIType == "Polygon" ? 1 : 0),
            aspectRatio: !!aspectRatio,
            maxNumber: maxNumber,
            maxPointNumber: aspectRatio ? 4 : 8,
            modalId: "./views/setup/common/confirmMessage.html"
        };

        var definedVideoInfo = getDefinedVideoInfo();

        if(color === 0){
            sketchinfo.wiseFaceDetection = true;
            sketchinfo.wiseFDCircleHeightRatio = WISE_FACE_DETECTION.HEIGHT_RATIO;
        }

        if(definedVideoInfo[3] === 0){
            console.error("MaxResolution를 사용하여 Include Area 크기 제한 이슈.");
        }else{
            sketchinfo.minSize = {
                width: definedVideoInfo[0],
                height: definedVideoInfo[1]
            };

            sketchinfo.maxSize = {
                width: definedVideoInfo[2],
                height: definedVideoInfo[3]
            };   
        }

        if(!!aspectRatio){
            sketchinfo.ratio = definedVideoInfo[4];
            sketchinfo.mirror = $scope.videoinfo.mirror;
            sketchinfo.flip = $scope.videoinfo.flip;
        }

        if(useEvent !== undefined){
            sketchinfo.useEvent = useEvent;
        }

        return sketchinfo;
    }

    /*function setAreaScope() {
        var maxArea = parseInt(mAttr.MaxFaceDetectionArea, 10);
        var data = sketchbookService.get();
        if (typeof data != "undefined") {
            $scope.FD.DetectionAreas = new Array(maxArea);
            var index = 0;
            for (var i = 0; i < maxArea; i++) {
                if (data[i].isSet) {
                    if ($scope.FD.DetectionAreas[index] == undefined) {
                        $scope.FD.DetectionAreas[index] = {
                            Coordinates: new Array(4)
                        };
                    }
                    $scope.FD.DetectionAreas[index].DetectionArea = i + 1;
                    $scope.FD.DetectionAreas[index].Coordinates[0] = {
                        x: data[i].x1,
                        y: data[i].y1
                    };
                    $scope.FD.DetectionAreas[index].Coordinates[1] = {
                        x: data[i].x2,
                        y: data[i].y2
                    };
                    $scope.FD.DetectionAreas[index].Coordinates[2] = {
                        x: data[i].x3,
                        y: data[i].y3
                    };
                    $scope.FD.DetectionAreas[index].Coordinates[3] = {
                        x: data[i].x4,
                        y: data[i].y4
                    };
                    index++;
                } else {
                    $scope.FD.DetectionAreas.splice(i, maxArea - i);
                }
            }
        }
    }*/

    function createDetectionAreaItem(roiIndex, modeType, points){
        var mode = modeType === 0 ? "Inside" : "Outside";
        var coor = [];

        for(var i = 0, ii = points.length; i < ii; i++){
            var self = points[i];
            coor.push({
                x: self[0],
                y: self[1]
            });
        }

        return {
            DetectionArea: roiIndex,
            Type: mode,
            Coordinates: coor
        };
    }

    function activeShape(index){
        sketchbookService.activeShape(index);
    }

    function setEnable(index, val){
        sketchbookService.setEnableForSVG(index, val);
    }

    $scope.toggleEnable = function(index){
        $scope.detectionAreas[index].isEnable = !$scope.detectionAreas[index].isEnable;
        setEnable(index, $scope.detectionAreas[index].isEnable);
    };

    $scope.resetSelectColumn = function(){
        for(var i = 0, ii = $scope.detectionAreas.length; i < ii; i++){
            $scope.detectionAreas[i].isSelected = false;
        }
    };

    $scope.selectColumn = function(index){
        if(
            $scope.detectionAreas[index].isEnable === undefined ||
            (isWiseFD())
            ){
            return;
        }

        $timeout(function(){
            for(var i = 0, ii = $scope.detectionAreas.length; i < ii; i++){
                var isSelected = i === index ? true : false;
                $scope.detectionAreas[i].isSelected = isSelected;

                if(isSelected){
                    selectedDetectionArea = i;
                }
            }

            activeShape(index);
        });
    };

    function isEvenNumber(n){
        if(n > 0){
            return n%2 === 0;
        }else{
            return true;
        }
    }

    function changeOnlyEvenNumberOfWiseFD(points){
        var x1 = points[0][0];
        var y1 = points[0][1];
        var x3 = points[2][0];
        var y3 = points[2][1];

        if(!isEvenNumber(x1)){
            x1 += 1;
            points[0][0] = x1;
            points[1][0] = x1;
        }

        if(!isEvenNumber(y1)){
            y1 += 1;
            points[0][1] = y1;
            points[3][1] = y1;
        }

        if(!isEvenNumber(x3)){
            x3 -= 1;
            points[2][0] = x3;
            points[3][0] = x3;
        }

        if(!isEvenNumber(y3)){
            y3 -= 1;
            points[1][1] = y3;
            points[2][1] = y3;
        }

        return points;
    }

    function fixRatioForCoordinates(points){
        function getWidth(){
            return Math.abs(points[2][0] - points[0][0]);
        }

        function getHeight(){
            return Math.abs(points[2][1] - points[0][1]);
        }

        var areaWidth = getWidth();
        var areaHeight = getHeight();
        var definedVideoInfo = getDefinedVideoInfo();
        var ratio = definedVideoInfo[4];
        var currentRatio = parseFloat((ratio[1] * areaWidth / areaHeight).toFixed(3).substr(0,4));

        // console.log("ratio:", ratio[0], ratio[1]);
        // console.log("Current Ratio:", currentRatio);

        if(ratio[0] < currentRatio){
            points[2][0] -= 2;
            points[3][0] -= 2;
        }

        /* 비율 고정을 위한 변경 후 최소 사이즈 보다 작을 시 최소 사이즈로 변경*/
        if(
            getWidth() < definedVideoInfo[0] || 
            getHeight() < definedVideoInfo[1] ){
            if($scope.videoinfo.flip === true){
                points[2][0] = points[1][0] - definedVideoInfo[0];
                points[3][0] = points[1][0] - definedVideoInfo[0];
            }else{
                points[2][0] = points[0][0] + definedVideoInfo[0];
                points[3][0] = points[0][0] + definedVideoInfo[0];   
            }

            if($scope.videoinfo.mirror === true){
                points[0][1] = points[3][1] - definedVideoInfo[1];
                points[1][1] = points[3][1] - definedVideoInfo[1];
            }else{
                points[1][1] = points[0][1] + definedVideoInfo[1];
                points[2][1] = points[0][1] + definedVideoInfo[1];   
            }
        }

        // console.log("Fixed Ratio: ", (ratio[1] * (points[2][0] - points[0][0]) / areaHeight).toFixed(2));

        return points;
    }

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args){
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var roiIndex = modifiedIndex + 1;
        var modeType = 0;
        var definedVideoInfo = null;

        if(isWiseFD()){
            var fdIndex = findFDIndex(roiIndex);

            if(modifiedType !== "delete"){
                modifiedPoints = fixRatioForCoordinates(modifiedPoints);   
                modifiedPoints = changeOnlyEvenNumberOfWiseFD(modifiedPoints);
            }
            
            if(modifiedType === "create" || fdIndex === null){
                roiIndex = 1;
                var newArea = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
                if(!('DetectionAreas' in $scope.FD)){
                    $scope.FD.DetectionAreas = [];
                }

                $scope.FD.DetectionAreas.push(newArea);
            }else{

                if(fdIndex !== null){
                    if(modifiedType === "delete"){
                        $scope.FD.DetectionAreas.splice(fdIndex, 1);
                    }else if(modifiedType === "mouseup"){
                        $scope.FD.DetectionAreas[fdIndex] = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
                    }
                }else{
                    console.trace("something is wrong, fdIndex is null.", roiIndex, modifiedType);
                }
            }
        }else{
            if($scope.activeTab.title === $scope.tabs[1].title){
                // roiIndex += $scope.maxFaceDetectionArea;
                roiIndex += 1; //Temporary
                modeType = 1;
            }

            if(modifiedType === "create"){
                // console.log(roiIndex);
                var newArea = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
                if(!('DetectionAreas' in $scope.FD)){
                    $scope.FD.DetectionAreas = [];
                }
                $scope.FD.DetectionAreas.push(newArea);
                setTimeout(function(){
                    $scope.selectColumn(modifiedIndex);
                });
            }else{
                var fdIndex = findFDIndex(roiIndex);

                if(fdIndex !== null){
                    if(modifiedType === "delete"){
                        $scope.FD.DetectionAreas.splice(fdIndex, 1);
                    }else if(modifiedType === "mouseup"){
                        $scope.FD.DetectionAreas[fdIndex] = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
                        $scope.selectColumn(modifiedIndex);
                    }   
                }else{
                    console.trace("something is wrong, fdIndex is null.", roiIndex, modifiedType);
                }
            }
            
            if(modifiedType === "create" || modifiedType === "delete"){
                $scope.setDetectionAreas(true);   
            }
        }

        // console.log($scope.FD);
    }, $scope);

    $scope.detectionAreaDisplayAll = false;
    $scope.changeDisplayAll = function(val){
        $scope.detectionAreaDisplayAll = val;

        if(val === true){
            for(var i = 0, ii = $scope.detectionAreas.length; i < ii; i++){
                var self = $scope.detectionAreas[i];
                if(self.isEnable !== undefined){
                    self.isEnable = true;
                    $scope.toggleEnable(i);
                }
            }
        }
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
            view();
        }
    })();
});