function moveToPluginWebviewer(){
    location.href = CONFIG.OLD_WEBVIEW;
}

function moveToNonPluginWebviewer(){
    location.href = CONFIG.NEW_WEBVIEW;
}

function moveToGuide(){
    location.href = CONFIG.GUIDE;
}

function moveToIeUpgrade(){
    location.href = CONFIG.IE_UPGRACE;
}

function showIeLowerVersion(){
    document.getElementById("ie-lower-version").style.display = 'block';
}

window.onload = function(){
    if(detector.chrome || detector.msedge){
		try {
			document.getElementById("wrap").innerHTML = '';
		}catch(e){
		}
        moveToNonPluginWebviewer();
    }else if(detector.msie){
    	var ieVersion = parseInt(detector.version);

    	if(ieVersion == 11){
    		moveToPluginWebviewer();
    	}else{
    	   showIeLowerVersion();
           return;
    	}
    }else{
        document.getElementById("wrap").style.display = 'block';
	}
};