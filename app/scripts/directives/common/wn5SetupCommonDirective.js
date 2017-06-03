/* global location sessionStorage setTimeout */
kindFramework.directive('wn5SetupMainTitle', function() {
  "use strict";
  return {
    restrict: 'E',
    scope: {
      title: '@'
    },
    replace: true,
    templateUrl: 'views/setup/common/wn5SetupMainTitle.html',
    link: function() {}
  };
});

kindFramework.directive('wn5SetupCommonButton', function() {
  "use strict";
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: 'views/setup/common/wn5SetupCommonButton.html',
    link: function(scope, element, attrs) {
      var cancelClick = attrs.cancelClick;
      var submitClick = attrs.submitClick;
      var removeFocus = function() {
        element.find("button").blur();
      };

      scope.wn5SetupCommonButton = {
        submit: function() {
          removeFocus();
          scope.$parent.$eval(submitClick);
        },
        cancel: function() {
          removeFocus();
          scope.$parent.$eval(cancelClick);
        }
      };
    }
  };
});