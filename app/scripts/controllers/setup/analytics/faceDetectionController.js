/*global setTimeout */
kindFramework.controller(
    'faceDetectionCtrl',
    function(
        $scope,
        $uibModal,
        $translate,
        $timeout,
        SunapiClient,
        Attributes,
        COMMONUtils,
        sketchbookService,
        $q,
        $rootScope,
        WISE_FACE_DETECTION,
        eventRuleService,
        UniversialManagerService
        ){
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    var DEFAULT_TAB_INDEX = 0;

    $scope.tabs = [{
        title: 'Include',
        lang: 'lang_include_area',
        active: true,
    }, {
        title: 'Exclude',
        lang: 'lang_excluded_area',
        active: false,
    }];
    $scope.activeTab = $scope.tabs[DEFAULT_TAB_INDEX];
    $scope.EventSource = 'FaceDetection';
    $scope.EventRule = {};

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

    $scope.$watch('SensitivitySliderModel.data', function (newVal) {
        if(typeof newVal !== "undefined" && typeof $scope.FD !== "undefined"){
            $scope.FD.Sensitivity = $scope.SensitivitySliderModel.data;
        }
    });

    var startIndex = 2; //Temporary
    var endIndex = 9; //Temporary

    function getAttributes() {
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        $scope.MaxChannel = mAttr.MaxChannel;
        if (typeof mAttr.EnableOptions !== "undefined") {
            $scope.EnableOptions = mAttr.EnableOptions;
        }
        if (typeof mAttr.ActivateOptions !== "undefined") {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }
        if (typeof mAttr.WeekDays !== "undefined") {
            $scope.WeekDays = mAttr.WeekDays;
        }
        if (typeof mAttr.DetectionAreaModes !== "undefined") {
            $scope.DetectionAreaModes = mAttr.DetectionAreaModes;
        }
        if (typeof mAttr.FaceDetectSensitivityTypes !== "undefined" && typeof $scope.SensitivitySliderProperty === "undefined") {
            $scope.SensitivitySliderProperty = {
                floor: mAttr.FaceDetectSensitivityTypes.minValue,
                ceil: mAttr.FaceDetectSensitivityTypes.maxValue,
                showSelectionBar: true,
                vertical: false,
                showInputBox: true
            };

            refreshSlider();
        }
        if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        // $scope.maxFaceDetectionArea = mAttr.MaxFaceDetectionArea;
        $scope.maxFaceDetectionArea = 8;

        $scope.EventActions = COMMONUtils.getSupportedEventActions("FaceDetection");
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);

        $scope.PTZModel = mAttr.PTZModel;
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
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
        var idx = 0;
        var len = 0;

        if(
            !isWiseFD() &&
            ('DetectionAreas' in $scope.FD) &&
            pageData.FD.Enable === true
            ){
            for(idx = 0, len = $scope.FD.DetectionAreas.length; idx < len; idx++){
                var self = $scope.FD.DetectionAreas[idx];
                var index = 0;
                if(self.DetectionArea >= startIndex && self.DetectionArea <= endIndex){
                    self.isEnable = true;
                    // index = self.DetectionArea - startIndex - 1;
                    index = self.DetectionArea - startIndex; //Temporary
                    detectionAreas[index] = self;   
                }
            }
        }

        for(idx = 0, len = $scope.maxFaceDetectionArea; idx < len; idx++){
            if(!detectionAreas[idx]){
                detectionAreas[idx] = {};
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

    $scope.activeGeometry = function(){
        var selectedIndex = 0;
        if(selectedDetectionArea !== null){
            selectedIndex = selectedDetectionArea;
        } else {
            for(var idx = 0, len = $scope.coordinates.length; idx < len; idx++){
                if($scope.coordinates[idx].isSet === true){
                    selectedIndex = idx;
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
        } else if (pageData.FD.Enable === true){
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
            Channel: UniversialManagerService.getChannelId()
        };
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=view', getData, function(response) {
            $scope.FD = response.data.FaceDetection[0];

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

    function setFaceDetection(queue) {
        var setData = {};
        var removeData = {
            DetectionAreaIndex: null
        };
        var removeIndex = [];
        var currentChannel = UniversialManagerService.getChannelId();

        var idx = 0;
        var idx2 = 0;
        var coorLen = 0;

        var self = {};
        var selfCoor = [];
        var coor = {};

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
        if (typeof $scope.FD.DetectionAreas !== "undefined") {
            for (idx = 0; idx < $scope.FD.DetectionAreas.length; idx++) {
                self = $scope.FD.DetectionAreas[idx];
                selfCoor = [];

                for(idx2 = 0, coorLen = self.Coordinates.length; idx2 < coorLen; idx2++){
                    coor = self.Coordinates[idx2];
                    selfCoor.push([ coor.x, coor.y ]);
                }

                setData["DetectionArea." + self.DetectionArea + ".Coordinate"] = selfCoor.join(',');
            }
        } else {
            if (!angular.equals(pageData.FD.DetectionAreas, $scope.FD.DetectionAreas)) {
                for (idx = 0; idx < $scope.FD.DetectionAreas.length; idx++) {
                    self = $scope.FD.DetectionAreas[idx];
                    selfCoor = [];

                    for(idx2 = 0, coorLen = self.Coordinates.length; idx2 < coorLen; idx2++){
                        coor = self.Coordinates[idx2];
                        selfCoor.push([ coor.x, coor.y ]);
                    }

                    setData["DetectionArea." + self.DetectionArea + ".Coordinate"] = selfCoor.join(',');
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
                    removeData.DetectionAreaIndex = "All";
                }
            }
        }catch(e){
            console.error(e);
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
    }


    function refreshSlider(){
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');
        });
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
        
        getAttributes();

        var promises = [
            showVideo,
            getFaceDetection,
        ];

        $q.seqAll(promises).then(function(){
            $rootScope.$emit('changeLoadingBar', false);
            $scope.pageLoaded = true;
            $scope.$emit('pageLoaded', $scope.EventSource);
        }, function(errorData){
            $rootScope.$emit('changeLoadingBar', false);
            console.log(errorData);
        });
    }

    function showVideo() {
        var getData = {
            Channel: UniversialManagerService.getChannelId()
        };
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
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
                currentPage: 'FaceDetection',
                channelId: UniversialManagerService.getChannelId()
            };
            $scope.ptzinfo = {
                type: 'none'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function set(isEnable) {
        sketchbookService.removeDrawingGeometry();

        if (validatePage()) {
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
            modalInstance.result.then(setChangedData, function(){
                if(isEnable === true){
                    $scope.FD.Enable = pageData.FD.Enable;
                }
            });
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

    function isHallwayMode(){
        return $scope.videoinfo.rotate === "90" || $scope.videoinfo.rotate === "270";
    }

    function getMaxVideoSize(){
        var _2M = WISE_FACE_DETECTION._2M.BASIC.MAX;
        var _5M = WISE_FACE_DETECTION._5M.BASIC.MAX;
        var isHallway = isHallwayMode();
        var maxWidth = 0;
        var maxHeight = 0;

        switch(mAttr.MaxResolution){
            case _2M.WIDTH + 'x' + _2M.HEIGHT :
                if(isHallway === true){
                    maxWidth = _2M.HEIGHT;
                    maxHeight = _2M.WIDTH;
                }else{
                    maxWidth = _2M.WIDTH;
                    maxHeight = _2M.HEIGHT;
                }
            break;
            case _5M.WIDTH + 'x' + _5M.HEIGHT :
                if(isHallway === true){
                    maxWidth = _5M.HEIGHT;
                    maxHeight = _5M.WIDTH;
                }else{
                    maxWidth = _5M.WIDTH;
                    maxHeight = _5M.HEIGHT;
                }
            break;
        }

        return [maxWidth, maxHeight];
    }

    function getDefinedVideoInfo(){
        var _2M = WISE_FACE_DETECTION._2M;
        var _5M = WISE_FACE_DETECTION._5M;

        var minWidth = 0;
        var minHeight = 0;
        var maxWidth = 0;
        var maxHeight = 0;
        var ratio = [];
        var CONFIG = {};
        var isHallway = isHallwayMode();

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

        if(aspectRatio){
            sketchinfo.ratio = definedVideoInfo[4];
            sketchinfo.mirror = $scope.videoinfo.mirror;
            sketchinfo.flip = $scope.videoinfo.flip;
        }

        if(typeof useEvent !== "undefined"){
            sketchinfo.useEvent = useEvent;
        }

        return sketchinfo;
    }

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
        sketchbookService.moveTopLayer(index);
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
            typeof $scope.detectionAreas[index].isEnable === "undefined" ||
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

        if(ratio[0] < currentRatio){
            points[2][0] -= 2;
            points[3][0] -= 2;
        }

        /* 비율 고정을 위한 변경 후 최소 사이즈 보다 작을 시 최소 사이즈로 변경*/
        if(
            getWidth() < definedVideoInfo[0] || 
            getHeight() < definedVideoInfo[1] ){
            if($scope.videoinfo.flip === true){
                points[2][0] = Math.abs(points[0][0] - definedVideoInfo[0]);
                points[3][0] = Math.abs(points[0][0] - definedVideoInfo[0]);
            }else{
                points[2][0] = Math.abs(points[0][0] + definedVideoInfo[0]);
                points[3][0] = Math.abs(points[0][0] + definedVideoInfo[0]);   
            }   

            if($scope.videoinfo.mirror === true){
                points[1][1] = Math.abs(points[0][1] - definedVideoInfo[1]);
                points[2][1] = Math.abs(points[0][1] - definedVideoInfo[1]);
            }else{
                points[1][1] = Math.abs(points[0][1] + definedVideoInfo[1]);
                points[2][1] = Math.abs(points[0][1] + definedVideoInfo[1]);   
            }
        }

        return points;
    }

    /**
     * @date 2017-02-20
     * @author Yongku Cho
     * 최대 해상도로 카메라에 저장이 되지 않기 때문에
     * MD, IVA는 최대 해상도의 값은 최대 해상도 - 1이다.
     * FD의 경우 홀수는 허용이 되지 않으므로
     * FD의 최대 해상도값은 최대 해상도 - 2로 한다.
     */
    function fixMaxResolution(points){
        var maxVideoSize = getMaxVideoSize();
        var maxWidth = maxVideoSize[0];
        var maxHeight = maxVideoSize[1];

        for(var i = 0, len = points.length; i < len; i++){
            var self = points[i];
            if(self[0] >= maxWidth){
                points[i][0] = maxWidth - 2;
            }

            if(self[1] >= maxHeight){
                points[i][1] = maxHeight - 2;
            }
        }

        return points;
    }

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args){
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var roiIndex = modifiedIndex + 1;
        var modeType = 0;
        var fdIndex = 0;
        var newArea = null;

        if(isWiseFD()){
            fdIndex = findFDIndex(roiIndex);

            if(modifiedType !== "delete"){
                // console.log(modifiedPoints.join(','));
                modifiedPoints = fixRatioForCoordinates(modifiedPoints);   
                // console.log(modifiedPoints.join(','));
                modifiedPoints = changeOnlyEvenNumberOfWiseFD(modifiedPoints);
                // console.log(modifiedPoints.join(','));
                modifiedPoints = fixMaxResolution(modifiedPoints);
                // console.log(modifiedPoints.join(','));
            }
            
            if(modifiedType === "create" || fdIndex === null){
                roiIndex = 1;
                newArea = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
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
                newArea = createDetectionAreaItem(roiIndex, modeType, modifiedPoints);
                if(!('DetectionAreas' in $scope.FD)){
                    $scope.FD.DetectionAreas = [];
                }
                $scope.FD.DetectionAreas.push(newArea);
                setTimeout(function(){
                    $scope.selectColumn(modifiedIndex);
                });
            }else{
                fdIndex = findFDIndex(roiIndex);

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

    function changeChannel(index){
        $rootScope.$emit("channelSelector:changeChannel", index);
        $rootScope.$emit('changeLoadingBar', true);
        view();
    }

    function checkChangedData(){
        return !angular.equals(pageData.FD, $scope.FD) || !eventRuleService.checkEventRuleValidation();
    }

    function setChangedData() {
        $rootScope.$emit('changeLoadingBar', true);
        
        var deferred = $q.defer();
        var queue = [];

        if (!angular.equals(pageData.FD, $scope.FD)) {
            setFaceDetection(queue);
        }

        if(queue.length > 0){
            SunapiClient.sequence(queue, function(){
                $scope.$emit('applied', UniversialManagerService.getChannelId());
                $timeout(function(){
                    view();
                    deferred.resolve(true);
                });
            }, function(errorData){
                console.error(errorData);
                deferred.reject(errorData);
            });
        } else {
            $scope.$emit('applied', UniversialManagerService.getChannelId());
            $timeout(function(){
                view();
                deferred.resolve(true);
            });
        }

        return deferred.promise;
    }

    $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
        if(checkChangedData()){
            COMMONUtils.
                confirmChangeingChannel().
                then(function(){
                    if(validatePage() === true){
                        setChangedData().then(function(){
                            changeChannel(index);
                        });
                    }
                }, function(){
                    console.log("canceled");
                });    
        }else{
            changeChannel(index);
        }
    }, $scope);

    $scope.detectionAreaDisplayAll = false;
    $scope.changeDisplayAll = function(val){
        $scope.detectionAreaDisplayAll = val;

        if(val === true){
            for(var i = 0, ii = $scope.detectionAreas.length; i < ii; i++){
                var self = $scope.detectionAreas[i];
                if(typeof self.isEnable !== "undefined"){
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