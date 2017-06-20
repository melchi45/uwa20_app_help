"use strict";

kindFramework.
  service('LocalStorageService', ['$q', 'LoggingService', function($q, LoggingService) {
    var localStorage = (typeof window.localStorage === 'undefined') ? null : window.localStorage;
    var deferred = $q.defer();
    var logger = LoggingService.getInstance('LocalStorageService');

    this.setItem = function(key, item) { //store profile into local storage
      if (localStorage !== null) {
        try {
          localStorage.setItem(key, JSON.stringify(item));
        } catch (err) {
          logger.error(err);
          // throw new Error('Failed to set item into LocalStorage');
        }
      } else {
        logger.error('Local Storage is undefined!');
      }
    };
    this.getItem = function(key) { //retrieve profile from local storage
      if (localStorage !== null) {
        var profile = localStorage.getItem(key);
        if (profile !== null) {
          deferred.resolve(JSON.parse(profile));
        } else {
          deferred.resolve(null);
        }
      } else {
        deferred.reject('Local Storage is undefined');
      }
      return deferred.promise;
    };
    this.getItemSync = function(key) { //retrieve profile from local storage
      if (localStorage !== null) {
        var profile = localStorage.getItem(key);
        if (profile !== null) {
          return JSON.parse(profile);
        } else {
          return null;
        }
      } else {
        return null;
      }
    };
    this.removeItem = function(key) {
      localStorage.removeItem(key);
    };
    this.clear = function() {
      localStorage.clear();
    };
  }]);