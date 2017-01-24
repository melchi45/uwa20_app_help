/**
 * ptz directive
 * @memberof ptzModule
 * @ngdoc directive
 * @name ptz
 * @param $compile {service} angularjs $compile service
 * @fires write a ptz element tag or attribute
 * @example <div ptz="your ptz data"></div>
 * @example <ptz ptz="your ptz data"></ptz>
*/
ptzModule
    .directive('ptz', function ($compile,ptzInterface) {
        return {
            restrict:'EA',
            link:function(scope,element,attrs){
                
                /**
                 * get ptz data
                 * @var ptz
                 * @memberof ptz
                 */
                var ptz = scope.$eval(attrs.ptz);
                if(element.find("ul.ptz_ul").length == 0 && ptz.on == 'on'){


                    scope.directions = ptzInterface.directions;
                    scope.moveCamera = ptzInterface.moveCamera;

                    element.on("mousewheel",function(event){
                        event.preventDefault();
                    });

                    /**
                     * ptz button layout html tag                    
                     * @var li
                     * @memberof ptz
                     */
                    var li = '<ul class="ptz_ul"><li ng-repeat="x in directions" data-type="{{x.direction}}"><img src="images/{{x.direction}}.png" ng-click="moveCamera(\''+ptz.ip+'\',x.direction,\''+ptz.sunapiServer+'\',\''+ptz.user+'\',\''+ptz.password+'\')"></li><ul>';
                    
                    /**
                     * angularjs compile html tag
                     * @var dirWrap
                     * @memberof ptz
                     */
                    var divWrap = $compile(li)(scope);
                    element.prepend(divWrap);
                    element.addClass('ptz-wrap');

                    element.bind('mousewheel',function(event){
                        
                        /**
                         * This is old version IE  event variable for compatibility
                         * @var event
                         * @memberof ptz
                         */
                        var event = window.event;
                        
                        /**
                         * identify the zoomIn and zoomOut
                         * @var delta
                         * @memberof ptz
                         */
                        var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
                        if(delta == -1){
                            scope.moveCamera(ptz.ip,'zoomOut',ptz.sunapiServer,ptz.user,ptz.password);
                        }else if(delta == 1){
                            scope.moveCamera(ptz.ip,'zoomIn',ptz.sunapiServer,ptz.user,ptz.password);
                        };
                    });
                }

            }
        };
    });

