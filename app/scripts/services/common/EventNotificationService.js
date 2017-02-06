kindFramework
.service('EventNotificationService', ['$rootScope', '$timeout', 'UniversialManagerService', '$interval', 'CAMERA_STATUS', 'sketchbookService',
  function($rootScope, $timeout, UniversialManagerService, $interval, CAMERA_STATUS, sketchbookService){
		
		var EventStatusList = {
		 	DigitalInput: false,
		 	AudioDetection: false
		};

  	var eventTimer = null;
  	var borderElement = null;
  	var viewMode = "default";
  	var currentEventPage = null;	//MotionDetection, TamperingDetection, DefocusDetection, Fog, FaceDetection
  	var isDetect = false;

  	var commonBorderCSS = "3px solid white",
  		fullscreenBorderCSS = "3px solid black",
  		detectBorderCSS = "3px solid red";

  	this.setBorderElement = function(element, currentPage){		//element type: jquery obj
  		borderElement = element;
  		borderElement.css("border", commonBorderCSS);
  		if(currentPage === undefined){
  			currentEventPage = null;	
  		}else{
  			currentEventPage = currentPage;	
  		}
  	};

  	this.setViewMode = function(_viewMode){
  		viewMode = _viewMode;
  		
  		if(borderElement === null || borderElement === undefined)
  			return;

  		if(!isDetect){
  			if(viewMode === "fullScreen"){
  				borderElement.css("border", fullscreenBorderCSS);
  			}else{
  				borderElement.css("border", commonBorderCSS);
  			}
  		}
  	};

  	this.updateEventStatus = function(data, isVAData) {
      var expire = 500;
      var geometryMetaData = [];

      try{
        if(isVAData === true){
          for(var i = 0, ii = data.length; i < ii; i++){
            excute(data[i]);
          }
        }else{
          excute(data); 
        }
      }catch(e){
        console.error(e);
      }

      if(geometryMetaData.length > 0){
        sketchbookService.drawMetaDataAll(geometryMetaData, expire);
      }

      function drawEventNoti(data) {
        // console.log("event.type: " + data.type + " , event.value: " + data.value + ", event.eventId: " + data.eventId);
        var targetData = data;

        if(!(currentEventPage === 'live' || (currentEventPage === targetData.type))){
          return;
        }

        switch (targetData.type) {
          case "MoveStatus:PanTilt":
          case "MoveStatus:Zoom":
          case "DigitalAutoTracking":
          updatePtzEvent(targetData);
          break;
          case "DigitalInput":
          if (targetData.value == 'true') {
            setEventStatusList("DigitalInput", true);
            updateEventBorder(true);
            if (eventTimer !== undefined || eventTimer !== null) {
              window.clearTimeout(eventTimer);
            }

            var closeBorder = function() {
              if (!checkEventStatusList()) {
                updateEventBorder(false);
                eventTimer = null;
              } else {
                window.setTimeout(closeBorder, 15000);
              }
            }

            eventTimer = window.setTimeout(closeBorder, 15000);
          } else {
            setEventStatusList("DigitalInput", false);
          }
          break;
          case "AudioDetection":
          if (targetData.value == 'true') {
            setEventStatusList("AudioDetection", true);
            updateEventBorder(true);
          } else {
            setEventStatusList("AudioDetection", false);
            if (eventTimer === null || eventTimer === undefined) {
              if (!checkEventStatusList()) {
                updateEventBorder(false);
              }
            }
          }
          break;
          case "Relay":
            UniversialManagerService.setAlarmOutput((targetData.eventId-1), targetData.value == "false" ? false : true);
            var outputElement = $('#output-' + (targetData.eventId -1))[0];
            if (outputElement !== undefined) {
              if (targetData.value == 'false') 
                $('#output-' + (targetData.eventId -1)).removeClass('cm_on');
              else
                $('#output-' + (targetData.eventId -1)).addClass('cm_on');
            }
          default:
            if (targetData.value == 'true') {
              updateEventBorder(true);
              if (eventTimer !== undefined || eventTimer !== null) {
                window.clearTimeout(eventTimer);
              }

              eventTimer = window.setTimeout(function() {
                if (!checkEventStatusList() || currentEventPage !== 'live') {
                  updateEventBorder(false);
                }
                eventTimer = null;
              }, 15000);
            }
          break;
        }
      }

      function drawVAObject(data) {
        // IVA&FD drawing
        if(currentEventPage !== data.type) return;
        var isCircle = (currentEventPage === data.type && data.type === 'FaceDetection');
        var scale = data.scale;
        var coordinates = data.coordinates;
        var translate = data.translate;
        var color = data.color;

        geometryMetaData.push([ // IVA&FD normal drawing
          coordinates[0], 
          coordinates[1], 
          coordinates[2], 
          coordinates[3], 
          scale, 
          translate, 
          color, 
          isCircle
        ]);
      }

      function excute(data){
        if(data.id === undefined || data.id === null) {
          drawEventNoti(data);
        } else {
          if(data.id === 2) {
            drawVAObject(data);
          } else if(data.id === 1) {
            drawEventNoti(data);
          }
        }
      }
  	};

    function updatePtzEvent(eventObj) {
      switch(eventObj.type)
      {
          case "MoveStatus:PanTilt":
          case "MoveStatus:Zoom":
            $rootScope.$emit('PTZMoveStatus', eventObj);
            break;
          case "DigitalAutoTracking":
            var at_icon = $('[class*="tui-ch-live-ptz-tracking-auto"]');
            if(eventObj.value === 'true')
            {
                UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING);
                at_icon.removeClass().addClass('tui tui-ch-live-ptz-tracking-auto-on');
            }
            else if(eventObj.value === 'false')
            {
                UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ);
                at_icon.removeClass().addClass('tui tui-ch-live-ptz-tracking-auto-off');
            }
            break;
      }
      $timeout(function() { $rootScope.$apply(); } );
    };  	

  	function updateEventBorder(isDisplay) {
  		if(borderElement === null || borderElement === undefined)
  			return;

  		if (isDisplay) {
  			$rootScope.$apply(function() {
  				borderElement.css("border", detectBorderCSS);
  				isDetect = true;
  			});
  		} else {
  			$rootScope.$apply(function() {
  				if(viewMode === "fullScreen"){
  					borderElement.css("border", fullscreenBorderCSS);
  				}else{
  					borderElement.css("border", commonBorderCSS);
  				}
					isDetect = false;
  			});
  		}
  	};  	

    function checkEventStatusList() {
    	var value = false;
    	for (var i in EventStatusList) {
    		if (EventStatusList[i] === true) {
    			value = true;
    		}
    	}
    	return value;
    }

    function setEventStatusList(eventType, value) {
    	EventStatusList[eventType] = value;
    }  	
}]);