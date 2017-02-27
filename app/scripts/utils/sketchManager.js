var SketchManager = (function() {
    "use strict";
    var sketchInfo = {
        workType: null, //"mdSize", "mdArea", "vaEntering", "vaPassing", "vaAppearing", "fdArea", "smartCodec", "simpleFocus", "autoTracking"
        shape: null, //0: rectangle, 1: polygon, 2: line
        maxNumber: 4,
        currentNumber: 0,
        minAreaSize: 0,
        modalId: null,
        disValue: null
    };
    var videoInfo = {
        width: 640,
        height: 480,
        maxWidth: 1920,
        maxHeight: 1080,
        flip: null,
        mirror: null,
        support_ptz: null,
        rotate: null,
        adjust: true
    };

    var drawMetaDataTimer = null;

    var frontCanvas = null;
    var backCanvas = null;
    var fContext = null;
    var bContext = null;
    var mdSize = null;
    var mdArea = null;
    var vaEnteringAppearing = null;
    var vaPassing = null;
    var crop = null;
    var privacy = null;
    var autoTracking = null;
    var dialog = null;
    var updateCoordinates = null;
    var privacyUpdate = null;
    var autoTrackingUpdate = null;
    var getZoomValue = null;
    var ratio = null;

    var colorFactory = {
        originalRed: '#FF0000',
        red: "#CE534D",
        brightRed: '#CE827E',
        darkRed: '#CC3333',
        blue: "#3184F9",
        brightBlue: "#C2E7FF",
        darkBlue: '#0066CC',
        green: "#99ff00",
        white: '#FFFFFF',
        includeArea: {
            fill: '#ff6633',
            line: '#ff6633',
            point: '#ff6633'
        },
        excludeArea: {
            fill: '#000000',
            line: '#ffffff',
            point: '#999999'
        }
    };

    var alphaFactory = {
        disabled: {
            stroke: "0.5",
            fill: "0.4"
        },
        enabled: {
            stroke: "1",
            fill: "0.1"
        },
        metaData: "0.7"
    };

    var lineWidth = 2;

    //SVG Drawing
    var svgElement = null; //Sketboot Directive에 작성한 SVG 태그
    var svgObjs = []; //Polygon, Rectangle 추가시 여기에 추가됨.
    var kindSVGEditor = null; //KindSVGDrawing 정의
    var kindSVGCustomObj = null; //KindSVGDrawing.custom() 함수 정의

    /*
    SVG 를 사용하기 위해서 toggleSVGElement(true) 를 실행 해야 함.
    Class의 constructor에 꼭 넣어야 됨.
    */
    var toggleSVGElement = function(status){
        if(svgElement !== null){
            var zIndex = status === true ? 1001 : 999;
            if("style" in svgElement){
                svgElement.style.zIndex = zIndex;
            }

            svgElement.setAttributeNS(null, 'width', videoInfo.width);
            svgElement.setAttributeNS(null, 'height', videoInfo.height);
        }
    };

    var resetSVGElement = function(){
        if(kindSVGCustomObj !== null){
            kindSVGCustomObj.destroy();
            kindSVGCustomObj = null;
        }

        if(svgObjs !== null){
            for(var i = 0, len = svgObjs.length; i < len; i++){
                var self = svgObjs[i];
                if(self !== null && self !== undefined){
                    self.destroy();
                }
            }   

            svgObjs = [];
        }

        toggleSVGElement(false);
    };

    var convertDirection = function(direction){
        var changedDirection = '';
        switch(direction){
            case 0:
                changedDirection = 'L';
            break;
            case 1:
                changedDirection = 'R';
            break;
            case 2:
                changedDirection = 'LR';
            break;
            case 'L':
                changedDirection = 0;
            break;
            case 'R':
                changedDirection = 1;
            break;
            case 'LR':
                changedDirection = 2;
            break;
        }

        return changedDirection;
    };

    var getCoordinate = function(event, self){
        var offset = $(self).offset();
        var xVal = event.pageX - offset.left;
        var yVal = event.pageY - offset.top;

        if (window.navigator.msPointerEnabled) { //Detect IE10 or IE11
            if ($(window).scrollLeft() !== 0 && event.pageX === event.clientX) {
                xVal = xVal + $(window).scrollLeft();
            }
            if ($(window).scrollTop() !== 0 && event.pageY === event.clientY) {
                yVal = yVal + $(window).scrollTop();
            }
        }

        return [xVal, yVal];
    };

    /**
     * @param args[0] <Int> 0: fContext, else: bContext
     * @param args[1] <Int> 0: red, else: blue
     * @param args[2] <Int> X coordinate
     * @param args[3] <Int> Y coordinate
     * @param args[4] <Int> Object Width
     * @param args[5] <Int> Object Height
     */
    function getOptions(args){
        var context = args[0] === 0 ? fContext : bContext;
        var color = args[1] === 0 ? colorFactory.red : colorFactory.blue;
        var startGlobalAlpha = args[0] === 0 ? alphaFactory.enabled.stroke : alphaFactory.disabled.stroke;
        var endGlobalAlpha = args[0] === 0 ? alphaFactory.enabled.fill : alphaFactory.disabled.fill;

        return {
            context: context,
            color: color,
            startGlobalAlpha: startGlobalAlpha,
            endGlobalAlpha: endGlobalAlpha
        };
    }

    function getMetaDataOptions(args){
        var context = args[0] === 0 ? fContext : bContext;
        var color = args[1] === 0 ? colorFactory.originalRed : colorFactory.green;
        var startGlobalAlpha = alphaFactory.metaData;

        return {
            context: context,
            color: color,
            startGlobalAlpha: startGlobalAlpha,
        };
    }

    /**
     * Drawing Rectangle
     * 
     * @param arguments[0] <Int> 0: fContext, else: bContext
     * @param arguments[1] <Int> 0: red, else: blue
     * @param arguments[2] <Int> X coordinate
     * @param arguments[3] <Int> Y coordinate
     * @param arguments[4] <Int> Object Width
     * @param arguments[5] <Int> Object Height
     */
    function drawRectangle(){
        var options = getOptions(arguments);

        options.context.globalAlpha = options.endGlobalAlpha;
        options.context.fillStyle = options.color;
        options.context.fillRect(
            arguments[2],
            arguments[3],
            arguments[4],
            arguments[5]
        );

        drawStroke.apply(null, arguments);
    }

    function drawCircle(){
        var options = arguments[5] === true ? getMetaDataOptions(arguments) : getOptions(arguments);

        options.context.lineWidth = lineWidth;
        options.context.beginPath();
        options.context.globalAlpha = options.startGlobalAlpha;
        options.context.strokeStyle = options.color;
        options.context.arc(
            arguments[2], 
            arguments[3],
            arguments[4],
            0,
            2 * Math.PI
        );
        options.context.stroke();
        options.context.closePath();
    }

    /**
     * Drawing Stroke
     * 
     * @param arguments[0] <Int> 0: fContext, else: bContext
     * @param arguments[1] <Int> 0: red, else: blue
     * @param arguments[2] <Int> X coordinate
     * @param arguments[3] <Int> Y coordinate
     * @param arguments[4] <Int> Object Width
     * @param arguments[5] <Int> Object Height
     * @param arguments[6] <Int> is MetaData
     */
    function drawStroke(){
        var options = arguments[6] === true ? getMetaDataOptions(arguments) : getOptions(arguments);

        options.context.lineWidth = lineWidth;
        options.context.globalAlpha = options.startGlobalAlpha;
        options.context.strokeStyle = options.color;
        /**
         * Stroke를 그리면 좌표의 중앙을 기준으로 그려진다.
         * Fill과 Stroke가 자연스럽게 같은 위치로 그려주기 위해
         * x, y는 Stroke의 절반을 줄여주고, width, height는 Stroke만큼 빼준다.
         */
        options.context.strokeRect(
            arguments[2],
            arguments[3],
            arguments[4],
            arguments[5]
        );
    }

    function clearRect(){
        var options = getOptions(arguments);

        options.context.clearRect(0, 0, videoInfo.width, videoInfo.height);
    }

    function validateSVGAxis(svgObj, width, height){
        var convertedPoint = convertPoint(
            [0, width], 
            [0, height], 
            'set'
        );
        // var selfPoints = svgObj.getData().points;
        var convertedWidth = convertedPoint.xpos[1];
        var convertedHeight = convertedPoint.ypos[1];
        var returnVal = true;

        if(
            svgObj.validateAxis(
                // selfPoints[0][0] + convertedWidth,
                // selfPoints[0][1] + convertedHeight
                convertedWidth,
                convertedHeight
                ) === false
            ){

            returnVal = false;
        }

        return returnVal;
    }

    /**
     * Geometry의 최소값을 변경하는 함수
     * return 값이 false경우 실해, true일 경우 성공이다.
     */
    function changeMinSizeOption(width, height){
        var isOk = true;
        var maxGeometry = svgObjs[1];
        var convertedPoint = convertPoint(
            [0, width], 
            [0, height], 
            'set'
        );

        maxGeometry.changeMinSizeOption({
            width: convertedPoint.xpos[1],
            height: convertedPoint.ypos[1]
        });   

        return isOk;
    }

    /**
     * Geometry의 최대값을 변경하는 함수
     * return 값이 false경우 실해, true일 경우 성공이다.
     */
    function changeMaxSizeOption(width, height){
        var isOk = true;
        var minGeometry = svgObjs[0];
        var convertedPoint = convertPoint(
            [0, width], 
            [0, height], 
            'set'
        );

        minGeometry.changeMaxSizeOption({
            width: convertedPoint.xpos[1],
            height: convertedPoint.ypos[1]
        });

        return isOk;
    }

    function changeRectangleToSize(index, width, height){
        var convertedPoint = null;

        if(svgObjs[index] !== undefined){
            convertedPoint = convertPoint(
                [0, width], 
                [0, height], 
                'set'
            );

            // console.log("[Origin] w", width, "h", height);
            // console.log("[Geometry] w", convertedPoint.xpos[1], "h", convertedPoint.ypos[1]);

            svgObjs[index].changeRectangleToSize(
                convertedPoint.xpos[1],
                convertedPoint.ypos[1]
            );

            if(sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration"){
                if(vaEnteringAppearing !== undefined){
                    vaEnteringAppearing.updatePrevSize(index, convertedPoint.xpos[1], convertedPoint.ypos[1]);   
                }
            }
        }
    }

    function constructor(fCanvas, bCanvas, modal, svgTag, cropRatio) {
        frontCanvas = fCanvas;
        backCanvas = bCanvas;
        fContext = frontCanvas.getContext("2d");
        bContext = backCanvas.getContext("2d");
        dialog = modal;
        ratio = cropRatio;
        svgElement = svgTag;
        kindSVGEditor = new KindSVGEditor(svgTag);
    }
    constructor.prototype = {
        init: function(sketchInfomation, videoInInfomation, updateCallback, privacyCallback, autoTrackingCallback, getZoomValueCallback) {
            //init: function(sketchInfomation, videoInInfomation, updateCallback, privacyCallback, autoTrackingCallback){
            sketchInfo = sketchInfomation;
            videoInfo = videoInInfomation;
            updateCoordinates = updateCallback;
            privacyUpdate = privacyCallback;
            autoTrackingUpdate = autoTrackingCallback;
            getZoomValue = getZoomValueCallback;                ////////
            frontCanvas.width = videoInfo.width;
            frontCanvas.height = videoInfo.height;
            backCanvas.width = videoInfo.width;
            backCanvas.height = videoInfo.height;
            this.initDrawObject();

            resetSVGElement();

            if (sketchInfo !== null) {
                this.createDrawObject(sketchInfo);
            }
        },
        createDrawObject: function() {
            if (sketchInfo.workType === "mdSize") {
                mdSize = new MdSize();
                frontCanvas.addEventListener("mousedown", mdSize.mdSizeMousedown, false);
                document.addEventListener("mousemove", mdSize.mdSizeMousemove, false);
                document.addEventListener("mouseup", mdSize.mdSizeMouseup, false);
            } else if (
                sketchInfo.workType === "qmArea" || 
                sketchInfo.workType === "mdArea" || 
                sketchInfo.workType === "fdArea" || 
                sketchInfo.workType === "smartCodec" || 
                sketchInfo.workType === "simpleFocus") {
                if (sketchInfo.shape === 0) { //smartCodec, simpleFocus
                    mdArea = new MdArea();
                    frontCanvas.addEventListener("mousedown", mdArea.mousedownRectangle, false);
                    document.addEventListener("mousemove", mdArea.mousemoveRectangle, false);
                    document.addEventListener("mouseup", mdArea.mouseupRectangle, false);
                    frontCanvas.addEventListener("contextmenu", mdArea.contextmenuRectangle, false);
                } else { //fdArea, mdArea
                    vaEnteringAppearing = new VaEnteringAppearing();
                    /*frontCanvas.addEventListener("click", mdArea.mouseclickPolygon, false);
                    frontCanvas.addEventListener("mousemove", mdArea.mousemovePolygon, false);
                    frontCanvas.addEventListener('contextmenu', mdArea.contexmenuPolygon, false);*/
                }
            } else if (sketchInfo.workType === "vaEntering" || sketchInfo.workType === "vaAppearing" || sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration") {
                vaEnteringAppearing = new VaEnteringAppearing();
            } else if (sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount") {
                vaPassing = new VaPassing();
            } else if (sketchInfo.workType === "autoTracking") {
                autoTracking = new AutoTracking();
                frontCanvas.addEventListener("mousedown", autoTracking.mousedownRectangle, false);
                document.addEventListener("mousemove", autoTracking.mousemoveRectangle, false);
                document.addEventListener("mouseup", autoTracking.mouseupRectangle, false);
                frontCanvas.addEventListener("contextmenu", autoTracking.contextmenuRectangle, false);
            } else if (sketchInfo.workType === "crop") {
                crop = new Crop();
                frontCanvas.addEventListener("mousedown", crop.cropMousedown, false);
                document.addEventListener("mousemove", crop.cropMousemove, false);
                document.addEventListener("mouseup", crop.cropMouseup, false);
            } else if (sketchInfo.workType === "privacy") {
                if (sketchInfo.shape === 0) {
                    privacy = new Privacy();
                    frontCanvas.addEventListener("mousedown", privacy.mousedownRectangle, false);
                    document.addEventListener("mousemove", privacy.mousemoveRectangle, false);
                    document.addEventListener("mouseup", privacy.mouseupRectangle, false);
                    frontCanvas.addEventListener("contextmenu", privacy.contextmenuRectangle, false);
                } else if (sketchInfo.shape === 1) {
                    privacy = new Privacy();
                    frontCanvas.addEventListener("click", privacy.mouseclickPolygon, false);
                    frontCanvas.addEventListener("mousemove", privacy.mousemovePolygon, false);
                    frontCanvas.addEventListener('contextmenu', privacy.contexmenuPolygon, false);
                } else {
                    fContext.lineWidth = 1;
                    fContext.fillStyle = "black";
                    fContext.globalAlpha = 0.3;
                    fContext.fillRect(0, 0, videoInfo.width, videoInfo.height);
                }
            } else if (sketchInfo.workType === "ptLimit") {
                clearRect(0);
                if(sketchInfo.ptStatus >= 1 && sketchInfo.ptStatus <= 4){
                    var width = parseInt(videoInfo.width);
                    var height = parseInt(videoInfo.height);
                    var halfWidth = width / 2;
                    var halfHeight = height / 2;
                    var sideLineSize = 40;
                    var arrowLineSize = sideLineSize / 5;

                    var drawLine = function(startX, startY, endX, endY){
                        fContext.beginPath();
                        fContext.moveTo(startX, startY);
                        fContext.lineTo(endX, endY);
                        fContext.closePath();
                        fContext.stroke();
                    };

                    fContext.lineWidth = 1;
                    fContext.strokeStyle = colorFactory.white;
                    drawLine(halfWidth, height / 3, halfWidth, (height / 3) * 2);

                    if (sketchInfo.ptStatus === 1) { //오른쪽 화살표
                        drawLine(
                            halfWidth,
                            halfHeight,
                            halfWidth + sideLineSize,
                            halfHeight
                        );
                        drawLine(
                            halfWidth + sideLineSize, 
                            halfHeight,
                            halfWidth + sideLineSize - arrowLineSize,
                            halfHeight + arrowLineSize
                        );
                        drawLine(
                            halfWidth + sideLineSize,
                            halfHeight,
                            halfWidth + sideLineSize - arrowLineSize,
                            halfHeight - arrowLineSize
                        );
                    } else if (sketchInfo.ptStatus === 2) {//왼쪽 화살표
                        drawLine(
                            halfWidth,
                            halfHeight,
                            halfWidth - sideLineSize,
                            halfHeight
                        );

                        drawLine(
                            halfWidth - sideLineSize,
                            halfHeight,
                            halfWidth - sideLineSize + arrowLineSize,
                            halfHeight + arrowLineSize
                        );

                        drawLine(
                            halfWidth - sideLineSize,
                            halfHeight,
                            halfWidth - sideLineSize + arrowLineSize,
                            halfHeight - arrowLineSize
                        );
                    } else if (sketchInfo.ptStatus === 3 || sketchInfo.ptStatus === 4) {
                        drawLine(
                            width / 7 * 3,
                            halfHeight,
                            width / 7 * 4,
                            halfHeight
                        );
                    }

                    fContext.font = "15px Verdana";
                    fContext.fillStyle = colorFactory.white;
                    fContext.textAlign = "center";
                    fContext.fillText(sketchInfo.guideText, halfWidth, 20);
                }
            }
        },
        initDrawObject: function() {
            if (mdSize !== null) {
                frontCanvas.removeEventListener("mousedown", mdSize.mdSizeMousedown, false);
                document.removeEventListener("mousemove", mdSize.mdSizeMousemove, false);
                document.removeEventListener("mouseup", mdSize.mdSizeMouseup, false);
                mdSize = null;
            }
            if (mdArea !== null) {
                frontCanvas.removeEventListener("mousedown", mdArea.mousedownRectangle, false);
                document.removeEventListener("mousemove", mdArea.mousemoveRectangle, false);
                document.removeEventListener("mouseup", mdArea.mouseupRectangle, false);
                frontCanvas.removeEventListener("contextmenu", mdArea.contextmenuRectangle, false);
                frontCanvas.removeEventListener("click", mdArea.mouseclickPolygon, false);
                frontCanvas.removeEventListener("mousemove", mdArea.mousemovePolygon, false);
                frontCanvas.removeEventListener('contextmenu', mdArea.contexmenuPolygon, false);
                mdArea = null;
            }
            if (vaEnteringAppearing !== null) {
                frontCanvas.removeEventListener("mousedown", vaEnteringAppearing.mousedownRectangle, false);
                document.removeEventListener("mousemove", vaEnteringAppearing.mousemoveRectangle, false);
                document.removeEventListener("mouseup", vaEnteringAppearing.mouseupRectangle, false);
                frontCanvas.removeEventListener("contextmenu", vaEnteringAppearing.contextmenuRectangle, false);
                frontCanvas.removeEventListener("click", vaEnteringAppearing.mouseclickPolygon, false);
                frontCanvas.removeEventListener("mousemove", vaEnteringAppearing.mousemovePolygon, false);
                frontCanvas.removeEventListener('contextmenu', vaEnteringAppearing.contexmenuPolygon, false);
                vaEnteringAppearing = null;
            }
            if (vaPassing !== null) {
                frontCanvas.removeEventListener("click", vaPassing.mouseclickPassing, false);
                frontCanvas.removeEventListener("mousemove", vaPassing.mousemovePassing, false);
                frontCanvas.removeEventListener("contextmenu", vaPassing.contextmenuPassing, false);
                vaPassing = null;
            }
            if (privacy !== null) {
                frontCanvas.removeEventListener("mousedown", privacy.mousedownRectangle, false);
                document.removeEventListener("mousemove", privacy.mousemoveRectangle, false);
                document.removeEventListener("mouseup", privacy.mouseupRectangle, false);
                frontCanvas.removeEventListener("contextmenu", privacy.contextmenuRectangle, false);
                frontCanvas.removeEventListener("click", privacy.mouseclickPolygon, false);
                frontCanvas.removeEventListener("mousemove", privacy.mousemovePolygon, false);
                frontCanvas.removeEventListener('contextmenu', privacy.contexmenuPolygon, false);
                privacy = null;
            }
            if (autoTracking !== null) {
                frontCanvas.removeEventListener("mousedown", autoTracking.mousedownRectangle, false);
                document.removeEventListener("mousemove", autoTracking.mousemoveRectangle, false);
                document.removeEventListener("mouseup", autoTracking.mouseupRectangle, false);
                frontCanvas.removeEventListener("contextmenu", autoTracking.contextmenuRectangle, false);
                frontCanvas.removeEventListener("click", autoTracking.mouseclickPolygon, false);
                frontCanvas.removeEventListener("mousemove", autoTracking.mousemovePolygon, false);
                frontCanvas.removeEventListener('contextmenu', autoTracking.contexmenuPolygon, false);
                autoTracking = null;
            }
        },
        get: function() {
            if (sketchInfo === null) {
                return;
            }
            if (sketchInfo.workType === "mdSize") {
                return mdSize.get();
            } else if (sketchInfo.workType === "qmArea" || sketchInfo.workType === "mdArea" || sketchInfo.workType === "fdArea" || sketchInfo.workType === "smartCodec" || sketchInfo.workType === "simpleFocus") {
                if (sketchInfo.shape === 0) {
                    return mdArea.get();
                }else{
                    return vaEnteringAppearing.get();    
                }
            } else if (sketchInfo.workType === "vaEntering" || sketchInfo.workType === "vaAppearing" || sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration") {
                return vaEnteringAppearing.get();
            } else if (sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount") {
                return vaPassing.get();
            } else if (sketchInfo.workType === "autoTracking") {
                return autoTracking.get();
            } else if (sketchInfo.workType === "crop") {
                return crop.get();
            } else if (sketchInfo.workType === "privacy") {
                return privacy.get();
            }
        },
        set: function(data, flag) {
            if (sketchInfo === null) {
                return;
            }
            if (sketchInfo.workType === "mdSize") {
                if (mdSize !== null) mdSize.set(data, flag);
            } else if (sketchInfo.workType === "qmArea" || sketchInfo.workType === "mdArea" || sketchInfo.workType === "fdArea" || sketchInfo.workType === "smartCodec" || sketchInfo.workType === "simpleFocus") {
                if (sketchInfo.shape === 0) {
                    if (mdArea !== null) mdArea.set(data, flag);
                }else{
                    if (vaEnteringAppearing !== null) vaEnteringAppearing.set(data);
                }
            } else if (sketchInfo.workType === "vaEntering" || sketchInfo.workType === "vaAppearing" || sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration") {
                if (vaEnteringAppearing !== null) vaEnteringAppearing.set(data);
            } else if (sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount") {
                if (vaPassing !== null) vaPassing.set(data);
            } else if (sketchInfo.workType === "autoTracking") {
                if (autoTracking !== null) autoTracking.set(data);
            } else if (sketchInfo.workType === "crop") {
                if (crop !== null) crop.set(data);
            } else if (sketchInfo.workType === "privacy") {
                if (privacy !== null) privacy.set(data);
            }
        },
        changeFlag: function(data) {
            if (sketchInfo.workType === "mdSize") {
                mdSize.changeMdsizeFlag(data);
            } else if (sketchInfo.workType === "qmArea" || sketchInfo.workType === "mdArea" || sketchInfo.workType === "fdArea") {
                mdArea.changeMdDetectFlag(data);
            } else if (sketchInfo.workType === "vaEntering" || sketchInfo.workType === "vaAppearing") {}
        },
        changeRatio: function(data) {
            if (sketchInfo.workType === "crop") {
                crop.changeRatio(data);
            }
        },
        setEnableForSVG: function(index, enableOption){
            if(kindSVGCustomObj !== null){
                if(sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount"){
                    vaPassing.setEnableForSVG(index, enableOption);   
                }else{
                    vaEnteringAppearing.setEnableForSVG(index, enableOption);   
                }
            }
        },
        activeShape: function(index){
            if(kindSVGCustomObj !== null){
                if(sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount"){
                    vaPassing.activeShape(index);
                }else{
                    vaEnteringAppearing.activeShape(index);
                }
            }
        },
        changeMinSizeOption: changeMinSizeOption,
        changeMaxSizeOption: changeMaxSizeOption,
        changeRectangleToSize: changeRectangleToSize,
        alignCenter: function(){
            if(svgObjs.length > 0){
                vaEnteringAppearing.alignCenter();
            }
        },
        removeDrawingGeometry: function(){
            if(kindSVGCustomObj !== null){
                kindSVGCustomObj.removeDrawingGeometry();
            }
        },
        changeArrow: function(index, arrow){
            if(kindSVGCustomObj !== null){
                if(sketchInfo.workType === "vaPassing" || sketchInfo.workType === "peoplecount"){
                    vaPassing.changeArrow(index, arrow);
                }
            }
        },
        stopEvent: function(){
            if(kindSVGEditor !== null){
                for(var i = 0, ii = svgObjs.length; i < ii; i++){
                    svgObjs[i].stopEvent();
                }
            }
        },
        startEvent: function(){
            if(kindSVGEditor !== null){
                for(var i = 0, ii = svgObjs.length; i < ii; i++){
                    svgObjs[i].startEvent();
                }
            }
        },
        hideGeometry: function(index){
            if(kindSVGEditor !== null){
                svgObjs[index].hide();
            }
        },
        showGeometry: function(index){
            if(kindSVGEditor !== null){
                svgObjs[index].show();
            }
        },
        drawMetaDataAll: function(metaData, expire){
            var expireTime = expire === undefined ? 300 : expire;
            var canvasType = 0;
            var clearTimer = function(){
                clearTimeout(drawMetaDataTimer);
                drawMetaDataTimer = null;
            };
            var clear = function(){
                clearRect(canvasType);
                clearTimer();
            };

            if(drawMetaDataTimer !== null){
                clear();
            }

            for(var i = 0, ii = metaData.length; i < ii; i++){
                this.drawMetaData.apply(null, metaData[i]);
            }

            drawMetaDataTimer = setTimeout(clear, expireTime);
        },
        drawMetaData: function(left, right, top, bottom, scale, translate, colorType, isCircle){
            var canvasType = 0;
            var colorType = colorType === undefined ? 0 : colorType;

            /*--------VA 전달받은 방식-----------------*/
            var coordinateSystemWidth  = parseInt(( 1 - translate[0]) / scale[0]);
            var coordinateSystemHeight = parseInt((-1 - translate[1]) / scale[1]);

            var ratioWidth  = videoInfo.width  / coordinateSystemWidth;
            var ratioHeight = videoInfo.height / coordinateSystemHeight;

            var x1 = left * ratioWidth;
            var y1 = top * ratioHeight;
            var x2 = right * ratioWidth;
            var y2 = bottom * ratioHeight;

            var startX = x1;
            var startY = y1;
            var width = Math.abs(x2 - startX);
            var height = Math.abs(y2 - startY);

            /*-----------------------------------*/

            /**
             * SketchManager에서 사용하는 좌표 변환 방법
             * 최대 해상도 => Preview 영상 해상도로 좌표 변경
             * VA에서 전달 받은 방식과 동일한 결과를 넘겨준다.
             * 카메라의 수정 사항이 생기면 Web도 변경이 필요할 수 있으므로
             * Meta Data의 translate와 scale 기준으로 사용한다.
             */
            // var point = convertPoint([left, right], [top, bottom], 'set');
            // var startX = point.xpos[0];
            // var startY = point.ypos[0];
            // var width = Math.abs(point.xpos[1] - startX);
            // var height = Math.abs(point.ypos[1] - startY);
            /*-----------------------------------*/

            var radius = width / 2;

            if(isCircle === true){
                drawCircle(
                    canvasType,
                    colorType,
                    startX + radius, 
                    startY + radius,
                    radius,
                    true
                );
            }else{
                drawStroke(
                    canvasType,
                    colorType,
                    startX,
                    startY,
                    width,
                    height,
                    true
                );   
            }
        }
    };
    var MdSize = (function() {
        var firstDrawClick = false;
        var isDrawDragging = false;
        var coordinates = null;
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0;
        var sizeFlag = 0; //0: minSize, 1: maxSize
        var _self = null;

        function constructor() {
            /* jshint validthis: true */
            _self = this;
            coordinates = null;
            coordinates = new Array(2);
            for (var i = 0; i < coordinates.length; i++) {
                coordinates[i] = {
                    x1: 0,
                    y1: 0,
                    width: 0,
                    height: 0
                };
            }

            drawRectangle(0, 1, 0, 0, 0, 0);
            drawRectangle(1, 0, 0, 0, 0, 0);
        }
        constructor.prototype = {
            mdSizeMousedown: function(e) {
                if (e.which !== 1) {
                    return;
                }
                var coord = getCoordinate(e, this);
                rectPos.startX = coord[0];
                rectPos.startY = coord[1];
                firstDrawClick = true;
                isDrawDragging = false;
            },
            mdSizeMousemove: function(e) {
                var coord = getCoordinate(e, frontCanvas);
                var xVal = coord[0];
                var yVal = coord[1];
                var colorType = sizeFlag === 0 ? 1 : 0;

                if (firstDrawClick) {
                    rectPos.w = xVal - rectPos.startX;
                    rectPos.h = yVal - rectPos.startY;
                    rectPos.endX = xVal;
                    rectPos.endY = yVal;
                    clearRect(0);
                    if ((rectPos.startX + rectPos.w) > videoInfo.width) {
                        rectPos.w = frontCanvas.width - rectPos.startX;
                    } else if ((rectPos.startX + rectPos.w) < 0) {
                        rectPos.w = (-1) * rectPos.startX;
                    }
                    if ((rectPos.startY + rectPos.h) > videoInfo.height) {
                        rectPos.h = videoInfo.height - rectPos.startY;
                    } else if ((rectPos.startY + rectPos.h) < 0) {
                        rectPos.h = (-1) * rectPos.startY;
                    }
                    
                    drawStroke(0, colorType, rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                }
                isDrawDragging = true;
            },
            mdSizeMouseup: function(e) {
                if (!firstDrawClick) {
                    return;
                }
                firstDrawClick = false;
                if (isDrawDragging) {
                    if (rectPos.startX <= rectPos.endX) {
                        x1 = rectPos.startX;
                        x2 = rectPos.endX;
                    } else {
                        x2 = rectPos.startX;
                        x1 = rectPos.endX;
                    }
                    if (rectPos.startY <= rectPos.endY) {
                        y1 = rectPos.startY;
                        y2 = rectPos.endY;
                    } else {
                        y2 = rectPos.startY;
                        y1 = rectPos.endY;
                    }
                    if (x1 < 0) {
                        x1 = 0;
                    }
                    if (x2 > videoInfo.width) {
                        x2 = videoInfo.width;
                    }
                    if (y1 < 0) {
                        y1 = 0;
                    }
                    if (y2 > videoInfo.height) {
                        y2 = videoInfo.height;
                    }
                    rectPos.w = Math.abs(rectPos.w);
                    rectPos.h = Math.abs(rectPos.h);
                    var actualWidth = parseInt(rectPos.w * (videoInfo.maxWidth / videoInfo.width), 10);
                    var actualHeight = parseInt(rectPos.h * (videoInfo.maxHeight / videoInfo.height), 10);
                    if (actualWidth > sketchInfo.minAreaSize && actualHeight > sketchInfo.minAreaSize) {
                        if (sizeFlag === 0) {
                            if (rectPos.w > coordinates[1].width || rectPos.h > coordinates[1].height) {} else {
                                coordinates[0].x1 = x1;
                                coordinates[0].y1 = y1;
                                coordinates[0].width = rectPos.w;
                                coordinates[0].height = rectPos.h;
                            }
                        } else {
                            if (rectPos.w < coordinates[0].width || rectPos.h < coordinates[0].height) {} else {
                                coordinates[1].x1 = x1;
                                coordinates[1].y1 = y1;
                                coordinates[1].width = rectPos.w;
                                coordinates[1].height = rectPos.h;
                            }
                        }
                        _self.updateCanvas(false);
                    } else {
                        _self.updateCanvas(true);
                    }
                    isDrawDragging = false;
                }
            },
            updateCanvas: function(isInit) {
                clearRect(0);
                clearRect(1);
                if (sizeFlag === 0) {
                    drawRectangle(0, 1, coordinates[0].x1, coordinates[0].y1, coordinates[0].width, coordinates[0].height);
                    drawRectangle(1, 0, coordinates[1].x1, coordinates[1].y1, coordinates[1].width, coordinates[1].height);
                } else {
                    drawRectangle(0, 0, coordinates[1].x1, coordinates[1].y1, coordinates[1].width, coordinates[1].height);
                    drawRectangle(1, 1, coordinates[0].x1, coordinates[0].y1, coordinates[0].width, coordinates[0].height);
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            changeMdsizeFlag: function(data) {
                sizeFlag = data;
                this.updateCanvas(true);
            },
            set: function(data, flag) {
                sizeFlag = flag;
                for (var i = 0; i < coordinates.length; i++) {
                    coordinates[i].x1 = parseInt(data[i].x1 / (videoInfo.maxWidth / videoInfo.width), 10);
                    coordinates[i].y1 = parseInt(data[i].y1 / (videoInfo.maxHeight / videoInfo.height), 10);
                    coordinates[i].width = parseInt(data[i].width / (videoInfo.maxWidth / videoInfo.width), 10);
                    coordinates[i].height = parseInt(data[i].height / (videoInfo.maxHeight / videoInfo.height), 10);
                }
                this.updateCanvas(true);
            },
            get: function() {
                var returnArray = new Array(2);
                for (var i = 0; i < coordinates.length; i++) {
                    returnArray[i] = {
                        x1: 0,
                        y1: 0,
                        width: 0,
                        height: 0
                    };
                    returnArray[i].x1 = parseInt(coordinates[i].x1 * (videoInfo.maxWidth / videoInfo.width), 10);
                    returnArray[i].y1 = parseInt(coordinates[i].y1 * (videoInfo.maxHeight / videoInfo.height), 10);
                    returnArray[i].width = parseInt(coordinates[i].width * (videoInfo.maxWidth / videoInfo.width), 10);
                    returnArray[i].height = parseInt(coordinates[i].height * (videoInfo.maxHeight / videoInfo.height), 10);
                }
                return returnArray;
            }
        };
        return constructor;
    })();

    var MdArea = (function() {
        var firstDrawClick = false;
        var isDrawDragging = false;
        var Ax = 0,
            Ay = 0;
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            x3 = 0,
            y3 = 0,
            x4 = 0,
            y4 = 0;
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var index = 1;
        var coordinates = null;
        var detectFlag = 0; //0: detection, 1: non-detection
        var _self = null;

        function constructor() {
            /* jshint validthis: true */
            _self = this;
            index = 1;
            isDrawDragging = false;
            firstDrawClick = false;
            coordinates = null;
            coordinates = new Array(sketchInfo.maxNumber);
            for (var i = 0; i < coordinates.length; i++) {
                coordinates[i] = {
                    isSet: false,
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 0
                };
            }
            fContext.lineWidth = 2;
            fContext.globalAlpha = "1";
            bContext.lineWidth = 2;
        }
        constructor.prototype = {
            mousedownRectangle: function(e) {
                if (e.which !== 1) {
                    return;
                }
                if (sketchInfo.workType === "simpleFocus") {
                    coordinates[0] = {
                        isSet: false,
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                }
                if (!_self.checkDrawAvailable()) {
                    return;
                }
                var coord = getCoordinate(e, this);
                rectPos.startX = coord[0];
                rectPos.startY = coord[1];
                firstDrawClick = true;
                isDrawDragging = false;
            },
            mousemoveRectangle: function(e) {
                var coord = getCoordinate(e, frontCanvas);
                var xVal = coord[0];
                var yVal = coord[1];

                if (firstDrawClick) {
                    rectPos.w = xVal - rectPos.startX;
                    rectPos.h = yVal - rectPos.startY;
                    rectPos.endX = xVal;
                    rectPos.endY = yVal;
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    if (sketchInfo.workType === "simpleFocus") {
                        bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    }
                    if ((rectPos.startX + rectPos.w) > videoInfo.width) {
                        rectPos.w = frontCanvas.width - rectPos.startX;
                    } else if ((rectPos.startX + rectPos.w) < 0) {
                        rectPos.w = (-1) * rectPos.startX;
                    }
                    if ((rectPos.startY + rectPos.h) > videoInfo.height) {
                        rectPos.h = videoInfo.height - rectPos.startY;
                    } else if ((rectPos.startY + rectPos.h) < 0) {
                        rectPos.h = (-1) * rectPos.startY;
                    }
                    if (detectFlag === 0) fContext.strokeStyle = colorFactory.red;
                    else fContext.strokeStyle = colorFactory.blue;
                    fContext.strokeRect(rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                }
                isDrawDragging = true;
            },
            mouseupRectangle: function(e) {
                if (!firstDrawClick) {
                    return;
                }
                firstDrawClick = false;
                if (isDrawDragging) {
                    if (rectPos.startX <= rectPos.endX) {
                        x1 = rectPos.startX;
                        x2 = rectPos.endX;
                    } else {
                        x2 = rectPos.startX;
                        x1 = rectPos.endX;
                    }
                    if (rectPos.startY <= rectPos.endY) {
                        y1 = rectPos.startY;
                        y2 = rectPos.endY;
                    } else {
                        y2 = rectPos.startY;
                        y1 = rectPos.endY;
                    }
                    if (x1 < 0) {
                        x1 = 0;
                    }
                    if (x2 > videoInfo.width) {
                        x2 = videoInfo.width;
                    }
                    if (y1 < 0) {
                        y1 = 0;
                    }
                    if (y2 > videoInfo.height) {
                        y2 = videoInfo.height;
                    }
                    var isDuplicateArea = false;
                    if (sketchInfo.workType === "smartCodec") {
                        for (var i = 0; i < coordinates.length; i++) {
                            if (coordinates[i].isSet) {
                                if (x1 <= coordinates[i].x2 && coordinates[i].x1 <= x2 && y1 <= coordinates[i].y2 && coordinates[i].y1 <= y2) {
                                    isDuplicateArea = true;
                                }
                            }
                        }
                    }
                    if ((x1 === x2 || y1 === y2) || isDuplicateArea) {} else {
                        for (var i = 0; i < coordinates.length; i++) {
                            if (!coordinates[i].isSet) {
                                coordinates[i].isSet = true;
                                coordinates[i].x1 = x1;
                                coordinates[i].y1 = y1;
                                coordinates[i].x2 = x2;
                                coordinates[i].y2 = y2;
                                break;
                            }
                        }
                    }
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    _self.updateRectangle(false);
                    isDrawDragging = false;
                }
            },
            contextmenuRectangle: function(e) {
                if (sketchInfo.workType === "smartCodec") {
                    e.preventDefault();
                    return false;
                } else if (sketchInfo.workType === "simpleFocus") {
                    coordinates[0].isSet = false;
                    coordinates[0].x1 = 0;
                    coordinates[0].y1 = 0;
                    coordinates[0].x2 = 0;
                    coordinates[0].y2 = 0;
                    _self.updateRectangle(false);
                    e.preventDefault();
                    return false;
                }
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];

                for (var i = 0; i < coordinates.length; i++) {
                    if (coordinates[i].isSet) {
                        if (coordinates[i].x1 <= xVal && xVal <= coordinates[i].x2 && coordinates[i].y1 <= yVal && yVal <= coordinates[i].y2) {
                            _self.openDialog(i);
                            e.preventDefault();
                            return false;
                        }
                    }
                }
                e.preventDefault();
                return false;
            },
            updateRectangle: function(isInit) {
                bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                for (var i = 0; i < coordinates.length; i++) {
                    if (coordinates[i].isSet) {
                        if (detectFlag === 0) {
                            bContext.strokeStyle = colorFactory.red;
                            bContext.fillStyle = colorFactory.red;
                        } else {
                            bContext.strokeStyle = colorFactory.blue;
                            bContext.fillStyle = colorFactory.blue;
                        }
                        bContext.globalAlpha = alphaFactory.enabled.stroke;
                        bContext.strokeRect(coordinates[i].x1, coordinates[i].y1, coordinates[i].x2 - coordinates[i].x1, coordinates[i].y2 - coordinates[i].y1);
                        bContext.globalAlpha = alphaFactory.enabled.fill;
                        bContext.fillRect(coordinates[i].x1, coordinates[i].y1, coordinates[i].x2 - coordinates[i].x1, coordinates[i].y2 - coordinates[i].y1);
                        bContext.globalAlpha = alphaFactory.enabled.stroke;
                    }
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            mouseclickPolygon: function(e) {
                if (!_self.checkDrawAvailable()) return;
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];
                var color = detectFlag === 0 ? colorFactory.red : colorFactory.blue;

                if (lineDistance(Ax, Ay, xVal, yVal) < 20) {
                    return;
                }
                
                bContext.strokeStyle = color;
                //$(".DisableAreaList" ).css("display","block");
                if (index === 1) {
                    //bContext.clearRect(0,0,videoInfo.width,videoInfo.height);
                    isDrawDragging = true;
                    x1 = xVal;
                    y1 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    index++;
                    // red
                } else if (index === 2) {
                    x2 = xVal;
                    y2 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    bContext.beginPath();
                    bContext.moveTo(x1, y1);
                    bContext.lineTo(x2, y2);
                    bContext.stroke();
                    bContext.closePath();
                    index++;
                } else if (index === 3) {
                    x3 = xVal;
                    y3 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    bContext.beginPath();
                    bContext.moveTo(x2, y2);
                    bContext.lineTo(x3, y3);
                    bContext.stroke();
                    bContext.closePath();
                    index++;
                } else if (index === 4) {
                    x4 = xVal;
                    y4 = yVal;
                    var a = {
                            x: x1,
                            y: y1
                        },
                        c = {
                            x: x3,
                            y: y3
                        },
                        b = {
                            x: x2,
                            y: y2
                        };
                    var d = {
                        x: x4,
                        y: y4
                    };
                    var totAngle = Math.floor(getAngleABC (a, b, c)) + Math.floor(getAngleABC (b, c, d)) + Math.floor(getAngleABC (c, d, a)) + Math.floor(getAngleABC (d, a, b));
                    if (Math.abs(totAngle) <= 1 || Math.abs(getAngleABC (d, a, b)) > 170) {
                        return;
                    } else if (distToSegment(a, d, c) < 20) {
                        return;
                    } else {
                        Ax = xVal;
                        Ay = yVal;
                    }
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    var polygonPoints = [
                        [x1, y1],
                        [x2, y2],
                        [x3, y3],
                        [x4, y4]
                    ];
                    bContext.moveTo(x3, y3);
                    bContext.lineTo(x4, y4);
                    bContext.stroke();
                    bContext.moveTo(x4, y4);
                    bContext.lineTo(x1, y1);
                    bContext.stroke();
                    bContext.closePath();
                    bContext.fillPolygon(polygonPoints, color, color);
                    isDrawDragging = false;
                    for (var i = 0; i < coordinates.length; i++) {
                        if (!coordinates[i].isSet) {
                            coordinates[i].isSet = true;
                            coordinates[i].x1 = x1;
                            coordinates[i].y1 = y1;
                            coordinates[i].x2 = x2;
                            coordinates[i].y2 = y2;
                            coordinates[i].x3 = x3;
                            coordinates[i].y3 = y3;
                            coordinates[i].x4 = x4;
                            coordinates[i].y4 = y4;
                            _self.updatePolygon();
                            break;
                        }
                    }
                    index = 1;
                    return;
                }
            },
            mousemovePolygon: function(e) {
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];

                if (isDrawDragging) {
                    fContext.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
                    if (detectFlag === 0) fContext.strokeStyle = colorFactory.red;
                    else fContext.strokeStyle = colorFactory.blue;
                    fContext.beginPath();
                    fContext.moveTo(Ax, Ay);
                    fContext.lineTo(xVal, yVal);
                    fContext.stroke();
                    fContext.closePath();
                }
            },
            contexmenuPolygon: function(e) {
                if (isDrawDragging) {
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    _self.updatePolygon();
                    isDrawDragging = false;
                    index = 1;
                } else {
                    var coord = getCoordinate(e, this);
                    var xVal = coord[0];
                    var yVal = coord[1];

                    for (var i = 0; i < coordinates.length; i++) {
                        if (coordinates[i].isSet) {
                            var x1 = parseInt(coordinates[i].x1);
                            var y1 = parseInt(coordinates[i].y1);
                            var x2 = parseInt(coordinates[i].x2);
                            var y2 = parseInt(coordinates[i].y2);
                            var x3 = parseInt(coordinates[i].x3);
                            var y3 = parseInt(coordinates[i].y3);
                            var x4 = parseInt(coordinates[i].x4);
                            var y4 = parseInt(coordinates[i].y4);
                            var polygonPoints = [{
                                x: x1,
                                y: y1
                            }, {
                                x: x2,
                                y: y2
                            }, {
                                x: x3,
                                y: y3
                            }, {
                                x: x4,
                                y: y4
                            }, {
                                x: x1,
                                y: y1
                            }];
                            if (isPointInPoly(polygonPoints, {
                                    x: xVal,
                                    y: yVal
                                })) {
                                _self.openDialog(i);
                                e.preventDefault();
                                return false;
                            }
                        }
                    }
                }
                e.preventDefault();
                return false;
            },
            updatePolygon: function(isInit) {
                bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                for (var i = 0; i < coordinates.length; i++) {
                    if (coordinates[i].isSet) {
                        var x1 = parseInt(coordinates[i].x1);
                        var y1 = parseInt(coordinates[i].y1);
                        var x2 = parseInt(coordinates[i].x2);
                        var y2 = parseInt(coordinates[i].y2);
                        var x3 = parseInt(coordinates[i].x3);
                        var y3 = parseInt(coordinates[i].y3);
                        var x4 = parseInt(coordinates[i].x4);
                        var y4 = parseInt(coordinates[i].y4);
                        var polygonPoints = [
                            [x1, y1],
                            [x2, y2],
                            [x3, y3],
                            [x4, y4]
                        ];
                        var color = detectFlag === 0 ? colorFactory.red : colorFactory.blue;

                        bContext.globalAlpha = alphaFactory.enabled.stroke;
                        bContext.strokeStyle = color;
                        bContext.beginPath();
                        bContext.moveTo(x1, y1);
                        bContext.lineTo(x2, y2);
                        bContext.stroke();
                        bContext.moveTo(x2, y2);
                        bContext.lineTo(x3, y3);
                        bContext.stroke();
                        bContext.moveTo(x3, y3);
                        bContext.lineTo(x4, y4);
                        bContext.stroke();
                        bContext.moveTo(x4, y4);
                        bContext.lineTo(x1, y1);
                        bContext.stroke();
                        bContext.closePath();
                        bContext.globalAlpha = alphaFactory.enabled.fill;
                        bContext.fillPolygon(polygonPoints, color, color);
                        bContext.globalAlpha = alphaFactory.enabled.stroke;
                    }
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            changeMdDetectFlag: function(data) {
                detectFlag = data;
                if (sketchInfo.shape === 0) {
                    _self.updateRectangle(false);
                } else {
                    _self.updatePolygon(false);
                }
            },
            set: function(data, flag) {
                detectFlag = flag;
                for (var i = 0; i < coordinates.length; i++) {
                    if (data[i] !== undefined) {
                        coordinates[i].isSet = data[i].isSet;
                        var xpos = [0, 0, 0, 0];
                        var ypos = [0, 0, 0, 0];
                        if (sketchInfo.shape === 0) { //rectangle
                            xpos = [data[i].x1, data[i].x2];
                            ypos = [data[i].y1, data[i].y2];
                        } else {
                            xpos = [data[i].x1, data[i].x2, data[i].x3, data[i].x4];
                            ypos = [data[i].y1, data[i].y2, data[i].y3, data[i].y4];
                        }
                        var point = convertPoint(xpos, ypos, 'set');
                        coordinates[i].x1 = point.xpos[0];
                        coordinates[i].y1 = point.ypos[0];
                        coordinates[i].x2 = point.xpos[1];
                        coordinates[i].y2 = point.ypos[1];
                        if (sketchInfo.shape === 1) {
                            coordinates[i].x3 = point.xpos[2];
                            coordinates[i].y3 = point.ypos[2];
                            coordinates[i].x4 = point.xpos[3];
                            coordinates[i].y4 = point.ypos[3];
                        }
                    }
                }
                if (sketchInfo.shape === 0) {
                    _self.updateRectangle(true);
                } else {
                    _self.updatePolygon(true);
                }
            },
            get: function() {
                var returnArray = new Array(sketchInfo.maxNumber);
                for (var i = 0; i < coordinates.length; i++) {
                    var xpos = [0, 0, 0, 0];
                    var ypos = [0, 0, 0, 0];
                    if (sketchInfo.shape === 0) {
                        returnArray[i] = {
                            isSet: false,
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0
                        };
                        xpos = [coordinates[i].x1, coordinates[i].x2];
                        ypos = [coordinates[i].y1, coordinates[i].y2];
                    } else {
                        returnArray[i] = {
                            isSet: false,
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0,
                            x3: 0,
                            y3: 0,
                            x4: 0,
                            y4: 0
                        };
                        xpos = [coordinates[i].x1, coordinates[i].x2, coordinates[i].x3, coordinates[i].x4];
                        ypos = [coordinates[i].y1, coordinates[i].y2, coordinates[i].y3, coordinates[i].y4];
                    }
                    var point = convertPoint(xpos, ypos, 'get');
                    if (coordinates[i].isSet) {
                        returnArray[i].isSet = true;
                        returnArray[i].x1 = point.xpos[0];
                        returnArray[i].y1 = point.ypos[0];
                        returnArray[i].x2 = point.xpos[1];
                        returnArray[i].y2 = point.ypos[1];
                        if (sketchInfo.shape === 1) {
                            returnArray[i].x3 = point.xpos[2];
                            returnArray[i].y3 = point.ypos[2];
                            returnArray[i].x4 = point.xpos[3];
                            returnArray[i].y4 = point.ypos[3];
                        }
                    } else {
                        returnArray[i].isSet = false;
                        returnArray[i].x1 = 0;
                        returnArray[i].y1 = 0;
                        returnArray[i].x2 = 0;
                        returnArray[i].y2 = 0;
                        if (sketchInfo.shape === 1) {
                            returnArray[i].x3 = 0;
                            returnArray[i].y3 = 0;
                            returnArray[i].x4 = 0;
                            returnArray[i].y4 = 0;
                        }
                    }
                }
                return returnArray;
            },
            checkDrawAvailable: function() {
                var capa = false;
                for (var i = 0; i < coordinates.length; i++) {
                    if (!coordinates[i].isSet) {
                        capa = true;
                    }
                }
                return capa;
            },
            openDialog: function(index) {
                var modalInstance = dialog.open({
                    templateUrl: sketchInfo.modalId,
                    controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                        $scope.delete = function() {
                            if (sketchInfo.shape === 0) {
                                coordinates[index].isSet = false;
                                coordinates[index].x1 = 0;
                                coordinates[index].y1 = 0;
                                coordinates[index].x2 = 0;
                                coordinates[index].y2 = 0;
                                _self.updateRectangle(false);
                            } else {
                                coordinates[index].isSet = false;
                                coordinates[index].x1 = 0;
                                coordinates[index].y1 = 0;
                                coordinates[index].x2 = 0;
                                coordinates[index].y2 = 0;
                                coordinates[index].x3 = 0;
                                coordinates[index].y3 = 0;
                                coordinates[index].x4 = 0;
                                coordinates[index].y4 = 0;
                                _self.updatePolygon();
                            }
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function() {
                            $uibModalInstance.close();
                        };
                    }]
                });
                modalInstance.result.then(function() {}, function() {});
            }
        };
        return constructor;
    })();

    var Privacy = (function() {
        var firstDrawClick = false;
        var isDrawDragging = false;
        var Ax = 0,
            Ay = 0;
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            x3 = 0,
            y3 = 0,
            x4 = 0,
            y4 = 0;
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var index = 1;
        var coordinates = null;
        var _self = null;
        var selectedCoordinates = null;
        var PRIVACY_LINE_WIDTH = 3;

        function constructor() {
            /* jshint validthis: true */
            _self = this;
            index = 1;
            isDrawDragging = false;
            firstDrawClick = false;
            coordinates = {};
            coordinates = {
                name: "",
                color: "",
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            };
            fContext.lineWidth = PRIVACY_LINE_WIDTH;
            fContext.globalAlpha = "1";
            fContext.strokeStyle = colorFactory.blue;
            fContext.fillStyle = colorFactory.blue;
            bContext.lineWidth = PRIVACY_LINE_WIDTH;
            bContext.strokeStyle = colorFactory.blue;
            bContext.fillStyle = colorFactory.blue;
        }
        constructor.prototype = {
            mousedownRectangle: function(e) {
                var popup = $("[id^='privacy-popup-']").length;
                if (popup) {
                    return;
                }
                if (e.which !== 1) {
                    return;
                }
                if (!_self.checkDrawAvailable()) {
                    return;
                }
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];

                rectPos.startX = xVal;
                rectPos.startY = yVal;
                firstDrawClick = true;
                isDrawDragging = false;
            },
            mousemoveRectangle: function(e) {
                var coord = getCoordinate(e, frontCanvas);
                var xVal = coord[0];
                var yVal = coord[1];

                if (firstDrawClick) {
                    bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    rectPos.w = xVal - rectPos.startX;
                    rectPos.h = yVal - rectPos.startY;
                    rectPos.endX = xVal;
                    rectPos.endY = yVal;
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    if ((rectPos.startX + rectPos.w) > videoInfo.width) {
                        rectPos.w = frontCanvas.width - rectPos.startX;
                    } else if ((rectPos.startX + rectPos.w) < 0) {
                        rectPos.w = (-1) * rectPos.startX;
                    }
                    if ((rectPos.startY + rectPos.h) > videoInfo.height) {
                        rectPos.h = videoInfo.height - rectPos.startY;
                    } else if ((rectPos.startY + rectPos.h) < 0) {
                        rectPos.h = (-1) * rectPos.startY;
                    }

                    fContext.globalAlpha = alphaFactory.enabled.fill;
                    fContext.fillRect(rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                    fContext.globalAlpha = alphaFactory.enabled.stroke;

                    fContext.strokeRect(rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                }
                isDrawDragging = true;
            },
            mouseupRectangle: function(e) {
                if (!firstDrawClick) {
                    return;
                }
                firstDrawClick = false;
                if (isDrawDragging) {
                    if (rectPos.startX <= rectPos.endX) {
                        x1 = rectPos.startX;
                        x2 = rectPos.endX;
                    } else {
                        x2 = rectPos.startX;
                        x1 = rectPos.endX;
                    }
                    if (rectPos.startY <= rectPos.endY) {
                        y1 = rectPos.startY;
                        y2 = rectPos.endY;
                    } else {
                        y2 = rectPos.startY;
                        y1 = rectPos.endY;
                    }
                    if ((x1 !== x2) && (y1 !== y2)) {
                        coordinates.x1 = x1;
                        coordinates.y1 = y1;
                        coordinates.x2 = x2;
                        coordinates.y2 = y2;
                        _self.updateRectangle(false);
                        _self.openDialog(0, "create");
                    } else {
                        if (selectedCoordinates !== null) {
                            // to draw selected area
                            _self.drawArea(selectedCoordinates);
                        }
                    }
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    isDrawDragging = false;
                }
            },
            contextmenuRectangle: function(e) {
                //mouse right click
                e.preventDefault();
                return false;
            },
            updateRectangle: function(isInit) {
                clearRect(1);
                bContext.globalAlpha = alphaFactory.enabled.stroke;
                bContext.strokeStyle = colorFactory.darkBlue;
                bContext.strokeRect(coordinates.x1, coordinates.y1, coordinates.x2 - coordinates.x1, coordinates.y2 - coordinates.y1);
                if (!isInit) {
                    bContext.globalAlpha = alphaFactory.enabled.fill;
                    bContext.fillRect(coordinates.x1, coordinates.y1, coordinates.x2 - coordinates.x1, coordinates.y2 - coordinates.y1);
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if(!isInit && sketchInfo.disValue !== undefined && !sketchInfo.disValue){
                    	updateCoordinates();
                    }
                    /////////////////////
                    sketchInfo.getZoomValue().then(function(returnZoomValue) {
                        if (!isInit && sketchInfo.disValue !== undefined && !sketchInfo.disValue && returnZoomValue <= 20) {
                            updateCoordinates();
                        }
                    });
                }
            },
            mouseclickPolygon: function(e) {
                if (!_self.checkDrawAvailable()) {
                    return;
                }
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];

                if (lineDistance(Ax, Ay, xVal, yVal) < 20) {
                    return;
                }
                bContext.strokeStyle = colorFactory.blue;
                if (index === 1) {
                    clearRect(1);
                    isDrawDragging = true;
                    x1 = xVal;
                    y1 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    index++;
                } else if (index === 2) {
                    x2 = xVal;
                    y2 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    bContext.beginPath();
                    bContext.moveTo(x1, y1);
                    bContext.lineTo(x2, y2);
                    bContext.stroke();
                    bContext.closePath();
                    index++;
                } else if (index === 3) {
                    x3 = xVal;
                    y3 = yVal;
                    Ax = xVal;
                    Ay = yVal; // getting mouse move action
                    bContext.beginPath();
                    bContext.moveTo(x2, y2);
                    bContext.lineTo(x3, y3);
                    bContext.stroke();
                    bContext.closePath();
                    index++;
                } else if (index === 4) {
                    x4 = xVal;
                    y4 = yVal;
                    var a = {
                            x: x1,
                            y: y1
                        },
                        c = {
                            x: x3,
                            y: y3
                        },
                        b = {
                            x: x2,
                            y: y2
                        };
                    var d = {
                        x: x4,
                        y: y4
                    };
                    var totAngle = Math.floor(getAngleABC (a, b, c)) + Math.floor(getAngleABC (b, c, d)) + Math.floor(getAngleABC (c, d, a)) + Math.floor(getAngleABC (d, a, b));
                    if (Math.abs(totAngle) <= 1 || Math.abs(getAngleABC (d, a, b)) > 170) {
                        return;
                    } else if (distToSegment(a, d, c) < 20) {
                        return;
                    } else {
                        Ax = xVal;
                        Ay = yVal;
                    }
                    clearRect(0);
                    var polygonPoints = [
                        [x1, y1],
                        [x2, y2],
                        [x3, y3],
                        [x4, y4]
                    ];
                    bContext.moveTo(x3, y3);
                    bContext.lineTo(x4, y4);
                    bContext.stroke();
                    bContext.moveTo(x4, y4);
                    bContext.lineTo(x1, y1);
                    bContext.stroke();
                    bContext.closePath();
                    bContext.fillPolygon(polygonPoints, colorFactory.blue, colorFactory.blue);
                    isDrawDragging = false;
                    coordinates.x1 = x1;
                    coordinates.y1 = y1;
                    coordinates.x2 = x2;
                    coordinates.y2 = y2;
                    coordinates.x3 = x3;
                    coordinates.y3 = y3;
                    coordinates.x4 = x4;
                    coordinates.y4 = y4;
                    _self.updatePolygon();
                    _self.openDialog(0, "create");
                    index = 1;
                    return;
                }
            },
            mousemovePolygon: function(e) {
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];
                var drawLine = function(startX, startY, endX, endY){
                    fContext.beginPath();
                    fContext.moveTo(startX, startY);
                    fContext.lineTo(endX, endY);
                    fContext.stroke();
                    fContext.closePath();
                };
                var polygonPoints = [];

                if (isDrawDragging) {
                    clearRect(0);
                    if(index > 2){
                        polygonPoints = [
                            [x1, y1],
                            [x2, y2]
                        ];

                        if(index === 4){
                            polygonPoints.push([x3, y3]);
                        }

                        polygonPoints.push([xVal, yVal]);

                        fContext.fillPolygon(polygonPoints, colorFactory.blue, colorFactory.blue);
                    }

                    fContext.globalAlpha = alphaFactory.enabled.stroke;

                    drawLine(Ax, Ay, xVal, yVal);
                    if(index > 2){
                        drawLine(x1, y1, xVal, yVal);
                    }
                }
            },
            contexmenuPolygon: function(e) {
                if (isDrawDragging) {
                    clearRect(0);
                    clearRect(1);
                    //_self.updatePolygon();
                    isDrawDragging = false;
                    index = 1;
                } else {
                    var coord = getCoordinate(e, this);
                    var xVal = coord[0];
                    var yVal = coord[1];
                    var x1 = parseInt(coordinates.x1);
                    var y1 = parseInt(coordinates.y1);
                    var x2 = parseInt(coordinates.x2);
                    var y2 = parseInt(coordinates.y2);
                    var x3 = parseInt(coordinates.x3);
                    var y3 = parseInt(coordinates.y3);
                    var x4 = parseInt(coordinates.x4);
                    var y4 = parseInt(coordinates.y4);
                    var polygonPoints = [{
                        x: x1,
                        y: y1
                    }, {
                        x: x2,
                        y: y2
                    }, {
                        x: x3,
                        y: y3
                    }, {
                        x: x4,
                        y: y4
                    }, {
                        x: x1,
                        y: y1
                    }];
                    if (isPointInPoly(polygonPoints, {
                            x: xVal,
                            y: yVal
                        })) {
                        /*coordinates.x1 = 0;
                        coordinates.y1 = 0;
                        coordinates.x2 = 0;
                        coordinates.y2 = 0;

                        coordinates.x3 = 0;
                        coordinates.y3 = 0;
                        coordinates.x4 = 0;
                        coordinates.y4 = 0;
                        _self.updatePolygon();*/
                        e.preventDefault();
                        return false;
                    }
                }
                e.preventDefault();
                if (selectedCoordinates !== null) {
                    // to draw selected area
                    _self.drawArea(selectedCoordinates);
                }
                return false;
            },
            updatePolygon: function(isInit) {
                clearRect(1);
                var x1 = parseInt(coordinates.x1);
                var y1 = parseInt(coordinates.y1);
                var x2 = parseInt(coordinates.x2);
                var y2 = parseInt(coordinates.y2);
                var x3 = parseInt(coordinates.x3);
                var y3 = parseInt(coordinates.y3);
                var x4 = parseInt(coordinates.x4);
                var y4 = parseInt(coordinates.y4);
                var polygonPoints = [
                    [x1, y1],
                    [x2, y2],
                    [x3, y3],
                    [x4, y4]
                ];
                bContext.strokeStyle = colorFactory.darkBlue;
                bContext.globalAlpha = alphaFactory.enabled.stroke;
                bContext.beginPath();
                bContext.moveTo(x1, y1);
                bContext.lineTo(x2, y2);
                bContext.stroke();
                bContext.moveTo(x2, y2);
                bContext.lineTo(x3, y3);
                bContext.stroke();
                bContext.moveTo(x3, y3);
                bContext.lineTo(x4, y4);
                bContext.stroke();
                bContext.moveTo(x4, y4);
                bContext.lineTo(x1, y1);
                bContext.stroke();
                bContext.closePath();
                if (!isInit) {
                    bContext.globalAlpha = alphaFactory.enabled.fill;
                    bContext.fillPolygon(polygonPoints, colorFactory.blue, colorFactory.blue);
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            drawArea: function(data) {
                var xpos = [0, 0, 0, 0];
                var ypos = [0, 0, 0, 0];
                if (sketchInfo.shape === 0) { //rectangle
                    xpos = [data.x1, data.x2];
                    ypos = [data.y1, data.y2];
                } else {
                    xpos = [data.x1, data.x2, data.x3, data.x4];
                    ypos = [data.y1, data.y2, data.y3, data.y4];
                }
                var point = convertPoint(xpos, ypos, 'set');
                coordinates.x1 = point.xpos[0];
                coordinates.y1 = point.ypos[0];
                coordinates.x2 = point.xpos[1];
                coordinates.y2 = point.ypos[1];
                if (sketchInfo.shape === 1) { //polygon
                    coordinates.x3 = point.xpos[2];
                    coordinates.y3 = point.ypos[2];
                    coordinates.x4 = point.xpos[3];
                    coordinates.y4 = point.ypos[3];
                }
                if (sketchInfo.shape === 0) {
                    _self.updateRectangle(true);
                } else {
                    _self.updatePolygon(true);
                }
            },
            set: function(data) {
                if (typeof data !== "undefined" || data !== null) {
                    _self.drawArea(data);
                    if (data.selectedMask === true) {
                        selectedCoordinates = {
                            'x1': data.x1,
                            'x2': data.x2,
                            'x3': data.x3,
                            'x4': data.x4,
                            'y1': data.y1,
                            'y2': data.y2,
                            'y3': data.y3,
                            'y4': data.y4
                        };
                    }
                    if (selectedCoordinates !== null) {
                        // to draw selected area
                        _self.drawArea(selectedCoordinates);
                    }
                } else {
                    if (sketchInfo.shape === 0) {
                        coordinates = {
                            name: "",
                            color: "",
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0
                        };
                    } else {
                        coordinates = {
                            name: "",
                            color: "",
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0,
                            x3: 0,
                            y3: 0,
                            x4: 0,
                            y4: 0
                        };
                    }
                }
            },
            get: function() {
                var returnArray = {};
                var xpos = [0, 0, 0, 0];
                var ypos = [0, 0, 0, 0];
                if (sketchInfo.shape === 0) {
                    returnArray = {
                        name: "",
                        color: "",
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                    xpos = [coordinates.x1, coordinates.x2];
                    ypos = [coordinates.y1, coordinates.y2];
                } else {
                    returnArray = {
                        name: "",
                        color: "",
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0,
                        x3: 0,
                        y3: 0,
                        x4: 0,
                        y4: 0
                    };
                    xpos = [coordinates.x1, coordinates.x2, coordinates.x3, coordinates.x4];
                    ypos = [coordinates.y1, coordinates.y2, coordinates.y3, coordinates.y4];
                }
                var point = convertPoint(xpos, ypos, 'get');
                returnArray.x1 = point.xpos[0];
                returnArray.y1 = point.ypos[0];
                returnArray.x2 = point.xpos[1];
                returnArray.y2 = point.ypos[1];
                if (sketchInfo.shape === 1) {
                    returnArray.x3 = point.xpos[2];
                    returnArray.y3 = point.ypos[2];
                    returnArray.x4 = point.xpos[3];
                    returnArray.y4 = point.ypos[3];
                }
                return returnArray;
            },
            openDialog: function(index, type) {
                sketchInfo.getZoomValue().then(function(returnZoomValue) {      /////
                    if (videoInfo.support_ptz && (sketchInfo.disValue === true || returnZoomValue > 20)) {
                        $("[type='radio'][name='VideoOutput']").prop("disabled", true);
                        var modalInstance = dialog.open({
                            templateUrl: "privacyPopup3.html",
                            backdrop: false,
                            controller: ['$scope', '$uibModalInstance', '$timeout', 'Attributes', 'COMMONUtils', 'sketchbookService', function($scope, $uibModalInstance, $timeout, Attributes, COMMONUtils, sketchbookService) {
                                $scope.ok = function() {
                                    var coordinates = {};
                                    coordinates = {
                                        name: "",
                                        color: "",
                                        selectedMask: true,
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: 0,
                                        x3: 0,
                                        y3: 0,
                                        x4: 0,
                                        y4: 0
                                    };
                                    sketchbookService.set(coordinates);
                                    $uibModalInstance.dismiss();
                                };
                                $timeout(function() {
                                    var privacyDialog = $("#privacy-popup-3");
                                    var width = (privacyDialog.parent().width() + 30);
                                    var height = (privacyDialog.parent().height() + 30);
                                    privacyDialog.parents(".modal").draggable().css({
                                        width: (privacyDialog.width() + 30) + "px",
                                        height: (privacyDialog.height() + 30) + "px",
                                        top: "calc(50% - " + (height / 2) + "px)",
                                        left: "calc(50% - " + (width / 2) + "px)"
                                    }).find(".modal-dialog").css({
                                        margin: 0
                                    });
                                });
                            }]
                        });
                        modalInstance.result.finally(function() {
                            $("[type='radio'][name='VideoOutput']").prop("disabled", false);
                            bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                        });
                    } else {
                        $("[type='radio'][name='VideoOutput']").prop("disabled", true);
                        var modalInstance = dialog.open({
                            templateUrl: sketchInfo.modalId,
                            backdrop: false,
                            controller: ['$scope', '$uibModalInstance', '$timeout', 'Attributes', 'COMMONUtils', 'sketchbookService', function($scope, $uibModalInstance, $timeout, Attributes, COMMONUtils, sketchbookService) {
                                var mAttr = Attributes.get("image");
                                $scope.modalValue = {};
                                $scope.ColorOptions = mAttr.ColorOptions;
                                $scope.modalValue.MaskColor = $scope.ColorOptions[0];
                                $scope.PrivacyAreaMaxLen = mAttr.PrivacyMaskMaxLen.maxLength;
                                $scope.PrivacyAreaPattern = "^[a-zA-Z0-9-.]*$";
                                $scope.IsPTZ = mAttr.PTZModel;
                                $scope.OnOFF = [{
                                    lang: 'lang_on',
                                    value: true
                                }, {
                                    lang: 'lang_off',
                                    value: false
                                }];
                                $scope.modalValue.ThresholdEnable = false;
                                $scope.getTranslatedOption = function(Option) {
                                    return COMMONUtils.getTranslatedOption(Option);
                                };
                                $scope.ok = function() {
                                    var coor = privacy.get();
                                    var privacyData = {};
                                    if (sketchInfo.shape === 0) {
                                        privacyData = {
                                            'name': $(".privacy-name-input").val(),
                                            'color': $scope.modalValue.MaskColor,
                                            'position': coor.x1 + "," + coor.y1 + "," + coor.x2 + "," + coor.y2,
                                            'thresholdEnable': $scope.modalValue.ThresholdEnable
                                        };
                                    } else {
                                        privacyData = {
                                            'name': $(".privacy-name-input").val(),
                                            'color': $scope.modalValue.MaskColor,
                                            'position': coor.x1 + "," + coor.y1 + "," + coor.x2 + "," + coor.y2 + "," + coor.x3 + "," + coor.y3 + "," + coor.x4 + "," + coor.y4
                                        };
                                    }
                                    privacyUpdate(privacyData);
                                    $uibModalInstance.close();
                                };
                                $scope.cancel = function() {
                                    if (!videoInfo.support_ptz) {
                                        privacyUpdate(null);
                                    }
                                    var coordinates = {};
                                    coordinates = {
                                        name: "",
                                        color: "",
                                        selectedMask: true,
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: 0,
                                        x3: 0,
                                        y3: 0,
                                        x4: 0,
                                        y4: 0
                                    };
                                    sketchbookService.set(coordinates);
                                    $uibModalInstance.dismiss();
                                };
                                if ($scope.IsPTZ) {
                                    $timeout(function() {
                                        var privacyDialog = $("#privacy-popup-1");
                                        var width = (privacyDialog.parent().width() + 30);
                                        var height = (privacyDialog.parent().height() + 30);
                                        privacyDialog.parents(".modal").draggable().css({
                                            width: (privacyDialog.width() + 30) + "px",
                                            height: (privacyDialog.height() + 30) + "px",
                                            top: "calc(50% - " + (height / 2) + "px)",
                                            left: "calc(50% - " + (width / 2) + "px)"
                                        }).find(".modal-dialog").css({
                                            margin: 0
                                        });
                                    });
                                }
                            }]
                        });
                        modalInstance.result.finally(function() {
                            $("[type='radio'][name='VideoOutput']").prop("disabled", false);
                            bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                        });
                    }
                });
            },
            checkDrawAvailable: function() {
                var capa = false;
                if (sketchInfo.currentNumber < sketchInfo.maxNumber) {
                    capa = true;
                }
                return capa;
            }
        };
        return constructor;
    })();

    var VaEnteringAppearing = (function() {
        var isDrawDragging = false;
        var firstDrawClick = false;
        var Ax = 0,
            Ay = 0;
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            x3 = 0,
            y3 = 0,
            x4 = 0,
            y4 = 0;
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var index = 1;
        var coordinates = null;
        var _self = null;

        var preMinWidth = 0;
        var preMinHeight = 0;
        var preMaxWidth = 0;
        var preMaxHeight = 0;

        var kindSvgOptions = {};

        function constructor() {
            /* jshint validthis: true */
            var color = colorFactory.blue;
            var selectedColor = colorFactory.darkBlue;
            var convertedMinSize = [];
            var convertedMaxSize = [];

            _self = this;
            coordinates = [];

            for (var i = 0; i < sketchInfo.maxNumber; i++) {
                coordinates[i] = {
                    isSet: false,
                    points: [],
                    enExAppear: null
                };

                if(
                    sketchInfo.workType === "qmArea" ||
                    sketchInfo.workType === "mdArea" ||
                    sketchInfo.workType === "fdArea"
                    ){
                    coordinates[i].enExAppear = sketchInfo.color;
                }else if(
                    sketchInfo.workType === "vaAppearing" &&
                    sketchInfo.hasOwnProperty('mode')){
                    coordinates[i].enExAppear = sketchInfo.mode;
                }
            }

            kindSvgOptions = {
                fillColor: colorFactory.includeArea.fill,
                lineColor: colorFactory.includeArea.line,
                pointColor: colorFactory.includeArea.point,
                lineStrokeWidth: 4,
                circleRadius: 5,
                useEvent: true,
                useCursor: true,
                minPoint: 4,
                maxPoint: 8,
                fill: true,
                fillOpacity: alphaFactory.enabled.fill,
                event: {
                    end: function(obj){
                        _self.addSVGObj(obj, true);   
                    },
                    mouseup: function(data){
                        var width = 0;
                        var height = 0;

                        if(this.lineIndex !== undefined){
                            _self.notifyUpdate(this.lineIndex, data);

                            //IVA Common Area 에서만 사용
                            if(sketchInfo.workType === "commonArea"){
                                width = data.points[2][0] - data.points[0][0];
                                height = data.points[2][1] - data.points[0][1];

                                if(this.lineIndex === 0){
                                    svgObjs[1].changeMinSizeOption({
                                        width: width,
                                        height: height
                                    });
                                }else{
                                    svgObjs[0].changeMaxSizeOption({
                                        width: width,
                                        height: height
                                    });
                                }   
                            }
                        }
                    },
                }
            };

            if(sketchInfo.color === 1){
                kindSvgOptions.fillColor = colorFactory.excludeArea.fill;
                kindSvgOptions.lineColor = colorFactory.excludeArea.line;
                kindSvgOptions.pointColor = colorFactory.excludeArea.point;
            }

            /**
             * ROI 또는 Calibration의 영역을 오른쪽 마우스 클릭 시
             * 삭제 팝업이 나오면 안되므로 분기처리한다.
             * IVA/Common, Face Detection/Area, People Counting/Setup/Calibration Tab
             */
            if(
				sketchInfo.workType !== "qmArea" &&
                sketchInfo.workType !== "commonArea" && //IVA Common
                sketchInfo.workType !== "calibration" && //People Counting Calibration
                !(sketchInfo.workType === "fdArea" && sketchInfo.color === 0)//Face Detection
                ){
                //라인 또는 폴리곤을 오른쪽 마우스를 클릭할 때 삭제 팝업이 뜸.
                kindSvgOptions.event.linecontextmenu = function(event){
                    event.preventDefault();
                    _self.openDialog(this.lineIndex, "delete");   
                };
                kindSvgOptions.event.polygoncontextmenu = function(event){
                    event.preventDefault();
                    _self.openDialog(this.lineIndex, "delete");   
                };
            }

            if("useEvent" in sketchInfo){
                kindSvgOptions.useEvent = sketchInfo.useEvent;
                //만약에 이벤트를 사용하지 않으면 Cursor가 생성이 안되게 함.
                if(kindSvgOptions.useEvent === false){
                    kindSvgOptions.useCursor = false;
                }
            }

            if("aspectRatio" in sketchInfo){
                if(sketchInfo.aspectRatio === true){
                    kindSvgOptions.fixedRatio = true;
                }
            }

            if("ratio" in sketchInfo){
                if(sketchInfo.ratio.length === 2){
                    kindSvgOptions.ratio = sketchInfo.ratio;
                }
            }

            if("minSize" in sketchInfo){
                convertedMinSize = convertPoint(
                    [0, sketchInfo.minSize.width], 
                    [0, sketchInfo.minSize.height], 
                    'set'
                );

                kindSvgOptions.minSize = {
                    width: Math.ceil(convertedMinSize.xpos[1]),
                    height: Math.ceil(convertedMinSize.ypos[1])
                };
            }

            if("maxSize" in sketchInfo){
                convertedMaxSize = convertPoint(
                    [0, sketchInfo.maxSize.width], 
                    [0, sketchInfo.maxSize.height], 
                    'set'
                );
                kindSvgOptions.maxSize = {
                    width: Math.ceil(convertedMaxSize.xpos[1]),
                    height: Math.ceil(convertedMaxSize.ypos[1])
                };
            }

            if("minLineLength" in sketchInfo){
                kindSvgOptions.minLineLength = convertPoint(
                    [0,0],
                    [0,sketchInfo.minLineLength],
                    'set'
                    ).ypos[1];
            }

            if("wiseFaceDetection" in sketchInfo){
                kindSvgOptions.wiseFaceDetection = {
                    strokeWidth: 2,
                    strokeColor: colorFactory.includeArea.line,
                    fillOpacity: 0,
                    heightRatio: sketchInfo.wiseFDCircleHeightRatio //Wise Face Detection에 표현되는 원의 반지름 %
                };
                kindSvgOptions.lineStrokeWidth = 2;
            }

            if("initCenter" in sketchInfo){
                kindSvgOptions.initCenter = sketchInfo.initCenter;
            }

            if("flip" in sketchInfo){
                kindSvgOptions.flip = sketchInfo.flip;
            }

            if("mirror" in sketchInfo){
                kindSvgOptions.mirror = sketchInfo.mirror;
            }

            if(sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration"){
                // kindSvgOptions.useEvent = false;
                // kindSvgOptions.useResizeRectangle = true;
                kindSvgOptions.notUseMoveTopLayer = true;
                kindSvgOptions.useOnlyRectangle = true;
            }

            toggleSVGElement(true);
            kindSVGCustomObj = kindSVGEditor.customEditor(kindSvgOptions);
        }
        constructor.prototype = {
            updatePrevSize: function(index, width, height){
                //Max
                if(index === 0){
                    preMaxWidth = width;
                    preMaxHeight = height;
                //Min
                }else{
                    preMinWidth = width;
                    preMinHeight = height;
                }
            },
            notifyUpdate: function(index, data){
                _self.setCoordinate(index, data);

                var convertedPoints = _self.getConvertedPoints(data, 'get', index);

                if(sketchInfo.workType === "commonArea" && "isChanged" in convertedPoints){
                    if(convertedPoints.isChanged === false){
                        return;
                    }
                }

                updateCoordinates([
                    index,
                    "mouseup",
                    convertedPoints
                ]);   
            },
            getConvertedPoints: function(data, mode, index){
                var convertedPoints = [];
                var tempConvertedPoints = [];
                var x1 = null;
                var y1 = null;
                var width = null;
                var height = null;

                /**
                 * 기존 convertPoint 방식의 좌표 변환 방식은
                 * 무조건 좌표의 길이와 최대 영상 사이즈의 비율로 변환을 하였다.
                 * 그래서 변경뒤 사각형 영역의 사이즈를 계산할 경우 오차 범위가 생긴다.
                 *
                 * commonArea같은 경우 Width, Height가 사용자에게
                 * 노출이 되기 때문에 Width, Height가 오차가 있으면 안되기 때문에
                 * X1, Y1와 영역의 Width, Height을 변환하여
                 * 나머지 좌표값(x2,y2,x3,y3)을 구해주는 방식으로 변경하여 오차를 없애는 방식으로 수정하였다.
                 */

                if(sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration"){
                    x1 = data.points[0][0];
                    y1 = data.points[0][1];
                    width = data.points[2][0] - x1;
                    height = data.points[2][1] - y1;

                    // console.log("[" + mode + "][" + (mode === 'set' ? 'Origin' : 'Geometry') + "] w", width, "h", height);
                    
                    // console.log("index", index);
                    // if(index === 0){
                    //     console.log("[" + mode + "][Geometry][Max] w", preMaxWidth, "h", preMaxHeight);
                    // }else{
                    //     console.log("[" + mode + "][Geometry][Min] w", preMinWidth, "h", preMinHeight);
                    // }

                    if(mode === 'get'){
                        //Max
                        if(index === 0){
                            convertedPoints.__proto__.isChanged = width !== preMaxWidth || height !== preMaxHeight;
                            // console.log(width, height);
                        //Min
                        }else{
                            convertedPoints.__proto__.isChanged = width !== preMinWidth || height !== preMinHeight;
                            // console.log(width, height);
                        }

                        _self.updatePrevSize(index, width, height);
                    }

                    tempConvertedPoints = convertPoint([x1, width], [y1, height], mode);

                    x1 = tempConvertedPoints.xpos[0];
                    width = tempConvertedPoints.xpos[1];
                    y1 = tempConvertedPoints.ypos[0];
                    height = tempConvertedPoints.ypos[1];

                    // console.log("[" + mode + "][" + (mode === 'set' ? 'Geometry' : 'Origin') + "] w", width, "h", height);

                    // if(index === 0){
                    //     console.log("[" + mode + "][Geometry][Max] w", preMaxWidth, "h", preMaxHeight);
                    // }else{
                    //     console.log("[" + mode + "][Geometry][Min] w", preMinWidth, "h", preMinHeight);
                    // }

                    if(mode === 'set'){
                        _self.updatePrevSize(index, width, height);
                    }

                    convertedPoints = [
                        [x1, y1],
                        [x1, y1 + height],
                        [x1 + width, y1 + height],
                        [x1 + width, y1]
                    ];

                    // console.log(convertedPoints.isChanged);
                }else{
                    convertedPoints = convertPoints(data.points, mode);
                }

                return convertedPoints;
            },
            setEnableForSVG: function(index, enableOption){
                if(svgObjs[index] !== null && svgObjs[index] !== undefined){
                    var method = enableOption === true ? 'show' : 'hide';
                    svgObjs[index][method]();
                    coordinates[index].enable = enableOption;   
                }
            },
            alignCenter: function(){                
                for(var i = 0, ii = svgObjs.length; i < ii; i++){
                    var data = {};
                    var convertedPoints = [];

                    svgObjs[i].alignCenter();
                    data = svgObjs[i].getData();

                    _self.notifyUpdate(i, data);
                }
            },
            activeShape: function(index){
                var method = null;
                for(var i = 0, ii = svgObjs.length; i < ii; i++){
                    if(svgObjs[i] !== null && svgObjs[i] !== undefined){ //if svg object is setted.
                        method = i === index ? 'active' : 'normal';
                        svgObjs[i][method]();
                    }
                }
            },
            getIndex: function(){
                var index = null;

                for(var i = 0, len = coordinates.length; i < len; i++){
                    if(coordinates[i].isSet !== true){
                        index = i;
                        break;
                    }
                }

                return index;
            },
            setCoordinate: function(index, data){
                coordinates[index].isSet = true;
                coordinates[index].points = data.points;
            },
            addSVGObj: function(obj, isNewlyAdded, coordinateIndex){
                var index = coordinateIndex !== undefined ? coordinateIndex : _self.getIndex();
                obj.lineIndex = index;
                svgObjs[index] = obj;

                _self.setCoordinate(index, obj.getData());

                if(isNewlyAdded === true){
                    coordinates[index].enable = true;
                    updateCoordinates([
                        index,
                        "create",
                        convertPoints(coordinates[index].points, 'get')
                    ]);
                }

                if(!_self.checkDrawAvailable()){
                    kindSVGCustomObj.stop();
                }
            },
            removeSVGObj: function(index){
                svgObjs[index].destroy();
                svgObjs[index] = null;

                if(_self.checkDrawAvailable()){
                    kindSVGCustomObj.start();
                }
            },
            openDialog: function(index, type, coordi) {
                var modalInstance = dialog.open({
                    templateUrl: sketchInfo.modalId,
                    size: 'sm',
                    controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                        $scope.confirmMessage = "lang_msg_confirm_remove_profile";

                        function removeCoor(index){
                            coordinates[index].isSet = false;
                            coordinates[index].enExAppear = null;
                            coordinates[index].points = [];
                            _self.removeSVGObj(index);
                        }

                        $scope.cancel = function() {
                            if(type === "create"){
                                removeCoor(index);
                            }
                            $uibModalInstance.close();
                        };

                        $scope.ok = function() {
                            removeCoor(index);

                            updateCoordinates([index, "delete"]);

                            $uibModalInstance.close();
                        };

                        $uibModalInstance.result.then(function() {
                        }, function() {
                            if(type === "create"){
                                $scope.delete();
                            }
                        });
                    }]
                });
            },
            updatePolygon: function(isInit) {
                clearRect(1);

                var maxWidth = 0;
                var maxHeight = 0;
                var minWidth = 0;
                var minHeight = 0;
                var fixedMinSize = 0;

                if(sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration"){
                    maxWidth = kindSvgOptions.maxSize.width;
                    maxHeight = kindSvgOptions.maxSize.height;
                    minWidth = kindSvgOptions.minSize.width;
                    minHeight = kindSvgOptions.minSize.height;

                    for (var i = coordinates.length - 1; i > -1; i--) {
                        kindSvgOptions.points = coordinates[i].points;

                        //Common Area Color
                        kindSvgOptions.fillColor = i === 0 ? colorFactory.blue : colorFactory.red;
                        kindSvgOptions.lineColor = i === 0 ? colorFactory.blue : colorFactory.red;
                        kindSvgOptions.pointColor = i === 0 ? colorFactory.blue : colorFactory.red;

                        if(sketchInfo.workType === "commonArea"){
                            if(i === 1){
                                kindSvgOptions.maxSize = {
                                    width: videoInfo.width,
                                    height: videoInfo.height
                                };
                                kindSvgOptions.minSize = {
                                    width: minWidth,
                                    height: minHeight
                                };   
                            }else{
                                kindSvgOptions.ratio = [1,1];
                                kindSvgOptions.maxSize = {
                                    width: maxWidth,
                                    height: maxHeight
                                };

                                fixedMinSize = videoInfo.height * sketchInfo.minSizePercentage / 100;
                                
                                kindSvgOptions.minSize = {
                                    width: fixedMinSize,
                                    height: fixedMinSize
                                };
                            }
                        }

                        _self.addSVGObj(kindSVGEditor.draw(kindSvgOptions), false, i);
                    }   
                }else{
                    for (var i = 0; i < coordinates.length; i++) {
                        if (
                            (sketchInfo.workType === "vaEntering" && coordinates[i].enExAppear !== "AppearDisappear") || 
                            (sketchInfo.workType === "vaAppearing" && (
                                coordinates[i].enExAppear === "AppearDisappear" ||
                                (sketchInfo.hasOwnProperty('mode') && coordinates[i].enExAppear === sketchInfo.mode)
                                )
                            ) || 
                            (sketchInfo.workType === "qmArea" && coordinates[i].enExAppear === sketchInfo.color) || 
                            (sketchInfo.workType === "mdArea" && coordinates[i].enExAppear === sketchInfo.color) || 
                            (sketchInfo.workType === "fdArea" && coordinates[i].enExAppear === sketchInfo.color)
                            ) {
                            if (coordinates[i].isSet) {
                                kindSvgOptions.points = coordinates[i].points;

                                if(sketchInfo.workType === "qmArea" && "textInCircle" in coordinates[i]){
                                    kindSvgOptions.textInCircle = coordinates[i].textInCircle;                                    
                                }

                                _self.addSVGObj(kindSVGEditor.draw(kindSvgOptions), false, i);

                                if('enable' in coordinates[i]){
                                    if(coordinates[i].enable !== true){
                                        svgObjs[i].hide();
                                    }   
                                }
                            }
                        }
                    }
                }
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            set: function(data) {
                for (var i = 0; i < coordinates.length; i++) {
                    var enExAppear = null;
                    if (data[i] !== undefined) {
                        coordinates[i].isSet = data[i].isSet;
                        if('enable' in data[i]){
                            coordinates[i].enable = data[i].enable;
                        }

                        coordinates[i].points = _self.getConvertedPoints(data[i], 'set', i);

                        if(sketchInfo.workType === "qmArea" || sketchInfo.workType === "mdArea" || sketchInfo.workType === "fdArea"){
                            enExAppear = sketchInfo.color;
                        }else if(sketchInfo.workType === "vaAppearing" && sketchInfo.hasOwnProperty('mode')){
                            enExAppear = sketchInfo.mode;
                        }

                        if(sketchInfo.workType === "qmArea" && "textInCircle" in data[i]){
                            coordinates[i].textInCircle = data[i].textInCircle;   
                        }

                        coordinates[i].enExAppear = enExAppear;
                    }
                }

                _self.updatePolygon(true);

                if(!_self.checkDrawAvailable()){
                    kindSVGCustomObj.stop();
                }
            },
            get: function() {
                var returnArray = new Array(sketchInfo.maxNumber);
                for (var i = 0; i < coordinates.length; i++) {
                    returnArray[i] = {
                        isSet: false,
                        points: [],
                        enExAppear: null
                    };

                    if (coordinates[i].isSet) {
                        returnArray[i].isSet = true;

                        returnArray[i].points = _self.getConvertedPoints(coordinates[i], 'get', i);
                        returnArray[i].enExAppear = coordinates[i].enExAppear;
                    } else {
                        returnArray[i].isSet = false;
                        returnArray[i].points = [];
                        returnArray[i].enExAppear = coordinates[i].enExAppear;
                    }

                    if('enable' in coordinates[i]){
                        returnArray[i].enable = coordinates[i].enable;
                    }
                }
                return returnArray;
            },
            checkDrawAvailable: function() {
                var capa = false;
                for (var i = 0, ii = coordinates.length; i < ii; i++) {
                    if (!coordinates[i].isSet) {
                        capa = true;
                    }
                }
                return capa;
            }
        };
        return constructor;
    })();

    var VaPassing = (function() {
        var coordinates = null;
        var _self = null;

        var kindSvgOptions = {};

        function constructor() {
            /* jshint validthis: true */
            _self = this;
            kindSvgOptions = {
                fillColor: colorFactory.blue,
                lineColor: colorFactory.blue,
                pointColor: colorFactory.blue,
                lineStrokeWidth: 4,
                circleRadius: 6,
                useEvent: true,
                useCursor: true,
                minPoint: 2,
                maxPoint: 8,
                event: {
                    end: function(obj){
                        _self.addSVGObj(obj, true);
                    },
                    mouseup: function(data){
                        if(this.lineIndex !== undefined){
                            _self.setCoordinate(this.lineIndex, data);
                            updateCoordinates([
                                this.lineIndex,
                                "mouseup",
                                convertPoints(data.points, 'get'),
                                data.arrow
                            ]);
                        }
                    },
                    linecontextmenu: function(event){
                        event.preventDefault();
                        if(sketchInfo.workType !== "peoplecount"){
                            _self.openDialog(this.lineIndex);   
                        }
                    }
                },
                arrow: {
                    mode: 'R',
                    min: 'L',
                    max: 'LR',
                    text: true
                }
            };

            coordinates = [];
            for (var i = 0; i < sketchInfo.maxNumber; i++) {
                coordinates[i] = {
                    isSet: false,
                    points: [],
                    direction: 0
                };
            }

            //People Counting
            if(sketchInfo.workType === "peoplecount"){
                kindSvgOptions.arrow.max = sketchInfo.maxArrow;
                kindSvgOptions.arrow.text = false;
                kindSvgOptions.maxPoint = 2;
                kindSvgOptions.notUseAutoChangeOfArrow = true;

                if(sketchInfo.useEvent === false){
                    kindSvgOptions.fillColor = colorFactory.brightBlue;
                    kindSvgOptions.lineColor = colorFactory.brightBlue;
                    kindSvgOptions.pointColor = colorFactory.brightBlue;
                }
            }

            if("useEvent" in sketchInfo){
                kindSvgOptions.useEvent = sketchInfo.useEvent;
                //만약에 이벤트를 사용하지 않으면 Cursor가 생성이 안되게 함.
                if(kindSvgOptions.useEvent === false){
                    kindSvgOptions.useCursor = false;
                }
            }

            if("minLineLength" in sketchInfo){
                kindSvgOptions.minLineLength = convertPoint(
                    [0,0],
                    [0,sketchInfo.minLineLength],
                    'set'
                    ).ypos[1];
            }

            toggleSVGElement(true);

            if(sketchInfo.workType !== "peoplecount"){
                kindSVGCustomObj = kindSVGEditor.customEditor(kindSvgOptions);   
            }
        }
        constructor.prototype = {
            /*getIndex: function(){
                var index = null;
                if(svgObjs.length < sketchInfo.maxNumber){
                    index = svgObjs.length;
                }

                for(var i = 0, len = svgObjs.length; i < len; i++){
                    if(svgObjs[i] === null){
                        index = i;
                        break;
                    }
                }

                return index;
            },*/
            activeShape: function(index){
                var method = null;
                for(var i = 0, ii = svgObjs.length; i < ii; i++){
                    if(svgObjs[i] !== null && svgObjs[i] !== undefined){ //if svg object is setted.
                        method = i === index ? 'active' : 'normal';
                        svgObjs[i][method]();
                    }
                }
            },
            setEnableForSVG: function(index, enableOption){
                if(svgObjs[index] !== null && svgObjs[index] !== undefined){
                    var method = enableOption === true ? 'show' : 'hide';
                    svgObjs[index][method]();
                }
            },
            changeArrow: function(index, arrow){
                var self = svgObjs[index];
                var currentArrow = self.getData().arrow;

                if(currentArrow === null){
                    if(kindSvgOptions.arrow.mode !== 'R'){
                        kindSvgOptions.arrow.mode = 'R';
                    }

                    self.createArrow(kindSvgOptions.arrow);
                }

                self.changeArrow(arrow);
            },
            getIndex: function(){
                var index = null;

                for(var i = 0, len = coordinates.length; i < len; i++){
                    if(coordinates[i].isSet !== true){
                        index = i;
                        break;
                    }
                }

                return index;
            },
            setCoordinate: function(index, data){
                var coor = coordinates[index];
                var points = data.points;
                var direction = convertDirection(data.arrow);

                coor.isSet = true;
                coor.points = points;
                coor.direction = direction; 
            },
            addSVGObj: function(obj, isNewlyAdded, coordinatesIndex){
                var index = coordinatesIndex !== undefined ? coordinatesIndex : _self.getIndex();
                var data = obj.getData();
                obj.lineIndex = index;
                svgObjs[index] = obj;

                _self.setCoordinate(index, data);

                if(isNewlyAdded === true){
                    updateCoordinates([
                        index,
                        "create",
                        convertPoints(data.points, 'get'),
                        data.arrow
                    ]);
                }

                if(!_self.checkDrawAvailable() && kindSVGCustomObj !== null){
                    kindSVGCustomObj.stop();
                }
            },
            removeSVGObj: function(index){
                svgObjs[index].destroy();
                svgObjs[index] = null;

                if(_self.checkDrawAvailable() && kindSVGCustomObj !== null){
                    kindSVGCustomObj.start();
                }
            },
            updatePassingLine: function(isInit) {
                for (var i = 0; i < coordinates.length; i++) {
                    if (coordinates[i].isSet) {
                        var direction = convertDirection(coordinates[i].direction);

                        kindSvgOptions.arrow.mode = direction;
                        kindSvgOptions.points = coordinates[i].points;

                        if(sketchInfo.workType === "peoplecount"){
                            kindSvgOptions.textInCircle = i + 1;
                        }

                        _self.addSVGObj(kindSVGEditor.draw(kindSvgOptions), false, i);
                    }
                }

                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            set: function(data) {
                for (var i = 0; i < coordinates.length; i++) {
                    if (data[i] !== undefined) {
                        var xpos = [];
                        var ypos = [];
                        var coorPoints = [];
                        var point = [];

                        coordinates[i].isSet = data[i].isSet;
                        coordinates[i].direction = data[i].direction;
                        //change direction depending on flip/mirror
                        if (!videoInfo.support_ptz && videoInfo.adjust) {
                            if (videoInfo.mirror || (videoInfo.mirror && videoInfo.flip)) {
                                if (coordinates[i].direction === 0) {
                                    coordinates[i].direction = 1;
                                } else if (coordinates[i].direction === 1) {
                                    coordinates[i].direction = 0;
                                }
                            }
                        }

                        for(var j = 0, jLen = data[i].points.length; j < jLen; j++){
                            xpos.push(data[i].points[j][0]);
                            ypos.push(data[i].points[j][1]);
                        }

                        point = convertPoint(xpos, ypos, 'set');

                        for(var j = 0, jLen = xpos.length; j < jLen; j++){
                            coorPoints.push([
                                point.xpos[j],
                                point.ypos[j]
                            ]);
                        }

                        coordinates[i].points = coorPoints;
                    }
                }
                _self.updatePassingLine(true);
            },
            get: function() {
                var returnArray = new Array(sketchInfo.maxNumber);
                for (var i = 0; i < coordinates.length; i++) {
                    var xpos = [];
                    var ypos = [];
                    var coorPoints = [];
                    var point = [];

                    returnArray[i] = {
                        isSet: false,
                        points: [],
                        direction: 0
                    };
                    returnArray[i].isSet = coordinates[i].isSet;
                    returnArray[i].direction = coordinates[i].direction;
                    //change direction depending on flip/mirror
                    if (!videoInfo.support_ptz && videoInfo.adjust) {
                        if (videoInfo.mirror || (videoInfo.mirror && videoInfo.flip)) {
                            if (returnArray[i].direction === 0) {
                                returnArray[i].direction = 1;
                            } else if (returnArray[i].direction === 1) {
                                returnArray[i].direction = 0;
                            }
                        }
                    }

                    for(var j = 0, jLen = coordinates[i].points.length; j < jLen; j++){
                        xpos.push(coordinates[i].points[j][0]);
                        ypos.push(coordinates[i].points[j][1]);
                    }

                    point = convertPoint(xpos, ypos, 'get');

                    for(var j = 0, jLen = xpos.length; j < jLen; j++){
                        coorPoints.push([
                            point.xpos[j],
                            point.ypos[j]
                        ]);
                    }

                    returnArray[i].points = coorPoints;
                }
                return returnArray;
            },
            openDialog: function(index) {
                var modalInstance = dialog.open({
                    templateUrl: sketchInfo.modalId,
                    size: 'sm',
                    controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                        $scope.confirmMessage = "lang_msg_confirm_remove_profile";
                        // $scope.addPointNumber = '0';
                        // $scope.pointRange = [0];

                        // (function setPointRange(){
                        //     var data = svgObjs[index].getData();
                        //     var pointLength = data.points.length;
                            
                        //     for(var i = 1, len = 8 - pointLength; i <= len; i++){
                        //         $scope.pointRange.push(i);
                        //     }
                        // })();

                        // $scope.ok = function() {
                        //     if($scope.addPointNumber > 0){
                        //         for(var i = 0; i < $scope.addPointNumber; i++){
                        //             svgObjs[index].addPoint();   
                        //         }
                        //     }

                        //     updateCoordinates([
                        //         index,
                        //         "mouseup",
                        //         convertPoints(coordinates[index].points, 'get')
                        //     ]);

                        //     $uibModalInstance.close();
                        // };
                        $scope.cancel = function() {
                            $uibModalInstance.dismiss();
                        };
                        $scope.ok = function() {
                            coordinates[index].isSet = false;
                            coordinates[index].direction = 0;
                            coordinates[index].points = [];
                            _self.removeSVGObj(index);
                            updateCoordinates([
                                index,
                                "delete"
                            ]);
                            $uibModalInstance.dismiss();
                        };
                    }]
                });
            },
            checkDrawAvailable: function() {
                var capa = false;
                for (var i = 0, ii = coordinates.length; i < ii; i++) {
                    if (!coordinates[i].isSet) {
                        capa = true;
                    }
                }
                return capa;
            }
        };
        return constructor;
    })();

    var Crop = (function() {
        var firstDrawClick = false;
        var isDrawDragging = false;
        var coordinates = null;
        var cropMinResolution = {width : 0, height : 0};
        var cropMaxResolution = {width : 0, height : 0};
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0;
        var _self = null;

        function constructor() {
            /* jshint validthis: true */
            setCropLimitResolution();

            _self = this;
            coordinates = {};
            coordinates = {
                x1: 0,
                y1: 0,
                width: 0,
                height: 0
            };
            fContext.strokeStyle = colorFactory.blue;
            fContext.fillStyle = colorFactory.blue;
            fContext.lineWidth = lineWidth;
            fContext.globalAlpha = alphaFactory.enabled.fill;
        }

        function setCropLimitResolution() {
            var minSplit = videoInfo.minCropResolution.split('x');
            var maxSplit = videoInfo.maxCropResolution.split('x');

            cropMinResolution.width = videoInfo.rotate === "0" ? minSplit[0] : minSplit[1];
            cropMinResolution.height = videoInfo.rotate === "0" ? minSplit[1] : minSplit[0];
            cropMaxResolution.width = videoInfo.rotate === "0" ? maxSplit[0] : maxSplit[1];
            cropMaxResolution.height = videoInfo.rotate === "0" ? maxSplit[1] : maxSplit[0];
        }

        constructor.prototype = {
            cropMousedown: function(e) {
                if (e.which !== 1) {
                    return;
                }
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];
                rectPos.startX = xVal;
                rectPos.startY = yVal;
                firstDrawClick = true;
                isDrawDragging = false;
            },
            cropMousemove: function(e) {
                var coord = getCoordinate(e, frontCanvas);
                var xVal = coord[0];
                var yVal = coord[1];
                if (firstDrawClick) {
                    rectPos.w = xVal - rectPos.startX;
                    rectPos.h = yVal - rectPos.startY;
                    rectPos.endX = xVal;
                    rectPos.endY = yVal;
                    fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                    if ((rectPos.startX + rectPos.w) > videoInfo.width) {
                        rectPos.w = frontCanvas.width - rectPos.startX;
                    } else if ((rectPos.startX + rectPos.w) < 0) {
                        rectPos.w = (-1) * rectPos.startX;
                    }
                    if ((rectPos.startY + rectPos.h) > videoInfo.height) {
                        rectPos.h = videoInfo.height - rectPos.startY;
                    } else if ((rectPos.startY + rectPos.h) < 0) {
                        rectPos.h = (-1) * rectPos.startY;
                    }
                    fContext.strokeStyle = colorFactory.blue;
                    fContext.lineWidth = lineWidth;
                    fContext.fillStyle = colorFactory.blue;
                    fContext.strokeRect(rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                }
                isDrawDragging = true;
            },
            cropMouseup: function(e) {
                if (!firstDrawClick) {
                    return;
                }
                firstDrawClick = false;
                if (isDrawDragging) {
                    if (rectPos.startX <= rectPos.endX) {
                        x1 = rectPos.startX;
                        x2 = rectPos.endX;
                    } else {
                        x2 = rectPos.startX;
                        x1 = rectPos.endX;
                    }
                    if (rectPos.startY <= rectPos.endY) {
                        y1 = rectPos.startY;
                        y2 = rectPos.endY;
                    } else {
                        y2 = rectPos.startY;
                        y1 = rectPos.endY;
                    }
                    rectPos.w = Math.abs(rectPos.w);
                    rectPos.h = Math.abs(rectPos.h);
                    var cX = Math.ceil(x1 * (videoInfo.maxWidth / videoInfo.width));
                    var cY = Math.ceil(y1 * (videoInfo.maxHeight / videoInfo.height));
                    var cW = Math.ceil(Math.abs(rectPos.w) * (videoInfo.maxWidth / videoInfo.width));
                    var cH = Math.ceil(Math.abs(rectPos.h) * (videoInfo.maxHeight / videoInfo.height));
                    if (ratio === "16:9") { //16:9
                        if (videoInfo.rotate !== "0") {
                            cH = Math.ceil(cW * (16 / 9));
                        } else {
                            cH = Math.ceil(cW * (9 / 16));
                        }
                    } else if (ratio === "4:3") { //4:3
                        if (videoInfo.rotate !== "0") {
                            cH = Math.ceil(cW * (4 / 3));
                        } else {
                            cH = Math.ceil(cW * (3 / 4));
                        }
                    } else { //5:4
                    }
                    if (parseInt(cY) + parseInt(cH) >= videoInfo.maxHeight) {
                        var changeY = videoInfo.maxHeight - parseInt(cH);
                        cY = changeY;
                        if (parseInt(cY) + parseInt(cH) >= videoInfo.maxHeight) {
                            cY -= 2;
                            cH -= 2;
                        }
                    }
                    if (ratio === "16:9") {
                        if (cW < cropMinResolution.width) {
                            fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                            _self.updateCanvas(false);
                            return;
                        }
                        if (cH < cropMinResolution.height) {
                            fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                            _self.updateCanvas(false);
                            return;
                        }                        
                    }else{
                        if (cW < cropMinResolution.width) {
                            fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                            _self.updateCanvas(false);
                            return;
                        }
                        if (cH < cropMinResolution.height) {
                            fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
                            _self.updateCanvas(false);
                            return;
                        }
                    }

                    if (parseInt(cX) < 0) {
                        cX = 0;
                    }
                    if (parseInt(cY) < 0) {
                        cY = 0;
                    }

                    if (parseInt(cW) > cropMaxResolution.width) {
                        cW = cropMaxResolution.width;
                    }
                    if (parseInt(cH) > cropMaxResolution.height) {
                        cH = cropMaxResolution.height;
                    }

                    if (cX % 2 === 1) {
                        cX += 1;
                    }
                    if (cY % 2 === 1) {
                        cY += 1;
                    }
                    if (cW % 2 === 1) {
                        cW += 1;
                    }
                    if (cH % 2 === 1) {
                        cH += 1;
                    }
                    coordinates.x1 = cX;
                    coordinates.y1 = cY;
                    coordinates.width = cW;
                    coordinates.height = cH;
                }
                console.log("crop w =" + cW + ", h = " + cH);
                _self.updateCanvas(false);
                isDrawDragging = false;
            },
            updateCanvas: function(isInit) {
                clearRect(0);
                clearRect(1);
                fContext.strokeStyle = colorFactory.blue;
                fContext.fillStyle = colorFactory.blue;
                var tempCoordi = {
                    x1: 0,
                    y1: 0,
                    width: 0,
                    height: 0
                };
                tempCoordi.x1 = parseInt(coordinates.x1 / (videoInfo.maxWidth / videoInfo.width), 10);
                tempCoordi.y1 = parseInt(coordinates.y1 / (videoInfo.maxHeight / videoInfo.height), 10);
                tempCoordi.width = parseInt(coordinates.width / (videoInfo.maxWidth / videoInfo.width), 10);
                tempCoordi.height = parseInt(coordinates.height / (videoInfo.maxHeight / videoInfo.height), 10);
                fContext.strokeRect(tempCoordi.x1, tempCoordi.y1, tempCoordi.width, tempCoordi.height);
                fContext.fillRect(tempCoordi.x1, tempCoordi.y1, tempCoordi.width, tempCoordi.height);
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            changeRatio: function(data) {
                setCropLimitResolution();
                ratio = data;
                coordinates.x1 = 0;
                coordinates.y1 = 0;
                if (ratio === "16:9") {
                    coordinates.width = cropMaxResolution.width;
                    coordinates.height = cropMaxResolution.height;
                } else if (ratio === "4:3") {
                    coordinates.width = cropMaxResolution.width;
                    coordinates.height = cropMaxResolution.height;
                } else {
                    coordinates.width = cropMaxResolution.width;
                    coordinates.height = cropMaxResolution.height;
                }
                _self.updateCanvas(false);
            },
            set: function(data) {
                coordinates.x1 = parseInt(data[0].x1, 10);
                coordinates.y1 = parseInt(data[0].y1, 10);
                coordinates.width = parseInt(data[0].width, 10);
                coordinates.height = parseInt(data[0].height, 10);
                _self.updateCanvas(true);
            },
            get: function() {
                return coordinates;
            }
        };
        return constructor;
    })();

    var AutoTracking = (function() {
        var firstDrawClick = false;
        var isDrawDragging = false;
        var Ax = 0,
            Ay = 0;
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            x3 = 0,
            y3 = 0,
            x4 = 0,
            y4 = 0;
        var rectPos = {
            startX: 0,
            startY: 0,
            w: 0,
            h: 0
        };
        var index = 1;
        var coordinates = null;
        var _self = null;
        var selectedCoordinates = null;

        function constructor() {
            /* jshint validthis: true */
            _self = this;
            index = 1;
            isDrawDragging = false;
            firstDrawClick = false;
            coordinates = {};
            coordinates = {
                name: "",
                color: "",
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            };
            fContext.lineWidth = lineWidth;
            bContext.lineWidth = lineWidth;
        }
        constructor.prototype = {
            mousedownRectangle: function(e) {
                if (e.which !== 1) {
                    return;
                }
                if (!_self.checkDrawAvailable()) {
                    return;
                }
                var coord = getCoordinate(e, this);
                var xVal = coord[0];
                var yVal = coord[1];
                rectPos.startX = xVal;
                rectPos.startY = yVal;
                firstDrawClick = true;
                isDrawDragging = false;
            },
            mousemoveRectangle: function(e) {
                var coord = getCoordinate(e, frontCanvas);
                var xVal = coord[0];
                var yVal = coord[1];
                if (firstDrawClick) {
                    clearRect(1);
                    rectPos.w = xVal - rectPos.startX;
                    rectPos.h = yVal - rectPos.startY;
                    rectPos.endX = xVal;
                    rectPos.endY = yVal;
                    clearRect(0);
                    if ((rectPos.startX + rectPos.w) > videoInfo.width) {
                        rectPos.w = frontCanvas.width - rectPos.startX;
                    } else if ((rectPos.startX + rectPos.w) < 0) {
                        rectPos.w = (-1) * rectPos.startX;
                    }
                    if ((rectPos.startY + rectPos.h) > videoInfo.height) {
                        rectPos.h = videoInfo.height - rectPos.startY;
                    } else if ((rectPos.startY + rectPos.h) < 0) {
                        rectPos.h = (-1) * rectPos.startY;
                    }
                    drawRectangle(0, 1, rectPos.startX, rectPos.startY, rectPos.w, rectPos.h);
                }
                isDrawDragging = true;
            },
            mouseupRectangle: function(e) {
                if (!firstDrawClick) {
                    return;
                }
                firstDrawClick = false;
                if (isDrawDragging) {
                    if (rectPos.startX <= rectPos.endX) {
                        x1 = rectPos.startX;
                        x2 = rectPos.endX;
                    } else {
                        x2 = rectPos.startX;
                        x1 = rectPos.endX;
                    }
                    if (rectPos.startY <= rectPos.endY) {
                        y1 = rectPos.startY;
                        y2 = rectPos.endY;
                    } else {
                        y2 = rectPos.startY;
                        y1 = rectPos.endY;
                    }
                    if ((x1 !== x2) && (y1 !== y2)) {
                        coordinates.x1 = x1;
                        coordinates.y1 = y1;
                        coordinates.x2 = x2;
                        coordinates.y2 = y2;
                        _self.updateRectangle(false);
                        _self.openDialog(0, "create");
                    } else {
                        if (selectedCoordinates !== null) {
                            // to draw selected area
                            _self.drawArea(selectedCoordinates);
                        }
                    }
                    clearRect(0);
                    isDrawDragging = false;
                }
            },
            contextmenuRectangle: function(e) {
                //mouse right click
                e.preventDefault();
                return false;
            },
            updateRectangle: function(isInit) {
                clearRect(1);
                drawRectangle(1, 1, coordinates.x1, coordinates.y1, coordinates.x2 - coordinates.x1, coordinates.y2 - coordinates.y1);
                if (updateCoordinates !== null && typeof updateCoordinates === "function") {
                    if (!isInit) updateCoordinates();
                }
            },
            drawArea: function(data) {
                var xpos = [0, 0, 0, 0];
                var ypos = [0, 0, 0, 0];
                if (sketchInfo.shape === 0) { //rectangle
                    xpos = [data.x1, data.x2];
                    ypos = [data.y1, data.y2];
                } else {
                    xpos = [data.x1, data.x2, data.x3, data.x4];
                    ypos = [data.y1, data.y2, data.y3, data.y4];
                }
                var point = convertPoint(xpos, ypos, 'set');
                coordinates.x1 = point.xpos[0];
                coordinates.y1 = point.ypos[0];
                coordinates.x2 = point.xpos[1];
                coordinates.y2 = point.ypos[1];

                if (sketchInfo.shape === 0) {
                    _self.updateRectangle(true);
                } else {
                    _self.updatePolygon(true);
                }
            },
            set: function(data) {
                if (typeof data !== "undefined" || data !== null) {
                    _self.drawArea(data);
                    if (data.selectedMask === true) {
                        selectedCoordinates = {
                            'x1': data.x1,
                            'x2': data.x2,
                            'x3': data.x3,
                            'x4': data.x4,
                            'y1': data.y1,
                            'y2': data.y2,
                            'y3': data.y3,
                            'y4': data.y4
                        };
                    }
                    if (selectedCoordinates !== null) {
                        // to draw selected area
                        _self.drawArea(selectedCoordinates);
                    }
                } else {
                    if (sketchInfo.shape === 0) {
                        coordinates = {
                            name: "",
                            color: "",
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0
                        };
                    } else {
                        coordinates = {
                            name: "",
                            color: "",
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0,
                            x3: 0,
                            y3: 0,
                            x4: 0,
                            y4: 0
                        };
                    }
                }
            },
            get: function() {
                var returnArray = {};
                var xpos = [0, 0, 0, 0];
                var ypos = [0, 0, 0, 0];
                if (sketchInfo.shape === 0) {
                    returnArray = {
                        name: "",
                        color: "",
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                    xpos = [coordinates.x1, coordinates.x2];
                    ypos = [coordinates.y1, coordinates.y2];
                } else {
                    returnArray = {
                        name: "",
                        color: "",
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0,
                        x3: 0,
                        y3: 0,
                        x4: 0,
                        y4: 0
                    };
                    xpos = [coordinates.x1, coordinates.x2, coordinates.x3, coordinates.x4];
                    ypos = [coordinates.y1, coordinates.y2, coordinates.y3, coordinates.y4];
                }
                var point = convertPoint(xpos, ypos, 'get');
                returnArray.x1 = point.xpos[0];
                returnArray.y1 = point.ypos[0];
                returnArray.x2 = point.xpos[1];
                returnArray.y2 = point.ypos[1];
                return returnArray;
            },
            openDialog: function(index, type) {
                var modalInstance = dialog.open({
                    templateUrl: sketchInfo.modalId,
                    controller: ['$scope', '$uibModalInstance', 'Attributes', 'COMMONUtils', function($scope, $uibModalInstance, Attributes, COMMONUtils) {
                        var mAttr = Attributes.get();
                        $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
                        $scope.AutoTrackingNameMaxLen = 10;
                        $scope.ok = function() {
                            var autoName = $(".autoTracking-name-input").val();
                            if (!autoName) return;
                            var coor = autoTracking.get();
                            var autoTrackingData = {};
                            if (sketchInfo.shape === 0) {
                                autoTrackingData = {
                                    'name': autoName,
                                    'position': coor.x1 + "," + coor.y1 + "," + coor.x2 + "," + coor.y2
                                };
                            } else {
                                autoTrackingData = {
                                    'name': autoName,
                                    'position': coor.x1 + "," + coor.y1 + "," + coor.x2 + "," + coor.y2 + "," + coor.x3 + "," + coor.y3 + "," + coor.x4 + "," + coor.y4
                                };
                            }
                            autoTrackingUpdate(autoTrackingData);
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function() {
                            autoTrackingUpdate(null);
                            $uibModalInstance.dismiss();
                        };
                        $uibModalInstance.result.then(function() {
                            clearRect(1);
                        }, function() {
                            privacyUpdate(null);
                            clearRect(1);
                        });
                    }]
                });
            },
            checkDrawAvailable: function() {
                var capa = false;
                if (sketchInfo.currentNumber < sketchInfo.maxNumber) {
                    capa = true;
                }
                return capa;
            }
        };
        return constructor;
    })();
    var lineDistance = function(x1, y1, x2, y2) {
        var xs = 0;
        var ys = 0;
        xs = x2 - x1;
        xs = xs * xs;
        ys = y2 - y1;
        ys = ys * ys;
        return Math.sqrt(xs + ys);
    };
    var getAngleABC  = function(a, b, c) {
        var ab = {
            x: b.x - a.x,
            y: b.y - a.y
        };
        var cb = {
            x: b.x - c.x,
            y: b.y - c.y
        };
        var dot = (ab.x * cb.x + ab.y * cb.y); // dot product
        var cross = (ab.x * cb.y - ab.y * cb.x); // cross product
        var alpha = Math.atan2(cross, dot);
        return Math.floor(alpha * 180 / 3.141592 + 0.5);
    };
    var sqr = function(x) {
        return x * x
    };
    var dist2 = function(v, w) {
        return sqr(v.x - w.x) + sqr(v.y - w.y)
    };
    var distToSegmentSquared = function(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 === 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        if (t < 0) return dist2(p, v);
        if (t > 1) return dist2(p, w);
        return dist2(p, {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        });
    };
    var distToSegment = function(p, v, w) {
        return Math.sqrt(distToSegmentSquared(p, v, w));
    };
    var isPointInPoly = function(poly, pt) {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) && (c = !c);
        return c;
    };
    var dotLineLength = function(x, y, x0, y0, x1, y1, o) {
        function lineLength(x, y, x0, y0) {
            return Math.sqrt((x -= x0) * x + (y -= y0) * y);
        }
        if (o && !(o = function(x, y, x0, y0, x1, y1) {
                if (!(x1 - x0)) return {
                    x: x0,
                    y: y
                };
                else if (!(y1 - y0)) return {
                    x: x,
                    y: y0
                };
                var left, tg = -1 / ((y1 - y0) / (x1 - x0));
                return {
                    x: left = (x1 * (x * tg - y + y0) + x0 * (x * -tg + y - y1)) / (tg * (x1 - x0) + y0 - y1),
                    y: tg * left - tg * x + y
                };
            }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))) {
            var l1 = lineLength(x, y, x0, y0),
                l2 = lineLength(x, y, x1, y1);
            return l1 > l2 ? l2 : l1;
        } else {
            var a = y0 - y1,
                b = x1 - x0,
                c = x0 * y1 - y0 * x1;
            return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
        }
    };


    function convertPoints(points, convertType){
        var xpos = [];
        var ypos = [];
        var convertedPoints = null;
        var coorPoints = [];

        for(var j = 0, jj = points.length; j < jj; j++){
            xpos.push(points[j][0]);
            ypos.push(points[j][1]);
        }

        convertedPoints = convertPoint(xpos, ypos, convertType);

        for(var j = 0, jj = xpos.length; j < jj; j++){
            coorPoints.push([
                convertedPoints.xpos[j],
                convertedPoints.ypos[j],
            ]);
        }

        return coorPoints;
    }

    var convertPoint = function(xpos, ypos, mode) {
        var pointCount = xpos.length;
        if (mode === 'set') { // set point
            if (!videoInfo.support_ptz && videoInfo.adjust) {
                if (videoInfo.rotate === "90") {
                    for (var j = 0; j < pointCount; j++) {
                        var temp = ypos[j];
                        ypos[j] = xpos[j];
                        xpos[j] = videoInfo.maxWidth - temp;
                    }
                } else if (videoInfo.rotate === "270") {
                    for (var j = 0; j < pointCount; j++) {
                        var temp = xpos[j];
                        xpos[j] = ypos[j];
                        ypos[j] = videoInfo.maxHeight - temp;
                    }
                }
                if (videoInfo.flip === true) {
                    for (var j = 0; j < pointCount; j++) {
                        ypos[j] = videoInfo.maxHeight - ypos[j];
                    }
                }
                if (videoInfo.mirror === true) {
                    for (var j = 0; j < pointCount; j++) {
                        xpos[j] = videoInfo.maxWidth - xpos[j];
                    }
                }
            }
            if (sketchInfo.shape === 0) { //rect
                if (xpos[1] < xpos[0]) {
                    var temp = xpos[0];
                    xpos[0] = xpos[1];
                    xpos[1] = temp;
                }
                if (ypos[1] < ypos[0]) {
                    var temp = ypos[0];
                    ypos[0] = ypos[1];
                    ypos[1] = temp;
                }
            }
            for (var j = 0; j < pointCount; j++) {
                if (videoInfo.rotate === "90" || videoInfo.rotate === "270") {
                    xpos[j] = Math.round(xpos[j] / (videoInfo.maxHeight / videoInfo.height));
                    ypos[j] = Math.round(ypos[j] / (videoInfo.maxWidth / videoInfo.width));
                } else {
                    xpos[j] = Math.round(xpos[j] / (videoInfo.maxWidth / videoInfo.width));
                    ypos[j] = Math.round(ypos[j] / (videoInfo.maxHeight / videoInfo.height));
                }
            }
        } else { // set point
            if (!videoInfo.support_ptz && videoInfo.adjust) {
                if (videoInfo.rotate === "90") {
                    for (var j = 0; j < pointCount; j++) {
                        var temp = xpos[j];
                        xpos[j] = ypos[j];
                        ypos[j] = videoInfo.width - temp;
                    }
                } else if (videoInfo.rotate === "270") {
                    for (var j = 0; j < pointCount; j++) {
                        var temp = ypos[j];
                        ypos[j] = xpos[j];
                        xpos[j] = videoInfo.height - temp;
                    }
                }
                if (videoInfo.flip === true) {
                    if (videoInfo.rotate === "90" || videoInfo.rotate === "270") {
                        for (var j = 0; j < pointCount; j++) {
                            xpos[j] = videoInfo.height - xpos[j];
                        }
                    } else {
                        for (var j = 0; j < pointCount; j++) {
                            ypos[j] = videoInfo.height - ypos[j];
                        }
                    }
                }
                if (videoInfo.mirror === true) {
                    if (videoInfo.rotate === "90" || videoInfo.rotate === "270") {
                        for (var j = 0; j < pointCount; j++) {
                            ypos[j] = videoInfo.width - ypos[j];
                        }
                    } else {
                        for (var j = 0; j < pointCount; j++) {
                            xpos[j] = videoInfo.width - xpos[j];
                        }
                    }
                }
            }
            if (sketchInfo.shape === 0) { //rect
                if (xpos[1] < xpos[0]) {
                    var temp = xpos[0];
                    xpos[0] = xpos[1];
                    xpos[1] = temp;
                }
                if (ypos[1] < ypos[0]) {
                    var temp = ypos[0];
                    ypos[0] = ypos[1];
                    ypos[1] = temp;
                }
            }
            for (var j = 0; j < pointCount; j++) {
                if (videoInfo.rotate === "90" || videoInfo.rotate === "270") {
                    xpos[j] = Math.round(xpos[j] * (videoInfo.maxHeight / videoInfo.height));
                    ypos[j] = Math.round(ypos[j] * (videoInfo.maxWidth / videoInfo.width));
                } else {
                    xpos[j] = Math.round(xpos[j] * (videoInfo.maxWidth / videoInfo.width));
                    ypos[j] = Math.round(ypos[j] * (videoInfo.maxHeight / videoInfo.height));
                }
                if (xpos[j] < 0) xpos[j] = 0;
                if (ypos[j] < 0) ypos[j] = 0;
                if (xpos[j] > videoInfo.maxWidth) {
                    xpos[j] = videoInfo.maxWidth;
                }
                if (ypos[j] > videoInfo.maxHeight) {
                    ypos[j] = videoInfo.maxHeight;
                }
            }
        }
        return {
            xpos: xpos,
            ypos: ypos
        };
    };

    CanvasRenderingContext2D.prototype.fillPolygon = function(pointsArray, fillColor, strokeColor) {
        if (pointsArray.length <= 0) return;
        this.moveTo(pointsArray[0][0], pointsArray[0][1]);
        for (var i = 0; i < pointsArray.length; i++) {
            this.lineTo(pointsArray[i][0], pointsArray[i][1]);
        }
        if (strokeColor !== null && strokeColor !== undefined) this.strokeStyle = strokeColor;
        this.globalAlpha = alphaFactory.enabled.stroke;
        if (fillColor !== null && fillColor !== undefined) {
            this.fillStyle = fillColor;
            this.globalAlpha = alphaFactory.enabled.fill;
            this.fill();
        }
    };
    return constructor;
})();