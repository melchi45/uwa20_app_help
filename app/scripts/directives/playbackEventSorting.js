kindFramework.directive('playbackEventSorting', function() {
  'use strict';
  var data = {};
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'views/livePlayback/directives/playback-event-sorting.html',
    controller: function($scope, $rootScope, CAMERA_TYPE, PlaybackInterface, SearchDataModel, UniversialManagerService) {
      var MIN_DOUBLE_FIGURES = 10;
      var pad = function(input) {
        var target = input*1;
        return target < MIN_DOUBLE_FIGURES ? "0" + target : target;
      };
      var optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
      $scope.connectedService = optionServiceType[UniversialManagerService.getServiceType()];
      $scope.eventList = null;
      var playbackInterfaceService = PlaybackInterface;
      /*
       * data.recordedDate is selected day (in ModalInstnceSearchCtrl.js )
       * default value is today.
       */
      $scope.recordedDate = null;
      var MAX_OVERLAP_ID = 1;
      var searchData = new SearchDataModel();
      /*
       * Set flag all event with every items are checked or not. 
       * Only for checkbox B2B Web
       * @name : flagAllEventOrNot
       */
      $scope.flagAllEventOrNot = function() {
        var cntCheckedItem = 0;
        angular.forEach($scope.eventList, function(item) {
          if (item.selected === true) {
            cntCheckedItem++;
          }
        });
        if (cntCheckedItem === $scope.eventList.length) {
          $scope.allEventSearch.selected = true;
        } else {
          $scope.allEventSearch.selected = false;
        }
      };

      $scope.setInitialize = function() {
        $scope.allEventSearch = {
          name: "lang_resetAll",
          event: "All",
          selected: false,
          enable: true,
        };
        $scope.overlapList = [{
          name: "lang_overlapped_section",
          enable: false,
          id: 0,
        }, {
          name: "lang_overlapped_section",
          enable: false,
          id: 1,
        }];
        $scope.selected = {
          event: null,
          overlap: $scope.overlapList[0],
        };
      };

      $scope.showOverlap = true;

      $scope.getOverlappedId = function() {
        var channelId = UniversialManagerService.getChannelId();
        var query = {
          year: $scope.recordedDate.getFullYear(),
          month: pad($scope.recordedDate.getMonth() + 1),
          day: pad($scope.recordedDate.getDate()),
          channel: channelId,
        };
        playbackInterfaceService.getOverlappedId(query).then(function(value) {
          var idList = value.OverlappedIDList;
          console.log('OverlappedIDList ::', idList);
          for (var index = 0; index < idList.length; index++) {
            var id = idList[index];
            if (id <= MAX_OVERLAP_ID) {
              $scope.overlapList[id].enable = true;
              $scope.overlapList[id].id = id;
            }
          }
          if (typeof(data.overlapList) !== 'undefined' && data.overlapList !== null) {
            $scope.selected.overlap = $scope.overlapList[data.overlapList];
          }
        }, function() {});
      };
      /*
       * Make select all item with 'All event' check action.
       * Only for checkbox B2B Web
       * It works as toggle(check or uncheck all)
       * @name : selectAllEvent
       */
      $scope.selectAllEvent = function($event) {
        var checkbox = $event.target;
        angular.forEach($scope.eventList, function(item) {
          item.selected = checkbox.checked;
        });
      };
      /*
       * Make Checked and show checked icon.
       * If each it is checked all item, All event is checked.
       * Only for checkbox B2B Web
       * @name : selectEachEvent
       */
      $scope.selectEachEvent = function($event) {
        var checkbox = $event.target;
        var cntCheckedItem = 0;
        if (checkbox.checked === false) {
          $scope.allEventSearch.selected = false;
          document.getElementById('allEvent').checked = false;
        }
        angular.forEach($scope.eventList, function(item) {
          if (item.selected === true) {
            cntCheckedItem++;
          }
        });
        if (cntCheckedItem === $scope.eventList.length) {
          document.getElementById('allEvent').checked = true;
        }
      };
      /*
       * after receiving getEventStatus() results, update selected item based on updated eventList.
       */
      $scope.updateEventSelected = function() {
        if (data.selectedEvent === null) {
          setDefaultEventItem();
        } else {
          if (data.selectedEvent[0] === 'All') {
            angular.forEach($scope.eventList, function(item) {
              item.selected = true;
            });
            $scope.allEventSearch.selected = true;
          } else {
            selectPreviousValue();
          }
        }
        //To set default value.
        if (typeof($scope.allEventSearch) === 'undefined') {
          searchData.setEventTypeList($scope.selected.event === null ? null : [$scope.selected.event.event]);
        } else {
          if (searchData.getEventTypeList() === null) {
            searchData.setEventTypeList(['All']);
          }
        }
      };
      /*
       * If no previous selected item, then set default value.
       * @name : setDefaultEventItem.
       */
      var setDefaultEventItem = function() {
        if (typeof($scope.allEventSearch) !== 'undefined') {
          //$scope.allEventSearch.selected = true;
          $scope.flagAllEventOrNot();
        } else {
          var index = 0;
          for (index = 0; index < $scope.eventList.length; index++) {
            if ($scope.eventList[index].enable === true) { //if disabled, then change default value
              $scope.selected.event = $scope.eventList[index];
              break;
            }
          }
          if (index === $scope.eventList.length) {
            $scope.selected.event = $scope.eventList[0];
          }
        }
      };
      /**
       * make to 'selected = true' matching with prevList items.
       * @name : selectPreviousValue
       * @param : prevList is element of data.selectedEvent
       */
      var selectPreviousValue = function() {
        for (var i = 0; i < data.selectedEvent.length; i++) {
          var prevList = data.selectedEvent[i];
          for (var j = 0; j < $scope.eventList.length; j++) {
            if ($scope.eventList[j].event !== prevList) {
              continue;
            }
            $scope.selected.event = null;
            if ($scope.eventList[j].enable === true) {
              // checkbox case( multiple selection)
              if (typeof($scope.eventList[j].selected) !== 'undefined') { 
                $scope.eventList[j].selected = true;
                $scope.selected.event = $scope.eventList[j];
              } else { // radio button case ( 1 selection )
                $scope.selected.event = $scope.eventList[j];
                break;
              }
            }
          }
        }
        if ($scope.selected.event === null) {
          setDefaultEventItem();
        }
      };

      $scope.ok = function() {
        var selectedEventList = [];
        /*
         * if allEventSearch is undefined, then b2b or b2c case. 
         * App just select 1 event type, so just push selected item.
         */
        if (typeof($scope.allEventSearch) === 'undefined') {
          selectedEventList.push($scope.selected.event.event);
        } else {
          /*
           * If All is selected, then just push "All" to selectedEventList
           * no need to push other event list 
           * If 'All' event type is selected, then set to 'timeSearch' (playing continuous)
           * else, set to 'eventSearch' (just playing selected item)
           */
          if ($scope.allEventSearch.selected === true) {
            selectedEventList.push($scope.allEventSearch.event);
            searchData.setPlaybackType('timeSearch');
          } else {
            searchData.setPlaybackType('eventSearch');
            for (var idx = 0; idx < $scope.eventList.length; idx++) {
              if ($scope.eventList[idx].selected) {
                selectedEventList.push($scope.eventList[idx].event);
              }
            }
          }
        }
        if (selectedEventList.length > 0) {
          /*
           *save overlap Id & selectedEventList
           */
          if ($scope.selected.overlap.enable) {
            searchData.setOverlapId($scope.selected.overlap.id);
          } else {
            searchData.setOverlapId(null);
          }
          searchData.setEventTypeList(selectedEventList);
          console.log('selected overlap id:: ', $scope.selected.overlap.enable ?
            $scope.selected.overlap.id : null);
          data = {
            'selectedOverlap': $scope.selected.overlap.enable ? 
              $scope.selected.overlap.id : null,
            'selectedEvent': selectedEventList,
          };
        } else {
          // $uibModalInstance.dismiss('no event selected');
        }

        return data;
      };
    },
    scope: {
      getOverlapEvent: '=',
      setOverlapEvent: '=',
    },
    link: function(scope) {
      scope.getOverlapEvent = scope.ok;
      scope.setOverlapEvent = function(eventData) {
        data = eventData;
        scope.eventList = data.eventList;
        scope.setInitialize();
        scope.recordedDate = (data.recordedDate === null || 
          typeof data.recordedDate === "undefined") ? 
          new Date() : data.recordedDate;
        scope.flagAllEventOrNot();
        scope.updateEventSelected();
        scope.getOverlappedId();
      };
    },
  };
});