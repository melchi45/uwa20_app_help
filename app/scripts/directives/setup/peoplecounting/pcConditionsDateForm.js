kindFramework.directive('pcConditionsDateForm', function(PcConditionsDateFormModel, pcModalService, pcSetupService, $timeout){
	"use strict";
	return {
		restrict: 'E',
		replace: true,
		scope: false,
		transclude: false,
		templateUrl: 'views/setup/peoplecounting/directives/pcConditionsDateForm.html',
		link: function(scope, element, attrs){
			var pcConditionsDateFormModel = new PcConditionsDateFormModel();

			var lang = pcConditionsDateFormModel.getLang();

			var cameraLocalTime = {
				data: '',
				set: function(localTime){
					cameraLocalTime.data = localTime;
				},
				getDateObj: function(){
					return new Date(cameraLocalTime.data);
				}
			};

			function defaultDate(type){
				var d = cameraLocalTime.getDateObj();
				if(type === 'from'){
					d.setHours(0);
					d.setMinutes(0);
					d.setSeconds(0);
				}else{
					d.setHours(23);
					d.setMinutes(59);
					d.setSeconds(59);
				}

				return d;
			}

			var locking = false;
			var lockingTimer = null;

			var minDate = '';
			var maxDate = '';
			
			scope.pcConditionsDateForm = {
				dateTitle: lang.date.title,
				firstSelect: null,
				firstSelectOptions: pcConditionsDateFormModel.getMainDateSearchOptions(),
				secondSelect: null, 
				secondSelectOptions: [],
				fromCalender: '',
				toCalender: '',
				showFromCalender: false,
				showToCalender: false,
				fromCalenderInput: '',
				toCalenderInput: '',
				calenderOptions: {
					minDate: '',
			  		maxDate: '',
			  		maxMode: "year",
			  		minMode: "day"
				},
				toggleCalender: function(calenderType){
					if(lockingTimer !== null){
						clearTimeout(lockingTimer);
					}
					locking = true;

					var date = scope.pcConditionsDateForm;
					if(date.firstSelect === date.firstSelectOptions[1].value){
						if(calenderType === 'first'){
							date.showFromCalender = !date.showFromCalender;
							date.showToCalender = false;
						}else if(calenderType === 'second'){
							date.showFromCalender = false;
							date.showToCalender = !date.showToCalender;
						}
					}

					lockingTimer = setTimeout(function(){
						locking = false;
					}, 100);
				},
				closeCalender: function(){
					scope.pcConditionsDateForm.showFromCalender = false;
					scope.pcConditionsDateForm.showToCalender = false;
				},
				//Set Default Main Option
				changeSubSearchOption: function(){
					var date = scope.pcConditionsDateForm;
					for(var i = 0, len = date.firstSelectOptions.length; i < len; i++){
						var item = date.firstSelectOptions[i];
						if(item.value === date.firstSelect){
							date.secondSelectOptions = item.subOptions;
							break;
						}
					}

					date.setDefaultSubSearchOptions();
					date.onChangeSubSearchOptions();
					date.closeCalender();
				},
				onChangeSubSearchOptions: function(useCurrentDate, calenderType){
					var date = scope.pcConditionsDateForm;

					var firstCalenderData = useCurrentDate ? date.fromCalender : defaultDate('from');
					var secondCalenderData = useCurrentDate ? date.toCalender : defaultDate('to');

					var firstCalenderInputData = null;
					var secondCalenderInputData = null;

					var firstMainSearchOption = date.firstSelectOptions[0];
					var secondMainSearchOption = date.firstSelectOptions[1];
					var firstSubSearchOption = firstMainSearchOption.subOptions;
					var secondSubSearchOption = secondMainSearchOption.subOptions;

					var setBeforeDate = function(number){
						firstCalenderData.setDate(firstCalenderData.getDate() - number);
					};

					var setMinMaxMode = function(mode){
						date.calenderOptions.maxMode = mode;
						date.calenderOptions.minMode = mode;
					};

					//Recent
					if(date.firstSelect === firstMainSearchOption.value){
						switch(date.secondSelect){
							//1 week
							case firstSubSearchOption[1].value :
								setBeforeDate(6);
							break;

							//1 month
							case firstSubSearchOption[2].value :
								setBeforeDate(30);
							break;
						}
						
						firstCalenderInputData = changeDateFormat(firstCalenderData);
						secondCalenderInputData = changeDateFormat(secondCalenderData);

					//Period
					}else{
						var firstArgsArr = [
							firstCalenderData
						];
						var secondArgsArr = [
							secondCalenderData
						];
						switch(date.secondSelect){
							//Daily
							case secondSubSearchOption[0].value :
								setMinMaxMode("day");
							break;

							//Monthly
							case secondSubSearchOption[1].value :
								setMinMaxMode("month");

								firstArgsArr.push(true);
								firstArgsArr.push(false);
								secondArgsArr.push(true);
								secondArgsArr.push(false);

								/**
								 * If year is diffrent and month is same.
								 * From Calender have to setting month, date of today
								 */
								if(
									firstCalenderData.getFullYear() !== secondCalenderData.getFullYear() &&
									firstCalenderData.getMonth() === secondCalenderData.getMonth()
									){

									firstCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth());
									firstCalenderData.setDate(1);
								}else{
									firstCalenderData.setDate(1);
									/**
									 * When setDate of secondCalenderData is called by 0,
									 * It can get the last day of before month.
									 * but if current last day is 31 and 
									 * the last day of before month is 30,
									 * month is increased
									 * So before setMonth is called, you have to call setDate by 1.
									 */
									secondCalenderData.setDate(1);
									secondCalenderData.setMonth(secondCalenderData.getMonth() + 1);
									secondCalenderData.setDate(0);	
								}
							break;

							//Yearly
							case secondSubSearchOption[2].value :
								setMinMaxMode("year");

								firstArgsArr.push(false);
								firstArgsArr.push(false);
								secondArgsArr.push(false);
								secondArgsArr.push(false);

								//If fromDate and toDate is same.
								//2014 , 2014 
								//2015 , 2015
								if(firstCalenderData.getFullYear() === secondCalenderData.getFullYear()){

									//2014, 2014
									if(secondCalenderData.getFullYear() === minDate.getFullYear()){
										firstCalenderData.setDate(1);
										firstCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth());
										
										secondCalenderData.setFullYear(maxDate.getFullYear());
										secondCalenderData.setMonth(0);
										secondCalenderData.setDate(0);
									}else{
									//2015, 2015
										firstCalenderData.setDate(1);
										firstCalenderData.setMonth(0);

										secondCalenderData.setFullYear(cameraLocalTime.getDateObj().getFullYear());
										secondCalenderData.setDate(1);
										secondCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth() + 1);
										secondCalenderData.setDate(0);
									}

								//If toDate is faster than fromDate.
								//2014 , 2015
								}else if(firstCalenderData.getFullYear() < secondCalenderData.getFullYear()){
									// firstCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth());
									/**
									 * A below line is added with limitMinMaxMonth,
									 * because year search have issue.
									 */
									firstCalenderData.setDate(1);
									firstCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth() + 1);
					
									secondCalenderData.setDate(1);
									secondCalenderData.setMonth(cameraLocalTime.getDateObj().getMonth() + 1);
									secondCalenderData.setDate(0);
								}else{
									//2015 , 2014
									//Code is unnessesary, 
									//because 'To Time' should be later then 'From Time'
								}
							break;
						}

						firstCalenderInputData = changeDateFormat.apply(null, firstArgsArr);
						secondCalenderInputData = changeDateFormat.apply(null, secondArgsArr);
					}

					date.fromCalender = firstCalenderData;
					date.fromCalenderInput = firstCalenderInputData;
					date.toCalender = secondCalenderData;
					date.toCalenderInput = secondCalenderInputData;

					//Temporary
					if(useCurrentDate === true){
						date.limitMinMaxMonth(calenderType);
					}else{
						date.limitMinMaxMonth();
					}
					date.closeCalender();
				},
				onSelectFirstCalender: function(){
					var firstCalenderInputData = null;
					var date = scope.pcConditionsDateForm;
					var subOptions = date.firstSelectOptions[1].subOptions;
					var firstCalenderData = date.fromCalender;

					//calender can change only Period, So date.firstSelectOptions[1] is used only.
					switch(date.secondSelect){
						case subOptions[0].value :
							firstCalenderInputData = changeDateFormat(firstCalenderData);
						break;
						case subOptions[1].value :
							firstCalenderInputData = changeDateFormat(firstCalenderData, true, false);
						break;
						case subOptions[2].value :
							firstCalenderInputData = changeDateFormat(firstCalenderData, false, false);
						break;
					}

					date.fromCalenderInput = firstCalenderInputData;

					date.onChangeSubSearchOptions(true, 'first');
					date.closeCalender();
				},
				onSelectSecondCalender: function(){
					var secondCalenderInputData = null;
					var date = scope.pcConditionsDateForm;
					var subOptions = date.firstSelectOptions[1].subOptions;
					var secondCalenderData = date.toCalender;

					switch(date.secondSelect){
						case subOptions[0].value :
							secondCalenderInputData = changeDateFormat(secondCalenderData);
						break;
						case subOptions[1].value :
							secondCalenderInputData = changeDateFormat(secondCalenderData, true, false);
						break;
						case subOptions[2].value :
							secondCalenderInputData = changeDateFormat(secondCalenderData, false, false);
						break;
					}
					date.toCalenderInput = secondCalenderInputData;

					date.onChangeSubSearchOptions(true, 'second');
					date.closeCalender();
				},
				setDefaultMainSearchOptions: function(){
					var date = scope.pcConditionsDateForm;
					for(var i = 0, len = date.firstSelectOptions.length; i < len; i++){
						var item = date.firstSelectOptions[i];
						if(item.selected === true){
							date.firstSelect = item.value;
							date.secondSelectOptions = item.subOptions;
							break;
						}
					}
				},
				setDefaultSubSearchOptions: function(){
					var date = scope.pcConditionsDateForm;
					for(var j = 0, len = date.secondSelectOptions.length; j < len; j++){
						var item = date.secondSelectOptions[j];
						if(item.selected === true){
							date.secondSelect = item.value;
							break;
						}
					}
				},
				init: function(){
					var dateObj = cameraLocalTime.getDateObj();
					var fullYear = dateObj.getFullYear();
					var month = dateObj.getMonth();
					var date = dateObj.getDate();

					scope.pcConditionsDateForm.fromCalender = defaultDate('from');
					scope.pcConditionsDateForm.toCalender = defaultDate('to');

					scope.pcConditionsDateForm.calenderOptions.minDate = new Date(fullYear - 1, month, date - 1);
					scope.pcConditionsDateForm.calenderOptions.maxDate = new Date(fullYear, month, date);

					minDate = new Date(fullYear - 1, month, date - 1);
					maxDate = new Date(fullYear, month, date);

					scope.pcConditionsDateForm.fromCalenderInput = changeDateFormat(scope.pcConditionsDateForm.fromCalender, true, true);
					scope.pcConditionsDateForm.toCalenderInput = changeDateFormat(scope.pcConditionsDateForm.toCalender, true, true);
					scope.pcConditionsDateForm.setDefaultMainSearchOptions();
					scope.pcConditionsDateForm.setDefaultSubSearchOptions();
				},
				validate: function(){
					var returnVal = true;
					var alertMessageLanguageKey = null;

					var fromDate = scope.pcConditionsDateForm.fromCalender;
					var toDate = scope.pcConditionsDateForm.toCalender;

					if(fromDate.getFullYear() < 2000 || toDate.getFullYear() > 2037){
						alertMessageLanguageKey = lang.modal.overTime;
						returnVal = false;
					}

					if(returnVal === true && scope.pcConditionsDateForm.firstSelect === scope.pcConditionsDateForm.firstSelectOptions[1].value){
						var oneMonthAge = angular.copy(scope.pcConditionsDateForm.toCalender);
						oneMonthAge.setDate(oneMonthAge.getDate() - 31);

						if(
							scope.pcConditionsDateForm.fromCalender.getTime() > scope.pcConditionsDateForm.toCalender.getTime()){
							alertMessageLanguageKey = lang.modal.limitStartDay;
							returnVal = false;
						}else if(
							scope.pcConditionsDateForm.secondSelect === scope.pcConditionsDateForm.secondSelectOptions[0].value &&
							scope.pcConditionsDateForm.fromCalender.getTime() < oneMonthAge.getTime()
							){
							alertMessageLanguageKey = lang.modal.lowerThan31Day;
							returnVal = false;
						}
					}

					if(returnVal === false){
						pcModalService.openAlert({
							title: lang.modal.alert,
							message: alertMessageLanguageKey
						});
					}

					return returnVal;
				},
				limitMinMaxMonth: function(calenderType){
					var date = scope.pcConditionsDateForm;
					var fromCalender = date.fromCalender;
					var toCalender = date.toCalender;

					var fromCalenderInput = null;
					var toCalenderInput = null;

					var resetMinDate = function(){
						date.calenderOptions.minDate = new Date(
							minDate.getFullYear(),
							minDate.getMonth(),
							minDate.getDate()
						);
					};
					var resetMaxDate = function(){
						date.calenderOptions.maxDate = new Date(
							maxDate.getFullYear(),
							maxDate.getMonth(),
							maxDate.getDate()
						);
					};

					if(date.calenderOptions.maxMode === "month"){

						fromCalenderInput = date.fromCalenderInput.split('-');
						toCalenderInput = date.toCalenderInput.split('-');

						if(calenderType === 'first'){
							if(
								fromCalender.getFullYear() === minDate.getFullYear() &&
								fromCalender.getMonth() === minDate.getMonth()
								){

								date.calenderOptions.maxDate.setFullYear(maxDate.getFullYear());
								date.calenderOptions.maxDate.setMonth(maxDate.getMonth());
								date.calenderOptions.maxDate.setDate(0);

								date.calenderOptions.maxDate = new Date(
									date.calenderOptions.maxDate.getFullYear(),
									date.calenderOptions.maxDate.getMonth(),
									date.calenderOptions.maxDate.getDate()
								);

								if(
									parseInt(toCalenderInput[0]) === maxDate.getFullYear() &&
									(parseInt(toCalenderInput[1]) - 1) === maxDate.getMonth()
									){
									date.toCalender = date.calenderOptions.maxDate;
									date.toCalenderInput = changeDateFormat(date.calenderOptions.maxDate, true, false);
								}
							}else{
								resetMaxDate();
							}
						}

						if(calenderType === 'second'){
							if(
								toCalender.getFullYear() === maxDate.getFullYear() &&
								toCalender.getMonth() === maxDate.getMonth()
								){
								date.calenderOptions.minDate.setFullYear(minDate.getFullYear());
								date.calenderOptions.minDate.setMonth(
									minDate.getMonth() + 1
								);

								date.calenderOptions.minDate = new Date(
									date.calenderOptions.minDate.getFullYear(),
									date.calenderOptions.minDate.getMonth(),
									1
								);

								if(
									parseInt(fromCalenderInput[0]) === minDate.getFullYear() &&
									parseInt(fromCalenderInput[1]) === minDate.getMonth()
									){
									date.fromCalender = date.calenderOptions.minDate;
									date.fromCalenderInput = changeDateFormat(date.calenderOptions.minDate, true, false);
								}
							}else{
								resetMinDate();
							}	
						}
					}else{
						resetMaxDate();
						resetMinDate();
					}
				}
			};

			/**
			 * To close the calender, When other splace is clicked.
			 */
			var closeEvent = {
				closeCalenderAfterFillter: function(event){
					if(locking === true) return;
					var target = event.target;
					var parsedTarget = $(target);
					var calenderClass = "ua-datepicker pc-calender";
					var calender = $('.' + calenderClass.replace(' ', '.'));

					if(
						parsedTarget.hasClass(calenderClass.split(' ')[0]) === false && 
						parsedTarget.hasClass(calenderClass.split(' ')[1]) === false && 
						calender.has(target).length === 0
						){

						if(scope.pcConditionsDateForm.showFromCalender === true){
							scope.pcConditionsDateForm.showFromCalender = false;	
						}else if(scope.pcConditionsDateForm.showToCalender === true){
							scope.pcConditionsDateForm.showToCalender = false;		
						}

						try{
							scope.$apply();	
						}catch(e){
							console.error(e);
						}
					}
				},
				eventName: "click",
				dom: $("body"),
				bind: function(){
					closeEvent.dom.bind(
						closeEvent.eventName, 
						closeEvent.closeCalenderAfterFillter
					);
				},
				unbind: function(){
					closeEvent.dom.unbind(
						closeEvent.eventName, 
						closeEvent.closeCalenderAfterFillter
					);
				}
			};

			closeEvent.bind();
			element.on("$destroy", closeEvent.unbind);

			pcSetupService.getCameraLocalTime(function(localTime){
                cameraLocalTime.set(localTime);

				scope.pcConditionsDateForm.init();
			}, function(errorData){
				console.log(errorData);
				console.error(errorData);

				scope.pcConditionsDateForm.init();
			});

			function changeDateFormat(date, useMonth, useDay){
				var useMonth = useMonth === false ? false : true;
				var useDay = useDay === false ? false : true;

				var year = date.getFullYear();
		        var month = date.getMonth() + 1;
		        var day = date.getDate();

		        var str = year;

		        month = month < 10 ? "0" + month : month;
		        day = day < 10 ? "0" + day : day;

		        if(useMonth === true){
		        	str += '-' + month;
		        }

		        if(useDay === true){
		        	str += '-' + day;	
		        }

		        return str;
			}
		}
	};
});