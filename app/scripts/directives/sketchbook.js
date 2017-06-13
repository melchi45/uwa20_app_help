/* global SketchManager, setInterval, clearInterval, getClientIP */
kindFramework
  .directive('sketchbook', ['$rootScope', '$location', 'sketchbookService', 'SessionOfUserManager', 'ConnectionSettingService', 'kindStreamInterface', 'SunapiClient', 'PTZ_TYPE', 'PTZContorlService', 'DigitalPTZContorlService', 'Attributes', 'RESTCLIENT_CONFIG', '$timeout', 'UniversialManagerService',
    function($rootScope, $location, sketchbookService, SessionOfUserManager, ConnectionSettingService, kindStreamInterface, SunapiClient, PTZ_TYPE, PTZContorlService, DigitalPTZContorlService, Attributes, RESTCLIENT_CONFIG, $timeout, UniversialManagerService) {
      'use strict';
      return {
        restrict: 'E',
        replace: true,
        scope: {
          videoinfo: '=',
          sketchinfo: '=',
          coordinates: '=',
          modalId: '=',
          flag: '=',
          ratio: '='
        },
        template: '<div id="sketchbook" style="cursor:default;">' +
          '<canvas class="draw-content" style="position:absolute;left:0px;z-index:1000"></canvas>' +
          '<canvas class="draw-content" style="position:absolute;left:0px;z-index:1000"></canvas>' +
          '<svg id="sketchbook_svg" style="position:absolute;left:0px;z-index:999" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>' +
          '<section id="setup-border-box"></section>' +
          '<kind_stream class="channel-content" kindplayer="playerdata" ng-show="isReady"></kind_stream>' +
          '</div>',
        controller: ["$scope", "$element", "$uibModal", function($scope, $element, $uibModal) {
          var fCanvas = $element.find("canvas")[1];
          var bCanvas = $element.find("canvas")[0];
          var svgTag = $element.find("#sketchbook_svg")[0];
          var cropRatio = $scope.ratio;
          $scope.isReady = false;

          sketchbookService.sketchManager = new SketchManager(fCanvas, bCanvas, $uibModal, svgTag, cropRatio);
        }],
        link: function(scope, elem, attrs) {
          var mAttr = Attributes.get();
          var profileInfo = {};
          var currentChannel = UniversialManagerService.getChannelId(); //Default 0 CH
          var timeCallback = function() {};
          var closeCallback = function() {};

          var reconnectionInterval = null;
          var xmlHttp = new XMLHttpRequest();
          var retryStatus = true;

          var getPlayerData = function() {
            if (mAttr.MaxChannel > 1) {
              profileInfo.ChannelId = currentChannel;
              ConnectionSettingService.setMultiChannelSupport(true);
            } else {
              profileInfo.ChannelId = null;
            }
            return ConnectionSettingService.getPlayerData('live', profileInfo, timeCallback, errorCallback, closeCallback);
          };

          var errorCallback = function(error) {
            console.log("errorcode:", error.errorCode, "error string:", error.description, "error place:", error.place);
            if (error.errorCode === "200") {
              clearInterval(reconnectionInterval);
            } else if (error.errorCode === "999") {
              reconnectionInterval = setInterval(function() {
                if (RESTCLIENT_CONFIG.serverType === 'grunt') {
                  var data = getPlayerData();
                  kindStreamInterface.changeStreamInfo(data);
                } else {
                  if (retryStatus) {
                    try {
                      retryStatus = false;
                      xmlHttp.open("POST", "../home/pw_check.cgi", true); // false for synchronous request
                      xmlHttp.send(null);
                    } catch (e) {

                    }
                  }
                }

              }, 5000);
            } else if (error.errorCode === "404") {
              SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', {
                  Channel: currentChannel
                },
                function(response) {
                  var profileList = response.data.VideoProfiles[0].Profiles;
                  profileInfo = profileList[0];

                  for (var i = 0; i < profileList.length; i++) {
                    if (profileList[i].Name === "MOBILE") {
                      profileInfo = profileList[i];
                      break;
                    }
                  }
                  scope.$apply(function() {
                    scope.playerdata = getPlayerData();
                  });
                },
                function(errorData) {
                  console.log(errorData);
                }, '', true);
            }
          };

          xmlHttp.onreadystatechange = function() {
            if (this.readyState === 4) {
              retryStatus = true;
              if (this.status == 200) {
                if (xmlHttp.responseText == "OK") {
                  window.setTimeout(RefreshPage, 500);
                } else {
                  retryStatus = false;
                  return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', {},
                    function(response) {
                      var macIp = response.data.NetworkInterfaces[0].MACAddress;
                      if (macIp == RESTCLIENT_CONFIG.digest.macAddress) {
                        var data = getPlayerData();
                        kindStreamInterface.changeStreamInfo(data);
                      } else {
                        window.setTimeout(RefreshPage, 500);
                      }
                    },
                    function(errorData, errorCode) {
                      console.error(errorData);
                    }, '', true);
                }
              } else if (this.status == 401) {
                retryStatus = false;
                var unAuthHtml = "<html><head><title>401 - Unauthorized</title></head><body><h1>401 - Unauthorized</h1></body></html>";
                document.write(unAuthHtml);
              } else if (this.status == 490) {
                retryStatus = false;
                var blockHtml = "<html><head><title>Account Blocked</title></head><body><h1>You have exceeded the maximum number of login attempts, please try after some time.</h1></body></html>";
                document.write(blockHtml);
              } else {

              }
            }
          }

          function RefreshPage() {
            window.location.reload(true);
          }

          scope.$watch('videoinfo', function(videoinfo) {
            if (typeof videoinfo !== "undefined") {
              videoinfo.height = sketchbookService.getConvertedVideoHeight(
                videoinfo.maxWidth,
                videoinfo.maxHeight
              );

              if (videoinfo.rotate === "90" || videoinfo.rotate === "270") {
                var temp = videoinfo.width;
                videoinfo.width = videoinfo.height;
                videoinfo.height = temp;
                temp = videoinfo.maxWidth;
                videoinfo.maxWidth = videoinfo.maxHeight;
                videoinfo.maxHeight = temp;
              }

              if (videoinfo.channelId !== undefined) {
                currentChannel = videoinfo.channelId;
              }

              changeVideoInfo();

              var canvasElem = document.getElementsByTagName("canvas");
              if (videoinfo.support_ptz) {
                if (videoinfo.support_ptz === 'PTZ') {
                  PTZContorlService.deleteElementEvent(canvasElem[2]);
                  PTZContorlService.setMode(PTZ_TYPE.ptzCommand.PTZ);
                  PTZContorlService.setElementEvent(canvasElem[2]);
                } else if (videoinfo.support_ptz === 'Digital PTZ') {
                  DigitalPTZContorlService.deleteElementEvent(canvasElem[2]);
                  DigitalPTZContorlService.setElementEvent(canvasElem[2]);
                } else {
                  PTZContorlService.deleteElementEvent(canvasElem[2]);
                  DigitalPTZContorlService.deleteElementEvent(canvasElem[2]);
                }
              } else {
                PTZContorlService.deleteElementEvent(canvasElem[2]);
                DigitalPTZContorlService.deleteElementEvent(canvasElem[2]);
              }

              profileInfo.Name = 'profile13';
              if (videoinfo.support_ptz) {
                if (videoinfo.support_ptz === 'Digital PTZ') {
                  profileInfo.Name = 'profile12';
                } else {
                  //if (getBrowserDetect().isIE) {
                  profileInfo.Name = 'profile13';
                  //} else {
                  //    profileInfo.Name = 'profile14';
                  //}
                }

              }

              if (SessionOfUserManager.isLoggedin()) {
                var id = SessionOfUserManager.getUsername();
                var password = SessionOfUserManager.getPassword();
                getClientIP();

                ConnectionSettingService.setConnectionInfo({
                  id: id,
                  password: password
                });

                //scope.playerdata = ConnectionSettingService.closeStream();
                if (typeof videoinfo.currentPage !== "undefined") {
                  kindStreamInterface.setIspreview(true, videoinfo.currentPage);
                } else {
                  kindStreamInterface.setIspreview(true, null);
                }

                window.setTimeout(function() {
                  scope.$apply(function() {
                    if (RESTCLIENT_CONFIG.digest.rtspIp === "" || RESTCLIENT_CONFIG.digest.rtspIp === null) {
                      getRtspIpMac().then(
                        function() {
                          scope.playerdata = getPlayerData();
                          scope.isReady = true;
                        },
                        function(errorData) {
                          console.log(errorData);
                        }
                      );
                    } else {
                      scope.playerdata = getPlayerData();
                      scope.isReady = true;
                    }
                  });
                }, 1000);
              }
            }
          });

          function getRtspIpMac() {
            return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', {},
              function(response) {
                var rtspIp = response.data.NetworkInterfaces[0].IPv4Address;
                var macIp = response.data.NetworkInterfaces[0].MACAddress;
                ConnectionSettingService.setRtspIpMac(rtspIp, macIp);
              },
              function(errorData) {
                console.error(errorData);
              }, '', true);
          }

          scope.$watch('sketchinfo', function(sketchinfo) {
            if (typeof sketchinfo === "undefined") {
              console.log("sketchinfo is required");
              return;
            }
            if (typeof scope.videoinfo === "undefined") {
              console.log("videoinfo is required");
              return;
            }
            /*
            if(typeof scope.coordinates === "undefined"){
                console.log("coordinates is required");
                return;
            }
            */

            //sketchbookService.sketchManager.init(sketchinfo, scope.videoinfo, updateCoordinates, privacyUpdate, autoTrackingUpdate);
            sketchbookService.sketchManager.init(sketchinfo, scope.videoinfo, updateCoordinates, privacyUpdate, getZoomValue, autoTrackingUpdate);
            
            if (!(typeof scope.coordinates === "undefined" || scope.coordinates === null || scope.coordinates === {})) {
              sketchbookService.set(scope.coordinates, scope.flag);
            }

            /*
            초기에 Canvas, SVG의 사이즈를 반응형에 맞게 세팅
            */
            if(sketchinfo.workType !== "ptLimit"){
              changePreviewSize();
              $(window).bind('resize', resizeHandleForPreviewSize);
            }
          });

          $rootScope.$saveOn('channelSelector:changedChannel', function(event, index) {
            scope.playerdata.media.requestInfo.cmd = 'close';
            currentChannel = index;
            console.log("streamPlayer:: ", index);
            UniversialManagerService.setChannelId(index);
            $timeout(function() {
              scope.playerdata = getPlayerData();
            });
          }, scope);

          function updateCoordinates(data) {
            scope.$emit('<app/scripts/directives>::<updateCoordinates>', data);
          }

          function privacyUpdate(data) {
            scope.$emit('<app/scripts/directives>::<privacyUpdate>', data);
          }

          function getZoomValue(data) {
            scope.$emit('<app/scripts/directives>::<getZoomValue>', data);
          }

          function autoTrackingUpdate(data) {
            scope.$emit('<app/scripts/directives>::<autoTrackingUpdate>', data);
          }

          function getClientIP() {
            if (SessionOfUserManager.getClientIPAddress() === '127.0.0.1') {
              SunapiClient.get(
                '/stw-cgi/system.cgi?msubmenu=getclientip&action=view', {},
                function(response) {
                  SessionOfUserManager.setClientIPAddress(response.data.ClientIP);
                },
                function(errorData) {
                  console.error(errorData);
                }, '', true);
            }
          }

          function setDISOption() {
            if (mAttr.DIS) {
              SunapiClient.get(
                '/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', {
                  Channel: currentChannel
                },
                function(response) {
                  sketchbookService.sketchManager.DISMode = response.data.ImageEnhancements[0].DISEnable;
                },
                function(errorData) {
                  console.error(errorData);
                }, '', true);
            }
          }

          setDISOption();

          //Flexable sketchbook
          function changeVideoInfo(){
            var width = scope.videoinfo.width;
            var height = scope.videoinfo.height;

            elem.css({
              "width": width,
              "height": height,
              "background": "#f2f2f2"
            });

            elem.find(".kind-stream-canvas").css({
              "width": "100%",
              "height": "100%",
            });

            elem.find("div").css({
              "position": "relative",
              "width": width,
              "height": height,
              "overflow": "inherit"
            });

            elem.find("#sketchbook_svg")[0].setAttributeNS(null, 'width', width);
            elem.find("#sketchbook_svg")[0].setAttributeNS(null, 'height', height);
            elem.find("#sketchbook_svg")[0].setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height);
          }

          var previewResizeTimer = null;
          var previewRefreshTime = 100;

          function changePreviewSize(){
            var width = elem.width();
            var height = width * scope.videoinfo.height / scope.videoinfo.width;
            var svg = elem.find("#sketchbook_svg")[0];
            // console.log(width, height);
            //IVA / Common의 alignCenter를 위해 넣어야 함 width, height 변경
            svg.setAttributeNS(null, 'width', width);
            svg.setAttributeNS(null, 'height', height);
            
            svg.setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height);
            sketchbookService.sketchManager.changeVideoInfo(width, height);
          }

          function resizeHandleForPreviewSize(){
            if(previewResizeTimer !== null){
              clearTimeout(previewResizeTimer);
            }

            previewResizeTimer = setTimeout(changePreviewSize, previewRefreshTime);
          }
          
          scope.$on('$destroy', function(){
            if(previewResizeTimer !== null){
              clearTimeout(previewResizeTimer);
            }

            $(window).unbind('resize', resizeHandleForPreviewSize);
          });
        }
      };
    }
  ]);