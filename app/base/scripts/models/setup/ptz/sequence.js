kindFramework.factory(
	'SequenceModel',function(){
    "use strict";
		var SequenceModel = function() {
			if( SequenceModel._instance) {
				return SequenceModel._instance;
			}
			var menu = "";
			var mode = null;
			var index = null;


			this.getCurrentMenu = function() {
				return menu;
			};

			this.changeMenu = function(_menu) {
				if( menu !== _menu ) {
					menu = _menu;
					//clear previous setting mode&index
					mode = null;
					index = null;
				}
			};

			this.getCurrentMode = function() {
				return mode;
			};

			this.setCurrentMode = function(_mode) {
				if( _mode !== null && _mode !== undefined) {
					mode = _mode;
				}
			};

			this.getCurrentIndex = function() {
				return index;
			};

			this.setCurrentIndex = function(idx) {
				if( idx !== null && idx !== undefined ) {
					index = idx;
				}
			};

			this.returnSunapiURI = function() {
				var uri = "/stw-cgi/ptzcontrol.cgi?msubmenu="+menu+"&action=control&Channel=0";
	      if( mode !== null ) {
	        uri +="&Mode="+mode;
	      }
	      if( index !== null && index !== undefined ) {
	        uri += "&"+menu.substring(0,1).toUpperCase()+menu.substring(1)+"="+index;
	      }
	      return uri;
			};

			SequenceModel._instance = this;
		}
		return SequenceModel;
});