kindFramework.directive(
  'pcSetupReport',
  function(
    PcSetupReportModel,
    pcModalService,
    pcSetupService,
    $q) {
    "use strict";
    return {
      restrict: 'E',
      replace: true,
      scope: false,
      transclude: false,
      templateUrl: 'views/setup/peoplecounting/directives/pcSetupReport.html',
      link: function(scope, element, attrs) {
        var pcSetupReportModel = new PcSetupReportModel();

        var lang = pcSetupReportModel.getLang();

        var $parentScope = attrs.pageType === "hm" ? scope : scope.$parent;
        var MINUTE_SLICE_NUMBER = -2;
        // var $parentScope = scope.$parent;

        $parentScope.pcSetupReport = {
          lang: lang.report,
          use: false,
          schedule: {
            periodList: lang.report.periodList,
            dateList: lang.report.dateList,
            hoursList: [],
            minuteList: [],
            period: '',
            date: '',
            hour: '',
            minute: ''
          },
          fileName: {
            extensionList: lang.report.extensionList.pc,
            name: '',
            regExp: pcSetupService.regExp.getAlphaNum(),
            extension: ''
          },
          init: function() {
            var schedule = $parentScope.pcSetupReport.schedule;
            var HOUR = 24;
            var TWO_LENGHT = 10;
            var UI_MINUTE_SEPARATION = 15;
            var MINUTE_SEPARATION = 3;
            //Set List Data
            for (var i = 0; i < HOUR; i++) {
              schedule.hoursList.push(i < TWO_LENGHT ? '0' + i : i);

              if (i <= MINUTE_SEPARATION) {
                var minute = ('0' + (i * UI_MINUTE_SEPARATION)).slice(MINUTE_SLICE_NUMBER);
                schedule.minuteList.push(minute);
              }
            }

            //Set Default
            schedule.period = Object.keys(schedule.periodList)[0];
            schedule.date = schedule.dateList[0];
            schedule.hour = schedule.hoursList[0];
            schedule.minute = schedule.minuteList[0];

            if ("pageType" in attrs) {
              if (attrs.pageType === "hm") {
                $parentScope.pcSetupReport.fileName.extensionList = ['png'];
              }
            }

            $parentScope.pcSetupReport.fileName.extension = 
              $parentScope.pcSetupReport.fileName.extensionList[0];

            $parentScope.pcSetupReport.getReport();
          },
          setReport: function() {
            var deferred = $q.defer();
            var Enable = null;

            if (attrs.pageType === "hm") {
              Enable = $parentScope.useHeatmap;
            }

            //Report setting -> Scheduler setting
            pcSetupReportModel.setReport(
              attrs.pageType,
              Enable,
              $parentScope.pcSetupReport.use,
              $parentScope.pcSetupReport.fileName.name,
              $parentScope.pcSetupReport.fileName.extension.toUpperCase()
            ).then(
              function() {
                var WeekDay = $parentScope.pcSetupReport.schedule.period === "Weekly" ? 
                  $parentScope.pcSetupReport.schedule.date.toUpperCase() :
                  false;
                pcSetupReportModel.setSchedule(
                  attrs.pageType,
                  $parentScope.pcSetupReport.schedule.period,
                  WeekDay,
                  parseInt($parentScope.pcSetupReport.schedule.hour, 10),
                  parseInt($parentScope.pcSetupReport.schedule.minute, 10)
                ).then(
                  function(successData) {
                    deferred.resolve(successData);
                  },
                  function(failData) {
                    console.log(failData);
                    deferred.resolve(failData);
                  }
                );
              },
              function(failData) {
                console.log(failData);
              }
            );

            return deferred.promise;
          },
          getReport: function() {
            pcSetupReportModel.getReportInfo(attrs.pageType).then(
              function(responseData) {
                if (attrs.pageType === "hm") {
                  $parentScope.useHeatmap = responseData.Enable;
                }
                $parentScope.pcSetupReport.use = responseData.ReportEnable;
                $parentScope.pcSetupReport.fileName.name = responseData.ReportFilename;
                $parentScope.pcSetupReport.fileName.extension = 
                  responseData.ReportFileType.toLowerCase();
              },
              function(errorData) {
                console.log(errorData);
              }
            );

            pcSetupReportModel.getSchedule(attrs.pageType).then(
              function(responseData) {
                $parentScope.pcSetupReport.schedule.period = responseData.ScheduleType;
                $parentScope.pcSetupReport.schedule.date = responseData.WeekDay.toLowerCase();
                $parentScope.pcSetupReport.schedule.hour = 
                  ("0" + responseData.Hour).slice(MINUTE_SLICE_NUMBER);
                $parentScope.pcSetupReport.schedule.minute =
                  ("0" + responseData.Minute).slice(MINUTE_SLICE_NUMBER);
              },
              function(errorData) {
                console.log(errorData);
              }
            );
          },
          validate: function() {
            var returnVal = true;

            try {
              if (
                $parentScope.pcSetupReport.fileName.name.trim() === '' &&
                $parentScope.pcSetupReport.use === true
                ) {
                returnVal = false;

                pcModalService.openAlert({
                  title: lang.report.alert,
                  message: lang.report.message
                });
              }
            } catch (error) {
              console.error(error);
            }

            return returnVal;
          }
        };

        $parentScope.pcSetupReport.init();
      }
    };
  }
);