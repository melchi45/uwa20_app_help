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
            .when('/profile', {
                templateUrl: 'views/profile_template.html',
                controller: 'profileCtrl'
            })
            .otherwise({
                redirectTo: '/profile'
            });
    });


