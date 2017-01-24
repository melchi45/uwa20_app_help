"use strict";

/**
 * kind Framework
 * 
 * @module kindFramework
 * @augments ngRoute
 */
var kindFramework = angular.module('kindFramework', angularModules);
angularModules = null;
/**
 * 
 * @class config
 * @constructor
 * @param {function} callBack
 * @memberof module:kindFramework
 */
kindFramework
    .config(function ($stateProvider, $urlRouterProvider, ROUTE_CONFIG) {
    
        $urlRouterProvider.otherwise(ROUTE_CONFIG.default);
        
        var routes = ROUTE_CONFIG.routes;
        var setRoute = function(routes, parentName, onlyMenuParentName){
            for(var i = 0, iLen = routes.length; i < iLen; i++){
                var route = routes[i];
                var prefix = onlyMenuParentName ? '_' : '.';
                var stateName = parentName ? parentName + prefix + route.urlName : route.urlName;
                var onlyMenuName = false;
                
                if(route.templateUrl === undefined && route.controller === undefined){
                    onlyMenuName = route.urlName;
                }else{
                    var urlName = route.urlName;
                    if(onlyMenuParentName){
                        urlName = onlyMenuParentName + '_' + urlName;
                    }
                    urlName = '/' + urlName;
                    
                    $stateProvider.state(stateName, {
                        url: urlName,
                        templateUrl: route.templateUrl || null,
                        controller: route.controller || null
                    });
                }
                
                if(angular.isArray(route.childs)){
                    if(route.childs.length > 0){
                        setRoute(route.childs, stateName, onlyMenuName);
                    }
                }
            }    
        };
    
        setRoute(routes);
    });