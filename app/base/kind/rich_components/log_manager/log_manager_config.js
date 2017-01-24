/**
 * @fileoverview A source file of the Log Manager Config in Rich Components.
 * @name YongKu Cho
 */

/**
 * The Config of Log Manager in Rich Components.
 * If you don't want to log, you will set to false value.
 *
 * @memberof kindFramework
 * @ngdoc constant
 * @name LOGMANAGER_CONFIG
 * @example
 *    kindFramework.constant('LOGMANAGER_CONFIG', {
 *        DEBUG: true,
 *        INFO: false,
 *        WARN: false,
 *        ERROR: true
 *    });
 */

kindFramework.constant('LOGMANAGER_CONFIG', {
    DEBUG: false,
    INFO: false,
    WARN: false,
    ERROR: false
});