/* global sessionStorage */
kindFramework.controller('PCSetupCtrl', 
	function (
		$scope, 
		$timeout, 
		$interval,
		
		$uibModal, 
		$state, 
		$translate,

		PcSetupModel,
		PCLinePainter, 
		PCRectanglePainter, 
		pcModalService,
		pcSetupService,

		ConnectionSettingService, 
		Attributes,
		COMMONUtils
		){
	"use strict";

	var asyncInterrupt = false;

	var mAttr = Attributes.get();

	var pcSetupModel = new PcSetupModel();
	$scope.lang = pcSetupModel.getStLang();

	$scope.pageLoaded = false;

	//Playerdata for Video
	$scope.playerdata = null;

	/* Counting Start
	----------------------------------------------*/

	function changeModeToArrow(mode){
		return mode === "LeftToRightIn" ? "in" : "out";
	}

	function changeArrowToMode(arrow){
 		return arrow === "in" ? "LeftToRightIn" : "RightToLeftIn";
	}

	function setMaxResolution(){
        return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
	}

	function setRealTimeSize(){
		var defaultResolution = pcSetupService.getDefaultResolution();
		var liveSvg = document.getElementById("pc-realtime-live-svg");
		var calibrationCanvas = document.getElementById("pc-realtime-calibration");
		// var roundRuleGuide = document.getElementById("pc-round-rule-guide");

		liveSvg.setAttributeNS(null, 'width', defaultResolution.width);
		liveSvg.setAttributeNS(null, 'height', defaultResolution.height);

		calibrationCanvas.setAttribute('width', defaultResolution.width);
		calibrationCanvas.setAttribute('height', defaultResolution.height);
		
		// var roundSize = Math.ceil(defaultResolution.height * 0.7) + 'px';
		// roundRuleGuide.style.width = roundSize;
		// roundRuleGuide.style.height = roundSize;

		document.querySelector('.pc-realtime-video').style.height = defaultResolution.height + 'px';
	}

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

		setRealTimeSize();

		var getRuleInfo = pcSetupModel.getRuleInfo();

		getRuleInfo.then(function(data){
			//$scope.destory interrupt
			if(asyncInterrupt === true) return;

			//Counting Rule Validation
			var haveRule = false;

			//Draw Line of Counting Rule in Video
			var todayRuleData = [];
			var countingRuleData = [];

			for(var i = 0, len = data.Lines.length; i < len; i++){
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

			for(var i = 0, len = data.Lines.length; i < len; i++){
				var self = data.Lines[i];
				var inCount = self.Enable === true ? self.InCount : '';
				var outCount = self.Enable === true ? self.OutCount : '';
				var changedAxis = [];
				var lineOptions = {};

				//If Coordinates is Default.
				if(self.Coordinates[0].x === 10 && self.Coordinates[1].x === 40){
					changedAxis = [
						{
							x: 40,
							y: 40 * (i + 1)
						},

						{
							x: 160,
							y: 40 * (i + 1)
						}
					];
				}else{
					changedAxis = pcSetupModel.changeResolution([
						{
							x: parseFloat(self.Coordinates[0].x),
							y: parseFloat(self.Coordinates[0].y)
						},
						{
							x: parseFloat(self.Coordinates[1].x),
							y: parseFloat(self.Coordinates[1].y)
						}
					], 1);	
				}

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
					lineStrokeWidth: 5,
					circleRadius: 8,
					x1: changedAxis[0].x,
					y1: changedAxis[0].y,
					x2: changedAxis[1].x,
					y2: changedAxis[1].y,
					textInCircle: self.LineIndex,
					useArrow: true,
					arrow: changeModeToArrow(self.Mode),
					useEvent: true,
					useCursor: true
				};

				if(self.Enable){
					$scope.linePainterController.create(self.LineIndex - 1, lineOptions);
				}else{
					$scope.linePainterController.addBackupData(self.LineIndex - 1, lineOptions);
				}
			}

			//Set Line of Counting Rule in Table
			$scope.countingSection.setTodayRuleData(todayRuleData);
			$scope.countingRuleSection.setData(countingRuleData);

			//set peoplecount enable
			$scope.countingRuleSection.peopleCountingEnable = data.Enable;

			//set Calibration Box
			var calibration = data.ObjectSizeCoordinate;
			var defaultResolution = pcSetupService.getDefaultResolution();
			var defaultCalibarationSize = defaultResolution.height * 0.08;

			if(
				calibration[0].x === 0 &&
				calibration[0].y === 0 &&
				calibration[1].x === 120 &&
				calibration[1].y === 120
				){
				calibration[0].x = 0;
				calibration[0].y = 0;
				calibration[1].x = defaultCalibarationSize;
				calibration[1].y = defaultCalibarationSize;
			}else{
				calibration = pcSetupModel.changeResolution([
					{
						x: calibration[0].x,
						y: calibration[0].y
					},
					{
						x: calibration[1].x,
						y: calibration[1].y
					}
				], 1);
			}

			var calibrationData = {};

			if($scope.rectanglePainterController.isSet === true){
				calibrationData = $scope.rectanglePainterController.rectangleObject.getAxis()[0];
			}else{
				calibrationData = {
					x1: calibration[0].x,
					y1: calibration[0].y,
					x2: calibration[1].x,
					y2: calibration[1].y
				};
			}

			$scope.rectanglePainterController.setBackupData(calibrationData);
			$scope.rectanglePainterController.create();

			//Start Polling for counting
			if(data.Enable === true && haveRule === true){
				$scope.countingSection.polling.start();	
			}

			try{
				if(data.CalibrationMode){
					var cameraHeight = mAttr.CameraHeight;
					var options = mAttr.CalibrationMode;

					$scope.calibrationSection.init(
						data.CalibrationMode, 
						data.CameraHeight, 
						cameraHeight.minValue, 
						cameraHeight.maxValue, 
						options
					);
				}	
			}catch(e){
				console.error(e);
			}

		}, function(){
			$scope.countingSection.setUndefinedRule();
		});

		return getRuleInfo;
	};

	$scope.openFTPEmail = function() {
    	$state.go('^.event_ftpemail');
    };

    $scope.rectanglePainterController = {
		setPainter: function(){
			//reset 
			if($scope.rectanglePainterController.painter !== null){
				$scope.rectanglePainterController.painter.unbindEvent();	
			}

			$scope.rectanglePainterController.painter = new PCRectanglePainter(document.getElementById("pc-realtime-calibration"));
		},
		isSet: false,
		painter: null,
		rectangleObject: null,
		backupData: {},
		getState: function(){
			return $scope.rectanglePainterController.isSet;
		},
		setBackupData: function(data){
			$scope.rectanglePainterController.backupData = data;
		},
		bindEvent: function(){
			$scope.rectanglePainterController.painter.bindEvent();
		},
		unbindEvent: function(){
			$scope.rectanglePainterController.painter.unbindEvent();
		},
		create: function(options){
			if($scope.rectanglePainterController.painter !== null){
				$scope.rectanglePainterController.painter.clear();
			}
			$scope.rectanglePainterController.setPainter();

			if($scope.rectanglePainterController.backupData === {}){
				//Draw Default
				var defaultResolution = pcSetupService.getDefaultResolution();
				var defaultCalibarationSize = defaultResolution.height * 0.08;

				options = {
					x1: 0,
					y1: 0,
					x2: defaultCalibarationSize,
					y2: defaultCalibarationSize
				};
			}else{
				options = $scope.rectanglePainterController.backupData;
			}

			options.backgroundColor = 'rgba(251, 140, 0, 0.45)';
			options.lineColor = 'rgb(251, 140, 0)';
			options.lineWidth = 6;

			$scope.rectanglePainterController.rectangleObject = $scope.rectanglePainterController.painter.create(options);
			$scope.rectanglePainterController.isSet = true;
		}
    };
    
	$scope.linePainterController = {
		setPainter: function(){	
			$scope.linePainterController.painter = new PCLinePainter(document.getElementById("pc-realtime-live-svg"));
		},
		painter: null,
		lineObject: [null, null],
		backupData: [null, null],
		add: function(index, data){
			$scope.linePainterController.lineObject[index] = data;
		},
		addBackupData: function(index, data){
			$scope.linePainterController.backupData[index] = data;
		},
		remove: function(index){
			var lineObject = $scope.linePainterController.lineObject[index];
			$scope.linePainterController.backupData[index] = lineObject.getData();
			lineObject.remove();
			$scope.linePainterController.lineObject[index] = null;
		},
		destroy: function(){
			var lineObject = $scope.linePainterController.lineObject;
			if(lineObject.length > 0){
				for(var i = 0, len = lineObject.length; i < len; i++){
					if(lineObject[i] !== null){
						lineObject[i].destroy();	
					}
				}
			}
		},
		create: function(index, lineOptions){
			if($scope.linePainterController.painter === null){
				$scope.linePainterController.setPainter();
			}

			//If line is created already, return.
			if($scope.linePainterController.lineObject[index] !== null){
				return;
			}

			var lineObject = $scope.linePainterController.painter.createLine(lineOptions);
			$scope.linePainterController.add(index, lineObject);
		}
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
		data: [],
		regExp: pcSetupService.regExp.getAlphaNum(),
		setData: function(data){
			$scope.countingRuleSection.data = data;
		},
		peopleCountingEnable: false,
		changeUseState: function(index){
			if($scope.countingRuleSection.data[index] === undefined){
				$scope.countingRuleSection.data[index] = {
					use: false,
					name: '',
					index: index + 1
				};
			}

			if($scope.countingRuleSection.data[index].use === true){
				$scope.countingRuleSection.data[index].use = false;

				$scope.linePainterController.remove(index);
			}else{
				$scope.countingRuleSection.data[index].use = true;

				//Default 생성
				var backupData = $scope.linePainterController.backupData[index];

				if(backupData === null){
					backupData = {
						lineStrokeWidth: 5,
						circleRadius: 8,
						x1: 100,
						y1: 100 * (index + 1),
						x2: 500,
						y2: 100 * (index + 1),
						textInCircle: index + 1,
						useArrow: true,
						arrow: "in",
						useEvent: true,
						useCursor: true
					};
				}else{
					backupData.lineStrokeWidth = 5;
					backupData.circleRadius = 8;
					backupData.textInCircle = index + 1;
					backupData.useArrow = true;
					backupData.useEvent = true;
					backupData.useCursor = true;
				}

				$scope.linePainterController.create(index, backupData);
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

	$scope.currentTapStatus = [true, false];
	$scope.changeTabStatus = function(value){
		if(value === 1 && $scope.rectanglePainterController.getState() === false){
			$scope.rectanglePainterController.create();
		}else{
			$timeout(function () {
		        $scope.$broadcast('rzSliderForceRender');
		    }, 100);
		}

		for(var i = 0, len = $scope.currentTapStatus.length; i < len; i++){
			if(i === value){
				$scope.currentTapStatus[i] = true;
			}else{
				$scope.currentTapStatus[i] = false;
			}
		}
	};

	function getSliderColor() {
        if ($scope.calibrationSection.calibrationMode === "CameraHeight") {
            return mAttr.sliderEnableColor;
        } else {
            return mAttr.sliderDisableColor;
        }
    }

	$scope.calibrationSection = {
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
		calibrationMode: '',
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
				$scope.rectanglePainterController.unbindEvent();
			}else{
				section.cameraHeightOptions.disabled = true;
				section.iconStyle.color = getSliderColor();
				$scope.rectanglePainterController.bindEvent();
			}
		},
		setCalibratoinHeight: function(height){
			$scope.calibrationSection.cameraHeight.data = height / $scope.calibrationSection.ratio;
		},
		getCalibrationHeight: function(){
			return $scope.calibrationSection.cameraHeight.data * $scope.calibrationSection.ratio;
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
		init: function(mode, height, min, max, options){
			var section = $scope.calibrationSection;

			section.calibrationMode = mode;
			section.setCalibratoinHeight(height);

			section.cameraHeightOptions.floor = min / $scope.calibrationSection.ratio;
			section.cameraHeightOptions.ceil = max / $scope.calibrationSection.ratio;
			section.calibrationModeOptions = options;
			section.changeCalibrationMode();
		}
	};

	$scope.addSlaveCamera = function(){
        pcModalService.openAlert({
        	title: $scope.lang.modal.failAddingSlave,
        	message: $scope.lang.modal.failAddingSlaveMessage
        }).then(function(){
        	console.log("Ok");
        }, function(){
        	console.log("cancel");
        });
	};

	/* Collapse End
	----------------------------------------------*/

	/* Destroy Area Start
	------------------------------------------ */
	$scope.$on("$destroy", function(){
		$scope.linePainterController.destroy();
		pcModalService.close();
		$scope.countingSection.polling.stop();
		asyncInterrupt = true;
	});
	/* Destroy Area End
	------------------------------------------ */

	function view(){
		$scope.init().then(function(){
			$scope.pageLoaded = true;	

			pcSetupService.connectPreview(function(playerdata){
				$timeout(function(){
					$scope.playerdata = playerdata;
				});
			});
		}, function(errorData){
			console.log(errorData);
		});
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

	function set(){
		$scope.countingSection.polling.stop();

		var countRuleSectionData = $scope.countingRuleSection.data;
		var linePainterData = $scope.linePainterController.lineObject;

		var requestData = {};

		var failCallback = function(errorData){
			console.log(errorData);
		};

		for(var i = 0, len = countRuleSectionData.length; i < len ; i++){
			var ruleInfo = $scope.countingRuleSection.data[i];
			if(linePainterData[i] !== null){
				var linePainterItemData = linePainterData[i].getData();
				var changedAxis = pcSetupModel.changeResolution([
						{
							x: linePainterItemData.x1,
							y: linePainterItemData.y1
						},
						{
							x: linePainterItemData.x2,
							y: linePainterItemData.y2
						}
					], 0);

				var coordinates = [
					changedAxis[0].x,
					changedAxis[0].y,
					changedAxis[1].x,
					changedAxis[1].y
				];

				requestData['Line.' + ruleInfo.index + '.Name'] = ruleInfo.name;
				requestData['Line.' + ruleInfo.index + '.Coordinate'] = coordinates.join(',');

				requestData['Line.' + ruleInfo.index + '.Mode'] = changeArrowToMode(linePainterItemData.arrow);
			}
			requestData['Line.' + ruleInfo.index + '.Enable'] = ruleInfo.use;
		}

		//set People Counting use or unuse
		// this code is located in pcSetupReport.js
		// requestData['Enable'] = $scope.peopleCountingEnable;

		//set Calibaration box
		if($scope.rectanglePainterController.getState()){
			var currentCalibration = $scope.rectanglePainterController.rectangleObject.getAxis()[0];
			var changedAxis = pcSetupModel.changeResolution([
				{
					x: currentCalibration.x1,
					y: currentCalibration.y1
				},
				{
					x: currentCalibration.x2,
					y: currentCalibration.y2
				}
			], 0);

			requestData.ObjectSizeCoordinate = changedAxis[0].x + "," + changedAxis[0].y + ',' + changedAxis[1].x + "," + changedAxis[1].y;	
		}

		if("calibrationSection" in $scope){
			requestData.CalibrationMode = $scope.calibrationSection.calibrationMode;
			if($scope.calibrationSection.calibrationMode === $scope.calibrationSection.calibrationModeOptions[0]){
				requestData.CameraHeight = $scope.calibrationSection.getCalibrationHeight();	
			}
		}


		pcSetupModel
			.setRuleInfo(requestData)
			.then(function(successData){
				$scope
					.pcSetupReport
					.setReport()
					.then(function(){
						$timeout($scope.init);
					}, failCallback);
			}, failCallback);
	}

	$scope.submit = function(){
		if(setValidation()){
			if($scope.pcSetupReport.validate()){
				COMMONUtils.ApplyConfirmation(set);		
			}
		}
	};
	$scope.view = view;

	(function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            try{
                Attributes.getAttributeSection().then(function(){
                    console.log("Attributes.getAttributeSection()");
                    mAttr = Attributes.get();
                    view();
                });
            }catch(e){
                view();
            }
        }
	})();
});