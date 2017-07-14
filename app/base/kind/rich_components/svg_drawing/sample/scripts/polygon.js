function Polygon(){
	var svgTag = document.getElementById('svg_polygon');
	var kindSVGEditor = new KindSVGEditor(svgTag);
	var polygonObject = null;

	var draw = function(){
		polygonObject = kindSVGEditor.draw({
			color: '#ff9832',
			selectedColor: '#ff5732',
			lineStrokeWidth: 5,
			circleRadius: 8,
			fill: true,
			points: [
				[48,214],[182,206],[215,116],[159,29],[76,50],[25,139]
			],
			textInCircle: '1',
			useEvent: true,
			useCursor: true,
			event: {
				mouseup: getPoints,
				polygoncontextmenu: function(){
					alert("polygoncontextmenu");
				}
			}
		});
		
		polygonObject2 = kindSVGEditor.draw({
			color: '#ff9832',
			selectedColor: '#ff5732',
			lineStrokeWidth: 5,
			circleRadius: 8,
			fill: true,
			fillOpacity: 0,
			useEvent: true,
			points: [
				[303,469],[437,461],[475,374],[423,248],[291,270],[224,388],[219,472]
			],
			textInCircle: '2',
			event: {
				mouseup: getPoints,
				polygoncontextmenu: function(event){
					event.preventDefault();
					alert("polygoncontextmenu");
				}
			}
		});
	};

	var addPoint = function(){
		polygonObject.addPoint();
		polygonObject2.addPoint();
	};

	function getPoints(){
		var data = polygonObject.getData();
		var log = document.getElementById("svg_polygon_log");
		log.innerHTML = '';

		for(var i = 0, len = data.points.length; i < len; i++){
			var self = data.points[i];
			log.innerHTML += '[' + self[0] + ',' + self[1] + ']';

			if(i < len - 1){
				log.innerHTML += ',';
			}
		}
	}

	return {
		draw: draw,
		addPoint: addPoint,
		getPoints: getPoints
	};
}