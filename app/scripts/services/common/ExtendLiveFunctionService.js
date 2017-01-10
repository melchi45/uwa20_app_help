'use strict';
/**/
kindFramework
.service('ExtendLiveFunctionsService', 
  function(){
    this.getPTZMode = function() {
      return false;
    };
    this.setPTZMode = function(value) {};
    this.setNearFar = function(event, type) {};
    this.supportPTZ = function(index) {
      return false;
    };
});