kindFramework.factory('PluginModel', function() {
    'use strict';
    var PluginInfo = {
        NPAPI : {
            Name : 'Hanwha Techwin HTWisenetViewer Plugin',
            Description : 'HTWisenetViewer plugin',
            Version: 151,
            Path: 'plugin/HTWWisenetViewer.pkg'
        },
        ActiveX: {
            Name: 'Wisenet_ACTIVEX.wisenet_activexCtrl.1',
            Version: 151,
            Path: 'plugin/HTWWisenetViewer.exe'
        }
    };
    return PluginInfo;
});