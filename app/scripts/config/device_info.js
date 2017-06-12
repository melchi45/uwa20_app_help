/**
 * When user reload the Web Page,
 * All text is English and the text is changed setted language.
 * So $urlRouter.sync() is used for Synchronized Multi Language.
 */
"use strict";
kindFramework.
config(function($urlRouterProvider) {
  try {
    $urlRouterProvider.deferIntercept();
  } catch (e) {
    console.error(e);
  }
}).
run(function(
  $rootScope,
  $urlRouter,
  SunapiClient,
  MultiLanguage,
  RESTCLIENT_CONFIG,
  SessionOfUserManager
) {
  try {
    $rootScope.$on("$locationChangeSuccess", function(event) {
      event.preventDefault();
      var successCallback = null;
      var failCallback = null;
      var protocolUrl = '/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view';

      //When Developer is testing by grunt
      if (
        RESTCLIENT_CONFIG.serverType === 'grunt' &&
        SessionOfUserManager.isLoggedin() === false
      ) {
        $urlRouter.sync();
      } else {
        successCallback = function(Response) {
          MultiLanguage.setLanguage(Response.data.Language);
          $urlRouter.sync();
        };

        failCallback = function(errorData) {
          console.error(errorData);
          $urlRouter.sync();
        };

        try {
          SunapiClient.get(protocolUrl, '', successCallback, failCallback, '', true);
        } catch (e) {
          failCallback(e);
        }
      }
    });

    $urlRouter.listen();
  } catch (e) {
    console.error(e);
  }
});