define([
    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',
    'esri/layers/osm'
], function ( Basemap, BasemapLayer, osm ) {
    return {
        map: true, // needs a refrence to the map
        mode: 'custom', //must be either 'agol' (Arc Gis On Line) or 'custom'
        title: 'Базовые карты', // tilte for widget
        mapStartBasemap: 'streets', // must match one of the basemap keys below
        checkingBaseMaps: [ // Базовые карты с проверкой доступности  (если недоступны, не добаляются)
            //{
            //    title: 'Базовая карта', // Заголовок базовой карты
            //    layersUrls: ['http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer'], // url слоёв (эти url проверяются на доступность - если хотя бы один не работает, базовая карта не добавляется)
            //    thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/1719d695725b475ea18c36360afffd68/info/thumbnail/world_street_map.jpg' // url миниатюры
            //}
            {
                title: 'Улицы',
                layersUrls: ['http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer'],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/1719d695725b475ea18c36360afffd68/info/thumbnail/world_street_map.jpg'
            }, {
                title: 'Спутник',
                layersUrls: ['http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/31a8f8ac3edc440c887af79e9ac333cf/info/thumbnail/tempimagery.jpg'
            }, {
                title: 'Гибрид',
                layersUrls: [
                    'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
                    'http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'
                ],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/8d5c5460eb844f4ca17a1082f174a60d/info/thumbnail/imagery_labels.jpg'
            }, {
                title: 'Серая',
                layersUrls: ['http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer'],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/4cd0f55f68154b2d89cadc3fd0ebe027/info/thumbnail/light_gray_canvas.jpg'
            }, {
                title: 'Топографическая',
                layersUrls: ['http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer'],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/99df22d1bb2a47928460096ae7fcc821/info/thumbnail/topo_map_2.jpg'
            }, {
                title: 'National Geographic',
                layersUrls: ['http://services.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer'],
                thumbnailUrl: 'http://www.arcgis.com/sharing/rest/content/items/68d92954841d443bb13cb9ba0fb3b874/info/thumbnail/natgeo.jpg'
            }
    ],
        //basemaps to show in menu. define in basemaps object below and reference by name here
        // TODO Is this array necessary when the same keys are explicitly included/excluded below?
        basemapsToShow: ['streets', 'satellite', 'hybrid', 'topo', 'lightGray', 'gray', 'national-geographic', 'osm', 'oceans'],
        // define all valid custom basemaps here. Object of Basemap objects. For custom basemaps, the key name and basemap id must match.
        basemaps: { // agol basemaps
            /*streets: {
                title: 'Улицы'
            },
            satellite: {
                title: 'Спутник'
            },
            hybrid: {
                title: 'Гибридная'
            },
            topo: {
                title: 'Топография'
            },
            gray: {
                title: 'Серая карта'
            },
            oceans: {
                title: 'Карта океанов'
            },
            'national-geographic': {
                title: 'National Geographic'
            },
            osm: {
                title: 'Open Street Map'
            },
			background: {
                title: 'Локальный фон',
                basemap: new Basemap({
                    id: 'background',
                    layers: [new BasemapLayer({
                        url: 'http://bl101:6080/arcgis/rest/services/Background/MapServer'
                    })]
                })
			}

            // examples of custom basemaps

            /*streets: { // id карты
                title: 'Streets', // наименование
                basemap: new Basemap({
                    id: 'streets', // id карты для виджета галереи карт
                    layers: [new BasemapLayer({ // слои карты
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
                    })]
                })
            },
            satellite: {
                title: 'Satellite',
                basemap: new Basemap({
                    id: 'satellite',
                    layers: [new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                    })]
                })
            },
            hybrid: {
                title: 'Hybrid',
                basemap: new Basemap({
                    id: 'hybrid',
                    layers: [new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                    }), new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
                        isReference: true,
                        displayLevels: [0, 1, 2, 3, 4, 5, 6, 7]
                    }), new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer',
                        isReference: true,
                        displayLevels: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
                    })]
                })
            },
            lightGray: {
                title: 'Light Gray Canvas',
                basemap: new Basemap({
                    id: 'lightGray',
                    layers: [new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer'
                    }), new BasemapLayer({
                        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer',
                        isReference: true
                    })]
                })
            }*/
        }
    };
});