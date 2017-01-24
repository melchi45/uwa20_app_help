"use strict";

/**
 * kind Framework
 * 
 * @module kindFramework
 * @augments ngRoute
 * @augments ptzModule
 */
var kindFramework = angular.module(
    'kindFramework',
    [
        'ngRoute',
        'ptzModule',
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
            .when('/ptz', {
                templateUrl: 'views/ptz_template.html',
                controller: 'setPtzCtrl'
            })
            .otherwise({
                redirectTo: '/ptz'
            });
    });