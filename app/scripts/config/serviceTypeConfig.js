"use strict";

kindFramework.
config(function($urlRouterProvider, $provide, UniversialManagerServiceProvider, CAMERA_STATUS) {

  $provide.decorator('UniversialManagerService', function($delegate) {
    return $delegate;
  });

  var UniversialManagerService = UniversialManagerServiceProvider.$get();
  UniversialManagerService.setServiceType(CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB);
});