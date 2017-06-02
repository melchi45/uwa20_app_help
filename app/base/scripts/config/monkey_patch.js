"use strict";
kindFramework.
  config(['$provide', function($provide){
    $provide.decorator('$rootScope', ['$delegate', function($delegate){

      $delegate.$saveOn = function(name, listener, scope){
        var unsubscribe = $delegate.$on(name, listener);

        if (scope){
          scope.$on('$destroy', unsubscribe);
        }
      };
      return $delegate;
    }]);
  }]);