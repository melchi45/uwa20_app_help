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
            .when('/snapshot', {
                templateUrl: 'views/snapshot_template.html',
                controller: 'snapshotCtrl'
            })
            .otherwise({
                redirectTo: '/snapshot'
            });
    });


