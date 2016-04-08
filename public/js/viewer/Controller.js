define([
	'gis/plugins/login',
	'esri/map',
	'dojo/dom',
	'dojo/dom-style',
	'dojo/dom-geometry',
	'dojo/dom-class',
	'dojo/on',
	'dojo/_base/array',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	'gis/dijit/FloatingTitlePane',
	'dojo/_base/lang',
	'dojo/text!./templates/mapOverlay.html',
	'dojo/text!./templates/bottomContent.html',
	'dojo/text!./templates/topContent.html',
	'gis/dijit/FloatingWidgetDialog',
	'put-selector',
	'dojo/aspect',
	'dojo/has',
	'dojo/topic',
	'esri/graphic',
	'esri/InfoTemplate',
	'esri/dijit/PopupMobile',
	'esri/layers/GraphicsLayer',
	'esri/layers/FeatureLayer',
	'esri/layers/ArcGISTiledMapServiceLayer',
	'esri/request',
	'esri/tasks/query',
	'esri/tasks/ProjectParameters',
	'esri/symbols/Font',
	'esri/symbols/TextSymbol',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/renderers/SimpleRenderer',
	'dijit/Menu'
], function (login,
             Map,
             dom,
             domStyle,
             domGeom,
             domClass,
             on,
             array,
             BorderContainer,
             ContentPane,
             FloatingTitlePane,
             lang,
             mapOverlay,
             bottomContent,
             topContent,
             FloatingWidgetDialog,
             put,
             aspect,
             has,
             topic,
             Graphic,
             InfoTemplate,
             PopupMobile,
             GraphicsLayer,
             FeatureLayer,
             ArcGISTiledMapServiceLayer,
             esriRequest,
             Query,
             ProjectParameters,
             Font,
             TextSymbol,
             SimpleMarkerSymbol,
             SimpleFillSymbol,
             SimpleRenderer,
             Menu) {

	return {
		legendLayerInfos: [],
		editorLayerInfos: [],
		identifyLayerInfos: [],
		layerControlLayerInfos: [],
		panes: {
			left: {
				id: 'sidebarLeft',
				placeAt: 'outer',
				collapsible: true,
				region: 'left'
			},
			center: {
				id: 'mapCenter',
				placeAt: 'outer',
				region: 'center',
				content: mapOverlay
			},
			bottom: {
				id: 'resultsBottom',
				placeAt: 'outer',
				collapsible: true,
				region: 'bottom',
				content: bottomContent
			},
			top: {
				id: 'sidebarTop',
				placeAt: 'outer',
				collapsible: false,
				region: 'top',
				content: topContent
			}
		},
		collapseButtons: {},
		startup: function (config) {
			this.config = config;
			this.mapClickMode = {
				current: config.defaultMapClickMode,
				defaultMode: config.defaultMapClickMode
			};
			// simple feature detection. kinda like dojox/mobile without the overhead
			if (has('touch') && (has('ios') || has('android') || has('bb'))) {
				has.add('mobile', true);
				if (screen.availWidth < 500 || screen.availHeight < 500) {
					has.add('phone', true);
				} else {
					has.add('tablet', true);
				}
			}
			if (config.titles) {
				this.addTitles();
			}
			this.addTopics();
			this.initPanes();

			if (config.isDebug) {
				window.app = this; //dev only
			}
			this.setBottomVisible(false);
		},
		// add topics for subscribing and publishing
		addTopics: function () {
			// toggle a sidebar pane
			topic.subscribe('viewer/togglePane', lang.hitch(this, function (args) {
				this.togglePane(args.pane, args.show);
			}));

			// load a widget
			topic.subscribe('viewer/loadWidget', lang.hitch(this, function (args) {
				this.widgetLoader(args.options, args.position);
			}));

			// setup error handler. centralize the debugging
			if (this.config.isDebug) {
				topic.subscribe('viewer/handleError', lang.hitch(this, 'handleError'));
			}

			// set the current mapClickMode
			topic.subscribe('mapClickMode/setCurrent', lang.hitch(this, function (mode) {
				this.mapClickMode.current = mode;
				topic.publish('mapClickMode/currentSet', mode);
			}));

			// set the current mapClickMode to the default mode
			topic.subscribe('mapClickMode/setDefault', lang.hitch(this, function () {
				topic.publish('mapClickMode/setCurrent', this.mapClickMode.defaultMode);
			}));

		},
		// set titles (if any)
		addTitles: function () {
			var titles = this.config.titles;
			if (titles.header) {
				var headerTitleNode = dom.byId('headerTitleSpan');
				if (headerTitleNode) {
					headerTitleNode.innerText = titles.header;
				}
			}
			if (titles.subHeader) {
				var subHeaderTitle = dom.byId('subHeaderTitleSpan');
				if (subHeaderTitle) {
					subHeaderTitle.innerText = titles.subHeader;
				}
			}
			if (titles.pageTitle) {
				document.title = titles.pageTitle;
			}
		},
		// setup all the sidebar panes
		initPanes: function () {
			var key, panes = this.config.panes || {};
			for (key in this.panes) {
				if (this.panes.hasOwnProperty(key)) {
					panes[key] = lang.mixin(this.panes[key], panes[key]);
				}
			}

			this.panes.outer = new BorderContainer({
				id: 'borderContainerOuter',
				design: 'sidebar',
				gutters: false
			}).placeAt(document.body);

			var options, placeAt, type;
			for (key in panes) {
				if (panes.hasOwnProperty(key)) {
					options = lang.clone(panes[key]);
					placeAt = this.panes[options.placeAt] || this.panes.outer;
					options.id = options.id || key;
					type = options.type;
					delete options.placeAt;
					delete options.type;
					delete options.collapsible;
					if (placeAt) {
						if (type === 'border') {
							this.panes[key] = new BorderContainer(options).placeAt(placeAt);
						} else if (options.region) {
							this.panes[key] = new ContentPane(options).placeAt(placeAt);
						}
					}
				}
			}
			this.panes.outer.startup();
			this.initMap();

			// where to place the buttons
			// either the center map pane or the outer pane?
			this.collapseButtonsPane = this.config.collapseButtonsPane || 'outer';

			for (key in panes) {
				if (panes.hasOwnProperty(key)) {
					if (panes[key].collapsible) {
						var button = put(this.panes[this.collapseButtonsPane].domNode, 'div.sidebarCollapseButton.sidebar' + key + 'CollapseButton.sidebarCollapseButton' + ((key === 'bottom' || key === 'top') ? 'Vert' : 'Horz') + ' div.dijitIcon.button.close').parentNode;
						button.id = 'collapseButton_' + key;
						on(button, 'click', lang.hitch(this, 'togglePane', key));
						this.collapseButtons[key] = button;
						this.positionSideBarToggle(key);
						if (this.collapseButtonsPane === 'outer') {
							var splitter = this.panes[key]._splitterWidget;
							if (splitter) {
								aspect.after(splitter, '_startDrag', lang.hitch(this, 'splitterStartDrag', key));
								aspect.after(splitter, '_stopDrag', lang.hitch(this, 'splitterStopDrag', key));
							}
						}
						if (panes[key].open !== undefined) {
							this.togglePane(key, panes[key].open);
						}
					}
					if (key !== 'center' && this.panes[key]._splitterWidget) {
						domClass.add(this.map.root.parentNode, 'pane' + key);
						if (key === 'right' && this.panes.top) {
							domClass.add(this.panes.top.domNode, 'pane' + key);
						}
						if (key === 'right' && this.panes.bottom) {
							domClass.add(this.panes.bottom.domNode, 'pane' + key);
						}
						if (key === 'left' && this.panes.top) {
							domClass.add(this.panes.top.domNode, 'pane' + key);
						}
						if (key === 'left' && this.panes.bottom) {
							domClass.add(this.panes.bottom.domNode, 'pane' + key);
						}
					}
				}
			}

			// respond to media query changes
			// matchMedia works in most browsers (http://caniuse.com/#feat=matchmedia)
			if (window.matchMedia) {
				window.matchMedia('(max-width: 991px)').addListener(lang.hitch(this, 'repositionSideBarButtons'));
				window.matchMedia('(max-width: 767px)').addListener(lang.hitch(this, 'repositionSideBarButtons'));
			}

			this.panes.outer.resize();
		},
		setGraphicVisibleByDates: function (graphic, date, start, end) {
			if (date >= start && date <= end)
				graphic.show();
			else
				graphic.hide();
		},
		/**
		 * Скрытие или показ надписей, привязанных к временным промежуткам
		 * @param labelLayer Слой с надписями
		 * @param timeExtent Временной промежуток с таймслайдера
		 */
		applyTimeExtentToLabelLater: function (labelLayer, timeExtent) {
			if (labelLayer.timeInfo) {
				labelLayer.graphics.forEach(lang.hitch(this, function (graphic) {
					var timeInfo = graphic.timeInfo;
					if (timeInfo) {
						var start = timeInfo.startTime ? new Date(timeInfo.startTime) : undefined;
						var end = timeInfo.endTime ? new Date(timeInfo.endTime) : undefined;
						if (start && end) { // У объекта есть обе даты
							if (start.getTime() === end.getTime()) // Если даты объекта совпадают, одна убирается, и объект обрабатывается дальше
								end = undefined;
							else { // Даты объекта разные и обрабатываются здесь
								// У таймслайдера есть две разные даты - сравниваются два промежутка
								if (timeExtent.startTime && timeExtent.endTime &&
									timeExtent.startTime.getTime() !== timeExtent.endTime.getTime()) {
									// Обе даты раньше даты начала таймслайдера или обе даты позже даты окончания
									if (start < timeExtent.startDate && end < timeExtent.startDate ||
										start > timeExtent.endDate && end > timeExtent.endDate)
										graphic.hide();
									else // если не так, промежутки пересекаются, и объект показывается
										graphic.show();
								}
								// У таймслайдера есть только одна дата
								else if (timeExtent.startTime)
									this.setGraphicVisibleByDates(graphic, timeExtent.startTime, start, end);
								else if (timeExtent.endTime)
									this.setGraphicVisibleByDates(graphic, timeExtent.endTime, start, end);
							}
						}
						if (start ^ end) { // Есть только одна из дат
							if (end) // Для простоты одна дата перекидывается в другую, чтобы не плодить код или лишние функции
								start = end;
							if (timeExtent.startTime && timeExtent.endTime &&
								timeExtent.startTime.getTime() !== timeExtent.endTime.getTime())
								this.setGraphicVisibleByDates(graphic, start, timeExtent.startTime, timeExtent.endTime);
							else if (timeExtent.startTime)
								this.setGraphicVisibleByDates(graphic, start, timeExtent.startTime, timeExtent.startTime);
							else if (timeExtent.endTime)
								this.setGraphicVisibleByDates(graphic, start, timeExtent.endTime, timeExtent.endTime);
						}
					}
				}));
			}
		}, initMap: function () {
			if (has('phone') && !this.config.mapOptions.infoWindow) {
				this.config.mapOptions.infoWindow = new PopupMobile(null, put('div'));
			}
			this.map = new Map('mapCenter', this.config.mapOptions);
			this.labelLayers = {};
			this.initLayers();
			if (this.config.operationalLayers && this.config.operationalLayers.length > 0) {
				on.once(this.map, 'layers-add-result', lang.hitch(this, 'initWidgets'));
			} else {
				this.initWidgets();
			}
			this.map.on('time-extent-change', lang.hitch(this, function (e) {
				var timeExtent = e.timeExtent;
				if (timeExtent) {
					this.layers.forEach(lang.hitch(this, function (layer) {
						// Скрытие и показ надписей при изменении таймслайдера
						if (layer.timeInfo) {
							if (layer.labelLayers) { // Подслой в динамическом слое
								for (var id in layer.labelLayers) {
									var ll = layer.labelLayers[id];
									this.applyTimeExtentToLabelLater(ll, timeExtent);
								}
							}
							else if (this.labelLayers[layer.url]) // Обычный FeatureLayer
								this.applyTimeExtentToLabelLater(this.labelLayers[layer.url], timeExtent);
						}
					}));
				}
			}));
		},
		/**
		 * Добавление слоя для надписей
		 * @param dynamicLayer Динамический слой, в котором хранятся остальные слои
		 * @param featureLayer Слой, с которого производится запрос данных для отображения (текст и временной промежуток)
		 * @param url Ссылка на слой
		 * @param opacity Прозрачность
		 * @param params Параметры отображения надписей
		 */
		initLabelsLayer: function (dynamicLayer, featureLayer, url, opacity, params) {
			var labelLayer = new GraphicsLayer({
				id: dynamicLayer ? params.id.toString() : featureLayer.id + '_labels',
				opacity: opacity
			});
			if (params.minScale >= 0)
				labelLayer.setMinScale(params.minScale);
			if (params.maxScale >= 0 && params.maxScale > params.minScale)
				labelLayer.setMaxScale(params.maxScale);
			labelLayer.setVisibility(false);
			this.map.addLayer(labelLayer);
			if (dynamicLayer)
				dynamicLayer.labelLayers[url] = labelLayer;
			else
				this.labelLayers[url] = labelLayer;
			var query = new Query();
			query.where = '1=1';
			query.outFields = [params.field];
			if (featureLayer.timeInfo) {
				labelLayer.timeInfo = featureLayer.timeInfo;
				if (featureLayer.timeInfo.startTimeField)
					query.outFields.push(featureLayer.timeInfo.startTimeField);
				if (featureLayer.timeInfo.endTimeField)
					query.outFields.push(featureLayer.timeInfo.endTimeField);
			}
			query.returnGeometry = true;
			featureLayer.queryFeatures(query, lang.hitch(this, function (response) {
				var fontSize = params.fontSize || '14px';
				var fontStyle = params.fontStyle || Font.STYLE_NORMAL;
				var fontVariant = params.fontVariant || Font.VARIANT_NORMAL;
				var fontWeight = params.fontWeight || Font.WEIGHT_NORMAL;
				var fontFamily = params.fontFamily || 'Arial';
				var font = new Font(fontSize, fontStyle, fontVariant, fontWeight, fontFamily);
				var color = new esri.Color(params.color ? params.color : [0, 0, 0, .5]);
				var text = [];
				array.forEach(response.features, lang.hitch(this, function (feature) {
					text.push(feature.attributes[params.field]);
				}));
				var graphics = [];

				function addLabel (graphic) {
					var textSymbol = new TextSymbol(text[labelLayer.graphics.length], font, color);
					textSymbol.setVerticalAlignment(params.type == 'dot' ? 'top' : 'center');
					textSymbol.setHorizontalAlignment(params.type == 'dot' ? 'left' : 'center');
					if (params.type == 'dot')
						textSymbol.setOffset(4, 4);
					var label = new Graphic(graphic, textSymbol);
					labelLayer.add(label);
				}

				function project (map, graphics) {
					var projectParams = new ProjectParameters();
					projectParams.geometries = graphics;
					projectParams.outSR = map.extent.spatialReference;
					esriConfig.defaults.geometryService.project(projectParams, function (geometries) {
						geometries.forEach(function (geometry) {
							addLabel(geometry);
						});
					});
				}

				array.forEach(response.features, lang.hitch(this, function (feature) {
					var graphic = feature.geometry;
					graphic.setSpatialReference(featureLayer.spatialReference);
					if (this.map.extent.spatialReference === featureLayer.spatialReference) {
						addLabel(graphic);
					}
					else {
						graphics.push(graphic);
						if (graphics.length === 1000) {
							project(this.map, graphics);
							graphics = [];
						}
					}
				}));
				if (this.map.extent.spatialReference !== featureLayer.spatialReference && graphics.length)
					project(this.map, graphics);
				if (dynamicLayer)
					labelLayer.setVisibility(dynamicLayer.visibleLayers.indexOf(parseInt(params.id)) >= 0);
				else
					labelLayer.setVisibility(featureLayer.visible);
			}));
		},
		initLayers: function () {
			this.map.on('resize', function (evt) {
				var pnt = evt.target.extent.getCenter();
				setTimeout(function () {
					evt.target.centerAt(pnt);
				}, 100);
			});

			this.layers = [];
			var layerTypes = {
				csv: 'CSV',
				dynamic: 'ArcGISDynamicMapService',
				feature: 'Feature',
				georss: 'GeoRSS',
				image: 'ArcGISImageService',
				kml: 'KML',
				label: 'Label', //untested
				mapimage: 'MapImage', //untested
				osm: 'OpenStreetMap',
				tiled: 'ArcGISTiledMapService',
				wms: 'WMS',
				wmts: 'WMTS' //untested
			};
			// loading all the required modules first ensures the layer order is maintained
			var modules = [];
			array.forEach(this.config.operationalLayers, function (layer) {
				var type = layerTypes[layer.type];
				if (type) {
					modules.push('esri/layers/' + type + 'Layer');
				} else {
					this.handleError({
						source: 'Controller',
						error: 'Layer type "' + layer.type + '"" isn\'t supported: '
					});
				}
			}, this);
			require(modules, lang.hitch(this, function () {
				array.forEach(this.config.operationalLayers, function (layer) {
					var type = layerTypes[layer.type];
					if (type) {
						require(['esri/layers/' + type + 'Layer'], lang.hitch(this, 'initLayer', layer));
					}
				}, this);
				this.map.addLayers(this.layers);
				this.map.on('layers-add-result', lang.hitch(this, function () {
					var polygonSelectionSymbol = new SimpleFillSymbol();
					var pointSelectionSymbol = new SimpleMarkerSymbol({
						color: [0, 0, 0, 255],
						size: 5
					});
					for (var i = 0; i < this.layers.length; i++) {
						var layer = this.layers[i];
						if (layer.geometryType == 'esriGeometryPoint')
							layer.setSelectionSymbol(pointSelectionSymbol);
						if (layer.geometryType == 'esriGeometryPolygon')
							layer.setSelectionSymbol(polygonSelectionSymbol);
					}
				}));
			}));
		},
		initLayer: function (layer, Layer) {
			var l = new Layer(layer.url, layer.options);
			l.on('error', function (err) {
				console.log('Не удалось загрузить слой ' + layer.url + ':');
				for (var p in err) {
					console.log('\t' + p + ': ' + err[p]);
				}
			});
			l.on('load', lang.hitch(this, function () {
				if (layer.type === 'dynamic') {
					l.layers = {};
					l.labelLayers = {};
					layer.identifyLayerInfos.layerIds.forEach(lang.hitch(this, function (info) {
						var url = layer.url + info;
						var fl = new FeatureLayer(url);
						l.layers[url] = fl;
					}));
					layer.labelLayers.forEach(lang.hitch(this, function (info) {
						var url = layer.url + info.id;
						var fl = new FeatureLayer(url);
						fl.on('load', lang.hitch(this, function () {
							this.initLabelsLayer(l, fl, url, layer.opacity, info);
						}));
					}));
					l.on('visible-layers-change', function (e) {
						for (var ll in l.labelLayers) {
							var id = ll.substring(l.url.length);
							l.labelLayers[ll].setVisibility(e.visibleLayers.indexOf(parseInt(id)) >= 0);
						}
					});
					l.on('visibility-change', function (e) {
						for (var ll in l.labelLayers) {
							var id = l.labelLayers[ll].id;//.substring(l.url.length);
							l.labelLayers[ll].setVisibility(e.visible && l.visibleLayers.indexOf(parseInt(id)) >= 0);
						}
					});
				}
				else if (layer.type === 'feature') {
					if (layer.labelLayer) {
						this.initLabelsLayer(undefined, l, l.url, layer.opacity, layer.labelLayer);
						l.on('visibility-change', lang.hitch(this, function (e) {
							this.labelLayers[e.target.url].setVisibility(e.visible);
						}));
					}
				}
			}));
			this.layers.unshift(l); //unshift instead of push to keep layer ordering on map intact
			//Legend LayerInfos array
			this.legendLayerInfos.unshift({ //unshift instead of push to keep layer ordering in legend intact
				layer: l,
				title: layer.title || null
			});
			//LayerControl LayerInfos array
			this.layerControlLayerInfos.unshift({ //unshift instead of push to keep layer ordering in LayerControl intact
				layer: l,
				type: layer.type,
				title: layer.title,
				controlOptions: layer.layerControlLayerInfos
			});
			if (layer.type === 'feature') {
				var options = {
					featureLayer: l
				};
				if (layer.editorLayerInfos) {
					lang.mixin(options, layer.editorLayerInfos);
				}
				this.editorLayerInfos.push(options);
			}
			if (layer.type === 'dynamic' || layer.type === 'feature') {
				var idOptions = {
					layer: l,
					title: layer.title
				};
				if (layer.identifyLayerInfos) {
					lang.mixin(idOptions, layer.identifyLayerInfos);
				}
				if (idOptions.exclude !== true) {
					this.identifyLayerInfos.push(idOptions);
				}
			}
		},
		initWidgets: function () {
			var widgets = [],
				paneWidgets;

			for (var key in this.config.widgets) {
				if (this.config.widgets.hasOwnProperty(key)) {
					var widget = lang.clone(this.config.widgets[key]);
					if (widget.include) {
						widget.position = ('undefined' !== typeof (widget.position)) ? widget.position : 10000;
						widgets.push(widget);
					}
				}
			}
			for (var pane in this.panes) {
				if (this.panes.hasOwnProperty(pane) && (pane !== 'outer' || pane !== 'center')) {
					paneWidgets = array.filter(widgets, function (widget) {
						return (widget.placeAt && widget.placeAt === pane);
					});
					paneWidgets.sort(function (a, b) {
						return a.position - b.position;
					});
					array.forEach(paneWidgets, function (widget, i) {
						this.widgetLoader(widget, i);
					}, this);
				}
			}
			paneWidgets = array.filter(widgets, function (widget) {
				return !widget.placeAt;
			});
			paneWidgets.sort(function (a, b) {
				return a.position - b.position;
			});

			array.forEach(paneWidgets, function (widget, i) {
				this.widgetLoader(widget, i);
			}, this);
		},
		togglePane: function (id, show) {
			if (!this.panes[id]) {
				return;
			}
			var domNode = this.panes[id].domNode;
			if (domNode) {
				var disp = (show && typeof (show) === 'string') ? show : (domStyle.get(domNode, 'display') === 'none') ? 'block' : 'none';
				domStyle.set(domNode, 'display', disp);
				if (this.panes[id]._splitterWidget) { // show/hide the splitter, if found
					domStyle.set(this.panes[id]._splitterWidget.domNode, 'display', disp);
				}
				this.positionSideBarToggle(id);
				if (this.panes.outer) {
					this.panes.outer.resize();
				}
			}
		},
		positionSideBarToggle: function (id) {
			var pane = this.panes[id];
			var btn = this.collapseButtons[id];
			if (!pane || !btn) {
				return;
			}
			var disp = domStyle.get(pane.domNode, 'display');
			var rCls = (disp === 'none') ? 'close' : 'open';
			var aCls = (disp === 'none') ? 'open' : 'close';
			domClass.remove(btn.children[0], rCls);
			domClass.add(btn.children[0], aCls);

			// extra management required when the buttons
			// are not in the center map pane
			if (this.collapseButtonsPane === 'outer') {
				var pos = (pane._splitterWidget) ? 0 : -1;
				var orie = (id === 'bottom' || id === 'top') ? 'h' : 'w';
				if (disp === 'block') { // pane is open
					pos += domGeom.getMarginBox(pane.domNode)[orie];
				}
				if (pane._splitterWidget) { // account for a splitter
					pos += domGeom.getMarginBox(pane._splitterWidget.domNode)[orie];
				}
				domStyle.set(btn, id, pos.toString() + 'px');
				domStyle.set(btn, 'display', 'block');
			}
		},

		/**
		 * Показ или скрытие нижней панели с результатами
		 * @param visible видимость (true или false)
		 */
		setBottomVisible: function (visible) {
			var buttonContainerNode = dom.byId('collapseButton_bottom');
			var collapseButtonNode = buttonContainerNode.firstChild;
			if ((visible && collapseButtonNode.className.indexOf('close') > -1) ||
				(!visible && collapseButtonNode.className.indexOf('close') == -1))
				collapseButtonNode.click();
			collapseButtonNode.click();
		},


		repositionSideBarButtons: function () {
			var btns = ['left', 'right', 'top', 'bottom'];
			array.forEach(btns, lang.hitch(this, function (id) {
				this.positionSideBarToggle(id);
			}));
		},

		// extra management of splitters required when the buttons
		// are not in the center map pane
		splitterStartDrag: function (id) {
			var btn = this.collapseButtons[id];
			domStyle.set(btn, 'display', 'none');
		},
		splitterStopDrag: function (id) {
			this.positionSideBarToggle(id);
		},

		_createTitlePaneWidget: function (parentId, title, position, open, canFloat, placeAt) {
			var tp, options = {
				title: title || 'Widget',
				open: open || false,
				canFloat: canFloat || false
			};
			if (parentId) {
				options.id = parentId;
			}
			if (typeof (placeAt) === 'string') {
				placeAt = this.panes[placeAt];
			}
			if (!placeAt) {
				placeAt = this.panes.left;
			}
			if (placeAt) {
				options.sidebar = placeAt;
				tp = new FloatingTitlePane(options).placeAt(placeAt, position);
				tp.startup();
			}
			return tp;
		},
		_createFloatingWidget: function (parentId, title) {
			var options = {
				title: title
			};
			if (parentId) {
				options.id = parentId;
			}
			var fw = new FloatingWidgetDialog(options);
			fw.startup();
			return fw;
		},
		_createContentPaneWidget: function (parentId, title, className, region, placeAt) {
			var cp, options = {
				title: title,
				region: region || 'center'
			};
			if (className) {
				options.className = className;
			}
			if (parentId) {
				options.id = parentId;
			}
			if (!placeAt) {
				placeAt = this.panes.sidebar;
			} else if (typeof (placeAt) === 'string') {
				placeAt = this.panes[placeAt];
			}
			if (placeAt) {
				cp = new ContentPane(options).placeAt(placeAt);
				cp.startup();
			}
			return cp;
		},
		widgetLoader: function (widgetConfig, position) {
			var parentId, pnl;

			// only proceed for valid widget types
			var widgetTypes = ['titlePane', 'contentPane', 'floating', 'domNode', 'invisible', 'map', 'other'];
			if (array.indexOf(widgetTypes, widgetConfig.type) < 0) {
				this.handleError({
					source: 'Controller',
					error: 'Widget type "' + widgetConfig.type + '" (' + widgetConfig.title + ') at position ' + position + ' is not supported.'
				});
				return;
			}

			// build a titlePane or floating widget as the parent
			if ((widgetConfig.type === 'titlePane' || widgetConfig.type === 'contentPane' || widgetConfig.type === 'floating') && (widgetConfig.id && widgetConfig.id.length > 0)) {
				parentId = widgetConfig.id + '_parent';
				if (widgetConfig.type === 'titlePane') {
					pnl = this._createTitlePaneWidget(parentId, widgetConfig.title, position, widgetConfig.open, widgetConfig.canFloat, widgetConfig.placeAt);
				} else if (widgetConfig.type === 'contentPane') {
					pnl = this._createContentPaneWidget(parentId, widgetConfig.title, widgetConfig.className, widgetConfig.region, widgetConfig.placeAt);
				} else if (widgetConfig.type === 'floating') {
					pnl = this._createFloatingWidget(parentId, widgetConfig.title);
				}
				widgetConfig.parentWidget = pnl;
			}

			// 2 ways to use require to accommodate widgets that may have an optional separate configuration file
			if (typeof (widgetConfig.options) === 'string') {
				require([widgetConfig.options, widgetConfig.path], lang.hitch(this, 'createWidget', widgetConfig));
			} else {
				require([widgetConfig.path], lang.hitch(this, 'createWidget', widgetConfig, widgetConfig.options));
			}
		},
		createWidget: function (widgetConfig, options, WidgetClass) {
			// set any additional options
			options.id = widgetConfig.id + '_widget';
			options.parentWidget = widgetConfig.parentWidget;

			//replace config map, layerInfos arrays, etc
			if (options.map) {
				options.map = this.map;
			}
			if (options.mapRightClickMenu) {
				// create right-click menu
				if (!this.mapRightClickMenu) {
					this.mapRightClickMenu = new Menu({
						targetNodeIds: [this.map.root],
						selector: '.layersDiv' // restrict to map only
					});
					this.mapRightClickMenu.startup();
				}
				options.mapRightClickMenu = this.mapRightClickMenu;
			}
			if (options.mapClickMode) {
				options.mapClickMode = this.mapClickMode.current;
			}
			if (options.legendLayerInfos) {
				options.layerInfos = this.legendLayerInfos;
			}
			if (options.layerControlLayerInfos) {
				options.layerInfos = this.layerControlLayerInfos;
			}
			if (options.editorLayerInfos) {
				options.layerInfos = this.editorLayerInfos;
			}
			if (options.identifyLayerInfos) {
				options.layerInfos = this.identifyLayerInfos;
			}

			// create the widget
			var pnl = options.parentWidget;
			if ((widgetConfig.type === 'titlePane' || widgetConfig.type === 'contentPane' || widgetConfig.type === 'floating')) {
				this[widgetConfig.id] = new WidgetClass(options, put('div')).placeAt(pnl.containerNode);
			} else if (widgetConfig.type === 'domNode') {
				this[widgetConfig.id] = new WidgetClass(options, widgetConfig.srcNodeRef);
			} else {
				this[widgetConfig.id] = new WidgetClass(options);
			}
			this[widgetConfig.id].Controller = this;

			if (widgetConfig.widgetPrepare) { // Дополнительная подготовка виджета
				widgetConfig.widgetPrepare(this, this[widgetConfig.id]);
			}

			// start up the widget
			else if (this[widgetConfig.id] && this[widgetConfig.id].startup && !this[widgetConfig.id]._started) {
				this[widgetConfig.id].startup();
			}
		},
		//centralized error handler
		handleError: function (options) {
			if (this.config.isDebug) {
				if (typeof (console) === 'object') {
					for (var option in options) {
						if (options.hasOwnProperty(option)) {
							console.log(option, options[option]);
						}
					}
				}
			} else {
				// add growler here?
				//return;
			}
		}
	};
});