kindFramework
  .service('MJPEGPollingControlService', ['$rootScope', '$timeout', '$interval', 'UniversialManagerService', 'kindStreamInterface', 'RESTCLIENT_CONFIG', 'Attributes',
    function($rootScope, $timeout, $interval, UniversialManagerService, kindStreamInterface, RESTCLIENT_CONFIG, Attributes) {
      var sunapiAttributes = Attributes.get(); //--> not common.
      var MJPEGIntervalPromise = null;
      var checkElementSize = false;
      var MJPEG_SUNAPI_URL = null;
      var captureFlag = false;

      this.startMJPEGStreaming = function(_channelPlayerElement) {
        console.log("MJPEG Streaming Started");
        var _sequencenum = 0;
        var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
        checkElementSize = false;

        MJPEGIntervalPromise = $interval(function() {
          MJPEG_SUNAPI_URL = getMJPEGPollingURL(_sequencenum);
          var channelId = UniversialManagerService.getChannelId();
          var rotate = UniversialManagerService.getRotate(channelId),
            rotateCheck = false;
          if (rotate === "90" || rotate === "270") {
            rotateCheck = true;
          }

          _channelPlayerElement[0].getElementsByTagName('img')[0].src = MJPEG_SUNAPI_URL;
          _channelPlayerElement[0].getElementsByTagName('img')[0].width = parseInt(resolution[rotateCheck ? 1 : 0], 10);
          _channelPlayerElement[0].getElementsByTagName('img')[0].height = parseInt(resolution[rotateCheck ? 0 : 1], 10);
          _channelPlayerElement[0].getElementsByTagName('img')[0].onload = function() {
            setElementSize();

            if (captureFlag == true) {
              captureFlag = false;
              var canvas = document.createElement('canvas');
              var context = canvas.getContext('2d');
              canvas.width = this.naturalWidth;
              canvas.height = this.naturalHeight;
              context.drawImage(this, 0, 0);
              doCapture(canvas.toDataURL(), MakeFileName());
            }
          };
          _sequencenum++;

          if (_sequencenum > 100000) {
            _sequencenum = 0;
          }
        }, 1000);
        $rootScope.$emit('changeLoadingBar', false);
      };

      function setElementSize() {
        if (!checkElementSize) {
          $rootScope.$emit('BaseChannel:resetViewMode');
          kindStreamInterface.setCanvasStyle('originalratio');
          checkElementSize = true;
        }
      }

      function getMJPEGPollingURL(_sequencenum) {
        var channelId = UniversialManagerService.getChannelId();
        var restClientConfig = RESTCLIENT_CONFIG.digest;
        var server = restClientConfig.protocol + '://' + restClientConfig.hostName;
        if (typeof restClientConfig.port !== 'undefined' && restClientConfig.port !== null && restClientConfig.port !== '') {
          server += ':' + restClientConfig.port;
        }
        return server + '/stw-cgi/video.cgi?msubmenu=snapshot&action=view&Profile=1&Channel=' + channelId + '&SunapiSeqId=' + _sequencenum;
      }

      function leadingZeros(n, digits) {
        var zero = '';
        n = n.toString();
        if (n.length < digits) {
          for (var i = 0; i < digits - n.length; i++)
            zero += '0';
        }
        return zero + n;
      }

      function MakeFileName() {
        var date = new Date();
        var defaultFilename = sunapiAttributes.ModelName + "_" +
          leadingZeros(date.getFullYear(), 4) +
          leadingZeros(date.getMonth() + 1, 2) +
          leadingZeros(date.getDate(), 2) +
          leadingZeros(date.getHours(), 2) +
          leadingZeros(date.getMinutes(), 2) +
          leadingZeros(date.getSeconds(), 2);

        return defaultFilename;
      }

      this.capture = function() {
        captureFlag = true;
      }

      this.stopStreaming = function(_channelPlayerElement) {
        if (_channelPlayerElement.find('image').length !== 0) {
          console.log("MJPEG Streaming Stopped");
          $interval.cancel(MJPEGIntervalPromise);
        }
      };
    }
  ]);