kindFramework.directive('dragSelect', function($window, $document) {
  'use strict';
  return {
    scope: {
      dragSelectIds: '=',
      openTimeSetup: '='
    },
    controller: function($scope, $element) {
      function inArray(arr, str) {
        for (var i = 0; i < arr.length; i++) {
          var tArray = arr[i].split(".");
          tArray = tArray[0] + "." + tArray[1];
          if (tArray == str) {
            return i;
          }
        }
        return false;
      }

      //tmp-selected = 현재 선택중인 셀들
      //already-selected = 선택돼있는 셀들
      //setHour = 선택돼있는 셀들
      //ui-selected = ui 기본 선택 시 추가되는 클래스. 안쓸거임
      var date = null;
      $element.find("tbody").
        selectable({
          filter: 'td',
          selecting: function(event, ui) {
            $(ui.selecting).addClass('tmp-selected');
          },
          unselecting: function(event, ui) {
            $(ui.unselecting).removeClass('tmp-selected');
          },
          selected: function(event, ui) {
            $(ui.selected).removeClass('ui-selected');
          },
          stop: function() {
            var selectedItems = $element.find('.tmp-selected');
            if (selectedItems.length === 1) {
              //클릭
              openTimeSetup();
            } else {
              //드래그 끝
              var alreadySelectedLen = $element.find('.tmp-selected.already-selected').length;
              var tmpSelectedLen = selectedItems.length;

              // 선택해제
              if (alreadySelectedLen === tmpSelectedLen) {
                selectedItems.each(function(i, self) {
                  var index = inArray($scope.dragSelectIds, $(self).attr('id'));
                  $scope.dragSelectIds.splice(index, 1);
                });

                selectedItems.
                  removeClass('tmp-selected').
                  removeClass('already-selected').
                  removeClass('setHour').
                  removeClass('setMinite');
                //선택
              } else if (alreadySelectedLen < tmpSelectedLen) {
                selectedItems.each(function(i, self) {
                  var index = inArray($scope.dragSelectIds, $(self).attr('id'));
                  if (index === false) {
                    //중복방지
                    $scope.dragSelectIds.push($(self).attr('id'));
                    $(self).addClass('setHour');
                  }
                });

                selectedItems.
                  removeClass('tmp-selected').
                  removeClass('ui-selected').
                  addClass('already-selected');
              }
            }
          }
        });

      function openTimeSetup() {
        date = new String($(".tmp-selected").attr("id"));
        date = date.substring(0, date.length);
        date = date.split('.');
        $scope.openTimeSetup(date[0], date[1]);

        $('.tmp-selected').removeClass('tmp-selected');
      }

    }
  };
});