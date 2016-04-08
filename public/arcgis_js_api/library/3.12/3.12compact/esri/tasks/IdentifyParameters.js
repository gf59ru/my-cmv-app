// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.12/esri/copyright.txt for details.
//>>built
define("esri/tasks/IdentifyParameters","dojo/_base/declare dojo/_base/lang dojo/_base/array dojo/_base/json dojo/has ../kernel ../layerUtils ../geometry/jsonUtils ../geometry/scaleUtils".split(" "),function(g,e,h,f,n,p,k,q,r){var d=g(null,{declaredClass:"esri.tasks.IdentifyParameters",constructor:function(){this.layerOption=d.LAYER_OPTION_TOP},geometry:null,spatialReference:null,layerIds:null,tolerance:null,returnGeometry:!1,mapExtent:null,width:400,height:400,dpi:96,layerDefinitions:null,timeExtent:null,
layerTimeOptions:null,dynamicLayerInfos:null,toJson:function(b){var c=b&&b.geometry||this.geometry,a=this.mapExtent,d=this.spatialReference,e=this.layerIds;b={tolerance:this.tolerance,returnGeometry:this.returnGeometry,imageDisplay:this.width+","+this.height+","+this.dpi,maxAllowableOffset:this.maxAllowableOffset};if(c){var l=c.toJson();delete l.spatialReference;b.geometry=f.toJson(l);b.geometryType=q.getJsonType(c)}d?b.sr=d.wkid||f.toJson(d.toJson()):c&&c.spatialReference?b.sr=c.spatialReference.wkid||
f.toJson(c.spatialReference.toJson()):a&&a.spatialReference&&(b.sr=a.spatialReference.wkid||f.toJson(a.spatialReference.toJson()));a&&(b.mapExtent=a.xmin+","+a.ymin+","+a.xmax+","+a.ymax);b.layers=this.layerOption;e&&(b.layers+=":"+e.join(","));b.layerDefs=k._serializeLayerDefinitions(this.layerDefinitions);c=this.timeExtent;b.time=c?c.toJson().join(","):null;b.layerTimeOptions=k._serializeTimeOptions(this.layerTimeOptions);if(this.dynamicLayerInfos&&0<this.dynamicLayerInfos.length){var a=r.getScale({extent:a,
width:this.width,spatialReference:a.spatialReference}),g=k._getLayersForScale(a,this.dynamicLayerInfos),m=[];h.forEach(this.dynamicLayerInfos,function(b){if(!b.subLayerIds){var a=b.id;if((!this.layerIds||this.layerIds&&-1!==h.indexOf(this.layerIds,a))&&-1!==h.indexOf(g,a)){var c={id:a};c.source=b.source&&b.source.toJson();var d;this.layerDefinitions&&this.layerDefinitions[a]&&(d=this.layerDefinitions[a]);d&&(c.definitionExpression=d);var e;this.layerTimeOptions&&this.layerTimeOptions[a]&&(e=this.layerTimeOptions[a]);
e&&(c.layerTimeOptions=e.toJson());m.push(c)}}},this);a=f.toJson(m);"[]"===a&&(a="[{}]");b.dynamicLayers=a}return b}});e.mixin(d,{LAYER_OPTION_TOP:"top",LAYER_OPTION_VISIBLE:"visible",LAYER_OPTION_ALL:"all"});n("extend-esri")&&e.setObject("tasks.IdentifyParameters",d,p);return d});