kindFramework.factory('XMLParser', function ()
{
    var xmlParse = {};
    var ParsedAttributeSection;
    var ParsedCgiSection;

    var AttributeSectionXML;
    var CgiSectionXML;


    function stringToJsonCGIs(result)
    {
        var dataType, oValue;

        var dataTypeNode = result.find('dataType')[0].childNodes[0];
        if (dataTypeNode !== undefined)
        {
            dataType = dataTypeNode.nodeName;
        }
        if (dataType === 'string')
        {
            oValue = {};

            if (dataTypeNode.getAttribute('minlen') !== null)
            {
                oValue.minLength = dataTypeNode.getAttribute('minlen');
            }

            if (dataTypeNode.getAttribute('maxlen') !== null)
            {
                oValue.maxLength = dataTypeNode.getAttribute('maxlen');
            }
        }
        else if (dataType === 'int' || dataType === 'float')
        {
            oValue = {};

            if (dataTypeNode.getAttribute('min') !== null)
            {
                oValue.minValue = parseInt(dataTypeNode.getAttribute('min'), 10);
            }

            if (dataTypeNode.getAttribute('max') !== null) {
                oValue.maxValue = parseInt(dataTypeNode.getAttribute('max'), 10);
            }
        }
        else if (dataType === 'enum' || dataType === 'csv')
        {
            oValue = [];

            var entries = result.find('entry');
            entries.each(function ()
            {
                var currEntry = $(this);
                oValue.push(currEntry.attr('value'));
            });
        }
        else if (dataType === 'bool')
        {
            oValue = {};
            oValue = true;
        }

        return oValue;
    }

    /*
     iXML : Output From http://<ip>/stw-cgi/attributes.cgi/cgis
     inputStr : cginame/submenu/parameter/datatype
     Usage: XMLParser.parseCgiSection(iXML,inputStr);
     */
    xmlParse.parseCgiSection = function (iXML, inputStr)
    {
        var xmlData;
        if(typeof CgiSectionXML === 'undefined' || CgiSectionXML !== iXML)
        {
             CgiSectionXML = iXML;
             xmlData = $($.parseXML(iXML));
             ParsedCgiSection = xmlData;
         }
         else
         {
            xmlData = ParsedCgiSection;
         }
 


        var oValue;

        var array = inputStr.split('/');
        if (array.length === 4) //cginame/submenu/parameter/datatype
        {
            var cgiNames = xmlData.find('cgi');
            cgiNames.each(function ()
            {
                var currCgi = $(this);

                var cgiName = currCgi.attr('name');
                if (cgiName === array[0])
                {
                    var subMenus = currCgi.find('submenu');
                    subMenus.each(function ()
                    {
                        var currSubmenu = $(this);

                        var submenuName = currSubmenu.attr('name');
                        if (submenuName === array[1])
                        {
                            var parameters = currSubmenu.find('parameter');
                            parameters.each(function ()
                            {
                                var currParameter = $(this);

                                var paramName = currParameter.attr('name');
                                if (paramName === array[2])
                                {
                                    oValue = stringToJsonCGIs(currParameter);
                                    return false;
                                }
                            });

                            return false;
                        }
                    });

                    return false;
                }
            });
        }
        else if (array.length === 3) //submenu/parameter/datatype
        {
            var subMenus = xmlData.find('submenu');
            subMenus.each(function ()
            {
                var currSubmenu = $(this);

                var submenuName = currSubmenu.attr('name');
                if (submenuName === array[0])
                {
                    var parameters = currSubmenu.find('parameter');
                    parameters.each(function ()
                    {
                        var currParameter = $(this);

                        var paramName = currParameter.attr('name');
                        if (paramName === array[1])
                        {
                            oValue = stringToJsonCGIs(currParameter);
                            return false;
                        }
                    });

                    return false;
                }
            });
        }
        else if (array.length === 2) //parameter/datatype
        {
            var parameters = xmlData.find('parameter');
            parameters.each(function ()
            {
                var currParameter = $(this);

                var paramName = currParameter.attr('name');
                if (paramName === array[0])
                {
                    oValue = stringToJsonCGIs(currParameter);
                    return false;
                }
            });
        }
        else if (array.length === 1) //datatype
        {
            oValue = stringToJsonCGIs(currParameter);
        }

        return oValue;
    };

    function stringToJsonAttributes(result)
    {
        var oValue;

        var dataType = result.attr('type');
        var iValue = result.attr('value');

        if (dataType === 'bool')
        {
            if (iValue === 'True')
            {
                oValue = true;
            }
            else
            {
                oValue = false;
            }
        }
        else if (dataType === 'int')
        {
            oValue = parseInt(iValue, 10);
        }
        else if (dataType === 'enum' || dataType === 'csv')
        {
            var toSplit = iValue.split(",");

            oValue = [];
            for (var i = 0; i < toSplit.length; i = i + 1)
            {
                oValue.push(toSplit[i]);
            }
        }

        return oValue;
    }

    /*
     iXML : http://<ip>/stw-cgi/attributes.cgi/attributes
     inputStr : groupName/categoryName/attributeName
     Usage: XMLParser.parseAttributeSection(iXML,inputStr)
     */
    xmlParse.parseAttributeSection = function (iXML, inputStr)
    {
         var xmlData;
        if(typeof AttributeSectionXML === 'undefined' || AttributeSectionXML !== iXML)
        {
             AttributeSectionXML = iXML;
             xmlData = $($.parseXML(iXML));
             ParsedAttributeSection = xmlData;
         }
         else
         {
            xmlData = ParsedAttributeSection;
         }

        var oValue;

        var array = inputStr.split('/');
        if (array.length === 3) //groupName/categoryName/attributeName
        {
            var groups = xmlData.find('group');
            groups.each(function ()
            {
                var currGroup = $(this);

                var groupName = currGroup.attr('name');
                if (groupName === array[0])
                {
                    var categories = currGroup.find('category');
                    categories.each(function ()
                    {
                        var currCategory = $(this);

                        var catName = currCategory.attr('name');
                        if (catName === array[1])
                        {
                            var attributes = currCategory.find('attribute');
                            attributes.each(function ()
                            {
                                var currAttribute = $(this);

                                var strData = currAttribute.attr('name');
                                if (strData === array[2])
                                {
                                    oValue = stringToJsonAttributes(currAttribute);
                                    return oValue;
                                }
                            });

                            return false;
                        }
                    });

                    return oValue;
                }
            });
        }
        else if (array.length === 2) //categoryName/attributeName
        {
            var categories = xmlData.find('category');
            categories.each(function ()
            {
                var currCategory = $(this);

                var catName = currCategory.attr('name');
                if (catName === array[0])
                {
                    var attributes = currCategory.find('attribute');
                    attributes.each(function ()
                    {
                        var currAttribute = $(this);

                        var strData = currAttribute.attr('name');
                        if (strData === array[1])
                        {
                            oValue = stringToJsonAttributes(currAttribute);
                            return oValue;
                        }
                    });

                    return false;
                }
            });
        }
        else if (array.length === 1) //attributeName
        {
            var attributes = xmlData.find('attribute');
            attributes.each(function ()
            {
                var currAttribute = $(this);

                var strData = currAttribute.attr('name');
                if (strData === array[0])
                {
                    oValue = stringToJsonAttributes(currAttribute);
                    return oValue;
                }
            });
        }

        return oValue;
    };

    return xmlParse;
});

