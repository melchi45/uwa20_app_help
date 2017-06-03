/*global vis*/
"use strict";
angular.module('ui.bootstrap.datepicker').
config(function($provide) {
  $provide.decorator('uibDatepickerDirective', function($delegate) {
    var directive = $delegate[0],
      link = directive.link;

    angular.extend(directive.scope, {
      'monthChanged': '&'
    });

    directive.compile = function() {

      var changeFormatMMYYYY = function(dateValue) {
        var dateObj = new Date(dateValue);
        return (dateObj.getMonth() + 1) + '-' + dateObj.getFullYear();
      };

      return function(scope, element, attrs, ctrl) {
        link.apply(this, arguments);
        var datepickerCtrl = ctrl[0];
        var ngModelCtrl = ctrl[1];
        if (ngModelCtrl) {
          //Listen for 'refreshDatepickers' event
          scope.$on('refreshDatepickers', function refreshView() {
            datepickerCtrl.refreshView();
          });
        }
        scope.$watch(function() {
            return ctrl[0].activeDate.getTime();
          },
          function(newVal, oldVal) {
            if (scope.datepickerMode === 'day' || scope.datepickerMode === 'month') {
              if (changeFormatMMYYYY(oldVal) !== changeFormatMMYYYY(newVal)) {
                scope.$root.$broadcast('onChangedMonth', new Date(newVal));
              }
            } else {
              console.log("unexpected scope.datepickerMode", scope.datepickerMode);
            }
          });
      };
    };
    return $delegate;
  });
});

angular.module("template/datepicker/day.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/day.html",
    "<table role=\"grid\" aria-labelledby=\"{{::uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
    "      <th colspan=\"{{::5 + showWeeks}}\"><button id=\"{{::uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" ng-disabled=\"datepickerMode === maxMode\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <th ng-if=\"showWeeks\" class=\"text-center\"></th>\n" +
    "      <th ng-repeat=\"label in ::labels track by $index\" class=\"text-center\"><small aria-label=\"{{::label.full}}\">{{::label.abbr}}</small></th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr ng-repeat=\"row in rows track by $index\">\n" +
    "      <td ng-if=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
    "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{::dt.uid}}\" ng-class=\"dt.customClass\">\n" +
    "        <button type=\"button\" style=\"min-width:100%;\" class=\"btn btn-default btn-sm\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"::{'text-muted': dt.secondary, 'text-info': dt.current}\">{{::dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);