"use strict";
kindFramework.factory('HistoryStack', function(){
	var HistoryStack = function(){
		if(!this instanceof HistoryStack){
			return new HistoryStack();
		}
		
		var items = [];
		var removedItem = null;
		
		this.push = function(item){
			items.push(angular.copy(item));
		};
		
		this.pop = function(){
			removedItem = items.pop();
			return removedItem;
		};
		
		this.getRemovedItem = function(){
			// setTimeout(function(){
			// 	removedItem = null;
			// }, 15);
			// return removedItem;
			var temp = angular.copy(removedItem);
			removedItem = null;
			return angular.copy(temp);
		};
		
		this.clearExcludingHead = function(){
			items.splice(1, this.size() - 1);
		};

		this.clearExcludingHeadAndTail = function(){
			items.splice(1, this.size() - 2);
		};
		
		this.removeDuplicatedItem = function(item){
			for(var i = 0, len = this.size(); i < len; i++){
				if(items[i] === item){
					items.splice(i, this.size() - i);
					
					console.log("kind removed ", item);
					break;
				}
			}
		};
		
		this.clear = function(){
			items = [];
		};
		
		this.getHead = function(){
			return items[0];
		};
		
		this.isEmpty = function(){
			return this.size() === 0;
		};
		
		this.size = function(){
			return items.length;
		};
		
		this.getLastItem = function(){
			if(this.isEmpty()){
				return false;
			}else{
				return items[this.size() - 1];
			}
		};
		
		this.print = function(){
			console.log("kind ", items.join(' -> '));
		};

	};
	
	return HistoryStack;
});