kindFramework.factory('PixelCounterService', ['$q', 'LoggingService', 'kindStreamInterface', 
  function($q, LoggingService, kindStreamInterface) {
    "use strict";
    
    var downCheck = false;
    var zoomX = 0.0;
    var zoomY = 0.0;
    var zoomZ = -2.4;
    var curX = 0;
    var curY = 0;
    var moveX = 0;
    var moveY = 0;
    var zoomWidth = 0;
    var zoomHeight = 0;
    var movelimit = 0;
    var maxZoomZLevel = -0.15;
    var minZoomZLevel = -2.35;
    var initZoomZ = -2.4;

    var zoomScale = 0.05;
    var zoomValue = 20;
    var pixelData = [];
    var zoomData = [];
    var callbackFunc = null;

    function init() {
      zoomX = 0.0;
      zoomY = 0.0;
      zoomZ = -2.4;
      movelimit = 0;
      zoomData = [zoomX, zoomY, zoomZ];
      return zoomData;
    }

    function eventHandler(event,eventType,element) {
      if (!event) {
        event = window.event;
      }
      
      if (eventType === "mousewheel") {
        event.stopPropagation();
        event.preventDefault ();
        var zoomChange = false;
        var delta = event.wheelDelta ? event.wheelDelta : -event.detail;
        delta = delta/120;
        if(delta > 0 && zoomZ <= maxZoomZLevel) {
          zoomChange = true;
          zoomZ += zoomScale;
        } else if (delta < 0 && zoomZ >= minZoomZLevel) {
          zoomChange = true;
          zoomZ -= zoomScale;
          if (Math.abs(zoomX * 1000) > zoomValue) {
            if (zoomX > 0) {
              zoomX -= zoomValue / 1000;
            } else {
              zoomX += zoomValue / 1000;
            }
          }

          if (Math.abs(zoomY * 1000) > zoomValue) {
            if (zoomY > 0) {
              zoomY -= zoomValue / 1000;
            } else {
              zoomY += zoomValue / 1000;
            }
          }
        } 

        if (zoomZ <= initZoomZ) {
          zoomX = 0;
          zoomY = 0;
          movelimit = 0;
        }

        zoomWidth = event.target.clientWidth * (1 + (2.4 + zoomZ));
        zoomHeight = event.target.clientHeight * (1 + (2.4 + zoomZ));

        if (movelimit === 0) {
          movelimit = ((zoomWidth - event.target.clientWidth) / 2);
        } else if (zoomChange === true) {
          if (delta > 0) {
            movelimit += zoomValue;
          } else {
            movelimit -= zoomValue;
          }
        }

        zoomData = [zoomX, zoomY, zoomZ];        
        return zoomData;
      } else if (eventType === "mousedown") {
        //마우스 왼쪽 버튼만 허용
        if(event.button !== 0) return;

        downCheck = true;
        curX = event.offsetX;
        curY = event.offsetY;
      } else if (eventType === "mousemove") {
        if(downCheck) {
          var tempZoomX = 0;
          var tempZoomY = 0;

          moveX = curX - event.offsetX;
          moveY = curY - event.offsetY;

          //console.log("pixelCounterService::X = " + Math.abs(moveX) + "px, Y = " + Math.abs(moveY) + "px");
          callbackFunc(curX, curY, moveX, moveY);
        }         
      } else if (eventType === "mouseup" || eventType === "mouseleave") {
        downCheck = false;
      }
    }

    function mouseWheel(event) {
      var zoomArray = eventHandler(event, "mousewheel", null);
      kindStreamInterface.changeDrawInfo(zoomArray); 
    }
    function mouseDown(event) { eventHandler(event,"mousedown", null); }
    function mouseMove(event) { eventHandler(event, "mousemove", null); }
    function mouseUp(event) { eventHandler(event,"mouseup", null); }
    function mouseLeave(event) { eventHandler(event,"mouseleave", null); }  

    var agent = navigator.userAgent.toLowerCase();
    function setElementEvent(element) {
      if(agent.indexOf("firefox") !== -1) {
        element.addEventListener('DOMMouseScroll', mouseWheel);
      }else{
        element.addEventListener('mousewheel', mouseWheel);
      }
      element.addEventListener('mousedown', mouseDown);
      element.addEventListener('mousemove', mouseMove);
      element.addEventListener('mouseup', mouseUp);
      element.addEventListener('mouseleave', mouseLeave);
    }

    function deleteElementEvent(element) {
      if(agent.indexOf("firefox") !== -1) {
        element.removeEventListener('DOMMouseScroll', mouseWheel);
      }else{
        element.removeEventListener('mousewheel', mouseWheel);
      }
      element.removeEventListener('mousedown', mouseDown);
      element.removeEventListener('mousemove', mouseMove);
      element.removeEventListener('mouseup', mouseUp);
      element.removeEventListener('mouseleave', mouseLeave);
    }

    function setCallbackFunc(func) {
      callbackFunc = func;
    }

    return {
      init : init,
      eventHandler : eventHandler,
      setElementEvent : setElementEvent,
      deleteElementEvent : deleteElementEvent,
      setCallbackFunc : setCallbackFunc,
    };
}]);