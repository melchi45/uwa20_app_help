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
    var userAgent = this.getUserAgent();
    if(userAgent.name === 'msie' && userAgent.version < 9){
      this.setBrowserSurpportPage();
    }else{
      this.setDevice();

      if(window.isPhone){
        this.bindEvents();
      }else{
        this.onDeviceReady();
      }
    }
  },

  setBrowserSurpportPage: function(){
    var html = [
      '<div class="container">',
      '<div class="alert alert-info" role="alert">',
      'This Web Site have used the <strong>HTML5 Standard</strong> Technology. Please upgrade the browser that can be surport and restart.',
      '<br />',
      '<br />',
      '<a href="http://windows.microsoft.com/ko-kr/internet-explorer/download-ie/" class="btn btn-primary btn-sm" target="_blank">',
      'Internet Explorer',
      '</a>&nbsp;',

      '<a href="http://www.mozilla.or.kr/ko/firefox/new/" class="btn btn-warning btn-sm" target="_blank">',
      'FireFox',
      '</a>&nbsp;',

      '<a href="http://www.google.com/intl/ko/chrome/browser/" class="btn btn-success btn-sm" target="_blank">',
      'Chrome',
      '</a>&nbsp;',

      '<a href="http://support.apple.com/kb/DL1531?viewlocale=ko_KR&amp;locale=ko_KR/" class="btn btn-info btn-sm" target="_blank">',
      'Safari',
      '</a>&nbsp;',

      '<a href="http://www.opera.com/ko/computer/" class="btn btn-danger btn-sm" target="_blank">',
      'Opera',
      '</a>',
      '</div>',
      '</div>'
    ];
    document.body.innerHTML = html.join('');
    document.title = "Please upgrade the browser";
  },

  getUserAgent: function(){
    var userAgent = navigator.userAgent.toLowerCase();
    var match = /(webkit)[ \/](\w.]+)/.exec(userAgent) ||
    /(opera)(?:.*version)?[ \/](\w.]+)/.exec(userAgent) ||
    /(msie) ([\w.]+)/.exec(userAgent) ||               
    /(mozilla)(?:.*? rv:([\w.]+))?/.exec(userAgent) ||
    [];

    return {
      name: match[1] || "",
      version: match[2] * 1 || 0
    };
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