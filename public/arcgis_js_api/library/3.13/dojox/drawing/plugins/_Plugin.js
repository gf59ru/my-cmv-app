//>>built
define("dojox/drawing/plugins/_Plugin",["dojo","../util/oo"],function(a,c){return c.declare(function(b){this._cons=[];a.mixin(this,b);this.button&&this.onClick&&this.connect(this.button,"onClick",this,"onClick")},{util:null,keys:null,mouse:null,drawing:null,stencils:null,anchors:null,canvas:null,node:null,button:null,type:"dojox.drawing.plugins._Plugin",connect:function(){this._cons.push(a.connect.apply(a,arguments))},disconnect:function(b){b&&(a.isArray(b)||(b=[b]),a.forEach(b,a.disconnect,a))}})});