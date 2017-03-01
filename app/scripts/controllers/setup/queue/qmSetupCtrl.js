/* global sessionStorage */
kindFramework.controller('QMSetupCtrl', 
	function (
		$rootScope,
		$scope, 
		$timeout, 
		$interval,
		$compile,
		$q,
		
		$uibModal, 
		$state, 
		$translate,

		QmModel,
		PcSetupModel,
		PCLinePainter, 
		PCRectanglePainter, 
		pcModalService,
		pcSetupService,

		ConnectionSettingService, 
		Attributes,
		COMMONUtils,
		SunapiClient,
		sketchbookService
		){
	"use strict";

	var asyncInterrupt = false;

	var mAttr = Attributes.get();

	var pcSetupModel = new PcSetupModel();
	$scope.lang = pcSetupModel.getStLang();

	var qmModel = new QmModel();
	$scope.lang = qmModel.getStLang();

	$scope.pageLoaded = false;

	//Playerdata for Video
	$scope.playerdata = null;

	$scope.coordinates = [];
	$scope.sketchinfo = {};

	$scope.queueData = {};
	$scope.queueData.dataLoad = false;
	$scope.support = {};

	var channel = 0;

    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

    function getAttributes() {
        var defer = $q.defer();

        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (mAttr.QueueHighDuration !== undefined)
        {
            $scope.queueEventSection.high.sliderProperty.floor = mAttr.QueueHighDuration.minValue;
            $scope.queueEventSection.high.sliderProperty.ceil = mAttr.QueueHighDuration.maxValue;
        }

        if (mAttr.QueueMidDuration !== undefined)
        {
            $scope.queueEventSection.mid.sliderProperty.floor = mAttr.QueueMidDuration.minValue;
            $scope.queueEventSection.mid.sliderProperty.ceil = mAttr.QueueMidDuration.maxValue;
        }

        if(mAttr.FisheyeLens !== undefined)
        {
        	$scope.support.isFisheyeLens = mAttr.FisheyeLens;
        }

        defer.resolve("success");
        return defer.promise;
    }

	$scope.init = function(){
		var deferred = $q.defer();
		/**
		 * When page is setted newly, Scroll of Browser have to set the top.
		 */
		$('.main.setup-wrapper').scrollTop(0);

		/**
		 *  To send clearly the axis, Maximum Resolution should be setted.
		 */
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

				//Realtime
				$scope.realtimeSection.init();
				//Queue List
				$scope.queueListSection.checkAllStatus();
				//Queue Level
				$scope.queueLevelSection.start();
				$scope.queueLevelSection.bindHtml();
				$scope.queueLevelSection.getRange();
				//Calibration
				$scope.calibrationSection.init();
				//Tab(Draw init)
				var activedTab = $scope.currentTapStatus.indexOf(true);
				$scope.changeTabStatus(activedTab);
				//Shape active
				$timeout(function(){
					sketchbookService.activeShape($scope.queueListSection.selectedQueueId);
				});
				//Report
				$scope.reportSection.init();
			}, 
			failCallback
		);

		deferred.resolve("Success");

		return deferred.promise;
	};

	$scope.openFTPEmail = function() {
    	$state.go('^.event_ftpemail');
    };

    $scope.realtimeSection = {
		coordinates: [],
		init: function(){
			var datas = $scope.queueData.Queues;
			for(var i = 0; i < datas.length; i++){
				var points = [];
				var data = datas[i].Coordinates;
				for(var j = 0; j < data.length; j++){
					points.push( [data[j].x, data[j].y] );
				}

				$scope.realtimeSection.coordinates.push(
					{
						enable: datas[i].Enable,
						points: points
					}
				);
			}
        }
    };

    $scope.queueListSection = {
		selectedQueueId: 0,
		regExp: pcSetupService.regExp.getAlphaNum(),
		allEnableStatus: false,
		changeQueue: function(id){
			$timeout(function(){
				$scope.queueListSection.selectedQueueId = id;
				sketchbookService.activeShape(id);
				$scope.queueLevelSection.start();
			});
		},
		changeUseState: function(index, isCheckingAllStatus){
			if($scope.queueData.Queues[index].Enable === true){
				sketchbookService.showGeometry(index);
			}else{
				sketchbookService.hideGeometry(index);
			}

			if(isCheckingAllStatus){
				$scope.queueListSection.checkAllStatus();
			}
		},
		enableStatusAll: function(){
			for(var i = 0, ii = $scope.queueData.Queues.length; i < ii; i++){
				$scope.queueData.Queues[i].Enable = $scope.queueListSection.allEnableStatus;
				$scope.queueListSection.changeUseState(i);
			}
		},
		checkAllStatus: function(){
			var isOk = true;
			for(var i = 0, ii = $scope.queueData.Queues.length; i < ii; i++){
				if($scope.queueData.Queues[i].Enable === false){
					isOk = false;
				}
			}

			$scope.queueListSection.allEnableStatus = isOk;
		}
    }

    function getPercent(val, max){
		return (val / max)*100;
	}

	function makeRandom(min, max){
		var rand = Math.random() * (max- min) + min;
		return Math.floor(rand);
	}

	function setInt(val){
		return parseInt(val, 10);
	}

	function getPeopleData(){
		var max = $scope.queueData.Queues[$scope.queueListSection.selectedQueueId].MaxPeople;
		var high = $scope.queueData.Queues[$scope.queueListSection.selectedQueueId].QueueTypes[0].Count;
		var mid = Math.ceil( high / 2 );

		return {
			max: max,
			high: high,
			mid: mid
		};
	}

	var gaugeTimer = null;
	$scope.queueLevelSection = {
		maxArr: {},
		start: function(){
			$scope.queueLevelSection.stop();
			$scope.queueLevelSection.reload();
			$scope.queueLevelSection.change();

			gaugeTimer = setInterval(function(){
				$scope.queueLevelSection.change();
			}, 3000);
		},
		stop: function(){
			if(gaugeTimer !== null){
				clearInterval(gaugeTimer);
				gaugeTimer = null;
			}
		},
		change: function(){
			var successCallback = function(responseData){
				var queue = responseData[$scope.queueListSection.selectedQueueId].Level;
				var data = getPeopleData();

				var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];
				var colorNameList = ["#1be2e4", "#31d70a", "#ff7f19"];

				$("#qm-bar .qm-bar-mask").css({
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

				$("#qm-bar .qm-bar").css({
					// background: colorName,
					// background: "-webkit-linear-gradient(left, " + startColor + ", " + endColor + ")",
					// background: "-o-linear-gradient(right, " + startColor + ", " + endColor + ")",
					// background: "-moz-linear-gradient(right, " + startColor + ", " + endColor + ")",
					background: "linear-gradient(to right, " + startColor + ", " + endColor + ")"
				});
			};

			var failCallback = function(failData){
				console.info(failData);
			};

			qmModel.checkData(
				{
					Channel: channel,
					QueueIndex: ($scope.queueListSection.selectedQueueId + 1)
				}
			).then(successCallback, failCallback);
		},
		resetBar: function(){
			$("#qm-bar .qm-bar-mask").css({
				width: "100%"
			});
		},
		setPosition: function(){
			var data = getPeopleData();

			$("#qm-bar .qm-bar-high").css("left", getPercent(data.high, data.max) + "%");

			$("#qm-bar .qm-bar-mid").css("left", getPercent(data.mid, data.max) + "%");
		},
		bindHtml: function(){
			var data = getPeopleData();
			$("#qm-bar .qm-bar-max span").html(data.max);
			$("#qm-bar .qm-bar-high span").html(data.high);
			$("#qm-bar .qm-bar-mid span").html(data.mid);
		},
		getRange: function(){
			var data = getPeopleData();

			var arr = {};
			for(var i = 1; i <= data.max; i++){
				arr[i] = i;
			}

			$scope.queueLevelSection.maxArr = arr;
		},
		changeValue: function(type, val){
			if(type === 'max'){
				$scope.queueData.Queues[$scope.queueListSection.selectedQueueId].MaxPeople = setInt(val);
			}else if(type === 'high'){
				$scope.queueData.Queues[$scope.queueListSection.selectedQueueId].QueueTypes[0].Count = setInt(val);
			}

			$scope.queueLevelSection.reload();
		},
		reload: function(){
			$scope.queueLevelSection.getRange();
			$scope.queueLevelSection.resetBar();
			$scope.queueLevelSection.bindHtml();
			$scope.queueLevelSection.setPosition();
		}
	};

	$scope.queueEventSection = {
		high: {
			sliderProperty : {
		        ceil: 180,
		        floor: 10,
		        showSelectionBar: true,
		        vertical: false,
		        showInputBox: true,
		        disabled: false,
		        onEnd: function(){}
			}
		},
		mid: {
			sliderProperty : {
		        ceil: 180,
		        floor: 10,
		        showSelectionBar: true,
		        vertical: false,
		        showInputBox: true,
		        disabled: false,
		        onEnd: function(){}
			}
		}
	};

	$scope.calibrationSection = {
		coordinates: [],
		minSize: 0,
		maxSize: 0,
		init: function(){
        	var data = $scope.queueData.ObjectSizeCoordinates;
        	$scope.calibrationSection.coordinates = [
        		[data[0].x, data[0].y],
        		[data[0].x, data[1].y],
        		[data[1].x, data[1].y],
        		[data[1].x, data[0].y],
        		
        	];

			//set Calibration Box
			var defaultResolution = pcSetupService.getDefaultResolution();
			var maxResolution = pcSetupService.getMaxResolution();
			var minSize = 0;
			var maxSize = 0;

			/*
			Calibration guide box의 최소, 최대 크기는 다음과 같고, 최소보다 작거나 최대보다 크게 설정할 수 없다

			- 최소 : View 영상의 가로세로 중 짧은 길이의 10%
			- 최대 : View 영상의 가로세로 중 긴 길이의 50%

			* GUI View 영상 640x480 경우

			- 최소 : 48 x 48 [pixels]
			- 최대 : 320 x 320 [pixels]
			*/
			if(defaultResolution.height > defaultResolution.width){
				$scope.calibrationSection.maxSize = maxResolution.height * 0.5;
				$scope.calibrationSection.minSize = maxResolution.width * 0.1;
			}else{
				$scope.calibrationSection.maxSize = maxResolution.width * 0.5;
				$scope.calibrationSection.minSize = maxResolution.height * 0.1;
			}
		}
	};

	$scope.reportSection = {
		init: function(){
			$scope.pcSetupReport.getReport();
			console.info($scope.pcSetupReport);
			// var data = $scope.queueData;
			// $scope.pcSetupReport = {
			// 	use: data.ReportEnable,
			// 	schedule: {
			// 		periodList: '',
			// 		date: '',
			// 		dateList: '',
			// 		hour: '',
			// 		minute: ''
			// 	},
			// 	fileName: {
			// 		name: '',
			// 		extension: '',
			// 	}
			// };
		}
	};

	/* Counting Rule End
	----------------------------------------------*/

	/* Collapse Start
	----------------------------------------------*/

	//
	$scope.currentTapStatus = [true, false];
	$scope.changeTabStatus = function(value){
		for(var i = 0, len = $scope.currentTapStatus.length; i < len; i++){
			if(i === value){
				$scope.currentTapStatus[i] = true;
			}else{
				$scope.currentTapStatus[i] = false;
			}
		}

		//Configuration
		if($scope.currentTapStatus[0] === true){
			$scope.sketchinfo = getSketchinfo('area');
			$timeout(function(){
				sketchbookService.activeShape($scope.queueListSection.selectedQueueId);
			});
		}else if($scope.currentTapStatus[1] === true){
			$scope.sketchinfo = getSketchinfo('calibration');
			$timeout(function(){
				sketchbookService.activeShape(0);
			});
		}
	};

	function getSketchinfo(flag){
		if(!$scope.queueData.Enable) return null;
		var sketchinfo = {
			shape: 1,
			modalId: "./views/setup/common/confirmMessage.html"
		};
		$scope.coordinates = [];
        
        //Configuration
        if(flag === "area") {
        	var data = $scope.realtimeSection.coordinates;
        	for(var i = 0; i < data.length; i++){
	            $scope.coordinates.push(
		            {
	        			isSet: true,
	        			enable: data[i].enable,
	            		points: data[i].points
	            		// textInCircle: (i + 1) + ''
	            	}
            	);
        	}

			sketchinfo.useEvent = true;
        	sketchinfo.workType = 'qmArea';
        	// sketchinfo.minNumber = 4;
        	sketchinfo.maxNumber = 3;
        	sketchinfo.color = 0;
        //Calibration
        } else if(flag === "calibration") {
            $scope.coordinates = [
            	{
        			isSet: true, //true = 저장되어있음. false = 저장X
        			enable: true,
            		points: $scope.calibrationSection.coordinates
            	}
            ];

        	sketchinfo.workType = 'calibration';
        	sketchinfo.maxNumber = 1;

            /**
            최대 사이즈는 영상의 가로, 세로 중 큰쪽의 50%,
            최소 사이즈는 영상의 가로, 세로 중 작은 쪽의 3%
            */
            sketchinfo.minSize = {
            	width: $scope.calibrationSection.minSize,
            	height: $scope.calibrationSection.minSize
            };
            sketchinfo.maxSize = {
            	width: $scope.calibrationSection.maxSize,
            	height: $scope.calibrationSection.maxSize
            };
        }

        return angular.copy(sketchinfo);
    }

	function getMax(points) {
	    var area = 0;
	    var j = points.length - 1;

	    for (var i = 0; i < points.length; i++)
	    {
	      area = area + (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]); 
	      j = i;
	    }

	    var areaSize = Math.ceil(Math.abs(area/2));
	    var calSize = {
	    	width: ($scope.calibrationSection.coordinates[2][0] - $scope.calibrationSection.coordinates[0][0]),
	    	height: ($scope.calibrationSection.coordinates[2][1] - $scope.calibrationSection.coordinates[0][1])
	    };

	    var max = areaSize / (calSize.width * calSize.height);
	    return Math.ceil(max);
	}

	/* Collapse End
	----------------------------------------------*/

	$rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args) {
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var modifiedDirection = args[3];
        var vaLinesIndex = null;
        var vaAreaIndex = null;

        console.info("updateCoordinates", modifiedIndex, modifiedType, modifiedPoints, modifiedDirection);

        var coordinates = [];
        var mode = [];

        if($scope.currentTapStatus[0] === true){ //Configuration
        	$scope.queueListSection.changeQueue(modifiedIndex);
        	sketchbookService.activeShape(modifiedIndex);

        	$scope.realtimeSection.coordinates[modifiedIndex].points = modifiedPoints;

        	var max = getMax(modifiedPoints);
        	$scope.queueLevelSection.changeValue('max', max);
        	if(max < getPeopleData().high){
        		$scope.queueLevelSection.changeValue('high', max);
        	}
        }else if($scope.currentTapStatus[1] === true){ //Calibration
        	$scope.calibrationSection.coordinates = modifiedPoints;
        }
    }, $scope);

	/* Destroy Area Start
	------------------------------------------ */
    $scope.$on('$stateChangeStart',function (event, toState, toParams, fromState, fromParams) {
        if(fromState.controller === 'QMSetupCtrl'){
			// pcModalService.close();
			// $scope.countingSection.polling.stop();
			// asyncInterrupt = true;
			$scope.queueLevelSection.stop();
        }
    });
	/* Destroy Area End
	------------------------------------------ */

	function view(){
		var failCallback = function(errorData){
			alert(errorData);
			$scope.pageLoaded = true;
		};

		showVideo().then(function(){
			$scope.init().then(function(){
				$scope.pageLoaded = true;
			}, failCallback);
		}, failCallback);
	}

	function set(needRefresh){
		var data = $scope.queueData;

		var setData = {};
		setData.Channel = channel;
		setData.Enable = data.Enable;
		setData.CalibrationMode = data.CalibrationMode;
		setData.ObjectSizeCoordinates = [
			$scope.calibrationSection.coordinates[0].join(),
			$scope.calibrationSection.coordinates[2].join()
		].join();

		for(var i = 1; i <= data.Queues.length; i++){
			var j = i - 1;
			var queue = data.Queues[j];
			setData['Queue.' + i + '.Enable'] = queue.Enable;
			setData['Queue.' + i + '.MaxPeople'] = queue.MaxPeople;
			setData['Queue.' + i + '.Name'] = queue.Name;
			setData['Queue.' + i + '.Level.High.AlarmEnable'] = queue.QueueTypes[0].AlarmEnable;
			setData['Queue.' + i + '.Level.High.Count'] = queue.QueueTypes[0].Count;
			setData['Queue.' + i + '.Level.High.Threshold'] = queue.QueueTypes[0].Threshold;
			setData['Queue.' + i + '.Level.Medium.AlarmEnable'] = queue.QueueTypes[1].AlarmEnable;
			setData['Queue.' + i + '.Level.Medium.Count'] = queue.QueueTypes[1].Count;
			setData['Queue.' + i + '.Level.Medium.Threshold'] = queue.QueueTypes[1].Threshold;
			setData['Queue.' + i + '.Coordinates'] = $scope.coordinates[j].points.join();
		}

		$scope.pcSetupReport.setReport();
		qmModel.setData(
			setData, 
			function(responseData){
				console.info(responseData);
			}, 
			function(errorData){
				console.info(errorData);
			}
		);
	}

	$scope.submitEnable = function(){
		var modalInstance = $uibModal.open({
	        templateUrl: 'views/setup/common/confirmMessage.html',
	        controller: 'confirmMessageCtrl',
	        size: 'sm',
	        resolve: {
	            Message: function() {
	                return 'lang_apply_question';
	            }
	        }
	    });

	    modalInstance.result.then(
	    	function() {
		        qmModel
					.setData({
						Enable: $scope.queueData.Enable
					})
					.then(
						function(successData){
							$timeout($scope.init);
						}, 
						function(errorData){
							console.error(errorData);
						}
					);
		    }, 
		    function(){
		    	$scope.queueData.Enable = !$scope.queueData.Enable;
		    }
		);
	};

	function setValidation(){
		var data = $scope.queueData.Queues;
		var isOk = true;
		var alertMessage = '';

		if(data.length !== 0){
			if(
				(data[0].Name === '' && data[0].Enable === true) ||
				(data[1].Name === '' && data[1].Enable === true) ||
				(data[2].Name === '' && data[2].Enable === true)
				){
				isOk = false;
				alertMessage = $translate.instant('lang_msg_noname');
			}

			if(isOk === false){
				COMMONUtils.ShowError(alertMessage);
			}
		}

		return isOk;
	}

	$scope.submit = function(needRefresh){
		if(setValidation()){
			if($scope.pcSetupReport.validate()){
				COMMONUtils.ApplyConfirmation(function(){
					set(needRefresh);
				});
			}
		}
	};
	$scope.view = view;

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
                currentPage: 'Queue'
            };
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

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