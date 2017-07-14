/* global SketchManager, setInterval, clearInterval */
/**
 * 영상과 영역 설정 도구 사용을 위한 컴포넌트
 * 
 * @class sketchbook
 * @example
<caption>Resouces</caption>
<link href="base/kind/rich_components/svg_drawing/plugins/kind_svg_editor_plugin_draw.css" rel="stylesheet">

<script src="scripts/directives/sketchbook.js"></script>
<script src="scripts/services/common/sketchbookService.js"></script>
<script src="scripts/utils/sketchManager.js"></script> 

<script src="base/kind/rich_components/svg_drawing/modules/kind_svg_editor_factory.js"></script>
<script src="base/kind/rich_components/svg_drawing/modules/kind_svg_editor.js"></script>
<script src="base/kind/rich_components/svg_drawing/plugins/kind_svg_editor_plugin_draw.js"></script>
<script src="base/kind/rich_components/svg_drawing/plugins/kind_svg_editor_plugin_customeditor.js"></script>
 * @example
<caption>HTML</caption>
<sketchbook 
  coordinates="coordinates" 
  flag="flag" 
  sketchinfo="sketchinfo" 
  videoinfo="videoinfo">
</sketchbook>
 * @example
<caption>Javascript</caption>
var getData = {
  Channel: UniversialManagerService.getChannelId()
};
SunapiClient.get(
  '/stw-cgi/image.cgi?msubmenu=flip&action=view', 
  getData,
  function(response) {
    var viewerWidth = 640;
    var viewerHeight = 360;
    var maxWidth = mAttr.MaxROICoordinateX;
    var maxHeight = mAttr.MaxROICoordinateY;
    var rotate = response.data.Flip[0].Rotate;
    var flip = response.data.Flip[0].VerticalFlipEnable;
    var mirror = response.data.Flip[0].HorizontalFlipEnable;
    var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

    $scope.videoinfo = {
      width: viewerWidth,
      height: viewerHeight,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      flip: flip,
      mirror: mirror,
      support_ptz: false,
      rotate: rotate,
      adjust: adjust,
      channelId: UniversialManagerService.getChannelId()
    };

    $scope.coordinates = [];
    $scope.sketchinfo = {
      workType: "smartCodec",
      shape: 0,
      maxNumber: 1,
      modalId: null
    };
  }
);
 */

