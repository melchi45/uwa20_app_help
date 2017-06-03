kindFramework.service('pcSetupService', function(
  ConnectionSettingService,
  SessionOfUserManager,
  kindStreamInterface,
  sketchbookService,
  SunapiClient,
  $timeout,
  $interval
) {
  "use strict";

  /**
   * This function is forked from dptzSetupCtrl.js.
   */
  this.connectPreview = function(callback) {
    var reconnectionPromise = null;
    var quadview_preview_profile = {
      Name: 'profile13'
    };
    var playerdata = '';
    var timeCallback = function() {};
    var closeCallback = function() {};
    var errorCallback = function(error) {
      console.log("errorcode:", error.errorCode, "error string:", error.description, "error place:", error.place);
      if (error.errorCode === "200") {
        $interval.cancel(reconnectionPromise);
      } else if (error.errorCode === "999") {
        reconnectionPromise = $interval(function() {
          var data = ConnectionSettingService.getPlayerData('live', quadview_preview_profile, timeCallback, errorCallback, closeCallback);
          kindStreamInterface.changeStreamInfo(data);
        }, 5000);
      } else if (error.errorCode === "404") {
        $timeout(function() {
          playerdata = ConnectionSettingService.getPlayerData('live', quadview_preview_profile, timeCallback, errorCallback, closeCallback);
          callback(playerdata);
        }, 1);
      }
    };

    if (SessionOfUserManager.IsLoggedin()) {
      var id = SessionOfUserManager.getUsername();
      var password = SessionOfUserManager.getPassword();
      ConnectionSettingService.setConnectionInfo({
        id: id,
        password: password
      });

      if (SessionOfUserManager.GetClientIPAddress() === '127.0.0.1') {
        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view', {},
          function(response) {
            SessionOfUserManager.SetClientIPAddress(response.data.ClientIP);
          },
          function(errorData) {
            console.error(errorData);
          }, '', true);
      }

      kindStreamInterface.setIspreview(true);

      $timeout(function() {
        playerdata = ConnectionSettingService.getPlayerData('live', quadview_preview_profile, timeCallback, errorCallback, closeCallback);
        callback(playerdata);
      }, 1000);
    }
  };

  var eventSourceMaxResolution = {
    width: 0,
    height: 0
  };

  this.setMaxResolution = function() {
    var args = arguments;
    var width = 0;
    var height = 0;

    //When first argument is EventSourceOptions of Attributes.cgi
    if (args.length === 1) {
      var eventSourceOption = null;

      for (var i = 0; i < args[0].length; i++) {
        if (args[0][i].EventSource === 'MotionDetection') {
          eventSourceOption = args[0][i];
          break;
        }
      }

      //Exception
      if (Object.keys(eventSourceOption).length === 0) {
        return false;
      }

      var maxObjSize = eventSourceOption.MaximumObjectSizeInPixels;

      width = maxObjSize.Width;
      height = maxObjSize.Height;

      //When first and second arguments are width and height
    } else if (args.length === 2) {
      width = args[0];
      height = args[1];
    } else {
      return false;
    }

    eventSourceMaxResolution.width = width;
    eventSourceMaxResolution.height = height;

    return true;
  };

  this.getMaxResolution = function() {
    return {
      width: eventSourceMaxResolution.width,
      height: eventSourceMaxResolution.height,
    };
  };

  this.getDefaultResolution = function() {
    var size = {
      width: 640,
      height: sketchbookService.getConvertedVideoHeight(
        eventSourceMaxResolution.width,
        eventSourceMaxResolution.height
      )
    };

    return size;
  };

  this.requestSunapi = function(options) {
    var cgi = options.cgi;
    var msubmenu = options.msubmenu;
    var action = options.action;
    var url = '/stw-cgi/' + cgi + '.cgi?msubmenu=' + msubmenu + '&action=' + action;
    var data = options.data;
    var suc = options.successCallback;
    var err = options.failCallback;

    return SunapiClient.get(url, data, suc, err, '', true);
  };

  /**
   * Define Regular Expression
   * 
   * @example
   *     <something ng-pattern-restrict="{{regExpAlphaNum}}"></something>
   */
  var alphaNum = "^[0-9a-zA-Z]*$";
  var whiteSpaceAlphaNum = "^[0-9a-zA-Z\\s]*$";

  this.regExp = {
    getAlphaNum: function() {
      return alphaNum;
    },
    getWhiteSpaceAlphaNum: function() {
      return whiteSpaceAlphaNum;
    }
  };

  this.getCameraLocalTime = function(successCallback, errorCallback) {
    SunapiClient.get(
      '/stw-cgi/system.cgi?msubmenu=date&action=view', {},
      function(response) {
        var localTime = response.data.LocalTime.split("-").join("/");
        successCallback(localTime);
      },
      errorCallback,
      '',
      true
    );
  };
});