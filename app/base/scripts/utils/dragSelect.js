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

      //tmp-selected = ���� �������� ����
      //already-selected = ���õ��ִ� ����
      //setHour = ���õ��ִ� ����
      //ui-selected = ui �⺻ ���� �� �߰��Ǵ� Ŭ����. �Ⱦ�����
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
              //Ŭ��
              openTimeSetup();
            } else {
              //�巡�� ��
              var alreadySelectedLen = $element.find('.tmp-selected.already-selected').length;
              var tmpSelectedLen = selectedItems.length;

              // ��������
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
                //����
              } else if (alreadySelectedLen < tmpSelectedLen) {
                selectedItems.each(function(i, self) {
                  var index = inArray($scope.dragSelectIds, $(self).attr('id'));
                  if (index === false) {
                    //�ߺ�����
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