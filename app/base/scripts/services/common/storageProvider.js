"use strict";

kindFramework
.provider('LocalStorageService', function() {
	this.$get = ['$q', 'LoggingService', function($q, LoggingService) {
        var localStorage = (typeof window.localStorage === 'undefined') ? undefined : window.localStorage;
        var deferred = $q.defer();
        var logger = LoggingService.getInstance('LocalStorageService');
        
        var setItem = function(key, item) { //store profile into local storage
            if(localStorage !== undefined) {
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
        var getItem = function(key) { //retrieve profile from local storage
            if(localStorage !== undefined) {
                var profile = localStorage.getItem(key);
                if(profile !== null) {
                    deferred.resolve(JSON.parse(profile));
                } else {
                    deferred.resolve(null);
                }
            } else {
                deferred.reject('Local Storage is undefined');
            }
            return deferred.promise;
        };
        var getItemSync = function(key) { //retrieve profile from local storage
            if(localStorage !== undefined) {
                var profile = localStorage.getItem(key);
                if(profile !== null) {
                    return JSON.parse(profile);
                } else {
                    return null;
                }
            } else {
                return undefined;
            }
        };
        var removeItem = function(key) {
            localStorage.removeItem(key);
        };
        var clear = function() {
            localStorage.clear();
        };
        return {
        	setItem: setItem,
        	getItem: getItem,
        	getItemSync: getItemSync,
        	removeItem: removeItem,
        	clear: clear
        };
	}];
});