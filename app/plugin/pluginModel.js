kindFramework.factory('PluginModel', function() {
    'use strict';
    var PluginInfo = {
        NPAPI : {
            Name : 'Hanwha Techwin HTWisenetViewer Plugin',
            Description : 'HTWisenetViewer plugin',
            Version: 303,
            Path: 'plugin/HTWWisenetViewer.pkg',
            ObjectID : 'application/HTWisenetViewer-plugin'
        },
        ActiveX: {
            Name: 'Wisenet_ACTIVEX.wisenet_activexCtrl.1',
            Version: 303,
            Path: 'plugin/HTWWisenetViewer.exe',
            ObjectID : 'FC4C00B9-5A98-461C-88E8-B24B528DDBF5'
        }
    };
    return PluginInfo;
});