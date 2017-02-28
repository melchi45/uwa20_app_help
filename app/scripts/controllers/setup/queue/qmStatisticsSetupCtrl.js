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

	$scope.queueData = {};
	$scope.queueData.dataLoad = false;

	var channel = 0;

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

	function getAttributes() {
        var defer = $q.defer();

        defer.resolve("success");
        return defer.promise;
    }

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

	$scope.previewSection = {
		coordinates: [],
		goToSetup: function(){
			$state.go("setup.statistics_queue_setup");
		},
		init: function(){
			//sketchinfo
			$scope.sketchinfo = {
				shape: 1,
				color: 0,
				maxNumber: 3,
				useEvent: false,
				workType: 'qmArea',
				modalId: "./views/setup/common/confirmMessage.html"
			};

			//coordinates
			var datas = $scope.queueData.Queues;
			for(var i = 0; i < datas.length; i++){
				var points = [];
				var data = datas[i].Coordinates;
				for(var j = 0; j < data.length; j++){
					points.push( [data[j].x, data[j].y] );
				}

	            $scope.coordinates.push(
		            {
	        			isSet: true,
	        			enable: datas[i].Enable,
	            		points: points,
	            		textInCircle: (i + 1) + ''
	            	}
            	);
			}
		}
	};

	$scope.graphSection = {
		start: function(type){
			if(type === 'Today'){
				qmModel
					.getTodayGraphData()
					.then(todaySuccessCallback, failCallback);
			}else{
			}

			function todaySuccessCallback(data){
				qmModel
					.getWeekGraphData()
					.then(weekSuccessCallback, failCallback);
			}

			function weekSuccessCallback(data){
				
			}

			function failCallback(failData){
				console.info(failData);
			}

			// var data = {};

			// if(type === 'Today'){
			// 	data = {
			// 		Mode: 'Start',
			// 		"Queue.1.AveragePeople": true,
			// 		"Queue.2.AveragePeople": true,
			// 		"Queue.3.AveragePeople": true
			// 	};
			// }else{
			// }
		}
	};

	$scope.searchSection = {
		start: function(){

		},
		openReport: function(){

		}
	};

	$scope.resultSection = {
		view: false
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

	function controlSearch(data){
		var dateForm = $scope.pcConditionsDateForm;

        cameraLocalTime.set()
        .then(
        	function(){
				var calenderDate = getCalenderDate();

				data.Channel = channel;
				data.FromDate = calenderDate.FromDate;
				data.ToDate = calenderDate.ToDate;

				qmModel.controlSearch(
					data,
					function(responseData){
						if(responseData.SearchToken !== undefined){
							$scope.searchToken = responseData.SearchToken;
						}
					},
					function(errorData){
						console.info(errorData);
					}
				);
				// HMStatisticsModel
				// 	.startSearch(searchFromDate, searchToDate, ResultImageType)
				// 	.then(
				// 		function(responseData){
				// 			$scope.conditionsSection.checkSearch(withoutBG, responseData.SearchToken, 0);
				// 		},
				// 		function(failData){
				// 			$scope.conditionsSection.errorSearch(failData);
				// 		}
				// 	);
	        }
	    );
	}

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

    function getPercent(val, max){
		return (val / max)*100;
	}

	function getPeopleData(id){
		var max = $scope.queueData.Queues[id].MaxPeople;
		var high = $scope.queueData.Queues[id].QueueTypes[0].Count;
		var mid = Math.ceil( high / 2 );

		return {
			max: max,
			high: high,
			mid: mid
		};
	}

	var gaugeTimer = {
		timer0: null,
		timer1: null,
		timer2: null
	};
	$scope.queueLevelSection = {
		maxArr: {},
		start: function(id){
			$scope.queueLevelSection.stop();
			$scope.queueLevelSection.change(id);

			gaugeTimer['timer' + id] = setInterval(function(){
				$scope.queueLevelSection.change(id);
			}, 3000);
		},
		stop: function(id){
			var name = 'timer' + id;
			if(gaugeTimer[name] !== null){
				clearInterval(gaugeTimer[name]);
				gaugeTimer[name] = null;
			}
		},
		change: function(id){
			var successCallback = function(responseData){
				var queue = responseData[id].Level;
				var data = getPeopleData(id);
				var parent = $("#qm-bar-" + id);

				var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];
				var colorNameList = ["#1be2e4", "#31d70a", "#ff7f19"];

				parent.find(".qm-bar-mask").css({
					width: (100 - getPercent(queue, data.max)) + "%"
				});

				//Bar 2
				var colorName = null;
				var startColor = null;
				var endColor = null;
				if(queue < data.mid){
					colorName = colorNameList[0];
					startColor = colorList[0];
					endColor = colorList[1];
				}else if(queue < data.high){
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
			};

			var failCallback = function(failData){
				console.info(failData);
			};

			qmModel.checkData(
				{
					Channel: channel,
					QueueIndex: (id + 1)
				}
			).then(successCallback, failCallback);
		}
	};

	$scope.init = function(){
		var deferred = $q.defer();
		/**
		 * When page is setted newly, Scroll of Browser have to set the top.
		 */
		$('.main.setup-wrapper').scrollTop(0);

		if(setMaxResolution() === false){
			console.error("Getting Maxinum Resolution of Video is Wrong!");
		}

		var failCallback = function(errorData){
			$scope.pageLoaded = true;
			console.error(errorData);
		};

		qmModel.getData().then(
			function(data){
				$scope.queueData = data;
				$scope.queueData.dataLoad = true;
				console.info($scope.queueData);

				// Preview
				$scope.previewSection.init();
				// Queue Level(Start graph)
				$scope.queueLevelSection.start(0);
				$scope.queueLevelSection.start(1);
				$scope.queueLevelSection.start(2);

				$scope.pcConditionsDateForm.init(function(){
					//Graph
					$scope.graphSection.start('Today');
					$timeout(function(){
						$scope.pageLoaded = true;
					});
				}, failCallback);
			}, 
			failCallback
		);

		deferred.resolve("Success");

		return deferred.promise;
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
			$scope.queueLevelSection.stop(0);
			$scope.queueLevelSection.stop(1);
			$scope.queueLevelSection.stop(2);
			gaugeTimer = {};
        }
    });

	/* Destroy Area End
	------------------------------------------ */
	function view(){
		var failCallback = function(errorData){
			console.log(errorData);
			$scope.pageLoaded = true;
		};

		showVideo()
			.then(
				function(){
					$scope.init()
						.then(
							function(){
								$scope.pageLoaded = true;
							}, 
							failCallback
						);
				}, 
				failCallback
			);
	}

	$scope.view = view;

	(function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().finally(function() {
                view();
            });
        }
	})();
});