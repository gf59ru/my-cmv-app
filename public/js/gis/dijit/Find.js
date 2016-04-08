define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/dom-construct',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/on',
	'dojo/keys',
	'dojo/store/Memory',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/Keyboard',
	'esri/layers/GraphicsLayer',
	'esri/graphic',
	'esri/renderers/SimpleRenderer',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/graphicsUtils',
	'esri/tasks/FindTask',
	'esri/tasks/FindParameters',
	'esri/geometry/Extent',
	'dojo/text!./Find/templates/Find.html',
	'dijit/form/Form',
	'dijit/form/FilteringSelect',
	'dijit/form/ValidationTextBox',
	'dijit/form/CheckBox',
	'xstyle/css!./Find/css/Find.css'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, domConstruct, lang, array, on, keys, Memory, OnDemandGrid, Selection, Keyboard, GraphicsLayer, Graphic, SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, graphicsUtils, FindTask, FindParameters, Extent, FindTemplate) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		widgetsInTemplate: true,
		templateString: FindTemplate,
		baseClass: 'gis_FindDijit',

		// Spatial Reference. uses the map's spatial reference if none provided
		spatialReference: null,

		// Use 0.0001 for decimal degrees (wkid 4326)
		// or 500 for meters/feet
		pointExtentSize: null,

		// default symbology for found features
		defaultSymbols: {
			point: {
				type: 'esriSMS',
				style: 'esriSMSCircle',
				size: 10,
				color: [0, 255, 255, 63],
				angle: 0,
				xoffset: 0,
				yoffset: 0,
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [0, 255, 255, 191],
					width: 2
				}
			},
			selectedPoint: {
				type: 'esriSMS',
				style: 'esriSMSCircle',
				size: 15,
				color: [255, 0, 0, 127],
				angle: 0,
				xoffset: 0,
				yoffset: 0,
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [255, 0, 0, 255],
					width: 3
				}
			},
			polyline: {
				type: 'esriSLS',
				style: 'esriSLSSolid',
				color: [0, 255, 255, 191],
				width: 2
			},
			selectedPolyline: {
				type: 'esriSLS',
				style: 'esriSLSSolid',
				color: [255, 0, 0, 255],
				width: 3
			},
			polygon: {
				type: 'esriSFS',
				style: 'esriSFSSolid',
				color: [0, 255, 255, 63],
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [0, 255, 255, 191],
					width: 2
				}
			},
			selectedPolygon: {
				type: 'esriSFS',
				style: 'esriSFSSolid',
				color: [255, 0, 0, 127],
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [255, 0, 0, 255],
					width: 3
				}
			}
		},

		postCreate: function () {
			this.inherited(arguments);

			if (this.spatialReference === null) {
				this.spatialReference = this.map.spatialReference;
			}
			if (this.pointExtentSize === null) {
				if (this.spatialReference === 4326) { // special case for geographic lat/lng
					this.pointExtentSize = 0.0001;
				} else {
					this.pointExtentSize = 500; // could be feet or meters
				}
			}

			this.createGraphicLayers();

			// allow pressing enter key to initiate the search
			this.own(on(this.searchTextDijit, 'keyup', lang.hitch(this, function (evt) {
				if (evt.keyCode === keys.ENTER) {
					this.search();
				}
			})));

			// add an id so the queries becomes key/value pair store
			var k = 0, queryLen = this.queries.length;
			for (k = 0; k < queryLen; k++) {
				this.queries[k].id = k;
			}

			// add the queries to the drop-down list
			if (queryLen > 1) {
				var queryStore = new Memory({
					data: this.queries
				});
				this.querySelectDijit.set('store', queryStore);
				this.querySelectDijit.set('value', this.queries[0].description);
			} else {
				this.querySelectDom.style.display = 'none';
			}

		},

		createGraphicLayers: function () {
			var pointSymbol = null,
				polylineSymbol = null,
				polygonSymbol = null;
			var pointRenderer = null,
				polylineRenderer = null,
				polygonRenderer = null;

			var symbols = lang.mixin({}, this.symbols);
			// handle each property to preserve as much of the object heirarchy as possible
			symbols = {
				point: lang.mixin(this.defaultSymbols.point, symbols.point),
				selectedPoint: lang.mixin(this.defaultSymbols.selectedPoint, symbols.selectedPoint),
				polyline: lang.mixin(this.defaultSymbols.polyline, symbols.polyline),
				selectedPolyline: lang.mixin(this.defaultSymbols.selectedPolyline, symbols.selectedPolyline),
				polygon: lang.mixin(this.defaultSymbols.polygon, symbols.polygon),
				selectedPolygon: lang.mixin(this.defaultSymbols.selectedPolygon, symbols.selectedPolygon)
			};

			// points
			this.pointGraphics = new GraphicsLayer({
				id: 'findGraphics_point',
				title: 'Find'
			});
			this.selectedPointGraphics = new GraphicsLayer({
				id: 'findGraphics_selectedPoint',
				title: 'Selected'
			});

			if (symbols.point) {
				pointSymbol = new SimpleMarkerSymbol(symbols.point);
				pointRenderer = new SimpleRenderer(pointSymbol);
				pointRenderer.label = 'Find Results (Points)';
				pointRenderer.description = 'Find results (Points)';
				this.pointGraphics.setRenderer(pointRenderer);
			}

			if (symbols.selectedPoint) {
				pointSymbol = new SimpleMarkerSymbol(symbols.selectedPoint);
				pointRenderer = new SimpleRenderer(pointSymbol);
				pointRenderer.label = 'Selected Point';
				pointRenderer.description = 'Selected Point';
				this.selectedPointGraphics.setRenderer(pointRenderer);
			}

			// poly line
			this.polylineGraphics = new GraphicsLayer({
				id: 'findGraphics_line',
				title: 'Find Graphics'
			});
			this.selectedPolylineGraphics = new GraphicsLayer({
				id: 'findGraphics_selectedLine',
				title: 'Selected'
			});

			if (symbols.polyline) {
				polylineSymbol = new SimpleLineSymbol(symbols.polyline);
				polylineRenderer = new SimpleRenderer(polylineSymbol);
				polylineRenderer.label = 'Find Results (Lines)';
				polylineRenderer.description = 'Find Results (Lines)';
				this.polylineGraphics.setRenderer(polylineRenderer);
			}
			if (symbols.selectedPolyline) {
				polylineSymbol = new SimpleLineSymbol(symbols.selectedPolyline);
				polylineRenderer = new SimpleRenderer(polylineSymbol);
				polylineRenderer.label = 'Selected Line';
				polylineRenderer.description = 'Selected Line';
				this.selectedPolylineGraphics.setRenderer(polylineRenderer);
			}

			// polygons
			this.polygonGraphics = new GraphicsLayer({
				id: 'findGraphics_polygon',
				title: 'Find Graphics'
			});
			this.selectedPolygonGraphics = new GraphicsLayer({
				id: 'findGraphics_selectedPolygon',
				title: 'Selected'
			});

			if (symbols.polygon) {
				polygonSymbol = new SimpleFillSymbol(symbols.polygon);
				polygonRenderer = new SimpleRenderer(polygonSymbol);
				polygonRenderer.label = 'Find Results (Polygons)';
				polygonRenderer.description = 'Find Results (Polygons)';
				this.polygonGraphics.setRenderer(polygonRenderer);
			}
			if (symbols.selectedPolygon) {
				polygonSymbol = new SimpleFillSymbol(symbols.selectedPolygon);
				polygonRenderer = new SimpleRenderer(polygonSymbol);
				polygonRenderer.label = 'Selected Polygon';
				polygonRenderer.description = 'Selected Polygon';
				this.selectedPolygonGraphics.setRenderer(polygonRenderer);
			}

			this.map.addLayer(this.polygonGraphics);
			this.map.addLayer(this.selectedPolygonGraphics);
			this.map.addLayer(this.polylineGraphics);
			this.map.addLayer(this.selectedPolylineGraphics);
			this.map.addLayer(this.pointGraphics);
			this.map.addLayer(this.selectedPointGraphics);
		},
		queryById: function (id) {
			for (var i = 0; i < this.queries.length; i++) {
				var query = this.queries[i];
				if (query.description === id) {
					return query;
				}
			}
			return undefined;
		},
		search: function () {
			var query = this.queryById(this.querySelectDijit.value);
			if (query) {
				var searchText = this.searchTextDijit.get('value');
				if (!query || !searchText || searchText.length === 0) {
					return;
				}
				if (query.minChars && (searchText.length < query.minChars)) {
					this.findResultsNode.innerHTML = 'Нужно ввести хотя бы ' + query.minChars + ' символов';
					this.findResultsNode.style.display = 'block';
					return;
				}

				this.createResultsGrid();
				this.clearResultsGrid();
				this.clearFeatures();
				domConstruct.empty(this.findResultsNode);

				if (!query || !query.url || !query.layerIds || !query.searchFields) {
					return;
				}

				//create find parameters
				var findParams = new FindParameters();
				findParams.returnGeometry = true;
				findParams.layerIds = query.layerIds;
				findParams.searchFields = query.searchFields;
				findParams.layerDefs = query.layerDefs;

				findParams.searchText = searchText;
				findParams.contains = !this.containsSearchText.checked;

				findParams.outSpatialReference = this.spatialReference;

				this.findResultsNode.innerHTML = 'Идёт поиск...';
				this.findResultsNode.style.display = 'block';

				var findTask = new FindTask(query.url);
				findTask.execute(findParams, lang.hitch(this, 'showResults'));
			}
		},

		createResultsGrid: function () {
			if (!this.resultsStore) {
				this.resultsStore = new Memory({
					idProperty: 'id',
					data: []
				});
			}

			if (!this.resultsGrid) {
				var Grid = declare([OnDemandGrid, Keyboard, Selection]);
				this.resultsGrid = new Grid({
					selectionMode: 'single',
					cellNavigation: false,
					showHeader: true,
					store: this.resultsStore,
					columns: {
						layerName: 'Слой',
						foundFieldName: 'Поле',
						value: 'Результат'
					},
					sort: [{
						attribute: 'value',
						descending: false
					}]
					//minRowsPerPage: 250,
					//maxRowsPerPage: 500
				}, this.findResultsGrid);

				this.resultsGrid.startup();
				this.resultsGrid.on('dgrid-select', lang.hitch(this, 'selectFeature'));
			}
		},

		showResults: function (results) {
			var resultText = '';
			this.resultIdx = 0;
			this.results = results;

			if (this.results.length > 0) {
				//var s = (this.results.length === 1) ? '' : 's';
				resultText = 'Найдено ' + this.results.length + ' объектов';
				this.highlightFeatures();
				this.showResultsGrid();
			} else {
				resultText = 'По запросу ничего не найдено';
			}
			this.findResultsNode.innerHTML = resultText;

		},

		showResultsGrid: function () {
			var query = this.queryById(this.querySelectDijit.value);
			this.resultsGrid.store.setData(this.results);
			this.resultsGrid.refresh();

			var lyrDisplay = 'block';
			if (query.layerIds.length === 1) {
				lyrDisplay = 'none';
			}
			this.resultsGrid.styleColumn('layerName', 'display:' + lyrDisplay);

			if (query && query.hideGrid !== true) {
				this.findResultsGrid.style.display = 'block';
			}
		},

		highlightFeatures: function () {
			var unique = 0;
			array.forEach(this.results, function (result) {
				// add a unique key for the store
				result.id = unique;
				unique++;
				var graphic, feature = result.feature;
				switch (feature.geometry.type) {
					case 'point':
						// only add points to the map that have an X/Y
						if (feature.geometry.x && feature.geometry.y) {
							graphic = new Graphic(feature.geometry);
							this.pointGraphics.add(graphic);
						}
						break;
					case 'polyline':
						// only add polylines to the map that have paths
						if (feature.geometry.paths && feature.geometry.paths.length > 0) {
							graphic = new Graphic(feature.geometry);
							this.polylineGraphics.add(graphic);
						}
						break;
					case 'polygon':
						// only add polygons to the map that have rings
						if (feature.geometry.rings && feature.geometry.rings.length > 0) {
							graphic = new Graphic(feature.geometry, null, {
								ren: 1
							});
							this.polygonGraphics.add(graphic);
						}
						break;
					default:
				}
			}, this);

			// zoom to layer extent
			var zoomExtent = null;
			//If the layer is a single point then extents are null
			// if there are no features in the layer then extents are null
			// the result of union() to null extents is null

			if (this.pointGraphics.graphics.length > 0) {
				zoomExtent = this.getPointFeaturesExtent(this.pointGraphics.graphics);
			}
			if (this.polylineGraphics.graphics.length > 0) {
				if (zoomExtent === null) {
					zoomExtent = graphicsUtils.graphicsExtent(this.polylineGraphics.graphics);
				} else {
					zoomExtent = zoomExtent.union(graphicsUtils.graphicsExtent(this.polylineGraphics.graphics));
				}
			}
			if (this.polygonGraphics.graphics.length > 0) {
				if (zoomExtent === null) {
					zoomExtent = graphicsUtils.graphicsExtent(this.polygonGraphics.graphics);
				} else {
					zoomExtent = zoomExtent.union(graphicsUtils.graphicsExtent(this.polygonGraphics.graphics));
				}
			}

			if (zoomExtent) {
				this.zoomToExtent(zoomExtent);
			}
		},

		selectFeature: function (event) {
			var result = event.rows;

			// zoom to feature
			if (result.length) {
				var data = result[0].data;
				if (data) {
					var feature = data.feature;
					if (feature) {
						var graphic = new Graphic(feature.geometry);
						switch (feature.geometry.type) {
							case 'point':
								this.selectedPointGraphics.clear();
								this.selectedPointGraphics.add(graphic);
								break;
							case 'polyline':
								this.selectedPolylineGraphics.clear();
								this.selectedPolylineGraphics.add(graphic);
								break;
							case 'polygon':
								this.selectedPolygonGraphics.clear();
								this.selectedPolygonGraphics.add(graphic);
								break;
							default:
						}
						var extent = feature.geometry.getExtent();
						if (!extent && feature.geometry.type === 'point') {
							extent = this.getExtentFromPoint(feature);
						}
						if (extent) {
							this.zoomToExtent(extent);
						}
					}
				}
			}
		},

		zoomToExtent: function (extent) {
			this.map.setExtent(extent.expand(1.5));
		},

		clearResults: function () {
			this.results = null;
			this.clearResultsGrid();
			this.clearFeatures();
			//this.searchFormDijit.reset();
			//this.querySelectDijit.setValue(this.queries[0].description);
			domConstruct.empty(this.findResultsNode);
		},

		clearResultsGrid: function () {
			if (this.resultStore) {
				this.resultsStore.setData([]);
			}
			if (this.resultsGrid) {
				this.resultsGrid.refresh();
			}
			this.findResultsNode.style.display = 'none';
			this.findResultsGrid.style.display = 'none';
		},

		clearFeatures: function () {
			this.pointGraphics.clear();
			this.selectedPointGraphics.clear();
			this.polylineGraphics.clear();
			this.selectedPolylineGraphics.clear();
			this.polygonGraphics.clear();
			this.selectedPolygonGraphics.clear();
		},

		getPointFeaturesExtent: function (pointFeatures) {
			var extent = graphicsUtils.graphicsExtent(pointFeatures);
			if (extent === null && pointFeatures.length > 0) {
				extent = this.getExtentFromPoint(pointFeatures[0]);
			}

			return extent;
		},

		getExtentFromPoint: function (point) {
			var sz = this.pointExtentSize; // hack
			var pt = point.geometry;
			var extent = new Extent({
				'xmin': pt.x - sz,
				'ymin': pt.y - sz,
				'xmax': pt.x + sz,
				'ymax': pt.y + sz,
				'spatialReference': this.spatialReference
			});
			return extent;
		}
	});
});