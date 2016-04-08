//>>built
define("dojox/mobile/app/SceneController",["dijit","dojo","dojox","dojo/require!dojox/mobile/_base"],function(k,c,d){c.provide("dojox.mobile.app.SceneController");c.experimental("dojox.mobile.app.SceneController");c.require("dojox.mobile._base");(function(){var h=d.mobile.app,g={};c.declare("dojox.mobile.app.SceneController",d.mobile.View,{stageController:null,keepScrollPos:!1,init:function(a,b){this.sceneName=a;this.params=b;var d=h.resolveTemplate(a);this._deferredInit=new c.Deferred;g[a]?this._setContents(g[a]):
c.xhrGet({url:d,handleAs:"text"}).addCallback(c.hitch(this,this._setContents));return this._deferredInit},_setContents:function(a){g[this.sceneName]=a;this.domNode.innerHTML="\x3cdiv\x3e"+a+"\x3c/div\x3e";var b="";a=this.sceneName.split("-");for(var f=0;f<a.length;f++)b+=a[f].substring(0,1).toUpperCase()+a[f].substring(1);this.sceneAssistantName=b+="Assistant";var e=this;d.mobile.app.loadResourcesForScene(this.sceneName,function(){console.log("All resources for ",e.sceneName," loaded");if("undefined"!=
typeof c.global[b])e._initAssistant();else{var a=h.resolveAssistant(e.sceneName);c.xhrGet({url:a,handleAs:"text"}).addCallback(function(a){try{c.eval(a)}catch(b){throw console.log("Error initializing code for scene "+e.sceneName+". Please check for syntax errors"),b;}e._initAssistant()})}})},_initAssistant:function(){console.log("Instantiating the scene assistant "+this.sceneAssistantName);var a=c.getObject(this.sceneAssistantName);if(!a)throw Error("Unable to resolve scene assistant "+this.sceneAssistantName);
this.assistant=new a(this.params);this.assistant.controller=this;this.assistant.domNode=this.domNode.firstChild;this.assistant.setup();this._deferredInit.callback()},query:function(a,b){return c.query(a,b||this.domNode)},parse:function(a){a=this._widgets=d.mobile.parser.parse(a||this.domNode,{controller:this});for(var b=0;b<a.length;b++)a[b].set("controller",this)},getWindowSize:function(){return{w:c.global.innerWidth,h:c.global.innerHeight}},showAlertDialog:function(a){c.marginBox(this.assistant.domNode);
a=new d.mobile.app.AlertDialog(c.mixin(a,{controller:this}));this.assistant.domNode.appendChild(a.domNode);console.log("Appended ",a.domNode," to ",this.assistant.domNode);a.show()},popupSubMenu:function(a){var b=new d.mobile.app.ListSelector({controller:this,destroyOnHide:!0,onChoose:a.onChoose});this.assistant.domNode.appendChild(b.domNode);b.set("data",a.choices);b.show(a.fromNode)}})})()});