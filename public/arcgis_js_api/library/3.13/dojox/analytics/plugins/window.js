//>>built
define("dojox/analytics/plugins/window",["dojo/_base/lang","../_base","dojo/ready","dojo/_base/config","dojo/aspect"],function(c,d,e,f,g){return d.plugins.window=new function(){this.addData=c.hitch(d,"addData","window");this.windowConnects=f.windowConnects||["open","onerror"];for(var a=0;a<this.windowConnects.length;a++)g.after(window,this.windowConnects[a],c.hitch(this,"addData",this.windowConnects[a]),!0);e(c.hitch(this,function(){var a={},b;for(b in window)if("object"==typeof window[b]||"function"==
typeof window[b])switch(b){case "location":case "console":a[b]=window[b]}else a[b]=window[b];this.addData(a)}))}});