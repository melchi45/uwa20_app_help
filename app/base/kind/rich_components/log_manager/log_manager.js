"use strict";

/**
 * @fileoverview A source file of Log Manager in Rich Components.
 * @name YongKu Cho
 */

/**
 * The Log Manager Components in Rich Components
 *
 * @memberof kindFramework
 * @ngdoc service
 * @name LogManager
 * @augments LOGMANAGER_CONFIG
 * @example
 *  kindFramework.controller('HomeCtrl', function($scope, $rootScope, LogManager){
 *  });
 */

kindFramework.service('LogManager', function(LOGMANAGER_CONFIG){
  var setTwoLetter = function(data){
    return data.toString().length === 1 ? "0" + data : data;
  };

  var getDate = function(){
    var newDate = new Date();
    var year = newDate.getFullYear();
    var month = newDate.getMonth() + 1;
    var day = newDate.getDate();
    var hour = newDate.getHours();
    var minutes = newDate.getMinutes();
    var seconds = newDate.getSeconds();

    month = setTwoLetter(month);
    day = setTwoLetter(day);
    hour = setTwoLetter(hour);
    minutes = setTwoLetter(minutes);
    seconds = setTwoLetter(seconds);

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
  };

  /**
   * This function log the information in the browser's console.
   *
   * @function info
   * @memberof LogManager
   * @param {string|number|Object} msg The message that want to log
   * @example
   *   LogManager.info("The Data Service is ran by the WrapCtrl.");
   *  //or
   *  LogManager.info("[kind_server_cm_data-svc] (initModels) The Data Service is ran by the WrapCtrl.");
   */
  this.info = function(){
    if (!window.console) {
      return;
    }

    var msg = '', i = 0;
    for (i = 0; i < arguments.length; i++) {
      msg += arguments[i];
    }
    if(LOGMANAGER_CONFIG.INFO){
      console.info(getDate() + ' [INFO] ' + msg);
    }
  };

  /**
   * This function log debugging in the browser's console.
   *
   * @function debug
   * @memberof LogManager
   * @param {string|number|Object} msg The message that want to log
   * @example
   *   LogManager.debug("The Data Service is ran by the WrapCtrl.");
   *  //or
   *  LogManager.debug("[kind_server_cm_data-svc] (initModels) The Data Service is ran by the WrapCtrl.");
   */
  this.debug = function(){
    if (!window.console) {
      return;
    }
    var msg = '', i = 0;
    for (i = 0; i < arguments.length; i++) {
      msg += arguments[i];
    }
    if(LOGMANAGER_CONFIG.DEBUG){
      console.debug(getDate() + ' [DEBUG] ' + msg);
    }
  };

  /**
   * This function log warning in the browser's console.
   *
   * @function warn
   * @memberof LogManager
   * @param {string|number|Object} msg The message that want to log
   * @example
   *   LogManager.warn("The Data Service is ran by the WrapCtrl.");
   *  //or
   *  LogManager.warn("[kind_server_cm_data-svc] (initModels) The Data Service is ran by the WrapCtrl.");
   */
  this.warn = function(){
    if (!window.console) {
      return;
    }
    var msg = '', i = 0;
    for (i = 0; i < arguments.length; i++) {
      msg += arguments[i];
    }
    if(LOGMANAGER_CONFIG.WARN){
      console.warn(getDate() + ' [WARN] ' + msg);
    }
  };


  /**
   * This function log a error in the browser's console.
   *
   * @function error
   * @memberof LogManager
   * @param {string|number|Object} msg The message that want to log
   * @example
   *   LogManager.error("The Data Service is ran by the WrapCtrl.");
   *  //or
   *  LogManager.error("[kind_server_cm_data-svc] (initModels) The Data Service is ran by the WrapCtrl.");
   */
  this.error = function(){
    if (!window.console) {
      return;
    }
    var msg = '', i = 0;
    for (i = 0; i < arguments.length; i++) {
      msg += arguments[i];
    }
    if(LOGMANAGER_CONFIG.ERROR){
      console.error(getDate() + ' [ERROR] ' + msg);
    }
  };
});