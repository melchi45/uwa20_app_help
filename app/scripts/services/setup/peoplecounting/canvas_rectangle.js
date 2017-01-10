/* global setInterval */
"use strict";
function RectanglePainter(canvasElement){
	if(typeof canvasElement === "undefined"){
		throw 'Parent Canvas have to defind.';
		//return; //Make block - lint error:Unreachable 'return' after 'throw'
	}

	if(!(this instanceof RectanglePainter)){
		return new RectanglePainter(canvasElement);
	}

	var canvas = canvasElement;

	var boxes = []; 

	// 0  1
	// 2  3
	var selectionHandles = [];

	var canvas;
	var ctx;
	var WIDTH;
	var HEIGHT;
	var INTERVAL = 20;

	var isDrag = false;
	var isResizeDrag = false;
	var expectResize = -1;
	var mx, my;
	var canvasValid = false;

	var mySel = null;
	var mySelColor = 'rgb(251, 140, 0)';
	var mySelWidth = 2;
	var mySelBoxColor = 'rgba(251, 140, 0)';
	var mySelBoxSize = 6;

	var ghostcanvas;
	var gctx;
	var offsetx, offsety;
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

	var minSize, maxSize;

	function create(options) {
		var x1 = options.x1 === undefined ? 260 : options.x1;
		var x2 = options.x2 === undefined ? 380 : options.x2;
		var y1 = options.y1 === undefined ? 180 : options.y1;
		var y2 = options.y2 === undefined ? 300 : options.y2;
		var backgroundColor = options.backgroundColor === undefined ? 'rgba(251, 140, 0, 0.45)' : options.backgroundColor;
		var lineColor = options.lineColor === undefined ? 'rgb(251, 140, 0)' : options.lineColor;
		var lineWidth = options.lineWidth === undefined ? 6 : options.lineWidth;

		HEIGHT = canvas.height;
		WIDTH = canvas.width;
		ctx = canvas.getContext('2d');
		ghostcanvas = document.createElement('canvas');
		ghostcanvas.height = HEIGHT;
		ghostcanvas.width = WIDTH;
		gctx = ghostcanvas.getContext('2d');

		canvas.onselectstart = function () { return false; };

		if (document.defaultView && document.defaultView.getComputedStyle) {
			stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingLeft, 10)     || 0;
			stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingTop, 10)      || 0;
			styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null).borderLeftWidth, 10) || 0;
			styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null).borderTopWidth, 10)  || 0;
		}

		setInterval(mainDraw, INTERVAL);

		bindEvent();
		/*canvas.onmousedown = myDown;
		canvas.onmouseup = myUp;
		canvas.onmouseleave = myUp;
		canvas.onmousemove = myMove;*/

		for (var i = 0; i < 4; i ++) {
			var rect = new Box();
			selectionHandles.push(rect);
		}

		var defaultSize;
		if(WIDTH > HEIGHT) {
			defaultSize = HEIGHT * 0.08;
		} else {
			defaultSize = WIDTH * 0.08;
		}

	  	addRect(x1, y1, x2 - x1, y2 - y1, backgroundColor, lineWidth, lineColor);

	  	return {
	  		getAxis: getXY
	  	};
	}

	function mainDraw() {
	  var l = boxes.length;
	  for (var i = 0; i < l; i++) {
		    if(boxes[i].x < i) boxes[i].x = 0;
	    if(boxes[i].y < i) boxes[i].y = 0;
	    if(boxes[i].x + boxes[i].w > WIDTH) boxes[i].x = WIDTH - boxes[i].w;
	    if(boxes[i].y + boxes[i].h > HEIGHT) boxes[i].y = HEIGHT - boxes[i].h;
	  }

	  if (canvasValid === false) {
	    clear(ctx);
	    
	    for (var i = 0; i < l; i++) {
	      boxes[i].draw(ctx); 
	    }
	    
	    canvasValid = true;
	  }
	}

	function clear(c) {
	  c.clearRect(0, 0, WIDTH, HEIGHT);
	}

	function Box() {
	  this.x = 0;
	  this.y = 0;
	  this.w = 1;
	  this.h = 1;
	  this.fill = 'rgba(251, 140, 0, 0.45)';
	}

	Box.prototype = {
	  draw: function(context, optionalColor) {
	      context.fillStyle = this.fill;

	      if (this.x > WIDTH || this.y > HEIGHT) return; 
	      if (this.x + this.w < 0 || this.y + this.h < 0) return;
	      
	      context.fillRect(this.x,this.y,this.w,this.h);
	      context.strokeStyle = this.strokeStyle;
	      context.lineWidth = this.lineWidth;
	      context.strokeRect(this.x + this.lineWidth/2,this.y + this.lineWidth/2,this.w - this.lineWidth,this.h - this.lineWidth);

	      var half = mySelBoxSize;

	      // left top
	      selectionHandles[0].x = this.x + 1;
	      selectionHandles[0].y = this.y + 1;

	      //right top
	      selectionHandles[1].x = this.x+this.w-half - 1;
	      selectionHandles[1].y = this.y + 1;

	      //left bottom
	      selectionHandles[2].x = this.x + 1;
	      selectionHandles[2].y = this.y+this.h-half - 1;

	      //right bottom
	      selectionHandles[3].x = this.x+this.w-half - 1;
	      selectionHandles[3].y = this.y+this.h-half - 1;
	  }
	};

	function addRect(x, y, w, h, fill, lineWidth, strokeStyle) {
	  var rect = new Box();
	  rect.x = x;
	  rect.y = y;
	  rect.w = w;
	  rect.h = h;
	  rect.fill = fill;
	  rect.lineWidth = lineWidth;
	  rect.strokeStyle = strokeStyle;
	  boxes.push(rect);
	  invalidate();
	}

	function invalidate() {
	  canvasValid = false;
	}

	function myMove(e){
	  if (isDrag) {
	    getMouse(e);
	    
	    mySel.x = mx - offsetx;
	    mySel.y = my - offsety;   
	    
	    invalidate();
	  } else if (isResizeDrag) {
	    var oldx = mySel.x;
	    var oldy = mySel.y;
	    
	    switch (expectResize) {
	      case 0:
	        mySel.x = mx;
	        mySel.y = my;
	        mySel.w += oldx - mx;
	        mySel.h += oldy - my;
	        break;
	      case 1:
	        mySel.y = my;
	        mySel.w = mx - oldx;
	        mySel.h += oldy - my;
	        break;
	      case 2:
	        mySel.x = mx;
	        mySel.w += oldx - mx;
	        mySel.h = my - oldy;
	        break;
	      case 3:
	        mySel.w = mx - oldx;
	        mySel.h = my - oldy;
	        break;
	    }

	    if(mySel.w > maxSize) {mySel.w = maxSize;}
	  	if(mySel.h > maxSize) {mySel.h = maxSize;}
	  	if(mySel.w < minSize) {mySel.w = minSize;}
	  	if(mySel.h < minSize) {mySel.h = minSize;}

	  	// if(mySel.w <= mySelBoxSize*2+10) mySel.w = mySelBoxSize*2+10;
	  	// if(mySel.h <= mySelBoxSize*2+10) mySel.h = mySelBoxSize*2+10;
	    
	    invalidate();
	  }
	  
	  getMouse(e);
	  /* jshint ignore:start */
	  if (!isResizeDrag) {
	    for (var i = 0; i < 4; i++) {
	      var cur = selectionHandles[i];
	      
	      if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
	          my >= cur.y && my <= cur.y + mySelBoxSize) {

	        expectResize = i;
	        invalidate();
	        
	        switch (i) {
	          case 0:
	            this.style.cursor='nw-resize';
	            break;
	          case 1:
	            this.style.cursor='ne-resize';
	            break;
	          case 2:
	            this.style.cursor='sw-resize';
	            break;
	          case 3:
	            this.style.cursor='se-resize';
	            break;
	        }
	        return;
	      }
	      
	    }
	    isResizeDrag = false;
	    expectResize = -1;
	    this.style.cursor='auto';
	  } 
	  /* jshint ignore:end */
	}

	function myDown(e){
	  checkBoxSize();
	  getMouse(e);
	  
	  clear(gctx);
	  var l = boxes.length;
	  for (var i = l-1; i >= 0; i--) {
	    boxes[i].draw(gctx, 'black');
	    
	    var imageData = gctx.getImageData(mx, my, 1, 1);
	    var index = (mx + my * imageData.width) * 4;
	    
	    if (imageData.data[3] > 0) {
	      mySel = boxes[i];
	      offsetx = mx - mySel.x;
	      offsety = my - mySel.y;
	      mySel.x = mx - offsetx;
	      mySel.y = my - offsety;

	      if(expectResize === -1){
	        isDrag = true;
	        invalidate();
	        clear(gctx);
	        return;
	      }else{
		    isResizeDrag = true;
		    return;
	      }
	    }	    
	  }

	  mySel = null;
	  clear(gctx);
	  invalidate();
	}

	function myUp(){
	  isDrag = false;
	  isResizeDrag = false;
	  expectResize = -1;
	}
	
	function checkBoxSize() {
		if(WIDTH > HEIGHT) {
			minSize = HEIGHT * 0.03;
			maxSize = WIDTH * 0.5;
		} else {
			minSize = WIDTH * 0.03;
			maxSize = HEIGHT * 0.5;
		}
	}

	function getScroll(){
		var scrollTop = 0;
		var scrollLeft = 0;

		try{
			var parentNodeScroll = $("#setup-main");
			scrollTop = parentNodeScroll.scrollTop();
			scrollLeft = parentNodeScroll.scrollLeft();
		}catch(e){
			console.error("Getting scroll top and left have problem.");
		}

		return {
			top: scrollTop,
			left: scrollLeft
		};
	}

	function getMouse(e) {
	      var element = canvas, offsetX = 0, offsetY = 0;

	      if (element.offsetParent) {
	        do {
	          offsetX += element.offsetLeft;
	          offsetY += element.offsetTop;
	        } while ((element = element.offsetParent));
	      }

	      // Add padding and border style widths to offset
	      offsetX += stylePaddingLeft;
	      offsetY += stylePaddingTop;

	      offsetX += styleBorderLeft;
	      offsetY += styleBorderTop;

	      mx = e.pageX - offsetX + getScroll().left;
	      my = e.pageY - offsetY + getScroll().top;
	}

	function getXY(){
		var xy = [];
		for(var i = 0; i < boxes.length; i++){
			var box = boxes[i];
			xy[i] = {
				x1: box.x,
				y1: box.y,
				x2: box.x + box.w,
				y2: box.y + box.h
			};
		}

		return xy;
	}

	var isBindedEvent = false;
	function bindEvent(){
		if(isBindedEvent === true) return;
		canvas.addEventListener("mousedown", myDown);
		canvas.addEventListener("mouseup", myUp);
		canvas.addEventListener("mouseleave", myUp);
		canvas.addEventListener("mousemove", myMove);
		isBindedEvent = true;
	}

	function unbindEvent(){
		if(isBindedEvent === false) return;
		canvas.removeEventListener("mousedown", myDown);
		canvas.removeEventListener("mouseup", myUp);
		canvas.removeEventListener("mouseleave", myUp);
		canvas.removeEventListener("mousemove", myMove);
		isBindedEvent = false;
	}

	return {
		create: create,
		clear: function(){
			clear(ctx);
		},
		bindEvent: bindEvent,
		unbindEvent: unbindEvent
	};
}

kindFramework.factory('PCRectanglePainter', function(){
	return RectanglePainter;
});