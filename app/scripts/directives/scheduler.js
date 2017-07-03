kindFramework.
    directive('scheduler', ['$rootScope', '$timeout', 'eventRuleService', 'SunapiClient', '$translate', '$uibModal', '$window', 'UniversialManagerService',
      function($rootScope, $timeout, eventRuleService, SunapiClient, $translate, $uibModal, $window, UniversialManagerService) {
        'use strict';
        return {
          restrict: 'E',
          scope: false,
          template:'<div id="calendar"></div>',
          link: function(scope, elem, attrs) {
            var moment = $window.moment;
            var eventObjs = [];
            var eventIdArray = [];
            var eventCount = 0;
            var EventRule = null;// = scope.$parent.EventRule;
            var ScheduleIds = null;// = EventRule.ScheduleIds;
            var visibility = null;
            var resized = false;
            var curDuration = '00:30:00';
            var activeMenu = '';
            var alreadyCreated = false;
            var defaultDate = '';
            var initialRendered = false;
            var initializing = false;
            var currentUnit = '30';
            var currentScheduleType = null;
            var currentPage = UniversialManagerService.getCurrentSetupPage();
            // var prevEventObjs = null;

            // eventObjs = setEventSources();

            function setEventSources() { //console.info('setEventSources ::: ');console.info(ScheduleIds);
              var eventArray = new Array(ScheduleIds.length);
              for (var i = 0; i < ScheduleIds.length; i++) {
                var obj = convertIdToDate(ScheduleIds[i]);//console.info(ScheduleIds[i]);console.info(obj);
                eventArray[i] = angular.copy(obj);
              }
              eventObjs = angular.copy(eventArray);//console.info(eventArray);
              if (initializing) {
                eventRuleService.setInitialScheduleData({
                  menu: currentPage,
                  type: currentScheduleType,
                  data: ScheduleIds,
                });
                initializing = false;
              }
              eventRuleService.setScheduleData({
                menu: currentPage,
                type: currentScheduleType,
                data: ScheduleIds,
              });

              // console.info('end of setEventSources ===================== ');
            }

            function getEventSources() { //console.info('getEventSources ::: ');

              var scheduleIds = [];
              var tEventObjs = angular.copy(eventObjs);

              for (var i = 0; i < tEventObjs.length; i++) {
                var tElement = tEventObjs[i];
                var result = convertDateToId(tElement);
                if (typeof result === 'string') {
                  scheduleIds.push(angular.copy(result));
                } else {
                  for (var k = 0; k < result.length; k++) {
                    var element = angular.copy(result[k]);
                    scheduleIds.push(angular.copy(element));
                  }
                }
              }
              if (activeMenu === 'alarmInput') {
                scope.EventRules[scope.AlarmData.SelectedAlarm].ScheduleIds = angular.copy(scheduleIds); // temporarily index 0
              } else if (activeMenu === 'storage') {
                scope.RecordSchedule.ScheduleIds = angular.copy(scheduleIds);
              } else {
                scope.EventRule.ScheduleIds = angular.copy(scheduleIds);
              }

              eventRuleService.setScheduleData({menu: currentPage, type:currentScheduleType, data:scheduleIds});

            }

            function mergeTheInitial() { //console.info('mergeTheInitial :: ');console.info('before merge : ');
              var tEventObjs = eventObjs;
              var prevEvent = null;
              var eventMerged = false;
              var eventItem = null;
              var removingItem = null;
              var targetItemToMerge = [];
              var curIndex = 0;

              for (var i = 0; i < tEventObjs.length; i++) {
                if (i === 0) {
                  prevEvent = tEventObjs[i];//console.info('prevEvent : ');console.info(moment(prevEvent.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(prevEvent.end).format('YYYY-MM-DDTHH:mm'));
                } else {
                  var startTime = moment(tEventObjs[i].start).format('YYYY-MM-DDTHH:mm');//console.info('prevEvent : ');console.info(moment(prevEvent.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(prevEvent.end).format('YYYY-MM-DDTHH:mm'));
                      // console.info('target time : ');console.info(startTime);console.info(endTime);
                  var prevEndTime = moment(prevEvent.end).format('YYYY-MM-DDTHH:mm');

                  if (prevEndTime === startTime && !(moment(prevEvent.end).format('HH:mm') === '00:00' && moment(tEventObjs[i].start).format('HH:mm') === '00:00')) { // case to merge
                    eventItem = prevEvent;
                    eventItem.end = tEventObjs[i].end;
                    removingItem = tEventObjs[i];

                          // find event object in calendar
                    var eventObj = null;
                    for (var k = 0; k < tEventObjs.length; k++) {
                      eventObj = tEventObjs[k];
                      if (eventObj.id === eventItem.id) {
                        eventObj.start = eventItem.start;
                        eventObj.end = eventItem.end;
                        targetItemToMerge[curIndex] = eventObj;
                                  // console.info('merged item :: ');
                                  // console.info(moment(eventObj.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(eventObj.end).format('YYYY-MM-DDTHH:mm'));
                        eventMerged = true;
                        break;
                      }
                    }

                    if (eventMerged) {
                      prevEvent = eventObj; // previously eventItem
                      removeEvent(removingItem);
                      eventMerged = false;
                    }
                  } else {
                    prevEvent = tEventObjs[i];
                    curIndex++;
                  }
                }
              }
              // console.info('end of mergeTheInitial ===============');
              for (var a = 0; a < targetItemToMerge.length; a++) {
                if (typeof targetItemToMerge[a] !== 'undefined') {
                  $('#calendar').fullCalendar('updateEvent', targetItemToMerge[a]);
                }
              }
            }

            function mergeTheDropped(start, end, eventId) {
              var eventMerged = false;
              var tEventObjs = angular.copy(eventObjs); //eventObjs;
              var eventItem = null;
              var removingItem = null;
              var result = null;
              var tStart = start;
              var tEnd = end;
              var tId = eventId;
              var forwardMerged = false;
              var backwardMerged = false;

              for (var i = 0; i < tEventObjs.length; i++) {
                eventItem = angular.copy(tEventObjs[i]);
                if (eventItem !== null && typeof eventItem !== 'undefined') {
                  if (tId === eventItem.id) {
                    continue;
                  }
                  if (moment(tStart).format('YYYY-MM-DDTHH:mm') === moment(eventItem.end).format('YYYY-MM-DDTHH:mm')) {
                    result = eventItem;
                    result.end = tEnd;
                    eventMerged = true;
                    forwardMerged = true;
                  } else if (moment(tEnd).format('YYYY-MM-DDTHH:mm') === moment(eventItem.start).format('YYYY-MM-DDTHH:mm')) {
                    if (!forwardMerged) {
                      result = eventItem;
                      result.start = tStart;
                      eventMerged = true;
                      backwardMerged = true;
                    } else {
                      result.end = eventItem.end;
                      removingItem = eventItem;
                              // result.start = tStart;
                      eventMerged = true;
                      backwardMerged = true;
                    }
                  }
                }
              }
              if (eventMerged) {
                for (var k = 0; k < tEventObjs.length; k++) {
                  var eventObj = angular.copy(tEventObjs[k]);
                  if (eventObj.id === result.id) {
                    eventObj.start = result.start;
                    eventObj.end = result.end;
                    $('#calendar').fullCalendar('updateEvent', eventObj);
                          // break each loop
                    break;
                  }
                }
                if (forwardMerged && backwardMerged) {
                  return removingItem;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            }

            function mergeTheSelected(start, end) { //console.info('mergeTheSelected :: ');console.info('before merge :');console.info(eventObjs);
              var eventData = null;
              var eventMerged = false;
              var between = false;
              var tEventObjs = angular.copy(eventObjs);// eventObjs;
              var removingItem = null;
              var removingItem2 = null;
              var tStart = start;
              var tEnd = end;
              var resizedEvent = null;
              var index = 0;
              var index2 = 0;
              var index3 = 0;
              var item = null;

              if (resized) {
                tStart = start.start;
                tEnd = start.end;
                resizedEvent = start;
                resized = false;
              }

              for (index = 0; index < tEventObjs.length; index++) {
                var eventItem = angular.copy(tEventObjs[index]);
                if (resizedEvent !== null) {
                  if (eventItem.id === resizedEvent.id) {
                    continue;
                  }
                }
                if (moment(tStart).format('YYYY-MM-DD') === moment(eventItem.start).format('YYYY-MM-DD')) { // only on the same day
                  if (eventItem !== null && typeof eventItem !== 'undefined') {
                    if (moment(tStart).format('YYYY-MM-DDTHH:mm') === moment(eventItem.start).format('YYYY-MM-DDTHH:mm')) {
                      if (moment(tEnd).format('YYYY-MM-DDTHH:mm') >= moment(eventItem.end).format('YYYY-MM-DDTHH:mm')) {
                                 // ========
                                 // --------
                                 // ------------
                        eventMerged = true;
                        eventItem.end = tEnd;
                      } else {
                                  // ==========
                                  // ----
                        eventMerged = true;
                      }
                    }                          else if (moment(tStart).format('YYYY-MM-DDTHH:mm') > moment(eventItem.start).format('YYYY-MM-DDTHH:mm')) {
                      if (moment(tStart).format('YYYY-MM-DDTHH:mm') <= moment(eventItem.end).format('YYYY-MM-DDTHH:mm')) {
                        if (moment(tEnd).format('YYYY-MM-DDTHH:mm') >= moment(eventItem.end).format('YYYY-MM-DDTHH:mm')) { //console.info(moment(tStart).format('YYYY-MM-DDTHH:mm'));console.info(moment(tEnd).format('YYYY-MM-DDTHH:mm'));console.info(moment(eventItem.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(eventItem.end).format('YYYY-MM-DDTHH:mm'));
                                      // ===========
                                      //      ------------
                                      //      ------
                                      //            --------
                          eventItem.end = tEnd;
                          eventMerged = true;

                          for (index2 = index + 1; index2 < tEventObjs.length; index2++) { // case of between
                            item = angular.copy(tEventObjs[index2]);
                                          // if(moment(eventItem.start).format('YYYY-MM-DDTHH:mm') < moment(item.start).format('YYYY-MM-DDTHH:mm')) {
                            if (moment(eventItem.end).format('YYYY-MM-DDTHH:mm') === moment(item.start).format('YYYY-MM-DDTHH:mm')) {
                                                  // if(moment(eventItem.end).format('YYYY-MM-DDTHH:mm') <= moment(item.end).format('YYYY-MM-DDTHH:mm')) {
                                                      // console 5, 6
                              eventItem.end = item.end;
                              between = true;//console.info('between removing item :');
                              eventMerged = true;//console.info(moment(item.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(item.end).format('YYYY-MM-DDTHH:mm'));
                              removingItem = item;//console.info(removingItem);
                                                  // }
                            }
                                          // }
                          }
                        } else {
                                      // ===========
                                      //     ----
                          eventMerged = true;
                        }
                      } else {
                        eventMerged = false;
                      }
                    }                          else if (moment(tStart).format('YYYY-MM-DDTHH:mm') < moment(eventItem.start).format('YYYY-MM-DDTHH:mm')) {
                      if (moment(tEnd).format('YYYY-MM-DDTHH:mm') >= moment(eventItem.start).format('YYYY-MM-DDTHH:mm')) {
                        if (moment(tEnd).format('YYYY-MM-DDTHH:mm') <= moment(eventItem.end).format('YYYY-MM-DDTHH:mm')) {
                                      //      ========
                                      // --------
                                      // -------------
                                      // -----
                          if (!between) {
                            eventItem.start = tStart;
                            eventMerged = true;
                          }
                          if (resizedEvent !== null) {
                            removingItem = eventItem;
                            resizedEvent.end = eventItem.end;
                          }

                          for (index3 = 0; index3 < tEventObjs.length; index3++) { // case of between
                            item = angular.copy(tEventObjs[index3]);
                            if (moment(eventItem.start).format('YYYY-MM-DDTHH:mm') === moment(item.end).format('YYYY-MM-DDTHH:mm')) {
                              eventItem.start = item.start;
                              between = true;
                              eventMerged = true;
                              removingItem2 = item;
                            }
                          }
                        } else {
                                      //      =====
                                      //  -------------
                                      // start ~ end
                          eventMerged = true;
                          eventItem.start = tStart;
                          eventItem.end = tEnd;
                        }
                      } else {
                        eventMerged = false;
                      }
                    }

                    if (eventMerged)                          {
                      if (between || resizedEvent !== null) {
                                  // removeEvent(removingItem);
                        if (between) {
                          eventData = eventItem;
                          between = false;
                        } else {
                          eventData = resizedEvent;
                        }
                                  // return;
                      } else {
                        eventData = eventItem;
                      }

                              // find event object in calendar
                      for (var j = 0; j < tEventObjs.length; j++) {
                        var eventObj = angular.copy(tEventObjs[j]);
                        if (eventObj.id === eventData.id) {
                          eventObj.start = eventData.start;//console.info('merged item :: ');
                          eventObj.end = eventData.end;//console.info(moment(eventObj.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(eventObj.end).format('YYYY-MM-DDTHH:mm'));
                          $('#calendar').fullCalendar('updateEvent', eventObj);
                          break;
                        }
                      }
                      if (removingItem !== null && typeof removingItem !== 'undefined') { // remove and let calendar update events after updating
                        removeEvent(removingItem);
                      }
                      if (removingItem2 !== null && typeof removingItem2 !== 'undefined') {
                        removeEvent(removingItem2);
                      }
                      return;
                    }
                  }
                }
              }
              if (!eventMerged && resizedEvent === null) {
                  // console.log('adding event id: '+eventcount);
                var emptyId = null;
                for (var i = 0; i <= eventIdArray.length; i++) {
                  if (eventIdArray.indexOf(i) === -1) {
                    emptyId = i;
                    eventIdArray.push(i);
                    eventCount++;
                    break;
                  }
                }

                eventData = {
                  id: emptyId, // identifier
                  start: tStart,
                  end: tEnd,
                  color: '#FF7C00',
                  title: '',
                };
              
                $('#calendar').fullCalendar('renderEvent', eventData, true);
              }
              // console.info('end of mergeTheSelected ====================== ');
            }

            function mergeTheResized(resizedItem) { //console.info('start of mergeTheResized ====================== ');
              // console.info(moment(resizedItem.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(resizedItem.end).format('YYYY-MM-DDTHH:mm'));
              var tEventObjs = angular.copy(eventObjs); //eventObjs;
              var eventItem = null;
              var removingItem = null;
              var targetItem = angular.copy(resizedItem);

              for (var i = 0; i < tEventObjs.length; i++) {
                eventItem = angular.copy(tEventObjs[i]);
                if (moment(eventItem.start).format('YYYY-MM-DDTHH:mm') === moment(targetItem.end).format('YYYY-MM-DDTHH:mm')) {
                  targetItem.end = angular.copy(eventItem.end);
                  removingItem = angular.copy(eventItem);
                  $('#calendar').fullCalendar('updateEvent', targetItem);
                  return removingItem;
                }
              }

              // console.info('end of mergeTheResized ====================== ');
              return null;
            }

            function checkFromToMin(start, end, id) {
              var target = null;
              var tEventObjs = angular.copy(eventObjs);
              var index = 0;
              if (typeof id !== 'undefined') { // drop & resize
                  // if(moment(start).format('YYYY-MM-DDTHH') !== moment(end).format('YYYY-MM-DDTHH')) { // on the different day
                for (index = 0; index < tEventObjs.length; index++) {
                  target = tEventObjs[index];
                  if (target.id !== id) {
                    // except between
                    if(moment(target.start).format('HH:mm') === '00:00' && moment(target.end).format('HH:mm') === '00:00' && moment(target.end).format('YYYY-MM-DDTHH:mm') === moment(start).format('YYYY-MM-DDTHH:mm')) {
                      // 00:00 ~ 00:00 & 00:00 ~ 00:00
                      return 'exception';
                    }
                    if (moment(target.start).format('YYYY-MM-DDTHH:mm') === moment(end).format('YYYY-MM-DDTHH:mm')) { // merging case
                      return true;
                    } else if (moment(target.end).format('YYYY-MM-DDTHH:mm') === moment(start).format('YYYY-MM-DDTHH:mm')) { // merging case
                      return true;
                    } else { // not merging case so check existing event
                      if (moment(target.start).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH') ||
                                  moment(target.start).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH') ||
                                  moment(target.end).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH') ||
                                  moment(target.end).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH')) {
                        if (moment(target.start).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH')) {
                          return false;
                        }
                        if (moment(target.end).format('mm') !== '00') {
                          return false;
                        }
                        if (moment(end).format('mm') === '00') {
                          return true;
                        }
                        if (moment(start).format('mm') === '00') {
                          return true;
                        }
                      }
                    }
                  }
                }
                return true;
                  // } else { // on the same day
                  //     return true;
                  // }
              } else { // select
                if (moment(start).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH')) { // on the same hour
                      // find existing event in the same hour
                  for (index = 0; index < tEventObjs.length; index++) {
                    target = tEventObjs[index];
                    if (moment(target.start).format('YYYY-MM-DDTHH:mm') === moment(end).format('YYYY-MM-DDTHH:mm')) {
                              // merged
                      return true;
                    } else if (moment(target.end).format('YYYY-MM-DDTHH:mm') === moment(start).format('YYYY-MM-DDTHH:mm')) {
                              //merged
                      return true;
                    } else {
                          // not merged
                      if (moment(target.start).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH') ||
                                  moment(target.start).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH') ||
                                  moment(target.end).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH') ||
                                  moment(target.end).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH')) {
                        if (moment(target.start).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH')) {
                          return false;
                        }
                        if (moment(target.end).format('mm') !== '00') {
                          return false;
                        }
                        if (moment(end).format('mm') === '00') {
                          return true;
                        }
                        if (moment(start).format('mm') === '00') {
                          return true;
                        }
                      }
                    }
                  }
                  return true;
                } else { // on the different hour
                  var sSuccess = false;
                  var eSuccess = false;
                  for (index = 0; index < tEventObjs.length; index++) {
                    target = tEventObjs[index];
                    if (moment(target.end).format('YYYY-MM-DDTHH:mm') === moment(start).format('YYYY-MM-DDTHH:mm')) {
                              // merged
                      sSuccess = true;
                    }
                    if (moment(target.start).format('YYYY-MM-DDTHH:mm') === moment(end).format('YYYY-MM-DDTHH:mm')) {
                              // merged
                      eSuccess = true;
                    }
                  }
                  if (sSuccess && eSuccess) {
                    return true;
                  } else {
                    if (!sSuccess) {
                      for (index = 0; index < tEventObjs.length; index++) {
                        target = tEventObjs[index];
                        if (moment(target.start).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH') ||
                                      moment(target.end).format('YYYY-MM-DDTHH') === moment(start).format('YYYY-MM-DDTHH')) {
                          if (moment(target.end).format('mm') === '00') {
                            return true;
                          } else {
                            return false;
                          }
                                    // unreachable code
                                    //   if(moment(end).format('mm') === '00') {
                                    //       return true;
                                    //   }
                                    //   if(moment(start).format('mm') === '00') {
                                    //       return true;
                                    //   }
                        }
                      }
                    }
                    if (!eSuccess) {
                      for (index = 0; index < tEventObjs.length; index++) {
                        target = tEventObjs[index];
                        if (moment(target.start).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH') ||
                                      moment(target.end).format('YYYY-MM-DDTHH') === moment(end).format('YYYY-MM-DDTHH')) {
                          if (moment(end).format('mm') === '00') {
                            return true;
                          } else {
                            return false;
                          }
                                    // unreachable code
                                    //   if(moment(end).format('mm') === '00') {
                                    //       return true;
                                    //   }
                                    //   if(moment(start).format('mm') === '00') {
                                    //       return true;
                                    //   }
                        }
                      }
                    }
                    return true;
                  }
                }
              }
            }

            function removeEvent(source) {
              var tId = source.id;
              $('#calendar').fullCalendar('removeEvents', tId);
              var index = eventIdArray.indexOf(tId);
              eventIdArray.splice(index, 1);
              eventCount -= 1;
              // console.info('after removed event : ');console.info(eventIdArray);
            }

            function createCalendar() {

              $('#calendar').fullCalendar({
                contentHeight: function() {
                  $('#calendar .fc-scroller').css({
                    maxHeight: 600+"px",
                    overflowY: "auto"
                  });
                },
                customButtons: {
                  customSlotDuration1: {
                          // icon: ' tui-ch-playback-search tui',
                    text: '1 ' + $translate.instant('lang_minute'),
                    click: function() {
                      $('#calendar').fullCalendar('option', 'slotDuration', '00:01:00');
                      currentUnit = '1';
                    }
                  },
                  customSlotDuration2: {
                          // icon: ' tui-ch-playback-search tui',
                    text: '30 ' + $translate.instant('lang_minute'),
                    click: function() {
                      $('#calendar').fullCalendar('option', 'slotDuration', '00:30:00');
                      currentUnit = '30';
                    }
                  },
                  customSlotDuration3: {
                          // icon: ' tui-ch-playback-search tui',
                    text: '1 ' + $translate.instant('lang_hour'),
                    click: function() {
                      $('#calendar').fullCalendar('option', 'slotDuration', '00:60:00');
                      currentUnit = '60';
                    }
                  },
                  clearAll: {
                          // icon: ' tui-delete tui',
                    text: $translate.instant('lang_reset'),
                    click: function() {
                      var modalInstance = $uibModal.open({
                        templateUrl: 'views/setup/common/confirmMessage.html',
                        controller: 'confirmMessageCtrl',
                        size: 'sm',
                        resolve: {
                          Message: function() {
                            return 'lang_msg_system_management_info';
                          }
                        }
                      });
                      modalInstance.result.then(function() {
                        deleteAll();
                      }, function() {});
                    }
                  }
                },
                header: {
                  right: '',
                  left: 'customSlotDuration1, customSlotDuration2, customSlotDuration3, clearAll',
                },
                views: {
                  agenda: { // name of view
                    timeFormat: 'HH:mm',
                  },
                },
                eventOverlap: false,
                defaultView: 'agendaWeek',
                defaultDate: defaultDate,

                  // --------------------- Agenda Options -------------------
                allDaySlot: false, // Determines if the "all-day" slot is displayed at the top of the calendar.
                  // allDayText: 'All Day', // The text titling the "all-day" slot at the top of the calendar.
                slotDuration: curDuration, // The frequency for displaying time slots.
                slotLabelFormat: 'HH:mm',
                slotEventOverlap: false, // Determines if timed events in agenda view should visually overlap.
                  // slotLabelInterval:
                scrollTime: '00:00:00',
                dragScroll: true,
                displayEventTime: true, // Whether or not to display the text for an event's time.
                displayEventEnd: true, // Whether or not to display an event's end time text when it is rendered on the calendar.
                selectable: true,
                selectHelper: true,
                editable: true,
                eventDurationEditable: true,
                dayNames: ['', '', '', '', '', '', ''],
                dayNamesShort:['', '', '', '', '', '', ''],

                eventLimit: true, // allow "more" link when too many events
                eventColor: '#FF7C00',
                selectConstraint:{ // limit selectable to one day.
                  start: '00:00',
                  end: '24:00',
                },
                eventConstraint :{
                  start: '00:00',
                  end: '24:00'
                },
                selectOverlap: false,
                events: eventObjs,
                select: function(start, end, jsEvent, view, resource) {
                  if (currentUnit === '60') {
                    mergeTheSelected(start, end);
                  } else {
                    var result = checkFromToMin(start, end);
                    if (result === true) {
                      mergeTheSelected(start, end);
                    } else if (result === false) {
                      $('#calendar').fullCalendar('unselect');
                    }
                  }
                },
                eventAfterAllRender: function(view) {
                  if (!initialRendered) {
                    initialRendered = true;
                    $('#calendar').fullCalendar('unselect'); // to visually update all rendered things, it should be called...
                    eventObjs = angular.copy($('#calendar').fullCalendar('clientEvents'));
                    // prevEventObjs = eventObjs;
                    mergeTheInitial();
                  } else {
                    $('#calendar').fullCalendar('unselect'); // to visually update all rendered things, it should be called...
                    eventObjs = angular.copy($('#calendar').fullCalendar('clientEvents'));
                    updateScheduler();
                  }
                  resized = false;
                },
                eventAfterRender: function(event, $el, view) {
                      // Triggered after an event has been placed on the calendar in its final position.
                      // console.info('eventAfterRender');
                  $el.removeClass('fc-short');
                },
                eventDestroy: function(event, element, view) {
                      // Called before an event's element is removed from the DOM.
                      // console.info('eventDestroy');
                },
                eventRender: function(event, element, view) {
                      // Triggered while an event is being rendered.
                      // console.info('eventRender :: ');
                },
                dayClick: function(date, jsEvent, view) { // Triggered when the user clicks on a day.
                },
                eventClick: function(calEvent, jsEvent, view) { // Triggered when the user clicks an event.
                      // console.info('eventClick');
                  removeEvent(calEvent);
                },
                eventDrop: function(event, delta, revertFunc, jsEvent, ui, view) { // Triggered when dragging stops and the event has moved to a different day/time.
                      // when finish dragging and dropping selected cells.
                  var tEvent = null;
                  var merged = null;
                  if (currentUnit === '60') {
                    tEvent = angular.copy(event);
                    merged = mergeTheDropped(tEvent.start, tEvent.end, tEvent.id);
                    if (merged === true) { // merged
                      removeEvent(tEvent);
                    } else if (merged !== false) { // between merged
                      removeEvent(tEvent);
                      removeEvent(merged);
                    }
                  } else {
                    tEvent = angular.copy(event);
                    var result = checkFromToMin(tEvent.start, tEvent.end, tEvent.id);
                    if (result === true) {
                      merged = mergeTheDropped(tEvent.start, tEvent.end, tEvent.id);
                      if (merged === true) { // merged
                        removeEvent(tEvent);
                      } else if (merged !== false) { // between merged
                        removeEvent(tEvent);
                        removeEvent(merged);
                      }
                    } else if (result === false) {
                      revertFunc();
                    } else if (result === 'exception') {
                              // exception in case of event drop to handle later
                    }
                  } 
                },
                eventResize: function(event, delta, revertFunc, jsEvent, ui, view) { // Triggered when resizing stops and the event has changed in duration.
                  // eventResizeStop: function(event, jsEvent, ui, view){
                      // console.info('eventResize :: ');console.info(moment(event.start).format('YYYY-MM-DDTHH:mm'));console.info(moment(event.end).format('YYYY-MM-DDTHH:mm'));
                  var removingItem = null;
                  if (currentUnit === '60') {
                    resized = true;
                    removingItem = mergeTheResized(event);
                    if (removingItem !== null) {
                      removeEvent(removingItem);
                    }
                  } else {
                    var result = checkFromToMin(event.start, event.end, event.id);
                    if (result === true) {
                      resized = true;
                      removingItem = mergeTheResized(event);
                      if (removingItem !== null) {
                        removeEvent(removingItem);
                      }
                    } else if (result === false) {
                      revertFunc();
                    }
                  }
                }
              });

              // setVisibility("Scheduled");
              alreadyCreated = true;
            }

            function updateScheduler() { //console.info('updateScheduler');
              getEventSources();
              // schedulerService.set();
            }

            function setVisibility(value) {
              var v = value;
              currentScheduleType = value;
              eventRuleService.setScheduleType(value);
              if (value === "Always") {
                v = "hidden";
                $("#calendar").css({"display": "none"});
              } else if (value === "Scheduled") {
                v = "visible";
                $("#calendar").css({"display": "block"});
                $("#calendar").css({"margin-top": "20px"});
              } else {
                return;
              }
              visibility = v;
              $("#calendar").css({"visibility": visibility});
            }

            function deleteAll(flag) { //console.info('deleteAll ::: ');
              // var objs = angular.copy(eventObjs);
              var objs = angular.copy($('#calendar').fullCalendar('clientEvents'));
              for (var j = 0; j < objs.length; j++) {
                removeEvent(objs[j]);
              }
            }

            function setMinusOneMin(data, type) { // minus 1 from endMinute in case of hour so BE set time from 0 ~ 59
              var result = null;
              var item = null;
              var tItem = null;
              if (type === 'string') {
                item = data;
                item = item.split('.');
                if (item.length === 2) {
                  result = item[0] + '.' + item[1] + '.' + '0' + '.' + '59';
                } else if (item.length === 4) {
                  tItem = parseInt(item[3]);
                  if (tItem !== 59 && tItem !== 0) { // no need to minus
                    tItem -= 1;
                  } else {
                    return null;
                  }
                  item[3] = tItem + '';
                  result = item[0] + '.' + item[1] + '.' + item[2] + '.' + item[3];
                }
                return result;
              } else if (type === 'array') {
                var array = data;
                var exception = false;
                var lastItem = null;
                var lastIndex = null;

                for (var k = 0; k < array.length; k++) {
                  tItem = array[k];
                  tItem = tItem.split('.');
                  if (tItem.length === 4) {
                    lastIndex = k;
                    if (k !== 0) {
                      exception = true;
                    }
                  }
                }

                if (lastIndex !== null) { // hours & mins
                  if (exception === true) { // h:m ~ h:00
                    lastItem = array[0];
                    lastIndex = 0;
                  } else { // h:00 ~ h:m
                    lastItem = array[0];
                    lastIndex = 0;
                  }
                } else { // h:00 ~ h:00
                  lastItem = array[array.length - 1];
                  lastIndex = array.length - 1;
                }

                lastItem = lastItem.split('.');
                if (lastItem.length === 2) {
                  for (var i = 0; i < array.length; i++) {
                    item = array[i];
                    item = item.split('.');
                    if (i === lastIndex) {
                      result = item[0] + '.' + item[1] + '.' + '0' + '.' + '59';
                      array[i] = result;
                    }
                  }
                } else if (lastItem.length === 4) {
                  for (var j = 0; j < array.length; j++) {
                    item = array[j];
                    item = item.split('.');
                    if (j === lastIndex) {
                      tItem = parseInt(item[3]);
                      if (tItem !== 59 && tItem !== 0) { // no need to minus
                        tItem -= 1;
                      } else {
                        continue;
                      }
                      item[3] = tItem + '';
                      result = item[0] + '.' + item[1] + '.' + item[2] + '.' + item[3];
                      array[j] = result;
                    }
                  }
                }
                return array;
              }
            }

            // function setPlusOneMin(hour, minute) {
            //   var endHour = parseInt(hour);
            //   var endMinute = parseInt(minute);

            //   if (endMinute !== 0) { // minute
            //     endMinute += 1;
            //     if (endMinute === 60) { // 00 min
            //       if (endHour !== 24 && endHour !== 0) {
            //         endHour += 1;
            //         endHour += '';
            //         endMinute = '00';
            //       }
            //     } else {
            //       endHour += '';
            //       endMinute += '';
            //     }
            //   } else { // do nothing
            //     endHour += '';
            //     endMinute += '';
            //   }
            //   if (endHour.length === 1) {
            //     endHour = '0' + endHour;
            //   }
            //   endMinute += '';
            //   if (endMinute.length === 1) {
            //     endMinute = '0' + endMinute;
            //   }
            //   return [endHour, endMinute];
            // }

            function convertDateToId(data) { //console.info('convertDateToId :: ');
              var result;
              var start = moment(data.start).format('YYYY-MM-DDTHH:mm');//console.info(start);
              var end = moment(data.end).format('YYYY-MM-DDTHH:mm');//console.info(end);
              if (start.indexOf('P') !== -1) {
                start = start.split('P');
              } else if (start.indexOf('A') !== -1) {
                start = start.split('A');
              } else if (start.indexOf('T') !== -1) {
                start = start.split('T');
              }
              var startDate = start[0];
              var startTime = start[1];
              startDate = new Date(startDate);
              var startDay = startDate.getDay();
              var startTime = startTime.split(':');
              var startHour = startTime[0];
              var startMinute = startTime[1];

              if (end.indexOf('P') !== -1) {
                end = end.split('P');
              } else if (end.indexOf('A') !== -1) {
                end = end.split('A');
              } else if (end.indexOf('T') !== -1) {
                end = end.split('T');
              }
              var endDate = end[0];
              var endTime = end[1];
              endDate = new Date(endDate);
              var endDay = endDate.getDay();
              var endTime = endTime.split(':');
              var endHour = endTime[0];
              var endMinute = endTime[1];
              var array = null;

              // set day
              switch (startDay) {
                case 0:
                  result = 'lang_sun';
                  break;
                case 1:
                  result = 'lang_mon';
                  break;
                case 2:
                  result = 'lang_tue';
                  break;
                case 3:
                  result = 'lang_wed';
                  break;
                case 4:
                  result = 'lang_thu';
                  break;
                case 5:
                  result = 'lang_fri';
                  break;
                case 6:
                  result = 'lang_sat';
                  break;
                default:
                  break;
              }


              startHour = parseInt(startHour);
              startMinute = parseInt(startMinute);
              endHour = parseInt(endHour);
              endMinute = parseInt(endMinute);

              // set time
              if (endMinute === 0 && startMinute === 0) { // hour
                if ((endHour - startHour) > 1) { // hours
                  array = [];
                      var tDate = result;
                      var first;
                      first = startHour;
                      for(var i = first; i < endHour; i++) {
                          tDate += ('.' + i);
                          array.push(tDate);
                          tDate = result;
                  }//console.info(array);console.info('+++++++++++++++++++++++');
                } else if ((endHour - startHour) < 0) {
                  if (startHour === 23) { // hour
                    result += ('.' + 23);
                  } else { // hours
                    array = [];
                          var first = startHour;
                          var tDate = result;
                          for(var i = first; i <= 23; i++) {
                              tDate += ('.' + i);
                              array.push(tDate);
                              tDate = result;
                    }
                  }
                } else if (startHour === 0 && endHour === 0) { // 00:00 ~ 00:00
                  array = [];
                      var first = startHour;
                      var tDate = result;
                      for(var i = first; i <= 23; i++) {
                          tDate += ('.' + i);
                          array.push(tDate);
                          tDate = result;
                  }
                } else { // an hour
                  if (endHour === 0) {
                    result += ('.' + 23);
                  } else {
                    result += ('.' + startHour);//console.info(result);console.info('+++++++++++++++++++++++');
                  }
                }
              } else if ((endMinute !== 0 || startMinute !== 0) && (endHour - startHour >= 1) || (endMinute !== 0 || startMinute !== 0) && (endHour - startHour < 0)) { // hours & minutes
                array = []; // 02:00 ~ 03:30 , 02:30 ~ 3:00, 02:30 ~ 03:30..
                  var tDate = result;
                  var first;

                if (endHour === 0) {
                  if (startHour === 0) { // in 00:00 ~ 00:59
                    array = [];
                          var tDate = result;
                          var first = 0;
                          for(var i = first; i <= endHour; i++) {
                              tDate += (('.' + i) + '.' + startMinute + '.' + endMinute);
                              array.push(tDate);
                              tDate = result;
                    }//console.info(array);console.info('+++++++++++++++++++++++');
                  } else { // in ~ 24:59
                    array = [];
                          var tDate = result;
                          var first = 23;
                          for(var i = first; i >= startHour; i--) {
                              if(i === first && startMinute === 0 && endMinute === 0) {
                                  tDate += ('.' + 23);
                              } else if(i === first && endMinute !== 0) {
                                  tDate += (('.' + 23) + '.0.' + endMinute);
                              } else if(i === startHour && startMinute !== 0) {
                                  tDate += (('.' + i) + '.' + startMinute + '.' + '59');
                              } else if(i === startHour && startMinute === 0) {
                                  tDate += ('.' + i);
                      } else {
                                  tDate += ('.' + i);
                      }
                              array.push(tDate);
                              tDate = result;
                    }//console.info(array);console.info('+++++++++++++++++++++++');
                  }
                } else if (startHour === 0 && startMinute === 0 && endMinute !== 0) { // 0:00 ~ 1:30
                      // first = endHour - startHour;
                      first = endHour;
                      for(var i = first; i >= startHour; i--) {
                          if(i === first) { // 3:00 ~ 3:30
                              tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                          } else if(i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                              tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                    } else { // 2:00 ~ 3:00
                              tDate += ('.' + i);
                    }
                    array.push(tDate);
                    tDate = result;
                  }//console.info(array);console.info('+++++++++++++++++++++++');
                } else if (startHour === 0 && startMinute !== 0 && endMinute !== 0) { // 0:30 ~ 1:30
                      // first = endHour - startHour;
                  first = endHour;
                  for (var i = first; i >= startHour; i--) {
                    if (i === first) { // 3:00 ~ 3:30
                      tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                    } else if (i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                      tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                    } else { // 2:00 ~ 3:00
                      tDate += ('.' + i);
                    }
                    array.push(tDate);
                    tDate = result;
                  }//console.info(array);console.info('+++++++++++++++++++++++');
                } else if (startHour === 0 && startMinute !== 0 && endMinute === 0) { // 0:30 ~ 1:00
                      // first = endHour - startHour - 1;
                  first = endHour - 1;
                  if (endHour - startHour > 1) {
                    for (var i = first; i >= startHour; i--) {
                      if (i === first && endMinute !== 0) { // 3:00 ~ 3:30
                        tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                      } else if (i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                        tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                      } else { // 2:00 ~ 3:00
                        tDate += ('.' + i);
                      }
                      array.push(tDate);
                      tDate = result;
                    }//console.info(array);console.info('+++++++++++++++++++++++');
                  } else {
                    tDate += (('.' + startHour) + '.' + startMinute + '.' + '59');
                    array.push(tDate);
                    tDate = result;//console.info(array);console.info('+++++++++++++++++++++++');
                  }
                } else if (startHour !== 0 && startMinute === 0 && endMinute !== 0) { // 1:00 ~ 2:30
                      // first = endHour - startHour + 1;
                  first = endHour;
                  for (var i = first; i >= startHour; i--) {
                    if (i === first) { // 3:00 ~ 3:30
                      tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                    } else if (i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                      tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                    } else { // 2:00 ~ 3:00
                      tDate += ('.' + i);
                    }
                    array.push(tDate);
                    tDate = result;
                  }//console.info(array);console.info('+++++++++++++++++++++++');
                } else if (startHour !== 0 && startMinute !== 0 && endMinute === 0) { // 1:30 ~ 2:00
                      // first = endHour - startHour;
                  first = endHour - 1;
                  if (endHour - startHour > 1) {
                    for (var i = first; i >= startHour; i--) {
                      if (i === first && endMinute !== 0) { // 3:00 ~ 3:30
                        tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                      } else if (i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                        tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                      } else { // 2:00 ~ 3:00
                        tDate += ('.' + i);
                      }
                      array.push(tDate);
                      tDate = result;
                    }//console.info(array);console.info('+++++++++++++++++++++++');
                  } else {
                    tDate += (('.' + startHour) + '.' + startMinute + '.' + '59');
                    array.push(tDate);
                    tDate = result;//console.info(array);console.info('+++++++++++++++++++++++');
                  }
                } else if (startHour !== 0 && startMinute !== 0 && endMinute !== 0) { // 1:30 ~ 2:30
                  first = endHour;
                  for (var i = first; i >= startHour; i--) {
                    if (i === first) { // 3:00 ~ 3:30
                      tDate += (('.' + i) + '.' + (0 + '') + '.' + endMinute);
                    } else if (i === startHour && startMinute !== 0) { // 1:30 ~ 1:59
                      tDate += (('.' + i) + '.' + startMinute + '.' + '59'); // issue!
                    } else { // 2:00 ~ 3:00
                      tDate += ('.' + i);
                    }
                    array.push(tDate);
                    tDate = result;
                  }//console.info(array);console.info('+++++++++++++++++++++++');
                }
              } else if ((endMinute === 0 && startMinute !== 0) && (endHour - startHour === 1) || (endMinute === 0 && startMinute !== 0) && (endHour - startHour === -23)) { // 1:30 ~ 2:00
                result += (('.' + startHour) + '.' + startMinute + '.' + '59');//console.info(result);console.info('+++++++++++++++++++++++');
              } else {
                result += (('.' + startHour) + '.' + startMinute + '.' + endMinute);//console.info(result);console.info('+++++++++++++++++++++++');
              }
              //console.info('end of convertDateToId ================== ');
              if (array === null) { // divided into more than one
                var tResult =  setMinusOneMin(result, 'string');
                if (tResult !== null) {
                  return tResult;
                } else {
                  return result;
                }
              } else {
                return setMinusOneMin(array, 'array');
              }
            }

            function convertIdToDate(data) { //console.info('convertIdToDate :: ');
              var target = data.split('.');
              var tDay = target[0];
              var result = new Date(defaultDate);
              var today = result.getDay();
              var distance;
              var eventObj = {};
              var month, startHour, endHour, startMinute, endMinute, date;

              switch (tDay) {
                case 'lang_sun':
                  if (today > 0) {
                    distance = (0 - 7 - today) % 7;
                  } else {
                    distance = (0 + 7 - today) % 7;
                  }
                  break;
                case 'lang_mon':
                  if (today > 1) {
                    distance = (1 - 7 - today) % 7;
                  } else {
                    distance = (1 + 7 - today) % 7;
                  }
                  break;
                case 'lang_tue':
                  if (today > 2) {
                    distance = (2 - 7 - today) % 7;
                  } else {
                    distance = (2 + 7 - today) % 7;
                  }
                  break;
                case 'lang_wed':
                  if (today > 3) {
                    distance = (3 - 7 - today) % 7;
                  } else {
                    distance = (3 + 7 - today) % 7;
                  }
                  break;
                case 'lang_thu':
                  if (today > 4) {
                    distance = (4 - 7 - today) % 7;
                  } else {
                    distance = (4 + 7 - today) % 7;
                  }
                  break;
                case 'lang_fri':
                  if (today > 5) {
                    distance = (5 - 7 - today) % 7;
                  } else {
                    distance = (5 + 7 - today) % 7;
                  }
                  break;
                case 'lang_sat':
                  if (today > 6) {
                    distance = (6 - 7 - today) % 7;
                  } else {
                    distance = (6 + 7 - today) % 7;
                  }
                  break;
                default:
                  break;
              }

              result.setDate(result.getDate() + distance);

              if (target.length > 2) { // minute
                month = (result.getMonth() + 1) + '';
                if (month.length === 1) {
                  month = '0' + month;
                }
                date = result.getDate() + '';
                if (date.length === 1) {
                  date = '0' + date;
                }
                startHour = target[1];
                if (startHour.length === 1) {
                  startHour = '0' + startHour;
                }
                startMinute = target[2];
                if (startMinute.length === 1) {
                  startMinute = '0' + startMinute;
                }
                endMinute = target[3];
                if (endMinute !== '59') { // plus 1 min except for case of 59 which turns into 0
                  endMinute = parseInt(endMinute);
                  endMinute += 1;
                  endMinute += '';
                  endHour = startHour;
                } else if (endMinute === '59' && startMinute === '00') { // convert 59 minute to 00 by adding 1 hour
                  endHour = parseInt(startHour) + 1;
                  endHour += '';
                  if (endHour.length === 1) {
                    endHour = '0' + endHour;
                  }
                  endMinute = '00';
                } else {
                  if (endMinute === '59') { // 30 ~ 59 min
                    endHour = parseInt(startHour) + 1;
                    endHour += '';
                    if (endHour.length === 1) {
                      endHour = '0' + endHour;
                    }
                    endMinute = '00';
                  } else if (startMinute === '00') { // 00 ~ 30 min
                    endMinute = parseInt(endMinute);
                    endMinute += 1;
                    endMinute += '';
                    endHour = startHour;
                  } else {
                    endHour = startHour;
                  }
                }
                if (endMinute.length === 1) {
                  endMinute = '0' + endMinute;
                }

                eventObj.start = result.getFullYear() + '-' + month + '-' + date + 'T' + startHour + ':' + startMinute + ':' + '00';
                eventObj.end = result.getFullYear() + '-' + month + '-' + date + 'T' + endHour + ':' + endMinute + ':' + '00';
                eventObj.id = eventCount;
                eventObj.title = '';
                eventIdArray.push(eventCount);
                eventCount++;
              } else { // hour
                result.setHours(parseInt(target[1]));
                month = (result.getMonth() + 1) + '';
                if (month.length === 1) {
                  month = '0' + month;
                }
                date = result.getDate() + '';
                if (date.length === 1) {
                  date = '0' + date;
                }
                startHour = result.getHours() + '';
                endHour = (result.getHours() + 1) + '';
                if (startHour.length === 1) {
                  startHour = '0' + startHour;
                }
                if (endHour.length === 1) {
                  endHour = '0' + endHour;
                }
                eventObj.start = result.getFullYear() + '-' + month + '-' + date + 'T' + startHour + ':' + '00' + ':' + '00';
                eventObj.end = result.getFullYear() + '-' + month + '-' + date + 'T' + endHour + ':' + '00' + ':' + '00';
                eventObj.id = eventCount;
                eventObj.title = '';
                eventIdArray.push(eventCount);
                eventCount++;
              }
              //console.info('end of convertIdToDate ================== ');
              return eventObj;
            }

            function initCalendar(data) {
              if (typeof data !== 'undefined') {
                EventRule = data;
                ScheduleIds = EventRule.ScheduleIds;
                getCameraDate();
              }
            }

            function getCameraDate() {
              var getData = {};
              SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', getData,
                  function (response) {
                      // console.log("View response in getDateTime: ", response);
                      /** Populate values from SUNAPI and store in the SCOPE */
                    var DateTime = response.data;
                    DateTime.LocalTime = DateTime.LocalTime.split(" ");
                    defaultDate = DateTime.LocalTime[0];
                    initializing = true;
                    setEventSources();
                    createCalendar();
                  },
                  function (error) {
                    console.log(error);
                  }, '', true);
            }

            // in case of changing schedule type while you are in page
            scope.$watch('EventRule.ScheduleType', function(newVal, oldVal) {
              if (typeof newVal === "undefined" || newVal === oldVal) {
                return;
              }
              activeMenu = null;
              if (newVal === 'Always') {
                setVisibility(newVal);
              } else if (newVal === 'Scheduled') {
                if (visibility === null || alreadyCreated === false) {
                  initCalendar(scope.EventRule);
                }
                setVisibility(newVal);
              }
            });

            scope.$watch('RecordSchedule.Activate', function(newVal, oldVal) {
              if (typeof newVal === "undefined" || newVal === oldVal) {
                return;
              }
              activeMenu = 'storage';
              if (newVal === 'Always') {
                setVisibility(newVal);
              } else if (newVal === 'Scheduled') {
                if (visibility === null || alreadyCreated === false) {
                  initCalendar(scope.RecordSchedule);
                }
                setVisibility(newVal);
              }
            });

            scope.$watch('EventRules[0].ScheduleType', function(newVal, oldVal) { // initial alarmInput
              if (typeof newVal === "undefined" || newVal === oldVal) {
                return;
              }
              activeMenu = 'alarmInput';
              if (newVal === 'Always') {
                setVisibility(newVal);
              } else if (newVal === 'Scheduled') {
                if (visibility === null || alreadyCreated === false) {
                  initCalendar(scope.EventRules[0]);
                }
                setVisibility(newVal);
              }
            });
            //---------------------------------------------------------

            scope.$watch('EventRules', function(newVal, oldVal) { // alarmInput
              if (typeof newVal === "undefined" || activeMenu !== 'alarmInput') {
                return;
              }
              if (newVal === 'Always') {
                setVisibility(newVal);
              } else if (newVal === 'Scheduled') {
                if (!alreadyCreated) {
                  initCalendar(scope.EventRules[scope.AlarmData.SelectedAlarm]);
                  setVisibility(newVal);
                }
              }
            });

            // in case of event rules reset by sunapi call in eventActionSetup for multi channel
            scope.$on('EventRulePrepared', function(event, data) { // console.info('scheduler saveon EventRulePrepared : ');console.info(data);console.info(scope.EventSource);
              currentPage = UniversialManagerService.getCurrentSetupPage();
              if (currentPage === 'AlarmInput') {
                activeMenu = 'alarmInput';
                if (data === 'Always') {
                  setVisibility(data);
                } else if (data === 'Scheduled') {
                  if (!alreadyCreated) {
                    initCalendar(scope.EventRules[0]);
                    setVisibility(data);
                  }
                }
              } else {
                if (data === 'Always') {
                  setVisibility(data);
                } else if (data === 'Scheduled') {
                  if (!alreadyCreated) {
                    initCalendar(scope.EventRule);
                    setVisibility(data);
                  }
                }
              }
            });

            scope.$on('recordPageLoaded', function(event, data) {
              UniversialManagerService.setCurrentSetupPage('Storage');
              currentPage = 'Storage';
              activeMenu = 'storage';
              if (data === 'Always') {
                setVisibility(data);
              } else if (data === 'Scheduled') {
                if (!alreadyCreated) {
                  initCalendar(scope.RecordSchedule);
                  setVisibility(data);
                }
              }
              eventRuleService.setInitialScheduleData({menu: currentPage, type:data, data:scope.RecordSchedule.ScheduleIds});
            });

            scope.$watch('pageLoaded', function(newVal, oldVal) {
              if (typeof newVal === "undefined") {
                return;
              }
              if (newVal === true) {
                $timeout(function() {
                  $('#calendar').fullCalendar('render');
                });
              }
            });

            scope.$saveOn('pageLoaded', function(event, data) {
              // if(data === true) {
              $timeout(function() {
                $('#calendar').fullCalendar('render');
              });
              // }
            });

            $rootScope.$saveOn('resetScheduleData', function() {
              alreadyCreated = false;
              initialRendered = false;
              $('#calendar').fullCalendar('destroy');
            }, scope);
          }
        };
      }]);
