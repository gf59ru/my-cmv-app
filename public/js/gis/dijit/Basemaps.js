define([
    'dojo/dom',
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dijit/DropDownMenu',
    'dijit/MenuItem',
    'dojo/_base/array',
    'dojox/lang/functional',
    'dojo/text!./Basemaps/templates/Basemaps.html',
    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',
    'esri/dijit/BasemapGallery',
    'dijit/form/DropDownButton',
    'xstyle/css!./Basemaps/css/Basemaps.css'
], function (dom,
             declare,
             _WidgetBase,
             _TemplatedMixin,
             _WidgetsInTemplateMixin,
             lang,
             DropDownMenu,
             MenuItem,
             array,
             functional,
             template,
             Basemap,
             BasemapLayer,
             BasemapGallery) {

    // main basemap widget
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        widgetsInTemplate: true,
        mode: 'custom',
        title: 'Basemaps',
        //baseClass: 'gis_Basemaps_Dijit',
        //buttonClass: 'gis_Basemaps_Button',
        //menuClass: 'gis_Basemaps_Menu',
        //mapStartBasemap: 'streets',
        //basemapsToShow: ['streets', 'satellite', 'hybrid', 'topo', 'gray', 'oceans', 'national-geographic', 'osm'],
        //validBasemaps: [],
        postCreate: function () {
            this.inherited(arguments);
            /*var mybasemaps = [];
            if (this.mode === 'custom') {
                var basemapLayer = new BasemapLayer({
                    url: esriConfig.defaults.backgroundService
                });
                var basemap = new Basemap({ // Добавление локального фона в список базовых карт, не работает без добавления ArcGISTiledMapServiceLayer в карту (Controller.js, initMap)
                    layers: [basemapLayer],
                    title: 'Локальный фон'
                });
                mybasemaps.push(basemap);
                this.gallery = new BasemapGallery({
                    map: this.map,
                    showArcGISBasemaps: false,
                    basemaps: mybasemaps//this.basemaps
                }, 'basemapsDijit');
                // if (this.map.getBasemap() !== this.mapStartBasemap) { //based off the title of custom basemaps in viewer.js config
                //     this.gallery.select(this.mapStartBasemap);
                // }
                this.gallery.startup();

                array.forEach(this.checkingBaseMaps, function (bm) {
                    this.checkAndAddBasemap(bm.title, bm.layersUrls, bm.thumbnailUrl);
                }, this);

            }*/
            //this.menu = new DropDownMenu({
            //    style: 'display: none;' //,
            //    //baseClass: this.menuClass
            //});
            //
            //array.forEach(mybasemaps/*this.basemapsToShow*/, function (basemap) {
            //    if (this.basemaps.hasOwnProperty(basemap)) {
            //        var menuItem = new MenuItem({
            //            id: basemap,
            //            label: this.basemaps[basemap].title,
            //            iconClass: (basemap == this.mapStartBasemap) ? 'selectedIcon' : 'emptyIcon',
            //            onClick: lang.hitch(this, function () {
            //                if (basemap !== this.currentBasemap) {
            //                    this.currentBasemap = basemap;
            //                    if (this.mode === 'custom') {
            //                        this.gallery.select(basemap);
            //                    } else {
            //                        this.map.setBasemap(basemap);
            //                    }
            //                    var ch = this.menu.getChildren();
            //                    array.forEach(ch, function (c) {
            //                        if (c.id == basemap) {
            //                            c.set('iconClass', 'selectedIcon');
            //                        } else {
            //                            c.set('iconClass', 'emptyIcon');
            //                        }
            //                    });
            //                }
            //            })
            //        });
            //        this.menu.addChild(menuItem);
            //    }
            //}, this);
            //
            //this.dropDownButton.set('dropDown', this.menu);
        },
        /**
         * Добавление базовой карты
         * @param(title) заголовок базовой карты
         * @param(urls) ссылки на слои карты
         * @param(thumbnailUrl) ссылка на миниатюру
         * */
        addBasemap: function (title, urls, thumbnailUrl) {
            var basemapLayers = [];
            for (var i = 0; i < urls.length; i++) {
                var basemapLayer = new BasemapLayer({
                    url: urls[i]
                });
                basemapLayers.push(basemapLayer);
            }
            var basemap = new Basemap({
                layers: basemapLayers,
                thumbnailUrl: thumbnailUrl,
                title: title
            });
            if (!this.gallery.add(basemap))
                console.log('can\'t add basemap from ' + urls);
        },
        /**
         * Добавление базовой карты с проверкой доступности ссылок на слои
         * @param(title) заголовок базовой карты
         * @param(urls) ссылки на слои карты
         * @param(thumbnailUrl) ссылка на миниатюру
         * */
        checkAndAddBasemap: function (title, urls, thumbnailUrl) {
            if (urls) {
                for (var i = 0; i < urls.length; i++) {
                    var url = urls[i];
                    var completed = 0;
                    var request = new XMLHttpRequest();
                    request.open('GET', url, true);
                    request.onreadystatechange = lang.hitch(this, function () {
                        if (request.readyState === 4) {
                            if (request.status == 200) {
                                completed++;
                                if (completed == urls.length) {
                                    this.addBasemap(title, urls, thumbnailUrl);
                                }
                            }
                            else
                                console.log('basemap layer at ' + urls + ' for «' + title + '» is not available: HTTP' + request.status);
                        }
                    });
                    request.send();
                }
            }
        },
        startup: function () {
            this.inherited(arguments);
            /*if (this.mode === 'custom') {
                if (this.map.getBasemap() !== this.mapStartBasemap) { //based off the title of custom basemaps in viewer.js config
                    this.gallery.select(this.mapStartBasemap);
                }
            } else {
                if (this.mapStartBasemap) {
                    if (this.map.getBasemap() !== this.mapStartBasemap) { //based off the agol basemap name
                        this.map.setBasemap(this.mapStartBasemap);
                    }
                }
            }*/
        }
    });
});
