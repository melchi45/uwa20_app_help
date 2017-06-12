/*global event */
kindFramework.directive('playbackDatepicker', function() {
  'use strict';
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'views/livePlayback/directives/playback-datepicker.html',
    controller: function($scope, $timeout, dateConverter, PlaybackInterface, CAMERA_TYPE, 
    $rootScope, SearchDataModel, UniversialManagerService, ModalManagerService) {
      var searchData = new SearchDataModel();
      var recordingDate = [];
      var selectedEventList = [];
      var currentDate = searchData.getSelectedDate();
      var isValueChanged = true;
      var playbackInterfaceService = PlaybackInterface;
      var MIN_DATE = {'YEAR' : 2000, 'MONTH' : 1, 'DAY' : 1};
      var MAX_DATE = {'YEAR' : 2037, 'MONTH' : 12, 'DAY' : 32};
      var HOUR_TO_MIN = 60, MIN_TO_SEC = 60;
      var MIN_DOUBLE_FIGURES = 10;
      var MAX_SLIDER_INPUT = 1440;
      var MAX_HOUR = 24;
      var MAX_SECONDS = 60;
      var MAX_TIME_LENGTH = 2;
      var MAX_DATE_VALUE = 6;
      var KEY = {TAB:9, ESC:27, ARROW_LEFT:37, ARROW_UP:38, ARROW_RIGHT:39, ARROW_DOWN:40};

      $scope.blockTimeInput = false;
      $scope.submitButton = 'lang_search';
      $scope.minDate = new Date(MIN_DATE.YEAR, MIN_DATE.MONTH-1, MIN_DATE.DAY);
      $scope.maxDate = new Date(MAX_DATE.YEAR, MAX_DATE.MONTH-1, MAX_DATE.DAY);
      $scope.showError = function(message) {
        ModalManagerService.open(
          'message', {
            'buttonCount': 0,
            'message': message,
          }
        );
      };
      $scope.allDay = true;

      $scope.selectAllDay = function() {
        if ($scope.allDay === true) {
          $scope.slider.start.hours = '00';
          $scope.slider.start.minutes = '00';
          $scope.slider.start.seconds = '00';
          $scope.slider.end.hours = '23';
          $scope.slider.end.minutes = '59';
          $scope.slider.end.seconds = '59';
        }
      };

      var makeElementsOfInputBox = function(sliderTime, wantedElements) {
        if (wantedElements === 'hours') {
          return pad(Math.floor(sliderTime / MIN_TO_SEC));
        } else if (wantedElements === 'minutes') {
          return pad(sliderTime - (Math.floor(sliderTime / MIN_TO_SEC) * MIN_TO_SEC));
        } else if (wantedElements === 'seconds') {
          return "00";
        } else {
          return pad(Math.floor(sliderTime / MIN_TO_SEC)) + ":" + 
            pad(sliderTime - (Math.floor(sliderTime / MIN_TO_SEC) * MIN_TO_SEC)) + ":" + "00";
        }
      };
      var makeFullPackageOfInputBox = function(wantedElements) {
        if (wantedElements === 'start') {
          slider.start.hours = document.getElementById('slider-start-time-hours').value;
          slider.start.minutes = document.getElementById('slider-start-time-minutes').value;
          slider.start.seconds = document.getElementById('slider-start-time-seconds').value;
          return stringPad(slider.start.hours) + ":" + stringPad(slider.start.minutes) + 
                  ":" + stringPad(slider.start.seconds);
        } else if (wantedElements === 'end') {
          slider.end.hours = document.getElementById('slider-end-time-hours').value;
          slider.end.minutes = document.getElementById('slider-end-time-minutes').value;
          slider.end.seconds = document.getElementById('slider-end-time-seconds').value;
          return stringPad(slider.end.hours) + ":" + stringPad(slider.end.minutes) + 
                ":" + stringPad(slider.end.seconds);
        } else {
          console.log("invalid parameter");
        }
      };
      $scope.changeNumToTime = function(inputType, distinctionBranch) {
        if (inputType === 0) {
          if (slider.start.from === MAX_SLIDER_INPUT) {
            slider.start.from -= 1;
            slider.start.hours = "23";
            slider.start.minutes = "59";
            slider.start.seconds = "58";
          } else {
            slider.start.hours = makeElementsOfInputBox(slider.start.from, 'hours');
            slider.start.minutes = makeElementsOfInputBox(slider.start.from, 'minutes');
            if (distinctionBranch !== 1) {
              slider.start.seconds = "00";
            }
          }
        } else {
          if (slider.end.to === MAX_SLIDER_INPUT) {
            slider.end.to -= 1;
            slider.end.hours = "23";
            slider.end.minutes = "59";
            slider.end.seconds = "59";
          } else {
            slider.end.hours = makeElementsOfInputBox(slider.end.to, 'hours');
            slider.end.minutes = makeElementsOfInputBox(slider.end.to, 'minutes');
            if (distinctionBranch !== 1) {
              slider.end.seconds = "00";
            }
          }
        }
        $timeout(function() {
          $scope.$apply();
        });
      };
      var changeTimeToNum = function(hours, minutes) {
        return (stringToNum(hours) * HOUR_TO_MIN) + stringToNum(minutes);
      };
      var pad = function(input) {
        var target = input*1;
        return target < MIN_DOUBLE_FIGURES ? "0" + target : target;
      };
      var stringPad = function(input) {
        switch (numToString(input).length) {
          case 0:
            return '00';
          case 1:
            return '0' + input;
          case MAX_TIME_LENGTH:
            return numToString(input);
          default:
            console.log("unexpected keyCode");
            break;
        }
      };
      var stringToNum = function(input) {
        return input * 1;
      };
      var numToString = function(input) {
        return input + "";
      };
      var search = function() {
        // checkInputValues();
        if (makeFullPackageOfInputBox('start') === makeFullPackageOfInputBox('end')) {
          $scope.showError("lang_msg_From_To_Diff");
          return false;
        }
        if (makeFullPackageOfInputBox('start') > makeFullPackageOfInputBox('end')) {
          $scope.showError("lang_msg_From_To_Late");
          return false;
        }
        return true;
      };
      var showRecordingDate = function(year, month) {
        $scope.isLoading = true;
        var channelId = UniversialManagerService.getChannelId();
        var dateInfo = {
          'year': year,
          'month': month,
          'channel': channelId,
        };
        playbackInterfaceService.findRecordings(dateInfo).then(function(results) {
          recordingDate = results;
          $timeout(function() {
            $scope.$broadcast('refreshDatepickers');
            $scope.isLoading = false;
          });
        }, function() {
          console.log("findRecordings fail");
          $scope.isLoading = false;
          $scope.showError("lang_timeout");
        });
      };
      $scope.playback = {
        'search': {
          mode: 'day',
          selectedDate: currentDate,
        },
        getDayClass: function(date, mode) {
          switch (mode) {
            case 'day':
              var className = "";
              if (date.getDay() === 0 || date.getDay() === MAX_DATE_VALUE) {
                className = "week";
              }
              if (new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)) {
                className += " today";
              }
              for (var idx in recordingDate) {
                if (recordingDate[idx].day === pad(date.getDate()) && 
                  recordingDate[idx].month === pad(date.getMonth() + 1)) {
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
        recordingDataIsExist: function() {
          currentDate = $scope.playback.search.selectedDate;
          if (recordingDate.length === 0) {
            $scope.showError("lang_msg_timebackupDateError");
          } else {
            var isExistFlag = false;
            for (var idx in recordingDate) {
              if (recordingDate[idx].day === pad($scope.playback.search.selectedDate.getDate()) && 
                recordingDate[idx].month === 
                    pad($scope.playback.search.selectedDate.getMonth()+1)) {
                isExistFlag = true;
              }
            }
            if (isExistFlag === false) {
              $scope.showError("lang_msg_timebackupDateError");
            }
          }
        },
      };
      var checkValidValue = function(element) {
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
            if (element.value >= MAX_HOUR) {
              element.value = "23";
            }
            break;
          case 'slider-start-time-minutes':
          case 'slider-end-time-minutes':
          case 'slider-start-time-seconds':
          case 'slider-end-time-seconds':
            if (element.value >= MAX_SECONDS) {
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
          if (typeof validTime.defaultTime === "undefined") {
            validTime.defaultTime = "00";
          }
          var selectedElement = document.getElementById($event.target.id);
          selectedElement.setSelectionRange(0, MAX_TIME_LENGTH);
          selectedElement.onkeyup = function() {
            if (isDown === false) {
              return;
            }
            if (/^[0-9]+$/.test(selectedElement.value) === false) {
              selectedElement.value = selectedElement.value.slice(0, -1);
            }
            if (selectedElement.value.length === MAX_TIME_LENGTH) {
              if (isValueChanged === true) {
                checkValidValue(selectedElement);
                if (selectedElement.id === 'slider-start-time-seconds') {
                  $("#slider-end-time-hours").focus();
                } else if (selectedElement.id === 'slider-end-time-seconds') {
                  $(this).focus();
                } else {
                  $(this).next().focus();
                }
              } else {
                selectedElement.setSelectionRange(0, MAX_TIME_LENGTH);
                isValueChanged = true;
              }
            }
            if (event.keyCode === KEY.ARROW_RIGHT || event.keyCode === KEY.ARROW_DOWN ) {
              checkValidValue(selectedElement);
              if (selectedElement.id === 'slider-start-time-seconds') {
                $("#slider-end-time-hours").focus();
              } else if (selectedElement.id === 'slider-end-time-seconds') {
                $(this).focus();
              } else {
                $(this).next().focus();
              }
            }
          };
          selectedElement.onkeydown = function($event) {
            isDown = true;
            switch ($event.keyCode) {
              case KEY.TAB:
                checkValidValue(selectedElement);
                $event.preventDefault();
                break;
              case KEY.ARROW_LEFT:
              case KEY.ARROW_UP:
                checkValidValue(selectedElement);
                isValueChanged = false;
                if (selectedElement.id === 'slider-end-time-hours') {
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
            slide: function(event, ui) {
              var inputType = 
                event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
              $scope.changeNumToTime(inputType);
            },
            min: 0,
            max: 1440,
          },
          hours: searchData.getSelectedStartedTime()[0],
          minutes: searchData.getSelectedStartedTime()[1],
          seconds: searchData.getSelectedStartedTime()[2],
          from: changeTimeToNum(searchData.getSelectedStartedTime()[0], 
                                searchData.getSelectedStartedTime()[1]),
        };
        var data2 = {
          options: {
            slide: function(event, ui) {
              var inputType = 
                event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
              $scope.changeNumToTime(inputType);
            },
            min: 0,
            max: 1440,
          },
          hours: searchData.getSelectedEndedTime()[0],
          minutes: searchData.getSelectedEndedTime()[1],
          seconds: searchData.getSelectedEndedTime()[2],
          to: changeTimeToNum(searchData.getSelectedEndedTime()[0], 
                              searchData.getSelectedEndedTime()[1]),
        };
        return {
          start: data,
          end: data2,
          timeSections: ['00:00', '06:00', '12:00', '18:00', '24:00'],
          getTimeSpanStyle: function(index, length) {
            return {
              left: (index * (1 / (length - 1)) * 100) + '%',
            };
          },
        };
      }();
      $scope.ok = function() {
        var data = {};
        if (search()) {
          searchData.setSelectedDate(currentDate);
          searchData.setSelectedStartedTime([stringPad(slider.start.hours), 
            stringPad(slider.start.minutes), stringPad(slider.start.seconds)]);
          searchData.setSelectedEndedTime([stringPad(slider.end.hours), 
            stringPad(slider.end.minutes), stringPad(slider.end.seconds)]);
          data = {
            'startTime': makeFullPackageOfInputBox('start'),
            'endTime': makeFullPackageOfInputBox('end'),
            'date': currentDate,
            'eventList': selectedEventList,
            'fromTimeStep': dateConverter.getMinutes(currentDate, slider.start.from),
            'toTimeStep': dateConverter.getMinutes(currentDate, slider.end.to),
          };
          if (data.startTime === '00:00:00' && data.endTime === '23:59:59') {
            $scope.allDay = true;
          }
        } else {
          slider.end.to = slider.start.from + searchData.getDefaultPlusTime();
          if (slider.end.to >= MAX_SLIDER_INPUT) {
            slider.end.to = MAX_SLIDER_INPUT;
          }
          slider.end.seconds = slider.start.seconds;
          $scope.changeNumToTime(1, 1);
          return false;
        }

        return data;
      };
      $scope.cancel = function() {
        $scope.playback.search.selectedDate = currentDate = searchData.getSelectedDate();
        $scope.playback.search.mode = 'day';
        if (makeFullPackageOfInputBox('start') === '00:00:00' && 
            makeFullPackageOfInputBox('end') === '23:59:59') {
          $scope.allDay = true;
        }
      };
      $scope.closeErrorMessage = function() {
        $scope.errorMessage = "";
      };
      $rootScope.$saveOn('onChangedMonth', function(event, data) {
        $scope.playback.search.selectedDate = data;
        showRecordingDate(data.getFullYear(), pad(data.getMonth() + 1));
      }, $scope);

      /*
       * @author Yongku Cho
       * @desc Add key event
       */
      var documentBody = document.body;
      var keyUpHandler = function(event) {
        var keyCode = event.which || event.keyCode;
        if (keyCode === KEY.ESC) {
          documentBody.removeEventListener('keyup', keyUpHandler);
          $scope.cancel();
        }
      };
      documentBody.addEventListener("keyup", keyUpHandler);
      /*
       * @author Yongku Cho
       * @desc Add Click Event
       */
      var clickHandler = function(event) {
        if ($(event.target).hasClass('modal')) {
          var searchModal = $("#search-box").parent().parent().parent();
          searchModal.unbind("mousedown", clickHandler);
          $scope.cancel();
        }
      };

      $timeout(function() {
        var searchModal = $("#search-box").parent().parent().parent();
        searchModal.bind("mousedown", clickHandler);
      });

      /**
       * when open PlaybackDatepicker menu, call this function by timeline.js
       * @function : showMenu
       * @description : set ng-model value to default date
       */
      $scope.showMenu = function() {
        currentDate = searchData.getSelectedDate();
        $scope.playback.search.selectedDate = new Date(currentDate);
        showRecordingDate(currentDate.getFullYear(), pad(currentDate.getMonth() + 1));
        $timeout(function() {
          $scope.$apply();
        });
      };

      $scope.$on('$destroy', function() {
        documentBody.removeEventListener('keyup', keyUpHandler);
      });
    },
    scope: {
      getSelectedDate: '=',
      control: '=',
      showMenu: '=',
    },
    link: function(scope) {
      scope.getSelectedDate = scope.ok;
    },
  };
});