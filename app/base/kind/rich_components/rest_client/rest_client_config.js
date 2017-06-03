/**
 * @fileoverview A source file of the Rest Client Config in Rich Components.
 * @name YongKu Cho
 */

/**
 * The Config of Rest Client in Rich Components.
 *
 * @memberof kindFramework
 * @ngdoc constant
 * @name RESTCLIENT_CONFIG
 * @example
 *  kindFramework.constant('RESTCLIENT_CONFIG', {
 *    digest: {
       serverType: 'camera',    // 'grunt' or 'camera'
 *      hostName: '192.168.75.54',
 *      port: 80,
 *      protocol: 'http'
 *    }
 *  })
 */
kindFramework.
constant('RESTCLIENT_CONFIG', {
  clientVersion: '1.00_20160404',
  serverType: 'grunt', // 'grunt' or 'camera'
  debugMode: false, // serverType이 camera 일 때 동작안함.
  digest: {
    hostName: '192.168.123.164', // 5M
    port: 80,
    protocol: 'http',
    rtspIp: '',
    rtspPort: 554,
    ClientIPAddress: '127.0.0.1', //default client ip used for rtsp useragent will be replaced later
    macAddress: ''
  }
});