"use strict";
/* globals KindSVGEditorFactory */
function KindSVGEditor(svgTag){
	this.svgTag = svgTag;
}

KindSVGEditor.prototype.svgTag = null;

KindSVGEditor.addPlugin = function(name, callback){
	KindSVGEditor.prototype[name] = function(){
		return callback.apply(new KindSVGEditorFactory(this.svgTag), arguments);
	};
};