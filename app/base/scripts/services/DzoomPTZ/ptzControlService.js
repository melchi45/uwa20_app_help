kindFramework.factory('PTZContorlService', ['$q', 'LoggingService', 'SunapiClient','PTZ_TYPE','Attributes', '$rootScope',
    'SequenceModel', '$timeout', 'UniversialManagerService', 'CAMERA_STATUS',
    function($q, LoggingService, SunapiClient, PTZ_TYPE,Attributes,
             $rootScope, SequenceModel, $timeout, UniversialManagerService, CAMERA_STATUS) {
        "use strict";

        var logger = LoggingService.getInstance('PTZContorlService');

        var downCheck = false;
        var areaZoomdownCheck = false;
        var moveCheck = false;
        var controlCheck = false;
        var autoTracking = "False";    //"False" or "True"
        var manualTracking = "False";
        var curX = 0;
        var curY = 0;
        var moveX = 0;
        var moveY = 0;
        var minMove = 20;
        var moveLevel = 60;

        var curPan = 0;
        var curTilt = 0;
        var zoom = 0;

        var sunapiURI = "";

        var ptzMode = 0;
        var ptzModeList = PTZ_TYPE.ptzCommand;
        var sunapiAttributes = Attributes.get();
        var sequenceModel = new SequenceModel();

        var PTStatus = "IDLE";
        var ZStatus = "IDLE";

        var ptzAreaZoomMode = false;
        var ptzAreaZoomDot = $("<div id='ptz-control_areazoom-dot'></div>");
        var ptzAreaZoomList = [];
        var ptzAreaZoomCurrent = -1;
        var ptzAreaZoomStart =  false;
        var blnSavePTZCoordinate = false;
        var isTracking = false;

        var overlayCanvas = null;
        var overlayCanvasContext = null;

        function eventHandler(event,eventType,element) {
            sunapiURI = "/stw-cgi/ptzcontrol.cgi?";
            if (ptzMode === ptzModeList.NONE || ptzMode === ptzModeList.SWING || ptzMode === ptzModeList.GROUP ||
                ptzMode === ptzModeList.TRACE || ptzMode === ptzModeList.TOUR) {
                return;
            } else if (ptzMode === ptzModeList.AREAZOOM || ptzAreaZoomMode) {
                sunapiURI += "msubmenu=areazoom&action=control&Channel=0&Type=ZoomIn";
            }
            else {
                sunapiURI += "msubmenu=continuous&action=control&Channel=0";
            }

            if (!event) { event = window.event; }
            if (eventType === "mousewheel") {
                event.stopPropagation();
                event.preventDefault ();
                var delta = event.wheelDelta / 120;
                if(delta > 0) { // wheel up
                    zoom = 1;
                } else { // wheel down
                    zoom = -1;
                }
                sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=relative&action=control&Channel=0&Zoom=" + zoom;
                zoom = 0;
                return null;
                //return execSunapi(sunapiURI);
            } else if (eventType === "mousedown") {
                if(event.button === 2) return;
                curX = event.offsetX;
                curY = event.offsetY;
                if(!checkBoundary(curX, curY)) { return; }
                if (ptzMode !== ptzModeList.AREAZOOM && (!ptzAreaZoomMode) && ptzMode !== ptzModeList.NEAR && ptzMode !== ptzModeList.FAR &&
                    ptzMode !== ptzModeList.SWING && ptzMode !== ptzModeList.Group && SptzMode !== ptzModeList.Trace &&
                    ptzMode !== ptzModeList.Tour) {
                    downCheck = true;
                }
                if(ptzMode === ptzModeList.AREAZOOM)
                {
                    areaZoomdownCheck = true;
                }
            } else if (eventType === "mousemove") {
                if(event.button === 2) return;
                if(areaZoomdownCheck)
                {
                    overlayCanvasContext.clearRect(0, 0, overlayCanvas.offsetWidth, overlayCanvas.offsetHeight);
                    overlayCanvasContext.strokeRect(curX, curY, event.offsetX - curX, event.offsetY - curY);
                }
                if(downCheck) {
                    moveCheck = true;
                    var pan = 0;
                    var tilt = 0;
                    moveX = curX - event.offsetX;
                    moveY = curY - event.offsetY;

                    if (moveX < -minMove ) { //left -> right
                        if (moveX < -moveLevel * 6) pan = 6;
                        else if (moveX < -moveLevel * 5) pan = 5;
                        else if (moveX < -moveLevel * 4) pan = 4;
                        else if (moveX < -moveLevel * 3) pan = 3;
                        else if (moveX < -moveLevel * 2) pan = 2;
                        else pan = 1;
                    } else if (moveX > minMove) { //right -> left
                        if (moveX > moveLevel * 6) pan = -6;
                        else if (moveX > moveLevel * 5) pan = -5;
                        else if (moveX > moveLevel * 4) pan = -4;
                        else if (moveX > moveLevel * 3) pan = -3;
                        else if (moveX > moveLevel * 2) pan = -2;
                        else pan = -1;
                    }

                    if (moveY < -minMove ) { //top -> bottom
                        if (moveY < -moveLevel * 6) tilt = -6;
                        else if (moveY < -moveLevel * 5) tilt = -5;
                        else if (moveY < -moveLevel * 4) tilt = -4;
                        else if (moveY < -moveLevel * 3) tilt = -3;
                        else if (moveY < -moveLevel * 2) tilt = -2;
                        else tilt = -1;
                    } else if (moveY > minMove) { //bottom -> top
                        if (moveY > moveLevel * 6) tilt = 6;
                        else if (moveY > moveLevel * 5) tilt = 5;
                        else if (moveY > moveLevel * 4) tilt = 4;
                        else if (moveY > moveLevel * 3) tilt = 3;
                        else if (moveY > moveLevel * 2) tilt = 2;
                        else tilt = 1;
                    }
                    if (curPan === pan && curTilt === tilt) {
                        return null;
                    } else {
                        sunapiURI += "&Pan=" + pan;
                        sunapiURI += "&Tilt=" + tilt;
                        sunapiURI += "&Zoom=0";

                        curPan = pan;
                        curTilt = tilt;

                        turnOffTracking();

                        return execSunapi(sunapiURI);
                    }
                }
            } else if (eventType === "mouseup" || eventType === "mouseleave") {
                if(event.button === 2) return;
                if(areaZoomdownCheck)
                {
                    areaZoomdownCheck = false;
                    overlayCanvasContext.clearRect(0, 0, overlayCanvas.offsetWidth, overlayCanvas.offsetHeight);
                }
                if (downCheck) {
                    downCheck = false;
                    if(moveCheck && (autoTracking === "True" || manualTracking === "True")) {
                        return;
                    } else {
                        sunapiURI += "&Focus=Stop";
                        return execSunapi(sunapiURI);
                    }
                } else if ( (ptzMode === ptzModeList.AREAZOOM || ptzAreaZoomMode) && eventType === "mouseup" && (event.target.nodeName === "CANVAS" || event.target.nodeName === "DIV")) {
                    if(ptzAreaZoomStart) { return; }

                    if(!checkBoundary(curX, curY)) { return; }  // Checking Start Point
                    if(!checkBoundary(event.offsetX, event.offsetY)) { return; }  // Checking End Point

                    if(Math.abs(curX - event.offsetX) <= 8 && Math.abs(curY - event.offsetY) <= 8){
                        curX = event.offsetX;
                        curY = event.offsetY;
                    }

                    return runPTZAreaZoom(curX, curY, event.offsetX, event.offsetY, overlayCanvas.offsetWidth, overlayCanvas.offsetHeight);
                }
            }
            return null;
        }

        function mouseWheel(event) { eventHandler(event,"mousewheel", null); }
        function mouseDown(event) { eventHandler(event,"mousedown", null); }
        function mouseMove(event) { eventHandler(event,"mousemove", null); }
        function mouseUp(event) { eventHandler(event,"mouseup", null); }
        function mouseLeave(event) { eventHandler(event,"mouseleave", null); }

        function setElementEvent(element) {
            // Removed Duplicated Event Listener
            deleteElementEvent(element);

            element.addEventListener('mousewheel', mouseWheel);
            element.addEventListener('mousedown', mouseDown);
            element.addEventListener('mousemove', mouseMove);
            element.addEventListener('mouseup', mouseUp);
            element.addEventListener('mouseleave', mouseLeave);
        }

        function deleteElementEvent(element) {
            element.removeEventListener('mousewheel', mouseWheel);
            element.removeEventListener('mousedown', mouseDown);
            element.removeEventListener('mousemove', mouseMove);
            element.removeEventListener('mouseup', mouseUp);
            element.removeEventListener('mouseleave', mouseLeave);
        }

        function setPTZAreaZoom(mode){
            switch(mode){
                case "on" :
                    ptzAreaZoomStart =  false;
                    setMode(ptzModeList.AREAZOOM);
                    areaZoomInit();

                    ptzAreaZoomDot.css({
                        width : "8px",
                        height : "8px",
                        backgroundColor : "#ffff00",
                        position: "absolute",
                        zIndex: "100",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                    });
                    $("overlay-canvas").prepend(ptzAreaZoomDot);

                    break;
                case "off" :
                    ptzAreaZoomStart =  false;
                    setMode(ptzModeList.PTZ);
                    ptzAreaZoomMode = false;

                    ptzAreaZoomDot.remove();
                    ptzAreaZoomDot = $("<div id='ptz-control_areazoom-dot'></div>");

                    break;
                case "start" :
                    ptzAreaZoomDot.css({
                        width : "5px",
                        height : "5px",
                        borderRadius : "100%"
                    });
                    break;
                case "end" :
                    ptzAreaZoomDot.css({
                        width : "8px",
                        height : "8px",
                        borderRadius : "0"
                    });
                    break;
            }
        }

        function savePTZAreaZoomList(callback){
            execSunapi("/stw-cgi/ptzcontrol.cgi?msubmenu=query&action=view&Channel=0&Query=Pan,Tilt,Zoom", function(getData){
                if(ptzAreaZoomCurrent !== ptzAreaZoomList.length - 1){
                    ptzAreaZoomList = ptzAreaZoomList.splice(0, ptzAreaZoomCurrent + 1);
                }else if(ptzAreaZoomList.length === 5){
                    ptzAreaZoomList.shift();
                }

                getData = getData.Query[0];
                var uri = "/stw-cgi/ptzcontrol.cgi?msubmenu=absolute&action=control&Channel=0";
                uri += "&Pan=" + getData.Pan;
                uri += "&Tilt=" + getData.Tilt;
                uri += "&Zoom=" + getData.Zoom;
                ptzAreaZoomList.push(uri);

                ptzAreaZoomCurrent = ptzAreaZoomList.length - 1;

                if(callback)
                {
                    callback();
                }
            });
        }

        function runPTZAreaZoom(X1, Y1, X2, Y2, TileWidth, TileHeight)
        {
            sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=areazoom&action=control&Channel=0&Type=ZoomIn";
            sunapiURI += "&X1=" + X1 + "&Y1=" + Y1 + "&X2=" + X2 + "&Y2=" + Y2;
            sunapiURI += "&TileWidth=" + TileWidth + "&TileHeight=" + TileHeight;
            ptzAreaZoomStart =  true;
            turnOffTracking();
            return execSunapi(sunapiURI, function() { PTStatus = "MOVING"; ZStatus = "MOVING"; setPTZAreaZoom("start"); blnSavePTZCoordinate = true; });
        }

        function getPTZAreaZoomURI(mode){
            if(ptzAreaZoomStart) { return; }
            if( ptzAreaZoomCurrent > 0 && mode === "prev"){
                ptzAreaZoomStart =  true;
                execSunapi(ptzAreaZoomList[--ptzAreaZoomCurrent], function(){ PTStatus = "MOVING"; ZStatus = "MOVING"; setPTZAreaZoom("start"); });
            }else if( ptzAreaZoomCurrent < (ptzAreaZoomList.length - 1) && mode === "next"){
                ptzAreaZoomStart =  true;
                execSunapi(ptzAreaZoomList[++ptzAreaZoomCurrent], function(){ PTStatus = "MOVING"; ZStatus = "MOVING"; setPTZAreaZoom("start"); });
            }else if(mode === "1x"){
                ptzAreaZoomStart =  true;
                var uri = "/stw-cgi/ptzcontrol.cgi?msubmenu=areazoom&action=control&Channel=0&Type=1x";
                execSunapi(uri, function(){ PTStatus = "MOVING"; ZStatus = "MOVING"; setPTZAreaZoom("start"); blnSavePTZCoordinate = true;});
            }
        }

        function getSettingList(callback) {
            sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=";

            if (ptzMode === ptzModeList.PRESET) {
                sunapiURI += "preset&action=view&Channel=0";
            } else if (ptzMode === ptzModeList.SWING) {
                sunapiURI += "swing&action=view&Channel=0";
            } else if (ptzMode === ptzModeList.GROUP) {
                sunapiURI += "group&action=view&Channel=0";
            } else if (ptzMode === ptzModeList.TOUR) {
                sunapiURI += "tour&action=view&Channel=0";
            } else if (ptzMode === ptzModeList.TRACE) {
                callback(sunapiAttributes.MaxTraceCount); //callback max trace count
                return;
            } else if (ptzMode === ptzModeList.TRACKING) {
                sunapiURI += "autorun&action=view&Channel=0";
            }

            execSunapi(sunapiURI, callback);
        }

        function execute(value) {
            sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=";

            if(ptzMode !== ptzModeList.TRACKING && getAutoTrackingMode() === "False" && getManualTrackingMode() === "False") {
                turnOffTracking();
            }

            if (ptzMode === ptzModeList.AUTOFOCUS) {
                sunapiURI = "/stw-cgi/image.cgi?msubmenu=focus&action=control&Channel=0&Mode=AutoFocus";
            } else if (ptzMode === ptzModeList.NEAR) {
                sunapiURI += "continuous&action=control&Channel=0&Focus=Near";
            } else if (ptzMode === ptzModeList.FAR) {
                sunapiURI += "continuous&action=control&Channel=0&Focus=Far";
            } else if (ptzMode === ptzModeList.ZOOMIN) {
                sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&Zoom=2";
            } else if (ptzMode === ptzModeList.ZOOMOUT) {
                sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&Zoom=-2";
            } else if (ptzMode === ptzModeList.PRESET) {
                sunapiURI += "preset&action=control&Channel=0&Preset=" + value;
            } else if (ptzMode === ptzModeList.TRACKING) {
                if(getManualTrackingMode() === "True") {
                    sunapiURI = "/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=control&TargetLockCoordinate=" + value[0] + ',' + value[1];
                    isTracking = true;
                } else if(getAutoTrackingMode() === "True") {
                    sunapiURI = "/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=set&Channel=0&Enable=True";
                    isTracking = true;
                } else if(getManualTrackingMode() === "False" || getAutoTrackingMode() === "False") {
                    sunapiURI = "/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=set&Channel=0&Enable=False";
                    if(getManualTrackingMode() === "False" && getAutoTrackingMode() === "False") {
                        isTracking = false;
                    }
                }
            } else if (ptzMode === ptzModeList.STOP) {
                sunapiURI += "continuous&action=control&Channel=0&Focus=Stop";
            } else {
                return;
            }

            execSunapi(sunapiURI);
        }

        function extendExecute(params) {
            turnOffTracking();
            execSunapi(sequenceModel.returnSunapiURI());
        }

        function ptzSetting(values, callback) {
            if (ptzMode === ptzModeList.PRESET) {
                sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=";
                if (values.action === 'add') {
                    sunapiURI += "preset&action=add&Channel=0&Preset=" + values.num + "&Name=" + values.name;
                } else if (values.action === 'update') {
                    sunapiURI += "preset&action=update&Channel=0&Preset=" + values.num + "&Name=" + values.name;
                } else if (values.action === 'remove') {
                    sunapiURI += "preset&action=remove&Channel=0&Preset=" + values.num;
                } else if (values.action === 'home') {
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=home&action=control&Channel=0";
                }
            }

            execSunapi(sunapiURI, callback);
        }

        function execSunapi(uri, callback) {
            var getData = {};
            if (uri !== null) {
                SunapiClient.get(uri, getData,
                    function (response) { if (callback !== null && callback !== undefined) { callback(response.data); } },
                    function (errorData) {
                        console.log(errorData);
                        if (callback !== null && callback !== undefined) {
                            callback(errorData);
                        } else {
                            console.log(errorData);
                        }
                    }, '', true
                );
            }
        }

        var PTZStatusMutex = true;
        $rootScope.$saveOn('PTZMoveStatus', function(event, obj) {
            switch(obj.type) {
                case "MoveStatus:PanTilt":
                    if (obj.value === "MOVING")
                    {
                        PTStatus = "MOVING";
                        //AreaZoom 모드이면서 일반 PTZ 동작 중일때
                        if(ptzMode === ptzModeList.AREAZOOM)
                        {
                            setPTZAreaZoom("start");
                            ptzAreaZoomStart =  true;
                        }
                    }
                    else if (obj.value === "IDLE")
                    {
                        PTStatus = "IDLE";
                    }
                    break;
                case "MoveStatus:Zoom":
                    if (obj.value === "MOVING")
                    {
                        ZStatus = "MOVING";
                        //AreaZoom 모드이면서 일반 PTZ 동작 중일때
                        if(ptzMode === ptzModeList.AREAZOOM)
                        {
                            setPTZAreaZoom("start");
                            ptzAreaZoomStart =  true;
                        }
                    }
                    else if (obj.value === "IDLE")
                    {
                        ZStatus = "IDLE";
                    }
                    break;
            }
            if( PTStatus === "IDLE" && ZStatus === "IDLE")
            {
                //PTZZStatusMutex is used for calling savePTZAreaZoomList double time.
                //PTStatus :: MOVING
                //ZStatus :: IDEL
                //PTStatus :: IDEL  -- savePTZAreaZoomList called.
                //ZStatus :: IDEL -- savePTZAreaZoomList called.
                if(PTZStatusMutex)
                {
                    PTZStatusMutex = false;
                    if(ptzAreaZoomStart)
                    {
                        if(blnSavePTZCoordinate)
                        {
                            //Manual AreaZoom, 1X action need to save coordinate
                            savePTZAreaZoomList(function(){
                                setPTZAreaZoom("end");
                                ptzAreaZoomStart =  false;
                                blnSavePTZCoordinate = false;
                                PTZStatusMutex = true;
                            });
                        }
                        else
                        {
                            //Prev, Next Action don't need to save coordinate
                            //AreaZoom 모드이면서 일반 PTZ 동작 중일때
                            setPTZAreaZoom("end");
                            ptzAreaZoomStart =  false;
                            PTZStatusMutex = true;
                        }
                    }
                    else
                    {
                        PTZStatusMutex = true;
                    }
                }

            }
        });

        function setMode(mode) {
            ptzMode = mode;
            if(mode === PTZ_TYPE.ptzCommand.PTZ) { // when ptz mode set, initialize mouse event value
                downCheck = false;
                moveCheck = false;
            }
            if(ptzMode === ptzModeList.AREAZOOM){
                ptzAreaZoomMode = true;
            }
        }

        function areaZoomInit()
        {
            overlayCanvas = document.getElementById("cm-livecanvas");
            overlayCanvasContext = overlayCanvas.getContext("2d");

            //AreaZoom 영역 색상 두께 설정
            overlayCanvasContext.strokeStyle = "#FFFF00";
            overlayCanvasContext.lineWidth = 5;
        }

        function getMode(type) { return (ptzAreaZoomMode === true && type === "Areazoom")? ptzModeList.AREAZOOM : ptzMode; }
        function setAutoTrackingMode(mode) {
            autoTracking = mode;
            execute();
        }
        function setManualTrackingMode(mode) {
            manualTracking = mode;
            if(mode === "False") {
                execute();
            }
        }
        function getManualTrackingMode() { return manualTracking; }
        function getAutoTrackingMode() { return autoTracking; }

        function getMaxGroup() {
            return sunapiAttributes.MaxGroupCount;
        }

        function getMaxTour() {
            return sunapiAttributes.MaxTourCount;
        }
        function getMaxTrace() {
            return sunapiAttributes.MaxTraceCount;
        }
        function checkBoundary(x, y) {
            var canvas = document.querySelector(".kind-stream-canvas");
            var w = canvas.offsetWidth;
            var h = canvas.offsetHeight;
            var xPos = x;
            var yPos = y;

            var offsetLeft = canvas.offsetLeft;
            var offsetTop = canvas.offsetTop;

            if(UniversialManagerService.getViewMode() === CAMERA_STATUS.VIEW_MODE.DETAIL) { // when full screen, fullDiv handles mouse events
                if(offsetLeft > 0) {
                    if((xPos <= offsetLeft) || ((offsetLeft + w) <= xPos)) { // x is positioned in offset area
                        return false;
                    }
                } else if(offsetTop > 0) {
                    if((yPos <= offsetTop) || ((offsetTop + h) <= yPos)) { // y is postioned in offset area
                        return false;
                    }
                }
            }
            return true;
        }
        function turnOffTracking() {
            if(isTracking) {
                autoTracking = "False";
                manualTracking = "False";
            }
            $rootScope.$emit('turnOffTracking', true);
        }

        (function wait(){
            if (!sunapiAttributes.Ready) {
                $timeout(function () {
                    sunapiAttributes = Attributes.get();
                    wait();
                }, 500);
            } else {
                if(sunapiAttributes.AreaZoomSupport === true){
                    savePTZAreaZoomList();
                }
            }
        })();

        return {
            eventHandler : eventHandler,
            setElementEvent : setElementEvent,
            deleteElementEvent : deleteElementEvent,
            setPTZAreaZoom : setPTZAreaZoom,
            savePTZAreaZoomList : savePTZAreaZoomList,
            getPTZAreaZoomURI : getPTZAreaZoomURI,
            setMode : setMode,
            getMode : getMode,
            execute : execute,
            getSettingList : getSettingList,
            ptzSetting : ptzSetting,
            execSunapi : execSunapi,
            setAutoTrackingMode : setAutoTrackingMode,
            getAutoTrackingMode : getAutoTrackingMode,
            setManualTrackingMode : setManualTrackingMode,
            getManualTrackingMode : getManualTrackingMode,
            getMaxGroup : getMaxGroup,
            getMaxTour : getMaxTour,
            getMaxTrace : getMaxTrace,
            extendExecute : extendExecute,
            runPTZAreaZoom : runPTZAreaZoom
        };
    }]);