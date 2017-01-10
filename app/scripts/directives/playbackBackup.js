kindFramework.directive('playbackBackup', ['SearchDataModel', '$rootScope','ModalManagerService',
  'PlayDataModel','PLAYBACK_TYPE',
  function(SearchDataModel, $rootScope, ModalManagerService, PlayDataModel, PLAYBACK_TYPE) {
    'use strict';
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/livePlayback/directives/playback-backup.html',
        scope: {
            getBackupDate: '=',
            control: '=',
            visibility : '='
        },
        link: function(scope, element, attr) {
          var playData = new PlayDataModel();
          var PLAY_CMD = PLAYBACK_TYPE.playCommand;
          var searchData = new SearchDataModel();
            var pad = function(x){
              x *= 1;
              return x < 10 ? "0" + x : x;
            };

            var init = function() {
              playData.setStatus(PLAY_CMD.STOP);
            };
            var newDate = new Date();
            var defaultTime = '00';
            var currentDateStr = [
                newDate.getFullYear(),
                pad(newDate.getMonth() + 1),
                pad(newDate.getDate())
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

            scope.getBackupDate = function(){
              //check time range is below 5 min.
              var start = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), scope.startTime.hours,
                scope.startTime.minutes, scope.startTime.seconds);
              var end = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), scope.endTime.hours,
                scope.endTime.minutes, scope.endTime.seconds);
              var diff = end.getTime() - start.getTime();

              if( diff > 0 && diff <= 5*60*1000 ){
                var startTime = pad(scope.startTime.hours)+""+pad(scope.startTime.minutes)+""+pad(scope.startTime.seconds);
                var endTime = pad(scope.endTime.hours)+""+pad(scope.endTime.minutes)+""+pad(scope.endTime.seconds);
                return {
                    startTime: startTime,
                    endTime: endTime,
                    currentDate: scope.currentDate
                };                
              }
              else {
                if( diff === 0 ) {
                    ModalManagerService.open(
                      'message',
                      {'message':"lang_msg_From_To_Diff", 'buttonCount':1}
                    );
                }
                else if( diff < 0 ) {
                    ModalManagerService.open(
                      'message',
                      {'message':"lang_msg_From_To_Late", 'buttonCount':1}
                    );
                }
                else if( diff >5*60*1000) {
                    ModalManagerService.open(
                      'message',
                      {'message':"lang_msg_no_more_than_5min", 'buttonCount':1}
                    );
                    end.setTime(start.getTime() + 5*60*1000 );
                    scope.endTime = {
                      hours : pad(end.getHours()),
                      minutes : pad(end.getMinutes()),
                      seconds : pad(end.getSeconds())
                    };
                }
                return null;
              }
            };

            var watchDate = scope.$watch(function(){return searchData.getSelectedDate();},
              function(newVal, oldVal){
                var currentDate = newVal;
                scope.currentDate = newVal.getFullYear() + "-" + pad(newVal.getMonth()+1) + "-" + pad(newVal.getDate());
            });

            var watchVisible = scope.$watch(function(){ return scope.visibility;} , 
              function(newVal, oldVal){
              if( newVal === oldVal ) return;
              if( newVal === true ) {
                init();
              }
            });
            $rootScope.$saveOn("scripts/services/playbackClass/timelineService::backupTimeRange",
              function(event, item){
                scope.startTime.hours = pad(item.start.getHours());
                scope.startTime.minutes = pad(item.start.getMinutes());
                scope.startTime.seconds = pad(item.start.getSeconds());

                var endTarget = item.end;

                if( item.end.getTime() - item.start.getTime() > 5*60*1000 ) {
                  endTarget = new Date(item.start.getTime() + 5*60*1000);
                }
                scope.endTime.hours = pad(endTarget.getHours());
                scope.endTime.minutes = pad(endTarget.getMinutes());
                scope.endTime.seconds = pad(endTarget.getSeconds());         
            }, scope);

            scope.$on('$destroy', function() {
              //KILL Watch Process
              watchDate();
              watchVisible();
            });
        }
    };
}]);