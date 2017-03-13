var FileMaker = function() {
	'use strict';
	var header;
	var parts;
	var tails;
	var tailHeader;
	var blob = null;
	var mainBlobBuilder, bodyBlobBuilder, tailBlobBuilder;
	var bodyBlob;
	var tailBlob;
	var supportBolbBuilder;
	function Constructor() {
		header = [];
		parts = [];
		tails = [];
		tailHeader = [];
		try {
			if( typeof MSBlobBuilder !== "undefined" ) {
				console.log("support blob builder");
				supportBolbBuilder = true;
				mainBlobBuilder = new MSBlobBuilder();
				bodyBlobBuilder = new MSBlobBuilder();
				tailBlobBuilder = new MSBlobBuilder();
			}
		} catch(e){
			supportBolbBuilder = false;
		}
	}
	function addBody(part) {
		if( supportBolbBuilder ) {
			bodyBlobBuilder.append(part);
		} 
		else {
			parts.push(part);
		}
		blob = null;
	}
	function addMainHeader ( _header) {
		header = _header;
	}
	function addTailHeader ( header) {
		tailHeader = header;
	}
	function addTail(tail) {
		if( supportBolbBuilder ) {
			tailBlobBuilder.append(tail);
		}
		else {
			tails.push(tail);
		}
	}
	function clearMemory() {
		header = null;
		tailHeader = null;
		parts = [];
		tails = [];
		blob = null;
	}
	function createAviFile(file_name) {
		if( blob === null ) {
			if( supportBolbBuilder ) {
				var bodyBlob = bodyBlobBuilder.getBlob();
				var tailBlob = tailBlobBuilder.getBlob();
				var bodyReader = new FileReader();
				var tailReader = new FileReader();
				bodyReader.readAsArrayBuffer(bodyBlob);
				bodyReader.onload = function() {
					mainBlobBuilder.append(header);
					mainBlobBuilder.append(this.result);
					tailReader.readAsArrayBuffer(tailBlob);
				}
				tailReader.onload = function() {
					mainBlobBuilder.append(tailHeader);
					mainBlobBuilder.append(this.result);
					window.navigator.msSaveOrOpenBlob(mainBlobBuilder.getBlob('application/octet-stream'), file_name+'.avi');
					console.log("....................msSaveOrOpenBlob");
					bodyReader = null;
					tailReader = null;
					clearMemory();
				}
			}
			else {
				var whole = [];
				whole.push(header);
				for( var i=0 ; i< parts.length; i++ ){ 
					whole.push(parts[i]);
				}
				whole.push(tailHeader);
				for( var i=0 ; i< tails.length ; i++ ){
					whole.push(tails[i]);
				}
				blob = new Blob(whole, {type : "application/octet-stream"});
				saveAs(blob, file_name+'.avi');
				console.log("....................saveAs");
				whole = null;
				clearMemory();
			}
		}
	}
	Constructor.prototype = {
		processMessage : function(target, data) {
			if( target === "body" ) {
				addBody(data);
			}
			else if( target === "mainHeader") {
				addMainHeader(data);
			}
			else if( target === "tailHeader") {
				addTailHeader(data);
			}
			else if( target === "tailBody") {
				addTail(data);
			}
			else if( target === "save") {
				createAviFile(data);
			}
		}
	}
	return new Constructor();
};