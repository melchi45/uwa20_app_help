"use strict";

/**
 * If parent do not have both templateUrl and controller,
 * the ui-view is became templateUrl of child.
 */

kindFramework.constant('ROUTE_CONFIG', {
    default: 'login',
    routes: [
        {
            urlName: 'login',
            name: 'Login Design',
            templateUrl: 'views/login/login.html',
            controller: 'LoginCtrl'
        },
        {
            urlName: 'loginFail',
            name: 'Login Fail',
            templateUrl: 'views/login/loginFail.html',
            controller: 'LoginFailCtrl'
        },
        {
          urlName: 'find_auth',
          name: 'Find Auth',
          templateUrl: 'views/login/find_auth.html',
          controller: 'FindAuthCtrl'
        },
				{
					urlName: 'change_password',
					name: 'Change Password',
					templateUrl: 'views/login/change_password.html',
					controller: 'ChangePasswordCtrl'
				},
        {
          urlName: 'uni',
          name: 'BtoBMain view',
          templateUrl: 'views/livePlayback/main.html',
          controller: 'UniversalMainCtrl',
          childs: [
            {
              urlName: 'channellist',
              name: 'channelList',
              templateUrl: 'views/livePlayback/channellist.html',
              controller: 'ChannelListCtrl',
            },
            {
              urlName: 'channel',
              name: 'channel',
              templateUrl: 'views/livePlayback/channel.html',
              controller: 'ChannelCtrl'
            },
            {
              urlName: 'playbackChannel',
              name: 'playbackChannel',
              templateUrl: 'views/livePlayback/channel.playback.html',
              controller: 'PlaybackChannelCtrl'
            },
            {
              urlName: 'channelA',
              name: 'channelA',
              templateUrl: 'views/livePlayback/channel.all.html',
              controller: 'ChannelCtrlAll',
            },
            {
              urlName: 'setup',
              name: 'setup',
              templateUrl: 'views/setup/b2bMobileSetup.html',
              controller: 'SetupCtrl',
            },
            {
              urlName: 'mainRegistration',
              name: 'mainRegistrationPage',
              templateUrl: 'views/device_registration/mainRegistration.html',
              controller: 'mainRegistrationCtrl',
            },
            {
              urlName: 'addDevice',
              name: 'addDevice',
              templateUrl: 'views/device_registration/addDevice.html',
              controller: 'AddDeviceCtrl',
            },
            {
              urlName: 'autoRegistration',
              name: 'autoRegistration',
              templateUrl: 'views/device_registration/autoRegistration.html',
              controller: 'autoRegistrationCtrl',
            },
            {
              urlName: 'event',
              name: 'event',
              templateUrl: 'views/event/event.html',
              controller: 'eventCtrl',
              childs: [
                {
                  urlName: 'list',
                  name: 'eventList',
                  templateUrl: 'views/event/event_list.html',
                  controller: 'EventListCtrl'
                },
                {
                  urlName: 'spread',
                  name: 'eventSpreadDays',
                  templateUrl: 'views/event/event_spread.html',
                  controller: 'EventSpreadCtrl'
                },
                {
                  urlName: 'play',
                  name: 'eventPlay',
                  templateUrl: 'views/event/event_play.html',
                  controller: 'EventPlayCtrl'
                }
              ]
            },
            {
              urlName: 'bookmark',
              name: 'bookmark',
              templateUrl: 'views/bookmark/bookmark.html',
              controller: 'BookmarkCtrl',
              childs: [
                {
                  urlName: 'list',
                  name: 'bookmarkList',
                  templateUrl: 'views/bookmark/bookmark_list.html',
                  controller: 'BookmarkListCtrl'
                },
                // {
                //   urlName: 'spread',
                //   name: 'bookmarkSpread',
                //   templateUrl: 'views/bookmark/bookmark_spread.html',
                //   controller: 'BookmarkSpreadCtrl',
                // },
                {
                  urlName: 'play',
                  name: 'bookmarkPlay',
                  templateUrl: 'views/bookmark/bookmark_play.html',
                  controller: 'BookmarkPlayCtrl',
                }
              ]
            },
          ],
        },
        {
            urlName: 'setup',
            templateUrl: 'views/setup/common/layout.html',
            name: 'lang_top_setup',
            iconClass: "fa fa-cog",
            abstract: true,
            childs: [
                {
                    urlName: 'basic',
                    name: 'Basic',
                    iconClass: "tui tui-wn5-basic",
                    childs: [
                        {
                            urlName: 'videoProfile',
                            name: 'lang_menu_videoprofile',
                            templateUrl: 'views/setup/basic/profile.html',
                            controller: 'profileCtrl'
                        },
                        // {
                        //     urlName: 'record',
                        //     name: 'lang_menu_record',
                        //     templateUrl: 'views/setup/basic/record.html',
                        //     controller: 'recordCtrl'
                        // },
                        {
                            urlName: 'user',
                            name: 'lang_menu_user',
                            templateUrl: 'views/setup/basic/user.html',
                            controller: 'userCtrl'
                        },
                        {
                            urlName: 'dateTime',
                            name: 'lang_menu_datetime',
                            templateUrl: 'views/setup/basic/datetime.html',
                            controller: 'datetimeCtrl'
                        },
                        {
                            urlName: 'ipPort',
                            name: 'lang_menu_interface',
                            templateUrl: 'views/setup/basic/ipPort.html',
                            controller: 'ipPortCtrl'
                        }
                    ]
                },
                {
                    urlName: 'ptzSetup',
                    name: 'PTZ',
                    iconClass: "tui tui-wn5-toolbar-ptz",
                    childs: [
                        {
                            urlName: 'preset',
                            name: 'lang_presetSetup',
                            templateUrl: 'views/setup/ptz/preset.html',
                            controller: 'presetCtrl'
                        },
                        {
                            urlName: 'presetZoom',
                            name: 'lang_presetSetup',
                            templateUrl: 'views/setup/ptz/presetZoom.html',
                            controller: 'presetZoomCtrl'
                        },
                        {
                            urlName: 'ptzInfoSetup',
                            name: 'lang_menu_ptz',
                            templateUrl: 'views/setup/ptz/ptzInfoSetup.html',
                            controller: 'ptzInfoSetupCtrl'
                        },
                        {
                            urlName: 'sequence',
                            name: 'lang_menu_ptzsequence',
                            templateUrl: 'views/setup/ptz/sequence.html',
                            controller: 'sequenceCtrl'
                        },
                        {
                            urlName: 'ptLimit',
                            name: 'lang_menu_ptzlimit',
                            templateUrl: 'views/setup/ptz/ptLimit.html',
                            controller: 'ptLimitCtrl'
                        },
                        {
                            urlName: 'autoTrack',
                            name: 'lang_menu_ptztrackingsetup',
                            templateUrl: 'views/setup/ptz/autoTrack.html',
                            controller: 'autoTrackCtrl'
                        },
                        {
                            urlName: 'rs485',
                            name: 'RS-485',
                            templateUrl: 'views/setup/ptz/externalPTZ.html',
                            controller: 'externalPTZCtrl'
                        },
                        {
                            urlName: 'rs485422',
                            name: 'lang_menu_rs485',
                            templateUrl: 'views/setup/ptz/externalPTZ.html',
                            controller: 'externalPTZCtrl'
                        },
                        {
                            urlName: 'externalPtzSetup',
                            name: 'lang_external_PTZ',
                            templateUrl: 'views/setup/ptz/externalPTZ.html',
                            controller: 'externalPTZCtrl'
                        },
                        {
                            urlName: 'dptzSetup',
                            name: 'lang_digital_PTZ',
                            templateUrl: 'views/setup/ptz/dptzSetup.html',
                            controller: 'dptzSetupCtrl'
                        },
                        {
                            urlName: 'ptrzSetup',
                            name: 'PTRZ Setup',
                            templateUrl: 'views/setup/ptz/ptrzSetup.html',
                            controller: 'ptrzSetupCtrl'
                        }
                    ]
                 },
                 {
                    urlName: 'videoAudio',
                    name: 'lang_left_va',
                    iconClass: "tui tui-wn5-toolbar-setup",
                    childs: [
                        {
                         urlName: 'videoSetup',
                         name: 'lang_menu_videosrc',
                         templateUrl: 'views/setup/video&audio/video.html',
                         controller: 'videoCtrl'
                         },
                         /** It is not used as now, can be uesed later  */
                         /*{
                           urlName: 'dewarpSetup',
                           name: "lang_menu_viewssetup",
                           templateUrl: 'views/setup/video&audio/dewarpSetup.html',
                           controller: 'dewarpSetupCtrl'
                         },*/
                        {
                            urlName: 'audioSetup',
                            name: 'lang_menu_audiosrc',
                            templateUrl: 'views/setup/video&audio/audio.html',
                            controller: 'audioCtrl'
                        },
                         {
                            urlName: 'cameraSetup',
                            name: 'lang_menu_camera',
                            templateUrl: 'views/setup/video&audio/cameraSetup.html',
                            controller: 'cameraSetupCtrl'
                         },
                         {
                            urlName: 'smartCodec',
                            name: 'lang_menu_smartcodec',
                            templateUrl: 'views/setup/video&audio/smartCodec.html',
                            controller: 'smartCodecCtrl'
                         },
                         {
                            urlName: 'simpleFocus',
                            name: 'lang_menu_focus',
                            templateUrl: 'views/setup/video&audio/simpleFocus.html',
                            controller: 'simpleFocusCtrl'
                        },
                        {
                         urlName: 'wiseStream',
                         name: "lang_wisestreamWisestream",
                         templateUrl: 'views/setup/video&audio/wisestream.html',
                         controller: 'wiseStreamCtrl'
                        },
                        {
                          urlName: 'imageAlign',
                          name: 'Image Alignment',
                          templateUrl: 'views/setup/video&audio/imageAlign.html',
                          controller: 'imageAlignCtrl'
                        }
                    ]
                },
                {
                    urlName: 'network',
                    name: 'lang_left_network',
                    iconClass: "tui tui-wn5-network",
                    childs: [
                        {
                            urlName: 'ddns',
                            name: 'lang_menu_ddns',
                            templateUrl: 'views/setup/network/ddns.html',
                            controller: 'ddnsCtrl'
                        },
                        {
                         urlName: 'ipFiltering',
                         name : 'lang_menu_ipfilter',
                         templateUrl: 'views/setup/network/ipfiltering.html',
                         controller: 'ipfilteringCtrl'
                         },
                         {
                         urlName: 'ssl',
                         name : 'lang_https_str',
                         templateUrl: 'views/setup/network/ssl.html',
                         controller: 'sslCtrl'
                         },
                         {
                         urlName: 'x802',
                         name : 'lang_menu_8021x',
                         templateUrl: 'views/setup/network/8021x.html',
                         controller: '8021xCtrl'
                         },
                         {
                         urlName: 'qos',
                         name : 'lang_menu_qos',
                         templateUrl: 'views/setup/network/qos.html',
                         controller: 'qosCtrl'
                         },
                        {
                            urlName: 'snmp',
                            name: 'lang_menu_snmp',
                            templateUrl: 'views/setup/network/snmp.html',
                            controller: 'snmpCtrl'
                        },
                        {
                            urlName: 'autoIpConfigure',
                            name: 'lang_menu_autoipconfig',
                            templateUrl: 'views/setup/network/autoIpConfigure.html',
                            controller: 'autoIpConfigureCtrl'
                        }
                    ]
                },
                {
                    urlName: 'event',
                    name: 'lang_left_event',
                    iconClass: "tui tui-wn5-alarm",
                    childs: [
                        {
                            urlName: 'eventSetup',
                            name: 'lang_menu_eventsetup',
                            templateUrl: 'views/setup/event/eventSetup.html',
                            controller: 'eventSetupCtrl'
                        },
                        {
                            urlName: 'ftpemail',
                            name: 'lang_menu_ftpemail',
                            templateUrl: 'views/setup/event/ftpemail.html',
                            controller: 'ftpemailCtrl'
                        },
                        {
                            urlName: 'storage',
                            name: 'lang_menu_storage',
                            templateUrl: 'views/setup/event/storage.html',
                            controller: 'storageCtrl'
                        },
                        {
                            urlName: 'alarmoutput',
                            name: 'lang_alarmOutput',
                            templateUrl: 'views/setup/event/alarmoutput.html',
                            controller: 'alarmoutputCtrl'
                        },
                        {
                            urlName: 'alarminput',
                            name: 'lang_menu_alarminput',
                            templateUrl: 'views/setup/event/alarminput.html',
                            controller: 'alarminputCtrl'
                        },
                        {
                            urlName: 'timeSchedule',
                            name: 'lang_menu_timeschedule',
                            templateUrl: 'views/setup/event/timeSchedule.html',
                            controller: 'timeScheduleCtrl'
                        },
                        {
                            urlName: 'nwDisconnection',
                            name: 'lang_menu_networkdisconnect',
                            templateUrl: 'views/setup/event/nwDisconnection.html',
                            controller: 'nwDisconnectionCtrl'
                        },
                        {
                            urlName: 'appEvent',
                            name: 'lang_menu_appevent',
                            templateUrl: 'views/setup/event/appEvent.html',
                            controller: 'appEventCtrl'
                        }
                    ]
                },
                {
                    urlName: 'analytics',
                    name: 'lang_analytics', 
                    iconClass: "tui tui-wn5-iva",
                    childs: [
                        {
                            urlName: 'motionDetection/v2',
                            name: 'lang_menu_motiondetection',
                            templateUrl: 'views/setup/analytics/motionDetection.html',
                            controller: 'motionDetectionCtrl'
                        },
                        {
                            urlName: 'tamperDetection',
                            name: 'lang_menu_tamperingdetection',
                            templateUrl: 'views/setup/analytics/tamperDetection.html',
                            controller: 'tamperDetectionCtrl'
                        },
                        {
                            urlName: 'defocusDetection',
                            name: 'lang_defocus_detection',
                            templateUrl: 'views/setup/analytics/defocusDetection.html',
                            controller: 'defocusDetectionCtrl'
                        },
                        {
                            urlName: 'fogDetection',
                            name: 'lang_menu_fogdetection',
                            templateUrl: 'views/setup/analytics/fogDetection.html',
                            controller: 'fogDetectionCtrl'
                        },                        
                        {
                            urlName: 'faceDetection',
                            name: 'lang_menu_facedetection',
                            templateUrl: 'views/setup/analytics/faceDetection.html',
                            controller: 'faceDetectionCtrl'
                        },
                        {
                            urlName: 'iva',
                            name: 'lang_menu_iva',
                            templateUrl: 'views/setup/analytics/iva.html',
                            controller: 'ivaCtrl'
                        },
                        {
                            urlName: 'autoTrackEvent',
                            name: 'lang_autotracking',
                            templateUrl: 'views/setup/analytics/autoTracking.html',
                            controller: 'autoTrackEventCtrl'
                        },
                        {
                            urlName: 'audioDetection',
                            name: 'lang_menu_audiodetection',
                            templateUrl: 'views/setup/analytics/audioDetection.html',
                            controller: 'audioDetectionCtrl'
                        },
                        {
                            urlName: 'soundClassification',
                            name: 'lang_menu_soundclassification',
                            templateUrl: 'views/setup/analytics/soundClassification.html',
                            controller: 'soundClassificationCtrl'
                        },
                    ]
                },
                {
                  urlName: 'statistics',
                  name: 'lang_statistics',
                  iconClass: 'tui tui-statistics',
                  childs: [
                    {
                        urlName: 'peoplecounting',
                        name: 'lang_peoplecounting',
                        iconClass: 'tui tui-peoplecounting',
                        childs: [
                            {
                                urlName: 'search',
                                name: 'lang_search',
                                templateUrl: 'views/setup/peoplecounting/pcStatisticsSetup.html',
                                controller: 'PCStatisticsCtrl'
                            },
                            {
                                urlName: 'setup',
                                name: 'lang_setup',
                                templateUrl: 'views/setup/peoplecounting/pcSetup.html',
                                controller: 'PCSetupCtrl'
                            }
                        ]
                    },
                    {
                        urlName: 'queue',
                        name: 'lang_queue_management',
                        iconClass: 'tui tui-wn5-ptz-near',
                        childs: [
                            {
                                urlName: 'search',
                                name: 'lang_search',
                                templateUrl: 'views/setup/queue/qmStatistics.html',
                                controller: 'QMStatisticsCtrl'
                            },
                            {
                                urlName: 'setup',
                                name: 'lang_setup',
                                templateUrl: 'views/setup/queue/qmSetup.html',
                                controller: 'QMSetupCtrl'
                            }
                        ]
                    },
                    {
                        urlName: 'heatmap',
                        name: 'lang_heatmap',
                        iconClass: 'tui tui-heatmap',
                        childs: [
                            {
                                urlName: 'search',
                                name: 'lang_search',
                                templateUrl: 'views/setup/heatmap/hmStatistics.html',
                                controller: 'HMStatisticsCtrl'
                            },
                            {
                                urlName: 'setup',
                                name: 'lang_setup',
                                templateUrl: 'views/setup/heatmap/hmSetup.html',
                                controller: 'HMSetupCtrl'
                            }
                        ]
                    }
                  ]
                },
                {
                    urlName: 'system',
                    name: 'lang_left_system',
                    iconClass: "tui tui-wn5-system",
                    childs: [
                        {
                            urlName: 'productinfo',
                            name: 'lang_menu_proinfo',
                            templateUrl: 'views/setup/system/productinfo.html',
                            controller: 'productinfo'
                        },
                        {
                            urlName: 'upgradeReboot',
                            name: 'lang_menu_upgrade',
                            templateUrl: 'views/setup/system/upgradeReboot.html',
                            controller: 'upgradeRebootCtrl'
                        },
                        {
                            urlName: 'systemlog',
                            name: 'lang_menu_log',
                            templateUrl: 'views/setup/system/log.html',
                            controller: 'logCtrl'
                        },
                        {
                            urlName: 'taskmanager',
                            name: 'lang_taskmanager',
                            templateUrl: 'views/setup/system/taskmanager.html',
                            controller: 'opensdkCtrl'
                        },
                    ]
                },
                {
                    urlName: 'openplatform',
                    name: 'lang_left_openplatform',
                    iconClass: 'tui tui-wn5-open-platform',
                    childs: [
                        {
                         urlName: 'opensdk',
                         name: 'lang_left_openplatform',  
                         templateUrl: 'views/setup/openplatform/opensdk.html',
                         controller: 'opensdkCtrl'
                        },
                    ]
                }
            ]
        }
    ]
});