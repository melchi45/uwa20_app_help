kindFramework.directive(
  'globalNavigationBar',
  function(
    SunapiClient, 
    $state, 
    $rootScope, 
    $timeout, 
    SessionOfUserManager, 
    BrowserService, 
    $location,
    
    UniversialManagerService, 
    CAMERA_STATUS, 
    ONLINE_HELP_CONFIG, 
    ROUTE_CONFIG, 
    $translate, 
    Attributes,
    
    kindStreamInterface
  ) {
    "use strict";
    return {
      restrict: 'E',
      scope: false,
      replace: true,
      templateUrl: 'views/common/directives/globalNavigationBar.html',
      link: function(scope, element, attrs) {
        var DELAY_TIME = 100;
        $rootScope.isCameraSetupPreview = false;
        scope.globalNavigationBar = {
          isSetup: false,
          isLive: false,
          isPlayback: false,
          isAdmin: false,
          deviceModelName: '',
          showFpsMeterNum: 0,
          fpsFrameNum: 1000,
          init: function() {
            scope.supportPlugin = BrowserService.PlugInSupport;
            scope.notInstalledPlugin = false;

            switch (BrowserService.BrowserDetect) {
              case BrowserService.BROWSER_TYPES.IE:
              case BrowserService.BROWSER_TYPES.SAFARI:
                if (BrowserService.PlugInDetect) {
                  scope.notInstalledPlugin = !BrowserService.PlugInVersionCheck();
                } else {
                  scope.notInstalledPlugin = true;
                }
                break;
              default:
                scope.notInstalledPlugin = true;
                break;
            }

            scope.DownloadPathPlugin = BrowserService.PlugInPath;

            if ("isSetup" in attrs) {
              if (attrs.isSetup === "true") {
                scope.globalNavigationBar.isSetup = true;
                scope.globalNavigationBar.isLive = false;
                scope.globalNavigationBar.isPlayback = false;
              }
            }

            if ($location.path() === '/uni/channel') {
              scope.globalNavigationBar.isLive = true;
              scope.globalNavigationBar.isPlayback = scope.globalNavigationBar.isSetup = false;
            } else if ($location.path() === '/uni/playbackChannel') {
              scope.globalNavigationBar.isPlayback = true;
              scope.globalNavigationBar.isLive = scope.globalNavigationBar.isSetup = false;
            }

            SunapiClient.get(
              '/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view',
              '',
              function(response) {
                scope.globalNavigationBar.deviceModelName = response.data.Model;
                console.log(
                  "[Init] deviceModelName = " + scope.globalNavigationBar.deviceModelName
                );
              }, 
              function(errorData) {
                console.log(errorData);
              }, 
              '', 
              true
            );

            if (SessionOfUserManager.getUsername() === 'admin') {
              scope.globalNavigationBar.isAdmin = true;
            }
          },
          goToLive: function() {
            if ($rootScope.isCameraSetupPreview === true) {
              $rootScope.cameraSetupToLive = true;
              if ($rootScope.cameraSetupPreviewCount < $rootScope.cameraSetupPreviewMaxCount) {
                $timeout(function() {
                  scope.globalNavigationBar.goToLive();
                }, DELAY_TIME);
                $rootScope.cameraSetupPreviewCount++;
              } else {
                $rootScope.isCameraSetupPreview = false;
                $rootScope.cameraSetupToLive = false;

                scope.pageInit();
                scope.globalNavigationBar.isLive = true;
                scope.globalNavigationBar.isSetup = false;
                scope.globalNavigationBar.isPlayback = false;
                $rootScope.$emit('enablePlayback', false);
                $state.go('uni.channel');
              }
            } else {
              $rootScope.cameraSetupToLive = false;

              scope.pageInit();
              scope.globalNavigationBar.isLive = true;
              scope.globalNavigationBar.isSetup = false;
              scope.globalNavigationBar.isPlayback = false;
              $rootScope.$emit('enablePlayback', false);
              $state.go('uni.channel');
            }
          },
          goToPlayback: function() {
            if ($rootScope.isCameraSetupPreview === true) {
              $rootScope.cameraSetupToLive = true;
              if ($rootScope.cameraSetupPreviewCount < $rootScope.cameraSetupPreviewMaxCount) {
                $timeout(function() {
                  scope.globalNavigationBar.goToPlayback();
                }, DELAY_TIME);
                $rootScope.cameraSetupPreviewCount++;
              } else {
                $rootScope.isCameraSetupPreview = false;
                $rootScope.cameraSetupToLive = false;

                scope.pageInit();
                scope.globalNavigationBar.isPlayback = true;
                scope.globalNavigationBar.isSetup = false;
                scope.globalNavigationBar.isLive = false;
                $rootScope.$emit('enablePlayback', true);
                $state.go('uni.playbackChannel');
              }
            } else {
              $rootScope.cameraSetupToLive = false;

              scope.pageInit();
              scope.globalNavigationBar.isPlayback = true;
              scope.globalNavigationBar.isSetup = false;
              scope.globalNavigationBar.isLive = false;
              $rootScope.$emit('enablePlayback', true);
              $state.go('uni.playbackChannel');
            }
          }
        };

        scope.globalNavigationBar.init();

        scope.setPlugin = function() {
          $rootScope.$emit("channel:setPlugin");
        };

        $rootScope.$saveOn('NeedToInstallPlugIn', function(event, activated) {
          scope.notInstalledPlugin = activated ? activated : false;
        });

        scope.pageInit = function() {
          var StreamingMode = UniversialManagerService.getStreamingMode();
          if (StreamingMode === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE) {
            UniversialManagerService.setVideoMode("canvas");
          } else {
            UniversialManagerService.setVideoMode(null);
          }
        };

        scope.toggleFpsMeter = function() {
          //scope.globalNavigationBar.showFpsMeterNum++;
          if (scope.globalNavigationBar.showFpsMeterNum > 3) {
            kindStreamInterface.controlWorker({
              'channelId': 0,
              'cmd': 'openFPSmeter',
              'data': []
            });
            scope.globalNavigationBar.showFpsMeterNum = 0;
          } else {
            kindStreamInterface.controlWorker({
              'channelId': 0,
              'cmd': 'closeFPSmeter',
              'data': []
            });
          }
        };

        scope.closeFpsMeter = function() {
          kindStreamInterface.controlWorker({
            'channelId': 0,
            'cmd': 'closeFPSmeter',
            'data': []
          });
        };

        scope.changeFpsFrame = function() {
          kindStreamInterface.controlWorker({
            'channelId': 0,
            'cmd': 'setFpsFrame',
            'data': [scope.globalNavigationBar.fpsFrameNum]
          });
        };

        function getSupportMenu() {
          var sizeMenu = $("#side-menu > li:not(.ng-hide)");
          var supportMenuInfo = [];
          var supportMenuData = [];

          var hashData = location.hash;

          function getChildsMenu(parentMenu, parentMenuName) {
            var childsMenuInfo = {};
            var childsMenuData = [];

            if (parentMenu.find('> ul > li').length > 0) {
              parentMenu.find('> ul > li > a:not(.ng-hide)').each(function() {
                var menuData = {};
                var childMenu = $(this);

                var stateName = childMenu.attr('ui-sref');

                var name = stateName.
                replace(ONLINE_HELP_CONFIG.SETUP_URL + '.', '').
                replace(parentMenuName + "_", '');

                var childs = getChildsMenu(childMenu.parent(), parentMenuName + "_" + name);
                var iconClass = childMenu.find('> i').attr('class');

                menuData = {
                  title: childMenu.text().trim(),
                  stateName: stateName.replace(
                    ONLINE_HELP_CONFIG.SETUP_URL,
                    ONLINE_HELP_CONFIG.HELP_URL
                  ),
                  iconClass: iconClass,
                  childs: childs.data
                };

                childsMenuInfo[name] = {
                  childs: childs.info
                };

                childsMenuData.push(menuData);
              });
            }

            return {
              info: childsMenuInfo,
              data: childsMenuData
            };
          }

          if (hashData.indexOf('channel') > -1) {
            supportMenuData = [{
              title: $translate.instant('lang_top_monitoring'),
              stateName: 'help.monitoring',
              iconClass: 'tui tui-wn5-top-live',
              childs: []
            }];
          } else if (hashData.indexOf('playbackChannel') > -1) {
            supportMenuData = [{
              title: $translate.instant('lang_top_playback'),
              stateName: 'help.playback',
              iconClass: 'tui tui-wn5-top-playback',
              childs: []
            }];
          } else {
            sizeMenu.each(function() {
              var mainMenu = $(this);
              var menuData = {};

              var stateName = mainMenu.
              attr('ng-class').
              replace("activeCheck('", '').
              replace("')", '');

              var name = stateName.replace(ONLINE_HELP_CONFIG.SETUP_URL + '.', '');

              var iconClass = mainMenu.find('> a > i').attr('class');
              var title = mainMenu.find('> a > i+span').text();

              var childs = getChildsMenu(mainMenu, name);

              menuData = {
                stateName: stateName.replace(
                  ONLINE_HELP_CONFIG.SETUP_URL,
                  ONLINE_HELP_CONFIG.HELP_URL
                ),
                title: title,
                iconClass: iconClass,
                childs: childs.data
              };

              supportMenuInfo[name] = {
                childs: childs.info
              };

              supportMenuData.push(menuData);
            });
          }

          return {
            info: supportMenuInfo,
            data: supportMenuData
          };
        }

        scope.openOnlineHelp = function() {
          var hashData = location.hash;
          var helpUrl = [
            ONLINE_HELP_CONFIG.ROOT,
            ONLINE_HELP_CONFIG.INDEX,
            hashData.replace(ONLINE_HELP_CONFIG.SETUP_URL, ONLINE_HELP_CONFIG.HELP_URL)
          ].join('');
          var cameraAttributes = Attributes.get();

          function getSupportRoute(routes, parentName, onlyMenuParentName, childMenu) {
            for (var i = 0, ii = routes.length; i < ii; i++) {
              var route = routes[i];
              var prefix = '';
              var stateName = '';
              var onlyMenuName = false;
              var stateData = {};
              var urlName = '';

              if (route.urlName in childMenu) {
                prefix = onlyMenuParentName ? '_' : '.';
                stateName = parentName ? parentName + prefix + route.urlName : route.urlName;
                onlyMenuName = false;

                if (
                  typeof route.templateUrl === "undefined" &&
                  typeof route.controller === "undefined"
                ) {
                  onlyMenuName = route.urlName;
                } else {
                  urlName = route.urlName;

                  for (var replaceUrlName in ONLINE_HELP_CONFIG.REPLACE_TEMPLATE) {
                    var selfTemplate = null;
                    if (urlName === replaceUrlName) {
                      selfTemplate = ONLINE_HELP_CONFIG.REPLACE_TEMPLATE[replaceUrlName];
                      route.templateUrl = route.templateUrl.replace(
                        selfTemplate.from,
                        selfTemplate.to
                      );
                      break;
                    }
                  }

                  if (onlyMenuParentName) {
                    urlName = onlyMenuParentName + '_' + urlName;
                  }
                  urlName = '/' + urlName;

                  stateData = {
                    stateName: stateName,
                    urlName: urlName,
                    templateUrl: route.templateUrl.replace(
                      'views/' + ONLINE_HELP_CONFIG.SETUP_URL + '/',
                      rootPath) || null,
                    controller: route.controller || null
                  };

                  supportRoute.push(stateData);
                }

                if (angular.isArray(route.childs)) {
                  if (route.childs.length > 0) {
                    getSupportRoute(
                      route.childs,
                      stateName,
                      onlyMenuName,
                      childMenu[route.urlName].childs
                    );
                  }
                }
              }
            }
          }

          function checkICSSupport(){
            var irisModeOptions = cameraAttributes.IrisModeOptions;
            var isSupport = false;
            var i = 0;
            var len = 0;
            var option = '';

            if (typeof irisModeOptions !== "undefined") {
              len = irisModeOptions.length;
              for (; i < len; i++) {
                option = irisModeOptions[i];
                if (option.indexOf('ICS') !== -1) {
                  isSupport = true;
                  break;
                }
              }
            }

            return isSupport;
          }

          var currentCameraLanguage = $translate.use();
          var rootPath = '';
          if (ONLINE_HELP_CONFIG.USE_MULTI_LANGUAGE) {
            if (ONLINE_HELP_CONFIG.SUPPORT_LANGUAGES.indexOf(currentCameraLanguage) > 0) {
              rootPath = currentCameraLanguage;
            } else {
              rootPath = ONLINE_HELP_CONFIG.DEFAULT_LANGUAGE;
            }
            rootPath += '/';
          }

          var supportMenu = getSupportMenu();
          var supportRoute = [];

          var routes = ROUTE_CONFIG.routes;

          for (var i = 0, len = routes.length; i < len; i++) {
            var self = routes[i];
            if (self.urlName === ONLINE_HELP_CONFIG.SETUP_URL) {
              supportRoute.push({
                stateName: ONLINE_HELP_CONFIG.HELP_URL,
                urlName: "/" + ONLINE_HELP_CONFIG.HELP_URL,
                templateUrl: ONLINE_HELP_CONFIG.MAIN
              });


              if (hashData.indexOf('channel') > -1) {
                supportRoute.push({
                  stateName: 'help.monitoring',
                  urlName: '/monitoring',
                  templateUrl: rootPath + 'Monitoring.html'
                });
              } else if (hashData.indexOf('playbackChannel') > -1) {
                supportRoute.push({
                  stateName: 'help.playback',
                  urlName: '/playback',
                  templateUrl: rootPath + 'Playback.html'
                });
              } else {
                getSupportRoute(
                  self.childs,
                  ONLINE_HELP_CONFIG.HELP_URL,
                  false,
                  supportMenu.info
                );
              }
              break;
            }
          }

          var supportFeatures = {};

          try {
            supportFeatures = {
              IR: typeof cameraAttributes.IRledModeOptions !== "undefined",
              Heater: (
                typeof cameraAttributes.AuxCommands !== "undefined" &&
                cameraAttributes.AuxCommands[0] === 'HeaterOn'
              ),

              LDCAuto: (
                typeof cameraAttributes.LDCModeOptions !== "undefined" &&
                cameraAttributes.LDCModeOptions.indexOf('Auto') !== -1
              ),

              //Newly Added
              PresetAction: (
                typeof cameraAttributes.EventActions !== "undefined" &&
                cameraAttributes.EventActions.indexOf('GoToPreset') !== -1
              ),
              IrisModeOptions: (
                typeof cameraAttributes.IrisModeOptions !== "undefined" &&
                cameraAttributes.ExternalPTZModel !== true
              ),
              Lens: (
                typeof cameraAttributes.IrisModeOptions !== "undefined" &&
                cameraAttributes.ExternalPTZModel === true
              ),
              IrisFnoOptions: (typeof cameraAttributes.IrisFnoOptions !== "undefined"),
              PIrisModeOptions: (typeof cameraAttributes.PIrisModeOptions !== "undefined"),
              PIrisPosition: (typeof cameraAttributes.PIrisPosition !== "undefined"),
              SimpleFocusAfterDayNight: (
                typeof cameraAttributes.SimpleFocusAfterDayNight !== "undefined"
              ),
              InternalMic: (
                typeof cameraAttributes.AudioInSourceOptions !== "undefined" &&
                cameraAttributes.AudioInSourceOptions[0] === "MIC"
              ),
              FastAutoFocusDefined: (typeof cameraAttributes.FastAutoFocusEnable !== "undefined"),
              ZoomOptionsDefined: (typeof cameraAttributes.SimpleZoomOptions !== "undefined"),
              PTZMode: (
                cameraAttributes.RS485Support &&
                cameraAttributes.isDigitalPTZ &&
                (
                  cameraAttributes.MaxPreset > 0
                )
              ),
              FisheyeLens: cameraAttributes.FisheyeLens,
              PTZModel: (cameraAttributes.PTZModel === true),
              Focus: (
                cameraAttributes.PTZModel === true ||
                cameraAttributes.ZoomOnlyModel === true
              ),
              Zoom: (cameraAttributes.ZoomOnlyModel === true),
              ICS: checkICSSupport(),
              LensModelOptions: (typeof cameraAttributes.LensModelOptions !== "undefined"),
              PTRZModel: (cameraAttributes.PTRZModel === true),
              OverlayColorOptions: (typeof cameraAttributes.OverlayColorOptions !== "undefined"),

              DPTZSetupPage: cameraAttributes.isDigitalPTZ === true && cameraAttributes.MaxGroupCount > 0,
              ExternalPTZPage: (cameraAttributes.ExternalPTZModel === true),
              PTZSetupPage: (cameraAttributes.PTZModel === true),
              PresetSetupPage: (cameraAttributes.ZoomOnlyModel === true)
            };
          } catch (error) {
            console.error(error);
          }

          // console.log(supportFeatures);

          localStorage.supportMenu = JSON.stringify(supportMenu.data);
          localStorage.supportRoute = JSON.stringify(supportRoute);
          localStorage.supportFeatures = JSON.stringify(supportFeatures);
          localStorage.langOnlineHelp = $translate.instant('lang_online_help');

          setTimeout(function() {
            window.open(
              helpUrl,
              "_blank",
              [
                "resizable=yes,width=",
                ONLINE_HELP_CONFIG.WIDTH,
                ",height=",
                ONLINE_HELP_CONFIG.HEIGHT
              ].join('')
            );
          });
        };
      }
    };
  }
);