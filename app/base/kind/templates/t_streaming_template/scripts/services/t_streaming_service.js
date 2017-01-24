kindFramework
    .service('SampleService', function(){
        var _name = null;
        this.setName = function(name){
            _name = name;
        };
        this.getName = function(){
            return _name;
        };
    });