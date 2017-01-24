"use strict";

/**
 * kind Framework
 * 
 * @module kindFramework
 * @augments ngRoute
 */
var kindFramework = angular.module(
    'kindFramework',
    [
        'ngRoute',
        'ui.grid',
        'kindSunapiModule'
    ]
);

/**
 * 
 * @class config
 * @constructor
 * @param {function} callBack
 * @memberof module:kindFramework
 */
kindFramework
    .config(function ($routeProvider) {
        $routeProvider
            .when('/event', {
                templateUrl: 'views/event_template.html',
                controller: 'eventCtrl'
            })
            .otherwise({
                redirectTo: '/event'
            });
    });


