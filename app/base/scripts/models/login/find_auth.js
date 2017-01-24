"use strict";

kindFramework.factory(
	'FindAuthModel',
	function(){
	var FindAuthModel = function(){
		if(!(this instanceof FindAuthModel)){
				return new FindAuthModel();
		}
		
		this.getFindIdMessage = function(){
			return "회원 가입시 등록한 이메일을 입력하여 주십시오.";
		};
		
		this.getFindPwdMessage = function(){
			return "회원가입 시 등록한 ID와 이메일을 입력하여 주십시오.";
		};
	};
		
	return FindAuthModel;
});