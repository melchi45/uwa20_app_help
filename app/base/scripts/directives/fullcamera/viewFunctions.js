"use strict";
kindFramework
.directive("viewFunctions", [ 'PTZ_MESSAGE', 'PTZ_TYPE', 'ModalManagerService',
  'Attributes', 'SunapiClient', '$translate', 'UniversialManagerService', 'CAMERA_STATUS','$rootScope', '$timeout', 'PTZContorlService',
  function( PTZ_MESSAGE, PTZ_TYPE, ModalManagerService, Attributes,  SunapiClient,
    $translate, UniversialManagerService, CAMERA_STATUS, $rootScope, $timeout, PTZContorlService) {

    return {
      templateUrl: 'views/livePlayback/directives/fullcamera/view-functions.html',
      require: '^fullCamera',
      link: function(scope, element, attrs) {
         var ptzModeList = null;
         var ptzNoListMessage = null;
         var sunapiAttributes = Attributes.get();

        function init() {
            ptzModeList = PTZ_TYPE.ptzCommand;
            ptzNoListMessage = PTZ_MESSAGE.ptzNoListMessage;
            scope.digitalZoom = {
                mouseDownCheck:false,
                mouseMoveCheck:false,
                curLocation:[0, 0],
                visibility:false,
                level:1,
                navigation:{'left' : 0, 'top' : 0, 'width' : 100, 'height' : 100,},
                areaStyle:{
                    'left' : '0%',
                    'top' : '0%',
                    'width' : '100%',
                    'height' : '100%'
                }
            };

            scope.ptzControl = {
                functionSlide: {
                    'option': {
                        nowrap: true,
                    },
                    'slides': [
                    ],
                    'style': {
                        'width': '20%',
                    },
                },
                ptzMenuVisibility: false,
                ptzControlMode: false,
                ptzAreaZoomMode: false,
                isPlay: false,
                ptzMenuBottom: [
                    {
                        'label': $translate.instant('lang_preset'),
                        'class': 'tui-ch-live-ptz-preset',
                        'action':  function(event) {
                            scope.ptzAction.preset();
                        },
                        'show': sunapiAttributes.PTZModel === true || sunapiAttributes.ExternalPTZModel === true,
                    },
                    {
                        'label': $translate.instant('lang_swing'),
                        'class': 'tui-ch-live-ptz-swing',
                        'action':  function(event) {
                            scope.ptzAction.swing();
                        },
                        'show': sunapiAttributes.SwingSupport === true,
                    },
                    {
                        'label': $translate.instant('lang_group'),
                        'class': 'tui-ch-live-ptz-group',
                        'action':  function(event) {
                            scope.ptzAction.group();
                        },
                        'show': sunapiAttributes.GroupSupport === true,
                    },
                    {
                        'label': $translate.instant('lang_tour'),
                        'class': 'tui-ch-live-ptz-tour',
                        'action':  function(event) {
                            scope.ptzAction.tour();
                        },
                        'show': sunapiAttributes.TourSupport === true,
                    },
                    {
                        'label': $translate.instant('lang_trace'),
                        'class': 'tui-ch-live-ptz-trace',
                        'action':  function(event) {
                            scope.ptzAction.trace();
                        },
                        'show': sunapiAttributes.TraceSupport === true,
                    },
                    {
                        'label': $translate.instant('lang_tracking'),
                        'class': 'tui-ch-live-ptz-tracking',
                        'TrackingSelect': 'ptz-zoom-select-keep',
                        'action':  function(event) {
                            scope.ptzAction.tracking();
                        },
                        'show': sunapiAttributes.TrackingSupport === true,
                    },
                    {
                        'label': $translate.instant('lang_autoFocus'),
                        'class': 'tui-ch-live-autofocus',
                        'action':  function(event) {
                            scope.ptzAction.autoFocus();
                        },
                        'show': sunapiAttributes.PTZModel === true,
                    },
                    {
                        'label': $translate.instant('lang_digitalZoom'),
                        'class': 'tui-ch-live-digitalzoom',
                        'DzoomSelect': 'ptz-zoom-select-keep',
                        'action':  function(event) {
                            scope.ptzAction.digitalZoom();
                        },
                        'show': true,
                    },
                    {
                        'label': "PTZ Control",
                        'class': 'tui-ptz live-ptz_icon-3',
                        'action':  function(event) {
                            var dis = $("#live-ptz").css("display");
                            if(dis === "none"){
                                $rootScope.$emit('channel:setLivePTZControl', true);
                            }else{
                                $rootScope.$emit('channel:setLivePTZControl', false);
                            }
                        },
                        'show': sunapiAttributes.PTZModel === true,
                    },
                    {
                        'label': $translate.instant('lang_near'),
                        'class': 'tui-near',
                        'action':  function(event) {
                            scope.ptzAction.near();
                        },
                        'afterAction': function(event) {
                            scope.ptzAfterAction.near();
                        },
                        'show': true,
                    },
                    {
                        'label': $translate.instant('lang_far'),
                        'class': 'tui-far',
                        'action':  function(event) {
                            scope.ptzAction.far();
                        },
                        'afterAction': function(event) {
                            scope.ptzAfterAction.far();
                        },
                        'show': true,
                    },
                    {
                        'label': $translate.instant('lang_zoomIn'),
                        'class': 'tui-ch-live-zoomin',
                        'action':  function(event) {
                            scope.ptzAction.zoomIn();
                        },
                        'afterAction': function(event) {
                            scope.ptzAfterAction.zoomIn();
                        },
                        'show': true,
                    },
                    {
                        'label': $translate.instant('lang_zoomOut'),
                        'class': 'tui-ch-live-zoomout',
                        'action':  function(event) {
                            scope.ptzAction.zoomOut();
                        },
                        'afterAction': function(event) {
                            scope.ptzAfterAction.zoomOut();
                        },
                        'show': true,
                    },
                    {
                        'label': $translate.instant('lang_areaZoom'),
                        'class': 'tui-ch-live-ptz-areazoom',
                        'AzoomSelect': 'ptz-zoom-select-keep',
                        'action':  function(event) {
                            scope.ptzAction.areaZoom();
                        },
                        'show': sunapiAttributes.AreaZoomSupport === true
                    },
                    {
                        'label': $translate.instant('lang_goto1x'),
                        'class': 'tui-ch-live-ptz-areazoom-1x',
                        'action':  function(event) {
                            if(scope.ptzKeepAzoom){
                                scope.ptzAction.areaZoom1x();
                            }
                        },
                        'show': sunapiAttributes.AreaZoomSupport === true
                    },
                    {
                        'label': $translate.instant('lang_prev'),
                        'class': 'tui-ch-live-ptz-areazoom-back',
                        'action':  function(event) {
                            if(scope.ptzKeepAzoom){
                                scope.ptzAction.areaZoomPrev();
                            }
                        },
                        'show': sunapiAttributes.AreaZoomSupport === true
                    },
                    {
                        'label': $translate.instant('lang_next'),
                        'class': 'tui-ch-live-ptz-areazoom-pre',
                        'action':  function(event) {
                            if(scope.ptzKeepAzoom){
                                scope.ptzAction.areaZoomNext();
                            }
                        },
                        'show': sunapiAttributes.AreaZoomSupport === true
                    }
                ],
                startPTZMode: function() {
                    //If you want to know why this function is used, find toggleLiveViewMode function
                    scope.toggleLiveViewMode(false);

                    scope.toggleNavOverlay({val:false});
                    scope.domControls.resetUI();
                    scope.domControls.visibilityFullScreenFuntions = false;
                    scope.ptzControl.ptzControlMode = true;
                    scope.digitalZoom.visibility = false;
                    scope.domControls.visibleFunctions();
                    UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
                    PTZContorlService.setMode(ptzModeList.PTZ);
                    scope.ptzKeepDzoom = false;
                    scope.ptzKeepAzoom = false;
                    scope.ptzKeepTracking = false;


                    scope.ptzControl.functionSlide.slides = [];
                    var MAXIMUM_COUNT_ICON_SLIDES = 9;
                    var width = window.innerWidth;

                    var index=0;
                    for (index = 0; index < scope.ptzControl.ptzMenuBottom.length; index++) {
                        if (scope.ptzControl.ptzMenuBottom[index].show === false) {
                            scope.ptzControl.ptzMenuBottom.splice(index, 1);
                            index--;
                        }
                    }

                    for(index = 0; index < scope.ptzControl.ptzMenuBottom.length; index += MAXIMUM_COUNT_ICON_SLIDES ) {
                        var slide = scope.ptzControl.ptzMenuBottom.slice(index, index + MAXIMUM_COUNT_ICON_SLIDES);
                        scope.ptzControl.functionSlide.slides.push(slide);

                        if(index === 0) {
                          /* jshint ignore:start */
                            scope.ptzControl.functionSlide.style['width'] = 1/(slide.length+1) * 100 + '%';
                          /* jshint ignore:end */
                        }
                    }
                },
                closePTZMode: function() {
                    scope.ptzControl.ptzMenuVisibility = false;
                    scope.ptzControl.functionSlide.slides = [];
                    scope.ptzControl.ptzControlMode = false;
                    scope.ptzControl.ptzAreaZoomMode = false;
                    scope.ptzControl.isPlay = false;
                    UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
                    scope.ptzKeepDzoom = false;
                    scope.ptzKeepAzoom = false;
                    scope.ptzKeepTracking = false;
                    if(PTZContorlService.getAutoTrackingMode() === "True") {
                        PTZContorlService.setAutoTrackingMode("False");
                    }
                    if(PTZContorlService.getManualTrackingMode() === "True") {
                        PTZContorlService.setManualTrackingMode("False");
                    }
                    PTZContorlService.setPTZAreaZoom('off');
                    PTZContorlService.setMode(0);

                    //If you want to know why this function is used, find toggleLiveViewMode function
                    $timeout(function(){
                        scope.toggleLiveViewMode(true);
                    });
                },
                stopSequence: function() {
                    scope.ptzAction.stopSequence();
                },
                stopAreaZoom : function() {
                    if(scope.ptzAction !== undefined && scope.ptzAction.stopAreaZoom !== undefined) {
                        scope.ptzAction.stopAreaZoom();
                    }
                }
            };
        }

        scope.stopPropagation = function(event)
        {
          //This function is to prevent calling ptz stop command (mouse up evnet in ptzControlService)
          if (!event)
            event = window.event;
          
          //IE9 & Other Browsers
          if (event.stopPropagation) {
            event.stopPropagation();
          }
          //IE8 and Lower
          else {
            event.cancelBubble = true;
          }
        };

        var presetRefresh = function() {
          scope.ptzAction.presetRefresh();
        };

        (function wait() {
            if (!sunapiAttributes.Ready) {
                $timeout(function () {
                    sunapiAttributes = Attributes.get();
                    wait();
                }, 500);
            } else {
                init();
            }
        })();

        /**
         * When PTZ mode is enabled, A button of Vide Mode is hidden.
         * @date 2016.07.11
         */
        scope.toggleLiveViewMode = function(data){
          $rootScope.$emit("scripts/controllers/livePlayback/BaseChannel.js::toggleLiveViewMode", data);
        };

        var areaX = null;
        var areaY = null;
        var fullDiv = document.getElementById('full-screen-channel');
        var areaCanvas = document.getElementById("areaCanvas");
        var context = areaCanvas.getContext("2d");

        $rootScope.$saveOn('app/scripts/directives/fullcamera/viewFunctions.js::toggleNavigation', function(event, data) {
          if(data === true)
          {
            if(scope.digitalZoom.level !== 1.00)
            {
              scope.digitalZoom.visibility = data;
            }
          }
          else if(data === false)
          {
            scope.digitalZoom.visibility = data;
          }
        }, scope);

        $rootScope.$saveOn('app/scripts/directives/fullcamera/viewFunctions.js::ptz', function(event, data) {
          if(data === true) {
            //ptzControl.ptzMenuVisibility = true;
            scope.ptzControl.startPTZMode();
          }
        }, scope);

        $rootScope.$saveOn('turnOffTracking', function(event, data) { // set tracking icon off manually
          scope.ptzKeepTracking = false;
        }, scope);
    }
  };
}]);