/* global sessionStorage */
kindFramework.controller('PCSetupCtrl', 
	function (
		$rootScope,
		$scope, 
		$timeout, 
		$interval,
		
		$uibModal, 
		$state, 
		$translate,

		PcSetupModel,
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

	$scope.support = {
		isFisheyeLens: mAttr.FisheyeLens
	};

	var pcSetupModel = new PcSetupModel();
	$scope.lang = pcSetupModel.getStLang();

	$scope.pageLoaded = false;

	//Playerdata for Video
	$scope.playerdata = null;

	$scope.coordinates = [];
	$scope.sketchinfo = {};

	/* Counting Start
	----------------------------------------------*/

	function changeModeToArrow(mode){
		return mode === "LeftToRightIn" ? 0 : 1;
	}

	function changeArrowToMode(arrow){
 		return arrow === 'L' ? "LeftToRightIn" : "RightToLeftIn";
	}

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

	// function setRealTimeSize(){
	// 	var defaultResolution = pcSetupService.getDefaultResolution();
	// 	var liveSvg = document.getElementById("pc-realtime-live-svg");
	// 	var calibrationCanvas = document.getElementById("pc-realtime-calibration");
	// 	// var roundRuleGuide = document.getElementById("pc-round-rule-guide");

	// 	liveSvg.setAttributeNS(null, 'width', defaultResolution.width);
	// 	liveSvg.setAttributeNS(null, 'height', defaultResolution.height);

	// 	calibrationCanvas.setAttribute('width', defaultResolution.width);
	// 	calibrationCanvas.setAttribute('height', defaultResolution.height);
		
	// 	// var roundSize = Math.ceil(defaultResolution.height * 0.7) + 'px';
	// 	// roundRuleGuide.style.width = roundSize;
	// 	// roundRuleGuide.style.height = roundSize;

	// 	document.querySelector('.pc-realtime-video').style.height = defaultResolution.height + 'px';
	// }

	$scope.init = function(){

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

		// setRealTimeSize();

		var getRuleInfo = pcSetupModel.getRuleInfo();

		getRuleInfo.then(function(data){
			//$scope.destory interrupt
			if(asyncInterrupt === true){ return;}

			//Counting Rule Validation
			var haveRule = false;

			//Draw Line of Counting Rule in Video
			var todayRuleData = [];
			var countingRuleData = [];
      var i = 0;
      var len = 0;
      var ii = 0;
      var self = '';

			for(i = 0, len = data.Lines.length; i < len; i++){
				if(data.Lines[i].Enable === true){
					haveRule = true;
				}
			}

			if(data.Enable === false){
				$scope.countingSection.setDisabledPeoplecountStatus();
				$scope.countingSection.resetUndefinedRule();
			}else{
				$scope.countingSection.resetDisabledPeoplecountStatus();				

				if(haveRule === false){
					$scope.countingSection.setUndefinedRule();
				}else{
					$scope.countingSection.resetUndefinedRule();
				}
			}

			for(i = 0, len = data.Lines.length; i < len; i++){
				self = data.Lines[i];
				var inCount = self.Enable === true ? self.InCount : '';
				var outCount = self.Enable === true ? self.OutCount : '';
				var lineOptions = {};

				todayRuleData.push({
					index: self.LineIndex,
					name: self.Name,
					in: inCount,
					out: outCount,
					enable: self.Enable
				});

				countingRuleData.push({
					index: self.LineIndex,
					name: self.Name,
					use: self.Enable
				});

				lineOptions = {
					x1: self.Coordinates[0].x,
					y1: self.Coordinates[0].y,
					x2: self.Coordinates[1].x,
					y2: self.Coordinates[1].y,
					textInCircle: self.LineIndex,
					arrow: self.Mode,
					enable: self.Enable
				};

				$scope.countingRuleSection.updateLine(self.LineIndex - 1, lineOptions);
			}

			//Set Line of Counting Rule in Table
			$scope.countingSection.setTodayRuleData(todayRuleData);
			$scope.countingRuleSection.setData(countingRuleData);
			$scope.countingRuleSection.checkAllStatus();

			//set peoplecount enable
			$scope.countingRuleSection.peopleCountingEnable = data.Enable;

			//set Calibration Box
			var calibration = data.ObjectSizeCoordinate;
			var defaultResolution = pcSetupService.getDefaultResolution();
			var maxResolution = pcSetupService.getMaxResolution();
			var calibrationMinSize = 0;
			var calibrationMaxSize = 0;

			/*
			Calibration guide box의 최소, 최대 크기는 다음과 같고, 최소보다 작거나 최대보다 크게 설정할 수 없다

			- 최소 : View 영상의 가로세로 중 짧은 길이의 10%
			- 최대 : View 영상의 가로세로 중 긴 길이의 50%

			* GUI View 영상 640x480 경우

			- 최소 : 48 x 48 [pixels]
			- 최대 : 320 x 320 [pixels]
			*/
			if(defaultResolution.height > defaultResolution.width){
				calibrationMaxSize = maxResolution.height * 0.5;
				calibrationMinSize = maxResolution.width * 0.1;
			}else{
				calibrationMaxSize = maxResolution.width * 0.5;
				calibrationMinSize = maxResolution.height * 0.1;
			}

			//Calibration 좌표 설정
			$scope.calibrationSection.data = {
				x1: calibration[0].x,
				y1: calibration[0].y,
				x2: calibration[1].x,
				y2: calibration[1].y,
				minSize: calibrationMinSize,
				maxSize: calibrationMaxSize,
			};

			//Exclude Area 임의 설정
			try{
				//초기화
				for(i = 0; i < 4; i++){
					$scope.excludeAreaSection.update(i, {
						points: [],
        				isEnable: false,
        				isSelected: false
					});
				}

				if("Areas" in data){
					for (i = 0, ii = data.Areas.length; i < ii; i++){
						self = data.Areas[i];
						var coordinates = self.Coordinates;
						var points = [];

						for(var j = 0, jj = coordinates.length; j < jj; j++){
							var jSelf = coordinates[j];
							points.push([
								jSelf.x,
								jSelf.y
							]);
						}

						$scope.excludeAreaSection.update(self.Area - 1, {
							points: points,
	        				isEnable: true,
	        				isSelected: false
						});	
					}
				}

				$scope.excludeAreaSection.backup();
			}catch(e){
				console.error(e);
			}

			//Start Polling for counting
			if(data.Enable === true && haveRule === true){
				$scope.countingSection.polling.start();	
			}

			try{
				var cameraHeight = typeof mAttr.CameraHeight === "undefined" ? 
					{
						minValue: 0,
						maxValue: 0
					} : mAttr.CameraHeight;
				var options = mAttr.CalibrationMode;

				/**
				 * FisheyeLens가 아닌 데, Calibration Mode 가 CameraHeight 이면
				 * CalibrationMode를 정상적으로 설정가능하게, ObjectSize로 넘겨준다.
				 */
				if(
					'CameraHeight' === data.CalibrationMode &&
					!!$scope.support.isFisheyeLens === false){
					data.CalibrationMode = $scope.calibrationSection.calibrationModeOptions[1];
				}

				$scope.calibrationSection.init(
					data.CalibrationMode, 
					data.CameraHeight, 
					cameraHeight.minValue, 
					cameraHeight.maxValue, 
					options
				);
			}catch(e){
				console.error(e);
			}

			//Default Setting
			var activedTab = $scope.currentTapStatus.indexOf(true);
			$scope.changeTabStatus(activedTab);
		}, function(){
			$scope.countingSection.setUndefinedRule();
		});

		return getRuleInfo;
	};

	$scope.openFTPEmail = function() {
    	$state.go('^.event_ftpemail');
    };
    
	$scope.countingSection = {
		todayRuleData: [],
    setTodayRuleData: function(data){
      $scope.countingSection.todayRuleData = data;
    },
		isDisabledAllRule: false,
		isPeopleCountDisabled: false,
		setUndefinedRule: function(){
			$scope.countingSection.isDisabledAllRule = true;
		},
		resetUndefinedRule: function(){
			$scope.countingSection.isDisabledAllRule = false;
		},
		setDisabledPeoplecountStatus: function(){
			$scope.countingSection.isPeopleCountDisabled = true;
		},
		resetDisabledPeoplecountStatus: function(){
			$scope.countingSection.isPeopleCountDisabled = false;
		},
		polling: {
				timer: null,
				start: function(){
					$scope.countingSection.polling.timer = $interval(function(){
						pcSetupModel.getCurrentCountingData().then(function(data){
							for(var i = 0, len = data.length; i < len; i++){
								var item = data[i];

								if($scope.countingSection.todayRuleData[i].enable === true){
									$scope.countingSection.todayRuleData[i].in = item.inCount;
									$scope.countingSection.todayRuleData[i].out = item.outCount;	
								}
							}
						}, function(errorCode){
							console.error(errorCode);
						});
					}, 3000);
				},
				stop: function(){
					if($scope.countingSection.polling.timer !== null){
						$interval.cancel($scope.countingSection.polling.timer);
					}
				}
			}
	};
	/* Counting End
	----------------------------------------------*/

	/* Counting Rule Start
	----------------------------------------------*/
	$scope.countingRuleSection = {
		lineObject: [null, null],
		updateLine: function(index, data){
			$scope.countingRuleSection.lineObject[index] = data;
		},
		data: [],
		regExp: pcSetupService.regExp.getAlphaNum(),
		setData: function(data){
			$scope.countingRuleSection.data = data;
		},
		allEnableStatus: false,
		peopleCountingEnable: false,
		enableStatusAll: function(){
			for(var i = 0, ii = $scope.countingRuleSection.data.length; i < ii; i++){
				$scope.countingRuleSection.data[i].use = $scope.countingRuleSection.allEnableStatus;
				$scope.countingRuleSection.changeUseState(i);
			}
		},
		checkAllStatus: function(){
			var isOk = true;
			for(var i = 0, ii = $scope.countingRuleSection.data.length; i < ii; i++){
				if($scope.countingRuleSection.data[i].use === false){
					isOk = false;
				}
			}

			$scope.countingRuleSection.allEnableStatus = isOk;
		},
		changeUseState: function(index, isCheckingAllStatus){
			if($scope.countingRuleSection.data[index].use === true){
				$scope.countingRuleSection.lineObject[index].enable = true;

				//데이터가 있고 Disable로 되있을 때
				if($scope.coordinates[index].isSet === false){
					$scope.changeTabStatus(0);
				}else{
					sketchbookService.showGeometry(index);	
				}
			}else{
				$scope.countingRuleSection.lineObject[index].enable = false;
				sketchbookService.hideGeometry(index);
			}

			if(isCheckingAllStatus){
				$scope.countingRuleSection.checkAllStatus();
			}
		},
		openRuleGuide: function(){
			pcModalService.openAlert({
				title: $scope.lang.modal.ruleGuide,
				view: 'views/setup/peoplecounting/modals/rule_guide.html',
				size: 'md'
			});
		}
	};

	/* Counting Rule End
	----------------------------------------------*/

	/* Collapse Start
	----------------------------------------------*/

	/** 
	 * @variable {Array} currentTabStatus 탭 활성화/비활성화 표시, 실재로 보이는 영역과 다름
	 * @variable {Boolean} currentTabStatus[0] Configuration 탭
	 * @variable {Boolean} currentTabStatus[1] Exclude Area 탭
	 * @variable {Boolean} currentTabStatus[2] Calibration 탭
	 */
	$scope.currentTapStatus = [true, false, false];
	$scope.changeTabStatus = function(value){
		var flag = '';
		// if(value === 1 && $scope.rectanglePainterController.getState() === false){
		// 	$scope.rectanglePainterController.create();
		// }else{
		// 	$timeout(function () {
		//         $scope.$broadcast('rzSliderForceRender');
		//     }, 100);
		// }

		for(var i = 0, len = $scope.currentTapStatus.length; i < len; i++){
			if(i === value){
				$scope.currentTapStatus[i] = true;
			}else{
				$scope.currentTapStatus[i] = false;
			}
		}

		//Configuration
		if($scope.currentTapStatus[0] === true){
			flag = 'line';
		}else if($scope.currentTapStatus[1] === true){
			flag = 'area';
		}else if($scope.currentTapStatus[2] === true){
			flag = 'calibration';
		}

		$scope.sketchinfo = getSketchinfo(flag);


		//초기에 Camera Height 로 설정되어 있을 시 영역 숨기기
		if($scope.currentTapStatus[2] === true 
			&& $scope.calibrationSection.calibrationMode === 'CameraHeight'){
			setTimeout(function(){
				sketchbookService.hideGeometry(0);	
			});
		}
	};

	function getSketchinfo(flag){
		var sketchinfo = {
			shape: 1,
			modalId: "./views/setup/common/confirmMessage.html"
		};
		$scope.coordinates = [];
		var data = null;
		var convertedData = [];
    var i = 0;
    var ii = 0;
    var self = '';
    var coordinatesInfo = {};
    var maxResolution = 0;
        //Exclude Area
        if(flag === "area") {
        	for(i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
        		self = $scope.excludeAreaSection.data[i];
        		var isEmpty = self.points.length === 0;
        		coordinatesInfo = {
        			isSet: !isEmpty,
        			enable: self.isEnable,
        			points: self.points
        		};

        		$scope.coordinates.push(coordinatesInfo);
        	}

        	sketchinfo.workType = 'fdArea';
        	sketchinfo.maxNumber = 4;
        	sketchinfo.color = 1;
        //Configuration
        }else if(flag === "line") {
        	for(i = 0, ii = $scope.countingRuleSection.lineObject.length; i < ii; i++){
        		self = $scope.countingRuleSection.lineObject[i];
        		coordinatesInfo = {
        			isSet: self.enable,
        			enable: self.enable,
        			points: [],
        			direction: null
        		};
        		maxResolution = pcSetupService.getMaxResolution();

        		if(self !== null){
        			coordinatesInfo.points[0] = [self.x1, self.y1];
        			coordinatesInfo.points[1] = [self.x2, self.y2];
        			coordinatesInfo.direction = changeModeToArrow(self.arrow);
        			coordinatesInfo.textInCircle = self.textInCircle;
        		}

        		$scope.coordinates.push(coordinatesInfo);
        	}

        	sketchinfo.workType = 'peoplecount';
        	sketchinfo.maxNumber = 2;
        	sketchinfo.maxArrow = 'R';
        	sketchinfo.color = 0;
        	sketchinfo.minLineLength = Math.ceil(120/640 * maxResolution.width);
        //Calibration
        } else if(flag === "calibration") {
        	data = $scope.calibrationSection.data;
        	convertedData = $scope.calibrationSection.getCoordinatesForSketchbook();
            $scope.coordinates = [
            	{
        			isSet: true,
        			enable: true,
            		points: convertedData
            	}
            ];

        	sketchinfo.workType = 'calibration';
        	sketchinfo.maxNumber = 1;
            /**
            최대 사이즈는 영상의 가로, 세로 중 큰쪽의 50%,
            최소 사이즈는 영상의 가로, 세로 중 작은 쪽의 3%
            */
            sketchinfo.minSize = {
            	width: data.minSize,
            	height: data.minSize
            };
            sketchinfo.maxSize = {
            	width: data.maxSize,
            	height: data.maxSize
            };
        }

        return angular.copy(sketchinfo);
    }

	function getSliderColor() {
        if ($scope.calibrationSection.calibrationMode === "CameraHeight") {
            return mAttr.sliderEnableColor;
        } else {
            return mAttr.sliderDisableColor;
        }
    }

    $scope.excludeAreaSection = {
    	data: [],
    	backupData: [],
    	update: function(index, data){
    		$scope.excludeAreaSection.data[index] = data;
    	},
    	backup: function(){
    		$scope.excludeAreaSection.backupData = angular.copy($scope.excludeAreaSection.data);
    	},
    	updatePoints: function(index, points){
    		$scope.excludeAreaSection.data[index].points = points;
    	},
    	select: function(index){
    		for(var i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
    			$scope.excludeAreaSection.data[i].isSelected = i === index;
    		}

    		sketchbookService.activeShape(index);
    	}
    };

	$scope.calibrationSection = {
		data: {
			x1: 0,
			y1: 0,
			x2: 0,
			y2: 0
		},
		ratio: 100,
		cameraHeight: {
			data: 0
		},
		cameraHeightOptions: {
            floor: 2.5,
            ceil: 4.5,
            precision: 1,
            showSelectionBar: true,
            getSelectionBarColor: getSliderColor,
            getPointerColor: getSliderColor,
            disabled: false,
            step: 0.1,
	        vertical: false,
	        showInputBox: true,
            translate: function(value){
        		return value + 'm';
            }
		},
		calibrationMode: 'ObjectSize',
		calibrationModeOptions: [
			'CameraHeight',
			'ObjectSize'
		],
		iconStyle: {
			color: mAttr.sliderDisableColor
		},
		changeCalibrationMode: function(){
			var section = $scope.calibrationSection;
			
			if(section.calibrationMode === section.calibrationModeOptions[0]){
				section.cameraHeightOptions.disabled = false;
				section.iconStyle.color = '';
				sketchbookService.hideGeometry(0);
			}else{
				section.cameraHeightOptions.disabled = true;
				section.iconStyle.color = getSliderColor();
				sketchbookService.showGeometry(0);
			}
		},
		setCalibratoinHeight: function(height){
			$scope.calibrationSection.cameraHeight.data = height / $scope.calibrationSection.ratio;
		},
		getCalibrationHeight: function(){
			return Math.ceil($scope.calibrationSection.cameraHeight.data * $scope.calibrationSection.ratio);
		},
		upCameraHeight: function(){
			var section = $scope.calibrationSection;
			if(section.calibrationMode !== section.calibrationModeOptions[0]){
				return;
			}
			if(section.cameraHeight.data < section.cameraHeightOptions.ceil){
				section.cameraHeight.data = section.cameraHeight.data + section.cameraHeightOptions.step;
				section.cameraHeight.data = parseFloat(section.cameraHeight.data.toFixed(1));
			}
		},
		downCameraHeight: function(){
			var section = $scope.calibrationSection;
			if(section.calibrationMode !== section.calibrationModeOptions[0]){
				return;
			}
			if(section.cameraHeight.data > section.cameraHeightOptions.floor){
				section.cameraHeight.data = section.cameraHeight.data - section.cameraHeightOptions.step;
				section.cameraHeight.data = parseFloat(section.cameraHeight.data.toFixed(1));
			}
		},
		/**
		 * 영상 모드가 Flip, Mirror, Rotate(90 or 270) 일 때
		 * Calibration의 Coordinate인 (x1, y1) (x2, y2) 의 순서가 다르므로
		 * Sketchbook 에서 항상 적상적으로 나올 수 있게 변경
		 */
		getCoordinatesForSketchbook: function(){
			var calibrationData = $scope.calibrationSection.data;
			var points = [[],[],[],[]];

			if(calibrationData.x1 < calibrationData.x2){
				points[0][0] = calibrationData.x1;
				points[1][0] = calibrationData.x1;
				points[3][0] = calibrationData.x2;
				points[2][0] = calibrationData.x2;
			}else{
				points[0][0] = calibrationData.x2;
				points[1][0] = calibrationData.x2;
				points[3][0] = calibrationData.x1;
				points[2][0] = calibrationData.x1;
			}

			if(calibrationData.y1 < calibrationData.y2){
				points[0][1] = calibrationData.y1;
				points[1][1] = calibrationData.y1;
				points[3][1] = calibrationData.y2;
				points[2][1] = calibrationData.y2;
			}else{
				points[0][1] = calibrationData.y2;
				points[1][1] = calibrationData.y2;
				points[3][1] = calibrationData.y1;
				points[2][1] = calibrationData.y1;	
			}

			return points;
		},
		/**
		 * Sketchbook에서 정상적인 모양으로 데이터를 넘겨주면
		 * SUNAPI에서 받은 Calibration의 Coordinates 순서와 동일하게 변경한다.
		 */
		updateCoordinatesForSunapi: function(pointsFromSketchbook){
			var calibrationData = $scope.calibrationSection.data;
			var firstIndex = 0;
			var secondIndex = 0;

			if(calibrationData.x1 < calibrationData.x2 && calibrationData.y1 < calibrationData.y2){
				firstIndex = 0;
				secondIndex = 2;
			}else if(calibrationData.x1 > calibrationData.x2 && calibrationData.y1 > calibrationData.y2){
				firstIndex = 2;
				secondIndex = 0;
			}else if(calibrationData.x1 > calibrationData.x2 && calibrationData.y1 < calibrationData.y2){
				firstIndex = 3;
				secondIndex = 1;
			}else if(calibrationData.x1 < calibrationData.x2 && calibrationData.y1 > calibrationData.y2){
				firstIndex = 1;
				secondIndex = 3;
			}

			calibrationData.x1 = pointsFromSketchbook[firstIndex][0];
			calibrationData.y1 = pointsFromSketchbook[firstIndex][1];
			calibrationData.x2 = pointsFromSketchbook[secondIndex][0];
			calibrationData.y2 = pointsFromSketchbook[secondIndex][1];
		},
		init: function(mode, height, min, max, options){

			var section = $scope.calibrationSection;

			section.calibrationMode = mode;
			section.setCalibratoinHeight(height);

			section.cameraHeightOptions.floor = min / $scope.calibrationSection.ratio;
			section.cameraHeightOptions.ceil = max / $scope.calibrationSection.ratio;
			section.calibrationModeOptions = options;
		}
	};


	/* Collapse End
	----------------------------------------------*/

	$rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args) {
        var modifiedIndex = args[0];
        var modifiedType = args[1]; //생성: create, 삭제: delete
        var modifiedPoints = args[2];
        var modifiedDirection = args[3];

        if($scope.currentTapStatus[0] === true){ //Configuration
        	switch(modifiedType){
        		case "mouseup":
        			$scope.countingRuleSection.updateLine(modifiedIndex, {
        				x1: modifiedPoints[0][0],
        				y1: modifiedPoints[0][1],
        				x2: modifiedPoints[1][0],
        				y2: modifiedPoints[1][1],
        				textInCircle: modifiedIndex + 1,
        				arrow: changeArrowToMode(modifiedDirection),
        				enable: true
        			});
        		break;
        	}
        }else if($scope.currentTapStatus[1] === true){ //Exclude area
        	switch(modifiedType){
        		case 'create':
        			$scope.excludeAreaSection.update(modifiedIndex, {
        				points: modifiedPoints,
        				isEnable: true,
        				isSelected: false
        			});
        		break;
        		case 'mouseup':
        			$scope.excludeAreaSection.updatePoints(modifiedIndex, modifiedPoints);
        		break;
        		case 'delete':
        			$scope.excludeAreaSection.update(modifiedIndex, {
        				points: [],
        				isEnable: false,
        				isSelected: false
        			});
        		break;
        	}

        	if(modifiedType !== "delete"){
        		sketchbookService.activeShape(modifiedIndex);
        		$scope.excludeAreaSection.select(modifiedIndex);
        	}

        	$timeout(function(){});
        }else if($scope.currentTapStatus[2] === true){ //Calibration
        	$scope.calibrationSection.updateCoordinatesForSunapi(modifiedPoints);
        }
    }, $scope);

	/* Destroy Area Start
	------------------------------------------ */
	$scope.$on("$destroy", function(){
		pcModalService.close();
		$scope.countingSection.polling.stop();
		asyncInterrupt = true;
	});
	/* Destroy Area End
	------------------------------------------ */

	function view(){
		var failCallback = function(){
			$scope.pageLoaded = true;
		};

		showVideo().then(function(){
			$scope.init().then(function(){
				try{
					$scope.pcSetupReport.getReport();
				}catch(e){
          console.error(e);
        }
				$scope.pageLoaded = true;
			}, failCallback);
		}, failCallback);
	}

	function setValidation(){
		var countRuleSectionData = $scope.countingRuleSection.data;
		var isOk = true;
		var alertMessage = '';

		if(countRuleSectionData.length !== 0){
			if(
				(countRuleSectionData[0].name === '' && countRuleSectionData[0].use === true) ||
				(countRuleSectionData[1].name === '' && countRuleSectionData[1].use === true)
				){
				isOk = false;
				alertMessage = $scope.lang.ruleSetup.countingRule.noName;
			}else if(
					countRuleSectionData[0].name === countRuleSectionData[1].name &&
					countRuleSectionData[0].name !== '' &&
					countRuleSectionData[1].name !== ''
				){
				isOk = false;
				alertMessage = $scope.lang.ruleSetup.countingRule.duplicatedName;
			}

			if(isOk === false){
				COMMONUtils.ShowError(alertMessage);
				/*pcModalService.openAlert({
					title: $scope.lang.modal.alert,
					message: alertMessage
				});*/
			}
		}

		return isOk;
	}

	function set(needRefresh){
		$scope.countingSection.polling.stop();

		var countRuleSectionData = $scope.countingRuleSection.data;
		var linePainterData = $scope.countingRuleSection.lineObject;

		var requestData = {};
		var deleteAreaData = [];

		var failCallback = function(errorData){
			console.log(errorData);
		};

    var i = 0;
    var ii = 0;
    var len = 0;

		requestData.Enable = $scope.countingRuleSection.peopleCountingEnable;

		for(i = 0, len = countRuleSectionData.length; i < len ; i++){
			var ruleInfo = $scope.countingRuleSection.data[i];
			if(linePainterData[i].enable === true){
				var linePainterItemData = linePainterData[i];

				var coordinates = [
					linePainterItemData.x1,
					linePainterItemData.y1,
					linePainterItemData.x2,
					linePainterItemData.y2
				];

				requestData['Line.' + ruleInfo.index + '.Name'] = ruleInfo.name;
				requestData['Line.' + ruleInfo.index + '.Coordinate'] = coordinates.join(',');

				requestData['Line.' + ruleInfo.index + '.Mode'] = linePainterItemData.arrow;
			}

			requestData['Line.' + ruleInfo.index + '.Enable'] = ruleInfo.use;
		}

		//Exclude Area 저장
		for(i = 0, ii = $scope.excludeAreaSection.data.length; i < ii; i++){
			var self = $scope.excludeAreaSection.data[i];
			var backupSelf = $scope.excludeAreaSection.backupData[i];
			//Exclude Area이기 때문에 항상 Outside로 설정
			if(self.points.length > 0){
				requestData['Area.' + (i + 1) + '.Type'] = 'Outside';
				requestData['Area.' + (i + 1) + '.Coordinates'] = self.points.join(',');	
			}else if(backupSelf.points.length > 0){
				deleteAreaData.push(i + 1);
			}
		}

		//set People Counting use or unuse
		// this code is located in pcSetupReport.js
		// requestData['Enable'] = $scope.peopleCountingEnable;

		//set Calibaration box
		var calibrationData = $scope.calibrationSection.data;
		requestData.ObjectSizeCoordinate = [
			calibrationData.x1,
			calibrationData.y1,
			calibrationData.x2,
			calibrationData.y2
		].join(',');

		requestData.CalibrationMode = $scope.calibrationSection.calibrationMode;
		
		if($scope.calibrationSection.calibrationMode === 'CameraHeight'){
			requestData.CameraHeight = $scope.calibrationSection.getCalibrationHeight();	
		}

		pcSetupModel.
      setRuleInfo(requestData).
      then(function(){
				$scope.
          pcSetupReport.
          setReport().
          then(function(){
						var refresh = function(){
							$timeout(function(){
								if(needRefresh){
									view();
								}else{
									$scope.init();
								}
							});
						};

						if(deleteAreaData.length > 0){
				            if(deleteAreaData.length === 4){
				                deleteAreaData = ['All'];
				            }
							SunapiClient.get(
								'/stw-cgi/eventsources.cgi?msubmenu=peoplecount&action=remove', 
								{
									AreaIndex: deleteAreaData.join(',')
								}, 
								refresh, 
								failCallback, '', true);
						}else{
							refresh();
						}
					}, failCallback);
			}, failCallback);
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
	    modalInstance.result.then(function() {
	        pcSetupModel.
            setRuleInfo({
              Enable: $scope.countingRuleSection.peopleCountingEnable
            }).
            then(function(){
              $timeout($scope.init);
            }, function(errorData){
              console.error(errorData);
            });
	    }, function(){
	    	$scope.countingRuleSection.peopleCountingEnable = !$scope.countingRuleSection.peopleCountingEnable;
	    });
	};

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
                currentPage: 'PeopleCount'
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
            view();
        }
	})();
});