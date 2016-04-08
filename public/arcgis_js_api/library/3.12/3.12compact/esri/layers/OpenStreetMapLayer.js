// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.12/esri/copyright.txt for details.
//>>built
define("esri/layers/OpenStreetMapLayer","dojo/_base/declare dojo/_base/lang dojo/has ../kernel ../urlUtils ../SpatialReference ../geometry/Extent ./TiledMapServiceLayer ./TileInfo".split(" "),function(b,d,e,f,g,h,c,k,l){b=b(k,{declaredClass:"esri.layers.OpenStreetMapLayer",constructor:function(a){this.spatialReference=new h({wkid:102100});this.tileInfo=new l({rows:256,cols:256,dpi:96,format:"PNG8",compressionQuality:0,origin:{x:-2.0037508342787E7,y:2.0037508342787E7},spatialReference:{wkid:102100},
lods:[{level:0,scale:5.91657527591555E8,resolution:156543.033928},{level:1,scale:2.95828763795777E8,resolution:78271.5169639999},{level:2,scale:1.47914381897889E8,resolution:39135.7584820001},{level:3,scale:7.3957190948944E7,resolution:19567.8792409999},{level:4,scale:3.6978595474472E7,resolution:9783.93962049996},{level:5,scale:1.8489297737236E7,resolution:4891.96981024998},{level:6,scale:9244648.868618,resolution:2445.98490512499},{level:7,scale:4622324.434309,resolution:1222.99245256249},{level:8,
scale:2311162.217155,resolution:611.49622628138},{level:9,scale:1155581.108577,resolution:305.748113140558},{level:10,scale:577790.554289,resolution:152.874056570411},{level:11,scale:288895.277144,resolution:76.4370282850732},{level:12,scale:144447.638572,resolution:38.2185141425366},{level:13,scale:72223.819286,resolution:19.1092570712683},{level:14,scale:36111.909643,resolution:9.55462853563415},{level:15,scale:18055.954822,resolution:4.77731426794937},{level:16,scale:9027.977411,resolution:2.38865713397468},
{level:17,scale:4513.988705,resolution:1.19432856685505},{level:18,scale:2256.994353,resolution:0.597164283559817},{level:19,scale:1128.497176,resolution:0.298582141647617}]});this.fullExtent=new c({xmin:-2.003750834E7,ymin:-2.003750834E7,xmax:2.003750834E7,ymax:2.003750834E7,spatialReference:{wkid:102100}});this.initialExtent=new c({xmin:-2.003750834E7,ymin:-2.003750834E7,xmax:2.003750834E7,ymax:2.003750834E7,spatialReference:{wkid:102100}});this.tileServers=a&&a.tileServers||["http://a.tile.openstreetmap.org",
"http://b.tile.openstreetmap.org","http://c.tile.openstreetmap.org"];this.serversLength=this.tileServers.length;this._displayLevels=a?a.displayLevels:null;this.copyright=a&&a.copyright||"Map data \x26copy; OpenStreetMap contributors, CC-BY-SA";this.loaded=!0;this.onLoad(this);(a=a&&a.loadCallback)&&a(this)},getTileUrl:function(a,b,c){a=this.tileServers[b%this.serversLength]+"/"+a+"/"+c+"/"+b+".png";a=this.addTimestampToURL(a);return g.addProxy(a)}});e("extend-esri")&&d.setObject("layers.OpenStreetMapLayer",
b,f);return b});