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
        'kindStreamModule'
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
            .when('/streaming', {
                templateUrl: 'views/streaming_template.html',
                controller: 'streamingCtrl'
            })
            .otherwise({
                redirectTo: '/streaming'
            });
    });


