kindFramework.factory('DigitalZoomService', ['$q', 'LoggingService', 'kindStreamInterface', 
  function($q, LoggingService, kindStreamInterface) {
    "use strict";
    
    var logger = LoggingService.getInstance('DigitalZoomService');

    var downCheck = false;
    var initZoomZ = -2.415;
    var zoomX = 0.0;
    var zoomY = 0.0;
    var zoomZ = initZoomZ;
    var curX = 0;
    var curY = 0;
    var moveX = 0;
    var moveY = 0;
    var zoomWidth = 0;
    var zoomHeight = 0;
    var movelimit = 5;
    var maxZoomZLevel = -0.215;
    var minZoomZLevel = -2.365;

    var zoomScale = 0.05;
    var zoomValue = 20.61;
    var zoomData = [];

    function init() {
      zoomX = 0.0;
      zoomY = 0.0;
      zoomZ = initZoomZ;
      movelimit = 5;
      var data = {channelId:0, zoomArray : [zoomX, zoomY, zoomZ]};
      return data;
    }

    function eventHandler(event,eventType,element) {
      var data = {
        channelId:event.currentTarget.attributes[2].value, 
        zoomArray : []
      };
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
          movelimit = 5;
        }

        zoomWidth = event.target.clientWidth * (1 + (-initZoomZ + zoomZ));
        zoomHeight = event.target.clientHeight * (1 + (-initZoomZ + zoomZ));

        if (movelimit === 0) {
          movelimit = ((zoomWidth - event.target.clientWidth) / 2);
        } else if (zoomChange === true) {
          if (delta > 0) {
            movelimit += zoomValue;
          } else {
            movelimit -= zoomValue;
          }
        }

        data.zoomArray = [zoomX, zoomY, zoomZ];
        return data;
      } else if (eventType === "mousedown") {
        downCheck = true;
        curX = event.clientX;
        curY = event.clientY;
      } else if (eventType === "mousemove") {
        if(downCheck && movelimit > 5) {
          var tempZoomX = 0;
          var tempZoomY = 0;

          moveX = curX - event.clientX;
          moveY = curY - event.clientY;

          curX = event.clientX;
          curY = event.clientY;          
          
          if (moveX < 0 ) { //left -> right
            if (zoomX * 1000 < movelimit) {
              tempZoomX = zoomX - moveX / 1000;
              if (tempZoomX * 1000 < movelimit) {
                zoomX -= moveX / 1000;
              } else {
                zoomX = movelimit / 1000;
              }
            }
          } else { //right -> left
            if (zoomX * 1000 > -movelimit) {
              tempZoomX = zoomX - moveX / 1000;
              if (tempZoomX * 1000 > -movelimit) {
                zoomX -= moveX / 1000;
              } else {
                zoomX = -(movelimit / 1000);
              }
            }
          }

          if (moveY < 0 ) { //top -> bottom
            if (zoomY * 1000 > -movelimit) {
              tempZoomY = zoomY + moveY / 1000;
              if (tempZoomY * 1000 > -movelimit) {
                zoomY += moveY / 1000; 
              } else {
                zoomY = -(movelimit / 1000);
              }
            }            
          } else { //bottom -> top
            if (zoomY * 1000 < movelimit) {
              tempZoomY = zoomY + moveY / 1000;
              if (tempZoomY * 1000 < movelimit) {
                zoomY += moveY / 1000;
              } else {
                zoomY = movelimit / 1000;
              }
            }
          }
        }
        data.zoomArray = [zoomX, zoomY, zoomZ];
        return data;
      } else if (eventType === "mouseup" || eventType === "mouseleave") {
        downCheck = false;
      }
    }

    function mouseWheel(event) {
      var zoomArray = eventHandler(event, "mousewheel", null);
      kindStreamInterface.changeDrawInfo(zoomArray); 
    }
    function mouseDown(event) { eventHandler(event,"mousedown", null); }
    function mouseMove(event) {
      var zoomArray = eventHandler(event, "mousemove", null);
      kindStreamInterface.changeDrawInfo(zoomArray); 
    }
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

    return {
      init : init,
      eventHandler : eventHandler,
      setElementEvent : setElementEvent,
      deleteElementEvent : deleteElementEvent,
    };
}]);