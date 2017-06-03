"use strict";

kindFramework.factory('dateConverter', function() {
  function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }

  function getMinutes(baseTime, num) {
    var hours = Math.floor(num / 60);
    var minutes = num - (hours * 60);

    return addZero(hours) + ':' + addZero(minutes) + ':00';
  }
  return {
    getMinutes: getMinutes,
  };
});