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
        link: function(scope, element, attrs){
        }
    };
});

kindFramework.directive('wn5SetupCommonButton', function() {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/setup/common/wn5SetupCommonButton.html',
        link: function(scope, element, attrs){
            var cancelClick = attrs.cancelClick;
            var submitClick = attrs.submitClick;
            
            scope.wn5SetupCommonButton = {
                submit: function(){
                    scope.$parent.$eval(submitClick);
                },
                cancel: function(){
                    scope.$parent.$eval(cancelClick);
                }
            };   
        }
    };
});