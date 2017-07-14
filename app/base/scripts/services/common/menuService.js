"use strict";
/**
 * kindFramework module
 * @module kindFramework
 * @augments ngRoute
 */

/**
 * Rich components의 Restful client
 *
 * @class Route
 * @memberof module:kindFramework
 */
kindFramework.provider('Route', function(ROUTE_CONFIG) {

  var _routes = {};

  function Route() {}

  //현제 멘뉴에 대한 서브메뉴 리턴
  Route.getMenuData = function(stateName) {
    var menuList = [];
    for (var i = 0; i < _routes.length; i++) {
      if (_routes[i].stateName === stateName) {
        menuList = _routes[i].childs;
        break;
      }
    }
    return menuList;
  };

  //가공된 routes데이타 리턴
  Route.getRoutes = function() {
    return _routes;
  };

  /**
   *
   *화면이 있는 route객체를 찾아서 url규칙대로( 화면이 없는 중분류메뉴와 화면있는 메뉴의 연결은 "_"로 연결 )
   *ex) setup/network_snmp -> smp만 진짜 메뉴
   *
   */
  this.getRouteData = function(list, stateName) {
    _routes = JSON.parse(JSON.stringify(list)); //배열 복사

    var setRoute = function(routesList, parentName, onlyMenuParentName) {

      for (var i = 0; i < routesList.length; i++) {
        var route = routesList[i];
        var prefix = onlyMenuParentName ? '_' : '.';
        var stateName = parentName ? parentName + prefix + route.urlName : route.urlName;
        var onlyMenuName = false;

        if (typeof route.templateUrl === "undefined" && typeof route.controller === "undefined") {
          onlyMenuName = route.urlName;
          //route.urlName = null;
        } else {
          var urlName = route.urlName;
          if (onlyMenuParentName) {
            urlName = onlyMenuParentName + '_' + urlName;
          }
          route.urlName = '/' + urlName;
        }

        if (stateName !== null) {
          route.stateName = stateName;
        }
        if (angular.isArray(route.childs)) {
          route.isSub = true;
          if (route.childs.length > 0) {
            setRoute(route.childs, stateName, onlyMenuName);
          }
        } else {
          route.isSub = false;
        }
      }
    };
    setRoute(_routes, stateName);

    return _routes;
  };

  this.getRouteData(ROUTE_CONFIG.routes);

  this.$get = function() {
    return Route;
  };
});


kindFramework.service('MenuData', function($state, Route) {

  var _topMenuData = [];

  this.init = function() {
    this.setTopMenuData();
  };

  //최초 탑메뉴 데이타 셋팅
  this.setTopMenuData = function() {
    var routes = Route.getRoutes();
    for (var i = 0; i < routes.length; i++) {

      _topMenuData.push({
        name: routes[i].name,
        link: this.getTopMenuLink(routes[i]),
        stateName: routes[i].stateName,
        iconClass: routes[i].iconClass
      });
    }
  };

  //탑메뉴링크는 자식중 화면이 있는 최초의 자식으로 셋팅
  this.getTopMenuLink = function(routes) {

    var link = '';
    if (typeof routes.templateUrl === "undefined") { //laytout인경우는 자식의 화면을 찾는다
      var childList = routes.childs;
      for (var i = 0; i < childList.length; i++) {
        var item = childList[i];
        var linkCheck = this.getTopMenuLink(item);
        if (linkCheck !== '') {
          link = linkCheck;
          break;
        }
      } //for
    } else {
      link = routes.stateName;
    }

    return link;
  };

  this.getTopMenuData = function() {
    return _topMenuData;
  };

  //사이드 메뉴 데이타 셋팅
  this.getMenuData = function(state) {
    var stateName = state.current.name.split('.')[0];
    return Route.getMenuData(stateName);
  };

  this.init();
});