/*global setTimeout */
"use strict";
kindFramework.directive('sideNavigation', function($timeout) {
  return {
    link: function(scope, element) {
      $timeout(function() {
        $(element).metisMenu();
      });

      scope.$watch('menuData', function() {
        $timeout(function() {
          $(element).metisMenu();
        });
      });

      scope.$on('$stateChangeSuccess', function() {
        try {
          $(element).metisMenu();
        } catch (e) {
          console.info(e);
        }
      });
    }
  };
});

kindFramework.directive('input', function() {
  return {
    restrict: 'E',
    scope: false,
    link: function(scope, elem, attrs) {

      // Only care about textboxes, not radio, checkbox, etc.
      var validTypes = /^(search|email|url|tel|number|text)$/i;
      if (!validTypes.test(attrs.type)) {
        return;
      }

      // Bind to the mouseup event of the input textbox.  
      elem.bind('mouseup', function() {

        // Get the old value (before click) and return if it's already empty
        // as there's nothing to do.
        var $input = $(this),
          oldValue = $input.val();
        if (oldValue === '') {
          return;
        }

        // Check new value after click, and if it's now empty it means the
        // clear button was clicked. Manually trigger element's change() event.
        setTimeout(function() {
          var newValue = $input.val();
          if (newValue === '') {
            angular.element($input).change();
          }
        }, 1);
      });
    }
  };
});

kindFramework.directive('addSpinButton', function() {

  var template = '\
		<div class="spin-button-div">\
			<button class="btn btn-white"><i class="tui tui-top"></i></button>\
			<button class="btn btn-white"><i class="tui tui-down"></i></button>\
		</div>';

  function postLink(scope, elm, attrs) {
    var divElm = elm.next();
    var upBtn = divElm.children().eq(0);
    var downBtn = divElm.children().eq(1);
    var min = 0;
    var max = 0;
    var intervalKey = null;
    var changeFunc = attrs.ngChange;

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
      changeFunc = changeFunc.replace(/[\(\)\;]/g, '');
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
        changeFunc();
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
        changeFunc();
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
      // ngChange: '=',
      addSpinButtonDisabled: '='
    },
    compile: compile
  };
});

kindFramework.directive('onSizeChanged', ['$window', function($window) {
  return {
    restrict: 'A',
    scope: {
      onSizeChanged: '&'
    },
    link: function(scope, $element) {
      var element = $element[0];

      function cacheElementSize(scope, element) {
        scope.cachedElementWidth = element.offsetWidth;
        scope.cachedElementHeight = element.offsetHeight;
      }

      function onWindowResize() {
        var isSizeChanged = scope.cachedElementWidth !== element.offsetWidth || scope.cachedElementHeight !== element.offsetHeight;
        if (isSizeChanged) {
          var expression = scope.onSizeChanged();
          expression();
        }
      }

      cacheElementSize(scope, element);
      $window.addEventListener('resize', onWindowResize);

    }
  };
}]);

kindFramework.directive('sliderNoFocus', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    transclude: true,
    link: function(scope, $element) {
      $timeout(function() {
        $element.find('span').attr('tabindex', '');
      }, 1000);
    }
  };
}]);