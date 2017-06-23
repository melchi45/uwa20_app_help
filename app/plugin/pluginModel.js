kindFramework.factory('PluginModel', function() {
    'use strict';
    var PluginInfo = {
        NPAPI : {
            Name : 'Hanwha Techwin HTWisenetViewer2 Plugin',
            Description : 'HTWisenetViewer2 plugin',
            Version: 310,
            Path: 'plugin/HTWWisenetViewer2.pkg',
            ObjectID : 'application/HTWisenetViewer2-plugin'
        },
        ActiveX: {
            Name: 'Wisenet_ACTIVEX.wisenet2_activexCtrl.1',
            Version: 310,
            Path: 'plugin/HTWWisenetViewer2.exe',
            ObjectID : 'FC4C00B9-5A98-461C-88E8-B24B528DDBFF'
        }
    };
    return PluginInfo;
});