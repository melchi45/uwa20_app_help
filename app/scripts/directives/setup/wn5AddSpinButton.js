kindFramework.directive('wn5AddSpinButton', function() {

  var template = '\
		<div class="wn5-setup-spin-button">\
			<button class="btn"><i class="tui tui-top"></i></button>\
			<button class="btn"><i class="tui tui-down"></i></button>\
		</div>';

  function postLink(scope, elm, attrs) {
    var divElm = elm.next();
    var upBtn = divElm.children().eq(0);
    var downBtn = divElm.children().eq(1);
    var min = 0;
    var max = 0;
    var intervalKey = null;
    var changeFunc = attrs.ngChange;
    var flag = attrs.addSpinButtonFlag;

    elm.addClass('add-spin-button');

    scope.$watch('addSpinButtonDisabled', function(val) {
      if (val) {
        upBtn.attr('disabled', 'disabled');
        downBtn.attr('disabled', 'disabled');
      } else {
        upBtn.removeAttr('disabled');
        downBtn.removeAttr('disabled');
      }
    });

    scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if (phase === '$apply' || phase === '$digest') {
        if (fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    if (changeFunc && typeof changeFunc === 'string') {
      changeFunc = changeFunc.replace(/(\()([\w]){1,}(\))|(\;)]/g, '');
      if (scope.$parent && scope.$parent[changeFunc] && typeof scope.$parent[changeFunc] === 'function') {
        changeFunc = scope.$parent[changeFunc];
      } else {
        changeFunc = null;
      }
    } else {
      changeFunc = null;
    }

    function increse() {
      max = elm.attr('max');
      if (typeof max !== "undefined" && max <= scope.ngModel) {
        return;
      }
      scope.safeApply(function() {
        scope.ngModel++;
      });

      if (changeFunc) {
        changeFunc(flag);
      }
    }

    function decrease() {
      min = elm.attr('min');
      if (typeof min !== "undefined" && min >= scope.ngModel) {
        return;
      }
      scope.safeApply(function() {
        scope.ngModel--;
      });

      if (changeFunc) {
        changeFunc(flag);
      }
    }

    function startUpdate(updateFunc, isFirst) {
      var delay = 50;
      if (isFirst) {
        delay = 300;

        if (intervalKey) {
          clearTimeout(intervalKey);
          intervalKey = null;
        }
      }
      updateFunc();

      intervalKey = setTimeout(function() {
        startUpdate(updateFunc, false);
      }, delay);
    }

    function stopUpdate() {
      if (intervalKey) {
        clearTimeout(intervalKey);
        intervalKey = null;
      }
    }

    upBtn.on('mousedown', function() {
      startUpdate(increse, true);
    });
    upBtn.on('mouseup', stopUpdate);
    upBtn.on('mouseout', stopUpdate);

    downBtn.on('mousedown', function() {
      startUpdate(decrease, true);
    });
    downBtn.on('mouseup', stopUpdate);
    downBtn.on('mouseout', stopUpdate);
  }

  function compile(elm) {
    elm.addClass('add-spin-button');
    elm.after(template);

    return postLink;
  }

  return {
    resrict: 'A',
    require: ['^ngModel'],
    transclude: true,
    scope: {
      ngModel: '=',
      addSpinButtonFlag: '=',
      addSpinButtonDisabled: '='
    },
    compile: compile
  };
});