kindFramework.
  directive('sketchbook', ['$rootScope', '$location', 'sketchbookService', 'SessionOfUserManager', 'ConnectionSettingService', 'kindStreamInterface', 'SunapiClient', 'PTZ_TYPE', 'PTZContorlService', 'DigitalPTZContorlService', 'Attributes', 'RESTCLIENT_CONFIG', '$timeout', 'UniversialManagerService',
    function($rootScope, $location, sketchbookService, SessionOfUserManager, ConnectionSettingService, kindStreamInterface, SunapiClient, PTZ_TYPE, PTZContorlService, DigitalPTZContorlService, Attributes, RESTCLIENT_CONFIG, $timeout, UniversialManagerService) {
      'use strict';
      return {
        restrict: 'E',
        replace: true,
        scope: {
          /**
           * 영상의 프리뷰 사이즈, 최대 사이즈, Flip/Mirror, Rotate, Adjust 등 상태 정보
           * 
           * @memberof sketchbook
           * @name videoinfo
           * @property {Number} width 프리뷰 영상의 가로 사이즈
           * @property {Number} height 프리뷰 영상의 세로 사이즈
           * @property {Number} maxWidth 영상의 최대 가로 해상도
           * @property {Number} maxHeight 영상의 최대 세로 해상도
           * @property {Boolean} flip Flip 모드 활성화 여부
           * @property {Boolean} mirror Mirror 모드 활성화 여부
           * @property {String} rotate Rotate 각도, "0, 90, 270"
           * @property {Number} minCropResolution 최소 Crop 해상도
           * @property {Number} maxCropResolution 최대 Crop 해상도
           * @property {Number} channelId 채널 Index
           * @property {Number} currentPage META 데이터 전달을 위한 Page 정보
           * @property {String} support_ptz PTZ 지원 여부 "PTZ, Digital PTZ"
           * @property {Boolean} support_zoomOnly Zoom 지원 여부
           */
          videoinfo: '=',
          /**
           * 영역 설정 도구 종류 선택
           * 
           * @memberof sketchbook
           * @name sketchinfo
           * @property {String} workType [공통][필수] 영역 도구 종류, "commonArea, calibration, qmArea, mdArea, fdArea, smartCodec, vaEntering, vaAppearing, vaPassing, peoplecout, autoTracking, privacy, ptLimit, crop, simpleFocus"
           * @property {Number} maxNumber [공통][필수] 영역 최대 갯수
           * @property {Number} shape [Canvas] 0: Rectangle, 1: Polygon
           * @property {String} modalId Modal 경로 및 Modal 아이디
           * @property {String} useEvent [SVG] 사용자 이벤트를 사용할지 설정
           * @property {String} color ROI, Exclude Area 색상 구분 0: ROI 1: Exclude Area
           * @property {String} aspectRatio 고정비율로 확대/축소 될것인지 설정
           * @property {Array} ratio 비율설정, ratio[0]: 가로 비율 ratio[1]: 세로 비율
           * @property {Object} minSize [SVG] Polygon의 최소 사이즈, minSize.width: 가로 사이즈 minSize.height: 세로 사이즈 
           * @property {Object} maxSize [SVG] Polygon의 최대 사이즈, minSize.width: 가로 사이즈 minSize.height: 세로 사이즈
           * @property {Number} minSizePercentage [SVG] Polygon의 최소 사이즈 퍼센테이지로 정의
           * @property {Number} minLineLength [SVG] Line의 최소 사이즈
           * @property {String} wiseFDCircleHeightRatio [SVG][workType=fdArea] Wise Face Detection의 Circle 높이 비율
           * @property {String} wiseFDCircleFillColor [SVG][workType=fdArea] Wise Face Detection의 Circle 색상
           * @property {String} initCenter [SVG] 초기에 중앙으로 위치할 지 설정
           * @property {String} maxArrow [SVG] "L, R, LR" 순서 중 변경할 수 있는 최대 순서
           * @property {String} message [workType=privacy] Modal에 표시할 메시지
           * @property {String} MaxZoomValue [workType=privacy] 최대 줌 설정값
           * @property {String} disValue [workType=privacy] DIS 설정 여부
           * @property {Function} getZoomValue [workType=privacy] ptzconfig cgi를 통해서 Zoom을 가져오는 함수 대입
           * @property {Number} ptStatus [workType=ptLimit] PT Limit 상태
           * @property {String} guideText [workType=ptLimit] PT Limit 가이드 텍스트
           */
          sketchinfo: '=',
          /**
           * 영역 좌표 정보
           * 
           * @memberof sketchbook
           * @name coordinates
           * @type {Array}
           */
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

            var reconnectionTimeout = null;
            var xmlHttp = new XMLHttpRequest();

          var getPlayerData = function() {
            if (mAttr.MaxChannel > 1) {
              profileInfo.ChannelId = currentChannel;
              ConnectionSettingService.setMultiChannelSupport(true);
            } else {
              profileInfo.ChannelId = null;
            }
            return ConnectionSettingService.getPlayerData('live', profileInfo, timeCallback, errorCallback, closeCallback);
          };

          function reconnect(){
            if(reconnectionTimeout !== null)
            {
              $timeout.cancel(reconnectionTimeout);
            }

            reconnectionTimeout = $timeout(function(){
              if(RESTCLIENT_CONFIG.serverType === 'grunt'){
                var data = getPlayerData();
                kindStreamInterface.changeStreamInfo(data);
              }else{
                xmlHttp.open( "POST", "../home/pw_check.cgi", true); // false for synchronous request
                xmlHttp.send( null );
              }        
            },500);
          }
	    
          var errorCallback = function(error) {
            console.log("errorcode:", error.errorCode, "error string:", error.description, "error place:", error.place);
            if (error.errorCode === "200") {
              // 초기에 Canvas, SVG의 사이즈를 반응형에 맞게 세팅
              setTimeout(changePreviewSize);
            } else if (error.errorCode === "999") {
              reconnect();
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
              if (this.status === 200) {
                if (xmlHttp.responseText === "OK") {
                  window.setTimeout(RefreshPage, 500);
                } else {
                  try{
                    SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view',{},
                    function(response) {
                      var macIp = response.data.NetworkInterfaces[0].MACAddress;
                      if(macIp == RESTCLIENT_CONFIG.digest.macAddress){
                          var data = getPlayerData();
                          kindStreamInterface.changeStreamInfo(data);
                      }else{
                          window.setTimeout(RefreshPage, 500);
                      }
                    },
                    function(errorData,errorCode) {
                      console.error(errorData);
                      reconnect();
                    }, '', true);                  
                  }catch(e){
                    reconnect();
                  }
                }
              } else if (this.status === 401) {
                var unAuthHtml = "<html><head><title>401 - Unauthorized</title></head><body><h1>401 - Unauthorized</h1></body></html>";
                document.write(unAuthHtml);
              } else if (this.status === 490) {
                var blockHtml = "<html><head><title>Account Blocked</title></head><body><h1>You have exceeded the maximum number of login attempts, please try after some time.</h1></body></html>";
                document.write(blockHtml);
              }else{
                if(this.status === "" || this.status === 0){
                  reconnect();
                }
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

              if (typeof videoinfo.channelId !== "undefined") {
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
            
            // 초기에 Canvas, SVG의 사이즈를 반응형에 맞게 세팅
            setTimeout(changePreviewSize);
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
            if(
              !(
                scope.sketchinfo !== null &&
                typeof scope.sketchinfo !== "undefined" &&
                "workType" in scope.sketchinfo &&
                scope.sketchinfo.workType !== "ptLimit"
              )
            ){
              return;
            }

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

          $(window).bind('resize', resizeHandleForPreviewSize);
          
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