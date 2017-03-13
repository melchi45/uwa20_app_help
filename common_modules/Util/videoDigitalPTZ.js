function videoDigitalPTZ() {
	var videoElement = null,
		zoom = 1,
		rotate = 0,
		downCheck = false,
    curX = 0,
    curY = 0,
    moveX = 0,
    moveY = 0,
    moveScale = 1,
    leftLimit = 0,
    topLimit = 0,
    browserType = BrowserDetect();

	var properties = ['transform', 'WebkitTransform', 'MozTransform',
	                  'msTransform', 'OTransform'],
	prop = properties[0];

	function Constructor() {}

	function eventHandler(event,eventType,element) {
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
					if (zoom != 1) {
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
						if (parseInt(videoElement.style.left,10) < leftLimit)
							videoElement.style.left = (parseInt(videoElement.style.left,10) - moveX) + 'px';
						else if (parseInt(videoElement.style.left,10) != leftLimit)
							videoElement.style.left = leftLimit + 'px';
					} else if (moveX > 0) {	//right -> left
						if (parseInt(videoElement.style.left,10) > -leftLimit)
							videoElement.style.left = (parseInt(videoElement.style.left,10) - moveX) + 'px';
						else if (parseInt(videoElement.style.left,10) != -leftLimit)
							videoElement.style.left = -leftLimit + 'px';
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

	function mouseWheel(event) { eventHandler(event,"mousewheel", null); }
	function mouseDown(event) { eventHandler(event,"mousedown", null); }
	function mouseUp(event) { eventHandler(event,"mouseup", null); }	
	function mouseMove(event) { eventHandler(event,"mousemove", null); }
	function mouseLeave(event) { eventHandler(event,"mouseleave", null); }

  function setElementEvent(element) {
  	if (browserType === "firefox") {
  		element.addEventListener('DOMMouseScroll', mouseWheel);
  	} else {
  		element.addEventListener('mousewheel', mouseWheel);
  	}
    element.addEventListener('mousedown', mouseDown);
    element.addEventListener('mousemove', mouseMove);
    element.addEventListener('mouseup', mouseUp);
    element.addEventListener('mouseleave', mouseLeave);
  }

	Constructor.prototype = {
		setVideoElement: function(elem) {
			videoElement = elem;
		  videoElement.style.left = 0;
		  videoElement.style.top = 0;
		  videoElement.style.position = 'relative';
			setElementEvent(videoElement);
		}
	}
	return new Constructor();
}