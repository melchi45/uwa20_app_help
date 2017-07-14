kindFramework.factory("DewarpModel", function() {
  "use strict";

  function DewarpModel() {
    if (!(this instanceof DewarpModel)) {
      return new DewarpModel();
    }

    var lang = {
      langTitle: 'lang_globalDewarpSetup',
      langCamMntMode: 'lang_cameraMountingMode',
      langViews: 'lang_views'
    };

    /**
    {
    	name: <String> Multi Language Key of Mode,
    	type: <String> Mode Type,
    	views: <Array> Views of Mode
    		[{
    			name: <String> Multi Language Key of View
    			type: <String> View Type
    		}]
    }
    */
    var dewarpMode = [{
        name: 'lang_ceiling',
        type: 'Ceiling',
        views: [{
            name: '360Panorama',
            type: '360Panorama'
          },
          {
            name: 'lang_quadView',
            type: 'QuadView'
          },
          {
            name: 'lang_doublePanorama',
            type: 'DoublePanorama'
          }
        ]
      },
      {
        name: 'lang_wall',
        type: 'Wall',
        views: [{
            name: 'lang_singlePanorama',
            type: 'SinglePanorama'
          },
          {
            name: 'lang_quadView',
            type: 'QuadView'
          }
        ]
      }
    ];

    this.getLang = function() {
      return lang;
    };

    this.getDewarpMode = function() {
      return dewarpMode;
    };
  }

  return DewarpModel;
});