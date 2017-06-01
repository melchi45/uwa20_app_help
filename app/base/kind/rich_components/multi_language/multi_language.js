kindFramework.
  config(function($translateProvider, MULTILANGUAGE_CONFIG){
    $translateProvider.useStaticFilesLoader({
      prefix: 'base/locales/',
      suffix: '.json'
    });
  
    $translateProvider.preferredLanguage(MULTILANGUAGE_CONFIG.defaultLocaleFileName);
  }).
  service('MultiLanguage', function(MULTILANGUAGE_CONFIG, $translate){
    var currentLanguage = MULTILANGUAGE_CONFIG.defaultLocaleFileName;
  
    this.getCurrentLanguage = function(){
      return currentLanguage;
    };
  
    this.setLanguage = function(localeFileName){
      currentLanguage = localeFileName;
      $translate.use(localeFileName);
    };
  
    this.getLanguages = function(){
      return MULTILANGUAGE_CONFIG.availableLanguages;
    };
  }).
  /**
   *
   * @example 
   *  <multi-language btn-class="btn-default"></multi-language>
   */
  directive("multiLanguage", function(MultiLanguage, MULTILANGUAGE_CONFIG){
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<div class="btn-group">' +
            '<button type="button" class="btn dropdown-toggle {{btnClass}}" dropdown-toggle data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + 
            '{{currentLanguage}} <span class="caret"></span>' + 
            '</button>' + 
            '<ul class="dropdown-menu" role="menu">' + 
            '<li role="menuitem" ng-repeat="lang in availableLanguages" ng-click="changeLanguage(lang.localeFileName)">' + 
            '<a href="#">{{lang.label}}</a>' +
            '</li>' + 
            '</ul>' + 
            '</div>',
      scope: {
        btnClass: '@'
      },
      link: function(scope){
        scope.availableLanguages = MULTILANGUAGE_CONFIG.availableLanguages;
        var setCurrentLanguageLabel = function(){
          scope.availableLanguages.forEach(function(obj){
            if(obj.localeFileName === MultiLanguage.getCurrentLanguage()){
              scope.currentLanguage = obj.label;
            }
          });
        };
        
        scope.currentLanguage = '';
        
        if(scope.availableLanguages.length > 0){
          setCurrentLanguageLabel();
        }
        
        scope.changeLanguage = function(localeFileName){
          MultiLanguage.setLanguage(localeFileName);
          setCurrentLanguageLabel();
        };
      }
    };
  });