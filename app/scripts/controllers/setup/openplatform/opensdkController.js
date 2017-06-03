/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('opensdkCtrl', function($scope, SunapiClient, Attributes, COMMONUtils, $translate, $timeout, $document, $window, $rootScope, $location, $q, $uibModal) {
  "use strict";

  var mAttr = Attributes.get();
  COMMONUtils.getResponsiveObjects($scope);

  var pageData = {};
  var mStopAppStatus = false;
  $scope.appOrder = {
    property: 'No',
    name: 'No',
    type: ''
  };

  function ShowModalDialog(callback, displaymsg, AppID, installType) {
    var modalInstance = $uibModal.open({
      templateUrl: 'detailInfoMessage.html',
      controller: 'detailMessageCtrl',
      resolve: {
        Message: function() {
          return displaymsg;
        },
        Header: function() {
          return 'lang_info';
        }
      }
    });

    modalInstance.result.then(function() {

      switch (callback) {
        case "OpenSDKAppUninstallConfirm":
          OpenSDKAppUninstallConfirm(AppID);
          break;
        case "OpenSDKInstallConfirmMsg":
          OpenSDKInstallConfirmMsg(AppID, true, installType);
          break;
      }
      //on ok button press
    }, function() {
      //on cancel button press
      if (callback === 'OpenSDKInstallConfirmMsg') {
        OpenSDKInstallConfirmMsg(AppID, false);
      }
    });
  }

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };

  function getAttributes() {
    if (mAttr.OpenSDKPriorityOptions !== undefined) {
      $scope.OpenSDKPriorityOptions = mAttr.OpenSDKPriorityOptions;
    }
  }

  $scope.openSDKOrder = function(sortName) {
    if ($scope.appOrder.name == sortName) {
      if ($scope.appOrder.type == '-') {
        $scope.appOrder.type = '';
        $scope.appOrder.property = $scope.appOrder.name;
      } else {
        $scope.appOrder.type = '-';
        $scope.appOrder.property = $scope.appOrder.type + $scope.appOrder.name;
      }
    } else {
      $scope.appOrder.name = sortName;
      $scope.appOrder.type = '';
      $scope.appOrder.property = $scope.appOrder.name;
    }
  };
  $scope.openSDKOrderClass = function(sortName, type) {
    if ($scope.appOrder.name == sortName) {
      if ($scope.appOrder.type == type) {
        return 'order-i active';
      } else {
        return 'order-i';
      }
    } else {
      return 'order-i';
    }
  };

  function opensdkView() {
    $scope.CertificateFile = '';
    var getData = {};
    return SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=apps&action=view', getData,
        function(response) {
          $scope.OpenSDK = response.data;
        },
        function(errorData) {
          //alert(errorData);
          return;
        }, '', true)
      .finally(function() {
        var index;
        if ($scope.OpenSDK.Apps !== undefined) {
          for (index = 0; index < $scope.OpenSDK.Apps.length; index = index + 1) {
            $scope.OpenSDK.Apps[index].InstalledDate = convertOpenSDKAppTime($scope.OpenSDK.Apps[index].InstalledDate);
            $scope.OpenSDK.Apps[index].No = index + 1;
            if ($scope.OpenSDK.Apps[index].Priority === 'High') {
              $scope.OpenSDK.Apps[index].PriorityOrder = 1;
            } else if ($scope.OpenSDK.Apps[index].Priority === 'Medium') {
              $scope.OpenSDK.Apps[index].PriorityOrder = 2;
            } else {
              $scope.OpenSDK.Apps[index].PriorityOrder = 3;
            }
          }
        }

        pageData.OpenSDK = angular.copy($scope.OpenSDK);
      });
  }

  function convertOpenSDKAppTime(appInstallDate) {

    var a = new Date(appInstallDate);

    // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    date = (date < 10) ? "0" + date : date;
    var hours = a.getHours();
    var min = a.getMinutes();
    min = (min < 10) ? "0" + min : min;
    var sec = a.getSeconds();
    sec = (sec < 10) ? "0" + sec : sec;
    // If hour is 0, set it to 24
    //hours = hours || 24;
    hours = (hours < 10) ? "0" + hours : hours;
    // var time = date+','+month+' '+year+' '+hours+':'+min+':'+sec ;
    //Thu Sep 19 03:25:11 2013
    // var time = dayNames[a.getDay()]+" "+month+" "+ date+" "+hours + ':' + min + ':' + sec +" " +a.getFullYear();
    var time = year + "-" + month + "-" + date + " T " + hours + ":" + min + ":" + sec;

    return time;
  }

  function deviceinfoView() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', getData,
      function(response) {
        $scope.DeviceInfo = response.data;
      },
      function(errorData) {
        //alert(errorData);
      }, '', true);
  }

  function view() {
    $q.seqAll([
      getAttributes,
      opensdkView,
      deviceinfoView,
      OpenSDKAppHealth
    ]).then(function() {
      $scope.pageLoaded = true;
      $("#taskmanager2").show();
      $("#taskmanager1").show();
      $('#contents').append("<div style='' class='loadingTableCover'><img src='base/images/cgi_loading.gif' ></div>");
    }, function(errorData) {
      //alert(errorData);
    });
  }

  $scope.OnOpenSDKTaskManager = function() {
    var curlUrlPath = $(location).attr('href');
    var opensdkTaskUrl = curlUrlPath.replace("openplatform_opensdk", "system_taskmanager");
    $window.open(opensdkTaskUrl, "", "scrollbars=1,width=1024,height=400");
  };

  $scope.OnOpenSDKAppApply = function(AppID) {
    var setData = {};

    var index = 0;
    for (var i = 0; i < $scope.OpenSDK.Apps.length; i++) {
      if ($scope.OpenSDK.Apps[i].AppID == AppID) {
        index = i;
        break;
      }
    }

    if (($scope.OpenSDK.Apps[index].Priority !== pageData.OpenSDK.Apps[index].Priority) || ($scope.OpenSDK.Apps[index].AutoStart !== pageData.OpenSDK.Apps[index].AutoStart)) {
      setData.Priority = pageData.OpenSDK.Apps[index].Priority = $scope.OpenSDK.Apps[index].Priority;
      setData.AutoStart = pageData.OpenSDK.Apps[index].AutoStart = $scope.OpenSDK.Apps[index].AutoStart;
      var appIDEncode = encodeURIComponent($scope.OpenSDK.Apps[index].AppID);
      setData.AppID = appIDEncode;

      SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=apps&action=set', setData,
        function(response) {
          COMMONUtils.ShowDeatilInfo('lang_msg_settings_saved');
          if ($scope.OpenSDK.Apps !== undefined) {
            for (index = 0; index < $scope.OpenSDK.Apps.length; index = index + 1) {
              if ($scope.OpenSDK.Apps[index].Priority === 'High') {
                $scope.OpenSDK.Apps[index].PriorityOrder = 1;
              } else if ($scope.OpenSDK.Apps[index].Priority === 'Medium') {
                $scope.OpenSDK.Apps[index].PriorityOrder = 2;
              } else {
                $scope.OpenSDK.Apps[index].PriorityOrder = 3;
              }
            }
          }
        },
        function(errorData) {
          //COMMONUtils.ShowError(errorData);
        }, '', true);
    }

  };

  $scope.IsOpenSDKAppRunning = function(Status) {
    if (Status === 'Running') {
      return true;
    } else {
      return false;
    }
  };

  function OpenSDKAppHealth() {
    var idx = 0;
    var changedUrl = $location.absUrl();
    var taskManager = false;

    if (changedUrl.indexOf('system_taskmanager') !== -1) {
      taskManager = true;
    }

    return SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=appstatus&action=view', '',
        function(response) {
          $scope.OpenSDKAppHealth = response.data;

          if ($scope.OpenSDKAppHealth.Apps !== undefined) {
            for (idx = 0; idx < $scope.OpenSDKAppHealth.Apps.length; idx = idx + 1) {
              var durmsg = convertDuration($scope.OpenSDKAppHealth.Apps[idx].Duration);
              $scope.OpenSDKAppHealth.Apps[idx].Duration = durmsg;
            }
          }
        },
        function(errorData) {
          // COMMONUtils.ShowError(errorData);
        }, '', true)
      .finally(function() {
        if ((mStopAppStatus === false) && (taskManager === true)) {
          $timeout(OpenSDKAppHealth, 5000);
        }
      });
  }

  $scope.OnOpenSDKAppHealth = function(AppID) {
    var getData = {};
    var healthmsg = "";
    var idx = 0;

    SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=appstatus&action=view', getData,
      function(response) {
        $scope.OpenSDKAppHealth = response.data;

        for (idx = 0; idx < $scope.OpenSDKAppHealth.Apps.length; idx++) {
          if ($scope.OpenSDKAppHealth.Apps[idx].AppID === AppID) {

            healthmsg += $translate.instant('lang_health2') + '<br>';
            healthmsg += $translate.instant('lang_appName') + " : " + $scope.OpenSDKAppHealth.Apps[idx].AppID + "<br>";
            healthmsg += $translate.instant('lang_cpuUsage') + " : " + $scope.OpenSDKAppHealth.Apps[idx].CPUUsage + " %" + "<br>";
            healthmsg += $translate.instant('lang_memoryUsage') + " : " + $scope.OpenSDKAppHealth.Apps[idx].MemoryUsage + " %" + "<br>";
            healthmsg += $translate.instant('lang_threadCount') + " : " + $scope.OpenSDKAppHealth.Apps[idx].ThreadsCount + "<br>";
            var durmsg = convertDuration($scope.OpenSDKAppHealth.Apps[idx].Duration);
            $scope.OpenSDKAppHealth.Apps[idx].Duration = durmsg;
            healthmsg += $translate.instant('lang_duration') + " : " + $scope.OpenSDKAppHealth.Apps[idx].Duration + "<br>";

            COMMONUtils.ShowDeatilInfo(healthmsg);
            break;
          }
        }


      },
      function(errorData) {
        //COMMONUtils.ShowError(errorData);
      }, '', true);

  };

  function OnOpenSDKAppStartResponse() {
    $(".loadingTableCover").hide();
    opensdkView();
  }

  function OnOpenSDKAppStopResponse() {
    $(".loadingTableCover").hide();
    opensdkView();
  }

  $scope.OnOpenSDKAppStart = function(AppId) {
    $(".loadingTableCover").show();
    var setData = {};
    var appIDEncode = encodeURIComponent(AppId);
    setData.AppID = appIDEncode;
    setData.Mode = 'Start';


    SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=apps&action=control', setData,
      function(response) {
        $timeout(OnOpenSDKAppStartResponse, 1000);
      },
      function(errorData) {
        $(".loadingTableCover").hide();
        //COMMONUtils.ShowError(errorData);
      }, '', true);

  };

  $scope.OnOpenSDKAppStop = function(AppId) {
    $(".loadingTableCover").show();

    var setData = {};
    var appIDEncode = encodeURIComponent(AppId);
    setData.AppID = appIDEncode;
    setData.Mode = 'Stop';

    SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=apps&action=control', setData,
      function(response) {
        $timeout(OnOpenSDKAppStopResponse, 1000);
      },
      function(errorData) {
        $(".loadingTableCover").hide();
        //COMMONUtils.ShowError(errorData);
      }, '', true);

  };

  function OpenSDKAppUninstallConfirm(AppID) {
    $(".loadingTableCover").show();

    var setData = {};
    var appIDEncode = encodeURIComponent(AppID);
    setData.AppID = appIDEncode;

    SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=apps&action=remove', setData,
      function(response) {

        COMMONUtils.ShowDeatilInfo('lang_msg_uninstall_success');
        $(".loadingTableCover").hide();
        opensdkView();
      },
      function(errorData) {
        $(".loadingTableCover").hide();
        // COMMONUtils.ShowError(errorData);
      }, '', true);
  }

  $scope.OnOpenSDKAppUninstall = function(AppID) {

    var conf_message = $translate.instant('lang_msg_ok');

    ShowModalDialog("OpenSDKAppUninstallConfirm", conf_message, AppID);
  };


  $scope.setOpenSDKFile = function(element) {
    $scope.$apply(function($scope) {
      $scope.CertificateFile = element.files[0].name;
      $scope.cerfilesize = element.files[0].size;
      $scope.cerfile = element.files[0];
    });
  };

  $scope.OnOpenSDKGoApp = function(AppID) {
    var setData = {};
    var targetSDK = '';
    var msg = '';
    var appIDEncode = encodeURIComponent(AppID);
    setData.AppID = appIDEncode;

    SunapiClient.get('/stw-cgi/opensdk.cgi?msubmenu=manifest&action=view', setData,
        function(response) {

          var mainfest = response.data;

          var xmlData = $($.parseXML(mainfest));

          var parameters = xmlData.find('manifest');
          parameters.each(function() {
            var currParameter = $(this);

            var paramName = currParameter.find('targetSDK');

            paramName.each(function() {
              var currParameter = $(this);
              targetSDK = currParameter[0].innerHTML;
            });

          });

        },
        function(errorData) {
          //COMMONUtils.ShowError(errorData);
          return;
        }, '', true)
      .finally(function() {
        if (targetSDK !== '') {
          msg = "../home/setup/opensdk/html/" + AppID + "/index.html?AppName=" + AppID;
        } else {
          msg = "../home/setup/opensdk/html/" + AppID + "/index.cgi?AppName=" + AppID;
        }

        window.open(msg);
      });
  }

  function deleteAllCookies() {

    // This function will attempt to remove a cookie from all paths.
    var pathBits = location.pathname.split('/');
    var pathCurrent = ' path=';

    // do a simple pathless delete first.
    document.cookie = 'AppInstallSessionID=; Expires=Thu, 01-Jan-1970 00:00:01 GMT; Path=/stw-cgi;';

    for (var i = 0; i < pathBits.length; i++) {
      pathCurrent += ((pathCurrent.substr(-1) !== '/') ? '/' : '') + pathBits[i];
      document.cookie = 'AppInstallSessionID=; expires=Thu, 01-Jan-1970 00:00:01 GMT;' + pathCurrent + ';';
    }
  }

  function OpenSDKInstallConfirmMsg(ApplicationSessionId, isOk, installType) {
    var opensdkfileelm = document.getElementById("opensdkfileupload");
    var successFunc = function() {
      var setData = {};
      var AppName = $scope.CertificateFile.split('.');
      var appIDEncode = encodeURIComponent(AppName[0]);

      if (installType !== "New") {
        setData.KeepOldSettings = "True";
      }
      setData.AppID = appIDEncode;
      setData.ApplicationSessionId = ApplicationSessionId;
      SunapiClient.post('/stw-cgi/opensdk.cgi?msubmenu=apps&action=install&IgnoreCookie=True', setData,
        function(response) {
          document.getElementById('f1_upload_process').style.display = 'none';

          COMMONUtils.ShowDeatilInfo('lang_msg_install_success');
          opensdkfileelm.value = "";

          $timeout(opensdkView, 500);
        },
        function(errorData, errorCode) {
          document.getElementById('f1_upload_process').style.display = 'none';
          if (errorCode === 607 || errorCode === 604) {
            var msg = $translate.instant('lang_msg_error_upload') + " : " + $translate.instant('lang_sameVersionInstalled');
            COMMONUtils.ShowError(msg);
          }
          opensdkfileelm.value = "";
        }
      );
    };
    var cancelFunc = function() {
      document.getElementById('f1_upload_process').style.display = 'none';
      COMMONUtils.ShowDeatilInfo('lang_msg_install_cancel');
      opensdkfileelm.value = "";
    };

    if (isOk === true) {
      if (installType !== "New") {
        var modalInstance = $uibModal.open({
          templateUrl: 'detailInfoMessage.html',
          controller: 'detailMessageCtrl',
          resolve: {
            Message: function() {
              return ($translate.instant('lang_msg_settings') + "\r\n" + $translate.instant('lang_msg_press_ok'));
            },
            Header: function() {
              return 'lang_info';
            }
          }
        });

        modalInstance.result.then(
          function() {
            successFunc();
          },
          function() {
            cancelFunc();
          }
        );
      } else {
        successFunc();
      }
    } else {
      cancelFunc();
    }
  }

  $scope.OnOpenSDKInstall = function() {

    if (mAttr.OpenSDKMaxApps !== undefined && $scope.OpenSDK.InstalledApps == mAttr.OpenSDKMaxApps) {
      COMMONUtils.ShowInfo('lang_installed_max_app');
      return;
    }

    document.getElementById("f1_upload_process").innerHTML = '<p>' + $translate.instant('lang_msg_uploadProgress') + '<br/><img src="base/images/loader.gif" /><br/></p>';
    document.getElementById('f1_upload_process').style.display = 'block';
    var opensdkfileelm = document.getElementById("opensdkfileupload");
    if ($scope.CertificateFile === "") {
      COMMONUtils.ShowError('lang_msg_install_file_correct_check');
      document.getElementById('f1_upload_process').style.display = 'none';
      return;
    }

    var confirm_result;

    var permissionsMsg = "";

    var setData = {},
      postData;
    var file = $scope.cerfile;

    var AppName = $scope.CertificateFile.split('.');
    var appIDEncode = encodeURIComponent(AppName[0]);
    setData.AppID = appIDEncode;

    var epochTicks = 621355968000000000;
    var ticksPerMillisecond = 10000;
    var yourTicks = epochTicks + ((new Date).getTime() * ticksPerMillisecond);

    var boundary = '----------------------------' + yourTicks;
    var header = "--" + boundary + "\r\n";
    var footer = "\r\n--" + boundary + "--\r\n";

    var specialHeaders = [];

    specialHeaders[0] = {};
    specialHeaders[0].Type = 'Content-Type';
    specialHeaders[0].Header = "multipart/form-data; boundary=" + boundary;

    var contents = header + "Content-Disposition: form-data; name=\"UploadedFile\"; filename=\"" + file.name + "\"\r\n";
    contents += "Content-Type: application/octet-stream\r\n\r\n";

    var fileToPost = new Blob([contents, file.slice(0, file.size), footer]);


    SunapiClient.post('/stw-cgi/opensdk.cgi?msubmenu=apps&action=install&IgnoreCookie=True', setData,
      function(response) {
        if (response.data.Permission[0] === 'None') {
          permissionsMsg = $translate.instant('lang_msg_permission2');
          ShowModalDialog("OpenSDKInstallConfirmMsg", permissionsMsg, response.data.ApplicationSessionId, response.data.InstallType);
        } else {
          if (response.data.Permission !== 'undefined') {
            //console.log("App Premisssion", response.data.Permission);
            var func = new Array;
            for (var idx = 0; idx < response.data.Permission.length; idx = idx + 1) {
              // permissionsMsg += (response.data.Permission[idx] + "<br>");
              func.push(response.data.Permission[idx]);
            }
            func.join(', ');

            // lang_msg_install_application_activation    
            permissionsMsg = $translate.instant('lang_msg_install_application_activation').replace('%1', func) + "<br>"
          }

          // %1 use case
          // msg = $translate.instant('lang_msg_privacy_Zoom_variable_magnification').replace('%1', mAttr.MaxZoom.maxValue);
          permissionsMsg += $translate.instant('lang_msg_permission2');
          ShowModalDialog("OpenSDKInstallConfirmMsg", permissionsMsg, response.data.ApplicationSessionId, response.data.InstallType);
        }
      },
      function(errorData, errorCode, openSDKError) {
        document.getElementById('f1_upload_process').style.display = 'none';
        var errorMsg;
        switch (openSDKError) {
          case 66:
            errorMsg = 'lang_tempUnavailable';
            break;
          case 100:
            errorMsg = 'lang_appAlreadyRunning';
            break;
          case 101:
            errorMsg = 'lang_appStartFailed';
            break;
          case 102:
            errorMsg = 'lang_appStopFailed';
            break;
          case 103:
            errorMsg = 'lang_appUploadFailed';
            break;
          case 104:
            errorMsg = 'lang_notEnoughSpace';
            break;
          case 105:
            errorMsg = 'lang_invalidAppPackage';
            break;
          case 106:
            errorMsg = 'lang_sameVersionInstalled';
            break;
          case 107:
            errorMsg = 'lang_installationFailed';
            break;
          case 108:
            errorMsg = 'APP UNINSTALL FAIL';
            break;
          case 109:
            errorMsg = 'lang_appNotFound';
            break;
          case 110:
            errorMsg = 'lang_appRecordRunning';
            break;
          case 111:
            errorMsg = 'lang_appNotRunning';
            break;
          case 112:
            errorMsg = 'lang_debugViewerRunning';
            break;
          case 113:
            errorMsg = 'lang_invalidCameraPlatform';
            break;
          case 114:
            errorMsg = 'lang_cameraPlatformMismatch';
            break;
          case 115:
            errorMsg = 'lang_systemRecoverDBError';
            break;
          case 116:
            errorMsg = 'lang_parallelinstallInProgress';
            break;
          case 117:
            errorMsg = 'lang_CPULimitReached';
            break;
          case 118:
            errorMsg = 'lang_memoryLimitReached';
            break;
          case 119:
            errorMsg = 'lang_SDKVersionNotSupported';
            break;
          default:
            errorMsg = 'lang_installationFailed';
            break;
        }
        var msg = $translate.instant('lang_msg_error_upload') + " : " + $translate.instant(errorMsg);
        COMMONUtils.ShowError(msg);
        opensdkfileelm.value = "";
      }, $scope, fileToPost, specialHeaders);

  };

  function convertDuration(t) {
    //dividing period from time
    var x = t.split('T'),
      duration = '',
      time = {},
      period = {},
      //just shortcuts
      s = 'string',
      v = 'variables',
      l = 'letters',
      // store the information about ISO8601 duration format and the divided strings
      d = {
        period: {
          string: x[0].substring(1, x[0].length),
          len: 3,
          // years, months, days
          letters: ['Y', 'M', 'D'],
          variables: {}
        },
        time: {
          string: x[1],
          len: 3,
          // hours, minutes, seconds
          letters: ['H', 'M', 'S'],
          variables: {}
        }
      };
    //in case the duration is a multiple of one day
    if (!d.time.string) {
      d.time.string = '';
    }

    for (var i in d) {
      $rootScope
      var len = d[i].len;
      for (var j = 0; j < len; j++) {
        d[i][s] = d[i][s].split(d[i][l][j]);
        if (d[i][s].length > 1) {
          d[i][v][d[i][l][j]] = parseInt(d[i][s][0], 10);
          d[i][s] = d[i][s][1];
        } else {
          d[i][v][d[i][l][j]] = 0;
          d[i][s] = d[i][s][0];
        }
      }
    }
    period = d.period.variables;
    time = d.time.variables;
    var returnmsg = period.D + " " + $translate.instant('lang_day') + " " + time.H + " " + $translate.instant('lang_hour') + " " + time.M + " " + $translate.instant('lang_lower_minute') + " " + time.S + " " + $translate.instant('lang_sec');
    return returnmsg;
  }

  $rootScope.$watch(function $locationWatch() {
    var changedUrl = $location.absUrl();

    if (changedUrl.indexOf('system_taskmanager') === -1) {
      mStopAppStatus = true;
    }
  });

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      view();
    }
  })();

  $scope.view = view;
});