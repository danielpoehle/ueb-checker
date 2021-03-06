(function () {
    'use strict'; 

    angular.module('UeB', [])
    .controller('UeBController', UeBController)
    .service('UeBService', UeBService);
    
    UeBController.$inject = ['UeBService'];
    function UeBController(UeBService) {
        let ueBList = this;

        ueBList.Filename = 'bla';
        ueBList.loadComplete = false;
        ueBList.startDate = luxon.DateTime.fromFormat('11.04.2022', 'dd.MM.yyyy');
        ueBList.UEB = [];
        ueBList.ZVF = [];
        ueBList.ErrorList = [];
        ueBList.SuccessList = [];
        ueBList.Vorgang = '';
        ueBList.totalZvFZuege = 0;
        ueBList.SuccessZuege = 0;
        ueBList.filterDelay = true;
        

        ueBList.assignTrains = function(){ 
            let zvf = ueBList.ZVF.zvfexport.baumassnahmen.baumassnahme; 
            ueBList.Vorgang = zvf.master_fplo;
            let zvfElements = [];
            let zvfZuege = zvf.zuege.zug;
            for (let i = 0; i < zvfZuege.length; i+= 1) {
                let vts = luxon.DateTime.fromFormat(zvfZuege[i]['@attributes'].verkehrstag, 'yyyy-MM-dd')
                zvfElements.push({
                    'ZNr': parseInt(zvfZuege[i]['@attributes'].zugnr),
                    'VTS': {VText: vts.toLocaleString(), VNumber: vts.ts},
                    'Pr': zvfZuege[i]['@attributes'].zugbez,
                    'Regelung': zvfZuege[i].abweichung['@attributes'].art.replace(/^\w/, (c) => c.toUpperCase())
                });                 
            }

            ueBList.totalZvFZuege = zvfElements.length;

            let ubElements = [];
            let ubZuege = ueBList.UEB.zvfexport.baumassnahmen.baumassnahme.zuege.zug;
            for (let i = 0; i < ubZuege.length; i+= 1) {
                let vts = luxon.DateTime.fromFormat(ubZuege[i]['@attributes'].verkehrstag, 'yyyy-MM-dd')
                ubElements.push({
                    'ZNr': parseInt(ubZuege[i]['@attributes'].zugnr),
                    'VTS': {VText: vts.toLocaleString(), VNumber: vts.ts},
                    'Pr': ubZuege[i]['@attributes'].zugbez,
                    'Regelung': ubZuege[i]['@attributes'].fplo_abschnitt
                });                 
            }

            for (let j = 0; j < zvfElements.length; j+= 1) {
                if(ubElements.findIndex((e) => e.ZNr === zvfElements[j].ZNr && e.VTS.VNumber === zvfElements[j].VTS.VNumber) >= 0){
                    ueBList.SuccessList.push(zvfElements[j]);
                }else{
                    ueBList.ErrorList.push(zvfElements[j]);
                }
            }

            ueBList.SuccessZuege = ueBList.SuccessList.length;

            //console.log(ueBList.ErrorList);
            ueBList.loadComplete = true;       
        };

        
        

        $(document).ready(function () {
            $('#ueb').bind('change', handleDialog);
            $('#zvf').bind('change', importZvF);
        });

        function handleDialog(event) {
            var parseXml;

            if (typeof window.DOMParser != "undefined") {
                parseXml = function(xmlStr) {
                    return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                };
            } else if (typeof window.ActiveXObject != "undefined" &&
                new window.ActiveXObject("Microsoft.XMLDOM")) {
                parseXml = function(xmlStr) {
                    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                    return xmlDoc;
                };
            } else {
                throw new Error("No XML parser found");
            }

            const { files } = event.target;
            const file = files[0];
            
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (event) { 
                var jsonText = xmlToJson(parseXml(event.target.result)); 
                ueBList.UEB = jsonText;             
                //console.log(jsonText);
            }
        };
        
        function importZvF(event){
            var parseXml;

            if (typeof window.DOMParser != "undefined") {
                parseXml = function(xmlStr) {
                    return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                };
            } else if (typeof window.ActiveXObject != "undefined" &&
                new window.ActiveXObject("Microsoft.XMLDOM")) {
                parseXml = function(xmlStr) {
                    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                    return xmlDoc;
                };
            } else {
                throw new Error("No XML parser found");
            }

            const { files } = event.target;
            const file = files[0];
            
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (event) { 
                var jsonText = xmlToJson(parseXml(event.target.result)); 
                ueBList.ZVF = jsonText;             
                //console.log(jsonText);
            }
        };

        function xmlToJson(xml) {
            // Create the return object
            var obj = {};
          
            if (xml.nodeType == 1) {
              // element
              // do attributes
              if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                  var attribute = xml.attributes.item(j);
                  obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
              }
            } else if (xml.nodeType == 3) {
              // text
              obj = xml.nodeValue;
            }
          
            // do children
            // If all text nodes inside, get concatenated text from them.
            var textNodes = [].slice.call(xml.childNodes).filter(function(node) {
              return node.nodeType === 3;
            });
            if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
              obj = [].slice.call(xml.childNodes).reduce(function(text, node) {
                return text + node.nodeValue;
              }, "");
            } else if (xml.hasChildNodes()) {
              for (var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof obj[nodeName] == "undefined") {
                  obj[nodeName] = xmlToJson(item);
                } else {
                  if (typeof obj[nodeName].push == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                  }
                  obj[nodeName].push(xmlToJson(item));
                }
              }
            }
            return obj;
          };
    };

    function UeBService(){
        let service = this;
        let x = [
            {'name': 'OST-NORD-WEST', 'id': 123, 'trains': []},
            {'name': 'OST-NORD-S??DOST', 'id': 124, 'trains': []},
            {'name': 'OST-NORD-MITTE', 'id': 125, 'trains': []},
            {'name': 'OST-NORD-S??DWEST', 'id': 126, 'trains': []},
            {'name': 'OST-NORD-S??D', 'id': 127, 'trains': []},
            {'name': 'OST-WEST-S??DOST', 'id': 134, 'trains': []},
            {'name': 'OST-WEST-MITTE', 'id': 135, 'trains': []},
            {'name': 'OST-WEST-S??DWEST', 'id': 136, 'trains': []},
            {'name': 'OST-WEST-S??D', 'id': 137, 'trains': []},
            {'name': 'OST-S??DOST-MITTE', 'id': 145, 'trains': []},
            {'name': 'OST-S??DOST-S??DWEST', 'id': 146, 'trains': []},
            {'name': 'OST-S??DOST-S??D', 'id': 147, 'trains': []},
            {'name': 'OST-MITTE-S??DWEST', 'id': 156, 'trains': []},
            {'name': 'OST-MITTE-S??D', 'id': 157, 'trains': []},
            {'name': 'OST-S??DWEST-S??D', 'id': 167, 'trains': []},
            {'name': 'NORD-WEST-S??DOST', 'id': 234, 'trains': []},
            {'name': 'NORD-WEST-MITTE', 'id': 235, 'trains': []},
            {'name': 'NORD-WEST-S??DWEST', 'id': 236, 'trains': []},
            {'name': 'NORD-WEST-S??D', 'id': 237, 'trains': []},
            {'name': 'NORD-S??DOST-MITTE', 'id': 245, 'trains': []},
            {'name': 'NORD-S??DOST-S??DWEST', 'id': 246, 'trains': []},
            {'name': 'NORD-S??DOST-S??D', 'id': 247, 'trains': []},
            {'name': 'NORD-MITTE-S??DWEST', 'id': 256, 'trains': []},
            {'name': 'NORD-MITTE-S??D', 'id': 257, 'trains': []},
            {'name': 'NORD-S??DWEST-S??D', 'id': 267, 'trains': []},
            {'name': 'WEST-S??DOST-MITTE', 'id': 345, 'trains': []},
            {'name': 'WEST-S??DOST-S??DWEST', 'id': 346, 'trains': []},
            {'name': 'WEST-S??DOST-S??D', 'id': 347, 'trains': []},
            {'name': 'WEST-MITTE-S??DWEST', 'id': 356, 'trains': []},
            {'name': 'WEST-MITTE-S??D', 'id': 357, 'trains': []},
            {'name': 'WEST-S??DWEST-S??D', 'id': 367, 'trains': []},
            {'name': 'S??DOST-MITTE-S??DWEST', 'id': 456, 'trains': []},
            {'name': 'S??DOST-MITTE-S??D', 'id': 457, 'trains': []},
            {'name': 'S??DOST-S??DWEST-S??D', 'id': 467, 'trains': []},
            {'name': 'MITTE-S??DWEST-S??D', 'id': 567, 'trains': []}
        ];
    };

})();