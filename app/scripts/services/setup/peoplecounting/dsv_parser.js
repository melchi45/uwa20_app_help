"use strict";

/*
var data = [
	'Result.1.Camera.Camera 01.Line.Front Gate.In=10,20',
	'Result.1.Camera.Camera 01.Line.Front Gate.Out=10,20',
	'Result.1.Camera.Camera 01.Line.Back Gate.In=20,30',
	'Result.1.Camera.Camera 01.Line.Back Gate.Out=10,20',
].join('\n');

var parsedData = PCDSVParser(data)	
	.priority({
		Result: 'number',
		Camera: 'string',
		Line: 'string'
	})
	.normal('In', 'string')
	.normal('Out', 'string')
	.get();

console.log(parsedData);
*/
kindFramework.factory('PCDSVParser', function(){
	function parseData(data, paramter){

		var parsedData = {};
		var splitedData = data.split('\n');

		function getPriority(txt){
			var priority = '';
			var value = '';
			for( 
				var priorityIndex = 0, 
				priorityLen = paramter.priority.length; 
				priorityIndex < priorityLen; 
				priorityIndex++ 
				){
				var prioritySelf = paramter.priority[priorityIndex];

				var regPattern = null;
				switch(prioritySelf.type){
					case "number":
						regPattern = "^" + prioritySelf.name + ".[0-9]{1,}";
					break;
					case "string":
						regPattern = "^" + prioritySelf.name + ".[a-zA-Z0-9\\s]{1,}";
					break;
				}

				regPattern = new RegExp(regPattern + '.');

				if(regPattern.test(txt) === true){
					priority = prioritySelf.name;
					value = txt.split('.')[1];

					if(prioritySelf.type === "number"){
						value = parseInt(value);
					}
					break;
				}
			}

			return {
				key: priority,
				type: prioritySelf.type,
				value: value
			};
		}

		function getKeyVal(txt){
			var splitedTxt = txt.split('=');

			var key = splitedTxt.shift();
			var value = splitedTxt.join('=');

			for(
				var normalIndex = 0, 
				normalLen = paramter.normal.length;
				normalIndex < normalLen;
				normalIndex++){
				var self = paramter.normal[normalIndex];

				if(self.name === key){
					switch(self.type){
						case "boolean":
							value = value === "True" ? true : false;
						break;
						case "number":
							value = parseInt(value);
						break;
						//validation about string, enum is yet.
					}
					break;
				}
			}

			return {
				key: key.toLowerCase(),
				value: value
			};
		}

		function setParameter(data, obj){
			var priority = getPriority(data);
			var selfParameter = null;

			if(priority.key !== ''){
				var priorityKey = priority.key.toLowerCase();
				if( !(priorityKey in obj) ){
					obj[priorityKey] = [];
				}

				var channelData = {};
				var isCreated = false;
				var priorityUniqueId = priorityKey;
				switch(priority.type){
					case "number":
						priorityUniqueId = 'index';
					break;
					case "string":
						priorityUniqueId += "Name";
					break;
				}

				if(obj[priorityKey].length !== 0){
					channelLabel:
					for(
						var channelIndex = 0,
						channelLen = obj[priorityKey].length;
						channelIndex < channelLen;
						channelIndex++){
						if(obj[priorityKey][channelIndex][priorityUniqueId] === priority.value){
							channelData = obj[priorityKey][channelIndex];
							isCreated = true;
							break channelLabel;
						}
					}
				}

				if(isCreated === false){
					obj[priorityKey].push(channelData);
				}

				if(Object.keys(channelData).length === 0){
					channelData[priorityUniqueId] = priority.value;
				}

				data = data.replace(priority.key + '.' + priority.value + '.', '');

				if(getPriority(data).key !== ''){
					setParameter(data, channelData);
				}else{
					var selfParameter = getKeyVal(data);
					channelData[selfParameter.key] = selfParameter.value;	
				}
			}else{
				var selfParameter = getKeyVal(data);
				obj[selfParameter.key] = selfParameter.value;
			}
		}

		for(var i = 0, len = splitedData.length; i < len; i++){
			var self = splitedData[i];
			setParameter(self, parsedData);
		}

		return parsedData;
	}

	function Parser(data){
		if( !(this instanceof Parser) ){
			return new Parser(data);
		}

		var data = data;

		var paramter = {
			priority: [
			],
			normal: [
			]
		};

		this.priority = function(){
			var add = function(name, type){
				paramter.priority.push({
					name: name,
					type: type.toLowerCase()
				});
			};
			if(arguments.length === 2){
				add(arguments[0], arguments[1]);
			}else{
				var argKeys = Object.keys(arguments[0]);
				for(var i = 0, len = argKeys.length; i < len; i++){
					var key = argKeys[i];
					add(key, arguments[0][key]);
				}
			}

			return this;
		};

		this.normal = function(){
			var add = function(name, type){
				paramter.normal.push({
					name: name,
					type: type.toLowerCase()
				});
			};

			if(arguments.length === 2){
				add(arguments[0], arguments[1]);
			}else{
				var argKeys = Object.keys(arguments[0]);
				for(var i = 0, len = argKeys.length; i < len; i++){
					var key = argKeys[i];
					add(key, arguments[0][key]);
				}
			}
			return this;
		};

		this.get = function(){
			if(paramter.priority.length === 0){
				return data;
			}

			if(paramter.normal.length === 0){
				return data;
			}

			return parseData(data, paramter);
		};
	}

	return Parser;
});