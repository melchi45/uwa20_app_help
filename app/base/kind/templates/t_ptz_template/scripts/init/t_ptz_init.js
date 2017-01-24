var app = {
	
	// Check if app is running on browser on device
    setDevice: function () {
        window.isPhone = false;
        var documentUrl = document.URL;
        
        if (documentUrl.indexOf("http://") === -1 && documentUrl.indexOf("https://") === -1) {
            window.isPhone = true;
        }
        return window.isPhone;
    },
	
    // Application Constructor
    initialize: function() {
        this.setDevice();
        
        if(window.isPhone){
            this.bindEvents();
        }else{
            this.onDeviceReady();
        }
    },
	
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
	
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		console.log('onDeviceReady..');
		angular.bootstrap(document, ['kindFramework']);
    }
};

app.initialize();