kindFramework.directive('playbackBackup', ['SearchDataModel', '$rootScope', 'ModalManagerService',
  'PlayDataModel', 'PLAYBACK_TYPE',
  function(SearchDataModel, $rootScope, ModalManagerService, PlayDataModel, PLAYBACK_TYPE) {
    'use strict';
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/livePlayback/directives/playback-backup.html',
      scope: {
        getBackupDate: '=',
        control: '=',
        visibility: '=',
      },
      link: function(scope, element, attr) {
        var playData = new PlayDataModel();
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        var searchData = new SearchDataModel();
        scope.blockTimeInput = false;
        var MAX_FILEBACKUP_DURATION = 300000; // 5Min to ms
        var MIN_DOUBLE_FIGURES = 10;
        var pad = function(input) {
          var target = input*1;
          return target < MIN_DOUBLE_FIGURES ? "0" + target : target;
        };

        var init = function() {
          playData.setStatus(PLAY_CMD.STOP);
          var currentDateObj = searchData.getSelectedDate();
          scope.currentDate = 
            currentDateObj.getFullYear() + "-" + pad(currentDateObj.getMonth() + 1) + "-" + 
            pad(currentDateObj.getDate());
        };
        var newDate = new Date();
        var defaultTime = '00';
        var currentDateStr = [
          newDate.getFullYear(),
          pad(newDate.getMonth() + 1),
          pad(newDate.getDate()),
        ].join('-');

        scope.startTime = {
          hours: defaultTime,
          minutes: defaultTime,
          seconds: defaultTime,
        };
        scope.endTime = {
          hours: defaultTime,
          minutes: defaultTime,
          seconds: defaultTime,
        };
        scope.currentDate = currentDateStr;

        scope.getBackupDate = function() {
          //check time range is below 5 min.
          var start = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 
            scope.startTime.hours, scope.startTime.minutes, scope.startTime.seconds);
          var end = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 
            scope.endTime.hours, scope.endTime.minutes, scope.endTime.seconds);
          var diff = end.getTime() - start.getTime();

          if (diff > 0 && diff <= MAX_FILEBACKUP_DURATION) {
            var startTime = pad(scope.startTime.hours) + "" + pad(scope.startTime.minutes) + "" + 
                            pad(scope.startTime.seconds);
            var endTime = pad(scope.endTime.hours) + "" + pad(scope.endTime.minutes) + "" + 
                          pad(scope.endTime.seconds);
            return {
              startTime: startTime,
              endTime: endTime,
              currentDate: scope.currentDate,
            };
          } else {
            if (diff === 0) {
              ModalManagerService.open(
                'message', {
                  'message': "lang_msg_From_To_Diff",
                  'buttonCount': 1,
                }
              );
            } else if (diff < 0) {
              ModalManagerService.open(
                'message', {
                  'message': "lang_msg_From_To_Late",
                  'buttonCount': 1,
                }
              );
            } else if (diff > MAX_FILEBACKUP_DURATION) {
              ModalManagerService.open(
                'message', {
                  'message': "lang_msg_no_more_than_5min",
                  'buttonCount': 1,
                }
              );
              end.setTime(start.getTime() + MAX_FILEBACKUP_DURATION);
              scope.endTime = {
                hours: pad(end.getHours()),
                minutes: pad(end.getMinutes()),
                seconds: pad(end.getSeconds()),
              };
            }
            return null;
          }
        };

        var watchVisible = scope.$watch(function() {
          return scope.visibility;
        }, function(newVal, oldVal) {
          if (newVal === oldVal) {
            return;
          }
          if (newVal === true) {
            init();
          }
        });
        $rootScope.$saveOn("scripts/services/playbackClass/timelineService::backupTimeRange",
          function(event, item) {
            scope.startTime.hours = pad(item.start.hour());
            scope.startTime.minutes = pad(item.start.minute());
            scope.startTime.seconds = pad(item.start.second());

            var endTarget = item.end;

            if (item.end.valueOf() - item.start.valueOf() > MAX_FILEBACKUP_DURATION) {
              endTarget = moment(item.start.valueOf() + MAX_FILEBACKUP_DURATION);
            }
            scope.endTime.hours = pad(endTarget.hour());
            scope.endTime.minutes = pad(endTarget.minute());
            scope.endTime.seconds = pad(endTarget.second());
          }, scope);
        $rootScope.$saveOn('blockTimebarInputField', function(event, data) {
          scope.blockTimeInput = data;
        }, scope);

        scope.$on('$destroy', function() {
          //KILL Watch Process
          watchVisible();
        });
      },
    };
  },
]);