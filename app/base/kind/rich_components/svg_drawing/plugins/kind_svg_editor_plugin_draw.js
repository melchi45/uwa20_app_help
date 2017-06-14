"use strict";
/* global KindSVGEditor */
KindSVGEditor.addPlugin('draw', function(options) {
  var normalImage = './base/images/setup/btn_in-out_normal.png';
  var pressImage = './base/images/setup/btn_in-out_press.png';

  var normalAllImage = './base/images/setup/btn_all_normal.png';
  var pressAllImage = './base/images/setup/btn_all_press.png';

  var plusImage = './base/images/plus.svg';
  var minusImage = './base/images/minus.svg';

  var imageWidth = 25;
  var imageHeight = 33;

  var parentSvgMovedAttr = 'is-moved';

  var elemCtrl = this.elementController;
  var eventCtrl = this.eventController;
  var funnyMath = this.funnyMath;
  var commonFunc = this.common;
  var NS = this.NS;

  var MINIMUM_ANGLE = 4;

  var parentSvg = elemCtrl.getParentSvg();

  /**
   * Set Options
   * {options}
   * color {String} Line Color
   * selectedColor {String} Selected Line Color
   * x1 {Number} x1 Axis
   * y1 {Number} y1 Axis
   * x2 {Number} x2 Axis
   * y2 {Number} y2 Axis
   * lineStrokeWidth {Number} Stroke Width
   * circleRadius {Number} Circle Radius
   * minLineLength {Number} Minimum Length of Line 
   * textInCircle {String} Text in Start Pointer
   * useArrow {Boolean} use arrow or not
   * arrow {String} Default Arrow of Line
   */
  var fillColor = typeof options.fillColor === "undefined" ? '#cccccc' : options.fillColor;
  var lineColor = typeof options.lineColor === "undefined" ? '#cccccc' : options.lineColor;
  var pointColor = typeof options.pointColor === "undefined" ? '#cccccc' : options.pointColor;
  var points = typeof options.points === "undefined" ? [
    [0, 0],
    [100, 100]
  ] : options.points;
  var lineStrokeWidth = typeof options.lineStrokeWidth === "undefined" ? 3 : options.lineStrokeWidth;
  var circleRadius = typeof options.circleRadius === "undefined" ? 5 : options.circleRadius;
  var minLineLength = typeof options.minLineLength === "undefined" ? false : options.minLineLength;
  var textInCircle = typeof options.textInCircle === "undefined" ? null : options.textInCircle;
  var arrow = typeof options.arrow === "undefined" ? null : options.arrow;
  var useEvent = typeof options.useEvent === "undefined" ? false : options.useEvent;
  var useResizeRectangle = typeof options.useResizeRectangle === "undefined" ? false : options.useResizeRectangle;
  var notUseMoveTopLayer = typeof options.notUseMoveTopLayer === "undefined" ? false : options.notUseMoveTopLayer;
  var useCursor = typeof options.useCursor === "undefined" ? false : options.useCursor;
  var useOnlyRectangle = typeof options.useOnlyRectangle === "undefined" ? false : options.useOnlyRectangle;
  var useRectangleForCustomDraw = typeof options.useRectangleForCustomDraw === "undefined" ? false : options.useRectangleForCustomDraw;
  var fill = typeof options.fill === "undefined" ? false : options.fill;
  var fillOpacity = typeof options.fillOpacity === "undefined" ? .5 : parseFloat(options.fillOpacity);
  var fixedRatio = typeof options.fixedRatio === "undefined" ? false : options.fixedRatio;
  var ratio = typeof options.ratio === "undefined" ? false : options.ratio;
  var customEvent = typeof options.event === "undefined" ? null : options.event;
  var customDraw = typeof options.customDraw === "undefined" ? false : options.customDraw;
  var minSize = typeof options.minSize === "undefined" ? false : options.minSize;
  var maxSize = typeof options.maxSize === "undefined" ? false : options.maxSize;
  var minPoint = typeof options.minPoint === "undefined" ? 4 : options.minPoint;
  var maxPoint = typeof options.maxPoint === "undefined" ? 8 : options.maxPoint;
  var initCenter = typeof options.initCenter === "undefined" ? false : options.initCenter;
  var mirror = typeof options.mirror === "undefined" ? false : options.mirror;
  var flip = typeof options.flip === "undefined" ? false : options.flip;
  var notUseAutoChangeOfArrow = typeof options.notUseAutoChangeOfArrow === "undefined" ? false : options.notUseAutoChangeOfArrow;
  //For WN5 Face Detection
  /**
  wiseFaceDetection.strokeWidth
  wiseFaceDetection.strokeColor
  wiseFaceDetection.fillOpacity
  wiseFaceDetection.heightRatio
  wiseFaceDetection.widthRatio
   */
  var wiseFaceDetection = typeof options.wiseFaceDetection === "undefined" ? false : options.wiseFaceDetection;

  var useArrow = true;

  if (arrow === null) {
    useArrow = false;
  } else if (arrow.mode === '') {
    useArrow = false;
  }

  if (useOnlyRectangle === true) {
    fixedRatio = true;
  }

  var rectangleIndex = [
    mirror && flip ? 2 : flip ? 1 : mirror ? 3 : 0,
    mirror && flip ? 3 : flip ? 0 : mirror ? 2 : 1,
    mirror && flip ? 0 : flip ? 3 : mirror ? 1 : 2,
    mirror && flip ? 1 : flip ? 2 : mirror ? 0 : 3
  ];

  var pointsLength = points.length;

  var selectedCircleIndex = null;
  var selectedLineIndex = null;
  var selectedPolygon = null;
  var drawObj = {};

  var groupTag = null;
  var groupHelper = (function() {
    var groupId = null;

    return {
      remove: remove,
      append: append,
      add: add,
      appendChild: appendChild,
      removeChild: removeChild,
      moveTopLayer: moveTopLayer,
      insertBefore: insertBefore
    };

    function add() {
      groupTag = elemCtrl.createGroup();
      groupId = 'group_' + Math.ceil(Math.random() * 1000000);
      elemCtrl.setAttr(groupTag, 'id', groupId);
    }

    function remove() {
      elemCtrl.removeParentChild(groupTag);
    }

    function moveTopLayer() {
      if (notUseMoveTopLayer === true) {
        return;
      }
      var lastChild = parentSvg.lastChild;

      if (lastChild.id !== groupId) {
        parentSvg.insertBefore(
          groupTag,
          lastChild.nextSibling
        );
      }
    }

    function append() {
      elemCtrl.appendParentChild(groupTag);
    }

    function appendChild(child) {
      elemCtrl.appendChild(groupTag, child);
    }

    function removeChild(child) {
      elemCtrl.removeChild(groupTag, child);
    }

    function insertBefore() {
      groupTag.insertBefore.apply(groupTag, arguments);
    }
  })();

  var wiseFaceDetectionHelper = (function() {
    var returnVal = {};
    var wiseFaceDetectionCircle = null;

    if (wiseFaceDetection !== false) {
      wiseFaceDetection.strokeColor = typeof wiseFaceDetection.strokeColor === "undefined" ? '#dd2200' : wiseFaceDetection.strokeColor;
      wiseFaceDetection.strokeWidth = typeof wiseFaceDetection.strokeWidth === "undefined" ? 2 : wiseFaceDetection.strokeWidth;
      wiseFaceDetection.fillOpacity = typeof wiseFaceDetection.fillOpacity === "undefined" ? .5 : wiseFaceDetection.fillOpacity;
      wiseFaceDetection.fill = typeof wiseFaceDetection.fill === "undefined" ? '#ff000' : wiseFaceDetection.fill;
      wiseFaceDetection.heightRatio = typeof wiseFaceDetection.heightRatio === "undefined" ? 2.2 : wiseFaceDetection.heightRatio;
      wiseFaceDetection.widthRatio = typeof wiseFaceDetection.widthRatio === "undefined" ? false : wiseFaceDetection.widthRatio;

      returnVal.updateCircle = updateCircle;
      returnVal.append = append;
      returnVal.add = add;
      returnVal.remove = remove;
      returnVal.changeStrokeColor = changeStrokeColor;
    } else {
      returnVal = false;
    }

    return returnVal;

    function changeStrokeColor(strokeColor){
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'stroke', strokeColor);
    }

    function add() {
      wiseFaceDetectionCircle = elemCtrl.createCircle(10);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'stroke', wiseFaceDetection.strokeColor);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'stroke-width', wiseFaceDetection.strokeWidth);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'fill-opacity', wiseFaceDetection.fillOpacity);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'fill', wiseFaceDetection.fill);
      wiseFaceDetectionCircle.style.opacity = 0.4;
    }

    function append() {
      groupHelper.appendChild(wiseFaceDetectionCircle);
    }

    function remove() {
      groupHelper.removeChild(wiseFaceDetectionCircle);
    }

    function updateCircle(xAxis, yAxis, height) {
      var radius = height / 100;

      if ("heightRatio" in wiseFaceDetection) {
        radius *= wiseFaceDetection.heightRatio;
      } else if ("widthRatio" in wiseFaceDetection) {
        radius *= wiseFaceDetection.widthRatio;
      }

      elemCtrl.setAttr(wiseFaceDetectionCircle, 'cx', xAxis);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'cy', yAxis);
      elemCtrl.setAttr(wiseFaceDetectionCircle, 'r', radius);
    }
  })();

  /**
   * 포인트 추가/삭제 아이콘
   * @example
   var iconHelper = new IconHelper();
   iconHelper.createIcon('+');
   iconHelper.changePosition(10, 10);
   iconHelper.show();

   iconHelper.hide();
   */
  function IconHelper() {
    var iconText = null;
    var icon = null;
    var timer = null;
    var width = 16;
    var delay = 300;
    var clickEventHandler = null;

    /**
    iconType이 False: Minuse, True: Plus
    */
    this.createIcon = function(iconType) {
      var src = iconType ? plusImage : minusImage;

      if (icon === null) {
        icon = elemCtrl.createRect(width, width);
        iconText = elemCtrl.createImage(src, width, width)[0];
        // iconText = elemCtrl.createText(txt);

        elemCtrl.setAttr(icon, 'fill', '#000000');
        // elemCtrl.setAttr(iconText, 'fill', '#ffffff');

        icon.style.opacity = 0;
        icon.style.transition = 'opacity ' + delay + 'ms ease';
        iconText.style.opacity = 0;
        iconText.style.transition = 'opacity ' + delay + 'ms ease';

        if (clickEventHandler !== null) {
          icon.style.cursor = 'pointer';
          iconText.style.cursor = 'pointer';

          icon.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            clickEventHandler(event);
          });
          iconText.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            clickEventHandler(event);
          });
        }
      }
    };

    this.changePosition = function(x, y) {
      elemCtrl.setAttr(icon, 'x', x - width / 2);
      elemCtrl.setAttr(icon, 'y', y - width / 2);
      elemCtrl.setAttr(iconText, 'x', x - width / 2);
      elemCtrl.setAttr(iconText, 'y', y - width / 2);
    };

    this.show = function() {
      if (timer !== null) {
        clearTimeout(timer);
      } else {
        groupHelper.appendChild(icon);
        groupHelper.appendChild(iconText);
      }

      icon.style.opacity = 1;
      iconText.style.opacity = 1;
    };

    this.hide = function() {
      if (icon === null) {
        return;
      }

      if (icon.style.opacity === '1') {
        icon.style.opacity = 0;
        iconText.style.opacity = 0;

        clearTimeout(timer);
        timer = setTimeout(function() {
          try {
            groupHelper.removeChild(icon);
            groupHelper.removeChild(iconText);
          } catch (e) {
            console.error(e);
          }
          timer = null;
        }, delay);
      }
    };

    this.onClick = function(callBack) {
      clickEventHandler = callBack;
    };
  }

  var lines = [];
  var lineHelper = (function() {
    var tempArrForDragChecking = [];
    var iconHelper = new IconHelper();
    var hideOpacity = '0.5';

    iconHelper.createIcon(true);

    function backupPoints() {
      tempArrForDragChecking = LineInformation.getAll().points;
    }

    function isPointsChanged() {
      var returnVal = true;
      var currentPoints = LineInformation.getAll().points;
      if (tempArrForDragChecking.length !== currentPoints.length) {
        returnVal = false;
      }

      for (var i = 0, ii = tempArrForDragChecking.length; i < ii; i++) {
        if (
          tempArrForDragChecking[i][0] !== currentPoints[i][0] ||
          tempArrForDragChecking[i][1] !== currentPoints[i][1]) {
          returnVal = false;
          break;
        }
      }

      tempArrForDragChecking = [];

      return returnVal;
    }

    function addLine(useLineEvent, useLineCursor) {
      var newLine = elemCtrl.createLine(lineStrokeWidth);
      newLine.lineIndex = lines.length;
      if (useEvent === true && useLineEvent !== false) {
        bindEvent(newLine);
      }
      setDefaultColor(newLine);
      if (useLineCursor !== false) {
        setCursor(newLine);
      }
      lines.push(newLine);
    }

    function setDefaultColor(lineElement) {
      elemCtrl.setAttr(lineElement, 'stroke', lineColor);
    }

    function setSelectColor(lineElement) {
      elemCtrl.setAttr(lineElement, 'stroke', lineColor);
    }

    function hide(lineElement) {
      if (fill === true) {
        lineElement.style.display = 'none';
      } else {
        lineElement.style.opacity = hideOpacity;
      }
    }

    function show(lineElement) {
      if (fill === true) {
        lineElement.style.display = 'inline';
      } else {
        lineElement.style.opacity = 1;
      }
    }

    function hidePointIcon() {
      iconHelper.hide();
    }

    function showPointIcon() {
      if (
        selectedLineIndex !== null || //드래그를 하고 있을 때
        this.style.opacity === hideOpacity || //선택된 오브젝트가 아닐 때
        pointsLength >= maxPoint) { //최대 포인트일 때
        return;
      }
      var isFirstLine = this.previousElementSibling === null;
      var x1 = parseInt(elemCtrl.getAttr(this, 'x1'));
      var y1 = parseInt(elemCtrl.getAttr(this, 'y1'));
      var x2 = parseInt(elemCtrl.getAttr(this, 'x2'));
      var y2 = parseInt(elemCtrl.getAttr(this, 'y2'));
      var lineCenter = [];

      if (isFirstLine) {
        lineCenter = funnyMath.getLineCenter(x1, y1, x2, y2);
        x2 = lineCenter[0];
        y2 = lineCenter[1];
      }

      lineCenter = funnyMath.getLineCenter(x1, y1, x2, y2);

      iconHelper.changePosition(lineCenter[0], lineCenter[1]);
      iconHelper.show();
    }

    function mouseUpHandler() {
      setTimeout(function() {
        callCustomEvent("mouseup", LineInformation.getAll());
      });
    }

    function bindEvent(lineElement) {
      lineElement.onmousedown = selectLine;

      lineElement.onmouseup = mouseUpHandler;
      lineElement.addEventListener('mouseleave', function() {
        if (this.isSelected === true) {
          mouseUpHandler();
        }
      });

      lineElement.addEventListener('contextmenu', function(event) {
        callCustomEvent("linecontextmenu", event);
      });

      if (useOnlyRectangle === false && fixedRatio === false) {
        lineElement.removeEventListener('click', addPointInLine);
        lineElement.addEventListener('click', addPointInLine);

        //Add Point
        lineElement.addEventListener('mouseover', showPointIcon);
        lineElement.addEventListener('mouseout', hidePointIcon);
        lineElement.addEventListener('mousedown', hidePointIcon);
      }
    }

    function addPointInLine(event) {
      var pageAxis = null;
      var xAxis = null;
      var yAxis = null;
      var leftAxis = null;
      var rightAxis = null;

      //선택 되었을 때만 사용가능
      if (LineInformation.isAllSelected === false) {
        // console.log("LineInformation.isAllSelected === false return");
        return;
      }

      if (isPointsChanged() === false) {
        // console.log("isPointsChanged() === false return");
        return;
      }

      if (pointsLength >= maxPoint) {
        // console.log("pointsLength >= maxPoint return");
        return;
      }

      pageAxis = commonFunc.getPageAxis(event);
      xAxis = pageAxis[0];
      yAxis = pageAxis[1];

      if (minLineLength !== false) {
        leftAxis = LineInformation.getAxis(this.lineIndex);
        rightAxis = LineInformation.getAxis(this.lineIndex === lines.length - 1 ? 0 : this.lineIndex + 1);

        if (
          funnyMath.pythagoreanTheorem(xAxis, yAxis, leftAxis[0], leftAxis[1]) < minLineLength ||
          funnyMath.pythagoreanTheorem(xAxis, yAxis, rightAxis[0], rightAxis[1]) < minLineLength
        ) {
          return;
        }
      }

      addPoint(xAxis, yAxis, this.lineIndex + 1);
    }

    function appendAll() {
      for (var i = 0, len = lines.length; i < len; i++) {
        elemCtrl.appendChild(groupHelper, lines[i]);
      }
    }

    function selectLine() {
      setSelectColor(this);
      this.isSelected = true;
      groupHelper.moveTopLayer();
      backupPoints();
    }

    function appendAtLast() {
      var lineLength = lines.length;
      var newLineElement = lines[lineLength - 1];
      var nextElementSibling = lines[lineLength - 2].nextElementSibling;

      groupHelper.insertBefore(
        newLineElement,
        nextElementSibling
      );
    }

    function removeAll() {
      for (var i = 0, len = lines.length; i < len; i++) {
        elemCtrl.removeChild(groupHelper, lines[i]);
      }
    }

    return {
      addLine: addLine,
      setDefaultColor: setDefaultColor,
      setSelectColor: setSelectColor,
      appendAll: appendAll,
      appendAtLast: appendAtLast,
      bindEvent: bindEvent,
      removeAll: removeAll,
      hide: hide,
      show: show
    };
  })();

  var circles = [];
  var circleHelper = (function() {
    var isLeave = false;
    var iconHelper = new IconHelper();
    var iconHelperTimer = null;
    var hoveredPointIndex = null;

    iconHelper.onClick(function(event) {
      removeCircle.call({
        circleIndex: hoveredPointIndex
      }, event);
      update();
    });
    iconHelper.createIcon(false);

    function addCircle(radius, useCircleEvent, useCircleCursor) {
      var newCircle = elemCtrl.createRect(radius * 2, radius * 2);
      if (useResizeRectangle === true || useEvent === true && useCircleEvent !== false) {
        bindEvent(newCircle);
      }
      setDefaultColor(newCircle);
      if (useCircleCursor !== false) {
        setCursor(newCircle);
      }

      newCircle.circleIndex = circles.length;
      circles.push(newCircle);
    }

    function bindEvent(circleElement) {
      circleElement.onmousedown = selectCircle;
      circleElement.onmouseup = function() {
        isLeave = false;
        if (customDraw === true) {
          return;
        }
        update();
      };
      circleElement.addEventListener('mouseleave', function() {
        isLeave = true;
      });

      if (fixedRatio !== true) {
        circleElement.customContextmenu = removeCircle;
        circleElement.addEventListener('contextmenu', function(event) {
          event.preventDefault();
        });
        circleElement.addEventListener('mouseover', showDeleteIcon);
        circleElement.addEventListener('mouseout', hideDeleteIconWithDelay);
        circleElement.addEventListener('mousedown', hideDeleteIcon);
      }
    }

    function showDeleteIcon() {
      if (
        selectedCircleIndex !== null ||
        pointsLength <= minPoint) { //최대 포인트일 때
        return;
      }

      hoveredPointIndex = this.circleIndex;

      var xAxis = parseInt(elemCtrl.getAttr(this, 'x'));
      var yAxis = parseInt(elemCtrl.getAttr(this, 'y'));
      var width = parseInt(elemCtrl.getAttr(this, 'width'));
      var height = parseInt(elemCtrl.getAttr(this, 'height'));

      if (xAxis - width * 2 < 0) {
        xAxis += width * 2;
      } else {
        xAxis -= width;
      }

      if (yAxis - width * 2 < 0) {
        yAxis += height * 2;
      } else {
        yAxis -= height;
      }

      clearTimeout(iconHelperTimer);

      iconHelper.changePosition(xAxis, yAxis);
      iconHelper.show();
    }

    function hideDeleteIcon() {
      iconHelper.hide();
    }

    function hideDeleteIconWithDelay() {
      clearTimeout(iconHelperTimer);
      iconHelperTimer = setTimeout(function() {
        iconHelper.hide();
      }, 700);
    }

    function update() {
      setTimeout(function() {
        callCustomEvent("mouseup", LineInformation.getAll());
      });
    }

    function isMouseLeave() {
      return isLeave;
    }

    function removeCircle(event) {
      var self = this;

      event.preventDefault();

      if (pointsLength <= minPoint) {
        return;
      }

      if (this.nodeName === "text") {
        self = circles[pointsLength - 1];
      }

      points.splice(self.circleIndex, 1);
      pointsLength = points.length;
      reset();
      init();
      changeActiveStatus();
    }

    function selectCircle() {
      isLeave = false;
      var self = this;
      if (this.nodeName === "text") {
        self = circles[pointsLength - 1];
      }

      setSelectColor(self);
      self.isSelected = true;
      setCursor(parentSvg);
    }

    function setDefaultColor(circleElement) {

      elemCtrl.setAttr(circleElement, "fill", pointColor);
    }

    function setSelectColor(circleElement) {
      elemCtrl.setAttr(circleElement, "fill", pointColor);
    }

    function hide(circleElement) {
      circleElement.style.display = 'none';
    }

    function show(circleElement) {
      circleElement.style.display = 'inline';
    }

    function appendAll() {
      for (var i = 0, len = circles.length; i < len; i++) {
        elemCtrl.appendChild(groupHelper, circles[i]);
      }
    }

    function changeRadius(index, radius) {
      elemCtrl.setAttr(circles[index], 'width', radius * 2);
      elemCtrl.setAttr(circles[index], 'height', radius * 2);
    }

    function appendAtLast() {
      var circleLength = circles.length;
      var newCircleElement = circles[circleLength - 1];
      var nextElementSibling = circles[circleLength - 2].nextElementSibling;

      if (textInCircle === null || nextElementSibling === null) {
        elemCtrl.appendChild(groupHelper, newCircleElement);
      } else {
        groupHelper.insertBefore(
          newCircleElement,
          nextElementSibling
        );
      }
    }

    function removeAll() {
      for (var i = 0, len = circles.length; i < len; i++) {
        elemCtrl.removeChild(groupHelper, circles[i]);
      }
    }

    return {
      addCircle: addCircle,
      bindEvent: bindEvent,
      selectCircle: selectCircle,
      setDefaultColor: setDefaultColor,
      setSelectColor: setSelectColor,
      appendAll: appendAll,
      changeRadius: changeRadius,
      appendAtLast: appendAtLast,
      removeAll: removeAll,
      update: update,
      isMouseLeave: isMouseLeave,
      hide: hide,
      show: show
    }
  })();

  var polygon = null;
  var polygonHelper = (function() {
    var isLeave = false;

    function addPolygon() {
      polygon = elemCtrl.createPolygon();
      if (useEvent === true) {
        bindEvent(polygon);
      }
      setCursor(polygon);
    }

    function append() {
      if (fill === true) {
        elemCtrl.appendChild(groupHelper, polygon);
      }
    }

    function selectPolygon() {
      setSelectColor();
      polygon.isSelected = true;
      groupHelper.moveTopLayer();
    }

    function bindEvent() {
      polygon.onmousedown = selectPolygon;
      /*
      @date: 2016-09-19
      oncontextmenu로 하면 IE에서 정상 동작을 하지 않기 때문에 삭제됨.
      polygon.oncontextmenu = function(event){
      	callCustomEvent("polygoncontextmenu", event);
      };
      */
      polygon.onmouseup = function() {
        isLeave = false;
        if (customDraw === true) {
          return;
        }
        update();
      };
      polygon.addEventListener('mouseleave', function() {
        if (polygon.isSelected === true) {
          isLeave = true;
          update();
        }
      });
      polygon.addEventListener('contextmenu', function(event) {
        callCustomEvent("polygoncontextmenu", event);
      });
      // polygon.onmouseup = function(){
      // 	callCustomEvent("mouseup", LineInformation.getAll());
      // };
    }

    function remove() {
      if (fill === true) {
        elemCtrl.removeChild(groupHelper, polygon);
      }
    }

    function setDefaultColor() {
      if (fill === true) {
        polygon.style.fill = fillColor;
        polygon.style.opacity = fillOpacity;
      }
    }

    function setSelectColor() {
      if (polygon === null) {
        return;
      }

      var opacity = fillOpacity;
      if (opacity > 0) {
        opacity = opacity + opacity * 0.5;
      }
      polygon.style.opacity = opacity;
    }

    function update() {
      setTimeout(function() {
        callCustomEvent("mouseup", LineInformation.getAll());
      });
    }

    return {
      addPolygon: addPolygon,
      append: append,
      bindEvent: bindEvent,
      selectPolygon: selectPolygon,
      remove: remove,
      setDefaultColor: setDefaultColor,
      setSelectColor: setSelectColor
    };
  })();

  var textTag = null;
  var textTagHelper = (function() {
    function addText() {
      if (textInCircle !== null) {
        textTag = elemCtrl.createText(textInCircle);
        textTag.style.fontSize = '12px';
        setCursor(textTag);
        bindEvent();
      }
    }

    function bindEvent() {
      var lastCircle = circles[pointsLength - 1];

      textTag.onmousedown = lastCircle.onmousedown;
      textTag.onmouseup = lastCircle.onmouseup;
      if (fixedRatio !== true) {
        textTag.addEventListener('contextmenu', lastCircle.customContextmenu);
      }
    }

    function append() {
      if (textInCircle !== null) {
        elemCtrl.appendChild(groupHelper, textTag);
      }
    }

    function remove() {
      if (textInCircle !== null) {
        elemCtrl.removeChild(groupHelper, textTag);
      }
    }

    function show() {
      if (textInCircle !== null) {
        textTag.style.display = 'inline';
      }
    }

    function hide() {
      if (textInCircle !== null) {
        textTag.style.display = 'none';
      }
    }

    return {
      addText: addText,
      append: append,
      remove: remove,
      show: show,
      hide: hide
    };
  })();

  var arrowImageContainner = null;
  var arrowImage = null;
  var halfArrowWidth = imageWidth / 2;
  var halfArrowHeight = imageHeight / 2;
  var arrowTextContainner = null;
  var arrowText = [];

  var arrowImageHelper = (function() {
    var arrowQueue = ['L', 'R', 'LR'];
    var arrowQueueLength = arrowQueue.length;
    var arrowScope = [];
    var currentArrow = null;

    //set Scope of Arrow
    function setArrowScope() {
      var startIndex = 0;
      var endIndex = 0;
      for (var idx = 0; idx < arrowQueueLength; idx++) {
        if (arrowQueue[idx] === arrow.min) {
          startIndex = idx;
        }
        if (arrowQueue[idx] === arrow.max) {
          endIndex = idx;
        }
      }

      for (var i = startIndex; i <= endIndex; i++) {
        arrowScope.push(arrowQueue[i]);
      }
    }

    function getNextArrow(arrow) {
      var nextIndex = 0;
      var arrowScopeLength = arrowScope.length;

      for (var i = 0, len = arrowScope.length; i < len; i++) {
        if (arrowScope[i] === arrow && arrowScopeLength - 1 !== i) {
          nextIndex = i + 1;
          break;
        }
      }

      return arrowQueue[nextIndex];
    }

    function addArrowGuideText() {
      if (arrow !== null) {
        if ('text' in arrow) {
          if (arrow.text === true) {
            arrowTextContainner = elemCtrl.createGroup();
            arrowText[0] = elemCtrl.createText('A');
            elemCtrl.appendChild(arrowTextContainner, arrowText[0]);
            arrowText[1] = elemCtrl.createText('B');
            elemCtrl.appendChild(arrowTextContainner, arrowText[1]);
          }
        }
      }
    }

    function show() {
      arrowTextContainner.style.display = 'inline';
      arrowImage.style.display = 'inline';
    }

    function hide() {
      arrowTextContainner.style.display = 'none';
      arrowImage.style.display = 'none';
    }

    function changeArrowGuideText(xAxis, yAxis, angle) {
      var radius = halfArrowWidth + 20;
      var textHalfWidth = 4;
      var textHalfHeight = 6;
      var getXAxisOfText = function(angle) {
        return funnyMath.getCosine(angle) * radius - textHalfWidth;
      };

      var getYAxisOfText = function(angle) {
        return funnyMath.getSine(angle) * radius + textHalfHeight;
      };

      var axis = [{
          x: getXAxisOfText(angle + 180),
          y: getYAxisOfText(angle + 180)
        },
        {
          x: getXAxisOfText(angle),
          y: getYAxisOfText(angle)
        }
      ];

      if (arrowTextContainner !== null) {
        elemCtrl.setAttr(arrowText[0], 'x', xAxis + axis[0].x);
        elemCtrl.setAttr(arrowText[0], 'y', yAxis + axis[0].y);

        elemCtrl.setAttr(arrowText[1], 'x', xAxis + axis[1].x);
        elemCtrl.setAttr(arrowText[1], 'y', yAxis + axis[1].y);
      }
    }

    function addImage() {
      if (useArrow === true) {
        var imagePath = arrow.mode === arrowQueue[arrowQueueLength - 1] ? normalAllImage : normalImage;
        var createdImage = elemCtrl.createImage(imagePath, imageWidth, imageHeight, true);
        arrowImage = createdImage[0];
        arrowImageContainner = createdImage[1];

        addArrowGuideText();
        setCursor(arrowImage);
        bindEvent();
        changeArrow(arrow.mode);
      }
    }

    function changeArrow(arrow) {
      currentArrow = arrow;
      changeArrowImage();
      changeArrowImagePath();
    }

    function getArrow() {
      return currentArrow;
    }

    function changeArrowImage() {
      var startAxis = LineInformation.getAxis(0);
      var endAxis = LineInformation.getAxis(1);
      var angle = funnyMath.getAngle(startAxis[0], startAxis[1], endAxis[0], endAxis[1]);
      var textAngle = angle;
      var degree = currentArrow === arrowQueue[1] ? 90 : 270;

      var lineCenter = funnyMath.getLineCenter(startAxis[0], startAxis[1], endAxis[0], endAxis[1]);

      var xAxis = lineCenter[0];
      var yAxis = lineCenter[1];

      elemCtrl.setAttr(arrowImage, 'x', xAxis);
      elemCtrl.setAttr(arrowImage, 'y', yAxis);

      if (notUseAutoChangeOfArrow !== true) {
        if (Math.abs(angle) > 90) {
          degree = degree === 90 ? 270 : 90;
          textAngle -= 180;
        }
      }

      changeArrowGuideText(xAxis, yAxis, textAngle);

      angle += degree;

      elemCtrl.setAttr(arrowImageContainner, 'transform', 'rotate(' + angle + ' ' + xAxis + ' ' + yAxis + ') translate(' + (halfArrowWidth * -1) + ',' + (halfArrowHeight * -1) + ')');
    }

    function changeArrowImagePath() {
      var imagePath = currentArrow === arrowQueue[arrowQueueLength - 1] ? normalAllImage : normalImage;
      elemCtrl.setAttr(arrowImage, 'href', imagePath, NS.XLINK);
    }

    function bindEvent() {
      if (useEvent === true) {
        arrowImage.onclick = function(event) {
          event.stopPropagation();
        };

        arrowImage.onmousedown = function(event) {
          event.stopPropagation();

          var imagePath = currentArrow === arrowQueue[arrowQueueLength - 1] ? pressAllImage : pressImage;

          arrowImage.isSelected = true;
          elemCtrl.setAttr(arrowImage, 'href', imagePath, NS.XLINK);
        };

        arrowImage.onmouseup = function(event) {
          event.stopPropagation();

          if (arrowImage.isSelected === true) {
            var arrow = getNextArrow(currentArrow);

            arrowImage.isSelected = false;

            changeArrow(arrow);

            callCustomEvent("mouseup", LineInformation.getAll());
          }
        };

        arrowImage.onmouseleave = function(event) {
          event.stopPropagation();

          if (arrowImage.isSelected === true) {
            arrowImage.onmouseup(event);
          }
        };
      }
    }

    function remove() {
      if (useArrow === true) {
        arrowImageContainner.removeChild(arrowImage);
        groupHelper.removeChild(arrowImageContainner);


        if (arrowTextContainner !== null) {
          arrowTextContainner.removeChild(arrowText[0]);
          arrowTextContainner.removeChild(arrowText[1]);

          groupHelper.removeChild(arrowTextContainner);
        }
      }
    }

    function append() {
      if (arrowImageContainner !== null) {
        arrowImageContainner.appendChild(arrowImage);
        groupHelper.appendChild(arrowImageContainner);
      }

      if (arrowTextContainner !== null) {
        arrowTextContainner.appendChild(arrowText[0]);
        arrowTextContainner.appendChild(arrowText[1]);

        groupHelper.appendChild(arrowTextContainner);
      }
    }

    if (useArrow === true) {
      setArrowScope();
    }

    return {
      addImage: addImage,
      append: append,
      remove: remove,
      getArrow: getArrow,
      changeArrowImage: changeArrowImage,
      changeArrow: changeArrow,
      show: show,
      hide: hide
    };
  })();

  function setCursor(element) {
    var cursor = useCursor === true ? 'pointer' : 'default';
    element.style.cursor = cursor;
  }

  function resetCursor(element) {
    element.style.cursor = 'default';
  }

  var LineInformation = {
    points: points,
    isAllSelected: false,
    getAll: function() {
      return {
        points: commonFunc.cloneObject(LineInformation.points),
        arrow: arrowImageHelper.getArrow()
      };
    },
    addAxis: function(xAxis, yAxis, appendIndex) {
      var lastPoint = null;
      var newPoint = null;

      var offset = commonFunc.parentOffset();

      if (typeof xAxis === "undefined" && typeof yAxis === "undefined") {
        lastPoint = LineInformation.getAxis(pointsLength - 1);
        newPoint = [lastPoint[0], lastPoint[1]];
        newPoint[0] += circleRadius;
        newPoint[1] += circleRadius;

        if (newPoint[0] < 0) {
          newPoint[0] = 0;
        }
        if (newPoint[1] < 0) {
          newPoint[1] = 0;
        }
        if (newPoint[0] > offset.width) {
          newPoint[0] = offset.width;
        }
        if (newPoint[1] > offset.height) {
          newPoint[1] = offset.height;
        }
      } else {
        newPoint = [xAxis, yAxis];
      }

      if (typeof appendIndex !== "undefined") {
        LineInformation.appendAxis(appendIndex, newPoint[0], newPoint[1]);
      } else {
        LineInformation.setAxis(pointsLength, newPoint[0], newPoint[1]);
      }

      pointsLength++;
    },
    validateAxis: function(xAxis, yAxis) {
      var offset = commonFunc.parentOffset();
      var returnVal = true;

      if (
        xAxis < 0 ||
        yAxis < 0 ||
        xAxis > offset.width ||
        yAxis > offset.height
      ) {
        returnVal = false;
      }

      return returnVal;
    },
    validateAllPoint: function(movedXAxis, movedYAxis) {
      var returnVal = true;

      for (var i = 0; i < pointsLength; i++) {
        var self = LineInformation.points[i];
        if (LineInformation.validateAxis(self[0] + movedXAxis, self[1] + movedYAxis) === false) {
          returnVal = false;
          break;
        }
      }

      return returnVal;
    },
    validateGeometrySize: function(geometryWidth, geometryHeight) {
      var isOk = true;

      if (typeof minSize !== "undefined") {
        if (geometryWidth < minSize.width || geometryHeight < minSize.height) {
          isOk = false;
        }
      }

      if (typeof maxSize !== "undefined") {
        if (geometryWidth > maxSize.width || geometryHeight > maxSize.height) {
          isOk = false;
        }
      }

      return isOk;
    },
    setAxis: function(index, x, y) {
      LineInformation.points[index] = [x, y];
    },
    appendAxis: function(index, x, y) {
      LineInformation.points.splice(index, 0, [x, y]);
    },
    getAxis: function(index) {
      return LineInformation.points[index];
    },
    //모든 SVG 태그들을 좌표를 기준으로 변경한다.
    changeAxis: function() {
      var polygonPoint = '';
      var idx = 0;
      var len = 0;
      var height = 0;

      for (idx = 0, len = lines.length; idx < len; idx++) {
        var startAxis = LineInformation.points[idx];
        var endAxisIndex = fill === true && idx === len - 1 ? 0 : idx + 1;
        var endAxis = LineInformation.points[endAxisIndex];
        var startXAxis = startAxis[0];
        var endXAxis = endAxis[0];

        lines[idx].setAttributeNS(null, 'x1', startXAxis);
        lines[idx].setAttributeNS(null, 'y1', startAxis[1]);
        lines[idx].setAttributeNS(null, 'x2', endXAxis);
        lines[idx].setAttributeNS(null, 'y2', endAxis[1]);
      }

      for (idx = 0, len = circles.length; idx < len; idx++) {
        var pointAxis = LineInformation.points[idx];
        var circleXAxis = pointAxis[0];
        var circleYAxis = pointAxis[1];
        var selfCircle = circles[idx];
        var width = parseInt(elemCtrl.getAttr(selfCircle, 'width'));
        height = parseInt(elemCtrl.getAttr(selfCircle, 'height'));

        /**
         * 고정비 사각형일 때, 부모의 영역를 넘어갈 경우 Safari에서
         * 정상적으로 Cursor가 지정이 안되므로 2px 이동 시킨다.
         */
        if (fixedRatio === false && useOnlyRectangle === false) {
          circleXAxis -= width / 2;
          circleYAxis -= height / 2;
        } else if (fixedRatio === true) {
          switch (idx) {
            case rectangleIndex[0]:
              circleXAxis -= width - lineStrokeWidth / 2;
              circleYAxis -= height - lineStrokeWidth / 2;
              break;
            case rectangleIndex[1]:
              circleXAxis -= lineStrokeWidth / 2;
              circleYAxis -= height - lineStrokeWidth / 2;
              break;
            case rectangleIndex[2]:
              circleXAxis -= width - lineStrokeWidth / 2;
              circleYAxis -= height - lineStrokeWidth / 2;
              break;
            case rectangleIndex[3]:
              circleXAxis -= width - lineStrokeWidth / 2;
              circleYAxis -= lineStrokeWidth / 2;
              break;
          }
        }

        selfCircle.setAttributeNS(null, "x", circleXAxis);
        selfCircle.setAttributeNS(null, "y", circleYAxis);

        if (idx === len - 1 && textInCircle !== null) {
          textTag.setAttributeNS(null, 'x', pointAxis[0] - 3);
          textTag.setAttributeNS(null, 'y', pointAxis[1] + 4);
        }

        if (fill === true) {
          polygonPoint += pointAxis[0] + ',' + pointAxis[1] + ' ';
        }
      }

      if (fill === true) {
        polygon.setAttributeNS(null, 'points', polygonPoint.replace(/[\s]{1}$/, ''));
      }

      if (useArrow === true) {
        arrowImageHelper.changeArrowImage();
      }

      if (wiseFaceDetection !== false && wiseFaceDetectionHelper !== false) {
        var firstPoint = LineInformation.points[0];
        var secondPoint = LineInformation.points[1];
        var thridPoint = LineInformation.points[2];
        var xAxis = funnyMath.getLineCenter(secondPoint[0], secondPoint[1], thridPoint[0], thridPoint[1])[0];
        var yAxis = funnyMath.getLineCenter(firstPoint[0], firstPoint[1], secondPoint[0], secondPoint[1])[1];
        height = 0;

        if ("heightRatio" in wiseFaceDetection) {
          height = firstPoint[1] - secondPoint[1];
        } else if ("widthRatio" in wiseFaceDetection) {
          height = firstPoint[0] - secondPoint[0];
        }

        height = Math.abs(height);

        wiseFaceDetectionHelper.updateCircle(xAxis, yAxis, height);
      }
    },
    resetAllColor: function() {
      var idx = 0;
      var len = 0;

      for (idx = 0, len = lines.length; idx < len; idx++) {
        lineHelper.setDefaultColor(lines[idx]);
      }
      for (idx = 0, len = circles.length; idx < len; idx++) {
        circleHelper.setDefaultColor(circles[idx]);
      }

      polygonHelper.setDefaultColor();

      LineInformation.isAllSelected = false;
    },
    setAllColor: function() {
      var idx = 0;
      var len = 0;

      for (idx = 0, len = lines.length; idx < len; idx++) {
        lineHelper.setSelectColor(lines[idx]);
      }
      for (idx = 0, len = circles.length; idx < len; idx++) {
        circleHelper.setSelectColor(circles[idx]);
      }

      polygonHelper.setSelectColor();

      LineInformation.isAllSelected = true;
    }
  };

  function createSVGElement() {
    var radius = circleRadius;
    var addLine = function() {
      if (fixedRatio === true) {
        lineHelper.addLine(false, false);
      } else {
        lineHelper.addLine();
      }
    };

    for (var i = 0, len = pointsLength; i < len; i++) {
      if (i < len - 1) {
        addLine();
      } else {
        if (textInCircle !== null) {
          radius *= 1.5;
        }

        if (fill === true) {
          addLine();
          polygonHelper.addPolygon();
        }
      }

      if (fixedRatio === true) {
        if (i === rectangleIndex[2]) {
          circleHelper.addCircle(radius);
        } else {
          //Circle을 작게 그려서 안보이게 함.
          circleHelper.addCircle(0, false, false);
        }
      } else {
        circleHelper.addCircle(radius);
      }
    }

    textTagHelper.addText();
    arrowImageHelper.addImage();
    groupHelper.add();

    if (wiseFaceDetection !== false) {
      wiseFaceDetectionHelper.add();
    }
  }

  function appendDom() {
    //appending sequense is important.
    //Group -> Polygon -> Line -> Circle -> Text
    groupHelper.append();
    polygonHelper.append();
    lineHelper.appendAll();
    circleHelper.appendAll();
    textTagHelper.append();
    arrowImageHelper.append();

    if (wiseFaceDetectionHelper !== false) {
      wiseFaceDetectionHelper.append();
    }
  }

  function resetElementStatus() {
    if (selectedLineIndex !== null) {
      lines[selectedLineIndex].isSelected = false;
      selectedLineIndex = null;
    }

    if (selectedCircleIndex !== null) {
      for (var i = 0, len = circles.length; i < len; i++) {
        if (circles[i].isSelected === true) {
          circles[i].isSelected = false;
        }
      }

      selectedCircleIndex = null;
    }

    if (fill === true) {
      polygon.isSelected = false;
      selectedPolygon = null;
    }

    if (fixedRatio === true) {
      parentSvg.ratio = [];
    }

    parentSvg.startAxis = null;

    if (LineInformation.isAllSelected === false) {
      LineInformation.resetAllColor();
    }

    resetCursor(parentSvg);
  }

  function resetParentSvgAttr() {
    setTimeout(function() {
      elemCtrl.setParentSvgAttr(parentSvgMovedAttr, false);
    }, 100);
  }

  function callCustomEvent(eventName, arg) {
    if ((useResizeRectangle === true || useEvent === true) && customEvent !== null && customDraw === false) {
      if (eventName in customEvent) {
        var method = Array.isArray(arg) === true ? "apply" : "call";
        customEvent[eventName][method](drawObj, arg);
      }
    }
  }

  function toggleDraggingStatus(statusType) {
    var method = statusType === true ? "add" : "remove";
    var className = "kind-svg-editor-drawing";

    document.body.classList[method](className);
  }

  function parentSVGMouseUpHandle() {
    toggleDraggingStatus(false);

    if (selectedCircleIndex !== null && circleHelper.isMouseLeave()) {
      circleHelper.update();
    }

    if (selectedLineIndex !== null) {
      callCustomEvent("mouseup", LineInformation.getAll());
    }

    resetElementStatus();
    resetParentSvgAttr();
  }

  // function parentSVGMouseLeaveHandle(){
  // 	resetElementStatus();
  // 	resetParentSvgAttr();
  // }

  /* mousedown에 세팅한 값은 항상 mouseup에 리셋을 해줘야 한다. */
  function parentSVGMouseDownHandle(event) {
    parentSvg.startAxis = commonFunc.getPageAxis(event);
    var idx = 0;
    var len = 0;

    for (idx = 0, len = circles.length; idx < len; idx++) {
      if (circles[idx].isSelected === true) {
        selectedCircleIndex = idx;
        break;
      }
    }

    //Check selected Line
    if (selectedCircleIndex === null && fixedRatio === false) {
      for (idx = 0, len = lines.length; idx < len; idx++) {
        if (lines[idx].isSelected === true) {
          selectedLineIndex = idx;
          break;
        }
      }
    }

    if (fixedRatio === true && ratio !== false) {
      parentSvg.ratio = ratio;
    } else if (selectedCircleIndex !== null && fixedRatio === true) {
      //최대 공약수를 구해서 메모리 최적화 필요
      parentSvg.ratio = [
        points[2][0] - points[0][0],
        points[2][1] - points[0][1]
      ];
    }

    if (fill === true) {
      if (polygon.isSelected === true) {
        selectedPolygon = true;
      }
    }

    if (customDraw === true) {
      selectedCircleIndex =
        (useOnlyRectangle === true || useRectangleForCustomDraw === true) ?
        2 :
        circles.length - 1;
      toggleDraggingStatus(true);
    } else if (
      (customDraw === false) &&
      selectedCircleIndex !== null ||
      selectedLineIndex !== null ||
      selectedPolygon !== null
    ) {
      elemCtrl.setParentSvgAttr(parentSvgMovedAttr, true);
      toggleDraggingStatus(true);
    }
  }

  function parentSVGMouseMoveHandle(event) {
    if (customDraw === true && selectedCircleIndex === null) {
      parentSVGMouseDownHandle(event);
    }

    if (
      selectedCircleIndex === null &&
      selectedLineIndex === null &&
      selectedPolygon === null &&
      customDraw === false
    ) {
      return;
    }

    var pageAxis = commonFunc.getPageAxis(event);
    var xAxis = pageAxis[0];
    var yAxis = pageAxis[1];

    var movedXAxis = xAxis - parentSvg.startAxis[0];
    var movedYAxis = yAxis - parentSvg.startAxis[1];

    var offsetWidth = commonFunc.parentOffset().width;
    var offsetHeight = commonFunc.parentOffset().height;

    var firstPoint = LineInformation.getAxis(rectangleIndex[0]);
    var thirdPoint = LineInformation.getAxis(rectangleIndex[2]);

    var prevPoints = [];


    var changedX1 = 0;
    var changedX2 = 0;
    var changedY1 = 0;
    var changedY2 = 0;

    var self = null;

    //포인트를 선택하여 영역을 이동 시킬 때
    if (selectedCircleIndex !== null) {
      /*
      Point 이동 시 좌표 유효성 체크
      움직였을 때의 거리를 계산하여 유효성을 체크한다.
      */
      if (xAxis < 0) {
        xAxis = 0;
      } else if (xAxis > offsetWidth) {
        xAxis = offsetWidth;
      }

      if (yAxis < 0) {
        yAxis = 0;
      } else if (yAxis > offsetHeight) {
        yAxis = offsetHeight;
      }

      /*if(
      	LineInformation.validateAxis(xAxis, yAxis) === false
      	){
      	return;
      }*/

      //사각형 리사이징
      if (fixedRatio === true || useRectangleForCustomDraw === true) {

        //사각형
        if (useOnlyRectangle === true || useRectangleForCustomDraw === true) {
          changedX1 = firstPoint[0];
          changedX2 = xAxis;
          changedY1 = firstPoint[1];
          changedY2 = yAxis;

          //가로 Min, Max Validation
          if (!LineInformation.validateGeometrySize(
              Math.abs(changedX1 - changedX2),
              Math.abs(changedY1 - thirdPoint[1])
            )) {
            changedX2 = thirdPoint[0];
          }

          //세로 Min, Max Validation
          if (!LineInformation.validateGeometrySize(
              Math.abs(changedX1 - thirdPoint[0]),
              Math.abs(changedY1 - changedY2)
            )) {
            changedY2 = thirdPoint[1];
          }
        } else { //고정비 확대
          var totalMovement = Math.abs(movedXAxis) + Math.abs(movedYAxis);

          var incrementXAxis = parentSvg.ratio[0] / (parentSvg.ratio[1] + parentSvg.ratio[0]) * totalMovement;

          if (movedXAxis < 0 || movedYAxis < 0) {
            incrementXAxis *= -1;
          }

          changedX1 = firstPoint[0];
          changedX2 = xAxis + incrementXAxis;
          changedY1 = firstPoint[1];
          changedY2 = changedY1 + ((changedX2 - changedX1) * parentSvg.ratio[1] / parentSvg.ratio[0]);

          //변경된좌표 체크
          if (LineInformation.validateAxis(changedX2, changedY2) === false) {
            /**
             * @date 2017-04-24
             * maxSize로 적용한 것은 최대 사이즈로 정상 적용을 위해서 이다.
             * 두번재 (x,y)가 0 보다 작을 때는 최소 사이즈보다 작을 때 이므로,
             * 분기를 추가 한다.
             */
            if (
              (changedX1 === 0 && changedY1 === 0) &&
              (changedX2 > 0 && changedY2 > 0)
            ) {
              changedX2 = maxSize.width;
              changedY2 = maxSize.height;
            } else {
              return;
            }
          }

          //Min, Max Validation
          if (!LineInformation.validateGeometrySize(Math.abs(changedX1 - changedX2), Math.abs(changedY1 - changedY2))) {
            return;
          }
        }

        //뒤집어지는 것을 방지 하기 위해 세번째 포인트가 첫번째 포인트 보다 적을 때 return
        if (firstPoint[0] > changedX2 || firstPoint[1] > changedY2) {
          return;
        }

        changeRectangle(changedX1, changedY1, changedX2, changedY2);

        //라인과 폴리곤 사각형의 Circle
      } else {
        var validateAxis = [];
        var leftAxisIndex = 0;
        var rightAxisIndex = 0;
        /**
         * Custom Drawing 중일 때는 Line 제한을 하지 않고,
         * custom 함수에서 클릭시 제한을 한다.
         */
        if (
          customDraw === false &&
          minLineLength !== false) {

          if (!(fill === false && selectedCircleIndex === 0)) {
            leftAxisIndex = selectedCircleIndex === 0 ? circles.length - 1 : selectedCircleIndex - 1;
            validateAxis.push(LineInformation.getAxis(leftAxisIndex));
          }

          if (!(fill === false && selectedCircleIndex === circles.length - 1)) {
            rightAxisIndex = selectedCircleIndex === circles.length - 1 ? 0 : selectedCircleIndex + 1;
            validateAxis.push(LineInformation.getAxis(rightAxisIndex));
          }

          for (var i = 0, ii = validateAxis.length; i < ii; i++) {
            self = validateAxis[i];

            if (funnyMath.pythagoreanTheorem(xAxis, yAxis, self[0], self[1]) < minLineLength) {
              return;
            }
          }
        }

        prevPoints = LineInformation.getAll().points;
        prevPoints[selectedCircleIndex] = [xAxis, yAxis];

        if (validateStabilization(prevPoints) === false) {
          return;
        }

        LineInformation.setAxis(selectedCircleIndex, xAxis, yAxis);
      }
      //라인을 선택하여 이동할 때
    } else if (fill === true && selectedLineIndex !== null) {
      var startAxis = LineInformation.getAxis(selectedLineIndex);
      var endAxisIndex = fill === true && selectedLineIndex === lines.length - 1 ? 0 : selectedLineIndex + 1;
      var endAxis = LineInformation.getAxis(endAxisIndex);

      changedX1 = startAxis[0] + movedXAxis;
      changedY1 = startAxis[1] + movedYAxis;
      changedX2 = endAxis[0] + movedXAxis;
      changedY2 = endAxis[1] + movedYAxis;

      /*
       * 라인 이동 시, 양쪽 끝의 유효성 체크하여
       * 변경이 불가능하면 기존 좌표로 한다.
       */
      if (
        LineInformation.validateAxis(changedX1, changedY1) === false ||
        LineInformation.validateAxis(changedX2, changedY2) === false
      ) {
        changedX1 = startAxis[0];
        changedY1 = startAxis[1];
        changedX2 = endAxis[0];
        changedY2 = endAxis[1];
      }

      prevPoints = LineInformation.getAll().points;
      prevPoints[selectedLineIndex] = [changedX1, changedY1];
      prevPoints[endAxisIndex] = [changedX2, changedY2];

      if (validateStabilization(prevPoints) === false) {
        return;
      }

      LineInformation.setAxis(selectedLineIndex, changedX1, changedY1);
      LineInformation.setAxis(endAxisIndex, changedX2, changedY2);
      //영역을 선택하여 이동할 때
    } else if (fill === true || selectedLineIndex !== null) {
      var isMoveOk = false;

      if (polygon !== null) {
        isMoveOk = polygon.isSelected === true;
      } else {
        isMoveOk = selectedLineIndex !== null
      }

      /*
      Polygon 이동 시 좌표 유효성 체크
      Polygon은 도형 전체가 움직이므로 모든 Point의 좌표를 체크한다.
      */
      if (useOnlyRectangle === true || fixedRatio === true) {
        if (
          firstPoint[0] + movedXAxis < 0 ||
          thirdPoint[0] + movedXAxis > offsetWidth) {
          movedXAxis = 0;
        }

        if (
          firstPoint[1] + movedYAxis < 0 ||
          thirdPoint[1] + movedYAxis > offsetHeight) {
          movedYAxis = 0;
        }
      }

      if (LineInformation.validateAllPoint(movedXAxis, 0) === false) {
        movedXAxis = 0;
      }

      if (LineInformation.validateAllPoint(0, movedYAxis) === false) {
        movedYAxis = 0;
      }
      if (isMoveOk) {
        for (var idx = 0; idx < pointsLength; idx++) {
          self = LineInformation.getAxis(idx);
          LineInformation.setAxis(idx, self[0] + movedXAxis, self[1] + movedYAxis);
        }
      }
    }

    parentSvg.startAxis = [xAxis, yAxis];

    //Update
    LineInformation.changeAxis();
  }

  // function documentElementMouseMoveHandle(event){
  // 	parentSVGMouseUpHandle();
  // }

  //Bind Event
  function bindEvent() {
    if (useResizeRectangle === true || useEvent === true || customDraw === true) {
      parentSvg.startAxis = null;
      eventCtrl.bindBodyEvent('mousedown', parentSVGMouseDownHandle);
      eventCtrl.bindBodyEvent('mousemove', parentSVGMouseMoveHandle);
      eventCtrl.bindBodyEvent('mouseup', parentSVGMouseUpHandle);
      eventCtrl.bindBodyEvent('mouseleave', parentSVGMouseUpHandle);

      // document.documentElement.addEventListener('mouseup', documentElementMouseMoveHandle);
    }
  }

  function init() {
    createSVGElement();

    if (initCenter === true) {
      alignCenter();
    }

    LineInformation.changeAxis();
    LineInformation.resetAllColor();
    bindEvent();
    appendDom();
  }

  function addPoint(xAxis, yAxis, appendIndex) {
    var newCircleRadius = circleRadius;
    //Set Axis
    if (typeof appendIndex !== "undefined") {
      LineInformation.addAxis(xAxis, yAxis, appendIndex);
    } else {
      LineInformation.addAxis(xAxis, yAxis);
    }

    lineHelper.addLine();
    lineHelper.appendAtLast();

    if (textInCircle !== null) {
      newCircleRadius *= 1.5;
    }

    circleHelper.addCircle(newCircleRadius);

    circleHelper.changeRadius(pointsLength - 2, circleRadius);
    circleHelper.appendAtLast();

    LineInformation.changeAxis();

    if (LineInformation.isAllSelected) {
      LineInformation.setAllColor();
    }
  }

  function removeAllElement() {
    try {
      lineHelper.removeAll();
      circleHelper.removeAll();
      polygonHelper.remove();
      textTagHelper.remove();
      arrowImageHelper.remove();

      if (wiseFaceDetectionHelper !== false) {
        wiseFaceDetectionHelper.remove();
      }

      groupHelper.remove();
    } catch (e) {
      /**
       * hide 후 destroy를 하면 에러가 발생을 하는 데,
       * 현재 태그들이 삭제되었는 지 확인 하는 로직대신
       * 예외 처리가 간단하므로 예외처리를 한다.
       */
    }
  }

  function reset() {
    removeAllElement();
    unbindEvent();
    lines = [];
    circles = [];
    polygon = null;
    textTag = null;
    arrowImageContainner = null;
    arrowImage = null;
    arrowTextContainner = null;
    arrowText = [];
  }

  function unbindEvent() {
    eventCtrl.unbindBodyEvent('mousedown', parentSVGMouseDownHandle);
    eventCtrl.unbindBodyEvent('mousemove', parentSVGMouseMoveHandle);
    eventCtrl.unbindBodyEvent('mouseup', parentSVGMouseUpHandle);
    eventCtrl.unbindBodyEvent('mouseleave', parentSVGMouseUpHandle);
    // document.documentElement.removeEventListener('mouseup', documentElementMouseMoveHandle);
  }

  function endDraw() {
    customDraw = false;
    useRectangleForCustomDraw = false;
    resetElementStatus();
    resetParentSvgAttr();
  }

  function changeMinSizeOption(newMinSize) {
    minSize = commonFunc.cloneObject(newMinSize);
  }

  function changeMaxSizeOption(newMaxSize) {
    maxSize = commonFunc.cloneObject(newMaxSize);
  }

  function changeRectangleToSize(width, height) {
    if (useOnlyRectangle !== true && fixedRatio !== true) {
      return;
    }

    var firstPoint = LineInformation.getAxis(0);
    var thirdPoint = LineInformation.getAxis(2);
    var offset = commonFunc.parentOffset();
    var changedX1 = 0;
    var changedX3 = 0;
    var changedY1 = 0;
    var changedY3 = 0;

    /*
     * 세번째 좌표가 오른쪽 하단 끝에 있을 경우
     * 세번째 좌표를 기준으로 변경을 하고,
     * 그렇지 않을 경우 첫번째 좌표를 기준으로 한다.
     */
    if (thirdPoint[0] >= offset.width) {
      changedX1 = thirdPoint[0] - width;
      changedX3 = thirdPoint[0];
    } else {
      changedX1 = firstPoint[0];
      changedX3 = firstPoint[0] + width;
    }

    if (thirdPoint[1] >= offset.height) {
      changedY1 = thirdPoint[1] - height;
      changedY3 = thirdPoint[1];
    } else {
      changedY1 = firstPoint[1];
      changedY3 = firstPoint[1] + height;
    }

    changeRectangle(changedX1, changedY1, changedX3, changedY3, true);
    LineInformation.changeAxis();
  }

  function changeRectangle(x1, y1, x2, y2, flagForchangeFirstAxis) {
    if (flagForchangeFirstAxis === true) {
      LineInformation.setAxis(0, x1, y1);
    }

    LineInformation.setAxis(rectangleIndex[1], x1, y2);
    LineInformation.setAxis(rectangleIndex[2], x2, y2);
    LineInformation.setAxis(rectangleIndex[3], x2, y1);
  }

  function alignCenter() {
    var parentSvgWidth = elemCtrl.getParentSvgAttr('width');
    var parentSvgHeight = elemCtrl.getParentSvgAttr('height');
    var firstPoint = LineInformation.getAxis(0);
    var thirdPoint = LineInformation.getAxis(2);
    var geometryWidth = thirdPoint[0] - firstPoint[0];
    var geometryHeight = thirdPoint[1] - firstPoint[1];

    if (parentSvgWidth === null) {
      parentSvgWidth = parentSvg.clientWidth;
    }

    parentSvgWidth = parseInt(parentSvgWidth);

    if (parentSvgHeight === null) {
      parentSvgHeight = parentSvg.clientHeight;
    }

    parentSvgHeight = parseInt(parentSvgHeight);

    var changedX1 = Math.round(parentSvgWidth / 2 - geometryWidth / 2);
    var changedY1 = Math.round(parentSvgHeight / 2 - geometryHeight / 2);
    var changedX3 = changedX1 + geometryWidth;
    var changedY3 = changedY1 + geometryHeight;

    LineInformation.setAxis(0, changedX1, changedY1);
    LineInformation.setAxis(1, changedX1, changedY3);
    LineInformation.setAxis(2, changedX3, changedY3);
    LineInformation.setAxis(3, changedX3, changedY1);

    LineInformation.changeAxis();
  }

  function changeNormalStatus() {
    var idx = 0;
    var len = 0;

    for (idx = 0, len = lines.length; idx < len; idx++) {
      lineHelper.hide(lines[idx]);
    }
    for (idx = 0, len = circles.length; idx < len; idx++) {
      circleHelper.hide(circles[idx]);
    }

    if (useArrow === true) {
      arrowImageHelper.hide();
    }

    textTagHelper.hide();

    LineInformation.resetAllColor();
  }

  function changeActiveStatus() {
    var idx = 0;
    var len = 0;
    for (idx = 0, len = lines.length; idx < len; idx++) {
      lineHelper.show(lines[idx]);
    }
    for (idx = 0, len = circles.length; idx < len; idx++) {
      circleHelper.show(circles[idx]);
    }

    if (useArrow === true) {
      arrowImageHelper.show();
    }

    textTagHelper.show();

    LineInformation.setAllColor();
  }

  function createArrow(arrowOptions) {
    useArrow = true;
    arrow = commonFunc.cloneObject(arrowOptions);
    arrowImageHelper.addImage();
    LineInformation.changeAxis();
    arrowImageHelper.append();
  }

  function validateMinimumAngle(prevPoints) {
    var returnVal = true;
    var points = [];
    var pointsLength = 0;

    try {
      points = typeof prevPoints === "undefined" ?
        commonFunc.cloneObject(LineInformation.getAll().points) :
        commonFunc.cloneObject(prevPoints);
      pointsLength = points.length;

      /**
       * 삼각형부터 체크
       */
      if (pointsLength >= 3 && fill === true) {
        for (var i = 0; i < pointsLength; i++) {
          var firstPoint = [];
          var vertextAngle = Math.abs(funnyMath.getVertextAngle(points[0], points[1], points[2]));

          if (vertextAngle < MINIMUM_ANGLE) {
            returnVal = false;
            break;
          }

          firstPoint = points.shift();
          points.push(firstPoint);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    return returnVal;
  }

  function validateIntersection(prevPoints) {
    var returnVal = true;
    var points = 0;
    var pointsLength = 0;

    //고정비 사각형, 직각사각형, 라인은 교차 체크를 하지 않음.
    if (fill === false || fixedRatio === true) {
      return;
    }

    try {
      points = typeof prevPoints === "undefined" ?
        commonFunc.cloneObject(LineInformation.getAll().points) :
        commonFunc.cloneObject(prevPoints);
      pointsLength = points.length;

      for (var i = 0; i < pointsLength - 1; i++) {
        var firstLineFirstPoint = points[i];
        var firstLineSecondPoint = points[i + 1];

        for (var j = i + 1; j < pointsLength; j++) {
          var secondLineFirstPoint = points[j];
          var secondLineSecondPointIndex = ((j + 1) === pointsLength ? 0 : (j + 1));
          var secondLineSecondPoint = points[secondLineSecondPointIndex];

          if (funnyMath.checkLineIntersection(
              firstLineFirstPoint[0],
              firstLineFirstPoint[1],
              firstLineSecondPoint[0],
              firstLineSecondPoint[1],
              secondLineFirstPoint[0],
              secondLineFirstPoint[1],
              secondLineSecondPoint[0],
              secondLineSecondPoint[1]
            ) === false) {
            returnVal = false;
            break;
          }
        }
      }
    } catch (e) {
      console.info(e);
    }

    return returnVal;
  }

  function validateStabilization(prevPoints) {
    var points = typeof prevPoints === "undefined" ?
      commonFunc.cloneObject(LineInformation.getAll().points) :
      commonFunc.cloneObject(prevPoints);
    var returnVal = true;

    if (validateMinimumAngle(points) === false || validateIntersection(points) === false) {
      returnVal = false;
    }

    return returnVal;
  }

  init();

  drawObj = {
    hide: removeAllElement,
    show: appendDom,
    active: changeActiveStatus,
    normal: changeNormalStatus,

    addPoint: addPoint,
    getData: LineInformation.getAll,
    destroy: reset,
    endDraw: endDraw,

    createArrow: createArrow,
    changeArrow: arrowImageHelper.changeArrow,
    changeMinSizeOption: changeMinSizeOption,
    changeMaxSizeOption: changeMaxSizeOption,
    changeRectangleToSize: changeRectangleToSize,
    alignCenter: alignCenter,

    validateAxis: LineInformation.validateAxis,
    validateStabilization: validateStabilization,
    validateIntersection: validateIntersection,
    validateMinimumAngle: validateMinimumAngle,

    stopEvent: unbindEvent,
    startEvent: bindEvent,

    moveTopLayer: groupHelper.moveTopLayer,

    changeWFDStrokeColor: wiseFaceDetectionHelper.changeStrokeColor
  };

  return drawObj;
});