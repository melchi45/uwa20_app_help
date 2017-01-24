"use strict";

kindFramework
    .factory('LoggingService', ['$log', function($log) {

        $log.enabledContexts = [];

        var getInstance = function(context){
            return {
                log : enhanceLogging($log.log, context),
                info : enhanceLogging($log.info, context),
                warn : enhanceLogging($log.warn, context),
                debug : enhanceLogging($log.debug, context),
                error : enhanceLogging($log.error, context),
                enableLogging : function(enable){
                    $log.enabledContexts[context] = enable;
                }
            };
        };
        
        function enhanceLogging(loggingFunc, context){
            return function() {
                var contextEnabled = $log.enabledContexts[context];
                if ($log.enabledContexts[context] === null || contextEnabled) {
                    var modifiedArguments = [].slice.call(arguments);
                    modifiedArguments[0] = ['[' + getTimestamp(new Date()) + ']' + '[' + context + ']> '] + modifiedArguments[0];
                    loggingFunc.apply(null, modifiedArguments);
                }
            };
        }

        function getTimestamp(date){
            return (date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "|" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
        }

    return {
        getInstance : getInstance       
    };
}]);