kindFramework
    .factory('DigitalPTZContorlService', ['$q', 'LoggingService', 'SunapiClient', '$timeout', 'CAMERA_STATUS', 'UniversialManagerService', '$rootScope', 'Attributes', function($q, LoggingService, SunapiClient, $timeout, CAMERA_STATUS, UniversialManagerService, $rootScope, Attributes) {
    'use strict';
    var logger = LoggingService.getInstance('PTZContorlService');

    var downCheck = false;

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

    var wheelStopTimerPromise = null;

    var coordinates = null;

    var curQuadrant = null;

    var prevQuadrant = null;

    var dotCoordinates = null;

    var playingList = [{isPlaying:null, btn:null}, {isPlaying:false, btn:null}, {isPlaying:false, btn:null}, {isPlaying:false, btn:null}, {isPlaying:false, btn:null}];

    var isOn = null;

    var mAttr = Attributes.get("Image");

    var isFisheye = mAttr.FisheyeLens;
    
    function eventHandler(event,eventType,element) {
      sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True";
      if (!event) { event = window.event; }
      if(UniversialManagerService.getViewModeType() === "QuadView" && isFisheye) {
        curQuadrant = calCoordinate(event.offsetX, event.offsetY);
      }
      if(curQuadrant === null && isFisheye) { return null; };
      if (eventType === "mousewheel") {
        event.stopPropagation();
        event.preventDefault ();
        $timeout.cancel(wheelStopTimerPromise);
        var delta = event.wheelDelta ? event.wheelDelta : -event.detail;
        delta = delta / 120;
        if(delta > 0) { // wheel up
          zoom = 50;
        } else { // wheel down
          zoom = -50;
        }
        sunapiURI += "&Zoom=" + zoom;
        zoom = 0;

        wheelStopTimerPromise = $timeout(function(){
          sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
          if(UniversialManagerService.getViewModeType() === "QuadView" && isFisheye) {
            sunapiURI += ("&SubViewIndex=" + curQuadrant);
          }
          return execSunapi(sunapiURI);
        },700);
        if(UniversialManagerService.getViewModeType() === "QuadView" && isFisheye) {
          sunapiURI += ("&SubViewIndex=" + curQuadrant);
        }
        return execSunapi(sunapiURI);
      } else if (eventType === "mousedown") {
        downCheck = true;
        curX = event.clientX;
        curY = event.clientY;
        if(UniversialManagerService.getViewModeType() === "QuadView" && isFisheye) {
          prevQuadrant = calCoordinate(event.offsetX, event.offsetY); // needs to be saved and used when DPTZ button click event occurs
          if(dotCoordinates !== null && UniversialManagerService.getViewMode() === CAMERA_STATUS.VIEW_MODE.DETAIL) {
            removeDot();
            createDot(5, 5, prevQuadrant);
          }
          if(playingList[prevQuadrant].isPlaying === true) {
            downCheck = false;
            return null; // prevent event in currently playing area
          }
        }
      } else if (eventType === "mousemove") {
        if(downCheck) {
          if(isFisheye) {
            var tQuadrant = calCoordinate(event.offsetX, event.offsetY);
            if(prevQuadrant !== tQuadrant || tQuadrant === 0) { // 0 is out of boundary
              if (downCheck) {
                downCheck = false;
              }
              sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
              if(UniversialManagerService.getViewModeType() === "QuadView" && prevQuadrant !== 0) {
                sunapiURI += ("&SubViewIndex=" + prevQuadrant);
              }
              return execSunapi(sunapiURI);
            }
          }
          var pan = 0;
          var tilt = 0;          
          moveX = curX - event.clientX;
          moveY = curY - event.clientY;
          
          if (moveX < -minMove ) { //left -> right
            if (moveX < -moveLevel * 6) pan = -100;
            else if (moveX < -moveLevel * 5) pan = -85;
            else if (moveX < -moveLevel * 4) pan = -68;
            else if (moveX < -moveLevel * 3) pan = -51;
            else if (moveX < -moveLevel * 2) pan = -34;
            else pan = -17;
          } else if (moveX > minMove) { //right -> left
            if (moveX > moveLevel * 6) pan = 100;
            else if (moveX > moveLevel * 5) pan = 85;
            else if (moveX > moveLevel * 4) pan = 68;
            else if (moveX > moveLevel * 3) pan = 51;
            else if (moveX > moveLevel * 2) pan = 34;
            else pan = 17;
          }

          if (moveY < -minMove ) { //top -> bottom
            if (moveY < -moveLevel * 6) tilt = 100;
            else if (moveY < -moveLevel * 5) tilt = 85;
            else if (moveY < -moveLevel * 4) tilt = 68;
            else if (moveY < -moveLevel * 3) tilt = 51;
            else if (moveY < -moveLevel * 2) tilt = 34;
            else tilt = 17;
          } else if (moveY > minMove) { //bottom -> top
            if (moveY > moveLevel * 6) tilt = -100;
            else if (moveY > moveLevel * 5) tilt = -85;
            else if (moveY > moveLevel * 4) tilt = -68;
            else if (moveY > moveLevel * 3) tilt = -51;
            else if (moveY > moveLevel * 2) tilt = -34;
            else tilt = -17;
          }

          if(pan > 0)
          {
            pan = 51;
          }else if (pan < 0) 
          {
            pan = -51;
          } else{
            pan = 0;
          }

          if(tilt > 0)
          {
            tilt = 51;
          }else if (tilt < 0) 
          {
            tilt = -51;
          } else{
            tilt = 0;
          }

          if (curPan === pan && curTilt === tilt) {
            return null;
          } else {

            sunapiURI += "&Pan=" + pan;
            sunapiURI += "&Tilt=" + tilt;
            sunapiURI += "&Zoom=0";

            curPan = pan;
            curTilt = tilt;

            if(UniversialManagerService.getViewModeType() === "QuadView" && prevQuadrant === curQuadrant && isFisheye) { // limit the case of area changed when mouse moving
              sunapiURI += ("&SubViewIndex=" + curQuadrant);
            }
            return execSunapi(sunapiURI);
          }
        }
      } else if (eventType === "mouseup" || eventType === "mouseleave") {
        if (downCheck) {
          downCheck = false;
        }
        sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
        if(UniversialManagerService.getViewModeType() === "QuadView" && isFisheye) {
          if(playingList[curQuadrant].isPlaying === true) { return null; } // in case of event occured in playing area
          if(curQuadrant === 0) { return null; } // prevent sunapi call when out of boundary
          sunapiURI += ("&SubViewIndex=" + curQuadrant);
        }
        return execSunapi(sunapiURI);
      }
      return null;
    }

    function mouseWheel(event) { eventHandler(event,"mousewheel", null); }
    function mouseDown(event) { eventHandler(event,"mousedown", null); }
    function mouseMove(event) { eventHandler(event,"mousemove", null); }
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

    function execSunapi(uri, callback) {
      var getData = {};
      if (uri !== null) {
        SunapiClient.get(uri, getData,
          function (response) { 
            if(callback !== undefined)
            {
                if (callback !== null) { callback(response.data); }   
            }
          },
          function (errorData) { 
            if(callback !== undefined)
            {
              if (callback !== null) { 
                callback(errorData);  
              } else {
                console.log(errorData);  
              }  
            }
            else
            {
              console.log(errorData);  
            }
          }, '', true 
        );
      }
    }

    function getSettingList(callback, mode) {
      sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=";
      if (mode === "preset") {
        sunapiURI += "preset&action=view&Channel=0";
      } else if (mode === "group") {
        sunapiURI += "group&action=view&Channel=0";
      }
      execSunapi(sunapiURI, callback);
    }

    function runDPTZ(mode, value, callback) {
      var sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=";
      if(curQuadrant !== null && prevQuadrant !== 0) {
        if(mode === "home") {
          if(curQuadrant !== null) {
            var sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=home&action=control&Channel=0";
            sunapiURI += ("&SubViewIndex=" + prevQuadrant);
            execSunapi(sunapiURI);
          } else {
            console.error('Current Quadrant is null');
          }
        } else if(mode === "preset") {
          sunapiURI += "preset&action=control&Channel=0&Preset=" + value;
          sunapiURI += ("&SubViewIndex=" + prevQuadrant);
          if(playingList[prevQuadrant].isPlaying === true) {
            $(playingList[prevQuadrant].btn).remove();
            playingList[prevQuadrant].isPlaying = false;
          }
        } else if(mode === "group") {
          sunapiURI += "group&action=control&Channel=0&Group=" + value;
          sunapiURI += ("&SubViewIndex=" + prevQuadrant);
          createBtn(prevQuadrant);
        } else if(mode === "stopSequence") {
          sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
          sunapiURI += ("&SubViewIndex=" + curQuadrant);
          playingList[curQuadrant].isPlaying = false;
        } else if(mode === "stopSequenceAll") {
          for(var i = 1; i < playingList.length; i++) {
            if(playingList[i].isPlaying === true) {
              playingList[i].isPlaying = false;
              sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
              sunapiURI += ("&SubViewIndex=" + i);// when go to main live or change ptz mode while group running, stop all sequence
              execSunapi(sunapiURI);
            }
          }
        }
        execSunapi(sunapiURI);
      } else {
        console.error('Current Quadrant is null');
      }
    }

    function calCoordinate(x, y) {
      if(x < 0 || y < 0) { return null; }
      var quadrant = 0;
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
            return 0;
          }
          xPos = xPos - offsetLeft;
        } else if(offsetTop > 0) { 
          if((yPos <= offsetTop) || ((offsetTop + h) <= yPos)) { // y is postioned in offset area
            return 0;
          }
          yPos = yPos - offsetTop;
        }
      } else { // when main view, canvas handles mouse events
        if(xPos >= w - 5 || xPos <= 5 || yPos >= h - 5 || yPos <= 5) { return 0; } // to handle case of missing event to stop moving, +-5
      }

      var coordinates = [[{xPos:0,yPos:0}, {xPos:w/2,yPos:0}, {xPos:0,yPos:h/2}, {xPos:w/2,yPos:h/2}],
                        [{xPos:w/2,yPos:0}, {xPos:w,yPos:0}, {xPos:w/2,yPos:h/2}, {xPos:w,yPos:h/2}],
                        [{xPos:0,yPos:h/2}, {xPos:w/2,yPos:h/2}, {xPos:0,yPos:h}, {xPos:w/2,yPos:h}],
                        [{xPos:w/2,yPos:h/2}, {xPos:w,yPos:h/2}, {xPos:w/2,yPos:h}, {xPos:w,yPos:h}]];

      dotCoordinates = [{xPos:w/2/2+offsetLeft, yPos:h/2/2+offsetTop}, {xPos:w/2/2*3+offsetLeft, yPos:h/2/2+offsetTop}, {xPos:w/2/2+offsetLeft, yPos:h/2/2*3+offsetTop}, {xPos:w/2/2*3+offsetLeft, yPos:h/2/2*3+offsetTop}];

      for(var i = 0; i < 4; i++) {
        if(xPos < coordinates[i][3].xPos) {
          if(yPos < coordinates[i][3].yPos) { // (1,1)
            quadrant = 1;
            break;
          } else { // (1,2)
            quadrant = 3;
            break;
          }
        } else {
          if(yPos < coordinates[i][3].yPos) { // (2,1)
            quadrant = 2;
            break;
          } else { // (2,2)
            quadrant = 4;
            break;
          }
        }
      }
      return quadrant;
    }

    function createBtn(pos){
      var coordinate = dotCoordinates[pos - 1];
      var btn = $("<button class='quadrant"+pos+"'>").css({
        position: "absolute",
        left: coordinate.xPos + "px",
        top: coordinate.yPos + "px",
        transform: "translate(-50%, -50%)",
        zIndex: 1000
      });

      btn
        .addClass('button-background-none', 'ptz-menu-tooltip')
        .html("<span class='sr-only'>pause</span><i class='tui tui-ch-playback-stop'></i>")
        .on("click", function(){
          removeBtn(this);
        });
      
      $("body").prepend(btn);

      playingList[pos].isPlaying = true;
      playingList[pos].btn = btn;
    }

    function removeBtn(elem, mode) {
      if(mode === 'all') {
        for(var i = 1; i < playingList.length; i++) {
          var btn = $(playingList[i].btn);
          btn.remove();
        }
      } else {
        $(elem).remove();
        runDPTZ("stopSequence", curQuadrant);
      }
    }

    function createDot(width, height, pos) {
      var coordinate = dotCoordinates[pos-1];
      if(coordinate === undefined) { return; } // in case of click out of bounadary
      var objDot = $("<div id='objDot'>").css({
        width: width + "px",
        height: height + "px",
        backgroundColor: "yellow",
        position: "absolute",
        left: dotCoordinates[pos-1].xPos + "px",
        top: dotCoordinates[pos-1].yPos + "px",
        transform: "translate(-50%, -50%)",
        zIndex: 100
      });
      $("body").prepend(objDot);
    }

    function removeDot() {
      var dot = $("#objDot");
      if(dot.length !== 0) {
        $("#objDot").remove();
      } else {
        return null;
      }
    }

    function setIsOn(flag) {
      isOn = flag;
    }

    function getIsOn() {
      return isOn;
    }

    function updateDotCoordinates() {
      var canvas = document.querySelector(".kind-stream-canvas");
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      var offsetLeft = canvas.offsetLeft;
      var offsetTop = canvas.offsetTop;
      dotCoordinates = [{xPos:w/2/2+offsetLeft, yPos:h/2/2+offsetTop}, {xPos:w/2/2*3+offsetLeft, yPos:h/2/2+offsetTop}, {xPos:w/2/2+offsetLeft, yPos:h/2/2*3+offsetTop}, {xPos:w/2/2*3+offsetLeft, yPos:h/2/2*3+offsetTop}];
    }

    $rootScope.$saveOn('update-dot-dptz', function(event, data) {
      if(data === true) {
        if(UniversialManagerService.getViewMode() === CAMERA_STATUS.VIEW_MODE.DETAIL) {
          if(isOn) {
            updateDotCoordinates();
            if(removeDot() !== null) { // already dot existed
              createDot(5, 5, prevQuadrant);
            }
            removeBtn(null, 'all');
            for(var i = 1; i <= playingList.length; i++) { // recreate btns
              if(playingList[i].isPlaying === true) {
                createBtn(i);
              }
            }
          }
        }
      }
    });

    return {
      eventHandler : eventHandler,
      setElementEvent : setElementEvent,
      deleteElementEvent : deleteElementEvent,
      getSettingList : getSettingList,
      runDPTZ : runDPTZ,
      removeDot : removeDot,
      setIsOn : setIsOn,
      getIsOn : getIsOn,
      removeBtn : removeBtn
    };
}]);