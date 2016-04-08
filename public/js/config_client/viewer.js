define([
	'esri/units',
	'esri/geometry/Extent',
	'esri/config',
	'esri/tasks/GeometryService',
	'esri/layers/FeatureLayer',
	'esri/layers/ImageParameters',
	'esri/SpatialReference',
	'dojo/_base/lang',
	'dojo/promise/all',
	'esri/tasks/QueryTask',
	'esri/tasks/query'
], function (units,
             Extent,
             esriConfig,
             GeometryService,
             FeatureLayer,
             ImageParameters,
             SpatialReference,
             lang,
             all,
             QueryTask,
             Query) {

	// url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
	esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
	esriConfig.defaults.io.alwaysUseProxy = false;
	/**
	 * Сервер карт
	 * */
	esriConfig.defaults.mapServer = 'http://bl101:6080/';
	/**
	 * Ссылка на папку сервисов на сервере
	 * */
	esriConfig.defaults.mapServicesFolder = esriConfig.defaults.mapServer + 'arcgis/rest/services/';
	/**
	 * Создание подключения к сервису геометрии
	 * */
	esriConfig.defaults.createGeometryService = function () {
		return new GeometryService(esriConfig.defaults.mapServicesFolder + 'Utilities/Geometry/GeometryServer');
	};
	/**
	 * Подключение к сервису геометрии по умолчанию
	 * */
	esriConfig.defaults.geometryService = esriConfig.defaults.createGeometryService();
	/**
	 * Сервис карт
	 * */
	esriConfig.defaults.mapService = esriConfig.defaults.mapServicesFolder + 'Geology/CalcReserve/MapServer/';
	/**
	 * Сервис фона для базовой карты
	 * */
	esriConfig.defaults.backgroundService = esriConfig.defaults.mapServicesFolder + 'Background_Ber/MapServer/';
	/**
	 * Ссылка на слой для подсчёта запасов
	 */
	esriConfig.defaults.calcBlocksLayerURL = esriConfig.defaults.mapServicesFolder + 'Geology/Reserve/MapServer/9';
	/**
	 * Слой для подсчёта запасов
	 */
	esriConfig.defaults.calcBlocksLayer = new FeatureLayer(esriConfig.defaults.calcBlocksLayerURL, {
		outFields: '*'
	});
	/**
	 * Локальная система координат Березников
	 * */
	esriConfig.defaults.spatialReferenceBer = new SpatialReference('PROJCS["Uralkaly Ber Local",GEOGCS["GCS_Pulkovo_1942",DATUM["D_Pulkovo_1942",SPHEROID["Krasovsky_1940",6378245.0,298.3]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Gauss_Kruger"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",57.0],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]');
	/**
	 * Локальная система координат Соликамска
	 * */
	esriConfig.defaults.spatialReferenceSol = new SpatialReference('PROJCS["Uralkaly Sol Local",GEOGCS["GCS_Pulkovo_1942",DATUM["D_Pulkovo_1942",SPHEROID["Krasovsky_1940",6378245.0,298.3]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Gauss_Kruger"],PARAMETER["False_Easting",22000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",57.0],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]');
	/**
	 * Функция форматирования даты для запросов
	 * */
	esriConfig.defaults.queryDateFormat = function (date) {
		return '\'' + kendo.format('{0:dd.MM.yyyy}', date) + '\'';
		//return 'date\'' + kendo.format('{0:dd.MM.yyyy}', date) + '\''; // oracle
	};
	// Константы
	/**
	 * Множитель для ресурса K2O (доля в KCl)
	 * @type {number}
	 */
	esriConfig.defaults.K2OMultiplier = .6318;
	/**
	 * Множитель для ресурса MgO (доля в MgCl2)
	 * @type {number}
	 */
	esriConfig.defaults.MgOMultiplier = .4233;
	/**
	 * Минимальная площадь пересечения блоков
	 * @type {number}
	 */
	esriConfig.defaults.minIntersectAreaWarning = 10;
	/**
	 * Максимальная разница между документальной и подсчитанной площадями
	 * @type {number}
	 */
	esriConfig.defaults.maxAreasDifferentWarning = .1;

	//image parameters for dynamic services, set to png32 for higher quality exports.
	var imageParameters = new ImageParameters();
	imageParameters.format = 'png32';

	return {
		// used for debugging your app
		isDebug: false,

		//default mapClick mode, mapClickMode lets widgets know what mode the map is in to avoid multipult map click actions from taking place (ie identify while drawing).
		defaultMapClickMode: 'identify',
		// map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
		mapOptions: { // Опции создания карты
			//basemap: 'streets', // id базовой карты
			//center: [56.783877, 59.622145], // центр
			//zoom: 13, // увеличение
			logo: false,
			/*extent: new Extent({ // Соликамская система координат
			 xmin: 20925.599999999627,
			 xmax: 37004.588300000876,
			 ymin: 31599.016600000163,
			 ymax: 53144.87010000087,
			 spatialReference: esriConfig.defaults.spatialReferenceSol
			 }),
			 /**/extent: new Extent({ // Березниковская система координат
				xmin: -5107.414499999955,
				xmax: 28630.6875,
				ymin: -8452.9916999992,
				ymax: 55391.35119999945,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			}), /**/
			sliderStyle: 'small' // По документации должно влиять на размер слайдера (изменение масштаба карты), но не влияет
		},
		panes: { // Настройка дополнительных панелей виджетов
			left: {
				splitter: true
			},
			/*right: {
			 id: 'sidebarRight',
			 placeAt: 'outer',
			 region: 'right',
			 splitter: true,
			 collapsible: true
			 },
			 bottom: {
			 id: 'sidebarBottom',
			 placeAt: 'outer',
			 splitter: true,
			 collapsible: true,
			 region: 'bottom'
			 },*/
			top: {
				id: 'sidebarTop',
				placeAt: 'outer',
				collapsible: false,
				splitter: false,
				region: 'top'
			}
		},
		collapseButtonsPane: 'center', //center or outer

		// operationalLayers: Array of Layers to load on top of the basemap: valid 'type' options: 'dynamic', 'tiled', 'feature'.
		// The 'options' object is passed as the layers options for constructor. Title will be used in the legend only. id's must be unique and have no spaces.
		// 3 'mode' options: MODE_SNAPSHOT = 0, MODE_ONDEMAND = 1, MODE_SELECTION = 2
		operationalLayers: [
		{
			type: 'feature',
			url: esriConfig.defaults.mapService + '1',
			title: 'Скважины MineScape поверхностные',
			options: {
				id: 'holesMSSurface',
				opacity: .5,
				visible: false,
				outFields: ['DHHOLENAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '2',
			title: 'Скважины MineScape подземные',
			options: {
				id: 'holesMSUnderground',
				opacity: .5,
				visible: false,
				outFields: ['DHHOLENAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '4',
			title: 'Скважины Геоконструктор поверхностные',
			options: {
				id: 'geoconstructorHolesFromSurface',
				opacity: .5,
				visible: false,
				outFields: ['Skvag_id'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '5',
			title: 'Скважины Геоконструктор подземные',
			options: {
				id: 'geoconstructorHolesUnderground',
				opacity: .5,
				visible: false,
				outFields: ['Skvag_id'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
/*		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '6',
			title: 'Нефтяные структуры\nи месторождения',
			options: {
				id: 'oilfields',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '7',
			title: 'Зоны санитарной охраны\nпресных вод',
			options: {
				id: 'waterSanitaryZone',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}*/
		}, {
			type: 'dynamic',
			url: esriConfig.defaults.mapServicesFolder + 'Marksh/AnomalyVZT/MapServer/',
			title: 'Аномальные зоны строения ВЗТ',
			slider: false,
			noLegend: true,
			collapsed: true,
			sublayerToggle: false, //true to automatically turn on sublayers
			options: {
				id: 'abnormalVZT',
				opacity: .8,
				visible: false,
			},
			identifyLayerInfos: {
				layerIds: [0,1,2,3,4]
			}
		}, {
			type: 'dynamic',
			url: esriConfig.defaults.mapServicesFolder + 'Marksh/Pillar/MapServer/',
			title: 'Целики барьерные и предохранительные',
			slider: false,
			noLegend: true,
			collapsed: true,
			sublayerToggle: false, //true to automatically turn on sublayers
			options: {
				id: 'pillar',
				opacity: .8,
				visible: false,
			},
			identifyLayerInfos: {
				layerIds: [1,2,3,5,6,7,8,10,11,12,13,14,16,17,18,19,21,22,23,24]
			}
/*		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '10',
			title: 'Границы блоков подсчета запасов пл. Кр II',
			options: {
				id: 'balancebKrII',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '11',
			title: 'Балансовая принадлежность запасов пл. Кр II',
			options: {
				id: 'balanceKrII',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '13',
			title: 'Границы блоков подсчета запасов пл. АБ',
			options: {
				id: 'balancebAB',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '14',
			title: 'Балансовая принадлежность запасов пл. АБ',
			options: {
				id: 'balanceAB',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '16',
			title: 'Границы блоков подсчета запасов пл. В',
			options: {
				id: 'balancebV',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '17',
			title: 'Балансовая принадлежность запасов пл. В',
			options: {
				id: 'balanceV',
				opacity: .5,
				visible: false,
				outFields: ['NAME', 'OBJECTID'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}*/
		}, {
			type: 'dynamic',
			url: esriConfig.defaults.mapServicesFolder + 'Geology/Reserve/MapServer/',
			title: 'Блоки подсчета запасов',
			slider: false,
			noLegend: true,
			collapsed: false,
			sublayerToggle: false, //true to automatically turn on sublayers
			options: {
				id: 'reserve',
				opacity: .5,
				visible: true,
			},
			identifyLayerInfos: {
				layerIds: [2,5,8]
			}
		}, {
			type: 'dynamic',
			url: esriConfig.defaults.mapServicesFolder + 'GMBase_2/MapServer/',
			title: 'Геолого-маркшейдерская основа',
			slider: false,
			noLegend: true,
			collapsed: true,
			sublayerToggle: false, //true to automatically turn on sublayers
			options: {
				id: 'gmbase',
				opacity: .8,
				visible: true,
			},
			identifyLayerInfos: {
				layerIds: [6,7,8,9,10,11]
			}
/*		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '19',
			title: 'Горные отводы',
			options: {
				id: 'miningLeases',
				opacity: .5,
				visible: false,
				outFields: ['*'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '20',
			title: 'Геологические участки',
			options: {
				id: 'geoAreas',
				opacity: .5,
				visible: false,
				outFields: ['*'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '21',
			title: 'Границы калийной залежи',
			options: {
				id: 'potassiumBoundary',
				opacity: .5,
				visible: false,
				outFields: ['*'],
				mode: 1
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			} */
		}/*, {
			type: 'feature',
			url: esriConfig.defaults.mapService + '16',
			title: 'Скважины тест',
			options: {
				id: 'HolesTest',
				opacity: .5,
				visible: false,
				outFields: ['*'],
				mode: 0
			},
			editorLayerInfos: {
				disableGeometryUpdate: false
			}
		}*/
			/*, {
			 type: 'feature',
			 url: 'http://qwerty-3:6080/arcgis/rest/services/Test/Wells_MS/MapServer/3',
			 title: 'Балансовая принадлежность запасов пл. Кр II',
			 options: {
			 id: 'balanceKrII',
			 opacity: .5,
			 visible: true,
			 outFields: ['*'],
			 mode: 0
			 },
			 editorLayerInfos: {
			 disableGeometryUpdate: false
			 }
			 }, {
			 type: 'feature',
			 url: 'http://qwerty-3:6080/arcgis/rest/services/Test/Wells_MS/MapServer/4',
			 title: 'Балансовая принадлежность запасов пл. АБ',
			 options: {
			 id: 'balanceAB',
			 opacity: .5,
			 visible: true,
			 outFields: ['*'],
			 mode: 0
			 },
			 editorLayerInfos: {
			 disableGeometryUpdate: false
			 }
			 }, {
			 type: 'feature',
			 url: 'http://qwerty-3:6080/arcgis/rest/services/Test/Wells_MS/MapServer/5',
			 title: 'Балансовая принадлежность запасов пл. В',
			 options: {
			 id: 'balanceV',
			 opacity: .5,
			 visible: true,
			 outFields: ['*'],
			 mode: 0
			 },
			 editorLayerInfos: {
			 disableGeometryUpdate: false
			 }
			 }, {
			 type: 'feature',
			 url: 'http://qwerty-3:6080/arcgis/rest/services/Test/Wells_MS/MapServer/0',
			 title: 'Скважины',
			 options: {
			 id: 'holes',
			 opacity: .5,
			 visible: true,
			 outFields: ['*'],
			 mode: 0
			 },
			 editorLayerInfos: {
			 disableGeometryUpdate: false
			 }
			 }*/],

		// set include:true to load. For titlePane type set position the the desired order in the sidebar
		widgets: { // Конфигурация виджетов https://github.com/cmv/cmv-app/wiki/Configuration-file-viewer.js#widget-section
			//widget: {
			//	include: true, // Загружать описание виджета
			//	id: 'widget', // id виджета
			//	type: 'domNode', // тип: floating, titlePane - в панели виджетов, map - на карте, domNode - в указанном html элементе, invisible, other - моя опция для базовых карт
			//  canFloat: true, // Можно ли перемещать виджет (только с type=titlePane)
			//  placeAt: top, right, bottom, // Выбор панели расположения виджета (только с type=titlePane, нужна секция panes:{})
			//	path: 'gis/dijit/Widget', // Путь к файлу описания виджета
			//	srcNodeRef: 'growlerDijit', // html элемент, где будет располагаться виджет (только с type=domNode)
			//  options: { // дополнительные настройки виджета, кроме списка в справке cmv, могут быть свои
			//},
			growler: {
				include: true,
				id: 'growler',
				type: 'domNode',
				path: 'gis/dijit/Growler',
				srcNodeRef: 'growlerDijit',
				options: {}
			},
			/*geocoder: {
			 include: true,
			 id: 'geocoder',
			 type: 'domNode',
			 path: 'gis/dijit/Geocoder',
			 srcNodeRef: 'geocodeDijit',
			 options: {
			 map: true,
			 mapRightClickMenu: true,
			 geocoderOptions: {
			 autoComplete: true,
			 arcgisGeocoder: {
			 placeholder: 'Enter an address or place'
			 }
			 }
			 }
			 },*/
			identify: {
				include: true,
				id: 'identify',
				type: 'titlePane',
				path: 'gis/dijit/Identify',
				title: 'Идентификация',
				open: false,
				position: 3,
				options: 'config/identify'
			},
			/*basemaps: {
			 include: true,
			 id: 'basemaps',
			 type: 'other',// 'domNode',
			 path: 'gis/dijit/Basemaps',
			 srcNodeRef: 'basemapsDijit',
			 options: 'config/basemaps'
			 },*/
			systemsOfAxes: { // Выбор системы координат для расчётов
				include: true,
				id: 'systemsOfAxes',
				type: 'domNode',
				path: 'gis/dijit/SystemOfAxes',
				srcNodeRef: 'systemOfAxes',
				options: {
					selectedSpatialReference: esriConfig.defaults.spatialReferenceBer,
					systemsList: [
						{
							title: 'Березники',
							spatialReference: esriConfig.defaults.spatialReferenceBer
						}, {
							title: 'Соликамск',
							spatialReference: esriConfig.defaults.spatialReferenceSol
						}
					]
				}
			},
			mapInfo: {
				include: false,
				id: 'mapInfo',
				type: 'domNode',
				path: 'gis/dijit/MapInfo',
				srcNodeRef: 'mapInfoDijit',
				options: {
					map: true,
					mode: 'dms',
					firstCoord: 'y',
					unitScale: 3,
					showScale: true,
					xLabel: '',
					yLabel: '',
					minWidth: 286
				}
			},
			scalebar: {
				include: true,
				id: 'scalebar',
				type: 'map',
				path: 'esri/dijit/Scalebar',
				options: {
					map: true,
					attachTo: 'bottom-left',
					scalebarStyle: 'ruler',
					scalebarUnit: 'metric'
				}
			},
			locateButton: {
				include: true,
				id: 'locateButton',
				type: 'domNode',
				path: 'gis/dijit/LocateButton',
				srcNodeRef: 'locateButton',
				options: {
					map: true,
					publishGPSPosition: true,
					highlightLocation: true,
					useTracking: true,
					geolocationOptions: {
						maximumAge: 0,
						timeout: 15000,
						enableHighAccuracy: true
					}
				}
			},
			/*overviewMap: {
			 include: true,
			 id: 'overviewMap',
			 type: 'map',
			 path: 'esri/dijit/OverviewMap',
			 options: {
			 map: true,
			 attachTo: 'bottom-right',
			 color: '#0000CC',
			 height: 100,
			 width: 125,
			 opacity: 0.30,
			 visible: false
			 }
			 },*/
			homeButton: {
				include: true,
				id: 'homeButton',
				type: 'domNode',
				path: 'esri/dijit/HomeButton',
				srcNodeRef: 'homeButton',
				options: {
					map: true,
					extent: new Extent({ // Березниковская система координат
						xmin: -15107.414499999955,
						xmax: 28630.6875,
						ymin: -28452.9916999992,
						ymax: 115391.35119999945,
						spatialReference: esriConfig.defaults.spatialReferenceBer
					})
				}
			},
			timeSlider: {
				include: true,
				id: 'timeSlider',
				type: 'domNode',
				path: 'esri/dijit/TimeSlider',
				widgetPrepare: function (controller, timeSliderWidget) {
					function loadingDateIgnoringTimeZone (date) {
						var offset = date.getTimezoneOffset();
						var result = new Date(date.getTime() + offset * 60000);
						return result;
					}

					function extracted (date) {
						var offset = date.getTimezoneOffset();
						var gmt = 'GMT' + (offset > 0 ? '-' : '+');
						gmt += Math.floor(Math.abs(offset) / 60).toString();
						var gmtMinutes = Math.abs(offset) % 60;
						if (gmtMinutes == 0)
							gmt += '00';
						else if (gmtMinutes < 10)
							gmt += '0' + gmtMinutes.toString();
						else
							gmt += gmtMinutes.toString();
						return new Date((date.getMonth() + 1).toString() + '/' + date.getDate().toString() + '/' + date.getFullYear().toString() + '/' + gmt);
					}

					if (controller) {
						// функция запроса временных отметок из слоя
						var queryTimes = function (layer) {
							if (layer.loaded && layer.timeInfo) {
								var query = new Query();
								query.returnGeometry = false;
								query.where = '1=1';
								query.outFields = [];
								if (layer.timeInfo.startTimeField)
									query.outFields.push(layer.timeInfo.startTimeField);
								if (layer.timeInfo.endTimeField)
									query.outFields.push(layer.timeInfo.endTimeField);
								//query.orderByFields = [layer.timeInfo.startTimeField, layer.timeInfo.endTimeField];
								//query.returnDistinctValues = true;
								if (layer.queryFeatures)
									queries.push(layer.queryFeatures(query, undefined, function (error) {
										//console.log(layer, error);
									}));
								else if (layer.layerInfos && layer.visibleLayers && layer.visibleLayers.length > 0) {
									for (var j = 0; j < layer.visibleLayers.length; j++) {
										var id = layer.visibleLayers[j];
										if (id >= 0 && !layer.layerInfos[id].subLayerIds) {
											var url = layer.url + layer.visibleLayers[j];
											var qTask = new QueryTask(url);
											queries.push(qTask.execute(query));
										}
									}
								}
							}
						};

						// запуск запросов временных отметок
						// сначала слой расчёта запасов, потом перебор всех видимых слоёв
						var queries = [];
						queryTimes(esriConfig.defaults.calcBlocksLayer);
						for (var i = 0; i < controller.layers.length; i++) {
							queryTimes(controller.layers[i]);
						}
						// когда результаты запросов готовы, таймслайдер заполняется временными отметками
						var promise = all(queries);
						promise.then(lang.hitch(this, function (results) {
							var timeStopsNumeric = [];
							// функция проверки поля со временем, если есть - значение поля добавляется в результат
							function getTimeStop (feature, field) {
								if (field) {
									var stop = feature.attributes[field];
									if (stop && timeStopsNumeric.indexOf(stop) < 0)
										timeStopsNumeric.push(stop);
								}
							}

							for (var i = 0; i < results.length; i++) {
								if (results[i].features &&
									results[i].features.length > 0 &&
									results[i].features[0]._layer) {
									for (var j = 0; j < results[i].features.length; j++) {
										var feature = results[i].features[j];
										var layer = feature._layer;
										getTimeStop(feature, layer.timeInfo.startTimeField);
										//getTimeStop(feature, layer.timeInfo.endTimeField);
									}
								}
							}
							// передача результатов в виджет, запуск виджета
							if (timeStopsNumeric.length > 0) {
								controller.map.setTimeSlider(timeSliderWidget);
								//timeStopsNumeric.sort();
								var timeStops = timeStopsNumeric.map(function (stop) {
									return new Date(stop);
								});
								timeStops.sort(function (a, b) {
									return a - b;
								});
								var min = timeStops[0];
								var max = timeStops[timeStops.length - 1];
								timeSliderWidget.setTimeStops(timeStops);
								var labels = [];
								for (var i = 0; i < timeStops.length; i++) {
									if (i == 0 || i == timeStops.length - 1) {
										var date = loadingDateIgnoringTimeZone(timeStops[i]);
										date = extracted(date);
										var d = date.getDate();
										var m = date.getMonth() + 1;
										var y = date.getFullYear();
										labels.push(d.toString() + '.' + (m < 10 ? '0' : '') + m.toString() + '.' + y.toString());
									}
									else
										labels.push('');
								}
								timeSliderWidget.setLabels(labels);
								/*timeSliderWidget.setLabels(timeStops.map(function (stop) {
								 var date = loadingDateIgnoringTimeZone(stop);
								 date = extracted(date);
								 var d = date.getDate();
								 var m = date.getMonth() + 1;
								 var y = date.getFullYear();
								 return d.toString() + '.' + (m < 10 ? '0' : '') + m.toString() + '.' + y.toString();
								 }));*/
								timeSliderWidget.setThumbCount(1);
								timeSliderWidget.setThumbIndexes([0]);
								//widget.singleThumbAsTimeInstant(true);
								if (timeSliderWidget.startup && !timeSliderWidget._started)
									timeSliderWidget.startup();
								//for (var i = 0; i < timeStops.length - 1; i++)
								//	widget.next();
								var maxDate = new Date(max);
								maxDate.setDate(maxDate.getDate() + 1);
								var datePicker = $("#selectDate").kendoDatePicker({
									min: min,
									max: maxDate,
									change: function () {
										var date = this.value();
										for (var i = 1; i < timeStops.length; i++) {
											var stop = loadingDateIgnoringTimeZone(timeStops[i]);
											stop = extracted(stop);
											var difference = date - stop;
											if (difference <= 0) {
												timeSliderWidget.setThumbIndexes([i - (difference < 0 ? 1 : 0)]);
												break;
											}
										}
									}
								}).data('kendoDatePicker');
								timeSliderWidget.setThumbIndexes([timeStops.length - 1]);
								datePicker.value(timeStops[timeStops.length - 1]);
								timeSliderWidget.on('time-extent-change', function (timeExtent) {
									datePicker.value(timeExtent.endTime ? timeExtent.endTime : timeExtent.startTime);
								});
							}
						}));
					}
				},
				srcNodeRef: 'timeSlider',
				options: {
					map: true,
					excludeDataAtLeadingThumb: false,
					excludeDataAtTrailingThumb: false
				}
			},
			/*legend: {
			 include: true,
			 id: 'legend',
			 type: 'titlePane',
			 path: 'esri/dijit/Legend',
			 title: 'Легенда',
			 open: false,
			 position: 0,
			 options: {
			 map: true,
			 legendLayerInfos: true
			 }
			 },*/
			layerControl: {
				include: true,
				id: 'layerControl',
				type: 'titlePane',
				path: 'gis/dijit/LayerControl',
				title: 'Слои',
				open: false,
				position: 0,
				options: {
					map: true,
					layerControlLayerInfos: true,
					separated: false,
					vectorReorder: true,
					overlayReorder: true
				}
			},
			bookmarks: {
				include: true,
				id: 'bookmarks',
				type: 'titlePane',
				path: 'gis/dijit/Bookmarks',
				title: 'Закладки',
				open: true,
				position: 2,
				options: 'config/bookmarks'
			},
			find: {
				include: true,
				id: 'find',
				type: 'titlePane',
				canFloat: false,
				path: 'gis/dijit/Find',
				title: 'Поиск',
				open: false,
				position: 3,
				options: 'config/find'
			},
			/*draw: {
			 include: true,
			 id: 'draw',
			 type: 'titlePane',
			 canFloat: true,
			 path: 'gis/dijit/Draw',
			 title: 'Draw',
			 open: false,
			 position: 4,
			 options: {
			 map: true,
			 mapClickMode: true
			 }
			 },*/
			measure: {
				include: true,
				id: 'measurement',
				type: 'titlePane',
				canFloat: false,
				path: 'gis/dijit/Measurement',
				title: 'Измерения',
				open: false,
				position: 5,
				options: {
					map: true,
					mapClickMode: true,
					defaultAreaUnit: units.SQUARE_METERS,
					defaultLengthUnit: units.METERS
				}
			},
			/*print: {
			 include: true,
			 id: 'print',
			 type: 'titlePane',
			 canFloat: false,
			 path: 'gis/dijit/Print',
			 title: 'Печать',
			 open: false,
			 position: 6,
			 options: {
			 map: true,
			 printTaskURL: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
			 copyrightText: 'Copyright 2014',
			 authorText: 'Me',
			 defaultTitle: 'Viewer Map',
			 defaultFormat: 'PDF',
			 defaultLayout: 'Letter ANSI A Landscape'
			 }
			 },*/
			/*directions: {
			 include: true,
			 id: 'directions',
			 type: 'titlePane',
			 path: 'gis/dijit/Directions',
			 title: 'Directions',
			 open: false,
			 position: 7,
			 options: {
			 map: true,
			 mapRightClickMenu: true,
			 options: {
			 routeTaskUrl: 'http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route',
			 routeParams: {
			 directionsLanguage: 'en-US',
			 directionsLengthUnits: units.MILES
			 }
			 }
			 }
			 },*/
			/*editor: {
			 include: true,
			 id: 'editor',
			 type: 'titlePane',
			 path: 'gis/dijit/Editor',
			 title: 'Editor',
			 open: false,
			 position: 8,
			 options: {
			 map: true,
			 mapClickMode: true,
			 editorLayerInfos: true,
			 settings: {
			 toolbarVisible: true,
			 showAttributesOnClick: true,
			 enableUndoRedo: true,
			 createOptions: {
			 polygonDrawTools: ['freehandpolygon', 'autocomplete']
			 },
			 toolbarOptions: {
			 reshapeVisible: true,
			 cutVisible: true,
			 mergeVisible: true
			 }
			 }
			 }
			 },*/
			/*streetview: {
			 include: true,
			 id: 'streetview',
			 type: 'titlePane',
			 canFloat: true,
			 position: 9,
			 path: 'gis/dijit/StreetView',
			 title: 'Google Street View',
			 options: {
			 map: true,
			 mapClickMode: true,
			 mapRightClickMenu: true
			 }
			 },*/
			findblocks: {
				include: true,
				id: 'findblocks',
				type: 'titlePane',
				canFloat: false,
				path: 'gis/dijit/FindBlocks',
				title: 'Расчёт запасов',
				open: true,
				position: 10,
				options: 'config/calcresources'
			},
			help: {
				include: true,
				id: 'help',
				type: 'floating',
				path: 'gis/dijit/Help',
				title: 'Help',
				options: {}
			}

		}
	};
});