"use strict";
var kindStreamModule = angular.module('kindStreamModule', []);

kindStreamModule.directive('kindStream', [
	'kindStreamInterface', 'UniversialManagerService', 'SunapiClient', '$compile',
	function(kindStreamInterface, UniversialManagerService, SunapiClient, $compile) {
		return {
			restrict: 'E',
			scope: {
				kindplayer: '='
			},
			template: '<div id="container" style="cursor:default;">' +
									'<canvas id="livecanvas" class="kind-stream-canvas"></canvas>' +
									'<div id="video-container" class="kind-stream-canvas video-display-none">' +
										'<video id="livevideo"></video>' +
									'</div>' +
								'</div>',
			link: function(scope, elem, attrs) {
				var streamCanvas = elem.find('canvas#livecanvas');
				kindStreamInterface.setStreamCanvas(streamCanvas);
				kindStreamInterface.setResizeEvent();
				UniversialManagerService.setVideoMode("canvas");

				var parentScope = scope.$parent;
				parentScope.child = scope;

				scope.$on('$destroy', function(event) {
					if (isPhone)
						return;

					console.log("kind_stream directive destroy called");
					var tmpKindPlayer = scope.kindplayer;
					if (scope.kindplayer !== undefined) {
						tmpKindPlayer.media.requestInfo.cmd = 'close';
					}

					kindStreamInterface.setIspreview(false);
					kindStreamInterface.changeStreamInfo(tmpKindPlayer);
					kindStreamInterface.destroyPlayer();
					watchKindPlayer();
				});

				var watchKindPlayer = scope.$watch('kindplayer', function(newValue, oldValue) {
					if (newValue === undefined || newValue === null || isPhone)
						return;

					elem.find('canvas').attr('kind-channel-id', newValue.device.channelId);
					elem.find('video').attr('kind-channel-id', newValue.device.channelId);
					kindStreamInterface.init(newValue, SunapiClient);

					if (newValue.media.requestInfo.cmd == 'init' ||
						newValue.media.requestInfo.cmd === undefined) {
						return;
					}

					var chId = newValue.device.channelId;
					var pbData = {
						on: 'off',
						channelId: chId,
						control: 'init',
						scale: 1
					};
					if (newValue.media.type === 'live') {
						scope.$emit('playback_directive_switch[' + chId + ']', pbData);
						console.log('live mode');
					} else {
						pbData.on = 'on';
						scope.$emit('playback_directive_switch[' + chId + ']', pbData);
						console.log('playback mode');
					}
					var value = angular.copy(newValue);
					kindStreamInterface.changeStreamInfo(value);
					if (!UniversialManagerService.getLiveStreamStatus() && !kindStreamInterface.getIspreview()) {
						kindStreamInterface.setCanvasStyle('originalratio');
						UniversialManagerService.setLiveStreamStatus(true);
					}

					if (newValue.media.requestInfo.cmd === 'forward' ||
							newValue.media.requestInfo.cmd === 'backward') {
						newValue.media.requestInfo.cmd = "init";
					}
				}, true);
			}
		};
	}
]);