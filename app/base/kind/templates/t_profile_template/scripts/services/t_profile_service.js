/**
* this service have profile list , make prifle list data
* @memberof kindFramework
* @ngdoc service
* @name listService
* @fires inject this service
 * @example 
 *   Module.Component(Component Name, function (listService) { 
 *        your source~
 *    });
*/
kindFramework.service('listService', function(){ 
    /**
     * listService function
     * @var self
     * @memberof listService
     */
    var self = this;
    
    /**
     * have profile list data 
     * @var treeData
     * @memberof listService
     */
    this.treeData = [];
    
    /**
     * make profile list data
     * @function setList
     * @memberof listService
     * @param data {object} profile list data
     * @param ip {string} camera ip
     * @param thumbnailSrc {string} thumbNail image data
     * @return {object} profile list data
     * @example listService.setList(sunapi profile list data, camera ip, thumb image data);
    */
    this.setList = function(data,ip,thumbnailSrc){
        /**
         * have profile of camera
         * @var element
         * @memberof listService
         */
        var element = [];
        $.map(data,function(value,key){
            
            var elements = [];
            elements.push(value);
            element.push(
                {
                    title: value.Name+" [ "+value.Resolution +" ]", 
                    content:elements
                }
            );

        });

        /**
         * have camera info (ip,thumbnail,title)
         * @var root
         * @memberof listService
         */
        var root = {};
        root.title = "IP : "+ip;
        root.content = element;
        
        self.treeData.push(root);
        
        return self.treeData;
    };
});


