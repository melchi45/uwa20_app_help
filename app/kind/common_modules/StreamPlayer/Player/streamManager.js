"use strict"; 

/**
 * Represents It's a manager for mutiple kind stream player.
 * @memberof (kind_stream.js)
 * @ngdoc module
 * @name KindStreamManager
 */
var KindStreamManager = (function () {
    /**
     * it's a container which has players of kind.
     * @var playerContainer
     * @memberof KindStreamManager
     */
    var playerContainer = [];
    var player = null;
    var checkPlayer = false;

    function Constructor() {}

    Constructor.prototype = {
        /**
         * Represents initialize a kind stream player.
         * @memberof KindStreamManager
         * @name initKindStreamPlayer
         * @param {object} info is an object which has channel id.
         * @example
         *    manager.initKindStreamPlayer(info);
         */
        initKindStreamPlayer: function (info, sunapiClient) {
            var id = info.device.channelId;
            checkPlayer = false;
            if (!playerContainer[id]) {
                player = new KindStreamPlayer(info, sunapiClient);
                playerContainer[id] = player;
                checkPlayer = true;
            } else {
                player = playerContainer[id];
                player.reassignCanvas();
            }
        },
        setBufferingFunc: function (func) {
            if (checkPlayer == true) {
                player.setBufferingFunction(func);
            }
        },
        /**
         * Represents control a kind stream player.
         * @memberof KindStreamManager
         * @name controlPlayer
         * @param {object} info is an object which has control data.
         * @example
         *    manager.initKindStreamPlayer(info);
         */
        controlPlayer: function (info) {
            var player,
                id = info.device.channelId;

            if (playerContainer[id]) {
                player = playerContainer[id];
                player.control(info);
            } else {
                console.log('ERROR: KindStreamPlayer is not initialized');
            }
        },
        controlWorker: function(controlData) {
            //controlData = {'channelId':0, 'cmd':'', 'data': ['data1', 'data2']}
            var player,
                id = controlData.channelId;

            if (playerContainer[id]) {
                player = playerContainer[id];
                player.controlWorker(controlData);
            } else {
                console.log('ERROR: KindStreamPlayer is not initialized controlWorker::cmd = ' + controlData.cmd);
            }
        },
        setResizeCallback: function(callback) {
            player.setResizeCallback(callback);
        },
        decoderInit: function(codecType) {
            player.decoderInit(codecType);
        },
        destroyPlayer: function(){
            this.controlWorker({'channelId':0, 'cmd':'initVideo', 'data': [false]});
            this.controlWorker({'channelId':0, 'cmd':'setLiveMode', 'data': ["canvas"]});
            this.controlWorker({'channelId':0, 'cmd':'controlAudioListen', 'data': ['volumn', 0]});
            this.controlWorker({'channelId':0, 'cmd':'controlAudioTalk', 'data': ['volumn', 0]});
            playerContainer = [];
        }
    };
    return Constructor;
})();