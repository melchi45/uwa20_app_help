"use strict";

KindSVGEditor.addPlugin('customEditorV2', function(options){
	var parentSvgMovedAttr = 'is-moved';
	var DEFAULT_OBJECT_SIZE = 30;

	var options = this.common.cloneObject(options);
	var minPoint = options.minPoint === undefined ? 4 : options.minPoint;
	//custom 함수에서는 start, end 이벤트만 사용한다.
	var customEvent = options.event === undefined ? null : options.event;
	var ratio = options.ratio === undefined ? false : options.ratio;
	var minLineLength = options.minLineLength === undefined ? 20 : options.minLineLength;
	var minSize = options.minSize === undefined ? false : options.minSize;
	var currentPoint = 0;
	var svgObj = [];
	var currentSvgObjIndex = 0;
	var isDrawing = false;

	var eventCtrl = this.eventController;
	var elemCtrl = this.elementController;
	var commonFunc = this.common;
	var funnyMath = this.funnyMath;

	var kindSVGEditor = new KindSVGEditor(elemCtrl.getParentSvg());

	options.customDraw = true;
	options.useRectangleForCustomDraw = true;

	var parentSVGMouseUpHandle = function(event){
		//Right button
		if(event.buttons === 2) return;

		if(
			elemCtrl.getParentSvgAttr(parentSvgMovedAttr) === "true" ||
			svgObj[currentSvgObjIndex] === undefined
			){
			return;
		}
		svgObj[currentSvgObjIndex].endDraw();
		unbindESCkeyEvent();
		callEndEvent();
		currentPoint = 0;
		currentSvgObjIndex++;
	};

	var parentSVGMouseDownHandle = function(event){
		if(
			event.buttons === 2 || 
			event.currentTarget !== event.target ||
			elemCtrl.getParentSvgAttr(parentSvgMovedAttr) === "true"
			){
			return;
		}

		var axis = commonFunc.getPageAxis(event);

		var addPoint = function(){
			svgObj[currentSvgObjIndex].addPoint(axis[0], axis[1]);
		};

		options.points = [
			axis,
			[axis[0], axis[1] + DEFAULT_OBJECT_SIZE],
			[axis[0] + DEFAULT_OBJECT_SIZE, axis[1] + DEFAULT_OBJECT_SIZE],
			[axis[0] + DEFAULT_OBJECT_SIZE, axis[1]],
		];

		svgObj[currentSvgObjIndex] = kindSVGEditor.draw(options);	
		currentPoint++;
		bindESCkeyEvent();
		callStartEvent();
	};

	bindEvent();

	function callEndEvent(){
		isDrawing = false;
		if("end" in customEvent){
			customEvent.end(svgObj[currentSvgObjIndex]);
		}
	}

	function callStartEvent(){
		isDrawing = true;
		if("start" in customEvent){
			customEvent.start(svgObj[currentSvgObjIndex]);
		}
	}

	function unbindEvent(){
		eventCtrl.unbindParentEvent('mousedown', parentSVGMouseDownHandle);
		eventCtrl.unbindBodyEvent('mouseup', parentSVGMouseUpHandle);
	}

	function bindEvent(){
		eventCtrl.bindParentEvent('mousedown', parentSVGMouseDownHandle);
		eventCtrl.bindBodyEvent('mouseup', parentSVGMouseUpHandle);
	}

	function handleESCKey(event){
		if(event.keyCode === 27){
			removeDrawingGeometry();
		}
	}

	function bindESCkeyEvent(){
		document.addEventListener('keyup', handleESCKey);
	}

	function unbindESCkeyEvent(){
		document.removeEventListener('keyup', handleESCKey);
	}

	function removeDrawingGeometry(){
		if(isDrawing){
			svgObj[currentSvgObjIndex].destroy();
			unbindESCkeyEvent();
			currentPoint = 0;
		}
	}

	return {
		destroy: unbindEvent,
		stop: unbindEvent,
		start: bindEvent,
		removeDrawingGeometry: removeDrawingGeometry
	}
});