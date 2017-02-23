/* global sessionStorage */
"use strict";

kindFramework.controller('QMStatisticsCtrl', function (
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
	QmModel
	){
	//Playerdata for Video
	$scope.playerdata = null;
	$scope.pageLoaded = false;
	$scope.checkSearching = false;

    $scope.sketchinfo = {};
    $scope.coordinates = [];

	var modalInstance = null;
	var asyncInterrupt = false;

	var mAttr = Attributes.get();
	var qmModel = new QmModel();
	$scope.lang = qmModel.getStLang();

	var searchFromDate = null;
	var searchToDate = null;

	var drawColors = ["#1be2e4", "#31d70a", "#ff7f19"];

	var cameraLocalTime = {
		data: '',
		set: function(localTime){
			var deferred = $q.defer();

			pcSetupService.getCameraLocalTime(
				function(localTime){
					cameraLocalTime.data = localTime;
					deferred.resolve(true);
				}, function(failData){
					deferred.reject(false);
				}
			);

			return deferred.promise;
		},
		getDateObj: function(){
			return new Date(cameraLocalTime.data);
		}
	};

	function changeDateFormat(date, useMonth, useDay, useTime){
		var useMonth = useMonth === false ? false : true;
		var useDay = useDay === false ? false : true;

		var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        var str = year;

        month = month < 10 ? "0" + month : month;
        day = day < 10 ? "0" + day : day;

        if(useMonth === true){
        	str += '-' + month;
        }

        if(useDay === true){
        	str += '-' + day;	
        }

        return str;
	}

	function getCalenderDate(){
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

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

	function setRealtimeSize(){
		var defaultResolution = pcSetupService.getDefaultResolution();
		$(".qm-realtime-video").css({
			minHeight: defaultResolution.height + "px"
		});
	}

	function setResultImageSize(width, height){
		$("#hm-results-image-1").css({
			width: width + "px",
			height: height + "px"
		});
	}

	$scope.realTimeSection = {
		goToSetup: function(){
			$state.go("setup.statistics_queue_setup");
		}
	};

	$scope.conditionsSection = {
		startSearch: function(withoutBG){
			// var dateForm = $scope.pcConditionsDateForm;
			// if(asyncInterrupt || !$scope.useHeatmap || $scope.checkSearching || dateForm.validate() === false){
			// 	return;
			// }

			// if(withoutBG){
			// 	$scope.realTimeSection.hide();
			// }else{
			// 	$scope.checkSearching = true;
			// 	$scope.resultSection.hide();
			// }

	  //       cameraLocalTime.set().then(function(){
			// 	var calenderDate = getCalenderDate();
			// 	searchFromDate = calenderDate.FromDate;
			// 	searchToDate = calenderDate.ToDate;
			// 	var ResultImageType = withoutBG ? "WithoutBackground" : "WithBackground";

				// HMStatisticsModel.startSearch(searchFromDate, searchToDate, ResultImageType).then(
				// 	function(responseData){
				// 		$scope.conditionsSection.checkSearch(withoutBG, responseData.SearchToken, 0);
				// 	},
				// 	function(failData){
				// 		$scope.conditionsSection.errorSearch(failData);
				// 	}
				// );
	        // });
		},
		checkSearch: function(withoutBG, SearchToken, time){
			// if(asyncInterrupt || time >= 60000){
			// 	$scope.conditionsSection.cancelSearch(SearchToken);
			// 	return;
			// }

			// HMStatisticsModel.checkSearch(SearchToken).then(
			// 	function(responseData){
			// 		console.log(responseData);
			// 		if(responseData.Status === "Completed"){
			// 			if(withoutBG){
			// 			}else{
			// 				$scope.resultSection.loadImage(SearchToken).then(
			// 					function(successData){
			// 						$scope.resultSection.show();
			// 					},
			// 					function(failData){
			// 						$scope.conditionsSection.errorSearch(failData);
			// 					}
			// 				);
			// 			}

			// 			$scope.conditionsSection.cancelSearch(SearchToken);
			// 		}else{
			// 			time += 100;
			// 			setTimeout(function(){
			// 				$scope.conditionsSection.checkSearch(withoutBG, SearchToken, time);
			// 			}, 100);
			// 		}
			// 	},
			// 	function(failData){
			// 		$scope.conditionsSection.errorSearch(failData);
			// 	}
			// );
		},
		cancelSearch: function(SearchToken){
			// $scope.checkSearching = false;
			/*
			HMStatisticsModel.cancelSearch(SearchToken).then(
				function(responseData){
					console.log(responseData);
				},
				function(failData){
					console.log(failData);
				}
			);
			*/
		},
		errorSearch: function(failData){
			// console.log(failData);
			// $scope.checkSearching = false;
			// openAlert({
			// 	title: $translate.instant('lang_heatmap'),
			// 	message: $translate.instant('lang_msg_heatmap_error')
			// });
		},
		openReport : function(){
			// openAlert({
			// 	view: 'views/setup/heatmap/modals/report.html',
			// 	controller: 'hmReportModalCtrl',
			// 	size: 'md',
			// 	data: {
			// 		CameraName: function(){
			// 			return $scope.deviceName;
			// 		},
			// 		FromDate: function(){
			// 			return searchFromDate;
			// 		},
			// 		ToDate: function(){
			// 			return searchToDate;
			// 		}
			// 	}
			// });
		}
	};

	$scope.resultSection = {
		view: false,
		show: function(){
			// $scope.resultSection.view = true;
		},
		hide: function(){
			// $scope.resultSection.view = false;
		},
		loadImage: function(SearchToken){
			// var hmResultsImage = $("#hm-results-image-1");
			// hmResultsImage.attr("src", HMStatisticsModel.getResultPath(SearchToken));

			// var deferred = $q.defer();
			
			// hmResultsImage.on("load", function(){
			// 	deferred.resolve(true);
			// 	setResultImageSize(this.width, this.height);
			// });
			// hmResultsImage.on("error", function(){
			// 	deferred.reject(false);
			// });

			// return deferred.promise;
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
                currentPage: 'QueueManagement'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

	/**
	 * @param options {Object} view, controller, iconClass, title, message, data
	 * @return Promise {Promise}
	 */
	function openAlert(options){
		if(asyncInterrupt){
			return;
		}
		var view = options.view || 'views/setup/peoplecounting/modals/alert.html';
		var controller = options.controller || 'alertModalCtrl';
		var size = options.size || 'sm';
		var data = {
        	iconClass: function(){
        		return options.iconClass;
        	},
        	title: function(){
    			return options.title;
        	},
            message: function ()
            {
                return options.message;
            }
        };
        data = $.extend(data, options.data);

		modalInstance = $uibModal.open({
            templateUrl: view,
            controller: controller,
            resolve: data,
            size: size
        });

        return modalInstance.result;
	}

	/**
	 * @param options {Object} view, controller, title, message, data
	 * @return Promise {Promise}
	 */
	function openConfirm(options){
		if(asyncInterrupt){
			return;
		}
		var view = options.view || 'views/setup/peoplecounting/modals/confirm.html';
		var controller = options.controller || 'confirmModalCtrl';
		var data = {
        	title: function(){
    			return options.title;
        	},
            message: function ()
            {
                return options.message;
            }
        };
        data = $.extend(data, options.data);

		modalInstance = $uibModal.open({
            templateUrl: view,
            controller: controller,
            resolve: data,
            size: 'sm'
        });

		return modalInstance.result;
	}

	var gaugeTimer = {};
	$scope.gaugeSection = {
		start: function(id){
			gaugeTimer[id] = setInterval(function(){
				$scope.gaugeSection.change(id);
			}, 3000);
		},
		stop: function(id){
			if(gaugeTimer[id]){
				clearInterval(gaugeTimer[id]);
				delete gaugeTimer[id];
			}
		},
		change: function(id){
			var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];
			var colorNameList = ["#1be2e4", "#31d70a", "#ff7f19"];
			var parent = $("#qm-bar-"+id);

			var mid = 3;
			var high = 7;
			var max = 10;
			var rand = $scope.gaugeSection.makeRandom(0, max);

			parent.find(".qm-bar-mask").css({
				width: (100 - $scope.gaugeSection.getPercent(rand, max)) + "%"
			});

			//Bar 2
			var colorName = null;
			var startColor = null;
			var endColor = null;
			if(rand <= mid){
				colorName = colorNameList[0];
				startColor = colorList[0];
				endColor = colorList[1];
			}else if(rand <= high){
				colorName = colorNameList[1];
				startColor = colorList[2];
				endColor = colorList[3];
			}else{
				colorName = colorNameList[2];
				startColor = colorList[4];
				endColor = colorList[5];
			}

			parent.find(".qm-bar").css({
				background: colorName,
				background: "-webkit-linear-gradient(left, " + startColor + ", " + endColor + ")",
				background: "-o-linear-gradient(right, " + startColor + ", " + endColor + ")",
				background: "-moz-linear-gradient(right, " + startColor + ", " + endColor + ")",
				background: "linear-gradient(to right, " + startColor + ", " + endColor + ")"
			});
		},
		makeRandom: function(min, max){
			var rand = Math.random() * (max- min) + min;
			return Math.floor(rand);
		},
		getPercent: function(val, max){
			return (val / max)*100;
		}
	};

	$scope.init = function(){
		if(setMaxResolution() === false){
			console.error("Getting Maxinum Resolution of Video is Wrong!");
		}

		var failCallback = function(errorData){
			$scope.pageLoaded = true;
			console.error(errorData);
		};

		setRealtimeSize();
		$scope.gaugeSection.start(1);
		$scope.gaugeSection.start(2);
		$scope.gaugeSection.start(3);

		$scope.pageLoaded = true;
		// HMStatisticsModel.deviceInfo().then(
		// 	function(successData){
		// 		$scope.deviceName = successData.DeviceName;
		// 		$scope.Model = successData.Model;

		// 		HMStatisticsModel.getReportInfo().then(
		// 			function(data){
		// 				$scope.useHeatmap = data.Enable;
		// 				$scope.pcConditionsDateForm.init(function(){
		// 					$scope.conditionsSection.startSearch(true);	

		// 					$timeout(function(){
		// 						$scope.pageLoaded = true;	
		// 					});
		// 				}, failCallback);
		// 			}, failCallback
		// 		);
		// 	}, failCallback);
	};

	/* Destroy Area Start
	------------------------------------------ */
	$scope.$on("$destroy", function(){
		// asyncInterrupt = true;
		// if(modalInstance !== null){
		// 	modalInstance.close();
		// 	modalInstance = null;
		// }
    });

    /* Queue management Search page를 벗어 날 때 */
    $scope.$on('$stateChangeStart',function (event, toState, toParams, fromState, fromParams) {
        if(fromState.controller === 'QMStatisticsCtrl'){
			$scope.gaugeSection.stop(1);
			$scope.gaugeSection.stop(2);
			$scope.gaugeSection.stop(3);
			gaugeTimer = {};
        }
    });

	/* Destroy Area End
	------------------------------------------ */

	function view(){
		showVideo().then($scope.init, $scope.init);
	}

	$scope.view = view;

	(function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
        	view();
        }
	})();
});