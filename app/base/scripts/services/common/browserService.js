kindFramework
    .service('BrowserService', ['$window','PluginModel', function($window, PluginModel) {
        'use strict';
        var BrowserServiceObj = (function(){
            // private area
            var BROWSER_TYPES = { IE : 'IE', EDGE:'EDGE', CHROME:'CHROME', FIREFOX:'FIREFOX', SAFARI: 'SAFARI' };
            var OS_TYPES = {WINDOWS: 'WINDOWS', MACINTOSH: 'MACINTOSH'};

            var ClientOS;
            var ClientBrowser;
            var PluginInstallationCheck;
            var PlugInVersionValidation;
            var ClientBrowserSupportPlugIn;
            var PluginInstallerPath;

            function getOS() {
                var UserAgent = $window.navigator.userAgent;
                var OSs = { WINDOWS: /msie|trident/i, MACINTOSH: /macintosh/i};

                for(var key in OSs) {
                    if (OSs[key].test(UserAgent)) {
                        return String(key);
                    }
                }
                return 'unknown';
            }

            function getBrowser() {
                var UserAgent = $window.navigator.userAgent;
                var Browsers = {IE: /msie|trident/i, EDGE: /chrome.+? edge/i , CHROME: /chrome|crios|crmo/i, FIREFOX: /firefox|iceweasel/i, SAFARI: /safari/i };

                for(var key in Browsers) {
                    if (Browsers[key].test(UserAgent)) {
                        return String(key);
                    }
                }
                return 'unknown';
            }

            function ActiveXPlugInDetect(){
                try {
                    var axObj = new ActiveXObject(PluginModel.ActiveX.Name);

                    if(axObj){
                        console.log("ActiveX is Detected");
                        return true;
                    } else {
                        console.log("ActiveX isn't Detected");
                        return false;
                    }
                } catch (e) {
                    console.log("ActiveX isn't Detected");
                    return false;
                }
            }

            function NPAPIPlugInDetect(){
                var plugins = navigator.mimeTypes;

                for (var i=0; i< plugins.length; i++)
                {
                    if (plugins[i].description === PluginModel.NPAPI.Description)
                    {
                        console.log("NPAPI is Detected");
                        return true;
                    }
                }
                console.log("NPAPI isn't Detected");
                return false;
            }

            function PlugInVersionCheck(_channelPlayerElement) {
                if(PlugInVersionValidation === undefined)
                {
                    if(arguments.length !== 1) return new Error("PlugInVersionCheck :: the length of argument isn't one");

                    switch(ClientBrowser)
                    {
                        case BROWSER_TYPES.IE:
                            PlugInVersionValidation = ActiveXVersionCheck(_channelPlayerElement);
                            break;
                        case BROWSER_TYPES.SAFARI:
                            PlugInVersionValidation = NPAPIVersionCheck(_channelPlayerElement);
                            break;
                        case BROWSER_TYPES.EDGE:
                        case BROWSER_TYPES.CHROME:
                        case BROWSER_TYPES.FIREFOX:
                        default:
                            return new Error ("PlugInVersionCheck :: this browser doesn't support web Plugin");
                    }
                }

                return PlugInVersionValidation;
            }

            function ActiveXVersionCheck(_channelPlayerElement) {
                if(_channelPlayerElement.find('object').length !== 0)
                {
                    var InstalledActiveXPlugInVersion = _channelPlayerElement[0].getElementsByTagName('object')[0].GetCurrentVersion();
                    console.log("Installed ActiveX Version : " + InstalledActiveXPlugInVersion);

                    if(PluginModel.ActiveX.Version > InstalledActiveXPlugInVersion)
                    {
                        return false;
                    }
                    return true;
                } else {
                    return new Error('ActiveXVersionCheck :: There is no object element');
                }
            }

            function NPAPIVersionCheck(_channelPlayerElement) {
                if(_channelPlayerElement.find('object').length !== 0) {
                    var InstalledNPAPIPlugInVersion = _channelPlayerElement[0].getElementsByTagName('object')[0].GetCurrentVersion();
                    console.log("Installed NPAPI Version : " + InstalledNPAPIPlugInVersion);

                    if (PluginModel.NPAPI.Version > InstalledNPAPIPlugInVersion) {
                        return false;
                    }
                    return true;
                }else {
                    return new Error('NPAPIVersionCheck :: There is no object element');
                }
            }

            function Constructor() {
                ClientOS = getOS();
                ClientBrowser = getBrowser();

                switch(ClientBrowser)
                {
                    case BROWSER_TYPES.IE:
                        PluginInstallationCheck = ActiveXPlugInDetect();
                        ClientBrowserSupportPlugIn = true;
                        break;
                    case BROWSER_TYPES.SAFARI:
                        PluginInstallationCheck = NPAPIPlugInDetect();
                        ClientBrowserSupportPlugIn = true;
                        break;
                    case BROWSER_TYPES.EDGE:
                    case BROWSER_TYPES.CHROME:
                    case BROWSER_TYPES.FIREFOX:
                    default:
                        PluginInstallationCheck = false;
                        ClientBrowserSupportPlugIn = false;
                }

                switch(ClientOS)
                {
                    case OS_TYPES.WINDOWS:
                        PluginInstallerPath = PluginModel.ActiveX.Path;
                        break;
                    case OS_TYPES.MACINTOSH:
                        PluginInstallerPath = PluginModel.NPAPI.Path;
                        break;
                }
            }
            Constructor();

            return {
                BROWSER_TYPES : BROWSER_TYPES,
                OS_TYPES : OS_TYPES,
                OSDetect : ClientOS,
                BrowserDetect : ClientBrowser,
                PlugInDetect : PluginInstallationCheck,
                PlugInVersionCheck : PlugInVersionCheck,
                PlugInSupport : ClientBrowserSupportPlugIn,
                PlugInPath : PluginInstallerPath
            };
        })();

        return BrowserServiceObj;
}]);