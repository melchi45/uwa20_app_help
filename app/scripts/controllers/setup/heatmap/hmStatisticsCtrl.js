/* global sessionStorage */
"use strict";

kindFramework.controller('HMStatisticsCtrl', function(
  $q,
  $scope,
  $uibModal,
  $timeout,
  $state,
  $translate,
  Attributes,
  ConnectionSettingService,
  pcSetupService,
  SunapiClient,
  HMStatisticsModel,
  COMMONUtils
) {
  //Playerdata for Video
  $scope.playerdata = null;
  $scope.pageLoaded = false;
  $scope.checkSearching = false;

  $scope.sketchinfo = {};
  $scope.coordinates = [];

  var BrowserDetect = COMMONUtils.getBrowserDetect();

  var modalInstance = null;
  var asyncInterrupt = false;

  var mAttr = Attributes.get();
  var hMStatisticsModel = new HMStatisticsModel();

  var searchFromDate = null;
  var searchToDate = null;

  var cameraLocalTime = {
    data: '',
    set: function(localTime) {
      var deferred = $q.defer();

      pcSetupService.getCameraLocalTime(
        function(localTime) {
          cameraLocalTime.data = localTime;
          deferred.resolve(true);
        },
        function(failData) {
          deferred.reject(false);
        }
      );

      return deferred.promise;
    },
    getDateObj: function() {
      return new Date(cameraLocalTime.data);
    }
  };

  function changeDateFormat(date, useMonth, useDay, useTime) {
    var useMonth = useMonth === false ? false : true;
    var useDay = useDay === false ? false : true;

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    var str = year;

    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;

    if (useMonth === true) {
      str += '-' + month;
    }

    if (useDay === true) {
      str += '-' + day;
    }

    return str;
  }

  function getCalenderDate() {
    var dateForm = $scope.pcConditionsDateForm;

    var FromDate = null;
    var ToDate = null;

    var fromCalender = dateForm.fromCalender;
    var toCalender = dateForm.toCalender;

    FromDate = changeDateFormat(fromCalender) + "T00:00:00Z";
    ToDate = changeDateFormat(toCalender) + "T23:59:59Z";

    return {
      FromDate: FromDate,
      ToDate: ToDate
    };
  }

  function setMaxResolution() {
    return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
  }

  function setResultImageSize(width, height) {
    $("#hm-results-image-1").css({
      width: width + "px",
      height: height + "px"
    });
  }

  $scope.realTimeSection = {
    dropDownState: false,
    view: false,
    show: function() {
      $scope.realTimeSection.view = true;
    },
    hide: function() {
      $scope.realTimeSection.view = false;
    },
    heatmapEnableMessage: $translate.instant('lang_msg_please_enable').replace('%1', $translate.instant('lang_heatmap')),
    toggleDropDown: function(val) {
      if (typeof val !== "undefined") {
        $scope.realTimeSection.dropDownState = val;
      } else {
        $scope.realTimeSection.dropDownState = !$scope.realTimeSection.dropDownState;
      }
    },
    goToSetup: function() {
      $state.go("setup.statistics_heatmap_setup");
    },
    loadImage: function(SearchToken) {
      var hmRealTimeOverImg = $("#hm-realtime-overimg img");
      hmRealTimeOverImg.
        attr("src", hMStatisticsModel.getResultPath(SearchToken));

      var deferred = $q.defer();

      hmRealTimeOverImg.on("load", function() {
        deferred.resolve(true);
      });
      hmRealTimeOverImg.on("error", function() {
        deferred.reject(false);
      });

      return deferred.promise;
    }
  };

  $scope.conditionsSection = {
    startSearch: function(withoutBG) {
      var dateForm = $scope.pcConditionsDateForm;
      if (asyncInterrupt || !$scope.useHeatmap || $scope.checkSearching || dateForm.validate() === false) {
        return;
      }

      if (withoutBG) {
        $scope.realTimeSection.hide();
      } else {
        $scope.checkSearching = true;
        $scope.resultSection.hide();
      }

      cameraLocalTime.set().then(function() {
        var calenderDate = getCalenderDate();
        searchFromDate = calenderDate.FromDate;
        searchToDate = calenderDate.ToDate;
        var ResultImageType = withoutBG ? "WithoutBackground" : "WithBackground";

        hMStatisticsModel.startSearch(searchFromDate, searchToDate, ResultImageType).then(
          function(responseData) {
            $scope.conditionsSection.checkSearch(withoutBG, responseData.SearchToken, 0);
          },
          function(failData) {
            $scope.conditionsSection.errorSearch(failData);
          }
        );
      });
    },
    checkSearch: function(withoutBG, SearchToken, time) {
      if (asyncInterrupt || time >= 60000) {
        $scope.conditionsSection.cancelSearch(SearchToken);
        return;
      }

      hMStatisticsModel.checkSearch(SearchToken).then(
        function(responseData) {
          console.log(responseData);
          if (responseData.Status === "Completed") {
            if (withoutBG) {
              $scope.realTimeSection.loadImage(SearchToken).then(
                function(successData) {
                  $scope.realTimeSection.show();
                },
                function(failData) {
                  $scope.conditionsSection.errorSearch(failData);
                }
              );
            } else {
              $scope.resultSection.loadImage(SearchToken).then(
                function(successData) {
                  $scope.resultSection.show();
                },
                function(failData) {
                  $scope.conditionsSection.errorSearch(failData);
                }
              );
            }

            $scope.conditionsSection.cancelSearch(SearchToken);
          } else {
            time += 100;
            setTimeout(function() {
              $scope.conditionsSection.checkSearch(withoutBG, SearchToken, time);
            }, 100);
          }
        },
        function(failData) {
          $scope.conditionsSection.errorSearch(failData);
        }
      );
    },
    cancelSearch: function(SearchToken) {
      $scope.checkSearching = false;
      /*
      hMStatisticsModel.cancelSearch(SearchToken).then(
      	function(responseData){
      		console.log(responseData);
      	},
      	function(failData){
      		console.log(failData);
      	}
      );
      */
    },
    errorSearch: function(failData) {
      console.log(failData);
      $scope.checkSearching = false;
      openAlert({
        title: $translate.instant('lang_heatmap'),
        message: $translate.instant('lang_msg_heatmap_error')
      });
    },
    openReport: function() {
      openAlert({
        view: 'views/setup/heatmap/modals/report.html',
        controller: 'hmReportModalCtrl',
        size: 'md',
        data: {
          CameraName: function() {
            return $scope.deviceName;
          },
          FromDate: function() {
            return searchFromDate;
          },
          ToDate: function() {
            return searchToDate;
          }
        }
      });
    }
  };

  $scope.resultSection = {
    view: false,
    show: function() {
      $scope.resultSection.view = true;
    },
    hide: function() {
      $scope.resultSection.view = false;
    },
    loadImage: function(SearchToken) {
      var hmResultsImage = $("#hm-results-image-1");
      hmResultsImage.attr("src", hMStatisticsModel.getResultPath(SearchToken));

      var deferred = $q.defer();

      hmResultsImage.on("load", function() {
        deferred.resolve(true);
        setResultImageSize(this.width, this.height);
      });
      hmResultsImage.on("error", function() {
        deferred.reject(false);
      });

      return deferred.promise;
    }
  };

  $scope.colorLevelSection = {
    /**
    BackgroundColourLevel 100 : Full Color 0 : Gray Color
    */
    BackgroundColourLevel: 'false',
    init: function(val) {
      var enable = val === 100 ? 'true' : 'false';
      $scope.colorLevelSection.BackgroundColourLevel = enable;
      $scope.colorLevelSection.changeColorTone();
    },
    toggleColorTone: function(status) {
      var previewVideo = $("#livecanvas");
      var filterOption = {
        on: {
          'filter': 'grayscale(100%)',
          '-webkit-filter': 'grayscale(100%)'
        },
        off: {
          'filter': 'grayscale(0%)',
          '-webkit-filter': 'grayscale(0%)'
        }
      };

      var options = null;

      if (BrowserDetect.isIE !== true) {
        options = status === true ? filterOption.on : filterOption.off;
        previewVideo.css(options);
      }
    },
    changeColorTone: function() {
      try {
        var enable = $scope.colorLevelSection.BackgroundColourLevel;

        if (enable === 'true') {
          $scope.colorLevelSection.toggleColorTone(false);
        } else {
          $scope.colorLevelSection.toggleColorTone(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  function showVideo() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
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
        currentPage: 'Heatmap'
      };
    }, function(errorData) {
      console.log(errorData);
    }, '', true);
  }

  /**
   * @param options {Object} view, controller, iconClass, title, message, data
   * @return Promise {Promise}
   */
  function openAlert(options) {
    if (asyncInterrupt) {
      return;
    }
    var view = options.view || 'views/setup/peoplecounting/modals/alert.html';
    var controller = options.controller || 'alertModalCtrl';
    var size = options.size || 'sm';
    var data = {
      iconClass: function() {
        return options.iconClass;
      },
      title: function() {
        return options.title;
      },
      message: function() {
        return options.message;
      }
    };
    data = $.extend(data, options.data);

    modalInstance = $uibModal.open({
      templateUrl: view,
      controller: controller,
      windowClass: 'modal-position-middle',
      resolve: data,
      size: size
    });

    return modalInstance.result;
  }


  /*TBD{ (SDCard)
  	$scope.useReport = true;
  	var SDCard = {
  		set: function(){
  			sessionStorage.setItem("HM1_SDCard", true);
  		},
  		get: function(){
  			return sessionStorage.getItem("HM1_SDCard");
  		},
  		remove: function(){
  			sessionStorage.removeItem("HM1_SDCard");
  		}
  	};

  	$scope.checkSDCard = function(){
  		if(!hMStatisticsModel.mockupData.SDCard){
  			$scope.useReport = false;
  			if(SDCard.get() === null){
  				SDCard.set();

  				$scope.openAlert({
  					title: 'SD Card',
  					message: 'Please check SD Card.'
  				});
  			}
  		}
  	};
  }*/

  $scope.init = function() {
    if (setMaxResolution() === false) {
      console.error("Getting Maxinum Resolution of Video is Wrong!");
    }

    var failCallback = function(errorData) {
      $scope.pageLoaded = true;
      console.error(errorData);
    };

    // setImageSize();

    hMStatisticsModel.deviceInfo().then(
      function(successData) {
        $scope.deviceName = successData.DeviceName;
        $scope.Model = successData.Model;

        hMStatisticsModel.getReportInfo().then(
          function(data) {
            if ("BackgroundColourLevel" in data) {
              $scope.colorLevelSection.init(data.BackgroundColourLevel);
            }
            $scope.useHeatmap = data.Enable;
            $scope.pcConditionsDateForm.init(function() {
              $scope.conditionsSection.startSearch(true);

              $timeout(function() {
                $scope.pageLoaded = true;
              });
            }, failCallback);
          }, failCallback
        );
      }, failCallback);
  };

  /* Destroy Area Start
  ------------------------------------------ */
  $scope.$on("$destroy", function() {
    asyncInterrupt = true;
    if (modalInstance !== null) {
      modalInstance.close();
      modalInstance = null;
    }
  });

  /* Destroy Area End
  ------------------------------------------ */

  function view() {
    showVideo().then($scope.init, $scope.init);
  }

  $scope.view = view;

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      view();
    }
  })();
});