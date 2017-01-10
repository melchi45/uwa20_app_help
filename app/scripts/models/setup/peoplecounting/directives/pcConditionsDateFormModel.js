kindFramework.factory('PcConditionsDateFormModel', function(SunapiClient, $translate){
	"use strict";

	var PcConditionsDateFormModel = function(){
		if(!(this instanceof PcConditionsDateFormModel)){
			return new PcConditionsDateFormModel();
		}

		var lang = {
			date: {
				title: 'lang_date', //TODO
				opts: [
					'lang_recent',
					'lang_period'
				],
				recendOpts: ['lang_dayDisplay', 'lang_week', 'lang_conditions_month'],
				periodOpts: ['lang_daily', 'lang_monthly', 'lang_yearly']
			},
			modal: {
				alert: 'lang_alert',
				limitStartDay: 'lang_msg_From_To_Late',
				lowerThan31Day: 'lang_msg_search_range',
				overTime: 'lang_msg_overtime'
			}
		};

		this.getMainDateSearchOptions = function(){
			var date = lang.date;
			
			return [
				{
					name: $translate.instant(date.opts[0]),
					value: date.opts[0].toLowerCase(),
					selected: true,
					subOptions: [
						{
							name: '1 ' + $translate.instant(date.recendOpts[0]),
							value: date.recendOpts[0],
							selected: true
						},
						{
							name: '1 ' + $translate.instant(date.recendOpts[1]),
							value: date.recendOpts[1],
							selected: false
						},
						{
							name: '1 ' + $translate.instant(date.recendOpts[2]),
							value: date.recendOpts[2],
							selected: false
						}
					]
				},
				{
					name: $translate.instant(date.opts[1]),
					value: date.opts[1].toLowerCase(),
					selected: false,
					subOptions: [
						{
							name: $translate.instant(date.periodOpts[0]),
							value: date.periodOpts[0],
							selected: true
						},
						{
							name: $translate.instant(date.periodOpts[1]),
							value: date.periodOpts[1],
							selected: false
						},
						{
							name: $translate.instant(date.periodOpts[2]),
							value: date.periodOpts[2],
							selected: false
						}
					]
				}
			];
		};

		this.getLang = function(){
			return lang;
		};
	};

	return PcConditionsDateFormModel;
});