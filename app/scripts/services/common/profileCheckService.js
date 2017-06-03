kindFramework.factory('ProfileCheckService', [
  function() {
    "use strict";

    var resolutionNum = 18;

    var mjpegMaxFrameRate = 30;
    var h264MaxFrameRate = 60;
    var h265MaxFrameRate = 60;

    var mjpegAvalidableArray = new Array(resolutionNum);
    var h264AvalidableArray = new Array(resolutionNum);
    var h265AvalidableArray = new Array(resolutionNum);

    var resolutionArray = ['320x240', '640x360', '640x480', '720x480', '720x576', // 0 ~ 4
      '800x448', '800x600', '1024x768', '1280x720', '1280x960', // 5 ~ 9
      '1280x1024', '1280x1280', '1600x1200', '1920x1080', '2560x1440', // 10 ~ 14
      '2560x1920', '3840x2160', '4096x2160', '4000x3000'
    ]; // 15 ~ 18

    //MJPEG Array Setting
    for (var i = 0; i < resolutionArray.length; i++) {
      mjpegAvalidableArray[i] = new Array(mjpegMaxFrameRate);
      for (var j = 0; j < mjpegMaxFrameRate; j++) {
        mjpegAvalidableArray[i][j] = {
          resolution: resolutionArray[i],
          frameRate: (j + 1),
          available: true
        };
        if (mjpegAvalidableArray[i][j].resolution === resolutionArray[13] && mjpegAvalidableArray[i][j].frameRate > 10) {
          mjpegAvalidableArray[i][j].available = false;
        } else if (mjpegAvalidableArray[i][j].resolution === resolutionArray[14] && mjpegAvalidableArray[i][j].frameRate > 2) {
          mjpegAvalidableArray[i][j].available = false;
        } else if (mjpegAvalidableArray[i][j].resolution === resolutionArray[15] && mjpegAvalidableArray[i][j].frameRate > 2) {
          mjpegAvalidableArray[i][j].available = false;
        } else if (mjpegAvalidableArray[i][j].resolution === resolutionArray[16] && mjpegAvalidableArray[i][j].frameRate > 0) {
          mjpegAvalidableArray[i][j].available = false;
        } else if (mjpegAvalidableArray[i][j].resolution === resolutionArray[17] && mjpegAvalidableArray[i][j].frameRate > 0) {
          mjpegAvalidableArray[i][j].available = false;
        } else if (mjpegAvalidableArray[i][j].resolution === resolutionArray[18] && mjpegAvalidableArray[i][j].frameRate > 0) {
          mjpegAvalidableArray[i][j].available = false;
        }
      }
    }

    //H264 Array Setting
    for (var i = 0; i < resolutionArray.length; i++) {
      h264AvalidableArray[i] = new Array(h264MaxFrameRate);
      for (var j = 0; j < h264MaxFrameRate; j++) {
        h264AvalidableArray[i][j] = {
          resolution: resolutionArray[i],
          frameRate: (j + 1),
          available: true
        };
        if (h264AvalidableArray[i][j].resolution === resolutionArray[14] && h264AvalidableArray[i][j].frameRate > 6) {
          h264AvalidableArray[i][j].available = false;
        } else if (h264AvalidableArray[i][j].resolution === resolutionArray[15] && h264AvalidableArray[i][j].frameRate > 3) {
          h264AvalidableArray[i][j].available = false;
        } else if (h264AvalidableArray[i][j].resolution === resolutionArray[16] && h264AvalidableArray[i][j].frameRate > 0) {
          h264AvalidableArray[i][j].available = false;
        } else if (h264AvalidableArray[i][j].resolution === resolutionArray[17] && h264AvalidableArray[i][j].frameRate > 0) {
          h264AvalidableArray[i][j].available = false;
        } else if (h264AvalidableArray[i][j].resolution === resolutionArray[18] && h264AvalidableArray[i][j].frameRate > 0) {
          h264AvalidableArray[i][j].available = false;
        }
      }
    }

    //H265 Array Setting
    for (var i = 0; i < resolutionArray.length; i++) {
      h265AvalidableArray[i] = new Array(h265MaxFrameRate);
      for (var j = 0; j < h265MaxFrameRate; j++) {
        h265AvalidableArray[i][j] = {
          resolution: resolutionArray[i],
          frameRate: (j + 1),
          available: true
        };
        if (h265AvalidableArray[i][j].resolution === resolutionArray[12] && h265AvalidableArray[i][j].frameRate > 10) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[13] && h265AvalidableArray[i][j].frameRate > 10) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[14] && h265AvalidableArray[i][j].frameRate > 4) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[15] && h265AvalidableArray[i][j].frameRate > 2) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[16] && h265AvalidableArray[i][j].frameRate > 0) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[17] && h265AvalidableArray[i][j].frameRate > 0) {
          h265AvalidableArray[i][j].available = false;
        } else if (h265AvalidableArray[i][j].resolution === resolutionArray[18] && h265AvalidableArray[i][j].frameRate > 0) {
          h265AvalidableArray[i][j].available = false;
        }
      }
    }

    var h264AvalidableCheck = function(profile) {
      for (var i = 0; i < h264AvalidableArray.length; i++) {
        if (h264AvalidableArray[i][0].resolution === profile.Resolution) {
          for (var j = 0; j < h264MaxFrameRate; j++) {
            if (h264AvalidableArray[i][j].frameRate === profile.FrameRate) {
              return h264AvalidableArray[i][j].available;
            }
          }
        }
      }

      return null;
    };

    var h265AvalidableCheck = function(profile) {
      for (var i = 0; i < h265AvalidableArray.length; i++) {
        if (h265AvalidableArray[i][0].resolution === profile.Resolution) {
          for (var j = 0; j < h265MaxFrameRate; j++) {
            if (h265AvalidableArray[i][j].frameRate === profile.FrameRate) {
              return h265AvalidableArray[i][j].available;
            }
          }
        }
      }

      return null;
    };

    var mjpegAvalidableCheck = function(profile) {
      for (var i = 0; i < mjpegAvalidableArray.length; i++) {
        if (mjpegAvalidableArray[i][0].resolution === profile.Resolution) {
          for (var j = 0; j < mjpegMaxFrameRate; j++) {
            if (mjpegAvalidableArray[i][j].frameRate === profile.FrameRate) {
              return mjpegAvalidableArray[i][j].available;
            }
          }
        }
      }

      return null;
    };

    var h264AvalidableSizeCheck = function(profile) {
      var resolution = profile.Resolution.split('x');
      var size = resolution[0] * resolution[1];

      for (var i = 0; i < h264AvalidableArray.length; i++) {
        var tresolution = h264AvalidableArray[i][0].resolution.split('x');
        var tSize = tresolution[0] * tresolution[1];
        if (tSize > size) {
          for (var j = 0; j < h264MaxFrameRate; j++) {
            if (h264AvalidableArray[i][j].frameRate === profile.FrameRate) {
              return h264AvalidableArray[i][j].available;
            }
          }
        }
      }
    };

    var h265AvalidableSizeCheck = function(profile) {
      var resolution = profile.Resolution.split('x');
      var size = resolution[0] * resolution[1];

      for (var i = 0; i < h265AvalidableArray.length; i++) {
        var tresolution = h265AvalidableArray[i][0].resolution.split('x');
        var tSize = tresolution[0] * tresolution[1];
        if (tSize > size) {
          for (var j = 0; j < h265MaxFrameRate; j++) {
            if (h265AvalidableArray[i][j].frameRate === profile.FrameRate) {
              return h265AvalidableArray[i][j].available;
            }
          }
        }
      }
    };

    var mjpegAvalidableSizeCheck = function(profile) {
      var resolution = profile.Resolution.split('x');
      var size = resolution[0] * resolution[1];

      for (var i = 0; i < mjpegAvalidableArray.length; i++) {
        var tresolution = mjpegAvalidableArray[i][0].resolution.split('x');
        var tSize = tresolution[0] * tresolution[1];
        if (tSize > size) {
          for (var j = 0; j < mjpegMaxFrameRate; j++) {
            if (mjpegAvalidableArray[i][j].frameRate === profile.FrameRate) {
              return mjpegAvalidableArray[i][j].available;
            }
          }
        }
      }
    };

    var availableCheck = function(profile) {
      var available = false;

      if (profile === undefined)
        return available;

      if (profile.EncodingType === "H264") {
        available = h264AvalidableCheck(profile);
      } else if (profile.EncodingType === "H265") {
        available = h265AvalidableCheck(profile);
      } else if (profile.EncodingType === "MJPEG") {
        available = mjpegAvalidableCheck(profile);
      }

      if (available === null) {
        if (profile.EncodingType === "H264") {
          available = h264AvalidableSizeCheck(profile);
        } else if (profile.EncodingType === "H265") {
          available = h265AvalidableSizeCheck(profile);
        } else if (profile.EncodingType === "MJPEG") {
          available = mjpegAvalidableSizeCheck(profile);
        }
      }

      //for setup profile
      if (profile.FrameRate === undefined || profile.Resolution === undefined) {
        available = true;
      }

      console.log("availableCheck -> " +
        "profile.EncodingType = " + profile.EncodingType +
        ", profile.FrameRate = " + profile.FrameRate +
        ", profile.Resolution = " + profile.Resolution +
        ", available = " + available);

      return available;
    };

    return {
      availableCheck: availableCheck,
    };
  }
]);