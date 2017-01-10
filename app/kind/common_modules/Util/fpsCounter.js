function FpsCounter() {
var frameCount,
	framerate,
	statistics = {
	  videoStartTime: 0,
	  videoPictureCounter: 0,
	  windowStartTime: 0,
	  windowPictureCounter: 0,
	  fps: 0,
	  fpsMin: 1000,
	  fpsMax: -1000,
	  webGLTextureUploadTime: 0
	},
	info = "";

	function Constructor() {
		frameCount = 0;
	}

	function initStatistics() {
		frameCount = 0;
		statistics.videoStartTime = 0;
		statistics.videoPictureCounter = 0;
		statistics.windowStartTime = 0;
		statistics.windowPictureCounter = 0;
		statistics.fps = 0;
		statistics.fpsMin = 1000;
		statistics.fpsMax = -1000;
		statistics.webGLTextureUploadTime = 0;
	}

	Constructor.prototype = {
		setFrameRate: function(fps) {
			framerate = fps;
			initStatistics();
		},
		updateStatistics: function() {
			var s = statistics;
			s.videoPictureCounter += 1;
			s.windowPictureCounter += 1;
			var now = Date.now();
			if (!s.videoStartTime) {
			  s.videoStartTime = now;
			}
			var videoElapsedTime = now - s.videoStartTime;
			s.elapsed = videoElapsedTime / 1000;
			if (videoElapsedTime < 1000) {
			  return;
			}

			if (!s.windowStartTime) {
			  s.windowStartTime = now;
			  return;
			} else if ((now - s.windowStartTime) > 1000) {
			  var windowElapsedTime = now - s.windowStartTime;
			  var fps = (s.windowPictureCounter / windowElapsedTime) * 1000;
			  s.windowStartTime = now;
			  s.windowPictureCounter = 0;

			  if (fps < s.fpsMin) s.fpsMin = fps;
			  if (fps > s.fpsMax) s.fpsMax = fps;
			  s.fps = fps;
			}

			var fps = (s.videoPictureCounter / videoElapsedTime) * 1000;
			s.fpsSinceStart = fps;
			if (statistics.videoPictureCounter % 10 != 0) {
				return;
			}
			info = "fps: "+ statistics.fps.toFixed(2) + "  avg: "+ statistics.fpsSinceStart.toFixed(2);
			if (frameCount > 10) {
				var avgFps = statistics.fpsSinceStart.toFixed(2);
				var curFps = statistics.fps.toFixed(2);
				var error = false;  //for log
				if ((framerate / 2) > avgFps && (framerate / 2) > curFps) {
					error = true;
				}

				if (error) {
					// console.log("updateStatistics : " + info + " profileFps : " + framerate + " error : " + error);
					// errorCallback({
					// 	errorCode: "997",
					// 	description: "Not enough decoding for currnet profile, Change UWA profile",
					// 	place: "kind_video_decoder.js"
					// });
				}

			} else {
				frameCount++;
			}
		},
		getInfo: function() {
			return info;
		}		
	};

	return new Constructor();
};