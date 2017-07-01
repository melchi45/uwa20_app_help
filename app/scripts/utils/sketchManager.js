/* global KindSVGEditor */
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
    support_zoomOnly: null,
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
  var ratio = null;

  var colorFactory = {
    circleForMETAInFD: '#FF0000', //TNB 모델에서 변경해서 사용함
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
      fill: "0.1"
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
  var toggleSVGElement = function(status) {
    if (svgElement !== null) {
      var BOTTOM_ZINDEX = 999;
      var TOP_ZINDEX = 1001;
      var zIndex = status === true ? TOP_ZINDEX : BOTTOM_ZINDEX;
      if ("style" in svgElement) {
        svgElement.style.zIndex = zIndex;
      }
    }
  };

  var removeAllSVGElement = function() {
    if (svgObjs !== null) {
      for (var i = 0, len = svgObjs.length; i < len; i++) {
        var self = svgObjs[i];
        if (self !== null && typeof self !== "undefined") {
          self.destroy();
        }
      }

      svgObjs = [];
    }
  };

  var resetSVGElement = function() {
    if (kindSVGCustomObj !== null) {
      kindSVGCustomObj.destroy();
      kindSVGCustomObj = null;
    }

    removeAllSVGElement();
    toggleSVGElement(false);
  };

  var convertDirection = function(direction) {
    var changedDirection = '';
    var LEFT_RIGHT_INDEX = 2;
    switch (direction) {
      case 0:
        changedDirection = 'L';
        break;
      case 1:
        changedDirection = 'R';
        break;
      case LEFT_RIGHT_INDEX:
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

  var getCoordinate = function(event, self) {
    var offset = $(self).offset();
    var xVal = event.pageX - offset.left;
    var yVal = event.pageY - offset.top;

    if (window.navigator.msPointerEnabled) { //Detect IE10 or IE11
      if ($(window).scrollLeft() !== 0 && event.pageX === event.clientX) {
        xVal += $(window).scrollLeft();
      }
      if ($(window).scrollTop() !== 0 && event.pageY === event.clientY) {
        yVal += $(window).scrollTop();
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
  function getOptions(args) {
    var context = args[0] === 0 ? fContext : bContext;
    var color = args[1] === 0 ? colorFactory.red : colorFactory.blue;
    var startGlobalAlpha = 
      args[0] === 0 ? 
      alphaFactory.enabled.stroke : 
      alphaFactory.disabled.stroke;
    var endGlobalAlpha = 
      args[0] === 0 ? 
      alphaFactory.enabled.fill : 
      alphaFactory.disabled.fill;

    return {
      context: context,
      color: color,
      startGlobalAlpha: startGlobalAlpha,
      endGlobalAlpha: endGlobalAlpha
    };
  }

  function getMetaDataOptions(args) {
    var context = args[0] === 0 ? fContext : bContext;
    var color = 
      args[1] === 0 ? 
      colorFactory.originalRed : 
      colorFactory.green;
    var startGlobalAlpha = alphaFactory.metaData;

    return {
      context: context,
      color: color,
      startGlobalAlpha: startGlobalAlpha
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
  function drawRectangle() {
    var options = getOptions(arguments);
    var INDEX = {
      X_COOR: 2,
      Y_COOR: 3,
      WIDTH: 4,
      HEIGTH: 5
    };

    options.context.globalAlpha = options.endGlobalAlpha;
    options.context.fillStyle = options.color;
    options.context.fillRect(
      arguments[INDEX.X_COOR],
      arguments[INDEX.Y_COOR],
      arguments[INDEX.WIDTH],
      arguments[INDEX.HEIGTH]
    );

    drawStroke.apply(null, arguments);
  }

  /**
   * drawCircle is used for META Data in Face Detection.
   */
  function drawCircle() {
    var INDEX = {
      X_COOR: 2,
      Y_COOR: 3,
      WIDTH: 4
    };
    var CIRCLE = 2;
    fContext.lineWidth = lineWidth;
    fContext.beginPath();
    fContext.globalAlpha = alphaFactory.metaData;
    fContext.strokeStyle = colorFactory.circleForMETAInFD;
    fContext.arc(
      arguments[INDEX.X_COOR],
      arguments[INDEX.Y_COOR],
      arguments[INDEX.WIDTH],
      0,
      CIRCLE * Math.PI
    );
    fContext.stroke();
    fContext.closePath();
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
  function drawStroke() {
    var INDEX = {
      X_COOR: 2,
      Y_COOR: 3,
      WIDTH: 4,
      HEIGTH: 5,
      METADATA: 6
    };
    var options = 
      arguments[INDEX.METADATA] === true ? 
      getMetaDataOptions(arguments) : 
      getOptions(arguments);

    options.context.lineWidth = lineWidth;
    options.context.globalAlpha = options.startGlobalAlpha;
    options.context.strokeStyle = options.color;
    /**
     * Stroke를 그리면 좌표의 중앙을 기준으로 그려진다.
     * Fill과 Stroke가 자연스럽게 같은 위치로 그려주기 위해
     * x, y는 Stroke의 절반을 줄여주고, width, height는 Stroke만큼 빼준다.
     */
    options.context.strokeRect(
      arguments[INDEX.X_COOR],
      arguments[INDEX.Y_COOR],
      arguments[INDEX.WIDTH],
      arguments[INDEX.HEIGTH]
    );
  }

  function clearRect() {
    var options = getOptions(arguments);

    options.context.clearRect(0, 0, videoInfo.width, videoInfo.height);
  }

  /**
   * Geometry의 최소값을 변경하는 함수
   * return 값이 false경우 실해, true일 경우 성공이다.
   */
  function changeMinSizeOption(width, height) {
    var isOk = true;
    var maxGeometry = svgObjs[1];
    var convertedPoint = convertPoint(
      [0, width], [0, height],
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
  function changeMaxSizeOption(width, height) {
    var isOk = true;
    var minGeometry = svgObjs[0];
    var convertedPoint = convertPoint(
      [0, width], [0, height],
      'set'
    );

    minGeometry.changeMaxSizeOption({
      width: convertedPoint.xpos[1],
      height: convertedPoint.ypos[1]
    });

    return isOk;
  }

  function changeRectangleToSize(index, width, height) {
    var convertedPoint = null;

    if (typeof svgObjs[index] !== "undefined") {
      convertedPoint = convertPoint(
        [0, width], [0, height],
        'set'
      );

      // console.log("[Origin] w", width, "h", height);
      // console.log("[Geometry] w", convertedPoint.xpos[1], "h", convertedPoint.ypos[1]);

      svgObjs[index].changeRectangleToSize(
        convertedPoint.xpos[1],
        convertedPoint.ypos[1]
      );

      if (sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration") {
        if (typeof vaEnteringAppearing !== "undefined") {
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
    DISMode: false,
    init: function(
      sketchInfomation, 
      videoInInfomation, 
      updateCallback, 
      privacyCallback, 
      getZoomValueCallback, 
      autoTrackingCallback
      ) {
      //init: function(sketchInfomation, videoInInfomation, updateCallback, privacyCallback, autoTrackingCallback){
      sketchInfo = sketchInfomation;
      videoInfo = videoInInfomation;
      updateCoordinates = updateCallback;
      privacyUpdate = privacyCallback;
      autoTrackingUpdate = autoTrackingCallback;
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
        sketchInfo.workType === "simpleFocus"
        ) {
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
      } else if (
        sketchInfo.workType === "vaEntering" || 
        sketchInfo.workType === "vaAppearing" || 
        sketchInfo.workType === "commonArea" || 
        sketchInfo.workType === "calibration"
        ) {
        vaEnteringAppearing = new VaEnteringAppearing();
      } else if (
        sketchInfo.workType === "vaPassing" || 
        sketchInfo.workType === "peoplecount"
        ) {
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
        var ARROW_INDEX = 4;
        var DOUBLE_INDEX = 2;
        var THREE_INDEX = 3;
        var ARROW_LEFT = 2;
        var SEVEN_INDEX = 7;
        if (sketchInfo.ptStatus >= 1 && sketchInfo.ptStatus <= ARROW_INDEX) {

          var width = parseInt(videoInfo.width);
          var height = parseInt(videoInfo.height);
          var halfWidth = width / DOUBLE_INDEX;
          var halfHeight = height / DOUBLE_INDEX;
          var sideLineSize = 40;
          var ARROW_LINE_RADIUS = 5;
          var arrowLineSize = sideLineSize / ARROW_LINE_RADIUS;
          var FILL_TEXT_HEIGHT = 20;

          var drawLine = function(startX, startY, endX, endY) {
            fContext.beginPath();
            fContext.moveTo(startX, startY);
            fContext.lineTo(endX, endY);
            fContext.closePath();
            fContext.stroke();
          };

          fContext.lineWidth = 1;
          fContext.strokeStyle = colorFactory.white;
          drawLine(
            halfWidth, 
            height / THREE_INDEX, 
            halfWidth, 
            (height / THREE_INDEX) * DOUBLE_INDEX
          );

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
          } else if (sketchInfo.ptStatus === ARROW_LEFT) { //왼쪽 화살표
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
          } else if (sketchInfo.ptStatus === THREE_INDEX || sketchInfo.ptStatus === ARROW_INDEX) {
            drawLine(
              width / SEVEN_INDEX * THREE_INDEX,
              halfHeight,
              width / SEVEN_INDEX * ARROW_INDEX,
              halfHeight
            );
          }

          fContext.font = "15px Verdana";
          fContext.fillStyle = colorFactory.white;
          fContext.textAlign = "center";
          fContext.fillText(sketchInfo.guideText, halfWidth, FILL_TEXT_HEIGHT);
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
        frontCanvas.removeEventListener(
          "contextmenu", 
          vaEnteringAppearing.contextmenuRectangle, 
          false
        );
        frontCanvas.removeEventListener("click", vaEnteringAppearing.mouseclickPolygon, false);
        frontCanvas.removeEventListener("mousemove", vaEnteringAppearing.mousemovePolygon, false);
        frontCanvas.removeEventListener(
          'contextmenu', 
          vaEnteringAppearing.contexmenuPolygon, 
          false
        );
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
    changeVideoInfo: function(width, height) {
      var data = this.get();
      
      //clear Canvas
      clearRect(0);
      clearRect(1);

      //clear SVG
      removeAllSVGElement();

      videoInfo.width = width;
      videoInfo.height = height;

      frontCanvas.width = width;
      frontCanvas.height = height;
      backCanvas.width = width;
      backCanvas.height = height;
      
      this.set(data);
    },
    get: function() {
      if (sketchInfo === null) {
        return;
      }
      if (sketchInfo.workType === "mdSize") {
        return mdSize.get();
      } else if (
        sketchInfo.workType === "qmArea" || 
        sketchInfo.workType === "mdArea" || 
        sketchInfo.workType === "fdArea" || 
        sketchInfo.workType === "smartCodec" || 
        sketchInfo.workType === "simpleFocus"
        ) {
        if (sketchInfo.shape === 0) {
          return mdArea.get();
        } else {
          return vaEnteringAppearing.get();
        }
      } else if (
        sketchInfo.workType === "vaEntering" || 
        sketchInfo.workType === "vaAppearing" || 
        sketchInfo.workType === "commonArea" || 
        sketchInfo.workType === "calibration"
        ) {
        return vaEnteringAppearing.get();
      } else if (
        sketchInfo.workType === "vaPassing" || 
        sketchInfo.workType === "peoplecount"
        ) {
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
        if (mdSize !== null) {
          mdSize.set(data, flag);
        }
      } else if (
        sketchInfo.workType === "qmArea" || 
        sketchInfo.workType === "mdArea" || 
        sketchInfo.workType === "fdArea" || 
        sketchInfo.workType === "smartCodec" || 
        sketchInfo.workType === "simpleFocus"
        ) {
        if (sketchInfo.shape === 0) {
          if (mdArea !== null) {
            mdArea.set(data, flag);
          }
        } else {
          if (vaEnteringAppearing !== null) {
            vaEnteringAppearing.set(data);
          }
        }
      } else if (
        sketchInfo.workType === "vaEntering" || 
        sketchInfo.workType === "vaAppearing" || 
        sketchInfo.workType === "commonArea" || 
        sketchInfo.workType === "calibration"
        ) {
        if (vaEnteringAppearing !== null) {
          vaEnteringAppearing.set(data);
        }
      } else if (
        sketchInfo.workType === "vaPassing" || 
        sketchInfo.workType === "peoplecount"
        ) {
        if (vaPassing !== null) {
          vaPassing.set(data);
        }
      } else if (sketchInfo.workType === "autoTracking") {
        if (autoTracking !== null) {
          autoTracking.set(data);
        }
      } else if (sketchInfo.workType === "crop") {
        if (crop !== null) {
          crop.set(data);
        }
      } else if (sketchInfo.workType === "privacy") {
        if (privacy !== null) {
          privacy.set(data);
        }
      }
    },
    getErrorRange: function() {
      return (videoInfo.maxWidth / videoInfo.width) - 1;
    },
    changeFlag: function(data) {
      if (sketchInfo.workType === "mdSize") {
        mdSize.changeMdsizeFlag(data);
      } else if (
        sketchInfo.workType === "qmArea" || 
        sketchInfo.workType === "mdArea" || 
        sketchInfo.workType === "fdArea"
        ) {
        mdArea.changeMdDetectFlag(data);
      }
      //  else if (sketchInfo.workType === "vaEntering" || sketchInfo.workType === "vaAppearing") {  
      // }
    },
    changeRatio: function(data) {
      if (sketchInfo.workType === "crop") {
        crop.changeRatio(data);
      }
    },
    setEnableForSVG: function(index, enableOption) {
      if (kindSVGCustomObj !== null) {
        if (
          sketchInfo.workType === "vaPassing" || 
          sketchInfo.workType === "peoplecount"
          ) {
          vaPassing.setEnableForSVG(index, enableOption);
        } else {
          vaEnteringAppearing.setEnableForSVG(index, enableOption);
        }
      }
    },
    moveTopLayer: function(index) {
      if (
        svgObjs.length !== 0 &&
        index in svgObjs &&
        "moveTopLayer" in svgObjs[index]
        ) {
        svgObjs[index].moveTopLayer();
      }
    },
    activeShape: function(index) {
      if (kindSVGCustomObj !== null) {
        if (
          sketchInfo.workType === "vaPassing" || 
          sketchInfo.workType === "peoplecount"
          ) {
          vaPassing.activeShape(index);
        } else {
          vaEnteringAppearing.activeShape(index);
        }
      }
    },
    changeMinSizeOption: changeMinSizeOption,
    changeMaxSizeOption: changeMaxSizeOption,
    changeRectangleToSize: changeRectangleToSize,
    alignCenter: function() {
      if (svgObjs.length > 0) {
        vaEnteringAppearing.alignCenter();
      }
    },
    removeDrawingGeometry: function() {
      if (kindSVGCustomObj !== null) {
        kindSVGCustomObj.removeDrawingGeometry();
      }
    },
    changeArrow: function(index, arrow) {
      if (kindSVGCustomObj !== null) {
        if (
          sketchInfo.workType === "vaPassing" || 
          sketchInfo.workType === "peoplecount"
          ) {
          vaPassing.changeArrow(index, arrow);
        }
      }
    },
    stopEvent: function() {
      if (kindSVGEditor !== null) {
        for (var i = 0, ii = svgObjs.length; i < ii; i++) {
          svgObjs[i].stopEvent();
        }
      }
    },
    startEvent: function() {
      if (kindSVGEditor !== null) {
        for (var i = 0, ii = svgObjs.length; i < ii; i++) {
          svgObjs[i].startEvent();
        }
      }
    },
    hideGeometry: function(index) {
      if (kindSVGEditor !== null) {
        svgObjs[index].hide();
      }
    },
    showGeometry: function(index) {
      if (kindSVGEditor !== null) {
        svgObjs[index].show();
      }
    },
    //TNB
    changeWFDFillColor: function(strokeColor) {
      if (kindSVGEditor !== null) {
        colorFactory.circleForMETAInFD = strokeColor;
        vaEnteringAppearing.changeWFDFillColor(strokeColor);
      }
    },
    drawMetaDataAll: function(metaData, expire) {
      var DELAY_TIME = 300;
      var expireTime = typeof expire === "undefined" ? DELAY_TIME : expire;
      var canvasType = 0;
      var clearTimer = function() {
        clearTimeout(drawMetaDataTimer);
        drawMetaDataTimer = null;
      };
      var clear = function() {
        clearRect(canvasType);
        clearTimer();
      };

      if (drawMetaDataTimer !== null) {
        clear();
      }

      for (var i = 0, ii = metaData.length; i < ii; i++) {
        this.drawMetaData.apply(this, metaData[i]);
      }

      drawMetaDataTimer = setTimeout(clear, expireTime);
    },
    /**
     *  @param isCircle {Boolean} Face Detection 분류
     */
    drawMetaData: function(left, right, top, bottom, scale, translate, _colorType, isCircle) {
      var canvasType = 0;
      var colorType = typeof _colorType === "undefined" ? 0 : _colorType;

      /*--------VA 전달받은 방식-----------------*/
      var coordinateSystemWidth = parseInt((1 - translate[0]) / scale[0]);
      var coordinateSystemHeight = parseInt((-1 - translate[1]) / scale[1]);

      var DIS_RADIUS = 1; //var DIS_RADIUS = 1.2; 8월 변경점 적용 예정
      var DOUBLE_INDEX = 2;

      var magnification = this.DISMode ? DIS_RADIUS : 1;

      var scaleZ = 1 / magnification;
      var scaleViewWidth = videoInfo.width * scaleZ;
      var scaleViewHeight = videoInfo.height * scaleZ;

      var ratioX = scaleViewWidth / coordinateSystemWidth;
      var ratioY = scaleViewHeight / coordinateSystemHeight;

      var offsetX = (videoInfo.width - scaleViewWidth) / DOUBLE_INDEX;
      var offsetY = (videoInfo.height - scaleViewHeight) / DOUBLE_INDEX;

      var x1 = parseInt((left * ratioX) + offsetX);
      var y1 = parseInt((top * ratioY) + offsetY);
      var x2 = parseInt((right * ratioX) + offsetX);
      var y2 = parseInt((bottom * ratioY) + offsetY);

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

      var radius = width / DOUBLE_INDEX;

      if (isCircle === true) {
        drawCircle(
          canvasType,
          colorType,
          startX + radius,
          startY + radius,
          radius,
          true
        );
      } else {
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
      width: 0,
      height: 0
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
      coordinates = [];
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
      mdSizeMousedown: function(event) {
        if (event.which !== 1) {
          return;
        }
        var coord = getCoordinate(event, this);
        rectPos.startX = coord[0];
        rectPos.startY = coord[1];
        firstDrawClick = true;
        isDrawDragging = false;
      },
      mdSizeMousemove: function(event) {
        var coord = getCoordinate(event, frontCanvas);
        var xVal = coord[0];
        var yVal = coord[1];
        var colorType = sizeFlag === 0 ? 1 : 0;

        if (firstDrawClick) {
          rectPos.width = xVal - rectPos.startX;
          rectPos.height = yVal - rectPos.startY;
          rectPos.endX = xVal;
          rectPos.endY = yVal;
          clearRect(0);
          if ((rectPos.startX + rectPos.width) > videoInfo.width) {
            rectPos.width = frontCanvas.width - rectPos.startX;
          } else if ((rectPos.startX + rectPos.width) < 0) {
            rectPos.width = (-1) * rectPos.startX;
          }
          if ((rectPos.startY + rectPos.height) > videoInfo.height) {
            rectPos.height = videoInfo.height - rectPos.startY;
          } else if ((rectPos.startY + rectPos.height) < 0) {
            rectPos.height = (-1) * rectPos.startY;
          }

          drawStroke(0, colorType, rectPos.startX, rectPos.startY, rectPos.width, rectPos.height);
        }
        isDrawDragging = true;
      },
      mdSizeMouseup: function() {
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
          rectPos.width = Math.abs(rectPos.width);
          rectPos.height = Math.abs(rectPos.height);
          var actualWidth = parseInt(
            rectPos.width * (videoInfo.maxWidth / videoInfo.width),
            10
          );
          var actualHeight = parseInt(
            rectPos.height * (videoInfo.maxHeight / videoInfo.height),
            10
          );
          if (actualWidth > sketchInfo.minAreaSize && actualHeight > sketchInfo.minAreaSize) {
            if (sizeFlag === 0) {
              if (
                !(
                  rectPos.width > coordinates[1].width ||
                  rectPos.height > coordinates[1].height
                )
                ) {
                coordinates[0].x1 = x1;
                coordinates[0].y1 = y1;
                coordinates[0].width = rectPos.width;
                coordinates[0].height = rectPos.height;
              }
            } else {
              if (
                !(
                  rectPos.width < coordinates[0].width ||
                  rectPos.height < coordinates[0].height
                )
              ) {
                coordinates[1].x1 = x1;
                coordinates[1].y1 = y1;
                coordinates[1].width = rectPos.width;
                coordinates[1].height = rectPos.height;
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
          drawRectangle(
            0, 
            1, 
            coordinates[0].x1, 
            coordinates[0].y1, 
            coordinates[0].width, 
            coordinates[0].height
          );
          drawRectangle(
            1, 
            0, 
            coordinates[1].x1, 
            coordinates[1].y1, 
            coordinates[1].width, 
            coordinates[1].height
          );
        } else {
          drawRectangle(
            0, 
            0, 
            coordinates[1].x1, 
            coordinates[1].y1, 
            coordinates[1].width, 
            coordinates[1].height
          );
          drawRectangle(
            1, 
            1, 
            coordinates[0].x1, 
            coordinates[0].y1, 
            coordinates[0].width, 
            coordinates[0].height
          );
        }
        if (updateCoordinates !== null && typeof updateCoordinates === "function") {
          if (!isInit) {
            updateCoordinates();
          }
        }
      },
      changeMdsizeFlag: function(data) {
        sizeFlag = data;
        this.updateCanvas(true);
      },
      set: function(data, flag) {
        sizeFlag = flag;
        for (var i = 0; i < coordinates.length; i++) {
          coordinates[i].x1 = parseInt(
            data[i].x1 / (videoInfo.maxWidth / videoInfo.width),
            10
          );
          coordinates[i].y1 = parseInt(
            data[i].y1 / (videoInfo.maxHeight / videoInfo.height),
            10
          );
          coordinates[i].width = parseInt(
            data[i].width / (videoInfo.maxWidth / videoInfo.width),
            10
          );
          coordinates[i].height = parseInt(
            data[i].height / (videoInfo.maxHeight / videoInfo.height),
            10
          );
        }
        this.updateCanvas(true);
      },
      get: function() {
        var returnArray = [];
        for (var i = 0; i < coordinates.length; i++) {
          returnArray[i] = {
            x1: 0,
            y1: 0,
            width: 0,
            height: 0
          };
          returnArray[i].x1 = parseInt(
            coordinates[i].x1 * (videoInfo.maxWidth / videoInfo.width),
            10
          );
          returnArray[i].y1 = parseInt(
            coordinates[i].y1 * (videoInfo.maxHeight / videoInfo.height),
            10
          );
          returnArray[i].width = parseInt(
            coordinates[i].width * (videoInfo.maxWidth / videoInfo.width),
            10
          );
          returnArray[i].height = parseInt(
            coordinates[i].height * (videoInfo.maxHeight / videoInfo.height),
            10
          );
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
      width: 0,
      height: 0
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
      mousedownRectangle: function(event) {
        if (event.which !== 1) {
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
        var coord = getCoordinate(event, this);
        rectPos.startX = coord[0];
        rectPos.startY = coord[1];
        firstDrawClick = true;
        isDrawDragging = false;
      },
      mousemoveRectangle: function(event) {
        var coord = getCoordinate(event, frontCanvas);
        var xVal = coord[0];
        var yVal = coord[1];

        if (firstDrawClick) {
          rectPos.width = xVal - rectPos.startX;
          rectPos.height = yVal - rectPos.startY;
          rectPos.endX = xVal;
          rectPos.endY = yVal;
          fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          if (sketchInfo.workType === "simpleFocus") {
            bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          }
          if ((rectPos.startX + rectPos.width) > videoInfo.width) {
            rectPos.width = frontCanvas.width - rectPos.startX;
          } else if ((rectPos.startX + rectPos.width) < 0) {
            rectPos.width = (-1) * rectPos.startX;
          }
          if ((rectPos.startY + rectPos.height) > videoInfo.height) {
            rectPos.height = videoInfo.height - rectPos.startY;
          } else if ((rectPos.startY + rectPos.height) < 0) {
            rectPos.height = (-1) * rectPos.startY;
          }
          if (detectFlag === 0) {
            fContext.strokeStyle = colorFactory.red;
          } else {
            fContext.strokeStyle = colorFactory.blue;
          }
          fContext.strokeRect(rectPos.startX, rectPos.startY, rectPos.width, rectPos.height);
        }
        isDrawDragging = true;
      },
      mouseupRectangle: function() {
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
          var idx = 0;
          if (sketchInfo.workType === "smartCodec") {
            for (idx = 0; idx < coordinates.length; idx++) {
              if (
                coordinates[idx].isSet &&
                x1 <= coordinates[idx].x2 &&
                coordinates[idx].x1 <= x2 &&
                y1 <= coordinates[idx].y2 &&
                coordinates[idx].y1 <= y2
                ) {
                isDuplicateArea = true;
              }
            }
          }
          if (!((x1 === x2 || y1 === y2) || isDuplicateArea)) {
            for (idx = 0; idx < coordinates.length; idx++) {
              if (!coordinates[idx].isSet) {
                coordinates[idx].isSet = true;
                coordinates[idx].x1 = x1;
                coordinates[idx].y1 = y1;
                coordinates[idx].x2 = x2;
                coordinates[idx].y2 = y2;
                break;
              }
            }
          }
          fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          _self.updateRectangle(false);
          isDrawDragging = false;
        }
      },
      contextmenuRectangle: function(event) {
        if (sketchInfo.workType === "smartCodec") {
          event.preventDefault();
          return false;
        } else if (sketchInfo.workType === "simpleFocus") {
          coordinates[0].isSet = false;
          coordinates[0].x1 = 0;
          coordinates[0].y1 = 0;
          coordinates[0].x2 = 0;
          coordinates[0].y2 = 0;
          _self.updateRectangle(false);
          event.preventDefault();
          return false;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];

        for (var i = 0; i < coordinates.length; i++) {
          if (coordinates[i].isSet) {
            if (
              coordinates[i].x1 <= xVal &&
              xVal <= coordinates[i].x2 &&
              coordinates[i].y1 <= yVal &&
              yVal <= coordinates[i].y2
              ) {
              _self.openDialog(i);
              event.preventDefault();
              return false;
            }
          }
        }
        event.preventDefault();
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
            bContext.strokeRect(
              coordinates[i].x1, 
              coordinates[i].y1, 
              coordinates[i].x2 - coordinates[i].x1, 
              coordinates[i].y2 - coordinates[i].y1
            );
            bContext.globalAlpha = alphaFactory.enabled.fill;
            bContext.fillRect(
              coordinates[i].x1, 
              coordinates[i].y1, 
              coordinates[i].x2 - coordinates[i].x1, 
              coordinates[i].y2 - coordinates[i].y1
            );
            bContext.globalAlpha = alphaFactory.enabled.stroke;
          }
        }
        if (updateCoordinates !== null && typeof updateCoordinates === "function") {
          if (!isInit) {
            updateCoordinates();
          }
        }
      },
      mouseclickPolygon: function(event) {
        if (!_self.checkDrawAvailable()) {
          return;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];
        var color = detectFlag === 0 ? colorFactory.red : colorFactory.blue;
        var MIN_SIZE = 20;
        var CLICK_COUNT = {
          SECOND: 2,
          THIRD: 3,
          FORTH: 4
        };

        if (lineDistance(Ax, Ay, xVal, yVal) < MIN_SIZE) {
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
        } else if (index === CLICK_COUNT.SECOND) {
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
        } else if (index === CLICK_COUNT.THIRD) {
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
        } else if (index === CLICK_COUNT.FORTH) {
          x4 = xVal;
          y4 = yVal;
          var aAxis = {
              x: x1,
              y: y1
            },
            cAxis = {
              x: x3,
              y: y3
            },
            bAxis = {
              x: x2,
              y: y2
            };
          var dAxis = {
            x: x4,
            y: y4
          };
          var totAngle = Math.floor(getAngleABC(aAxis, bAxis, cAxis)) + 
            Math.floor(getAngleABC(bAxis, cAxis, dAxis)) + 
            Math.floor(getAngleABC(cAxis, dAxis, aAxis)) + 
            Math.floor(getAngleABC(dAxis, aAxis, bAxis));
          var MIN_ANGLE = 170;

          if (
            Math.abs(totAngle) <= 1 ||
            Math.abs(getAngleABC(dAxis, aAxis, bAxis)) > MIN_ANGLE
            ) {
            return;
          } else if (distToSegment(aAxis, dAxis, cAxis) < MIN_SIZE) {
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
      mousemovePolygon: function(event) {
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];

        if (isDrawDragging) {
          fContext.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
          if (detectFlag === 0) {
            fContext.strokeStyle = colorFactory.red;
          } else {
            fContext.strokeStyle = colorFactory.blue;
          }
          fContext.beginPath();
          fContext.moveTo(Ax, Ay);
          fContext.lineTo(xVal, yVal);
          fContext.stroke();
          fContext.closePath();
        }
      },
      contexmenuPolygon: function(event) {
        if (isDrawDragging) {
          fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          _self.updatePolygon();
          isDrawDragging = false;
          index = 1;
        } else {
          var coord = getCoordinate(event, this);
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
              var polygonPoints = [
                {
                  x: x1,
                  y: y1
                }, 
                {
                  x: x2,
                  y: y2
                }, 
                {
                  x: x3,
                  y: y3
                }, 
                {
                  x: x4,
                  y: y4
                }, 
                {
                  x: x1,
                  y: y1
                }
              ];
              if (
                isPointInPoly(
                  polygonPoints, 
                  {
                    x: xVal,
                    y: yVal
                  }
                )
              ) {
                _self.openDialog(i);
                event.ventDefault();
                return false;
              }
            }
          }
        }
        event.ventDefault();
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
          if (!isInit) {
            updateCoordinates();
          }
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
        var COOR_INDEX = {
          FIRST: 0,
          SECOND: 1,
          THIRD: 2,
          FORTH: 3
        };
        detectFlag = flag;
        for (var i = 0; i < coordinates.length; i++) {
          if (typeof data[i] !== "undefined") {
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
            coordinates[i].x1 = point.xpos[COOR_INDEX.FIRST];
            coordinates[i].y1 = point.ypos[COOR_INDEX.FIRST];
            coordinates[i].x2 = point.xpos[COOR_INDEX.SECOND];
            coordinates[i].y2 = point.ypos[COOR_INDEX.SECOND];
            if (sketchInfo.shape === 1) {
              coordinates[i].x3 = point.xpos[COOR_INDEX.THIRD];
              coordinates[i].y3 = point.ypos[COOR_INDEX.THIRD];
              coordinates[i].x4 = point.xpos[COOR_INDEX.FORTH];
              coordinates[i].y4 = point.ypos[COOR_INDEX.FORTH];
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
        var COOR_INDEX = {
          FIRST: 0,
          SECOND: 1,
          THIRD: 2,
          FORTH: 3
        };
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
            returnArray[i].x1 = point.xpos[COOR_INDEX.FIRST];
            returnArray[i].y1 = point.ypos[COOR_INDEX.FIRST];
            returnArray[i].x2 = point.xpos[COOR_INDEX.SECOND];
            returnArray[i].y2 = point.ypos[COOR_INDEX.SECOND];
            if (sketchInfo.shape === 1) {
              returnArray[i].x3 = point.xpos[COOR_INDEX.THIRD];
              returnArray[i].y3 = point.ypos[COOR_INDEX.THIRD];
              returnArray[i].x4 = point.xpos[COOR_INDEX.FORTH];
              returnArray[i].y4 = point.ypos[COOR_INDEX.FORTH];
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
          windowClass: 'modal-position-middle',
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
      width: 0,
      height: 0
    };
    var index = 1;
    var coordinates = null;
    var _self = null;
    var selectedCoordinates = null;
    var PRIVACY_LINE_WIDTH = 3;

    function setColor() {
      fContext.lineWidth = PRIVACY_LINE_WIDTH;
      fContext.globalAlpha = "1";
      fContext.strokeStyle = colorFactory.blue;
      fContext.fillStyle = colorFactory.blue;
      bContext.lineWidth = PRIVACY_LINE_WIDTH;
      bContext.strokeStyle = colorFactory.blue;
      bContext.fillStyle = colorFactory.blue;
    }

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

      setColor();
    }
    constructor.prototype = {
      mousedownRectangle: function(event) {
        var popup = $("[id^='privacy-popup-']").length;
        if (popup) {
          return;
        }
        if (event.which !== 1) {
          return;
        }
        if (!_self.checkDrawAvailable()) {
          return;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];

        rectPos.startX = xVal;
        rectPos.startY = yVal;
        firstDrawClick = true;
        isDrawDragging = false;
      },
      mousemoveRectangle: function(event) {
        var coord = getCoordinate(event, frontCanvas);
        var xVal = coord[0];
        var yVal = coord[1];

        if (firstDrawClick) {
          bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          rectPos.width = xVal - rectPos.startX;
          rectPos.height = yVal - rectPos.startY;
          rectPos.endX = xVal;
          rectPos.endY = yVal;
          fContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
          if ((rectPos.startX + rectPos.width) > videoInfo.width) {
            rectPos.width = frontCanvas.width - rectPos.startX;
          } else if ((rectPos.startX + rectPos.width) < 0) {
            rectPos.width = (-1) * rectPos.startX;
          }
          if ((rectPos.startY + rectPos.height) > videoInfo.height) {
            rectPos.height = videoInfo.height - rectPos.startY;
          } else if ((rectPos.startY + rectPos.height) < 0) {
            rectPos.height = (-1) * rectPos.startY;
          }

          fContext.globalAlpha = alphaFactory.enabled.fill;
          fContext.fillRect(rectPos.startX, rectPos.startY, rectPos.width, rectPos.height);
          fContext.globalAlpha = alphaFactory.enabled.stroke;

          fContext.strokeRect(rectPos.startX, rectPos.startY, rectPos.width, rectPos.height);
        }
        isDrawDragging = true;
      },
      mouseupRectangle: function() {
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
      contextmenuRectangle: function(event) {
        //mouse right click
        event.ventDefault();
        return false;
      },
      updateRectangle: function(isInit) {
        clearRect(1);
        bContext.globalAlpha = alphaFactory.enabled.stroke;
        bContext.strokeStyle = colorFactory.darkBlue;
        bContext.strokeRect(
          coordinates.x1, 
          coordinates.y1, 
          coordinates.x2 - coordinates.x1, 
          coordinates.y2 - coordinates.y1
        );
        if (!isInit) {
          bContext.globalAlpha = alphaFactory.enabled.fill;
          bContext.fillRect(
            coordinates.x1, 
            coordinates.y1, 
            coordinates.x2 - coordinates.x1, 
            coordinates.y2 - coordinates.y1
          );
          bContext.globalAlpha = alphaFactory.enabled.stroke;
        }
        if (updateCoordinates !== null && typeof updateCoordinates === "function") {
          if (
            !isInit &&
            typeof sketchInfo.disValue !== "undefined" &&
            !sketchInfo.disValue
            ) {
            updateCoordinates();
          }
          /////////////////////
          sketchInfo.getZoomValue().then(function(returnZoomValue) {
            if (
              !isInit &&
              typeof sketchInfo.disValue !== "undefined" &&
              !sketchInfo.disValue &&
              returnZoomValue <= sketchInfo.MaxZoomValue
              ) {
              updateCoordinates();
            }
          });
        }
      },
      mouseclickPolygon: function(event) {
        if (!_self.checkDrawAvailable()) {
          return;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];
        var MIN_SIZE = 20;
        var CLICK_COUNT = {
          SECOND: 2,
          THIRD: 3,
          FORTH: 4
        };

        if (lineDistance(Ax, Ay, xVal, yVal) < MIN_SIZE) {
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
        } else if (index === CLICK_COUNT.SECOND) {
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
        } else if (index === CLICK_COUNT.THIRD) {
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
        } else if (index === CLICK_COUNT.FORTH) {
          x4 = xVal;
          y4 = yVal;
          var aAxis = {
              x: x1,
              y: y1
            },
            cAxis = {
              x: x3,
              y: y3
            },
            bAxis = {
              x: x2,
              y: y2
            };
          var dAxis = {
            x: x4,
            y: y4
          };
          var totAngle = Math.floor(getAngleABC(aAxis, bAxis, cAxis)) + 
            Math.floor(getAngleABC(bAxis, cAxis, dAxis)) + 
            Math.floor(getAngleABC(cAxis, dAxis, aAxis)) + 
            Math.floor(getAngleABC(dAxis, aAxis, bAxis));
          var MIN_ANGLE = 170;
          if (
            Math.abs(totAngle) <= 1 || 
            Math.abs(getAngleABC(dAxis, aAxis, bAxis)) > MIN_ANGLE
            ) {
            return;
          } else if (distToSegment(aAxis, dAxis, cAxis) < MIN_SIZE) {
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
          bContext.fillPolygon(
            polygonPoints, 
            colorFactory.blue, 
            colorFactory.blue
          );
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
      mousemovePolygon: function(event) {
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];
        var drawLine = function(startX, startY, endX, endY) {
          fContext.beginPath();
          fContext.moveTo(startX, startY);
          fContext.lineTo(endX, endY);
          fContext.stroke();
          fContext.closePath();
        };
        var CLICK_COUNT = {
          SECOND: 2,
          THIRD: 3,
          FORTH: 4
        };
        var polygonPoints = [];

        if (isDrawDragging) {
          clearRect(0);
          if (index > CLICK_COUNT.SECOND) {
            polygonPoints = [
              [x1, y1],
              [x2, y2]
            ];

            if (index === CLICK_COUNT.FORTH) {
              polygonPoints.push([x3, y3]);
            }

            polygonPoints.push([xVal, yVal]);

            fContext.fillPolygon(
              polygonPoints,
              colorFactory.blue,
              colorFactory.blue
            );
          }

          fContext.globalAlpha = alphaFactory.enabled.stroke;

          drawLine(Ax, Ay, xVal, yVal);
          if (index > CLICK_COUNT.SECOND) {
            drawLine(x1, y1, xVal, yVal);
          }
        }
      },
      contexmenuPolygon: function(event) {
        if (isDrawDragging) {
          clearRect(0);
          clearRect(1);
          //_self.updatePolygon();
          isDrawDragging = false;
          index = 1;
        } else {
          var coord = getCoordinate(event, this);
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
          if (
            isPointInPoly(
              polygonPoints,
              {
                x: xVal,
                y: yVal
              }
            )
            ) {
            event.ventDefault();
            return false;
          }
        }
        event.ventDefault();
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
          bContext.fillPolygon(
            polygonPoints,
            colorFactory.blue,
            colorFactory.blue
          );
          bContext.globalAlpha = alphaFactory.enabled.stroke;
        }
        if (
          updateCoordinates !== null && 
          typeof updateCoordinates === "function"
          ) {
          if (!isInit) {
            updateCoordinates();
          }
        }
      },
      drawArea: function(data) {
        var xpos = [0, 0, 0, 0];
        var ypos = [0, 0, 0, 0];
        var COOR_INDEX = {
          FIRST: 0,
          SECOND: 1,
          THIRD: 2,
          FORTH: 3
        };
        if (sketchInfo.shape === 0) { //rectangle
          xpos = [data.x1, data.x2];
          ypos = [data.y1, data.y2];
        } else {
          xpos = [data.x1, data.x2, data.x3, data.x4];
          ypos = [data.y1, data.y2, data.y3, data.y4];
        }
        var point = convertPoint(xpos, ypos, 'set');
        coordinates.x1 = point.xpos[COOR_INDEX.FIRST];
        coordinates.y1 = point.ypos[COOR_INDEX.FIRST];
        coordinates.x2 = point.xpos[COOR_INDEX.SECOND];
        coordinates.y2 = point.ypos[COOR_INDEX.SECOND];
        if (sketchInfo.shape === 1) { //polygon
          coordinates.x3 = point.xpos[COOR_INDEX.THIRD];
          coordinates.y3 = point.ypos[COOR_INDEX.THIRD];
          coordinates.x4 = point.xpos[COOR_INDEX.FORTH];
          coordinates.y4 = point.ypos[COOR_INDEX.FORTH];
        }
        if (sketchInfo.shape === 0) {
          _self.updateRectangle(true);
        } else {
          _self.updatePolygon(true);
        }
      },
      set: function(data) {
        setColor();
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
          } else {
            selectedCoordinates = null;
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
        var COOR_INDEX = {
          FIRST: 0,
          SECOND: 1,
          THIRD: 2,
          FORTH: 3
        };
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
          xpos = [
            coordinates.x1, 
            coordinates.x2, 
            coordinates.x3, 
            coordinates.x4
          ];
          ypos = [
            coordinates.y1, 
            coordinates.y2, 
            coordinates.y3, 
            coordinates.y4
          ];
        }
        var point = convertPoint(xpos, ypos, 'get');
        returnArray.x1 = point.xpos[COOR_INDEX.FIRST];
        returnArray.y1 = point.ypos[COOR_INDEX.FIRST];
        returnArray.x2 = point.xpos[COOR_INDEX.SECOND];
        returnArray.y2 = point.ypos[COOR_INDEX.SECOND];
        if (sketchInfo.shape === 1) {
          returnArray.x3 = point.xpos[COOR_INDEX.THIRD];
          returnArray.y3 = point.ypos[COOR_INDEX.THIRD];
          returnArray.x4 = point.xpos[COOR_INDEX.FORTH];
          returnArray.y4 = point.ypos[COOR_INDEX.FORTH];
        }
        return returnArray;
      },
      openDialog: function(index) {
        var modalInstance = {};
        sketchInfo.getZoomValue().then(function(returnZoomValue) { /////
          if (
            (videoInfo.support_ptz || videoInfo.support_zoomOnly) &&
            (
              sketchInfo.disValue === true ||
              returnZoomValue > sketchInfo.MaxZoomValue
            )
            ) {
            $("[type='radio'][name='VideoOutput']").prop("disabled", true);
            modalInstance = dialog.open({
              templateUrl: "privacyPopup3.html",
              backdrop: false,
              controller: [
                '$scope',
                '$uibModalInstance',
                '$timeout',
                'Attributes',
                'COMMONUtils',
                'sketchbookService',
                function(
                  $scope,
                  $uibModalInstance,
                  $timeout,
                  Attributes,
                  COMMONUtils,
                  sketchbookService
                  ) {
                  $scope.message = sketchInfo.message;
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
                    var MAGIC_NUMBER = 30;
                    var DOUBLE_INDEX = 2;
                    var privacyDialog = $("#privacy-popup-3");
                    var width = (privacyDialog.parent().width() + MAGIC_NUMBER);
                    var height = (privacyDialog.parent().height() + MAGIC_NUMBER);
                    privacyDialog.parents(".modal").draggable().css({
                      width: (privacyDialog.width() + MAGIC_NUMBER) + "px",
                      height: (privacyDialog.height() + MAGIC_NUMBER) + "px",
                      top: "calc(50% - " + (height / DOUBLE_INDEX) + "px)",
                      left: "calc(50% - " + (width / DOUBLE_INDEX) + "px)"
                    }).find(".modal-dialog").css({
                      margin: 0
                    });
                  });
                }
              ]
            });
            modalInstance.result.finally(function() {
              $("[type='radio'][name='VideoOutput']").prop("disabled", false);
              bContext.clearRect(0, 0, videoInfo.width, videoInfo.height);
            });
          } else {
            $("[type='radio'][name='VideoOutput']").prop("disabled", true);
            modalInstance = dialog.open({
              templateUrl: sketchInfo.modalId,
              windowClass: 'modal-position-middle',
              backdrop: true,
              controller: [
                '$scope',
                '$uibModalInstance',
                '$timeout',
                'Attributes',
                'COMMONUtils',
                'sketchbookService',
                '$interval',
                'SunapiClient',
                'CAMERA_STATUS',
                'UniversialManagerService',
                function(
                  $scope,
                  $uibModalInstance,
                  $timeout,
                  Attributes,
                  COMMONUtils,
                  sketchbookService,
                  $interval,
                  SunapiClient,
                  CAMERA_STATUS,
                  UniversialManagerService
                  ) {
                  var mAttr = Attributes.get("image");
                  $scope.modalValue = {};
                  $scope.ColorOptions = mAttr.ColorOptions;
                  $scope.modalValue.MaskColor = $scope.ColorOptions[0];
                  $scope.PrivacyAreaMaxLen = mAttr.PrivacyMaskMaxLen.maxLength;
                  $scope.PrivacyAreaPattern = "^[a-zA-Z0-9-.]*$";
                  $scope.IsPTZ = mAttr.PTZModel;
                  $scope.IsZoomOnly = mAttr.ZoomOnlyModel;
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
                        'position': [
                          coor.x1,
                          coor.y1,
                          coor.x2,
                          coor.y2,
                          coor.x3,
                          coor.y3,
                          coor.x4,
                          coor.y4
                        ].join(",")
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
                  if ($scope.IsPTZ || $scope.IsZoomOnly) {
                    $timeout(function() {
                      var MAGIC_NUMBER = 30;
                      var DOUBLE_INDEX = 2;
                      var privacyDialog = $("#privacy-popup-1");
                      var width = (privacyDialog.parent().width() + MAGIC_NUMBER);
                      var height = (privacyDialog.parent().height() + MAGIC_NUMBER);
                      privacyDialog.parents(".modal").draggable().css({
                        width: (privacyDialog.width() + MAGIC_NUMBER) + "px",
                        height: (privacyDialog.height() + MAGIC_NUMBER) + "px",
                        top: "calc(50% - " + (height / DOUBLE_INDEX) + "px)",
                        left: "calc(50% - " + (width / DOUBLE_INDEX) + "px)"
                      }).find(".modal-dialog").css({
                        margin: 0
                      });

                      // ptz privacy popup jog
                      $("#ptz-control_move-btn-popup").unbind();
                      $("#ptz-control_box-popup").unbind();
                      var isDrag = false;
                      var isMove = false;
                      var animateDuration = 50;
                      var PAN_RATIO = 1.495;
                      var TILT_RATIO = 1.790;
                      var downTimer = null;
                      var ptzJogTimer = null;
                      var isJogUpdating = false;
                      var isPtzControlStart = false;
                      var PLUS_MAGIC_NUMBER = 100;
                      var MINUS_MAGIC_NUMBER = -100;

                      function ptzStop() {
                        if (ptzJogTimer !== null) {
                          $interval.cancel(ptzJogTimer);
                          ptzJogTimer = null;
                        }
                        if (!isPtzControlStart) {
                          return;
                        }
                        var setData = {};
                        setData.Channel = 0;
                        setData.OperationType = 'All';

                        isPtzControlStart = false;
                        SunapiClient.get(
                          '/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control', 
                          setData,
                          function() {},
                          function() {}, '', true);
                      }

                      function makeJogTimer() {
                        var DELAY_TIME = 100;
                        ptzJogTimer = $interval(function() {
                          isJogUpdating = false;
                        }, DELAY_TIME);
                      }

                      function ptzLimitCheck(_data) {
                        var data = _data;
                        if (data > PLUS_MAGIC_NUMBER) {
                          data = PLUS_MAGIC_NUMBER;
                        } else if (data < MINUS_MAGIC_NUMBER) {
                          data = MINUS_MAGIC_NUMBER;
                        }

                        return data;
                      }

                      function ptzJogMove(xPos, yPos) {
                        var setData = {};
                        setData.Channel = 0;
                        setData.NormalizedSpeed = 'True';
                        setData.Pan = ptzLimitCheck(xPos);
                        setData.Tilt = ptzLimitCheck(yPos);
                        setData.Zoom = 0;

                        if (ptzJogTimer === null) {
                          makeJogTimer();
                        }

                        if (isJogUpdating === false) {
                          isPtzControlStart = true;
                          SunapiClient.get(
                            '/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', 
                            setData,
                            function() {},
                            function() {}, '', true);

                          isJogUpdating = true;
                        }
                      }

                      $("#ptz-control_move-btn-popup").draggable({
                        containment: "parent",
                        revert: false,
                        revertDuration: 100,
                        drag: function() {
                          isDrag = true;
                          isMove = false;
                          var offset = $(this).position();
                          var xPos = (offset.left);
                          var yPos = (offset.top);
                          xPos *= PAN_RATIO;
                          yPos *= TILT_RATIO;

                          xPos = parseInt(xPos, 10) - PLUS_MAGIC_NUMBER;
                          yPos = -(parseInt(yPos, 10) - PLUS_MAGIC_NUMBER);
                          if (-4 < yPos && yPos < 4) {
                            yPos = 0;
                          }
                          if (-2 < xPos && xPos < 2) {
                            xPos = 0;
                          }
                          ptzJogMove(xPos, yPos);
                        },
                        stop: function() {
                          if (!(!isDrag && !isMove)) {
                            isDrag = false;
                            isMove = false;
                            var moveAreaWidth = $('#ptz-control_box-popup').width();
                            var moveAreaHeight = $('#ptz-control_box-popup').height();
                            $('#ptz-control_move-btn-popup').animate({
                              top: ((moveAreaHeight / 2) - 12),
                              left: ((moveAreaWidth / 2) - 12)
                            }, animateDuration, function() {
                              ptzStop();
                            });
                          }
                        }
                      });
                      $("#ptz-control_box-wrap").mousedown(function(event) {
                        event.stopPropagation();
                      });
                      $("#ptz-control_box-popup").mousedown(function(event) {
                        if (isDrag || isMove || event.which !== 1) {
                          return;
                        }
                        isMove = true;
                        var jogWidth = $('#ptz-control_move-btn-popup').width() / 2;

                        var moveAreaPos = $('#ptz-control_box-popup').offset();
                        var moveAreaWidth = $('#ptz-control_box-popup').width();
                        var moveAreaHeight = $('#ptz-control_box-popup').height();
                        var jogPos = $('#ptz-control_move-btn-popup').offset();
                        var jogLeft = jogPos.left + jogWidth;
                        var jogTop = jogPos.top + jogWidth;
                        var xPos = event.pageX;
                        var yPos = event.pageY;

                        if (window.navigator.msPointerEnabled) {
                          if ($(window).scrollLeft() !== 0 && event.pageX === event.clientX) {
                            xPos = xPos + $(window).scrollLeft();
                          }
                          if ($(window).scrollTop() !== 0 && event.pageY === event.clientY) {
                            yPos = yPos + $(window).scrollTop();
                          }
                        }
                        if (xPos <= (moveAreaPos.left + jogWidth)) {
                          xPos = (moveAreaPos.left + jogWidth);
                        } else if (xPos >= (moveAreaWidth + moveAreaPos.left - jogWidth)) {
                          xPos = moveAreaWidth + moveAreaPos.left - jogWidth;
                        }

                        if (yPos <= (moveAreaPos.top + jogWidth)) {
                          yPos = moveAreaPos.top + jogWidth;
                        } else if (yPos >= (moveAreaPos.top + moveAreaHeight - jogWidth)) {
                          yPos = moveAreaPos.top + moveAreaHeight - jogWidth;
                        }

                        xPos = xPos - jogLeft;
                        yPos = jogTop - yPos;
                        if (-4 <= xPos && xPos <= 4) {
                          xPos = 0;
                        }
                        if (-2 <= yPos && yPos <= 2) {
                          yPos = 0;
                        }

                        $('#ptz-control_move-btn-popup').animate({
                          top: ((moveAreaHeight / 2) - 12) - yPos,
                          left: ((moveAreaWidth / 2) - 12) + xPos
                        }, animateDuration, function() {
                          xPos *= PAN_RATIO;
                          yPos *= TILT_RATIO;

                          ptzJogMove(xPos, yPos);
                          if (isMove === true) {
                            clearTimeout(downTimer);
                            downTimer = setTimeout(function() {
                              $('#ptz-control_move-btn-popup').trigger(event);
                            }, animateDuration);
                          }
                        });
                        event.ventDefault();
                      });
                      $('#ptz-control_box-popup,#ptz-control_move-btn-popup').
                        mouseup(function(event) {
                          clearTimeout(downTimer);
                          event.ventDefault();
                          if (!(!isDrag && !isMove)) {
                            isDrag = false;
                            isMove = false;
                            var moveAreaWidth = $('#ptz-control_box-popup').width();
                            var moveAreaHeight = $('#ptz-control_box-popup').height();
                            $('#ptz-control_move-btn-popup').animate({
                              top: (moveAreaHeight / 2 - 12),
                              left: (moveAreaWidth / 2 - 12)
                            }, animateDuration, function() {
                              ptzStop();
                            });
                          }
                        });
                      // ptz privacy popup jog end
                    });
                  }
                }
              ]
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
    var coordinates = null;
    var _self = null;

    var preMinWidth = 0;
    var preMinHeight = 0;
    var preMaxWidth = 0;
    var preMaxHeight = 0;

    var kindSvgOptions = {};

    function constructor() {
      /* jshint validthis: true */
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

        if (
          sketchInfo.workType === "qmArea" ||
          sketchInfo.workType === "mdArea" ||
          sketchInfo.workType === "fdArea"
        ) {
          coordinates[i].enExAppear = sketchInfo.color;
        } else if (
          sketchInfo.workType === "vaAppearing" &&
          sketchInfo.hasOwnProperty('mode')) {
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
          end: function(obj) {
            _self.addSVGObj(obj, true);
          },
          mouseup: function(data) {
            var width = 0;
            var height = 0;

            if (typeof this.lineIndex !== "undefined") {
              _self.notifyUpdate(this.lineIndex, data);

              //IVA Common Area 에서만 사용
              if (sketchInfo.workType === "commonArea") {
                width = data.points[2][0] - data.points[0][0];
                height = data.points[2][1] - data.points[0][1];

                if (this.lineIndex === 0) {
                  svgObjs[1].changeMinSizeOption({
                    width: width,
                    height: height
                  });
                } else {
                  svgObjs[0].changeMaxSizeOption({
                    width: width,
                    height: height
                  });
                }
              }
            }
          }
        }
      };

      if (sketchInfo.color === 1) {
        kindSvgOptions.fillColor = colorFactory.excludeArea.fill;
        kindSvgOptions.lineColor = colorFactory.excludeArea.line;
        kindSvgOptions.pointColor = colorFactory.excludeArea.point;
      }

      /**
       * ROI 또는 Calibration의 영역을 오른쪽 마우스 클릭 시
       * 삭제 팝업이 나오면 안되므로 분기처리한다.
       * IVA/Common, Face Detection/Area, People Counting/Setup/Calibration Tab
       */
      if (
        sketchInfo.workType !== "qmArea" &&
        sketchInfo.workType !== "commonArea" && //IVA Common
        sketchInfo.workType !== "calibration" && //People Counting Calibration
        !(sketchInfo.workType === "fdArea" && sketchInfo.color === 0) //Face Detection
      ) {
        //라인 또는 폴리곤을 오른쪽 마우스를 클릭할 때 삭제 팝업이 뜸.
        kindSvgOptions.event.linecontextmenu = function(event) {
          event.preventDefault();
          _self.openDialog(this.lineIndex, "delete");
        };
        kindSvgOptions.event.polygoncontextmenu = function(event) {
          event.preventDefault();
          _self.openDialog(this.lineIndex, "delete");
        };
      }

      if ("useEvent" in sketchInfo) {
        kindSvgOptions.useEvent = sketchInfo.useEvent;
        //만약에 이벤트를 사용하지 않으면 Cursor가 생성이 안되게 함.
        if (kindSvgOptions.useEvent === false) {
          kindSvgOptions.useCursor = false;
        }
      }

      if ("aspectRatio" in sketchInfo) {
        if (sketchInfo.aspectRatio === true) {
          kindSvgOptions.fixedRatio = true;
        }
      }

      if ("ratio" in sketchInfo) {
        if (sketchInfo.ratio.length === 2) {
          kindSvgOptions.ratio = sketchInfo.ratio;
        }
      }

      if ("minSize" in sketchInfo) {
        convertedMinSize = convertPoint(
          [0, sketchInfo.minSize.width], [0, sketchInfo.minSize.height],
          'set'
        );

        kindSvgOptions.minSize = {
          width: Math.ceil(convertedMinSize.xpos[1]),
          height: Math.ceil(convertedMinSize.ypos[1])
        };
      }

      if ("maxSize" in sketchInfo) {
        convertedMaxSize = convertPoint(
          [0, sketchInfo.maxSize.width], [0, sketchInfo.maxSize.height],
          'set'
        );
        kindSvgOptions.maxSize = {
          width: Math.ceil(convertedMaxSize.xpos[1]),
          height: Math.ceil(convertedMaxSize.ypos[1])
        };
      }

      if ("minLineLength" in sketchInfo) {
        kindSvgOptions.minLineLength = convertPoint(
          [0, 0], [0, sketchInfo.minLineLength],
          'set'
        ).ypos[1];
      }

      if ("wiseFaceDetection" in sketchInfo) {
        kindSvgOptions.wiseFaceDetection = {
          fillColor: colorFactory.includeArea.line,
          heightRatio: sketchInfo.wiseFDCircleHeightRatio //Wise Face Detection에 표현되는 원의 반지름 %
        };

        if("wiseFDCircleFillColor" in sketchInfo) {
          colorFactory.circleForMETAInFD = sketchInfo.wiseFDCircleFillColor;
          kindSvgOptions.wiseFaceDetection.fillColor = sketchInfo.wiseFDCircleFillColor;
        }

        kindSvgOptions.lineStrokeWidth = 2;
      }

      if ("initCenter" in sketchInfo) {
        kindSvgOptions.initCenter = sketchInfo.initCenter;
      }

      if ("flip" in sketchInfo) {
        kindSvgOptions.flip = sketchInfo.flip;
      }

      if ("mirror" in sketchInfo) {
        kindSvgOptions.mirror = sketchInfo.mirror;
      }

      if (
        sketchInfo.workType === "commonArea" || 
        sketchInfo.workType === "calibration"
        ) {
        // kindSvgOptions.useEvent = false;
        // kindSvgOptions.useResizeRectangle = true;
        kindSvgOptions.notUseMoveTopLayer = true;
        kindSvgOptions.useOnlyRectangle = true;
      }

      toggleSVGElement(true);
      kindSVGCustomObj = kindSVGEditor.customEditor(kindSvgOptions);
    }
    constructor.prototype = {
      updatePrevSize: function(index, width, height) {
        //Max
        if (index === 0) {
          preMaxWidth = width;
          preMaxHeight = height;
          //Min
        } else {
          preMinWidth = width;
          preMinHeight = height;
        }
      },
      changeWFDFillColor: function(fillColor) {
        svgObjs[0].changeWFDFillColor(fillColor);
        kindSvgOptions.wiseFaceDetection.fillColor = fillColor;
      },
      notifyUpdate: function(index, data) {
        _self.setCoordinate(index, data);

        var convertedPoints = _self.getConvertedPoints(data, 'get', index);

        if (
          sketchInfo.workType === "commonArea" &&
          "isChanged" in convertedPoints
          ) {
          if (convertedPoints.isChanged === false) {
            return;
          }
        }

        updateCoordinates([
          index,
          "mouseup",
          convertedPoints
        ]);
      },
      getConvertedPoints: function(data, mode, index) {
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

        if (
          sketchInfo.workType === "commonArea" ||
          sketchInfo.workType === "calibration"
          ) {
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

          if (mode === 'get') {
            //Max
            if (index === 0) {
              convertedPoints.__proto__.isChanged = 
                width !== preMaxWidth || height !== preMaxHeight;
              // console.log(width, height);
              //Min
            } else {
              convertedPoints.__proto__.isChanged =
                width !== preMinWidth || height !== preMinHeight;
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

          if (mode === 'set') {
            _self.updatePrevSize(index, width, height);
          }

          convertedPoints = [
            [x1, y1],
            [x1, y1 + height],
            [x1 + width, y1 + height],
            [x1 + width, y1]
          ];

          // console.log(convertedPoints.isChanged);
        } else {
          convertedPoints = convertPoints(data.points, mode);
        }

        return convertedPoints;
      },
      setEnableForSVG: function(index, enableOption) {
        if (
          svgObjs[index] !== null &&
          typeof svgObjs[index] !== "undefined"
          ) {
          var method = enableOption === true ? 'show' : 'hide';
          svgObjs[index][method]();
          coordinates[index].enable = enableOption;
        }
      },
      alignCenter: function() {
        for (var i = 0, ii = svgObjs.length; i < ii; i++) {
          var data = {};

          svgObjs[i].alignCenter();
          data = svgObjs[i].getData();

          _self.notifyUpdate(i, data);
        }
      },
      activeShape: function(index) {
        var method = null;
        for (var i = 0, ii = svgObjs.length; i < ii; i++) {
          if (
            svgObjs[i] !== null &&
            typeof svgObjs[i] !== "undefined") { //if svg object is setted.
            method = i === index ? 'active' : 'normal';
            svgObjs[i][method]();
          }
        }
      },
      getIndex: function() {
        var index = null;

        for (var i = 0, len = coordinates.length; i < len; i++) {
          if (coordinates[i].isSet !== true) {
            index = i;
            break;
          }
        }

        return index;
      },
      setCoordinate: function(index, data) {
        coordinates[index].isSet = true;
        coordinates[index].points = data.points;
      },
      addSVGObj: function(obj, isNewlyAdded, coordinateIndex) {
        var index = typeof coordinateIndex !== "undefined" ? coordinateIndex : _self.getIndex();
        obj.lineIndex = index;
        svgObjs[index] = obj;

        _self.setCoordinate(index, obj.getData());

        if (isNewlyAdded === true) {
          coordinates[index].enable = true;
          updateCoordinates([
            index,
            "create",
            convertPoints(coordinates[index].points, 'get')
          ]);
        }

        if (!_self.checkDrawAvailable()) {
          kindSVGCustomObj.stop();
        }
      },
      removeSVGObj: function(index) {
        svgObjs[index].destroy();
        svgObjs[index] = null;

        if (_self.checkDrawAvailable()) {
          kindSVGCustomObj.start();
        }
      },
      openDialog: function(index, type) {
        dialog.open({
          templateUrl: sketchInfo.modalId,
          windowClass: 'modal-position-middle',
          size: 'sm',
          controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            $scope.confirmMessage = "lang_msg_confirm_remove_profile";

            function removeCoor(index) {
              coordinates[index].isSet = false;
              coordinates[index].enExAppear = null;
              coordinates[index].points = [];
              _self.removeSVGObj(index);
            }

            $scope.cancel = function() {
              if (type === "create") {
                removeCoor(index);
              }
              $uibModalInstance.close();
            };

            $scope.ok = function() {
              removeCoor(index);

              updateCoordinates([index, "delete"]);

              $uibModalInstance.close();
            };

            $uibModalInstance.result.then(function() {}, function() {
              if (type === "create") {
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
        var i = 0;

        if (sketchInfo.workType === "commonArea" || sketchInfo.workType === "calibration") {
          maxWidth = kindSvgOptions.maxSize.width;
          maxHeight = kindSvgOptions.maxSize.height;
          minWidth = kindSvgOptions.minSize.width;
          minHeight = kindSvgOptions.minSize.height;

          for (i = coordinates.length - 1; i > -1; i--) {
            kindSvgOptions.points = coordinates[i].points;

            //Common Area Color
            kindSvgOptions.fillColor = i === 0 ? colorFactory.blue : colorFactory.red;
            kindSvgOptions.lineColor = i === 0 ? colorFactory.blue : colorFactory.red;
            kindSvgOptions.pointColor = i === 0 ? colorFactory.blue : colorFactory.red;

            if (sketchInfo.workType === "commonArea") {
              if (i === 1) {
                kindSvgOptions.maxSize = {
                  width: videoInfo.width,
                  height: videoInfo.height
                };
                kindSvgOptions.minSize = {
                  width: minWidth,
                  height: minHeight
                };
              } else {
                kindSvgOptions.ratio = [1, 1];
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
        } else {
          for (i = 0; i < coordinates.length; i++) {
            if (
              (
                sketchInfo.workType === "vaEntering" &&
                coordinates[i].enExAppear !== "AppearDisappear"
              ) ||
              (sketchInfo.workType === "vaAppearing" && (
                coordinates[i].enExAppear === "AppearDisappear" ||
                (
                  sketchInfo.hasOwnProperty('mode') &&
                  coordinates[i].enExAppear === sketchInfo.mode
                )
              )) ||
              (
                sketchInfo.workType === "qmArea" && 
                coordinates[i].enExAppear === sketchInfo.color
              ) ||
              (
                sketchInfo.workType === "mdArea" && 
                coordinates[i].enExAppear === sketchInfo.color
              ) ||
              (
                sketchInfo.workType === "fdArea" && 
                coordinates[i].enExAppear === sketchInfo.color
              )
            ) {
              if (coordinates[i].isSet) {
                kindSvgOptions.points = coordinates[i].points;

                if (sketchInfo.workType === "qmArea") {
                  if ("textInCircle" in coordinates[i]) {
                    kindSvgOptions.textInCircle = coordinates[i].textInCircle;
                  }

                  if ("areaColor" in coordinates[i]) {
                    kindSvgOptions.fillColor = coordinates[i].areaColor;
                    kindSvgOptions.lineColor = coordinates[i].areaColor;
                    kindSvgOptions.pointColor = coordinates[i].areaColor;
                    kindSvgOptions.fillOpacity = 0.3;
                  }
                }

                _self.addSVGObj(kindSVGEditor.draw(kindSvgOptions), false, i);

                if ('enable' in coordinates[i]) {
                  if (coordinates[i].enable !== true) {
                    svgObjs[i].hide();
                  }
                }
              }
            }
          }
        }
        if (
          updateCoordinates !== null &&
          typeof updateCoordinates === "function"
          ) {
          if (!isInit) {
            updateCoordinates();
          }
        }
      },
      set: function(data) {
        for (var i = 0; i < coordinates.length; i++) {
          var enExAppear = null;
          if (typeof data[i] !== "undefined") {
            coordinates[i].isSet = data[i].isSet;
            if ('enable' in data[i]) {
              coordinates[i].enable = data[i].enable;
            }

            coordinates[i].points = _self.getConvertedPoints(data[i], 'set', i);

            if (
              sketchInfo.workType === "qmArea" ||
              sketchInfo.workType === "mdArea" ||
              sketchInfo.workType === "fdArea"
              ) {
              enExAppear = sketchInfo.color;
            } else if (
              sketchInfo.workType === "vaAppearing" &&
              sketchInfo.hasOwnProperty('mode')
              ) {
              enExAppear = sketchInfo.mode;
            }

            if (sketchInfo.workType === "qmArea") {
              if ("textInCircle" in data[i]) {
                coordinates[i].textInCircle = data[i].textInCircle;
              }
              if ("areaColor" in data[i]) {
                coordinates[i].areaColor = data[i].areaColor;
              }
            }

            coordinates[i].enExAppear = enExAppear;
          }
        }

        _self.updatePolygon(true);

        if (!_self.checkDrawAvailable()) {
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

          if ('enable' in coordinates[i]) {
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
          end: function(obj) {
            _self.addSVGObj(obj, true);
          },
          mouseup: function(data) {
            if (typeof this.lineIndex !== "undefined") {
              _self.setCoordinate(this.lineIndex, data);
              updateCoordinates([
                this.lineIndex,
                "mouseup",
                convertPoints(data.points, 'get'),
                data.arrow
              ]);
            }
          },
          linecontextmenu: function(event) {
            event.preventDefault();
            if (sketchInfo.workType !== "peoplecount") {
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
      if (sketchInfo.workType === "peoplecount") {
        kindSvgOptions.arrow.max = sketchInfo.maxArrow;
        kindSvgOptions.arrow.text = false;
        kindSvgOptions.maxPoint = 2;
        kindSvgOptions.notUseAutoChangeOfArrow = true;

        if (sketchInfo.useEvent === false) {
          kindSvgOptions.fillColor = colorFactory.brightBlue;
          kindSvgOptions.lineColor = colorFactory.brightBlue;
          kindSvgOptions.pointColor = colorFactory.brightBlue;
        }
      }

      if ("useEvent" in sketchInfo) {
        kindSvgOptions.useEvent = sketchInfo.useEvent;
        //만약에 이벤트를 사용하지 않으면 Cursor가 생성이 안되게 함.
        if (kindSvgOptions.useEvent === false) {
          kindSvgOptions.useCursor = false;
        }
      }

      if ("minLineLength" in sketchInfo) {
        kindSvgOptions.minLineLength = convertPoint(
          [0, 0], [0, sketchInfo.minLineLength],
          'set'
        ).ypos[1];
      }

      toggleSVGElement(true);

      if (sketchInfo.workType !== "peoplecount") {
        kindSVGCustomObj = kindSVGEditor.customEditor(kindSvgOptions);
      }
    }
    constructor.prototype = {
      activeShape: function(index) {
        var method = null;
        for (var i = 0, ii = svgObjs.length; i < ii; i++) {
          if (svgObjs[i] !== null && typeof svgObjs[i] !== "undefined") { //if svg object is setted.
            method = i === index ? 'active' : 'normal';
            svgObjs[i][method]();
          }
        }
      },
      setEnableForSVG: function(index, enableOption) {
        if (svgObjs[index] !== null && typeof svgObjs[index] !== "undefined") {
          var method = enableOption === true ? 'show' : 'hide';
          svgObjs[index][method]();
        }
      },
      changeArrow: function(index, arrow) {
        var self = svgObjs[index];
        var currentArrow = self.getData().arrow;

        if (currentArrow === null) {
          if (kindSvgOptions.arrow.mode !== 'R') {
            kindSvgOptions.arrow.mode = 'R';
          }

          self.createArrow(kindSvgOptions.arrow);
        }

        self.changeArrow(arrow);
      },
      getIndex: function() {
        var index = null;

        for (var i = 0, len = coordinates.length; i < len; i++) {
          if (coordinates[i].isSet !== true) {
            index = i;
            break;
          }
        }

        return index;
      },
      setCoordinate: function(index, data) {
        var coor = coordinates[index];
        var points = data.points;
        var direction = convertDirection(data.arrow);

        coor.isSet = true;
        coor.points = points;
        coor.direction = direction;
      },
      addSVGObj: function(obj, isNewlyAdded, coordinatesIndex) {
        var index = typeof coordinatesIndex !== "undefined" ? coordinatesIndex : _self.getIndex();
        var data = obj.getData();
        obj.lineIndex = index;
        svgObjs[index] = obj;

        _self.setCoordinate(index, data);

        if (isNewlyAdded === true) {
          updateCoordinates([
            index,
            "create",
            convertPoints(data.points, 'get'),
            data.arrow
          ]);
        }

        if (!_self.checkDrawAvailable() && kindSVGCustomObj !== null) {
          kindSVGCustomObj.stop();
        }
      },
      removeSVGObj: function(index) {
        svgObjs[index].destroy();
        svgObjs[index] = null;

        if (_self.checkDrawAvailable() && kindSVGCustomObj !== null) {
          kindSVGCustomObj.start();
        }
      },
      updatePassingLine: function(isInit) {
        for (var i = 0; i < coordinates.length; i++) {
          if (coordinates[i].isSet) {
            var direction = convertDirection(coordinates[i].direction);

            kindSvgOptions.arrow.mode = direction;
            kindSvgOptions.points = coordinates[i].points;

            if (sketchInfo.workType === "peoplecount") {
              kindSvgOptions.textInCircle = i + 1;
            }

            _self.addSVGObj(kindSVGEditor.draw(kindSvgOptions), false, i);
          }
        }

        if (updateCoordinates !== null && typeof updateCoordinates === "function") {
          if (!isInit) {
            updateCoordinates();
          }
        }
      },
      set: function(data) {
        for (var i = 0; i < coordinates.length; i++) {
          if (typeof data[i] !== "undefined") {
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
            var j = 0;
            var jLen = 0;
            for (j = 0, jLen = data[i].points.length; j < jLen; j++) {
              xpos.push(data[i].points[j][0]);
              ypos.push(data[i].points[j][1]);
            }

            point = convertPoint(xpos, ypos, 'set');

            for (j = 0, jLen = xpos.length; j < jLen; j++) {
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

          var j = 0;
          var jLen = 0;

          for (j = 0, jLen = coordinates[i].points.length; j < jLen; j++) {
            xpos.push(coordinates[i].points[j][0]);
            ypos.push(coordinates[i].points[j][1]);
          }

          point = convertPoint(xpos, ypos, 'get');

          for (j = 0, jLen = xpos.length; j < jLen; j++) {
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
        dialog.open({
          templateUrl: sketchInfo.modalId,
          windowClass: 'modal-position-middle',
          size: 'sm',
          controller: [
            '$scope',
            '$uibModalInstance',
            function(
              $scope,
              $uibModalInstance
              ) {
              $scope.confirmMessage = "lang_msg_confirm_remove_profile";
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
            }
          ]
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
    var cropMinResolution = {
      width: 0,
      height: 0
    };
    var cropMaxResolution = {
      width: 0,
      height: 0
    };
    var rectPos = {
      startX: 0,
      startY: 0,
      width: 0,
      height: 0
    };
    var x1 = 0,
      y1 = 0;
    var _self = null;

    function setColor() {
      fContext.lineWidth = lineWidth;
      fContext.globalAlpha = alphaFactory.enabled.fill;
      fContext.strokeStyle = colorFactory.blue;
      fContext.fillStyle = colorFactory.blue;
    }

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

      setColor();
    }

    function setCropLimitResolution() {
      var minSplit = videoInfo.minCropResolution.split('x');
      var maxSplit = videoInfo.maxCropResolution.split('x');

      cropMinResolution.width = 
        videoInfo.rotate === "0" ? minSplit[0] : minSplit[1];
      cropMinResolution.height = 
        videoInfo.rotate === "0" ? minSplit[1] : minSplit[0];
      cropMaxResolution.width = 
        videoInfo.rotate === "0" ? maxSplit[0] : maxSplit[1];
      cropMaxResolution.height = 
        videoInfo.rotate === "0" ? maxSplit[1] : maxSplit[0];
    }

    constructor.prototype = {
      cropMousedown: function(event) {
        if (event.which !== 1) {
          return;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];
        rectPos.startX = xVal;
        rectPos.startY = yVal;
        firstDrawClick = true;
        isDrawDragging = false;
      },
      cropMousemove: function(event) {
        var coord = getCoordinate(event, frontCanvas);
        var xVal = coord[0];
        var yVal = coord[1];
        if (firstDrawClick) {
          rectPos.width = xVal - rectPos.startX;
          rectPos.height = yVal - rectPos.startY;
          rectPos.endX = xVal;
          rectPos.endY = yVal;
          fContext.clearRect(
            0,
            0,
            videoInfo.width,
            videoInfo.height
          );
          if ((rectPos.startX + rectPos.width) > videoInfo.width) {
            rectPos.width = frontCanvas.width - rectPos.startX;
          } else if ((rectPos.startX + rectPos.width) < 0) {
            rectPos.width = (-1) * rectPos.startX;
          }
          if ((rectPos.startY + rectPos.height) > videoInfo.height) {
            rectPos.height = videoInfo.height - rectPos.startY;
          } else if ((rectPos.startY + rectPos.height) < 0) {
            rectPos.height = (-1) * rectPos.startY;
          }
          fContext.globalAlpha = alphaFactory.enabled.fill;
          fContext.fillRect(
            rectPos.startX,
            rectPos.startY,
            rectPos.width,
            rectPos.height
          );
          fContext.globalAlpha = alphaFactory.enabled.stroke;
          fContext.strokeRect(
            rectPos.startX,
            rectPos.startY,
            rectPos.width,
            rectPos.height
          );
        }
        isDrawDragging = true;
      },
      cropMouseup: function() {
        if (!firstDrawClick) {
          return;
        }
        firstDrawClick = false;
        if (isDrawDragging) {
          if (rectPos.startX <= rectPos.endX) {
            x1 = rectPos.startX;
          } else {
            x1 = rectPos.endX;
          }
          if (rectPos.startY <= rectPos.endY) {
            y1 = rectPos.startY;
          } else {
            y1 = rectPos.endY;
          }
          rectPos.width = Math.abs(rectPos.width);
          rectPos.height = Math.abs(rectPos.height);
          var cX = Math.ceil(
            x1 *
            (
              videoInfo.maxWidth /
              videoInfo.width
            )
          );
          var cY = Math.ceil(
            y1 *
            (
              videoInfo.maxHeight /
              videoInfo.height
            )
          );
          var cW = Math.ceil(
            Math.abs(rectPos.width) *
            (
              videoInfo.maxWidth /
              videoInfo.width
            )
          );
          var cH = Math.ceil(
            Math.abs(rectPos.height) *
            (
              videoInfo.maxHeight /
              videoInfo.height
            )
          );
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
          } else {
            if (cW < cropMinResolution.width) {
              fContext.clearRect(
                0,
                0,
                videoInfo.width,
                videoInfo.height
              );
              _self.updateCanvas(false);
              return;
            }
            if (cH < cropMinResolution.height) {
              fContext.clearRect(
                0,
                0,
                videoInfo.width,
                videoInfo.height
              );
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
        tempCoordi.x1 = parseInt(
          coordinates.x1 /
          (
            videoInfo.maxWidth /
            videoInfo.width
          ),
          10
        );
        tempCoordi.y1 = parseInt(
          coordinates.y1 /
          (
            videoInfo.maxHeight /
            videoInfo.height
          ),
          10
        );
        tempCoordi.width = parseInt(
          coordinates.width /
          (
            videoInfo.maxWidth /
            videoInfo.width
          ),
          10
        );
        tempCoordi.height = parseInt(
          coordinates.height /
          (
            videoInfo.maxHeight /
            videoInfo.height
          ),
          10
        );

        fContext.globalAlpha = alphaFactory.enabled.stroke;
        fContext.strokeRect(
          tempCoordi.x1,
          tempCoordi.y1,
          tempCoordi.width,
          tempCoordi.height
        );
        fContext.globalAlpha = alphaFactory.enabled.fill;
        fContext.fillRect(
          tempCoordi.x1,
          tempCoordi.y1,
          tempCoordi.width,
          tempCoordi.height
        );
        if (
          updateCoordinates !== null &&
          typeof updateCoordinates === "function"
          ) {
          if (!isInit) {
            updateCoordinates();
          }
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
      set: function(_data) {
        setColor();
        var data = Array.isArray(_data) ? _data[0] : _data;
        coordinates.x1 = parseInt(data.x1, 10);
        coordinates.y1 = parseInt(data.y1, 10);
        coordinates.width = parseInt(data.width, 10);
        coordinates.height = parseInt(data.height, 10);
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
    var x1 = 0,
      y1 = 0,
      x2 = 0,
      y2 = 0;
    var rectPos = {
      startX: 0,
      startY: 0,
      width: 0,
      height: 0
    };
    var coordinates = null;
    var _self = null;
    var selectedCoordinates = null;

    function constructor() {
      /* jshint validthis: true */
      _self = this;
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
      mousedownRectangle: function(event) {
        if (event.which !== 1) {
          return;
        }
        if (!_self.checkDrawAvailable()) {
          return;
        }
        var coord = getCoordinate(event, this);
        var xVal = coord[0];
        var yVal = coord[1];
        rectPos.startX = xVal;
        rectPos.startY = yVal;
        firstDrawClick = true;
        isDrawDragging = false;
      },
      mousemoveRectangle: function(event) {
        var coord = getCoordinate(event, frontCanvas);
        var xVal = coord[0];
        var yVal = coord[1];
        if (firstDrawClick) {
          clearRect(1);
          rectPos.width = xVal - rectPos.startX;
          rectPos.height = yVal - rectPos.startY;
          rectPos.endX = xVal;
          rectPos.endY = yVal;
          clearRect(0);
          if ((rectPos.startX + rectPos.width) > videoInfo.width) {
            rectPos.width = frontCanvas.width - rectPos.startX;
          } else if ((rectPos.startX + rectPos.width) < 0) {
            rectPos.width = (-1) * rectPos.startX;
          }
          if ((rectPos.startY + rectPos.height) > videoInfo.height) {
            rectPos.height = videoInfo.height - rectPos.startY;
          } else if ((rectPos.startY + rectPos.height) < 0) {
            rectPos.height = (-1) * rectPos.startY;
          }
          drawRectangle(
            0,
            1,
            rectPos.startX,
            rectPos.startY,
            rectPos.width,
            rectPos.height
          );
        }
        isDrawDragging = true;
      },
      mouseupRectangle: function() {
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
              // _self.drawArea(selectedCoordinates);
            }
          }
          clearRect(0);
          isDrawDragging = false;
        }
      },
      contextmenuRectangle: function(event) {
        //mouse right click
        event.ventDefault();
        return false;
      },
      updateRectangle: function(isInit) {
        clearRect(1);
        drawRectangle(
          1,
          1,
          coordinates.x1,
          coordinates.y1,
          coordinates.x2 - coordinates.x1,
          coordinates.y2 - coordinates.y1
        );
        if (
          updateCoordinates !== null &&
          typeof updateCoordinates === "function"
          ) {
          if (!isInit) {
            updateCoordinates();
          }
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
          } else {
            selectedCoordinates = null;
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
          xpos = [
            coordinates.x1, 
            coordinates.x2, 
            coordinates.x3, 
            coordinates.x4
          ];
          ypos = [
            coordinates.y1, 
            coordinates.y2, 
            coordinates.y3, 
            coordinates.y4
          ];
        }
        var point = convertPoint(xpos, ypos, 'get');
        returnArray.x1 = point.xpos[0];
        returnArray.y1 = point.ypos[0];
        returnArray.x2 = point.xpos[1];
        returnArray.y2 = point.ypos[1];
        return returnArray;
      },
      openDialog: function() {
        dialog.open({
          templateUrl: sketchInfo.modalId,
          windowClass: 'modal-position-middle',
          controller: [
            '$scope',
            '$uibModalInstance',
            'Attributes',
            'COMMONUtils',
            'SunapiClient',
            function(
              $scope,
              $uibModalInstance, 
              Attributes, 
              COMMONUtils, 
              SunapiClient
              ) {
              var mAttr = Attributes.get();
              $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
              $scope.AutoTrackingNameMaxLen = 10;
              $scope.autotrackingDataReady = true;
              var autotrackingView = function() {
                SunapiClient.get(
                  '/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view', 
                  {},
                  function(response) {
                    $scope.AutoTrackingAreas = 
                      response.data.AutoTracking[0].TrackingAreas;
                    if (!$scope.AutoTrackingAreas) {
                      $scope.AutoTrackingAreas = [];
                    }
                    $scope.autotrackingDataReady = false;
                  },
                  function() {
                    $scope.AutoTrackingAreas = [];
                    $scope.autotrackingDataReady = false;
                  }, 
                  '',
                  true
                );
              };
              autotrackingView();
              var autorackingNameCheck = function(name) {
                var nameDuplication = false;
                for (var i = 0; i < $scope.AutoTrackingAreas.length; i++) {
                  var _tmpArea = $scope.AutoTrackingAreas[i];
                  if (name === _tmpArea.TrackingArea) {
                    nameDuplication = true;
                    break;
                  }
                }
                return nameDuplication;
              };
              $scope.ok = function() {
                var autoName = $(".autoTracking-name-input").val();
                if (!autoName) {
                  return;
                }
                if (autorackingNameCheck(autoName) === true) {
                  COMMONUtils.ShowError('lang_msg_id_duplicate');
                  return;
                }
                var coor = autoTracking.get();
                var autoTrackingData = {};
                if (sketchInfo.shape === 0) {
                  autoTrackingData = {
                    'name': autoName,
                    'position': [
                      coor.x1,
                      coor.y1,
                      coor.x2,
                      coor.y2
                    ].join(",")
                  };
                } else {
                  autoTrackingData = {
                    'name': autoName,
                    'position': [
                      coor.x1,
                      coor.y1,
                      coor.x2,
                      coor.y2,
                      coor.x3,
                      coor.y3,
                      coor.x4,
                      coor.y4
                    ].join(",")
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
                autoTrackingUpdate(null);
                clearRect(1);
              });
            }
          ]
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
    xs *= xs;
    ys = y2 - y1;
    ys *= ys;
    return Math.sqrt(xs + ys);
  };
  var getAngleABC = function(aAxis, bAxis, cAxis) {
    var ab = {
      x: bAxis.x - aAxis.x,
      y: bAxis.y - aAxis.y
    };
    var cb = {
      x: bAxis.x - cAxis.x,
      y: bAxis.y - cAxis.y
    };
    var dot = ((ab.x * cb.x) + (ab.y * cb.y)); // dot product
    var cross = ((ab.x * cb.y) - (ab.y * cb.x)); // cross product
    var alpha = Math.atan2(cross, dot);
    return Math.floor((alpha * 180 / 3.141592) + 0.5);
  };
  var sqr = function(xVal) {
    return xVal * xVal
  };
  var dist2 = function(vAxis, wAxis) {
    return sqr(vAxis.x - wAxis.x) + sqr(vAxis.y - wAxis.y)
  };
  var distToSegmentSquared = function(pAxis, vAxis, wAxis) {
    var l2 = dist2(vAxis, wAxis);
    if (l2 === 0) {
      return dist2(pAxis, vAxis);
    }
    var tAxis = (
      (
        (pAxis.x - vAxis.x) * (wAxis.x - vAxis.x)
      ) +
      (
        (pAxis.y - vAxis.y) * (wAxis.y - vAxis.y)
      )
    ) / l2;
    if (tAxis < 0) {
      return dist2(pAxis, vAxis);
    }
    if (tAxis > 1) {
      return dist2(pAxis, wAxis);
    }
    return dist2(pAxis, {
      x: vAxis.x + (tAxis * (wAxis.x - vAxis.x)),
      y: vAxis.y + (tAxis * (wAxis.y - vAxis.y))
    });
  };
  var distToSegment = function(pAxis, vAxis, wAxis) {
    return Math.sqrt(distToSegmentSquared(pAxis, vAxis, wAxis));
  };
  var isPointInPoly = function(poly, pt) {
    var c = false;
    var i = -1;
    var l = poly.length;
    var j = l - 1;
    for (
      c = false,
      i = -1,
      l = poly.length,
      j = l - 1;
      ++i < l;
      j = i
      ) {
      (
        (poly[i].y <= pt.y && pt.y < poly[j].y) ||
        (poly[j].y <= pt.y && pt.y < poly[i].y)
      ) &&
      (
        pt.x < (
          (poly[j].x - poly[i].x) *
          (pt.y - poly[i].y) /
          (poly[j].y - poly[i].y)
          ) + poly[i].x
      ) &&
      (c = !c);
    }
    return c;
  };

  function convertPoints(points, convertType) {
    var xpos = [];
    var ypos = [];
    var convertedPoints = null;
    var coorPoints = [];
    var j = 0;
    var jj = 0;

    for (j = 0, jj = points.length; j < jj; j++) {
      xpos.push(points[j][0]);
      ypos.push(points[j][1]);
    }

    convertedPoints = convertPoint(xpos, ypos, convertType);

    for (j = 0, jj = xpos.length; j < jj; j++) {
      coorPoints.push([
        convertedPoints.xpos[j],
        convertedPoints.ypos[j]
      ]);
    }

    return coorPoints;
  }

  var convertPoint = function(xpos, ypos, mode) {
    var pointCount = xpos.length;
    var j = 0;
    var temp = '';
    if (mode === 'set') { // set point
      if (!videoInfo.support_ptz && videoInfo.adjust) {
        if (videoInfo.rotate === "90") {
          for (j = 0; j < pointCount; j++) {
            temp = ypos[j];
            ypos[j] = xpos[j];
            xpos[j] = videoInfo.maxWidth - temp;
          }
        } else if (videoInfo.rotate === "270") {
          for (j = 0; j < pointCount; j++) {
            temp = xpos[j];
            xpos[j] = ypos[j];
            ypos[j] = videoInfo.maxHeight - temp;
          }
        }
        if (videoInfo.flip === true) {
          for (j = 0; j < pointCount; j++) {
            ypos[j] = videoInfo.maxHeight - ypos[j];
          }
        }
        if (videoInfo.mirror === true) {
          for (j = 0; j < pointCount; j++) {
            xpos[j] = videoInfo.maxWidth - xpos[j];
          }
        }
      }
      if (sketchInfo.shape === 0) { //rect
        if (xpos[1] < xpos[0]) {
          temp = xpos[0];
          xpos[0] = xpos[1];
          xpos[1] = temp;
        }
        if (ypos[1] < ypos[0]) {
          temp = ypos[0];
          ypos[0] = ypos[1];
          ypos[1] = temp;
        }
      }
      for (j = 0; j < pointCount; j++) {
        if (
          videoInfo.rotate === "90" ||
          videoInfo.rotate === "270"
          ) {
          xpos[j] = Math.round(
            xpos[j] / 
            (
              videoInfo.maxHeight / 
              videoInfo.height
            )
          );
          ypos[j] = Math.round(
            ypos[j] / 
            (
              videoInfo.maxWidth / 
              videoInfo.width
            )
          );
        } else {
          xpos[j] = Math.round(
            xpos[j] / 
            (
              videoInfo.maxWidth / 
              videoInfo.width
            )
          );
          ypos[j] = Math.round(
            ypos[j] / 
            (
              videoInfo.maxHeight / 
              videoInfo.height
            )
          );
        }
      }
    } else { // set point
      if (!videoInfo.support_ptz && videoInfo.adjust) {
        if (videoInfo.rotate === "90") {
          for (j = 0; j < pointCount; j++) {
            temp = xpos[j];
            xpos[j] = ypos[j];
            ypos[j] = videoInfo.width - temp;
          }
        } else if (videoInfo.rotate === "270") {
          for (j = 0; j < pointCount; j++) {
            temp = ypos[j];
            ypos[j] = xpos[j];
            xpos[j] = videoInfo.height - temp;
          }
        }
        if (videoInfo.flip === true) {
          if (
            videoInfo.rotate === "90" ||
            videoInfo.rotate === "270"
            ) {
            for (j = 0; j < pointCount; j++) {
              xpos[j] = videoInfo.height - xpos[j];
            }
          } else {
            for (j = 0; j < pointCount; j++) {
              ypos[j] = videoInfo.height - ypos[j];
            }
          }
        }
        if (videoInfo.mirror === true) {
          if (
            videoInfo.rotate === "90" || 
            videoInfo.rotate === "270"
            ) {
            for (j = 0; j < pointCount; j++) {
              ypos[j] = videoInfo.width - ypos[j];
            }
          } else {
            for (j = 0; j < pointCount; j++) {
              xpos[j] = videoInfo.width - xpos[j];
            }
          }
        }
      }
      if (sketchInfo.shape === 0) { //rect
        if (xpos[1] < xpos[0]) {
          temp = xpos[0];
          xpos[0] = xpos[1];
          xpos[1] = temp;
        }
        if (ypos[1] < ypos[0]) {
          temp = ypos[0];
          ypos[0] = ypos[1];
          ypos[1] = temp;
        }
      }
      for (j = 0; j < pointCount; j++) {
        if (
          videoInfo.rotate === "90" ||
          videoInfo.rotate === "270"
          ) {
          xpos[j] = Math.round(
            xpos[j] * 
            (
              videoInfo.maxHeight / 
              videoInfo.height
            )
          );
          ypos[j] = Math.round(
            ypos[j] * 
            (
              videoInfo.maxWidth / 
              videoInfo.width
            )
          );
        } else {
          xpos[j] = Math.round(
            xpos[j] * 
            (
              videoInfo.maxWidth / 
              videoInfo.width
            )
          );
          ypos[j] = Math.round(
            ypos[j] * 
            (
              videoInfo.maxHeight / 
              videoInfo.height
            )
          );
        }
        if (xpos[j] < 0) {
          xpos[j] = 0;
        }
        if (ypos[j] < 0) {
          ypos[j] = 0;
        }
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

  CanvasRenderingContext2D.prototype.fillPolygon = function(
    pointsArray,
    fillColor,
    strokeColor
    ) {
    if (pointsArray.length <= 0) {
      return;
    }
    this.moveTo(pointsArray[0][0], pointsArray[0][1]);
    for (var i = 0; i < pointsArray.length; i++) {
      this.lineTo(pointsArray[i][0], pointsArray[i][1]);
    }
    if (strokeColor !== null && typeof strokeColor !== "undefined") {
      this.strokeStyle = strokeColor;
    }
    this.globalAlpha = alphaFactory.enabled.stroke;
    if (fillColor !== null && typeof fillColor !== "undefined") {
      this.fillStyle = fillColor;
      this.globalAlpha = alphaFactory.enabled.fill;
      this.fill();
    }
  };
  return constructor;
})();