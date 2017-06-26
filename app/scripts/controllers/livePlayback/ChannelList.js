kindFramework.controller('ChannelListCtrl', function($scope, $timeout, $rootScope, $state,
  kindStreamInterface, Attributes, SunapiClient, ConnectionSettingService, 
  UniversialManagerService, CAMERA_STATUS, BrowserService, RESTCLIENT_CONFIG, PluginModel) {
  "use strict";

  var channlistClass = 'channellist-video-wrapper';
  var count = 0;
  var requestId = null;
  var sunapiAttributes = Attributes.get()
  var videoMode = "canvas";
  var plugin = false;
  var userID = "";
  var ip = null;
  var port = null;
  var MultiDirectionProfile = {
    EncodingType: 'H264',
    Resolution: '800x600',
    FrameRate: 30,
    Name: 'profile14',
    ChannelId: 0,
    H264: {
      GOVLength: 60
    }
  };
  var reconnectionTimeout = null;
  var xmlHttp = new XMLHttpRequest();
  var reconnectCheck = false;

  window.addEventListener('resize', resizeHandle);

  $scope.$on("$viewContentLoaded", function() {
    if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE ||
      BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.SAFARI) {
      plugin = true;
    }

    SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', '',
      function(response) {
        UniversialManagerService.setRotate();
        var section = $('#channellist-containner');
        for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
          var figure = document.createElement('figure');
          var div = document.createElement('div');
          if (response.data.Flip[i].Rotate === "0" || response.data.Flip[i].Rotate === "180") {
            $(div).addClass('channellist-video-wrapper ratio-4-3');
          } else {
            $(div).addClass('channellist-video-wrapper ratio-3-4');
          }
          if (plugin === false) {
            var videoElement = document.createElement(videoMode);
            $(videoElement).attr('id', "live" + videoMode + i);
            $(videoElement).attr('kind-channel-id', i);
            $(section).append($(figure).append($(div).append(videoElement)));
          } else {
            var object = '';
            if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE) {
              object = '<object classid="clsid:'+ PluginModel.ActiveX.ObjectID +'" width="100%" height="100%" name="channel' + i + '" id="channel' + i + '"></object>';
            } else {
              object = '<object type="' + PluginModel.NPAPI.ObjectID + '" width="100%" height="100%" name="channel' + i + '" id="channel' + i + '"></object>';
            }
            div.innerHTML = object;
            $(section).append($(figure).append($(div)));
          }
        }
        startVideoStreaming();
        setTimeout(changeCanvas);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);


  });

  $scope.$on("$destroy", function() {
    window.removeEventListener('resize', resizeHandle);
    var closeData = ConnectionSettingService.closeStream();

    for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
      if (plugin === false) {
        closeData.device.channelId = i;
        kindStreamInterface.changeStreamInfo(closeData);
      } else {
        var obejct = $('#channel' + i)[0];
        obejct.CloseStream();
      }
    }
  });

  function resizeHandle() {
    var renderCallBack = function() {
      count++;
      changeCanvas();
      var maxCount = 5;
      if (count >= maxCount) {
        window.cancelAnimationFrame(requestId);
        count = 0;
        requestId = null;
      } else {
        requestId = window.requestAnimationFrame(renderCallBack);
      }
    };

    count = 0;

    if (requestId !== null) {
      window.cancelAnimationFrame(requestId);
    }

    requestId = window.requestAnimationFrame(renderCallBack);
  }

  var playVideo = function(channelId) {
    MultiDirectionProfile.ChannelId = channelId;
    var playerData = ConnectionSettingService.getPlayerData('live',
      MultiDirectionProfile, timeCallback, errorCallback, closeCallback, videoMode);
    playerData.device.channelId = channelId;
    playerData.media.checkDelay = false;
    userID = playerData.device.user;
    if (plugin === false) {
      kindStreamInterface.init(playerData, SunapiClient);
      kindStreamInterface.changeStreamInfo(playerData);
    } else {
      var obejct = $('#channel' + channelId)[0];
      obejct.SetWMDInitialize(channelId, channelId + 1, "PluginJSONEvent");
      obejct.SetUserFps(Number(MultiDirectionProfile.FrameRate));
      var playLiveStreamIndex = 13;
      obejct.PlayLiveStream(ip, port, playLiveStreamIndex, userID, '', '');
    }
  }

  var startVideoStreaming = function() {
    reconnectCheck = false;
    ip = RESTCLIENT_CONFIG.digest.rtspIp;
    port = RESTCLIENT_CONFIG.digest.rtspPort;
    for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
      playVideo(i);
    }
  };

  function reconnect() {
    if (reconnectionTimeout !== null) {
      $timeout.cancel(reconnectionTimeout);
    }

    var time = 500;
    reconnectionTimeout = $timeout(function() {
      var getData = null;
      if (RESTCLIENT_CONFIG.serverType === 'grunt') {
        SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
          function(response) {
            startVideoStreaming();
          },
          function(errorData) {
            reconnect();
          });
      } else {
        try {
          xmlHttp.open("POST", "../home/pw_check.cgi", true); // false for synchronous request
          xmlHttp.send(null);
        } catch (err) {
          reconnect();
        }
      }
    }, time);
  }

  function changeCanvas() {
    var wrapElems = document.querySelectorAll('.' + channlistClass);
    var getRatio = function(classList) {
      var ratio = [];
      var ratioIndex = {
        first: 1,
        second: 2,
      };
      for (var i = 0, ii = classList.length; i < ii; i++) {
        var self = classList[i];
        if (self.indexOf('ratio-') !== -1) {
          ratio.push(self.split('-')[ratioIndex.first]);
          ratio.push(self.split('-')[ratioIndex.second]);
          break;
        }
      }

      return ratio;
    };

    for (var i = 0, ii = wrapElems.length; i < ii; i++) {
      var self = wrapElems[i];
      var parentNode = self.parentNode;
      var ratio = [];
      var maxWidth = 'none';
      var maxHeight = 'none';

      var heightCalc = 3;
      if (self.clientHeight >= parentNode.clientHeight - heightCalc) {
        ratio = getRatio(self.classList);

        maxWidth = (parentNode.clientHeight / ratio[1] * ratio[0]) + 'px';
        maxHeight = '100%';
      }

      if (self.style.maxWidth !== maxWidth) {
        self.style.maxWidth = maxWidth;
      }

      if (self.style.maxHeight !== maxHeight) {
        self.style.maxHeight = maxHeight;
      }
    }
  }

  $rootScope.$saveOn("channelSelector:selectChannel", function(event, index) {
    UniversialManagerService.setChannelId(index);
    $state.go('uni.channel');
  }, $scope);

  function timeCallback(err) {
    console.log("timeCallback msg =", err);
  }

  function errorCallback(err) {
    console.log("errorCallback msg =", err);
    if (err.errorCode === "999" && reconnectCheck === false) {
      reconnectCheck = true;
      console.log("Disconnect channelId = " + err.channelId);
      reconnect();
    }
  }

  function closeCallback(err) {
    console.log("closeCallback msg =", err);
  }

  function _PluginJSONEvent(ch, evId, sdata) {
    console.log("WebWMDCamEvent ch, evId, sdata => ", ch, evId, sdata);
    var jsonData = null;

    try {
      jsonData = JSON.parse(sdata); //safari
    } catch (err) {
      jsonData = sdata; //ie
    }

    var time = 100;
    var err401 = 401;
    var err402 = 402;
    switch (evId) {
      case err401: //rtsp unauthorized(401)
        $timeout(function() {
          if (jsonData.type === 0) {
            rtspDigestAuth('live', (ch - 1));
          }
        }, time);
        break;
      case err402:
        var pluginElement = $('#channel' + (ch - 1))[0];
        pluginElement.CloseStream();

        if (reconnectCheck === false) {
          reconnectCheck = true;
          reconnect();
        }
        break;

    }
  }

  function RefreshPage() {
    window.location.reload(true);
  }

  var readyCheck = {
    readyState: 4,
    status: 200,
    time: 500,
    status401: 401,
    status490: 490,
  };

  xmlHttp.onreadystatechange = function() {
    if (this.readyState === readyCheck.readyState) {
      if (this.status === readyCheck.status) {
        if (xmlHttp.responseText === "OK") {
          window.setTimeout(RefreshPage, readyCheck.time);
        } else {
          startVideoStreaming();
        }
      } else if (this.status === readyCheck.status401) {
        var unAuthHtml = "<html><head><title>401 - Unauthorized</title></head><body><h1>401 - Unauthorized</h1></body></html>";
        document.write(unAuthHtml);
      } else if (this.status === readyCheck.status490) {
        var blockHtml = "<html><head><title>Account Blocked</title></head><body><h1>You have exceeded the maximum number of login attempts, please try after some time.</h1></body></html>";
        document.write(blockHtml);
      } else {
        reconnect();
      }
    }
  }

  function rtspDigestAuth(mode, channelId) {
    var pluginElement = $('#channel' + channelId)[0];
    var ip = RESTCLIENT_CONFIG.digest.hostName;
    var port = RESTCLIENT_CONFIG.digest.rtspPort;
    var getData = {};
    getData.Method = 'OPTIONS';
    getData.Realm = pluginElement.GetRealm();
    getData.Nonce = pluginElement.GetNonce();

    getData.Uri = encodeURIComponent(pluginElement.GetRtspUrl());

    SunapiClient.get('/stw-cgi/security.cgi?msubmenu=digestauth&action=view', getData,
      function(response) {
        var responseValue = response.data.Response;
        // var fps = UniversialManagerService.getProfileInfo().FrameRate;
        pluginElement.SetWMDInitialize(channelId, channelId + 1, "PluginJSONEvent");
        var playLiveStreamIndex = 12;
        pluginElement.PlayLiveStream(ip, port, playLiveStreamIndex, userID, '', responseValue);
      },
      function(errorData, errorCode) {
        console.error(errorData);
      }, '', true);
  }

  window.PluginJSONEvent = function(ch, evId, sdata) {
    setTimeout(function() {
      _PluginJSONEvent(ch, evId, sdata);
    }, 0)
  }
});