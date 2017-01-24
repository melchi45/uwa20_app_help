'use strict';
kindFramework.filter('videoCodec', function() {
    return function(type) {
        switch ( type ) {
            case 'H264':
                return 'H.264';

            case 'H265':
                return 'H.265';

            default:
                return type;
        }
    };
});

kindFramework.filter('audioCodec', function() {
    return function(type) {
        switch ( type ) {
            case 'G711':
                return 'G.711';

            case 'G726':
                return 'G.726';

            default:
                return type;
        }
    };
});

kindFramework.filter('rtspTimeoutOption', function() {
    return function(type) {
        switch ( type ) {
            case '0s':
                return 'lang_off';

            case '60s':
                return 'lang_on';

            default:
                return type;
        }
    };
});