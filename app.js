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
            {'name': 'OST-NORD-SÜDOST', 'id': 124, 'trains': []},
            {'name': 'OST-NORD-MITTE', 'id': 125, 'trains': []},
            {'name': 'OST-NORD-SÜDWEST', 'id': 126, 'trains': []},
            {'name': 'OST-NORD-SÜD', 'id': 127, 'trains': []},
            {'name': 'OST-WEST-SÜDOST', 'id': 134, 'trains': []},
            {'name': 'OST-WEST-MITTE', 'id': 135, 'trains': []},
            {'name': 'OST-WEST-SÜDWEST', 'id': 136, 'trains': []},
            {'name': 'OST-WEST-SÜD', 'id': 137, 'trains': []},
            {'name': 'OST-SÜDOST-MITTE', 'id': 145, 'trains': []},
            {'name': 'OST-SÜDOST-SÜDWEST', 'id': 146, 'trains': []},
            {'name': 'OST-SÜDOST-SÜD', 'id': 147, 'trains': []},
            {'name': 'OST-MITTE-SÜDWEST', 'id': 156, 'trains': []},
            {'name': 'OST-MITTE-SÜD', 'id': 157, 'trains': []},
            {'name': 'OST-SÜDWEST-SÜD', 'id': 167, 'trains': []},
            {'name': 'NORD-WEST-SÜDOST', 'id': 234, 'trains': []},
            {'name': 'NORD-WEST-MITTE', 'id': 235, 'trains': []},
            {'name': 'NORD-WEST-SÜDWEST', 'id': 236, 'trains': []},
            {'name': 'NORD-WEST-SÜD', 'id': 237, 'trains': []},
            {'name': 'NORD-SÜDOST-MITTE', 'id': 245, 'trains': []},
            {'name': 'NORD-SÜDOST-SÜDWEST', 'id': 246, 'trains': []},
            {'name': 'NORD-SÜDOST-SÜD', 'id': 247, 'trains': []},
            {'name': 'NORD-MITTE-SÜDWEST', 'id': 256, 'trains': []},
            {'name': 'NORD-MITTE-SÜD', 'id': 257, 'trains': []},
            {'name': 'NORD-SÜDWEST-SÜD', 'id': 267, 'trains': []},
            {'name': 'WEST-SÜDOST-MITTE', 'id': 345, 'trains': []},
            {'name': 'WEST-SÜDOST-SÜDWEST', 'id': 346, 'trains': []},
            {'name': 'WEST-SÜDOST-SÜD', 'id': 347, 'trains': []},
            {'name': 'WEST-MITTE-SÜDWEST', 'id': 356, 'trains': []},
            {'name': 'WEST-MITTE-SÜD', 'id': 357, 'trains': []},
            {'name': 'WEST-SÜDWEST-SÜD', 'id': 367, 'trains': []},
            {'name': 'SÜDOST-MITTE-SÜDWEST', 'id': 456, 'trains': []},
            {'name': 'SÜDOST-MITTE-SÜD', 'id': 457, 'trains': []},
            {'name': 'SÜDOST-SÜDWEST-SÜD', 'id': 467, 'trains': []},
            {'name': 'MITTE-SÜDWEST-SÜD', 'id': 567, 'trains': []}
        ];
    };

})();