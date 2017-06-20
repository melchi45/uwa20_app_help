"use strict";

kindFramework.factory('dateConverter', function() {
  var MIN_DOUBLE_FIGURES = 10;
  var HOUR_TO_MIN = 60;
  function addZero(_input) {
    var input = _input;
    if (input < MIN_DOUBLE_FIGURES) {
      input = "0" + input;
    }
    return input;
  }

  function getMinutes(baseTime, num) {
    var hours = Math.floor(num / HOUR_TO_MIN);
    var minutes = num - (hours * HOUR_TO_MIN);

    return addZero(hours) + ':' + addZero(minutes) + ':00';
  }
  return {
    getMinutes: getMinutes,
  };
});