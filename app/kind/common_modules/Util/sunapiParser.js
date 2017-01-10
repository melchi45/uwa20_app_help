function BasicSunapiParser() {
    this.jsonArray = [];
    this.json={};
    this.arrayIndex = 0;
    
    this.init = function(){
        this.jsonArray = {};
        this.arrayIndex = 0;
        this.json={};
    };

    this.parse = function(token) {
        var leftProperty = 0;
        var rightValue = 1;
        if(token[leftProperty]){
//            this.json[token[leftProperty]] = token[rightValue];
//            this.jsonArray[this.arrayIndex] = this.json;
            this.jsonArray[token[leftProperty]] = token[rightValue];
        }
        else{
            this.arrayIndex++;
        }
    };

    this.parseLine = function(data){
        var lines = data.split('\r\n');
        var lineIndex = 0;
        this.init();

        for(lineIndex = 0; lineIndex < lines.length; lineIndex++){
            var token = lines[lineIndex].split('=');
            this.parse(token);
        }
        return this.jsonArray;
    }
}

function DateParser(){
    this.__proto__ = new BasicSunapiParser();
    
    var leftProperty = 0;
    var rightValue = 1;
    var oldIndex = 0;
    var channels = [];
    var results = [];
    var json = {};
    var arrayIndex = 0;
    
    this.parse = function (token) {
        if(arrayIndex == 0){
            arrayIndex++;
        }
        else if(token[leftProperty]){
            var leftResult = token[leftProperty].split('.');
            var channel = leftResult[1];
            var arrIndex = leftResult[3];
            var propertyName = leftResult[4];
            var channelObj = {};
            
            if(arrIndex != oldIndex){
                json = {};
                oldIndex = arrIndex;
            }
            if (propertyName === 'StartTime' || propertyName === 'EndTime') {
                var strDatePattern = token[rightValue].replace(' ', 'T');
                token[rightValue] = new Date(strDatePattern).getTime()/1000;
            }
            json[propertyName] = token[rightValue];
            results[arrIndex] = json;
            channelObj.Results = results;
            channelObj.Channel = parseInt(channel);
            channels[channel] = channelObj;
            this.jsonArray['TimeLineSearchResults'] = channels;
        }
    }
}

function ProfileParser(){
    
    this.__proto__ = new BasicSunapiParser();
    
    var leftProperty = 0;
    var rightValue = 1;
    var channels = [];
    var profiles = [];
    var json = {};
    var arrayIndex = 0;
    
    // Not tested for NVR. Only tested for cam.
    this.parse = function (token) {
        if(token[leftProperty]){
            var leftResult = token[leftProperty].split('.');
            var channel = leftResult[1];
            var profileIndex = leftResult[3];
            var propertyName = leftResult[4];
            var channelObj = {};
                    
            json[propertyName] = token[rightValue];
            profiles[arrayIndex] = json;
            channelObj.Profiles = profiles;
            channelObj.Channel = parseInt(channel);
            channels[channel] = channelObj;
            this.jsonArray['VideoProfiles'] = channels;
        }
        else{
            json = {};
            arrayIndex++;
        }
    }
}