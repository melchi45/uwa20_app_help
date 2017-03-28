kindFramework.factory('DigitalZoomService', ['$q', 'LoggingService', 'kindStreamInterface', 'UniversialManagerService',
  function($q, LoggingService, kindStreamInterface, UniversialManagerService) {
    "use strict";

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

    //for Video Tag
    var leftLimit = 0;
    var topLimit = 0;

    var rotate = 0;
    var zoom = 0;
    var videoElement = null;
    var prop = 'transform';
    var data = {channelId:0, zoomArray : [zoomX, zoomY, zoomZ]};

    function init() {
      zoomX = 0.0;
      zoomY = 0.0;
      zoomZ = initZoomZ;
      movelimit = 5;
      data = {channelId:0, zoomArray : [zoomX, zoomY, zoomZ]};
      return data;
    }

    function canvasEventHandler(event,eventType,element) {
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

    function videoEventHandler(event,eventType,element) {
          switch(eventType) {
              case "mousewheel":
                  event.stopPropagation();
                  event.preventDefault ();
                  var delta = event.wheelDelta ? event.wheelDelta : -event.detail;
                  delta = delta/120;
                  if(delta > 0 && zoom < 16) {
                      zoom = zoom + 0.1;
                  } else if (delta < 0 && zoom > 1) {
                      zoom = zoom - 0.1;
                      var moveClac = (videoElement.clientWidth * 0.1) / 2;
                      if (zoom !== 1) {
                          if (parseInt(videoElement.style.left,10) < 0) {
                              videoElement.style.left = (parseInt(videoElement.style.left,10) + moveClac) + 'px';
                          } else {
                              videoElement.style.left = (parseInt(videoElement.style.left,10) - moveClac) + 'px';
                          }

                          if (parseInt(videoElement.style.top,10) < 0) {
                              videoElement.style.top = (parseInt(videoElement.style.top,10) + moveClac) + 'px';
                          } else {
                              videoElement.style.top = (parseInt(videoElement.style.top,10) - moveClac) + 'px';
                          }
                      } else {
                          videoElement.style.left = '0px';
                          videoElement.style.top = '0px';
                      }
                  }

                  leftLimit = parseInt(((videoElement.clientWidth * (zoom - 1)) / 2), 10);
                  topLimit = parseInt(((videoElement.clientHeight * (zoom - 1)) / 2), 10);

                  videoElement.style[prop] = 'scale('+zoom+') rotate('+rotate+'deg)';
                  break;
              case "mousedown":
                  downCheck = true;
                  curX = event.clientX;
                  curY = event.clientY;
                  break;
              case "mouseup":
              case "mouseleave":
                  downCheck = false;
                  break;
              case "mousemove":
                  if(downCheck) {
                      moveX = curX - event.clientX;
                      moveY = curY - event.clientY;

                      curX = event.clientX;
                      curY = event.clientY;

                      if (moveX < 0 ) { //left -> right
                          if (parseInt(videoElement.style.left,10) < leftLimit) {
                              videoElement.style.left = (parseInt(videoElement.style.left,10) - moveX) + 'px';
                          } else if (parseInt(videoElement.style.left,10) != leftLimit) {
                              videoElement.style.left = leftLimit + 'px';
                          }
                      } else if (moveX > 0) {	//right -> left
                          if (parseInt(videoElement.style.left,10) > -leftLimit) {
                              videoElement.style.left = (parseInt(videoElement.style.left, 10) - moveX) + 'px';
                          } else if (parseInt(videoElement.style.left,10) != -leftLimit) {
                              videoElement.style.left = -leftLimit + 'px';
                          }
                      }

                      if (moveY < 0 ) { //top -> bottom
                          if (parseInt(videoElement.style.top,10) < parseInt(topLimit, 10))
                              videoElement.style.top = (parseInt(videoElement.style.top,10) - moveY) + 'px';
                          else if (parseInt(videoElement.style.top,10) != topLimit)
                              videoElement.style.top = topLimit + 'px';
                      } else if (moveY > 0) {	// bottom -> top
                          if (parseInt(videoElement.style.top,10) > -topLimit)
                              videoElement.style.top = (parseInt(videoElement.style.top,10) - moveY) + 'px';
                          else if (parseInt(videoElement.style.top,10) != -topLimit)
                              videoElement.style.top = -topLimit + 'px';
                      }
                  }
                  break;
              default:
                  break;
          }
      }

    function mouseWheel(event) {
      if(videoElement !== null)
      {
          videoEventHandler(event,"mousewheel", null);
      }
      else
      {
          var zoomArray = canvasEventHandler(event, "mousewheel", null);
          kindStreamInterface.changeDrawInfo(zoomArray);
      }
    }
    function mouseDown(event) {
      if(videoElement !== null)
      {
        videoEventHandler(event,"mousedown", null);
      }
      else
      {
        canvasEventHandler(event,"mousedown", null);
      }
    }
    function mouseMove(event) {
      if(videoElement !== null)
      {
          videoEventHandler(event,"mousemove", null);
      }
      else
      {
          var zoomArray = canvasEventHandler(event, "mousemove", null);
          kindStreamInterface.changeDrawInfo(zoomArray);
      }
    }
    function mouseUp(event) {
        if(videoElement !== null)
        {
            videoEventHandler(event,"mouseup", null);
        }
        else
        {
            canvasEventHandler(event, "mouseup", null);
        }
    }
    function mouseLeave(event) {
        if(videoElement != null)
        {
            videoEventHandler(event,"mouseleave", null);
        }
        else
        {
            canvasEventHandler(event, "mouseleave", null);
        }
     }

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

      if(UniversialManagerService.getVideoMode() === 'video')
      {
          videoElement = document.getElementById("livevideo");
          videoElement.style.left = 0;
          videoElement.style.top = 0;
          videoElement.style.position = 'relative';
      }
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
      setElementEvent : setElementEvent,
      deleteElementEvent : deleteElementEvent
    };
}]);