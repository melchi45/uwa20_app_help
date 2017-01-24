/*global pad, setTimeout, event, clearTimeout*/
'use strict';
kindFramework.controller('ModalInstnceSearchCtrl',
  ['$scope', '$timeout', '$uibModalInstance', 'dateConverter',
  'PlaybackInterface', 'CAMERA_TYPE', '$rootScope', 'data', 
  'SearchDataModel', 'UniversialManagerService',
  function ($scope, $timeout, $uibModalInstance, dateConverter,
              PlaybackInterface, CAMERA_TYPE, $rootScope, 
              data, SearchDataModel, UniversialManagerService) {

  var searchData = new SearchDataModel();
  var recordingDate = [];
  var optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
  var selectedEventList = [];
  var selectedDate = searchData.getSelectedDate();
  var isValueChanged = true;
  var playbackInterfaceService = PlaybackInterface;

  $scope.submitButton = 'lang_search';
  $scope.eventList = data.eventList;
  $scope.minDate = new Date(2000, 0, 1);
  $scope.maxDate = new Date(2037, 11, 31);
  $scope.connectedService = optionServiceType[UniversialManagerService.getServiceType()];

  $scope.showError = function(){
    var className = 'modal-error-message-show';
    $('.modal-error-message').addClass(className);
    setTimeout(function(){
      $('.modal-error-message').removeClass(className);
    }, 1500);
  };

  //WN5의 Backup 기능을 위해 만듬
  if(data.buttonName !== undefined){
    $scope.submitButton = data.buttonName;
  }

  var makeElementsOfInputBox = function(sliderTime, wantedElements){
    if(wantedElements === 'hours'){
      return pad(Math.floor(sliderTime / 60));
    } else if(wantedElements === 'minutes'){
      return pad(sliderTime - (Math.floor(sliderTime / 60) * 60));
    } else if(wantedElements === 'seconds'){
      return "00";
    } else {
      return pad(Math.floor(sliderTime / 60))+":"+pad(sliderTime - (Math.floor(sliderTime / 60) * 60))+":"+"00";
    }
  };

  var makeFullPackageOfInputBox = function(wantedElements){
    if(wantedElements === 'start'){        
      slider.start.hours = document.getElementById('slider-start-time-hours').value;
      slider.start.minutes = document.getElementById('slider-start-time-minutes').value;
      slider.start.seconds = document.getElementById('slider-start-time-seconds').value;
      return stringPad(slider.start.hours)+":"+stringPad(slider.start.minutes)+":"+stringPad(slider.start.seconds);
    } else if(wantedElements === 'end'){   
      slider.end.hours = document.getElementById('slider-end-time-hours').value;
      slider.end.minutes = document.getElementById('slider-end-time-minutes').value;
      slider.end.seconds = document.getElementById('slider-end-time-seconds').value;
      return stringPad(slider.end.hours)+":"+stringPad(slider.end.minutes)+":"+stringPad(slider.end.seconds);
    } else {                              
      console.log("invalid parameter");
    }
  };

  $scope.changeNumToTime = function(inputType, distinctionBranch) {
    if(inputType === 0){
      if(slider.start.from === 1440){
        slider.start.from = slider.start.from - 1;
        slider.start.hours = "23";
        slider.start.minutes = "59";
        slider.start.seconds = "58";
      } else {
        slider.start.hours = makeElementsOfInputBox(slider.start.from, 'hours');
        slider.start.minutes = makeElementsOfInputBox(slider.start.from, 'minutes');
        if(distinctionBranch !== 1){
          slider.start.seconds = "00";
        }
      }
    } else {
      if(slider.end.to === 1440){
        slider.end.to = slider.end.to - 1;
        slider.end.hours = "23";
        slider.end.minutes = "59";
        slider.end.seconds = "59";
      } else {
        slider.end.hours = makeElementsOfInputBox(slider.end.to, 'hours');
        slider.end.minutes = makeElementsOfInputBox(slider.end.to, 'minutes');
        if(distinctionBranch !== 1){
          slider.end.seconds = "00";
        }
      }
    }
    $timeout(function() {
      $scope.$apply();
    });
  };
  
  var changeTimeToNum = function(hours, minutes) {
    return (stringToNum(hours)*60) + stringToNum(minutes);
  }; 

  var pad = function(x){
    return ( x<10? "0"+x : x );  
  };

  var stringPad = function(x){
    switch (numToString(x).length) {
      case 0:
        return '00';
      case 1:
        return '0'+x;
      case 2:
        return numToString(x);
      default:
        console.log("unexpected keyCode");
        break;
    }
  };

  var stringToNum = function(x){
    return x *= 1;
  };

  var numToString = function(x){
    return x+"";
  };
  
  var search = function function_name () {
    // checkInputValues();
    if( makeFullPackageOfInputBox('start') === makeFullPackageOfInputBox('end') ){
      $scope.errorMessage = "lang_msg_From_To_Diff";
      $scope.showError();
      return false;
    }
    if( makeFullPackageOfInputBox('start') > makeFullPackageOfInputBox('end') ){
      $scope.errorMessage = "lang_msg_From_To_Late";
      $scope.showError();
      return false;
    }
    return true;
  };

  var showRecordingDate = function(year, month) {
    $scope.isLoading = true;
    playbackInterfaceService.findRecordings(year, month)
    .then(function(results) {
      recordingDate = results;
      $timeout(function(){
        $scope.$broadcast('refreshDatepickers');
        $scope.isLoading = false;
      });
    }, function(error) {
      console.log("findRecordings fail");
      $scope.isLoading = false;
      $scope.errorMessage = "lang_timeout";
      $scope.showError();
    });    
  };

  $scope.playback = {
    'search' : {
      selectedDate : selectedDate
    },
    getDayClass : function(date, mode) {
      switch(mode) {
        case 'day':
          var className = "";
          if(date.getDay() === 0 || date.getDay() === 6) className = "week";        
          if(new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) className += " today";
          for(var i in recordingDate){
            if(recordingDate[i].day === pad(date.getDate()) && recordingDate[i].month === pad(date.getMonth()+1)) {
              className += " event";
              return className;
            }
          } 
          return className; 
        case 'month':
          return " monthSearch";
        case 'year':
          return " yearSearch";
        default:
          console.log("mode type error - NOT day, month, year");
          return;
      }
    },
    recordingDataIsExist : function(){
      selectedDate = $scope.playback.search.selectedDate;
      if(recordingDate.length === 0){
        $scope.errorMessage = "lang_msg_timebackupDateError";
        $scope.showError();
      } else {
        var isExistFlag = false;
        for(var i in recordingDate){
          if(recordingDate[i].day === pad($scope.playback.search.selectedDate.getDate()) &&
            recordingDate[i].month === pad($scope.playback.search.selectedDate.getMonth()+1)) {
            isExistFlag = true;
          } 
        } 
        if(isExistFlag === false){
          $scope.errorMessage = "lang_msg_timebackupDateError";
          $scope.showError();                
        }
      }
    },
  };

  var checkValidValue = function(element){
    switch (element.value.length) {
      case 0:
        element.value = "00";
        break;
      case 1:
        element.value = pad(element.value);
        break;
      default:
        console.log("unexpected keyCode");
        break;
    }
    switch (element.id) {
      case 'slider-start-time-hours':
      case 'slider-end-time-hours':
        if (element.value >= 24){
          element.value = "23";
        }
        break;
      case 'slider-start-time-minutes':
      case 'slider-end-time-minutes':
      case 'slider-start-time-seconds':
      case 'slider-end-time-seconds':
        if (element.value >= 60){
          element.value = "59";
        }
        break;
      default:
        console.log("unexpected keyCode");
        break;
    }
  };

  var validTime = $scope.validTime = {
    getFocusTime: function($event) {
      var isDown = false;
      validTime.defaultTime = $event.target.value;
      if(validTime.defaultTime === undefined){
        validTime.defaultTime = "00";
      }
      var selectedElement = document.getElementById($event.target.id);
      selectedElement.setSelectionRange(0,2);
      selectedElement.onkeyup = function($event) {
        if(isDown === false) return;
        if(/^[0-9]+$/.test(selectedElement.value) === false){
          selectedElement.value = selectedElement.value.slice(0, -1);
        }
        if(selectedElement.value.length === 2){
          if(isValueChanged === true){
            checkValidValue(selectedElement);
            if(selectedElement.id === 'slider-start-time-seconds'){
              $("#slider-end-time-hours").focus();
            } else if(selectedElement.id === 'slider-end-time-seconds') {
              $(this).focus();
            } else {
              $(this).next().focus();
            }
          } else {
            selectedElement.setSelectionRange(0,2);
            isValueChanged = true;
          }
        } 
        if(event.keyCode === 39 || event.keyCode === 40){
          checkValidValue(selectedElement);
          if(selectedElement.id === 'slider-start-time-seconds'){
            $("#slider-end-time-hours").focus();
          } else if(selectedElement.id === 'slider-end-time-seconds') {
            $(this).focus();
          } else {
            $(this).next().focus();
          }
        }
      };      
      selectedElement.onkeydown = function($event) {
        isDown = true;
        switch ($event.keyCode) {
          case 9:
            checkValidValue(selectedElement);
            $event.preventDefault();
            break;
          case 37:
          case 38:
            checkValidValue(selectedElement);
            isValueChanged = false;
            if(selectedElement.id === 'slider-end-time-hours'){
              $("#slider-start-time-seconds").focus(); 
            } else {
              $(this).prev().focus(); 
            }
            break;
          default:
            console.log("unexpected keyCode");
            break;
        }
      };
    },
    changeSliderValue: function($event) {
      var selectedElement = document.getElementById($event.target.id);
      checkValidValue(selectedElement);
      slider.start.from = changeTimeToNum(slider.start.hours, slider.start.minutes);
      slider.end.to = changeTimeToNum(slider.end.hours, slider.end.minutes);
    },
  };

  var slider = $scope.slider = function() {
    var data = {
      options: {
        slide: function (event, ui) {
          var inputType = event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
          $scope.changeNumToTime(inputType);
        },
        min: 0,
        max: 1440,
      },
      hours: searchData.getSelectedStartedTime()[0],
      minutes: searchData.getSelectedStartedTime()[1],
      seconds: searchData.getSelectedStartedTime()[2],
      from: changeTimeToNum(searchData.getSelectedStartedTime()[0],searchData.getSelectedStartedTime()[1]),
    };
    var data2 = {
      options: {
        slide: function (event, ui) {
          var inputType = event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
          $scope.changeNumToTime(inputType);
        },
        min: 0,
        max: 1440,
      },
      hours: searchData.getSelectedEndedTime()[0],
      minutes: searchData.getSelectedEndedTime()[1],
      seconds: searchData.getSelectedEndedTime()[2],
      to: changeTimeToNum(searchData.getSelectedEndedTime()[0],searchData.getSelectedEndedTime()[1]),
    };
    return {
      start: data,
      end: data2,
      timeSections: ['00:00', '06:00', '12:00', '18:00', '24:00'],
      getTimeSpanStyle: function(index, length) {
        return {
          left: index * (1/(length-1)) * 100 + '%',
        };
      }
    };
  }();

  $scope.ok = function() {
    if(search()) {
      searchData.setSelectedDate(selectedDate);
      searchData.setSelectedStartedTime([stringPad(slider.start.hours), stringPad(slider.start.minutes), stringPad(slider.start.seconds)]);
      searchData.setSelectedEndedTime([stringPad(slider.end.hours), stringPad(slider.end.minutes), stringPad(slider.end.seconds)]);
      data = {
       'startTime' : makeFullPackageOfInputBox('start'),
       'endTime' : makeFullPackageOfInputBox('end'),
       'date' : selectedDate,
       'eventList' : selectedEventList,
       'fromTimeStep' : dateConverter.getMinutes(selectedDate, slider.start.from), 
       'toTimeStep' : dateConverter.getMinutes(selectedDate, slider.end.to),     
       };
    } else {
      slider.end.to = slider.start.from + searchData.getDefaultPlusTime();
      if(slider.end.to >= 1440 )  slider.end.to = 1440;
      slider.end.seconds = slider.start.seconds;
      $scope.changeNumToTime(1, 1);
      return;
    }
    $uibModalInstance.close(data);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.closeErrorMessage = function() {
    $scope.errorMessage = "";
  };

  $rootScope.$saveOn('onChangedMonth', function(event, data){
    selectedDate = data;
    showRecordingDate(selectedDate.getFullYear(), pad(selectedDate.getMonth()+1));
  }, $scope);

  $rootScope.$saveOn('allpopupclose', function(event) {
    $uibModalInstance.dismiss('cancel');
  }, $scope);

  showRecordingDate(selectedDate.getFullYear(), pad(selectedDate.getMonth() + 1));

  /*
   * @author Yongku Cho
   * @desc Add key event
   */
  var documentBody = document.body;
  var keyUpHandler = function(event){
    var keyCode = event.which || event.keyCode;
    if(keyCode === 27){
        documentBody.removeEventListener('keyup', keyUpHandler);
        $scope.cancel();
    }
  };
  documentBody.addEventListener("keyup", keyUpHandler);
      
  /*
   * @author Yongku Cho
   * @desc Add Click Event
   */
	var clickHandler = function(event){
		if($(event.target).hasClass('modal')){
			var searchModal = $("#search-box").parent().parent().parent();
			searchModal.unbind("mousedown", clickHandler);
			$scope.cancel();
		}
	};  
	var currentInputTarget = null;
  $uibModalInstance.rendered.then(function(){
    $('.start-time input, .end-time input').bind('mousedown', function(event){
        console.log("kind mousedown", event.target);
        currentInputTarget = event.target;
    });
    var searchModal = $("#search-box").parent().parent().parent();
    searchModal.bind("mousedown", clickHandler);
  });

	if(isPhone){
		var deviceDetecter = {
			isPortrait: false,
			isLandscape: false,
			currentWindowWidth: 0,
			currentWindowHeight: 0,
			getWindowSize: function(){
				var windowWidth = window.outerWidth > window.innerWidth ? window.outerWidth : window.innerWidth;
				var windowHeight = window.outerHeight > window.innerHeight ? window.outerHeight : window.innerHeight;

				return {
					width: windowWidth,
					height: windowHeight
				};
			},
			init: function(){
				var windowSize = deviceDetecter.getWindowSize();
				var windowWidth = windowSize.width;
				var windowHeight = windowSize.height;

				//Portrait
				if(windowHeight > windowWidth){
					console.log("kind this device isPortrait");
					deviceDetecter.isPortrait = true;
				}else{//Landscape
					console.log("kind this device isLandscape");
					deviceDetecter.isLandscape = true;
				}

				deviceDetecter.currentWindowWidth = windowWidth;
				deviceDetecter.currentWindowHeight = windowHeight;
			},
			toggleOrientation: function(){
				deviceDetecter.isPortrait = !deviceDetecter.isPortrait;
				deviceDetecter.isLandscape = !deviceDetecter.isLandscape;

				console.log("kind deviceDetecter.isLandscape", deviceDetecter.isLandscape, " deviceDetecter.isPortrait", deviceDetecter.isPortrait);
			},
			getScreenHeight: function(){
				var screenWidth = window.screen.width;
				var screenHeight = window.screen.height;

				if(deviceDetecter.isLandscape){
					screenHeight = screenHeight > screenWidth ? screenWidth : screenHeight;
				}else if(deviceDetecter.isPortrait){
					screenHeight = screenWidth > screenHeight ? screenWidth : screenHeight;
				}

				console.log("kind get screenHeight", screenHeight);

				return screenHeight;
			}
		};

		var modalController = {
			resize: function(){

				console.log("kind modalController.resize");
				var windowHeight = deviceDetecter.getScreenHeight();
				var halfHeight = windowHeight / 2;
				var positionTop = deviceDetecter.isLandscape ? 7 : 10;
				//Because Modal's size is big, That have to minute some height
				var heightForDesign = deviceDetecter.isLandscape ? 60 : 20;
				var seachBoxHeight = halfHeight - $('.modal-bottom-bar').height() - $('.button-groups').height() - heightForDesign;
				var searchBoxStyle = {
					height: seachBoxHeight + 'px'
				};

				if(deviceDetecter.isLandscape){
					searchBoxStyle['padding-bottom'] = '0px';
				}

				var transformValue = 'matrix(1, 0, 0, 1, -128, 0)';
				var transitionValue = 'none 0s ease 0s';
				var cssValue = {
					top: positionTop + 'px'
				};
				var modalDialog = $('.modal-dialog');
				
				if(modalDialog.css('transform') !== transformValue){
					cssValue.transform = transformValue;
					cssValue['webkit-transform'] = transformValue;
					cssValue['moz-transform'] = transformValue;
					cssValue['o-transform'] = transformValue;
					cssValue['ms-transform'] = transformValue;
				}
				
				//If it is first
				if(modalDialog.css('transition') !== transitionValue){
					cssValue.transition = transitionValue;
				}else{
					cssValue.transition = 'top .3s ease-out 0s';
				}
				
				modalDialog.css(cssValue);
				
				$('#search-box').css(searchBoxStyle);

				//Move scroll to bottom
				$('#search-box')[0].scrollTop = $('#search-box')[0].scrollHeight;
			},
			reset: function(){
				$('.modal-dialog').css({
					top: '',
					'transform': '',
					'webkit-transform': '',
					'moz-transform': '',
					'o-transform': '',
					'ms-transform': '',
					'transition': ''
				});

				$('#search-box').css({
					height: '',
					'padding-bottom': ''
				});
			}
		};

		deviceDetecter.init();

		var doit = null;
		var windowOrientationChangeHandler = function(){
//			console.log("kind resize");

			clearTimeout(doit);
			doit = setTimeout(function(){
					var windowSize = deviceDetecter.getWindowSize();

					console.log("kind deviceDetecter ", deviceDetecter.currentWindowHeight, deviceDetecter.currentWindowWidth);
					console.log("kind windowSize ", windowSize.height, windowSize.width);

					if(windowSize.height !== deviceDetecter.currentWindowHeight &&
						  windowSize.width !== deviceDetecter.currentWindowWidth){

						console.log("kind windowOrientationChange");

						deviceDetecter.currentWindowWidth = windowSize.width;
						deviceDetecter.currentWindowHeight = windowSize.height;

						deviceDetecter.toggleOrientation();
						modalController.resize();
					}
			}, 500);
		};
		
		var keyBoardShowHandler = function(){
			
			var searchModal = $("#search-box").parent().parent().parent();
			searchModal.unbind('mousedown', clickHandler);
			setTimeout(function(){
					searchModal.bind('mousedown', clickHandler);
					$scope.$apply();
			}, 200);
			console.log("kind show keyboard");
			setTimeout(function(){
					try {
							$(currentInputTarget).focus();
					}catch(e){
							console.error(e);
					}
					$(window).unbind('resize', windowOrientationChangeHandler);
					modalController.resize();
					$(window).bind('resize', windowOrientationChangeHandler);
			}, 300);
		};
		var keyBoardHideHandler = function(){
			console.log("kind hide keyboard");
			modalController.reset();
			$(window).unbind('resize', windowOrientationChangeHandler);
		};

		window.addEventListener('native.keyboardshow', keyBoardShowHandler);
		window.addEventListener('native.keyboardhide', keyBoardHideHandler);
		$scope.$on("$destroy", function(){
			window.removeEventListener('native.keyboardhide', keyBoardHideHandler);
			window.removeEventListener('native.keyboardshow', keyBoardShowHandler);
		});
	}
}]);