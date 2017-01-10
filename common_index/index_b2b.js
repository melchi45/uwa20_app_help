window.onload = function(){
	var notSupportMessage = "Not Supporting Browser";
	
	function resetDom(){
		document.getElementById("wrap").innerHTML = '';
	}
	
	function moveToNewWebView(){
		resetDom();
		location.href = ROOT_PATH.NEW_WEBVIEW;
	}
	
	function moveToOldWebView(){
		resetDom();
		location.href = ROOT_PATH.OLD_WEBVIEW;
	}
	
	//If this Browser is Internet Explorer
	if(detector.msie){
		moveToOldWebView();
	}else{
		//If this Browser is Firefox or Safari
		if(detector.firefox || detector.safari){
			var isSupportingPlugin = "java" in navigator.plugins && navigator.javaEnabled();
			
			//If this Browser does not support the Plugin
			if(!isSupportingPlugin){
				moveToNewWebView();
			}else{
				document.getElementById("old-plugin").onclick = function(){
					moveToOldWebView();
				};

				document.getElementById("non-plugin").onclick = function(){
					moveToNewWebView();
				};
			}
		}else{
			//If this Browser is Chrome or Msedge
			if(detector.chrome || detector.msedge){
				moveToNewWebView();
			}else{
				alert(notSupportMessage);
			}
		}
	}
};