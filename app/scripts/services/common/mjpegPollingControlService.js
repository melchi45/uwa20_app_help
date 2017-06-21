/* global doCapture */

kindFramework.service('MJPEGPollingControlService', ['$rootScope', '$timeout', '$interval',
  'UniversialManagerService', 'kindStreamInterface', 'RESTCLIENT_CONFIG', 'Attributes',
  function ($rootScope, $timeout, $interval, UniversialManagerService,
    kindStreamInterface, RESTCLIENT_CONFIG, Attributes) {
    var sunapiAttributes = Attributes.get(); //--> not common.
    var MJPEGIntervalPromise = null;
    var checkElementSize = false;
    var MJPEG_SUNAPI_URL = null;
    var captureFlag = false;
    var milisecond = 1000;

    this.startMJPEGStreaming = function (_channelPlayerElement) {
      console.log("MJPEG Streaming Started");
      var _sequencenum = 0;
      var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
      checkElementSize = false;

      MJPEGIntervalPromise = $interval(function () {
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
        _channelPlayerElement[0].getElementsByTagName('img')[0].onload = function () {
          setElementSize();

          if (captureFlag === true) {
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

        var ten = 10;
        if (_sequencenum > milisecond * ten) {
          _sequencenum = 0;
        }
      }, milisecond);
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

    function leadingZeros(date, digits) {
      var zero = '';
      var dateT = date.toString();
      if (dateT.length < digits) {
        for (var i = 0; i < digits - dateT.length; i++) {
          zero += '0';
        }
      }
      return zero + dateT;
    }

    function MakeFileName() {
      var yearScope = 4;
      var dateScope = 2;
      var date = new Date();
      var defaultFilename = sunapiAttributes.ModelName + "_" +
        leadingZeros(date.getFullYear(), yearScope) +
        leadingZeros(date.getMonth() + 1, dateScope) +
        leadingZeros(date.getDate(), dateScope) +
        leadingZeros(date.getHours(), dateScope) +
        leadingZeros(date.getMinutes(), dateScope) +
        leadingZeros(date.getSeconds(), dateScope);

      return defaultFilename;
    }

    this.capture = function () {
      captureFlag = true;
    }

    this.stopStreaming = function (_channelPlayerElement) {
      if (_channelPlayerElement.find('image').length !== 0) {
        console.log("MJPEG Streaming Stopped");
        $interval.cancel(MJPEGIntervalPromise);
      }
    };
  }
]);