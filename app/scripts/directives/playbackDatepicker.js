/*global event */
kindFramework.directive('playbackDatepicker', function() {
    'use strict';
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/livePlayback/directives/playback-datepicker.html',
        controller: function($scope, $timeout, dateConverter, PlaybackInterface, CAMERA_TYPE, $rootScope, SearchDataModel, UniversialManagerService, ModalManagerService) {
            var searchData = new SearchDataModel();
            var recordingDate = [];
            var optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
            var selectedEventList = [];
            var selectedDate = searchData.getSelectedDate();
            var isValueChanged = true;
            var playbackInterfaceService = PlaybackInterface;

            $scope.submitButton = 'lang_search';
            $scope.minDate = new Date(2000, 0, 1);
            $scope.maxDate = new Date(2037, 11, 31);
            $scope.showError = function(message) {
                ModalManagerService.open(
                    'message',
                    {
                        'buttonCount': 0,
                        'message': message
                    }
                );
            };
            $scope.allDay = true;

            $scope.selectAllDay = function() {
                if( $scope.allDay === true ) {
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
                    return pad(Math.floor(sliderTime / 60));
                } else if (wantedElements === 'minutes') {
                    return pad(sliderTime - (Math.floor(sliderTime / 60) * 60));
                } else if (wantedElements === 'seconds') {
                    return "00";
                } else {
                    return pad(Math.floor(sliderTime / 60)) + ":" + pad(sliderTime - (Math.floor(sliderTime / 60) * 60)) + ":" + "00";
                }
            };
            var makeFullPackageOfInputBox = function(wantedElements) {
                if (wantedElements === 'start') {
                    slider.start.hours = document.getElementById('slider-start-time-hours').value;
                    slider.start.minutes = document.getElementById('slider-start-time-minutes').value;
                    slider.start.seconds = document.getElementById('slider-start-time-seconds').value;
                    return stringPad(slider.start.hours) + ":" + stringPad(slider.start.minutes) + ":" + stringPad(slider.start.seconds);
                } else if (wantedElements === 'end') {
                    slider.end.hours = document.getElementById('slider-end-time-hours').value;
                    slider.end.minutes = document.getElementById('slider-end-time-minutes').value;
                    slider.end.seconds = document.getElementById('slider-end-time-seconds').value;
                    return stringPad(slider.end.hours) + ":" + stringPad(slider.end.minutes) + ":" + stringPad(slider.end.seconds);
                } else {
                    console.log("invalid parameter");
                }
            };
            $scope.changeNumToTime = function(inputType, distinctionBranch) {
                if (inputType === 0) {
                    if (slider.start.from === 1440) {
                        slider.start.from = slider.start.from - 1;
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
                    if (slider.end.to === 1440) {
                        slider.end.to = slider.end.to - 1;
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
                return (stringToNum(hours) * 60) + stringToNum(minutes);
            };
            var pad = function(x) {
                return (x < 10 ? "0" + x : x);
            };
            var stringPad = function(x) {
                switch (numToString(x).length) {
                    case 0:
                        return '00';
                    case 1:
                        return '0' + x;
                    case 2:
                        return numToString(x);
                    default:
                        console.log("unexpected keyCode");
                        break;
                }
            };
            var stringToNum = function(x) {
                return x *= 1;
            };
            var numToString = function(x) {
                return x + "";
            };
            var search = function function_name() {
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
                var channelId = searchData.getChannelId();
                var dateInfo = {
                    'year' : year,
                    'month' : month,
                    'channel' : channelId
                };
                playbackInterfaceService.findRecordings(dateInfo).then(function(results) {
                    recordingDate = results;
                    $timeout(function() {
                        $scope.$broadcast('refreshDatepickers');
                        $scope.isLoading = false;
                    });
                }, function(error) {
                    console.log("findRecordings fail");
                    $scope.isLoading = false;
                    $scope.showError("lang_timeout");
                });
            };
            $scope.playback = {
                'search': {
                    mode : 'day',
                    selectedDate: selectedDate
                },
                getDayClass: function(date, mode) {
                    switch (mode) {
                        case 'day':
                            var className = "";
                            if (date.getDay() === 0 || date.getDay() === 6) className = "week";
                            if (new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)) className += " today";
                            for (var i in recordingDate) {
                                if (recordingDate[i].day === pad(date.getDate()) && recordingDate[i].month === pad(date.getMonth() + 1)) {
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
                    selectedDate = $scope.playback.search.selectedDate;
                    if (recordingDate.length === 0) {
                        $scope.showError("lang_msg_timebackupDateError");
                    } else {
                        var isExistFlag = false;
                        for (var i in recordingDate) {
                            if (recordingDate[i].day === pad($scope.playback.search.selectedDate.getDate()) && recordingDate[i].month === pad($scope.playback.search.selectedDate.getMonth() + 1)) {
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
                        if (element.value >= 24) {
                            element.value = "23";
                        }
                        break;
                    case 'slider-start-time-minutes':
                    case 'slider-end-time-minutes':
                    case 'slider-start-time-seconds':
                    case 'slider-end-time-seconds':
                        if (element.value >= 60) {
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
                    if (validTime.defaultTime === undefined) {
                        validTime.defaultTime = "00";
                    }
                    var selectedElement = document.getElementById($event.target.id);
                    selectedElement.setSelectionRange(0, 2);
                    selectedElement.onkeyup = function($event) {
                        if (isDown === false) return;
                        if (/^[0-9]+$/.test(selectedElement.value) === false) {
                            selectedElement.value = selectedElement.value.slice(0, -1);
                        }
                        if (selectedElement.value.length === 2) {
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
                                selectedElement.setSelectionRange(0, 2);
                                isValueChanged = true;
                            }
                        }
                        if (event.keyCode === 39 || event.keyCode === 40) {
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
                            case 9:
                                checkValidValue(selectedElement);
                                $event.preventDefault();
                                break;
                            case 37:
                            case 38:
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
                            var inputType = event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
                            $scope.changeNumToTime(inputType);
                        },
                        min: 0,
                        max: 1440,
                    },
                    hours: searchData.getSelectedStartedTime()[0],
                    minutes: searchData.getSelectedStartedTime()[1],
                    seconds: searchData.getSelectedStartedTime()[2],
                    from: changeTimeToNum(searchData.getSelectedStartedTime()[0], searchData.getSelectedStartedTime()[1]),
                };
                var data2 = {
                    options: {
                        slide: function(event, ui) {
                            var inputType = event.target.getAttribute('ui-slider') === 'slider.start.options' ? 0 : 1;
                            $scope.changeNumToTime(inputType);
                        },
                        min: 0,
                        max: 1440,
                    },
                    hours: searchData.getSelectedEndedTime()[0],
                    minutes: searchData.getSelectedEndedTime()[1],
                    seconds: searchData.getSelectedEndedTime()[2],
                    to: changeTimeToNum(searchData.getSelectedEndedTime()[0], searchData.getSelectedEndedTime()[1]),
                };
                return {
                    start: data,
                    end: data2,
                    timeSections: ['00:00', '06:00', '12:00', '18:00', '24:00'],
                    getTimeSpanStyle: function(index, length) {
                        return {
                            left: index * (1 / (length - 1)) * 100 + '%',
                        };
                    }
                };
            }();
            $scope.ok = function() {
            	var data = {};
                if (search()) {
                    searchData.setSelectedDate(selectedDate);
                    searchData.setSelectedStartedTime([stringPad(slider.start.hours), stringPad(slider.start.minutes), stringPad(slider.start.seconds)]);
                    searchData.setSelectedEndedTime([stringPad(slider.end.hours), stringPad(slider.end.minutes), stringPad(slider.end.seconds)]);
                    data = {
                        'startTime': makeFullPackageOfInputBox('start'),
                        'endTime': makeFullPackageOfInputBox('end'),
                        'date': selectedDate,
                        'eventList': selectedEventList,
                        'fromTimeStep': dateConverter.getMinutes(selectedDate, slider.start.from),
                        'toTimeStep': dateConverter.getMinutes(selectedDate, slider.end.to),
                    };
                    if( data.startTime === '00:00:00' && data.endTime === '23:59:59') {
                        $scope.allDay = true;
                    }
                } else {
                    slider.end.to = slider.start.from + searchData.getDefaultPlusTime();
                    if (slider.end.to >= 1440) slider.end.to = 1440;
                    slider.end.seconds = slider.start.seconds;
                    $scope.changeNumToTime(1, 1);
                    return false;
                }

                return data;
            };
            $scope.cancel = function() {
                $scope.playback.search.selectedDate = selectedDate = searchData.getSelectedDate();
                $scope.playback.search.mode = 'day';
                if( makeFullPackageOfInputBox('start') === '00:00:00' && makeFullPackageOfInputBox('end') ==='23:59:59') {
                    $scope.allDay = true;
                }
            };
            $scope.closeErrorMessage = function() {
                $scope.errorMessage = "";
            };
            $rootScope.$saveOn('onChangedMonth', function(event, data) {
                $scope.playback.search.selectedDate = selectedDate = data;
                showRecordingDate(selectedDate.getFullYear(), pad(selectedDate.getMonth() + 1));
            }, $scope);
            /*
             * @author Yongku Cho
             * @desc Add key event
             */
            var documentBody = document.body;
            var keyUpHandler = function(event) {
                var keyCode = event.which || event.keyCode;
                if (keyCode === 27) {
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
            var currentInputTarget = null;

            $timeout(function(){
                $('.start-time input, .end-time input').bind('mousedown', function(event) {
                    console.log("kind mousedown", event.target);
                    currentInputTarget = event.target;
                });
                var searchModal = $("#search-box").parent().parent().parent();
                searchModal.bind("mousedown", clickHandler);
            });
            var watchVisible = $scope.$watch(function(){return $scope.visibility;} , 
                function(newVal, oldVal) {
                if( newVal === oldVal ) return;
                if( newVal === true ) {
                    $scope.playback.search.selectedDate = selectedDate = searchData.getSelectedDate();
                    showRecordingDate(selectedDate.getFullYear(), pad(selectedDate.getMonth() + 1));
                }
                else {
                    $scope.cancel();
                }
            });

            $scope.$on('$destroy', function() {
                watchVisible();
                documentBody.removeEventListener('keyup', keyUpHandler);
            });
        },
        scope: {
            getSelectedDate: '=',
            control: '=',
            visibility : '='
        },
        link: function(scope, element, attr) {
            scope.getSelectedDate = scope.ok;
        }
    };
});