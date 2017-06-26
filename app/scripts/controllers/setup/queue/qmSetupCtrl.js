/* global sessionStorage */
kindFramework.controller('QMSetupCtrl',
  function(
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
    pcModalService,
    pcSetupService,

    ConnectionSettingService,
    Attributes,
    COMMONUtils,
    SunapiClient,
    sketchbookService
  ) {
    "use strict";

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

    function setMaxResolution() {
      return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
    }

    $scope.maxValues = [];
    var maxI = 50;
    for (var ii = 0; ii <= maxI; ii++) {
      $scope.maxValues[ii] = ii;
    }

    function getAttributes() {
      var defer = $q.defer();

      if (typeof mAttr.AlarmoutDurationOptions !== "undefined") {
        $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
      }

      if (typeof mAttr.QueueHighDuration !== "undefined") {
        $scope.queueEventSection.high.sliderProperty.floor = mAttr.QueueHighDuration.minValue;
        $scope.queueEventSection.high.sliderProperty.ceil = mAttr.QueueHighDuration.maxValue;
      }

      if (typeof mAttr.QueueMidDuration !== "undefined") {
        $scope.queueEventSection.medium.sliderProperty.floor = mAttr.QueueMidDuration.minValue;
        $scope.queueEventSection.medium.sliderProperty.ceil = mAttr.QueueMidDuration.maxValue;
      }

      if (typeof mAttr.FisheyeLens !== "undefined") {
        $scope.support.isFisheyeLens = mAttr.FisheyeLens;
      }

      $scope.eventSection.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);

      defer.resolve("success");
      return defer.promise;
    }

    $scope.init = function() {
      var deferred = $q.defer();
      /**
       * When page is setted newly, Scroll of Browser have to set the top.
       */
      $('.main.setup-wrapper').scrollTop(0);

      /**
       *  To send clearly the axis, Maximum Resolution should be setted.
       */
      if (setMaxResolution() === false) {
        console.error("Getting Maxinum Resolution of Video is Wrong!");
      }

      var failCallback = function(errorData) {
        $scope.pageLoaded = true;
        console.error(errorData);
      };

      qmModel.getData().then(
        function(data) {
          $scope.queueData = data;
          $scope.queueData.dataLoad = true;

          if (data.Enable === true) {
            //Realtime
            $scope.realtimeSection.init();
            //Queue List
            $scope.queueListSection.checkAllStatus();
            //Queue Level
            $scope.queueLevelSection.start();
            $scope.queueLevelSection.bindHtml();
            $scope.queueLevelSection.getRange();
            //Calibration
            // $scope.calibrationSection.init();
          }
          //Tab(Draw init)
          var activedTab = $scope.currentTapStatus.indexOf(true);
          $scope.changeTabStatus(activedTab);
          //Shape active
          $timeout(function() {
            activeShape($scope.queueListSection.selectedQueueId);
          });
          //Report
          $scope.reportSection.init();
          //Event action settings
          $scope.eventSection.init();
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
      init: function() {
        $scope.realtimeSection.coordinates = [];

        var datas = $scope.queueData.Queues;
        for (var ii = 0; ii < datas.length; ii++) {
          var points = [];
          var data = datas[ii].Coordinates;
          for (var jj = 0; jj < data.length; jj++) {
            points.push([data[jj].x, data[jj].y]);
          }

          $scope.realtimeSection.coordinates.push({
            points: points,
          });
        }
      },
    };

    $scope.queueListSection = {
      selectedQueueId: 0,
      regExp: pcSetupService.regExp.getAlphaNum(),
      allEnableStatus: false,
      changeQueue: function(id) {
        $scope.queueListSection.selectedQueueId = id;
        $scope.queueLevelSection.reload();
        $timeout(function() {
          activeShape(id);
          $scope.queueLevelSection.start();
        });
      },
      changeUseState: function(index, isCheckingAllStatus) {
        if ($scope.queueData.Queues[index].Enable === true) {
          sketchbookService.showGeometry(index);
        } else {
          sketchbookService.hideGeometry(index);
        }

        if (isCheckingAllStatus) {
          $scope.queueListSection.checkAllStatus();
        }
      },
      enableStatusAll: function() {
        for (var ii = 0, len = $scope.queueData.Queues.length; ii < len; ii++) {
          $scope.queueData.Queues[ii].Enable = $scope.queueListSection.allEnableStatus;
          $scope.queueListSection.changeUseState(ii);
        }
      },
      checkAllStatus: function() {
        var isOk = true;
        for (var ii = 0, len = $scope.queueData.Queues.length; ii < len; ii++) {
          if ($scope.queueData.Queues[ii].Enable === false) {
            isOk = false;
          }
        }

        $scope.queueListSection.allEnableStatus = isOk;
      },
    }

    function activeShape(modifiedIndex) {
      try {
        sketchbookService.activeShape(modifiedIndex);
        sketchbookService.moveTopLayer(modifiedIndex);
      } catch (errorData) {
        console.log(errorData);
      }
    }

    function getPercent(val, max) {
      var maxPercent = 100;
      return (val / max) * maxPercent;
    }

    function setInt(val) {
      return parseInt(val, 10);
    }

    function getPeopleData() {
      var selectedQueue = $scope.queueData.Queues[$scope.queueListSection.selectedQueueId];
      var max = selectedQueue.MaxPeople;
      var high = selectedQueue.QueueLevels[0].Count;
      var midCalc = 2;
      var medium = Math.ceil(high / midCalc);
      if (high === 1) {
        medium = 0;
      }

      return {
        max: max,
        high: high,
        medium: medium,
      };
    }

    var gaugeTimer = null;
    $scope.queueLevelSection = {
      maxArr: {},
      start: function() {
        $scope.queueLevelSection.stop();
        $scope.queueLevelSection.change();
        var time = 1000;
        gaugeTimer = setInterval(function() {
          $scope.queueLevelSection.change();
        }, time);
      },
      stop: function() {
        if (gaugeTimer !== null) {
          clearInterval(gaugeTimer);
          gaugeTimer = null;
        }
      },
      change: function() {
        var successCallback = function(response) {
          var queue = response[0].Count;
          var data = getPeopleData();

          var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];
          var maxPercent = 100;
          $("#qm-bar .qm-bar-mask").css({
            width: (maxPercent - getPercent(queue, data.max)) + "%",
          });

          //Bar 2
          var colorListIndex = {
            mid: {
              start: 0,
              end: 1,
            },
            high: {
              start: 2,
              end: 3,
            },
            max: {
              start: 4,
              end: 5,
            },
          };
          
          var startColor = null;
          var endColor = null;
          var elem = $(".qm-bar-wrap.qm-bar-setup");
          elem.find(".over").removeClass("over");

          if (queue < data.medium) {
            startColor = colorList[colorListIndex.mid.start];
            endColor = colorList[colorListIndex.mid.end];
          } else if (queue < data.high) {
            startColor = colorList[colorListIndex.high.start];
            endColor = colorList[colorListIndex.high.end];
            elem = elem.find(".qm-bar-mid");
          } else {
            startColor = colorList[colorListIndex.max.start];
            endColor = colorList[colorListIndex.max.end];
            elem = elem.find(".qm-bar-mid, .qm-bar-high");
          }

          elem.addClass("over");
          $("#qm-bar .qm-bar").css({
            background: "linear-gradient(to right, " + startColor + ", " + endColor + ")",
          });
        };

        var failCallback = function(failData) {
          console.error(failData);
        };

        qmModel.checkData({
          Channel: channel,
          QueueIndex: ($scope.queueListSection.selectedQueueId + 1),
        }).then(successCallback, failCallback);
      },
      resetBar: function() {
        $("#qm-bar .qm-bar-mask").css({
          width: "100%",
        });
        $(".qm-bar-wrap.qm-bar-setup").find(".over").removeClass("over");
      },
      setPosition: function() {
        var data = getPeopleData();

        var highLeft = data.high !== 0 ? getPercent(data.high, data.max) : 0;
        var mediumLeft = data.medium !== 0 ? getPercent(data.medium, data.max) : 0;

        $("#qm-bar .qm-bar-high").css("left", highLeft + "%");
        $("#qm-bar .qm-bar-mid").css("left", mediumLeft + "%");
      },
      bindHtml: function() {
        var data = getPeopleData();
        $("#qm-bar .qm-bar-max span").html(data.max);
        $("#qm-bar .qm-bar-high span").html(data.high);
        $("#qm-bar .qm-bar-mid span").html(data.medium);
      },
      getRange: function() {
        var data = getPeopleData();

        var arr = {};
        for (var ii = 0; ii < data.max; ii++) {
          arr[ii] = ii;
        }
        if (data.max === 0) {
          arr[0] = 0;
        }

        $scope.queueLevelSection.maxArr = arr;
      },
      changeValue: function(type, _val, _id) {
        var id = _id;
        var val = _val;
        if (!id) {
          id = $scope.queueListSection.selectedQueueId;
        }
        var data = getPeopleData();

        val = setInt(val);
        if (type === 'max') {
          var maxVal = 50;
          if (val > maxVal) {
            val = maxVal;
          }

          $scope.queueData.Queues[id].MaxPeople = val;

          if (val <= getPeopleData().high) {
            $scope.queueLevelSection.changeValue('high', (val - 1), id);
          }
        } else if (type === 'high') {
          if (val >= data.max) {
            val = data.max - 1;
          }
          if (val < 0) {
            val = 0;
          }
          $scope.queueData.Queues[id].QueueLevels[0].Count = val;
        }
      },
      reload: function(type) {
        if (type === 'max') {
          var max = $scope.queueData.Queues[$scope.queueListSection.selectedQueueId].MaxPeople;
          $scope.queueLevelSection.changeValue('max', max);
        }
        $scope.queueLevelSection.getRange();
        $scope.queueLevelSection.resetBar();
        $scope.queueLevelSection.bindHtml();
        $scope.queueLevelSection.setPosition();
      },
    };

    $scope.queueEventSection = {
      high: {
        sliderProperty: {
          ceil: 180,
          floor: 10,
          showSelectionBar: true,
          vertical: false,
          showInputBox: true,
          disabled: false,
          onEnd: function() {},
        },
      },
      medium: {
        sliderProperty: {
          ceil: 180,
          floor: 10,
          showSelectionBar: true,
          vertical: false,
          showInputBox: true,
          disabled: false,
          onEnd: function() {},
        },
      },
    };

    // $scope.calibrationSection = {
    // 	coordinates: [],
    // 	minSize: 0,
    // 	maxSize: 0,
    // 	init: function(){
    //     	var data = $scope.queueData.ObjectSizeCoordinates;
    //     	$scope.calibrationSection.coordinates = [
    //     		[data[0].x, data[0].y],
    //     		[data[0].x, data[1].y],
    //     		[data[1].x, data[1].y],
    //     		[data[1].x, data[0].y],

    //     	];

    // 		//set Calibration Box
    // 		var defaultResolution = pcSetupService.getDefaultResolution();
    // 		var maxResolution = pcSetupService.getMaxResolution();
    // 		var minSize = 0;
    // 		var maxSize = 0;

    // 		/*
    // 		Calibration guide box의 최소, 최대 크기는 다음과 같고, 최소보다 작거나 최대보다 크게 설정할 수 없다

    // 		- 최소 : View 영상의 가로세로 중 짧은 길이의 10%
    // 		- 최대 : View 영상의 가로세로 중 긴 길이의 50%

    // 		* GUI View 영상 640x480 경우

    // 		- 최소 : 48 x 48 [pixels]
    // 		- 최대 : 320 x 320 [pixels]
    // 		*/
    // 		if(defaultResolution.height > defaultResolution.width){
    // 			$scope.calibrationSection.maxSize = maxResolution.height * 0.5;
    // 			$scope.calibrationSection.minSize = maxResolution.width * 0.1;
    // 		}else{
    // 			$scope.calibrationSection.maxSize = maxResolution.width * 0.5;
    // 			$scope.calibrationSection.minSize = maxResolution.height * 0.1;
    // 		}
    // 	}
    // };

    $scope.reportSection = {
      init: function() {
        $scope.pcSetupReport.getReport();
      },
    };

    $scope.eventSection = {
      data: {},
      getAlarmOutArray: [],
      EventActions: COMMONUtils.getSupportedEventActions("QueueManagement"),
      init: function() {
        qmModel.getEventActionData().then(
          function(response) {
            var data = {
              FtpEnable: false,
              SmtpEnable: false,
              RecordEnable: false,
            };
            var actions = response.EventAction;
            if (actions !== 'undefined') {
              if (actions.indexOf('FTP') !== -1) {
                data.FtpEnable = true;
              }
              if (actions.indexOf('SMTP') !== -1) {
                data.SmtpEnable = true;
              }
              if (actions.indexOf('Record') !== -1) {
                data.RecordEnable = true;
              }
            }

            data.AlarmOutputs = [];
            var ao = 0;
            if (typeof response.AlarmOutputs === 'undefined') {
              for (ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                data.AlarmOutputs[ao] = {};
                data.AlarmOutputs[ao].Duration = 'Off';
              }
            } else {
              for (ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                data.AlarmOutputs[ao] = {};
                var duration = 'Off';
                for (var jj = 0; jj < response.AlarmOutputs.length; jj++) {
                  if ((ao + 1) === response.AlarmOutputs[jj].AlarmOutput) {
                    duration = response.AlarmOutputs[jj].Duration;
                    break;
                  }
                }
                data.AlarmOutputs[ao].Duration = duration;
              }
            }

            $scope.eventSection.data = data;
          },
          function(failData) {
            console.error(failData);
          }
        );
      },
      set: function() {
        var setData = {};
        setData.ScheduleType = $scope.pcSetupReport.schedule.period;
        setData.EventAction = "";
        if ($scope.eventSection.data.FtpEnable) {
          setData.EventAction += 'FTP,';
        }
        if ($scope.eventSection.data.SmtpEnable) {
          setData.EventAction += 'SMTP,';
        }
        if ($scope.eventSection.data.RecordEnable) {
          setData.EventAction += 'Record,';
        }
        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
          var duration = $scope.eventSection.data.AlarmOutputs[ao].Duration;
          if (duration !== 'Off') {
            setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
            setData["AlarmOutput." + (ao + 1) + ".Duration"] = duration;
          }
        }
        if (setData.EventAction.length) {
          setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }
        return qmModel.setEventActionData(setData).then(
          function(successData) {
            //Success
          },
          function(failData) {
            console.error(failData);
          }
        );
      },
    };

    $scope.currentTapStatus = [true, false];
    $scope.changeTabStatus = function(value) {
      for (var ii = 0, len = $scope.currentTapStatus.length; ii < len; ii++) {
        if (ii === value) {
          $scope.currentTapStatus[ii] = true;
        } else {
          $scope.currentTapStatus[ii] = false;
        }
      }

      if ($scope.currentTapStatus[0] === true) {
        $scope.sketchinfo = getSketchinfo('area');
        $timeout(function() {
          activeShape($scope.queueListSection.selectedQueueId);
        });
      } else if ($scope.currentTapStatus[1] === true) {
        $scope.sketchinfo = getSketchinfo('calibration');
        $timeout(function() {
          activeShape(0);
        });
      }

      $scope.queueLevelSection.reload();
    };

    // function getCoordinatesForSketchbook(){
    // 	var calibrationData = $scope.calibrationSection.coordinates;
    // 	var points = [[],[],[],[]];

    // 	if(calibrationData[0][0] < calibrationData[2][0]){
    // 		points[0][0] = calibrationData[0][0];
    // 		points[1][0] = calibrationData[0][0];
    // 		points[3][0] = calibrationData[2][0];
    // 		points[2][0] = calibrationData[2][0];
    // 	}else{
    // 		points[0][0] = calibrationData[2][0];
    // 		points[1][0] = calibrationData[2][0];
    // 		points[3][0] = calibrationData[0][0];
    // 		points[2][0] = calibrationData[0][0];
    // 	}

    // 	if(calibrationData[0][1] < calibrationData[2][1]){
    // 		points[0][1] = calibrationData[0][1];
    // 		points[1][1] = calibrationData[0][1];
    // 		points[3][1] = calibrationData[2][1];
    // 		points[2][1] = calibrationData[2][1];
    // 	}else{
    // 		points[0][1] = calibrationData[2][1];
    // 		points[1][1] = calibrationData[2][1];
    // 		points[3][1] = calibrationData[0][1];
    // 		points[2][1] = calibrationData[0][1];	
    // 	}

    // 	return points;
    // }
    /**
     * Sketchbook에서 정상적인 모양으로 데이터를 넘겨주면
     * SUNAPI에서 받은 Calibration의 Coordinates 순서와 동일하게 변경한다.
     */
    // function updateCoordinatesForSunapi(pointsFromSketchbook){
    // 	var calibrationData = $scope.calibrationSection.coordinates;
    // 	var firstIndex = 0;
    // 	var secondIndex = 0;

    // 	if(calibrationData[0][0] < calibrationData[2][0] && calibrationData[0][1] < calibrationData[2][1]){
    // 		firstIndex = 0;
    // 		secondIndex = 2;
    // 	}else if(calibrationData[0][0] > calibrationData[2][0] && calibrationData[0][1] > calibrationData[2][1]){
    // 		firstIndex = 2;
    // 		secondIndex = 0;
    // 	}else if(calibrationData[0][0] > calibrationData[2][0] && calibrationData[0][1] < calibrationData[2][1]){
    // 		firstIndex = 3;
    // 		secondIndex = 1;
    // 	}else if(calibrationData[0][0] < calibrationData[2][0] && calibrationData[0][1] > calibrationData[2][1]){
    // 		firstIndex = 1;
    // 		secondIndex = 3;
    // 	}

    // 	calibrationData[0] = pointsFromSketchbook[firstIndex];
    // 	calibrationData[1] = [ pointsFromSketchbook[firstIndex][0], pointsFromSketchbook[secondIndex][1] ];
    // 	calibrationData[2] = pointsFromSketchbook[secondIndex];
    // 	calibrationData[1] = [ pointsFromSketchbook[secondIndex][0], pointsFromSketchbook[firstIndex][1] ];
    // }

    $scope.areaColor = [
      {
        color: "#238bc1",
      },
      {
        color: "#ff6633",
      },
      {
        color: "#32ac3a",
      },
    ];

    function getSketchinfo(flag) {
      if (!$scope.queueData.Enable) {
        return null;
      }
      var sketchinfo = {
        shape: 1,
        modalId: "./views/setup/common/confirmMessage.html",
      };
      $scope.coordinates = [];

      //Configuration
      if (flag === "area") {
        var data = $scope.realtimeSection.coordinates;
        for (var ii = 0; ii < data.length; ii++) {
          $scope.coordinates.push({
            isSet: true,
            enable: $scope.queueData.Queues[ii].Enable,
            points: data[ii].points,
            areaColor: $scope.areaColor[ii].color,
          });
        }

        sketchinfo.useEvent = true;
        sketchinfo.workType = 'qmArea';
        sketchinfo.maxNumber = 3;
        sketchinfo.color = 0;
      }
      //Calibration
      // else if(flag === "calibration") {
      //     $scope.coordinates = [
      //     	{
      // 			isSet: true, //true = 저장되어있음. false = 저장X
      // 			enable: true,
      //     		points: getCoordinatesForSketchbook()
      //     	}
      //     ];

      // 	sketchinfo.workType = 'calibration';
      // 	sketchinfo.maxNumber = 1;

      //     /**
      //     최대 사이즈는 영상의 가로, 세로 중 큰쪽의 50%,
      //     최소 사이즈는 영상의 가로, 세로 중 작은 쪽의 3%
      //     */
      //     sketchinfo.minSize = {
      //     	width: $scope.calibrationSection.minSize,
      //     	height: $scope.calibrationSection.minSize
      //     };
      //     sketchinfo.maxSize = {
      //     	width: $scope.calibrationSection.maxSize,
      //     	height: $scope.calibrationSection.maxSize
      //     };
      // }

      return angular.copy(sketchinfo);
    }

    // function getMax(points) {
    //     var area = 0;
    //     var j = points.length - 1;

    //     for (var i = 0; i < points.length; i++)
    //     {
    //       area = area + (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]); 
    //       j = i;
    //     }

    //     var areaSize = Math.ceil(Math.abs(area/2));
    // 	var coordinates = getCoordinatesForSketchbook();
    //     var calSize = {
    //     	width: (coordinates[2][0] - coordinates[0][0]),
    //     	height: (coordinates[2][1] - coordinates[0][1])
    //     };

    //     var max = areaSize / (calSize.width * calSize.height);
    //     return Math.ceil(max);
    // }

    // function setAutoMaxPeople(){
    // 	var queues = $scope.queueData.Queues;
    // 	for(var i = 0; i < queues.length; i++){
    // 		var max = getMax($scope.realtimeSection.coordinates[i].points);
    // 		$scope.queueLevelSection.changeValue( 'max', max, i );
    // 	}
    // 	$scope.queueLevelSection.reload();
    // }

    /* Collapse End
    ----------------------------------------------*/

    $rootScope.$saveOn('<app/scripts/directives>::<updateCoordinates>', function(obj, args) {
      var modifiedIndex = args[0];
      // var modifiedType = args[1]; //생성: create, 삭제: delete
      var pointIndex = 2;
      var modifiedPoints = args[pointIndex];
      // var modifiedDirection = args[3];

      // console.info("updateCoordinates", modifiedIndex, modifiedType, modifiedPoints, modifiedDirection);

      if ($scope.currentTapStatus[0] === true) {
        $scope.queueListSection.selectedQueueId = modifiedIndex;
        $timeout(function() {
          activeShape(modifiedIndex);
          $scope.queueLevelSection.start();
        });

        $scope.realtimeSection.coordinates[modifiedIndex].points = modifiedPoints;

        // var max = getMax(modifiedPoints);
        // $scope.queueLevelSection.changeValue( 'max', max );
        $scope.queueLevelSection.reload();
      }
      // else if($scope.currentTapStatus[1] === true){
      // $scope.calibrationSection.coordinates = modifiedPoints;
      // updateCoordinatesForSunapi(modifiedPoints);
      // setAutoMaxPeople();
      // }
    }, $scope);

    /* Destroy Area Start
    ------------------------------------------ */
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (fromState.controller === 'QMSetupCtrl') {
        // pcModalService.close();
        // $scope.countingSection.polling.stop();
        // asyncInterrupt = true;
        $scope.queueLevelSection.stop();
      }
    });
    /* Destroy Area End
    ------------------------------------------ */

    function view() {
      var failCallback = function(errorData) {
        console.error(errorData);
        $scope.pageLoaded = true;
      };

      showVideo().then(function() {
        $scope.init().then(function() {
          $scope.pageLoaded = true;
        }, failCallback);
      }, failCallback);
    }

    function setQueueManagement() {
      var data = $scope.queueData;

      var setData = {};
      setData.Channel = channel;
      setData.Enable = data.Enable;
      // setData.CalibrationMode = data.CalibrationMode;
      // try{
      // 	setData.ObjectSizeCoordinates = [
      // 		$scope.calibrationSection.coordinates[0].join(),
      // 		$scope.calibrationSection.coordinates[2].join()
      // 	].join();
      // }catch(e){}

      for (var ii = 1; ii <= data.Queues.length; ii++) {
        var jj = ii - 1;
        var queue = data.Queues[jj];
        setData['Queue.' + ii + '.Enable'] = queue.Enable;
        setData['Queue.' + ii + '.MaxPeople'] = queue.MaxPeople;
        setData['Queue.' + ii + '.Name'] = queue.Name;
        setData['Queue.' + ii + '.Level.High.AlarmEnable'] = queue.QueueLevels[0].AlarmEnable;
        setData['Queue.' + ii + '.Level.High.Count'] = queue.QueueLevels[0].Count;
        setData['Queue.' + ii + '.Level.High.Threshold'] = queue.QueueLevels[0].Threshold;
        setData['Queue.' + ii + '.Level.Medium.AlarmEnable'] = queue.QueueLevels[1].AlarmEnable;
        setData['Queue.' + ii + '.Level.Medium.Threshold'] = queue.QueueLevels[1].Threshold;
        try {
          var points = $scope.realtimeSection.coordinates[jj].points;
          setData['Queue.' + ii + '.Coordinates'] = points.join();
        } catch (errorData) {
          console.log(errorData);
        }
      }

      return qmModel.setData(
        setData,
        function(responseData) {
        },
        function(errorData) {
          console.error(errorData);
        }
      );
    }

    function set(needRefresh) {
      var promises = [];

      promises.push(setQueueManagement);
      promises.push($scope.pcSetupReport.setReport);
      promises.push($scope.eventSection.set);

      if (promises.length > 0) {
        $q.seqAll(promises).then(
          function() {

          },
          function(errorData) {
            console.error(errorData);
          }
        );
      } else {
        view();
      }
    }

    $scope.submitEnable = function() {
      COMMONUtils.ApplyConfirmation (
        function() {
          qmModel.
            setData({
              Enable: $scope.queueData.Enable,
            }).
            then(
              function(successData) {
                $timeout($scope.init);
              },
              function(errorData) {
                console.error(errorData);
              }
            );
        },
        'sm',
        function() {
          $scope.queueData.Enable = !$scope.queueData.Enable;
        }
      );
    };

    function setValidation() {
      var data = $scope.queueData.Queues;
      var isOk = true;
      var alertMessage = '';
      var dataIndex = {
        first: 0,
        second: 1,
        third: 2,
      };

      if (data.length !== 0) {
        if (
          (data[dataIndex.first].Name === '' && data[dataIndex.first].Enable === true) ||
          (data[dataIndex.second].Name === '' && data[dataIndex.second].Enable === true) ||
          (data[dataIndex.third].Name === '' && data[dataIndex.third].Enable === true)
        ) {
          isOk = false;
          alertMessage = $translate.instant('lang_msg_noname');
        }

        if (isOk === false) {
          COMMONUtils.ShowError(alertMessage);
        }
      }

      return isOk;
    }

    $scope.submit = function(needRefresh) {
      if (setValidation()) {
        if ($scope.pcSetupReport.validate()) {
          COMMONUtils.ApplyConfirmation(function() {
            set(needRefresh);
          });
        }
      }
    };
    $scope.view = view;

    function showVideo() {
      var getData = {};
      return SunapiClient.get(
        '/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, 
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
            currentPage: 'Queue',
          };
        }, function(errorData) {
          console.error(errorData);
        }, '', true
      );
    }

    (function wait() {
      $timeout(function() {
        if (!mAttr.Ready) {
          var time = 500;
          $timeout(function() {
            mAttr = Attributes.get();
            wait();
          }, time);
        } else {
          getAttributes().finally(function() {
            view();
          });
        }
      });
    })();
  });