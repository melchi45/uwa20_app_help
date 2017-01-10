"use strict";
function LinePainter(svg){
	if(typeof svg === "undefined"){
		throw 'Parent SVG have to defind.';
	}

	if(!(this instanceof LinePainter)){
		return new LinePainter(svg);
	}
	
	function pythagoreanTheorem(x1, y1, x2, y2){
		var xLength = Math.abs(x1 - x2);
		var yLength = Math.abs(y1 - y2);
		/**
		 * It is Pythagorean theorem. 
		 * Math.pow(a, 2) + Math.pow(b, 2) = Math.pow(c, 2)
		 */
		var lineLength = Math.sqrt(
				Math.pow(xLength, 2) + Math.pow(yLength, 2)
			);

		return lineLength;
	}

	function getAngle(x1, y1, x2, y2){
		var xLength = x1 - x2;
		var yLength = y1 - y2;
		var angle = Math.atan2(xLength, yLength);

		angle *= 180 / Math.PI;
		angle *= -1;

		return angle;
	}

	function getLineCenter(x1, y1, x2, y2){
		var longX = 0;
		var shortX = 0;
		var longY = 0;
		var shortY = 0;
		var centerX = 0;
		var centerY = 0;

		if(x1 > x2){
			longX = x1;
			shortX = x2;
		}else{
			longX = x2;
			shortX = x1;
		}


		if(y1 > y2){
			longY = y1;
			shortY = y2;
		}else{
			longY = y2;
			shortY = y1;
		}

		centerX = (longX - shortX)/2 + shortX;
		centerY = (longY - shortY)/2 + shortY;

		return [centerX,centerY];
	}
		
	function getScroll(){
		var scrollTop = 0;
		var scrollLeft = 0;

		try {
			var parentNodeScroll = $('#setup-main');
			scrollTop = parentNodeScroll.scrollTop();
			scrollLeft = parentNodeScroll.scrollLeft();
		}catch(e){
			console.error("Getting scroll top and left have problem. Please Check .main of Setup Page.");
		}

		return {
			top: scrollTop,
			left: scrollLeft
		};
	}

	var normalImage = './base/images/setup/btn_in-out_normal.png';
	var hoverImage = './base/images/setup/btn_in-out_over.png';
	var pressImage =  './base/images/setup/btn_in-out_press.png';
	var parentSvg = svg;
	
	parentSvg.setAttributeNS(null, 'draggable', false);

	//Default style
	parentSvg.style.cursor = 'normal';

	parentSvg.style.userSelect = 'none';
	parentSvg.style.mozUserSelect = 'none';
	parentSvg.style.webkitUserSelect = 'none';
	parentSvg.style.msUserSelect = 'none';

	//Set offset
	var parentOffset = function(){
		var offset = parentSvg.getBoundingClientRect();
		var scroll = getScroll();
		return {
			top: scroll.top + offset.top,
			left: scroll.left + offset.left,
			width: offset.width,
			height: offset.height
		};
	};

	function createLine(options){
		var svgns = "http://www.w3.org/2000/svg";
		var xlinkns = "http://www.w3.org/1999/xlink";

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
		var color = options.color === undefined ? '#c2e7ff' : options.color;
		var selectedColor = options.selectedColor === undefined ? '#019afd' : options.selectedColor;
		var x1 = options.x1 === undefined ? 5 : options.x1;
		var y1 = options.y1 === undefined ? 5 : options.y1;
		var x2 = options.x2 === undefined ? 100 : options.x2;
		var y2 = options.y2 === undefined ? 100 : options.y2;
		var lineStrokeWidth = options.lineStrokeWidth === undefined ? 3 : options.lineStrokeWidth;
		var circleRadius = options.circleRadius === undefined ? 5 : options.circleRadius;
		var minLineLength = options.minLineLength === undefined ? 120 : options.minLineLength;
		var textInCircle = options.textInCircle === undefined ? null : options.textInCircle;
		var useArrow = options.useArrow === undefined ? false : options.useArrow;
		var arrow = options.arrow === undefined ? 'in' : options.arrow;
		var useEvent = options.useEvent === undefined ? false : options.useEvent;
		var useCursor = options.useCursor === undefined ? false : options.useCursor;

		//Create Line Tag
		var line = document.createElementNS(svgns,"line");
		line.setAttributeNS(null, 'stroke-width', lineStrokeWidth);
		line.setAttributeNS(null, 'draggable', false);

		//Create First Circle
		var firstCircle = document.createElementNS(svgns,"circle");
		firstCircle.setAttributeNS(null, "r", circleRadius);
		firstCircle.setAttributeNS(null, 'draggable', false);

		//Create Second Circle
		var secondCircle = document.createElementNS(svgns,"circle");
		secondCircle.setAttributeNS(null, "r", circleRadius * 1.5);
		secondCircle.setAttributeNS(null, 'draggable', false);

		var arrowImageContainner = null;
		var arrowImage = null;
		var halfArrowWidth = 25/2;
		var halfArrowHeight = 33/2;
		var textTag = null;

		var setCursor = function(dom){
			var cursor = useCursor === true ? 'pointer' : 'default';
			dom.style.cursor = cursor;
		};

		var LineInformation = {
			x1: 0,
			y1: 0,
			x2: 0,
			y2: 0,
			arrow: null,
			getAxis: function(){
				return [
					LineInformation.x1,
					LineInformation.y1,
					LineInformation.x2,
					LineInformation.y2
				];
			},
			getAll: function(){
				return {
					x1: LineInformation.x1,
					y1: LineInformation.y1,
					x2: LineInformation.x2,
					y2: LineInformation.y2,
					arrow: LineInformation.arrow
				};
			},
			changeFirstAxis: function(x, y){
				LineInformation.x1 = x;
				LineInformation.y1 = y;

				line.setAttributeNS(null, 'x1', x);
				line.setAttributeNS(null, 'y1', y);

				firstCircle.setAttributeNS(null, "cx", x);
				firstCircle.setAttributeNS(null, "cy", y);

				if(useArrow === true){
					LineInformation.changeArrowImage();
				}
			},
			changeSecondAxis: function(x, y){
				LineInformation.x2 = x;
				LineInformation.y2 = y;

				line.setAttributeNS(null, 'x2', x);
				line.setAttributeNS(null, 'y2', y);

				secondCircle.setAttributeNS(null, "cx", x);
				secondCircle.setAttributeNS(null, "cy", y);

				if(textInCircle !== null){
					textTag.setAttributeNS(null, 'x', x - 3);
					textTag.setAttributeNS(null, 'y', y + 4);
				}

				if(useArrow === true){
					LineInformation.changeArrowImage();
				}
			},
			changeArrow: function(arrow){
				LineInformation.arrow = arrow;
			},
			selectLine: function(){
				line.setAttributeNS(null, 'stroke', selectedColor);
			},
			selectFirstCircle: function(){
				firstCircle.setAttributeNS(null, "fill", selectedColor);
			},
			selectSecondCircle: function(){
				secondCircle.setAttributeNS(null, "fill", selectedColor);
			},
			resetAllColor: function(){
				line.setAttributeNS(null, 'stroke', color);
				firstCircle.setAttributeNS(null, "fill", color);
				secondCircle.setAttributeNS(null, "fill", color);
			},
			changeArrowImage: function(){
				var axis = LineInformation.getAxis();
				var angle = getAngle(axis[0], axis[1], axis[2], axis[3]);
				var degree = LineInformation.arrow === 'in' ? 270 : 90;

				angle += degree;

				var lineCenter = getLineCenter(axis[0], axis[1], axis[2], axis[3]);

				var xAxis = lineCenter[0];
				var yAxis = lineCenter[1];
				
				arrowImage.setAttributeNS(null, 'x', xAxis);
				arrowImage.setAttributeNS(null, 'y', yAxis);

				arrowImageContainner.setAttributeNS(null, 'transform', 'rotate(' + angle + ' ' + xAxis + ' ' + yAxis + ') translate(' + (halfArrowWidth * -1) + ',' + (halfArrowHeight * -1) + ')');
			}
		};

		if(textInCircle !== null){
			textTag = document.createElementNS(svgns, 'text');
			textTag.textContent = textInCircle;
			textTag.style.fontSize = '12px';
			setCursor(textTag);
			textTag.setAttributeNS(null, 'draggable', false);
		}

		if(useArrow === true){
			arrowImageContainner = document.createElementNS(svgns, 'g');
			arrowImage = document.createElementNS(svgns, 'image');
			arrowImage.setAttributeNS(xlinkns, 'href', normalImage);
			arrowImage.setAttributeNS(null, 'width', 25);
			arrowImage.setAttributeNS(null, 'height', 33);
			arrowImage.setAttributeNS(null, 'draggable', false);
			setCursor(arrowImage);

			arrowImageContainner.appendChild(arrowImage);
		}

		//Initialize
		LineInformation.changeFirstAxis(x1, y1);
		LineInformation.changeSecondAxis(x2, y2);
		LineInformation.changeArrow(arrow);
		LineInformation.resetAllColor();
		
		setCursor(line);
		setCursor(firstCircle);
		setCursor(secondCircle);

		parentSvg.appendChild(line);
		parentSvg.appendChild(firstCircle);
		parentSvg.appendChild(secondCircle);


		//Bind Event
		if(useEvent === true){
			firstCircle.onmousedown = function(){
				LineInformation.selectFirstCircle();
				firstCircle.isSelected = true;
			};

			secondCircle.onmousedown = function(){
				LineInformation.selectSecondCircle();
				secondCircle.isSelected = true;
			};

			line.onmousedown = function(event){
				LineInformation.selectLine();
				this.isSelected = true;
				this.startXAxis = event.pageX + getScroll().left - parentOffset().left;
				this.startYAxis = event.pageY + getScroll().top - parentOffset().top;
			};
		}

		if(textInCircle !== null){
			if(useEvent === true){
				textTag.onmousedown = secondCircle.onmousedown;
			}	
			parentSvg.appendChild(textTag);
		}

		if(useArrow === true){
			LineInformation.changeArrowImage();

			parentSvg.appendChild(arrowImageContainner);

			if(useEvent === true){
				arrowImage.onmousedown = function(event){
					arrowImage.isSelected = true;
					arrowImage.setAttributeNS(xlinkns, 'href', pressImage);
				};

				arrowImage.onmouseout = function(){
					if(arrowImage.isSelected === true){
						arrowImage.setAttributeNS(xlinkns, 'href', normalImage);
					}
				};

				arrowImage.onmouseup = function(){
					if(arrowImage.isSelected === true){
						arrowImage.isSelected = false;
						arrowImage.setAttributeNS(xlinkns, 'href', normalImage);

						var arrow = LineInformation.arrow === 'in' ? 'out' : 'in';
						LineInformation.changeArrow(arrow);
						LineInformation.changeArrowImage();
					}
				};
			}
		}

		var parentSvgMouseUp = function(){
			if(firstCircle.isSelected || secondCircle.isSelected || line.isSelected){
				firstCircle.isSelected = false;
				secondCircle.isSelected = false;
				line.isSelected = false;

				LineInformation.resetAllColor();
			}
		};

		var parentSvgMouseMove = function(event){
			var xAxis = event.pageX + getScroll().left - parentOffset().left;
			var yAxis = event.pageY + getScroll().top - parentOffset().top;

			//Axis validation
			if(
				yAxis < 0 ||
				xAxis < 0 ||
				xAxis > parentOffset().width ||
				yAxis > parentOffset().height
				){
				return;
			}

			if(firstCircle.isSelected === true){
				var currentAxis = LineInformation.getAxis();
				//Validation
				if(pythagoreanTheorem(xAxis, yAxis, currentAxis[2], currentAxis[3]) < minLineLength){
					return;
				}

				LineInformation.changeFirstAxis(xAxis, yAxis);
			}

			if(secondCircle.isSelected === true){
				var currentAxis = LineInformation.getAxis();
				//Validation
				if(pythagoreanTheorem(currentAxis[0], currentAxis[1], xAxis, yAxis) < minLineLength){
					return;
				}

				LineInformation.changeSecondAxis(xAxis, yAxis);
			}

			if(line.isSelected === true){
				var movedXAxis = xAxis - line.startXAxis;
				var movedYAxis = yAxis - line.startYAxis;

				var currentAxis = LineInformation.getAxis();

				var changedX1 = currentAxis[0] + movedXAxis;
				var changedY1 = currentAxis[1] + movedYAxis;
				var changedX2 = currentAxis[2] + movedXAxis;
				var changedY2 = currentAxis[3] + movedYAxis;

				var offsetLeft = parentOffset().left;
				var offsetTop = parentOffset().top;
				var offsetWidth = parentOffset().width;
				var offsetHeight = parentOffset().height;

				/**
				 * Validation
				 * changedX1, Y1, X2, Y2는 SVG의 기준으로한 좌표값이므로
				 * SVG의 크기를 넘지 않게만 하면 됨.
				 */
				if(
					changedX1 <= 0 ||
					changedX1 >= offsetWidth ||
					changedY1 <= 0 ||
					changedY1 >= offsetHeight ||

					changedX2 <= 0 ||
					changedX2 >= offsetWidth ||
					changedY2 <= 0 ||
					changedY2 >= offsetHeight
					){
					return;
				}

				LineInformation.changeFirstAxis(changedX1, changedY1);
				LineInformation.changeSecondAxis(changedX2, changedY2);

				line.startXAxis = xAxis;
				line.startYAxis = yAxis;
			}
		};

		if(useEvent === true){
			parentSvg.addEventListener('mouseup', parentSvgMouseUp);
			document.documentElement.addEventListener('mouseup', parentSvgMouseUp);
			parentSvg.addEventListener('mousemove', parentSvgMouseMove);
		}

		function removeAll(){
			parentSvg.removeChild(line);
			parentSvg.removeChild(firstCircle);
			parentSvg.removeChild(secondCircle);

			if(textInCircle !== null){
				parentSvg.removeChild(textTag);
			}

			if(useArrow === true){
				arrowImageContainner.removeChild(arrowImage);
				parentSvg.removeChild(arrowImageContainner);
			}

			parentSvg.removeEventListener('mouseup', parentSvgMouseUp);
			document.documentElement.removeEventListener('mouseup', parentSvgMouseUp);
			parentSvg.removeEventListener('mousemove', parentSvgMouseMove);
		}

		function destroy(){
			document.documentElement.removeEventListener('mouseup', parentSvgMouseUp);
		}

		return {
			remove: removeAll,
			getData: LineInformation.getAll,
			destroy: destroy
		};
	}

	return {
		createLine: createLine
	};
}

kindFramework.factory('PCLinePainter', function(){
	return LinePainter;
});