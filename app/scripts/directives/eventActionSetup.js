kindFramework
    .directive('eventActionSetup', ['LoggingService', 'COMMONUtils', 'Attributes', 'SunapiClient', '$rootScope', 'eventRuleService', 'UniversialManagerService',
    function(LoggingService, COMMONUtils, Attributes, SunapiClient, $rootScope, eventRuleService, UniversialManagerService){
    'use strict';
    return{
        restrict: 'E',
        scope: false,
        templateUrl:'views/setup/common/event-action-setup.html',
        link: function(scope, elem, attrs) {
            var mAttr = Attributes.get();
          var isMultiChannel = false;
            if(mAttr.MaxChannel > 1) {
                isMultiChannel = true;
            } else {
                isMultiChannel = false;
            }
            var isEventActionSupported = mAttr.EventActionSupport;
            var pageData = {};
            var currentPage = null;
            var locationChanging = false;
          var DAYS = {SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6};
          var SCHEDULE = {MAX_LENGTH:4, DAY:0, HOUR:1, FROM_MIN:2, TO_MIN:3};

            function getEventActions() {
                var getData = {};
                var url = '';

            if (currentPage === 'VideoAnalysis' ||
              currentPage === 'FogDetection' ||
              currentPage === 'DefocusDetection' ||
              currentPage === 'FaceDetection' ||
              currentPage === 'AudioAnalysis' ||
              currentPage === 'VideoAnalysis' ||
              currentPage === 'MotionDetection' ||
              currentPage === 'TamperingDetection') {
                    var currentChannel = UniversialManagerService.getChannelId(); 
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
              getData.EventType = 'Channel.' + currentChannel + '.' + currentPage; // EventType=Channel.0.MotionDetection
                } else {
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
                    if(currentPage === 'NetworkEvent') { // SUNAPI NG
                        getData.EventType = 'NetworkDisconnect';
                    } else {
                        getData.EventType = currentPage;
                    }
                }

                return SunapiClient.get(url, getData,
              function(response) {
                            prepareEventActions(response.data.ComplexActions);
                        },
              function(errorData) {
                            console.log(errorData);
                        }, '', true);
            }

            function getEventActionArray() {
                var getData = {};
                var url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
                return SunapiClient.get(url, getData, function(response) {
                    prepareEventActionArray(response.data.ComplexActions);
                }, function(errorData) {
                    console.log(errorData);
                }, '', true);
            }

            function getEventRules() {
                var getData = {};
                getData.EventSource = currentPage;
                return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
              function(response) {
                            prepareEventRules(response.data.EventRules);
                        },
              function(errorData) {
                            console.log(errorData);
                        }, '', true);
            }

            function getEventRuleArray() {
                var getData = {};
                return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
                    prepareEventRuleArray(response.data.EventRules);
                }, function(errorData) {
                    console.log(errorData);
                }, '', true);
            }

            function setEventRules() {
                var url = '';
                var setData = {};

                url = '/stw-cgi/eventrules.cgi?msubmenu=rules&action=update';
                if(scope.EventSource === 'OpenSDK') {
                    setData.Enable = scope.EventRule.Enable;
                }
                setData.RuleIndex = scope.EventRule.RuleIndex;

            setData.EventSource = currentPage;

            setData.EventAction = "";
            if (scope.EventRule.FtpEnable) {
              setData.EventAction += 'FTP,';
            }
            if (scope.EventRule.SmtpEnable) {
              setData.EventAction += 'SMTP,';
            }
            if (scope.EventRule.RecordEnable) {
              setData.EventAction += 'Record,';
            }
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
              if (scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRule.AlarmOutputs[ao].Duration;
              }
            }
            if (scope.EventRule.PresetNumber !== 'Off') {
              setData.EventAction += 'GoToPreset,';
              setData.PresetNumber = scope.EventRule.PresetNumber;
            }
            if (setData.EventAction.length) {
              setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
            }
            setData.ScheduleType = scope.EventRule.ScheduleType;
            // if ($scope.EventRule.ScheduleType === 'Scheduled')
            {
              var diff = $(pageData.EventRule.ScheduleIds).not(scope.EventRule.ScheduleIds).get();
              var sun = 0,
                mon = 0,
                tue = 0,
                wed = 0,
                thu = 0,
                fri = 0,
                sat = 0;
              for (var ss = 0; ss < diff.length; ss++) {
                var str1 = diff[ss].split('.');
                for (var dd = 0; dd < mAttr.WeekDays.length; dd++) {
                  if (str1[SCHEDULE.DAY] === mAttr.WeekDays[dd]) {
                    switch (dd) {
                      case DAYS.SUN:
                        sun = 1;
                        setData["SUN" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.MON:
                        mon = 1;
                        setData["MON" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.TUE:
                        tue = 1;
                        setData["TUE" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.WED:
                        wed = 1;
                        setData["WED" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.THU:
                        thu = 1;
                        setData["THU" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.FRI:
                        fri = 1;
                        setData["FRI" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.SAT:
                        sat = 1;
                        setData["SAT" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      default:
                        break;
                    }
                  }
                }
              }
              for (var tt = 0; tt < scope.EventRule.ScheduleIds.length; tt++) {
                var str2 = scope.EventRule.ScheduleIds[tt].split('.');
                for (var ee = 0; ee < mAttr.WeekDays.length; ee++) {
                  if (str2[SCHEDULE.DAY] === mAttr.WeekDays[ee]) {
                    switch (ee) {
                      case DAYS.SUN:
                        sun = 1;
                        setData["SUN" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SUN" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.MON:
                        mon = 1;
                        setData["MON" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["MON" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.TUE:
                        tue = 1;
                        setData["TUE" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["TUE" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.WED:
                        wed = 1;
                        setData["WED" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["WED" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.THU:
                        thu = 1;
                        setData["THU" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["THU" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.FRI:
                        fri = 1;
                        setData["FRI" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["FRI" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.SAT:
                        sat = 1;
                        setData["SAT" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SAT" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      default:
                        break;
                    }
                  }
                }
              }
              if (sun) {
                setData.SUN = 1;
              }
              if (mon) {
                setData.MON = 1;
              }
              if (tue) {
                setData.TUE = 1;
              }
              if (wed) {
                setData.WED = 1;
              }
              if (thu) {
                setData.THU = 1;
              }
              if (fri) {
                setData.FRI = 1;
              }
              if (sat) {
                setData.SAT = 1;
              }
            }

            SunapiClient.get(url, setData,
              function(response) {
                scope.$emit('setEventRuleCompleted', true);
              },
              function(errorData) {
                console.log(errorData);
                scope.$emit('setEventRuleCompleted', true);
              }, '', true);

            pageData.EventRule = angular.copy(scope.EventRule);
          }

          function setEventActions(channel) {
            var url = '';
            var setData = {};
            var currentChannel = 0;

            if (scope.EventRule.EventType.substring(0, 7) === 'Channel') {
              if (channel === null) { // no channel selection page.
                currentChannel = UniversialManagerService.getChannelId();
              } else { // channel selection page.
                currentChannel = channel;
              }
              url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set';
              setData.EventType = 'Channel.' + currentChannel + '.' + scope.EventSource; // EventType=Channel.0.MotionDetection
            } else {
              url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set';
              setData.EventType = scope.EventRule.EventType;
            }

            setData.EventAction = "";
            if (scope.EventRule.FtpEnable) {
              setData.EventAction += 'FTP,';
            }
            if (scope.EventRule.SmtpEnable) {
              setData.EventAction += 'SMTP,';
            }
            if (scope.EventRule.RecordEnable) {
              setData.EventAction += 'Record,';
            }
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
              if (scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRule.AlarmOutputs[ao].Duration;
              }
            }
            if (scope.EventRule.PresetNumber !== 'Off') {
              setData.EventAction += 'GoToPreset,';
              setData.PresetNumber = scope.EventRule.PresetNumber;
            }
            if (setData.EventAction.length) {
              setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
            }

            if (setData.EventAction.length === 0) {
              setData.EventAction = 'None';
            }

            setData.ScheduleType = scope.EventRule.ScheduleType;
            // if ($scope.EventRule.ScheduleType === 'Scheduled')
            {
              var diff = $(pageData.EventRule.ScheduleIds).not(scope.EventRule.ScheduleIds).get();
              var sun = 0,
                mon = 0,
                tue = 0,
                wed = 0,
                thu = 0,
                fri = 0,
                sat = 0;
              for (var ss = 0; ss < diff.length; ss++) {
                var str1 = diff[ss].split('.');
                for (var dd = 0; dd < mAttr.WeekDays.length; dd++) {
                  if (str1[SCHEDULE.DAY] === mAttr.WeekDays[dd]) {
                    switch (dd) {
                      case DAYS.SUN:
                        sun = 1;
                        setData["SUN" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.MON:
                        mon = 1;
                        setData["MON" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.TUE:
                        tue = 1;
                        setData["TUE" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.WED:
                        wed = 1;
                        setData["WED" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.THU:
                        thu = 1;
                        setData["THU" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.FRI:
                        fri = 1;
                        setData["FRI" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      case DAYS.SAT:
                        sat = 1;
                        setData["SAT" + str1[SCHEDULE.HOUR]] = 0;
                        break;
                      default:
                        break;
                    }
                  }
                }
              }
              for (var tt = 0; tt < scope.EventRule.ScheduleIds.length; tt++) {
                var str2 = scope.EventRule.ScheduleIds[tt].split('.');
                for (var ee = 0; ee < mAttr.WeekDays.length; ee++) {
                  if (str2[SCHEDULE.DAY] === mAttr.WeekDays[ee]) {
                    switch (ee) {
                      case DAYS.SUN:
                        sun = 1;
                        setData["SUN" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SUN" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.MON:
                        mon = 1;
                        setData["MON" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["MON" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.TUE:
                        tue = 1;
                        setData["TUE" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["TUE" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.WED:
                        wed = 1;
                        setData["WED" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["WED" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.THU:
                        thu = 1;
                        setData["THU" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["THU" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.FRI:
                        fri = 1;
                        setData["FRI" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["FRI" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      case DAYS.SAT:
                        sat = 1;
                        setData["SAT" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SAT" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                        }
                        break;
                      default:
                        break;
                    }
                  }
                }
              }
              if (sun) {
                setData.SUN = 1;
              }
              if (mon) {
                setData.MON = 1;
              }
              if (tue) {
                setData.TUE = 1;
              }
              if (wed) {
                setData.WED = 1;
              }
              if (thu) {
                setData.THU = 1;
              }
              if (fri) {
                setData.FRI = 1;
              }
              if (sat) {
                setData.SAT = 1;
              }
            }

            SunapiClient.get(url, setData,
              function(response) {},
              function(errorData) {
                console.log(errorData);
              }, '', true);

            pageData.EventRule = angular.copy(scope.EventRule);
          }

          function setEventActionsByIndex(ii) {
            var setData = {};
            setData.EventType = 'AlarmInput.' + (ii + 1);
            // setData.RuleIndex = scope.EventRules[ii].RuleIndex;
            setData.EventAction = "";
            if (scope.EventRules[ii].FtpEnable) {
              setData.EventAction += 'FTP,';
            }
            if (scope.EventRules[ii].SmtpEnable) {
              setData.EventAction += 'SMTP,';
            }
            if (scope.EventRules[ii].RecordEnable) {
              setData.EventAction += 'Record,';
            }
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
              if (scope.EventRules[ii].AlarmOutputs[ao].Duration !== 'Off') {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRules[ii].AlarmOutputs[ao].Duration;
              }
            }
            if (scope.EventRules[ii].PresetNumber !== 'Off') {
              setData.EventAction += 'GoToPreset,';
              setData.PresetNumber = scope.EventRules[ii].PresetNumber;
            }
            if (setData.EventAction.length) {
              setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
            }
            if (setData.EventAction.length === 0) {
              setData.EventAction = 'None';
            }

            setData.ScheduleType = scope.EventRules[ii].ScheduleType;
            //if ($scope.EventRules[i].ScheduleType === 'Scheduled')
            {
              var diff = $(pageData.EventRules[ii].ScheduleIds).not(scope.EventRules[ii].ScheduleIds).get();
                    var sun = 0,
                        mon = 0,
                        tue = 0,
                        wed = 0,
                        thu = 0,
                        fri = 0,
                        sat = 0;
              for (var ss = 0; ss < diff.length; ss++) {
                var str1 = diff[ss].split('.');
                for (var dd = 0; dd < mAttr.WeekDays.length; dd++) {
                  if (str1[SCHEDULE.DAY] === mAttr.WeekDays[dd]) {
                    switch (dd) {
                      case DAYS.SUN:
                                        sun = 1;
                        setData["SUN" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.MON:
                                        mon = 1;
                        setData["MON" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.TUE:
                                        tue = 1;
                        setData["TUE" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.WED:
                                        wed = 1;
                        setData["WED" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.THU:
                                        thu = 1;
                        setData["THU" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.FRI:
                                        fri = 1;
                        setData["FRI" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.SAT:
                                        sat = 1;
                        setData["SAT" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
              for (var tt = 0; tt < scope.EventRules[ii].ScheduleIds.length; tt++) {
                var str2 = scope.EventRules[ii].ScheduleIds[tt].split('.');
                for (var ee = 0; ee < mAttr.WeekDays.length; ee++) {
                  if (str2[SCHEDULE.DAY] === mAttr.WeekDays[ee]) {
                    switch (ee) {
                      case DAYS.SUN:
                                        sun = 1;
                        setData["SUN" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SUN" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.MON:
                                        mon = 1;
                        setData["MON" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["MON" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.TUE:
                                        tue = 1;
                        setData["TUE" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["TUE" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.WED:
                                        wed = 1;
                        setData["WED" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["WED" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.THU:
                                        thu = 1;
                        setData["THU" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["THU" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.FRI:
                                        fri = 1;
                        setData["FRI" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["FRI" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.SAT:
                                        sat = 1;
                        setData["SAT" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SAT" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                    if (sun) {
                        setData.SUN = 1;
                    }
                    if (mon) {
                        setData.MON = 1;
                    }
                    if (tue) {
                        setData.TUE = 1;
                    }
                    if (wed) {
                        setData.WED = 1;
                    }
                    if (thu) {
                        setData.THU = 1;
                    }
                    if (fri) {
                        setData.FRI = 1;
                    }
                    if (sat) {
                        setData.SAT = 1;
                    }
                }

                SunapiClient.get('/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set', setData,
              function(response) {},
                    function(errorData) {
                        console.log(errorData);
                }, '', true);

                pageData.EventRules = angular.copy(scope.EventRules);
            }

          function setEventRulesByIndex(ii) {
                var setData = {};
            setData.RuleIndex = scope.EventRules[ii].RuleIndex;
                setData.EventAction = "";
            if (scope.EventRules[ii].FtpEnable) {
                    setData.EventAction += 'FTP,';
                }
            if (scope.EventRules[ii].SmtpEnable) {
                    setData.EventAction += 'SMTP,';
                }
            if (scope.EventRules[ii].RecordEnable) {
                    setData.EventAction += 'Record,';
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
              if (scope.EventRules[ii].AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRules[ii].AlarmOutputs[ao].Duration;
                    }
                }
            if (scope.EventRules[ii].PresetNumber !== 'Off') {
                    setData.EventAction += 'GoToPreset,';
              setData.PresetNumber = scope.EventRules[ii].PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
                }
            setData.ScheduleType = scope.EventRules[ii].ScheduleType;
                //if ($scope.EventRules[i].ScheduleType === 'Scheduled')
                {
              var diff = $(pageData.EventRules[ii].ScheduleIds).not(scope.EventRules[ii].ScheduleIds).get();
                    var sun = 0,
                        mon = 0,
                        tue = 0,
                        wed = 0,
                        thu = 0,
                        fri = 0,
                        sat = 0;
              for (var ss = 0; ss < diff.length; ss++) {
                var str1 = diff[ss].split('.');
                for (var dd = 0; dd < mAttr.WeekDays.length; dd++) {
                  if (str1[SCHEDULE.DAY] === mAttr.WeekDays[dd]) {
                    switch (dd) {
                      case DAYS.SUN:
                                        sun = 1;
                        setData["SUN" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.MON:
                                        mon = 1;
                        setData["MON" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.TUE:
                                        tue = 1;
                        setData["TUE" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.WED:
                                        wed = 1;
                        setData["WED" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.THU:
                                        thu = 1;
                        setData["THU" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.FRI:
                                        fri = 1;
                        setData["FRI" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                      case DAYS.SAT:
                                        sat = 1;
                        setData["SAT" + str1[SCHEDULE.HOUR]] = 0;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
              for (var tt = 0; tt < scope.EventRules[ii].ScheduleIds.length; tt++) {
                var str2 = scope.EventRules[ii].ScheduleIds[tt].split('.');
                for (var ee = 0; ee < mAttr.WeekDays.length; ee++) {
                  if (str2[SCHEDULE.DAY] === mAttr.WeekDays[ee]) {
                    switch (ee) {
                      case DAYS.SUN:
                                        sun = 1;
                        setData["SUN" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SUN" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.MON:
                                        mon = 1;
                        setData["MON" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["MON" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.TUE:
                                        tue = 1;
                        setData["TUE" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["TUE" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.WED:
                                        wed = 1;
                        setData["WED" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["WED" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.THU:
                                        thu = 1;
                        setData["THU" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["THU" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.FRI:
                                        fri = 1;
                        setData["FRI" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["FRI" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                      case DAYS.SAT:
                                        sat = 1;
                        setData["SAT" + str2[SCHEDULE.HOUR]] = 1;
                        if (str2.length === SCHEDULE.MAX_LENGTH) {
                          setData["SAT" + str2[SCHEDULE.HOUR] + ".FromTo"] = str2[SCHEDULE.FROM_MIN] + '-' + str2[SCHEDULE.TO_MIN];
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                    if (sun) {
                        setData.SUN = 1;
                    }
                    if (mon) {
                        setData.MON = 1;
                    }
                    if (tue) {
                        setData.TUE = 1;
                    }
                    if (wed) {
                        setData.WED = 1;
                    }
                    if (thu) {
                        setData.THU = 1;
                    }
                    if (fri) {
                        setData.FRI = 1;
                    }
                    if (sat) {
                        setData.SAT = 1;
                    }
                }

                SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData,
              function(response) {},
                    function(errorData) {
                        console.log(errorData);
                }, '', true);

                pageData.EventRules = angular.copy(scope.EventRules);
            }

            function prepareEventRules(eventRules) {
                scope.EventRule = {};
                scope.EventRule.FtpEnable = false;
                scope.EventRule.SmtpEnable = false;
                scope.EventRule.RecordEnable = false;
                scope.EventRule.Enable = eventRules[0].Enable;
                scope.EventRule.RuleIndex = eventRules[0].RuleIndex;
                scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));
                scope.EventRule.ScheduleType = eventRules[0].ScheduleType;
                if (typeof eventRules[0].EventAction !== 'undefined') {
                    if (eventRules[0].EventAction.indexOf('FTP') !== -1) {
                        scope.EventRule.FtpEnable = true;
                    }
                    if (eventRules[0].EventAction.indexOf('SMTP') !== -1) {
                        scope.EventRule.SmtpEnable = true;
                    }
                    if (eventRules[0].EventAction.indexOf('Record') !== -1) {
                        scope.EventRule.RecordEnable = true;
                    }
                }
                scope.EventRule.AlarmOutputs = [];
                if (typeof eventRules[0].AlarmOutputs === 'undefined') {
              for (var ii = 0; ii < mAttr.MaxAlarmOutput; ii++) {
                scope.EventRule.AlarmOutputs[ii] = {};
                scope.EventRule.AlarmOutputs[ii].Duration = 'Off';
                    }
                } else {
              for (var jj = 0; jj < mAttr.MaxAlarmOutput; jj++) {
                scope.EventRule.AlarmOutputs[jj] = {};
                        var duration = 'Off';
                for (var kk = 0; kk < eventRules[0].AlarmOutputs.length; kk++) {
                  if ((jj + 1) === eventRules[0].AlarmOutputs[kk].AlarmOutput) {
                    duration = eventRules[0].AlarmOutputs[kk].Duration;
                                break;
                            }
                        }
                scope.EventRule.AlarmOutputs[jj].Duration = duration;
                    }
                }
                if (typeof eventRules[0].PresetNumber === 'undefined') {
                    scope.EventRule.PresetNumber = 'Off';
                } else {
                    scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
                }

                scope.$apply(function() {
                    pageData.EventRule = angular.copy(scope.EventRule);
                });

            eventRuleService.setEventRuleData({
              pageData: scope.EventRule,
              scopeData: scope.EventRule,
              menu: scope.EventSource,
            });

                scope.$emit('EventRulePrepared', scope.EventRule.ScheduleType);
            };

            function prepareEventActions(eventActions) {
                var eventAction = eventActions[0].Actions;
                scope.EventRule = {};
                scope.EventRule.FtpEnable = false;
                scope.EventRule.SmtpEnable = false;
                scope.EventRule.RecordEnable = false;
                scope.EventRule.Enable = eventAction[0].Enable;
                scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventAction[0].Schedule));
                scope.EventRule.ScheduleType = eventAction[0].ScheduleType;
                scope.EventRule.EventType = eventActions[0].EventType;

                if (typeof eventAction[0].EventActions !== 'undefined') {
                    if (eventAction[0].EventActions.indexOf('FTP') !== -1) {
                        scope.EventRule.FtpEnable = true;
                    }
                    if (eventAction[0].EventActions.indexOf('SMTP') !== -1) {
                        scope.EventRule.SmtpEnable = true;
                    }
                    if (eventAction[0].EventActions.indexOf('Record') !== -1) {
                        scope.EventRule.RecordEnable = true;
                    }
                }
                scope.EventRule.AlarmOutputs = [];
                if (typeof eventAction[0].AlarmOutputs[0].Duration === 'undefined' || eventAction[0].AlarmOutputs[0].Duration === 'None') {
              for (var ii = 0; ii < mAttr.MaxAlarmOutput; ii++) {
                scope.EventRule.AlarmOutputs[ii] = {};
                scope.EventRule.AlarmOutputs[ii].Duration = 'Off';
                    }
                } else {
              for (var jj = 0; jj < mAttr.MaxAlarmOutput; jj++) {
                scope.EventRule.AlarmOutputs[jj] = {};
                        var duration = 'Off';
                for (var kk = 0; kk < eventAction[0].AlarmOutputs.length; kk++) {
                  if ((jj + 1) === eventAction[0].AlarmOutputs[kk].AlarmOutput) {
                    duration = eventAction[0].AlarmOutputs[kk].Duration;
                                break;
                            }
                        }
                scope.EventRule.AlarmOutputs[jj].Duration = duration;
                    }
                }
                if (typeof eventAction[0].PresetNumber === 'undefined') {
                    scope.EventRule.PresetNumber = 'Off';
                } else {
                    scope.EventRule.PresetNumber = eventAction[0].PresetNumber + '';
                }
                scope.$apply(function() {
                    pageData.EventRule = angular.copy(scope.EventRule);
                });

            eventRuleService.setEventRuleData({
              pageData: scope.EventRule,
              scopeData: scope.EventRule,
              menu: scope.EventSource,
            });

                eventRuleService.setInitialScheduleData({menu: scope.EventSource, type:scope.EventRule.ScheduleType, data:scope.EventRule.ScheduleIds});

                scope.$emit('EventRulePrepared', scope.EventRule.ScheduleType);
            };

            function prepareEventActionArray(eventActions) {
                scope.EventRules = [];
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
              // var eventType = 'AlarmInput.' + (ai + 1);
              for (var ii = 0; ii < eventActions.length; ii++) {
                        var mRule = {};
                        mRule.FtpEnable = false;
                        mRule.SmtpEnable = false;
                        mRule.RecordEnable = false;
                if (eventActions[ii].EventType === 'AlarmInput.#') {
                  var actions = eventActions[ii].Actions;
                  for (var kk = 0; kk < actions.length; kk++) {
                    mRule.Enable = actions[kk].Enable;
                    mRule.RuleIndex = actions[kk].AlarmInput;
                    mRule.ScheduleType = actions[kk].ScheduleType;
                    mRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(actions[kk].Schedule));
                    if (typeof actions[kk].EventActions !== 'undefined') {
                      if (actions[kk].EventActions.indexOf('FTP') !== -1) {
                                        mRule.FtpEnable = true;
                                    }
                      if (actions[kk].EventActions.indexOf('SMTP') !== -1) {
                                        mRule.SmtpEnable = true;
                                    }
                      if (actions[kk].EventActions.indexOf('Record') !== -1) {
                                        mRule.RecordEnable = true;
                                    }
                                }
                                mRule.AlarmOutputs = [];
                    if (typeof actions[kk].AlarmOutputs === 'undefined' || actions[kk].AlarmOutputs[0].Duration === 'None') {
                      for (var jj = 0; jj < mAttr.MaxAlarmOutput; jj++) {
                        mRule.AlarmOutputs[jj] = {};
                        mRule.AlarmOutputs[jj].Duration = 'Off';
                                    }
                                } else {
                      for (var mm = 0; mm < mAttr.MaxAlarmOutput; mm++) {
                        mRule.AlarmOutputs[mm] = {};
                                        var duration = 'Off';
                        for (var ll = 0; ll < actions[kk].AlarmOutputs.length; ll++) {
                          if (mm + 1 === actions[kk].AlarmOutputs[ll].AlarmOutput) {
                            duration = actions[kk].AlarmOutputs[ll].Duration;
                                                break;
                                            }
                                        }
                        mRule.AlarmOutputs[mm].Duration = duration;
                                    }
                                }
                    if (typeof actions[kk].PresetNumber === 'undefined') {
                                    mRule.PresetNumber = 'Off';
                                } else {
                      mRule.PresetNumber = actions[kk].PresetNumber + '';
                                }
                                scope.EventRules.push(mRule);
                            }
                        }
                    }
                }

                scope.$apply(function() {
                    pageData.EventRules = angular.copy(scope.EventRules);
                });

            eventRuleService.setEventRuleData({
              pageData: scope.EventRules,
              scopeData: scope.EventRules,
              menu: scope.EventSource,
            });

                scope.$emit('EventRulePrepared', scope.EventRules.ScheduleType);
            }

            function prepareEventRuleArray(eventRules) {
                scope.EventRules = [];
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
                    var mRule = {};
                    mRule.FtpEnable = false;
                    mRule.SmtpEnable = false;
                    mRule.RecordEnable = false;
                    var sourceName = 'AlarmInput.' + (ai + 1);
              for (var ii = 0; ii < eventRules.length; ii++) {
                if (eventRules[ii].EventSource === sourceName) {
                  mRule.Enable = eventRules[ii].Enable;
                  mRule.RuleIndex = eventRules[ii].RuleIndex;
                  mRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[ii].Schedule));
                  mRule.ScheduleType = eventRules[ii].ScheduleType;
                  if (typeof eventRules[ii].EventAction !== 'undefined') {
                    if (eventRules[ii].EventAction.indexOf('FTP') !== -1) {
                                    mRule.FtpEnable = true;
                                }
                    if (eventRules[ii].EventAction.indexOf('SMTP') !== -1) {
                                    mRule.SmtpEnable = true;
                                }
                    if (eventRules[ii].EventAction.indexOf('Record') !== -1) {
                                    mRule.RecordEnable = true;
                                }
                            }
                            mRule.AlarmOutputs = [];
                  if (typeof eventRules[ii].AlarmOutputs === 'undefined') {
                    for (var jj = 0; jj < mAttr.MaxAlarmOutput; jj++) {
                      mRule.AlarmOutputs[jj] = {};
                      mRule.AlarmOutputs[jj].Duration = 'Off';
                                }
                            } else {
                    for (var kk = 0; kk < mAttr.MaxAlarmOutput; kk++) {
                      mRule.AlarmOutputs[kk] = {};
                                    var duration = 'Off';
                      for (var ll = 0; ll < eventRules[ii].AlarmOutputs.length; ll++) {
                        if (kk + 1 === eventRules[ii].AlarmOutputs[ll].AlarmOutput) {
                          duration = eventRules[ii].AlarmOutputs[ll].Duration;
                                            break;
                                        }
                                    }
                      mRule.AlarmOutputs[kk].Duration = duration;
                                }
                            }
                  if (typeof eventRules[ii].PresetNumber === 'undefined') {
                                mRule.PresetNumber = 'Off';
                            } else {
                    mRule.PresetNumber = eventRules[ii].PresetNumber + '';
                            }
                            scope.EventRules.push(mRule);
                            break;
                        }
                    }
                }

                scope.$apply(function() {
                    pageData.EventRules = angular.copy(scope.EventRules);
                });

            eventRuleService.setEventRuleData({
              pageData: scope.EventRules,
              scopeData: scope.EventRules,
              menu: scope.EventSource,
            });

                scope.$emit('EventRulePrepared', scope.EventRules[0].ScheduleType);
            }

            scope.$watch('pageLoaded', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch pageloaded : ');console.info(scope.EventSource);
                currentPage = scope.EventSource;
                UniversialManagerService.setCurrentSetupPage(currentPage);
                if(newVal === true) {
                    if(isEventActionSupported && isMultiChannel) {
                        if(currentPage !== 'AlarmInput') {
                            getEventActions();
                        } else {
                            getEventActionArray();
                        }
                    } else {
                        if(currentPage !== 'AlarmInput') {
                            getEventRules();
                        } else {
                            getEventRuleArray();
                        }
                    }
                }
                locationChanging = false;
            }, true);

            // when update eventRule data by user mouse, set data for eventRuleService.
            scope.$watch('EventRule', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch EventRule : ');console.info(scope.EventSource);
                var data = {
                    pageData: pageData.EventRule,
                    scopeData: scope.EventRule,
                    menu: scope.EventSource,
                }
                eventRuleService.setEventRuleData(data);
            }, true);

            // when update eventRules data by user mouse, set data for eventRuleService.
            scope.$watch('EventRules', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch EventRules : ');console.info(scope.EventSource);
                var data = {
                    pageData: pageData.EventRules,
                    scopeData: scope.EventRules,
              menu: scope.EventSource,
                }
                eventRuleService.setEventRuleData(data);
            }, true);

            scope.$saveOn('pageLoaded', function(event, data) {//console.info('eventactionsetup saveon pageloaded : ');console.info(scope.EventSource);
                var tCurrentPage = UniversialManagerService.getCurrentSetupPage();
                if(tCurrentPage === scope.EventSource && !locationChanging) {
                    if(isEventActionSupported && isMultiChannel) {
                        if(currentPage !== 'AlarmInput') {
                            getEventActions();
                        } else {
                            getEventActionArray();
                        }
                    } else {
                        if(currentPage !== 'AlarmInput') {
                            getEventRules();
                        } else {
                            getEventRuleArray();
                        }
                    }
                }
            });

            scope.$saveOn('applied', function(event, data) {//console.info('eventactionsetup saveon applied : ');console.info(scope.EventSource);
                var tCurrentPage = UniversialManagerService.getCurrentSetupPage();
                if(tCurrentPage === scope.EventSource) {
                    var channel = null;
                    if(data !== true) { // target channel to set passed as parameter.
                        channel = data;
                    }
                    if(currentPage !== 'AlarmInput') {
                        if (!angular.equals(pageData.EventRule, scope.EventRule)) {
                            if(isEventActionSupported && isMultiChannel) {
                                setEventActions(channel);
                            } else {
                                setEventRules();
                            }
                        }
                    } else {
                        if (!angular.equals(pageData.EventRules, scope.EventRules)) {
                            if(isEventActionSupported && isMultiChannel) {
                                scope.EventRules.forEach(function(elem, index){
                                    if (!angular.equals(pageData.EventRules[index], scope.EventRules[index])) {
                                        setEventActionsByIndex(index);
                                    }
                                });
                            } else {
                                scope.EventRules.forEach(function(elem, index){
                                    if (!angular.equals(pageData.EventRules[index], scope.EventRules[index])) {
                                        setEventRulesByIndex(index);
                                    }
                                });
                            }
                        }
                    }
                }
            });
            
            scope.getTitleAutoSimpleFcous = function(){
                if(mAttr.PTZModel || mAttr.ZoomOnlyModel){
                    return 'lang_autoFocus';
                } else {
                    return 'lang_simpleFocus';
                }
          };

            $rootScope.$saveOn("$locationChangeStart", function(event, next, current) {
              locationChanging = true;
            });

            // canceling
            $rootScope.$on('resetScheduleData', function() {
              if(currentPage === 'Storage') {
                return;
              }
              if (isEventActionSupported && isMultiChannel) {
                if (currentPage !== 'AlarmInput') {
                  getEventActions();
                } else {
                  getEventActionArray();
                }
              } else {
                if (currentPage !== 'AlarmInput') {
                  getEventRules();
                } else {
                  getEventRuleArray();
                }
              }
          });
        }
    };
}]);
