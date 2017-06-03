/*global kindFramework */

kindFramework.controller('translateCtrl', function($scope, $rootScope, $timeout, MultiLanguage, SunapiClient, Attributes, SessionOfUserManager, EventStatusService) {
  'use strict';

  var mAttr = Attributes.get("system");

  function getSupportedLanguages() {
    if (typeof mAttr.Languages === 'undefined') {
      $scope.languages = ["English", "Korean", "Chinese", "French", "Italian", "Spanish", "German", "Japanese", "Russian", "Swedish", "Danish", "Portuguese", "Czech", "Polish", "Turkish", "Romania", "Serbian", "Dutch", "Croatian", "Hungarian", "Greek", "Norsk", "Finnish"];
      console.log('Static Languages loaded');
    } else {
      $scope.languages = mAttr.Languages;
      console.log('Languages loaded from camera');
      //$scope.showLanguage = true;
      /** Language menu is moved to system product info, since some features like OSD depend on laguage settings */
      $scope.showLanguage = false;
      if ($scope.languages.length === 1) {
        $scope.showLanguage = false;
      }
    }
  }

  function getCurrentLanguage() {
    $scope.currentLanguage = 'English';
    if (SessionOfUserManager.IsLoggedin() === true) {
      SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', '',
        function(Response) {
          $scope.currentLanguage = Response.data.Language;
          MultiLanguage.setLanguage($scope.currentLanguage);
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    }
  }

  $scope.changeLanguage = function(name) {
    var jData = {};
    $scope.currentLanguage = name;
    /** Change the UI Language */
    MultiLanguage.setLanguage($scope.currentLanguage);
    /** Save the Language settings in the server */
    jData.Language = name;
    if (SessionOfUserManager.IsLoggedin() === true) {
      SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=set', jData,
        function(Response) {
          $scope.currentLanguage = Response.data.Language;
        },
        function(errorData) {
          console.log(errorData);
        }, '', true);
    }
  };


  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get("system");
        wait();
      }, 500);
    } else {
      getCurrentLanguage();
      getSupportedLanguages();
    }
  })();
});