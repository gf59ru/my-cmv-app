define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/dom-style',
	'dojo/parser',
	'dijit/form/NumberTextBox',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/Color',
	'dojo/store/Memory',
	'dojo/dom-construct',
	'dojo/dom',
	'dojo/promise/all',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/Keyboard',
	'esri/config',
	'esri/InfoTemplate',
	'dojo/i18n!esri/nls/jsapi',
	'esri/toolbars/draw',
	'esri/layers/GraphicsLayer',
	'esri/SnappingManager',
	'esri/graphic',
	'esri/graphicsUtils',
	'esri/renderers/SimpleRenderer',
	'esri/tasks/GeometryService',
	'esri/tasks/BufferParameters',
	'esri/tasks/AreasAndLengthsParameters',
	'esri/tasks/ProjectParameters',
	'dojo/text!./FindBlocks/templates/FindBlocks.html',
	'esri/renderers/UniqueValueRenderer',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/layers/FeatureLayer',
	'esri/geometry/Polygon',
	'esri/geometry/screenUtils',
	'esri/geometry/Extent',
	'esri/tasks/query',
	'esri/tasks/QueryTask',
	'dojo/topic',
	'dojo/aspect',
	'dojo/number',
	'dijit/form/ComboBox',
	'dijit/form/Button',
	'dojo/domReady!',
	'xstyle/css!./FindBlocks/css/FindBlocks.css'
], function (declare,
             _WidgetBase,
             _TemplatedMixin,
             _WidgetsInTemplateMixin,
             domStyle,
             parser,
             NumberTextBox,
             lang,
             array,
             Color,
             Memory,
             domConstruct,
             dom,
             all,
             OnDemandGrid,
             Selection,
             Keyboard,
             esriConfig,
             InfoTemplate,
             esriBundle,
             Draw,
             GraphicsLayer,
             SnappingManager,
             Graphic,
             graphicsUtils,
             SimpleRenderer,
             GeometryService,
             BufferParameters,
             AreasAndLengthsParameters,
             ProjectParameters,
             drawTemplate,
             UniqueValueRenderer,
             SimpleMarkerSymbol,
             SimpleLineSymbol,
             SimpleFillSymbol,
             FeatureLayer,
             Polygon,
             screenUtils,
             Extent,
             Query,
             QueryTask,
             topic,
             aspect,
             number,
             ComboBox,
             Button) {

	// main draw dijit
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		widgetsInTemplate: true,
		templateString: drawTemplate,
		drawToolbar: null,
		graphics: null,
		mapClickMode: null,
		spatialReference: null,
		selectGeometry: 'Выбрать полигон',
		selectGeometryTooltip: 'Выберите полигон на карте',
		postCreate: function () {
			this.inherited(arguments);

			if (this.spatialReference === null) {
				this.spatialReference = this.map.spatialReference;
			}

			this.drawToolbar = new Draw(this.map);
			this.drawToolbar.on('draw-end', lang.hitch(this, 'onDrawToolbarDrawEnd'));

			var widget = this;
			// Заполнение комбобокса с методами создания геометрии поиска
			this.actionsStore = new Memory({
				data: [
					{name: 'Выбрать геометрию на карте', id: 'selectPolygon'},
					{name: 'Рисование полигона вручную', id: 'drawByVertices'},
					{name: 'Задание вершин по вводимым координатам', id: 'coordInput'}/*,
					 {name: 'Подгрузка CSV-файла с геометрией', id: 'fromFile'}/**/
				]
			});
			this.selectInputTypeDijit.set('store', this.actionsStore);
			this.selectInputTypeDijit.on('change', function (event) {
				var elements = widget.actionsStore.query({name: event});
				if (elements.length == 1) {
					var element = elements[0];
					widget.selectInputTypeDijit.inputTypeId = element['id'];
					var coordsInputNode = dom.byId('manualPolygonVerticeCoordinatesContainer');
					switch (element['id']) {
						case 'selectPolygon':
							dijit.byId('inputPolygonButton').setAttribute('label', widget.selectGeometry);
							dijit.byId('inputPolygonButton').setAttribute('disabled', false);
							widget.inputCoordPolygonGraphics.hide();
							coordsInputNode.style.display = 'none';
							break;
						case 'drawByVertices':
							dijit.byId('inputPolygonButton').setAttribute('label', 'Нарисовать полигон');
							dijit.byId('inputPolygonButton').setAttribute('disabled', false);
							widget.inputCoordPolygonGraphics.hide();
							coordsInputNode.style.display = 'none';
							break;
						case 'coordInput':
							dijit.byId('inputPolygonButton').setAttribute('label', 'Поиск по построенной геометрии');
							dijit.byId('inputPolygonButton').setAttribute('disabled', false);
							widget.createCoordinatesGrid();
							widget.inputCoordPolygonGraphics.show();
							coordsInputNode.style.display = 'block';
							if (!this.loadCoordFile && window.File && window.FileReader) {
								function handleFileSelect (event) {
									var file = event.target.files[0];
									var reader = new FileReader();
									reader.onload = (function () {
										return function (e) {
											var grid = $('#manualPolygonVerticeCoordinatesGrid').data().kendoGrid;
											grid.dataSource.data([]);
											var lines = e.target.result.split(/\r\n|\n/);
											for (var i = 0; i < lines.length; i++) {
												var coords = lines[i].split(';');
												if (coords.length >= 2) {
													var x = parseFloat(coords[0].replace(',', '.'));
													var y = parseFloat(coords[1].replace(',', '.'));
													grid.dataSource.add({
														x: x,
														y: y
													});
												}
											}
										}
									})(file);
									if (file) {
										var ext = file.name.split('.').pop();
										switch (ext.toLowerCase()) {
											case 'csv':
												reader.readAsText(file);
												break;
											default:
												alert('Файл с расширением ' + ext + ' не поддерживается. Выберите CSV-файл.');
												break;
										}
									}
								}

								document.getElementById('loadCoordFile').addEventListener('change', handleFileSelect, false);
								var loadCoordsNode = dom.byId('loadCoordinatesContainer');
								loadCoordsNode.style.display = 'block';
								this.loadCoordFile = true;
							}
							break;
						/*case 'fromFile':
						 dijit.byId('inputPolygonButton').setAttribute('label', 'Загрузить файл геометрии');
						 dijit.byId('inputPolygonButton').setAttribute('disabled', false);
						 widget.inputCoordPolygonGraphics.hide();
						 coordsInputNode.style.display = 'none';
						 break;*/
					}
				}
			});
			this.createGraphicLayers();
			this.createSearchPolygonsLayer();
			this.createHighlightPolygonsLayer();
			this.createInputCoordPolygonsLayer();

			this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));
			if (this.parentWidget && this.parentWidget.toggleable) {
				this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
					this.onLayoutChange(this.parentWidget.open);
				})));
			}
			this.map.infoWindow.on('hide', function () {
				dojo.destroy('selectBlockPolygonOnMap');
			})
		},
		createCoordinatesGrid: function () {
			var widget = this;
			if (!this.manualPolygonVerticeCoordinates) {
				this.manualPolygonVerticeCoordinates = $('#manualPolygonVerticeCoordinatesGrid').kendoGrid({
					dataSource: {
						data: [],
						schema: {
							model: {
								fields: {
									x: {type: "number", validation: {required: true}},
									y: {type: "number", validation: {required: true}}
								}
							}
						},
						change: function (event) {
							widget.inputCoordPolygonGraphics.clear();
							var items = event.sender.data();
							if (items.length > 1) {
								var coords = [];
								for (var i = 0; i < items.length; i++) {
									coords.push([items[i].x, items[i].y]);
								}
								coords.push([items[0].x, items[0].y]);
								var polygon = new Polygon(coords);
								polygon.setSpatialReference(widget.Controller['systemsOfAxes'].selectedSpatialReference);
								var projectParams = new ProjectParameters();
								projectParams.geometries = [polygon];
								projectParams.outSR = widget.Controller.map.spatialReference;
								esriConfig.defaults.geometryService.project(projectParams, function (geometries) {
									array.forEach(geometries, function (geometry) {
										var graphic = new Graphic(geometry, widget.FillSymbol(), {
											ren: 1
										});
										widget.inputCoordPolygonGraphics.add(graphic);
									});
								});
							}
						}
					},
					columns: [
						{field: 'x', title: 'X (E)'},
						{field: 'y', title: 'Y (N)'}
					],
					editable: {
						mode: 'incell'
					},
					toolbar: kendo.template($("#template").html()),
					selectable: true
				});
				var deleteCoordRowButton = dom.byId('deleteCoordRowButton');
				deleteCoordRowButton.onclick = function () {
					var grid = $('#manualPolygonVerticeCoordinatesGrid').data().kendoGrid;
					grid.removeRow(grid.tbody.find('.k-state-selected'));
				};
			}
		},
		distanceChanged: function () {
			var distanceTextBox = dom.byId('distanceTextBox');
			var distance = number.parse(distanceTextBox.value);
			if (isNaN(distance) || distance <= 0) {
				this.selectGeometry = 'Выбрать полигон';
				this.selectGeometryTooltip = 'Выберите полигон на карте';
			}
			else {
				this.selectGeometry = 'Выбрать геометрию';
				this.selectGeometryTooltip = 'Выберите объект на карте';
			}
			if (this.selectInputTypeDijit.item && this.selectInputTypeDijit.item.id === 'selectPolygon') {
				dijit.byId('inputPolygonButton').setAttribute('label', this.selectGeometry);
			}
		},
		/** Запуск построения полигона*/
		inputPolygon: function () {
			switch (this.selectInputTypeDijit.inputTypeId) {
				// Выбор полигона на карте
				case 'selectPolygon':
					this.map.disableSnapping();
					this.selectPolygon();
					break;
				// Рисование по вершинам или точкам
				case 'drawByVertices':
					this.map.enableSnapping({
						//alwaysSnap: true,
						snapToEdge: false
					});
					this.drawPolygon();
					break;
				// Ввод координат вручную
				case 'coordInput':
					if (this.inputCoordPolygonGraphics.graphics.length == 1) {
						var distanceTextBox = dom.byId('distanceTextBox');
						var distance = number.parse(distanceTextBox.value);
						this.searchWithBufferDistance(this.inputCoordPolygonGraphics.graphics[0], distance);
					}
					break;
				/*// Загрузка полигона из файла
				 case 'fromFile':
				 break;*/
			}
		},
		selectPolygon: function () {
			this.disconnectMapClick();
			this.addPoint = esriBundle.toolbars.draw.addPoint;
			esriBundle.toolbars.draw.addPoint = this.selectGeometryTooltip;
			esriBundle.toolbars.draw.addPointAction = 'selectPolygon';
			this.drawToolbar.activate(esri.toolbars.Draw.POINT);
		},
		/**
		 * Отрисовщик полигонов
		 * @param color цвет заливки
		 * @param outlineColor цвет обводки
		 * @param outlineWidth толщина обводки
		 * @param label метка отрисовщика
		 * @param description описание отрисовщика
		 * @returns {UniqueValueRenderer|*|_WidgetBase.polygonRenderer}
		 * @constructor
		 */
		PolygonRenderer: function (color, outlineColor, outlineWidth, label, description) {
			var polygonRenderer = new UniqueValueRenderer(new SimpleFillSymbol(), 'ren', null, null, ', ');
			polygonRenderer.addValue({
				value: 1,
				symbol: new SimpleFillSymbol({
					color: color,
					outline: {
						color: outlineColor,
						width: outlineWidth,
						type: 'esriSLS',
						style: 'esriSLSSolid'
					},
					type: 'esriSFS',
					style: 'esriSFSForwardDiagonal'
				}),
				label: label,
				description: description
			});
			return polygonRenderer;
		},
		LayerDefinition: function () {
			return {
				geometryType: 'esriGeometryPolygon',
				fields: [{
					name: 'OBJECTID',
					type: 'esriFieldTypeOID',
					alias: 'OBJECTID',
					domain: null,
					editable: false,
					nullable: false
				}, {
					name: 'ren',
					type: 'esriFieldTypeInteger',
					alias: 'ren',
					domain: null,
					editable: true,
					nullable: false
				}]
			}
		},
		createSearchPolygonsLayer: function () {
			this.searchPolygonGraphics = new FeatureLayer({
				layerDefinition: this.LayerDefinition(),
				featureSet: null
			}, {
				id: 'searchGraphics_poly',
				title: 'Search Graphics',
				mode: FeatureLayer.MODE_SNAPSHOT
			});
			this.searchPolygonGraphics.setRenderer(this.PolygonRenderer([255, 170, 0, 255], [255, 170, 0, 255], 1, 'polygons for blocks search', 'polygons for blocks search'));
			this.map.addLayer(this.searchPolygonGraphics);
			this.searchPolygonGraphics.disableMouseEvents();
		},
		/**
		 * Слой подсветки блоков запасов, выделенных в таблице результатов поиска
		 * */
		createHighlightPolygonsLayer: function () {
			this.highlightPolygonGraphics = new FeatureLayer({
				layerDefinition: this.LayerDefinition(),
				featureSet: null
			}, {
				id: 'highlightGraphics_poly',
				title: 'Highlight Graphics',
				mode: FeatureLayer.MODE_SNAPSHOT
			});
			this.highlightPolygonGraphics.setRenderer(this.PolygonRenderer([255, 0, 0, 255], [255, 0, 0, 127], 1, 'highlighting polygons', 'highlighting polygons'));
			this.map.addLayer(this.highlightPolygonGraphics);
			this.highlightPolygonGraphics.disableMouseEvents();
		},
		/**
		 * Слой для рисования полигонов по введённым вручную координатам
		 * */
		createInputCoordPolygonsLayer: function () {
			this.inputCoordPolygonGraphics = new FeatureLayer({
				layerDefinition: this.LayerDefinition(),
				featureSet: null
			}, {
				id: 'inputCoordGraphics_poly',
				title: 'Input Coordinates Graphics',
				mode: FeatureLayer.MODE_AUTO
			});
			this.inputCoordPolygonGraphics.spatialReference = esriConfig.defaults.spatialReferenceBer;
			this.inputCoordPolygonGraphics.setRenderer(this.PolygonRenderer([255, 0, 0, 255], [255, 0, 0, 127], 1, 'input coordinates polygons', 'input coordinates polygons'));
			this.map.addLayer(this.inputCoordPolygonGraphics);
			this.inputCoordPolygonGraphics.disableMouseEvents();
		},
		createGraphicLayers: function () {
			this.polygonGraphics = new FeatureLayer({
				layerDefinition: this.LayerDefinition(),
				featureSet: null
			}, {
				id: 'findblocks_poly',
				title: 'Поиск блоков запасов',
				mode: FeatureLayer.MODE_SNAPSHOT
			});
			this.polygonGraphics.setRenderer(this.PolygonRenderer([255, 170, 0, 255], [255, 170, 0, 255], 1, 'find blocks polygons', 'Find blocks polygons'));
			this.map.addLayer(this.polygonGraphics);
		},
		drawPolygon: function () {
			this.drawstart = esriBundle.toolbars.draw.start;
			this.drawresume = esriBundle.toolbars.draw.resume;
			this.drawfinish = esriBundle.toolbars.draw.finish;
			this.drawcomplete = esriBundle.toolbars.draw.complete;
			esriBundle.toolbars.draw.start = 'Щёлкните мышкой, чтобы начать рисовать полигон\nУдерживайте Ctrl, если хотите привязаться к вершинам полигонов и точкам';
			esriBundle.toolbars.draw.resume = 'Щёлкните мышкой, чтобы продолжить рисование полигона\nУдерживайте Ctrl, если хотите привязаться к вершинам полигонов и точкам';
			esriBundle.toolbars.draw.finish = 'Чтобы закончить рисование, щёлкните мышкой дважды\nЧтобы продолжить рисование, щёлкните один раз';
			esriBundle.toolbars.draw.complete = 'Чтобы закончить рисование, щёлкните мышкой дважды\nЧтобы продолжить рисование, щёлкните один раз';
			this.disconnectMapClick();
			this.drawToolbar.activate(Draw.POLYGON);
		},
		drawFreehandPolygon: function () {
			this.disconnectMapClick();
			this.drawToolbar.activate(Draw.FREEHAND_POLYGON);
		},
		/*selectBlock: function () {
		 if (this.polygonSelectionLayer) {
		 if (!this.polygonSelectionLayer.mouseover) {
		 this.polygonSelectionLayer.on('mouse-over', function (event) {
		 var graphic = event.graphic;
		 console.log(graphic);
		 });
		 this.polygonSelectionLayer.on('mouse-out', function () {

		 });
		 this.polygonSelectionLayer.mouseover = true;
		 }
		 this.polygonSelectionLayer.enableMouseEvents();
		 }
		 },*/
		disconnectMapClick: function () {
			topic.publish('mapClickMode/setCurrent', 'draw');
		},
		connectMapClick: function () {
			topic.publish('mapClickMode/setDefault');
		},
		onDrawToolbarDrawEnd: function (evt) {
			this.drawToolbar.deactivate();
			this.connectMapClick();
			var graphic;
			if (evt.geometry.type === 'polygon') {
				graphic = new Graphic(evt.geometry, null, {
					ren: 1
				});
				var distanceTextBox = dom.byId('distanceTextBox');
				var distance = number.parse(distanceTextBox.value);
				this.searchWithBufferDistance(graphic, distance);
			}
			else if (evt.geometry.type === 'point') {
				if (esriBundle.toolbars.draw.addPointAction === 'selectPolygon') {
					this.selectAndShowGraphicsAtPoint(evt.geometry);
				}
				esriBundle.toolbars.draw.addPointAction = undefined;
			}
		},
		selectAndShowGraphicsAtPoint: function (point) {
			var widget = this;
			var distanceTextBox = dom.byId('distanceTextBox');
			var distance = number.parse(distanceTextBox.value);
			var geometry;
			if (isNaN(distance) || distance <= 0)
				geometry = point;
			else { // Если задана дистанция, искать надо не только полигоны, но и точки. Для этого надо увеличить точку поиска до круга
				var tol = this.map.extent.getWidth() / this.map.width * 5;
				var x = point.x;
				var y = point.y;
				geometry = new Extent(x - tol, y - tol, x + tol, y + tol, point.spatialReference);
			}
			var newQuery = function (returnGeometry, where, outFields) {
				var query = new Query();
				query.where = where ? where : '1=1';
				query.geometry = geometry;
				query.returnGeometry = returnGeometry;
				query.outFields = outFields;
				query.outSpatialReference = widget.map.spatialReference;
				return query;
			};
			/*var layerQuery = function (layer, returnGeometry, where) {
			 return layer.queryFeatures(newQuery(false, where, ['*']), function (response) {
			 //console.log('success: at', layer);
			 }, function (error) {
			 console.log('Ошибка выполнения запроса у слоя ' + layer.url + ':');
			 console.dir(error);
			 });
			 };*/
			var queries = [];

			var buildLayerQueryWhere = function (layer) {
				var where;
				if (layer.timeInfo && (layer.timeInfo.startTimeField || layer.timeInfo.endTimeField)) {
					var currentDate = widget.getSliderTimeExtent();
					if (currentDate) {
						if (layer.timeInfo.startTimeField && layer.timeInfo.endTimeField)
							where = layer.timeInfo.startTimeField + '<=' + esriConfig.defaults.queryDateFormat(currentDate) + ' And (' +
								layer.timeInfo.endTimeField + '>=' + esriConfig.defaults.queryDateFormat(currentDate) + ' Or ' +
								layer.timeInfo.endTimeField + ' Is Null)';
						else
							where = (layer.timeInfo.startTimeField ? layer.timeInfo.startTimeField : layer.timeInfo.endTimeField) + '=' + esriConfig.defaults.queryDateFormat(currentDate);
					}
				}
				else
					where = '1=1';
				return where;
			};

			var widget = this;

			var layerIdentifyFields = function (layerId, subLayerId) {
				var identify = widget.Controller['identify'].identifies[layerId];
				var outFields = ['*'];
				if (identify) {
					var subLayerIdentify = identify[subLayerId];
					if (subLayerIdentify) {
						var flIdentify = subLayerIdentify.info ? subLayerIdentify.info : subLayerIdentify; // поле info появляется после первого использования идентификации
						if (flIdentify.fieldInfos && flIdentify.fieldInfos.length > 0) {
							outFields = [];
							flIdentify.fieldInfos.forEach(function (field) {
								if (field.visible)
									outFields.push(field.fieldId ? field.fieldId : field.fieldName);
							})
						}
					}
				}
				return outFields;
			};

			for (var i = this.Controller.layers.length - 1; i >= 0; i--) {
				var layer = this.Controller.layers[i];
				if (layer.visible) {
					if (layer.queryFeatures) {
						//queries.push(layerQuery(layer, false, buildLayerQueryWhere(layer)));
						var outFields = layerIdentifyFields(layer.id, 0);
						var where = buildLayerQueryWhere(layer);
						var qTask = new QueryTask(layer.url);
						queries.push(qTask.execute(newQuery(true, where, outFields), undefined, function (error) {
							console.log('Ошибка выполнения запроса у слоя ' + url + ':');
							console.dir(error);
						}));
					}
					else if (layer.layerInfos && layer.visibleLayers && layer.visibleLayers.length > 0) {
						for (var j = 0; j < layer.visibleLayers.length; j++) {
							var id = layer.visibleLayers[j];
							var url = layer.url + id;
							var fl = layer.layers[url];
							if (fl && id >= 0 && !layer.layerInfos[id].subLayerIds) {
								var outFields = layerIdentifyFields(layer.id, id);
								if (outFields.length > 1 || outFields[0] !== '*') {
									var outFieldsTreated = [];
									for (var o = 0; o < outFields.length; o++) {
										var outField = outFields[o];
										var treated = false;
										for (var f = 0; f < fl.fields.length; f++) {
											var field = fl.fields[f];
											if (field.name == outField || field.alias == outField) {
												outFieldsTreated.push(field.name);
												treated = true;

											}
										}
										if (!treated)
											outFieldsTreated.push(outField);
									}
									outFields = outFieldsTreated;
								}
								var where = buildLayerQueryWhere(fl);
								var qTask = new QueryTask(url);
								queries.push(qTask.execute(newQuery(true, where, outFields), undefined, function (error) {
									console.log('Ошибка выполнения запроса у динамического слоя ' + url + ':');
									console.dir(error);
								}));
							}
						}
					}
				}
			}
			var promise = all(queries);
			promise.then(function (results) {
				var resultFeatures = [];
				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					var features = result.features;
					for (var j = 0; j < features.length; j++) {
						var feature = features[j];
						var blockName = feature.attributes[result.displayFieldName];
						var content = '<b>' + (blockName ? blockName : 'Объект без наименования') + '</b>';
						if (feature._layer)
							content += '<br/>\n<b>Слой: </b>' + feature._layer.name;
						for (var f = 0; f < result.fields.length; f++) {
							var field = result.fields[f];
							content += '<br/>\n<b>' + field.alias + ': </b>' + feature.attributes[field.name];
						}
						var infoTemplate = new InfoTemplate('Выберите геометрию', content);
						feature.setInfoTemplate(infoTemplate);
						resultFeatures.push(feature);
					}
				}
				if (resultFeatures.length > 0) {
					if (!dojo.byId('selectBlockPolygonOnMap')) {
						dojo.create('a', {
							'id': 'selectBlockPolygonOnMap',
							'class': 'link',
							'innerHTML': '<a href="javascript:void(0);">Выбрать</a>',
							'onclick': function () {
								if (widget.map.infoWindow.features) {
									var feature = widget.map.infoWindow.features[widget.map.infoWindow.selectedIndex];
									if (feature) {
										var graphic = new Graphic(feature.geometry, null, {
											ren: 1
										});
										var distanceTextBox = dom.byId('distanceTextBox');
										var distance = number.parse(distanceTextBox.value);
										widget.searchWithBufferDistance(graphic, distance);
									}
								}
								widget.map.infoWindow.hide();
							}
						}, dojo.query('.actionList', widget.map.infoWindow.domNode)[0]);
					}
					widget.map.infoWindow.setFeatures(resultFeatures);
					var screenPoint = screenUtils.toScreenPoint(widget.map.extent, widget.map.width, widget.map.height, point);
					widget.map.infoWindow.show(screenPoint);
				}
			});
		},
		searchWithBufferDistance: function (graphic, distance) {
			if (isNaN(distance) || distance <= 0) { // если дистанция не задана, поиск производится внутри нарисованного полигона
				this.search(graphic);
				this.searchPolygonGraphics.add(graphic);
			}
			else { // дистанция задана - к полигону добавляется буфер
				var buffer = new esri.tasks.BufferParameters();
				buffer.geometries = [graphic.geometry];
				buffer.distances = [distance];
				buffer.unit = esri.tasks.GeometryService.UNIT_METER;
				buffer.outSpatialReference = this.map.spatialReference;
				buffer.geodesic = true;
				esriConfig.defaults.geometryService.buffer(buffer, lang.hitch(this, function (b) {
					var gr = this.bufferGeometry(b);
					this.search(gr);
					this.polygonGraphics.add(gr);
					this.searchPolygonGraphics.add(graphic);
				}));
			}
		},
		clearGraphics: function () {
			this.endDrawing();
			this.connectMapClick();
			this.clearResultsGrids();
			var buttonContainerNode = dom.byId('collapseButton_bottom');
			var collapseButtonNode = buttonContainerNode.firstChild;
			if (collapseButtonNode.className.indexOf('close') > -1)
				collapseButtonNode.click();
		},
		endDrawing: function () {
			if (this.addPoint)
				esriBundle.toolbars.draw.addPoint = this.addPoint;
			if (this.drawstart)
				esriBundle.toolbars.draw.start = this.drawstart;
			if (this.drawresume)
				esriBundle.toolbars.draw.resume = this.drawresume;
			if (this.drawfinish)
				esriBundle.toolbars.draw.finish = this.drawfinish;
			if (this.drawcomplete)
				esriBundle.toolbars.draw.complete = this.drawcomplete;
			this.polygonGraphics.clear();
			this.searchPolygonGraphics.clear();
			this.highlightPolygonGraphics.clear();
			this.drawToolbar.deactivate();
		},
		onLayoutChange: function (open) {
			// end drawing on close of title pane
			if (!open) {
				this.endDrawing();
				if (this.mapClickMode === 'draw') {
					topic.publish('mapClickMode/setDefault');
				}
			}
		},
		setMapClickMode: function (mode) {
			this.mapClickMode = mode;
		},
		/**
		 *Построение геометрии по буферу
		 * @param{buf} буфер
		 */
		bufferGeometry: function (buf) {
			var attribs = {'type': 'Geodesic'};
			return graphic = new Graphic(buf[0], null, attribs);
		},
		/**
		 Подсчёт площадей
		 * @param(geometryService) сервис геметрических расчётов
		 * @param{geometries} массив геометрий пересечений
		 * @param{blocks} массив блоков
		 * @param(featureSet) результаты запроса
		 */
		calcAreas: function (geometryService, geometries, blocks, featureSet) {
			if (!geometries)
				throw 'Не задан массив геометрий пересечений для вычисления площадей';
			if (!blocks)
				throw 'Не задан массив блоков';
			if (geometries.length != blocks.length)
				throw 'Массив блоков и массив геометрий пересечений должны быть одной длины';
			var areasAndLengthParams = new AreasAndLengthsParameters();
			areasAndLengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
			areasAndLengthParams.areaUnit = esri.tasks.GeometryService.UNIT_SQUARE_METERS;
			areasAndLengthParams.calculationType = 'geodesic';
			var calcGeometries = [];
			for (var i = 0; i < geometries.length; i++) {
				calcGeometries.push(geometries[i]);
				calcGeometries.push(blocks[i].geometry);
			}
			geometryService.featureSet = featureSet;
			geometryService.inputGeometries = geometries;
			geometryService.inputBlocks = blocks;
			areasAndLengthParams.polygons = calcGeometries;
			geometryService.areasAndLengths(areasAndLengthParams);
		},
		exportResults: function () {
			var sheets = [];
			// Экспорт данных в MS Excel. Настройки экспорта в calcresources.js resultTables - export
			for (var i = 0; i < this.widget.resultTables.length; i++) {
				var table = this.widget.resultTables[i];
				if (this.widget[table.id]) {
					var rows = [];
					if (table.export.pushHeaderRows)
						table.export.pushHeaderRows(rows);
					var data = this.widget[table.id].data().toJSON();
					if (table.export.sort)
						data.sort(table.export.sort);
					if (table.export.fill)
						table.export.fill(data, rows);
					var columns = [];
					for (var j = 0; j < table.export.columnsCount; j++, columns.push({autoWidth: true}));
					sheets.push({
						freezePane: table.export.freezePane,
						columns: columns,
						title: table.export.title,
						rows: rows
					});
				}
			}
			// Если есть хотя бы один лист, файл сохраняется
			if (sheets.length > 0) {
				var workbook = new kendo.ooxml.Workbook({
					sheets: sheets
				});
				var ext = '.xlsx';
				var filename = dom.byId('exportFileNameInput').value;
				var extPos = filename.toLowerCase().indexOf(ext);
				if (!filename)
					filename = 'Расчёт запасов' + ext;
				else if (extPos == -1 || extPos != filename.length - ext.length)
					filename += ext;
				kendo.saveAs({
					dataURI: workbook.toDataURL(),
					fileName: filename
				});
			}
		},
		/**
		 * Создание гридов с результатами
		 * @param{dataSource} источник данных kendo.grid.datasource
		 * @param{dataSource} источник агрегированных данных kendo.grid.datasource
		 * @param{featureSet} результаты запроса esri.tasks.FeatureSet
		 */
		createResultsGrids: function (dataSource, aggregatedDatasource, featureSet) {
			if (!this.grid) {
				for (var i = 0; i < this.resultTables.length; i++) {
					var table = this.resultTables[i];
					var grid = table.grid;
					$(grid.node).kendoGrid({
						widget: this,
						change: grid.change ? grid.change : undefined,
						scrollable: grid.scrollable ? grid.scrollable : undefined,
						resizable: grid.resizable ? grid.resizable : undefined,
						selectable: grid.selectable ? grid.selectable : undefined,
						sortable: true,
						columns: grid.columns,
						dataSource: this[table.id],
						height: '99%' // 100% чуть-чуть не помещается в табконтейнер - появляется скролбар
					});
				}
				dom.byId('exportResultsButton').onclick = this.exportResults;
				dom.byId('exportResultsButton').widget = this;
				this.grid = true;
			}
		},
		/**
		 * Поиск
		 * @param{layers} коллекция слоёв, на которых нужно произвести поиск
		 * @param{queryParams} условие поиска
		 * @param{action} действие с найденными объектами
		 * @param{checkLayer} метод проверки слоя
		 */
		queryLayersFeatures: function (layers, queryParams, action, checklayer) {
			var currentDate = this.getSliderTimeExtent();
			var query = esri.tasks.Query();
			if (queryParams.where)
				query.where = queryParams.where;
			if (queryParams.outFields)
				query.outFields = queryParams.outFields;
			if (queryParams.geometry)
				query.geometry = queryParams.geometry;

			array.forEach(layers, function (layer) {
				if (!checklayer || checklayer(layer)) {
					if (currentDate && layer.timeInfo && (layer.timeInfo.startTimeField || layer.timeInfo.endTimeField)) {
						var condition;
						if (layer.timeInfo.startTimeField && layer.timeInfo.endTimeField)
							condition = layer.timeInfo.startTimeField + '<=' + esriConfig.defaults.queryDateFormat(currentDate) + ' And (' +
								layer.timeInfo.endTimeField + '>=' + esriConfig.defaults.queryDateFormat(currentDate) + ' Or ' +
								layer.timeInfo.endTimeField + ' Is Null)';
						else
							condition = (layer.timeInfo.startTimeField ? layer.timeInfo.startTimeField : layer.timeInfo.endTimeField) + '=' + esriConfig.defaults.queryDateFormat(currentDate);
						if (query.where)
							query.where += ' And ' + condition;//layer.timeInfo.startTimeField + '=' + esriConfig.defaults.queryDateFormat(currentDate);
						else
							query.where = condition;//layer.timeInfo.startTimeField + '=' + esriConfig.defaults.queryDateFormat(currentDate);
					}
					layer.queryFeatures(query, action);
				}
			})
		},
		getSliderTimeExtent: function () {
			var timeExtent = this.Controller['timeSlider'].getCurrentTimeExtent();
			if (timeExtent) {
				if (timeExtent.endTime)
					return timeExtent.endTime;
				else if (timeExtent.startTime)
					return timeExtent.startTime;
			}
			return undefined;
		},
		search: function (graphic) {
			var countNode = dom.byId('findResultsCount');
			var queryingGif = dom.byId('queryingGif');
			var gridContainerNode = dom.byId('findResultsGridContainer');
			var exportResultsNode = dom.byId('exportResultsContainer');
			var buttonContainerNode = dom.byId('collapseButton_bottom');

			var collapseButtonNode = buttonContainerNode.firstChild;
			if (collapseButtonNode.className.indexOf('close') > -1)
				collapseButtonNode.click();
			collapseButtonNode.click();

			countNode.innerHTML = 'Идёт поиск блоков запасов в заданной геометрии';
			queryingGif.style.display = 'block';
			gridContainerNode.style.display = 'block';
			exportResultsNode.style.display = 'block';
			this.clearFeatures();
			var widget = this;
			// Создание или очистка хранилищ результатов. Описание в файле calcresources.js, разделы resultTables.datasource
			for (var i = 0; i < this.resultTables.length; i++) {
				var table = this.resultTables[i];
				if (this[table.id]) {
					this[table.id].data([]);
					if (this[table.id].added)
						delete this[table.id].added;
				}
				else {
					var group;
					if (table.datasource.group) { // Если в описании хранилища есть группировка, к ней добавляется агрегация
						group = [];
						for (var j = 0; j < table.datasource.group.length; j++) {
							group.push({
								field: table.datasource.group[j],
								aggregates: table.datasource.aggregates
							});
						}
					}
					this[table.id] = new kendo.data.DataSource({
						group: group,
						aggregates: group ? undefined : table.datasource.aggregates, // если есть группировка, отдельно агрегация не добавляется
						change: table.datasource.change
					});
				}
			}

			this.queryLayersFeatures([esriConfig.defaults.calcBlocksLayer], {
					outFields: ['*'],
					geometry: graphic.geometry,
					where: "BALANCE In ('Балансовые', 'Забалансовые')"
				},
				function (response) {
					var results = response.features;
					var resultsNode = dom.byId('resultsBottom');
					domStyle.set(resultsNode, {
						'visibility': 'visible'
					});
					if (results.length > 0) {
						var geometries = [];
						var blocks = [];
						for (var i = 0; i < results.length; i++) {
							var block = results[i];
							blocks.push(block);
							geometries.push(block.geometry);
						}
						var rows = 0;
						var gsvc = esriConfig.defaults.createGeometryService();
						gsvc.on("areas-and-lengths-complete", function (event) {

							var blocks = event.target.inputBlocks;
							var areas = event.result.areas;
							if (blocks.length * 2 == areas.length) {
								for (var i = 0; i < blocks.length; i++) {
									var attribs = blocks[i].attributes;
									for (var j = 0; j < widget.resultTables.length; j++) {
										var table = widget.resultTables[j];
										if (!table.rowsOptions.aggregateFromId) {
											var row = table.rowsOptions.prepareRow(attribs, areas, i);
											if (row) {
												var fs = event.target.featureSet;
												array.forEach(fs.fields, function (attrib) {
													if (attrib.name.indexOf('(') == -1) {
														row[attrib.name] = attribs[attrib.name] ? attribs[attrib.name] : '';
													}
												});
												widget[table.id].add(row);
												rows++;
											}
										}
									}
								}
								if (rows > 0) {
									countNode.innerHTML = 'Найдено ' + rows + ' блоков';
									gridContainerNode.style.display = 'block';
									exportResultsNode.style.display = 'block';
								}
								else {
									countNode.innerHTML = 'Блоки запасов в заданной геометрии не найдены';
									gridContainerNode.style.display = 'none';
									exportResultsNode.style.display = 'none';
								}
								queryingGif.style.display = 'none';
								collapseButtonNode.click();
								collapseButtonNode.click();
								for (var i = 0; i < widget.resultTables.length; i++) {
									var table = widget.resultTables[i];
									if (table.rowsOptions.aggregateRow && table.rowsOptions.aggregateFromId && widget[table.rowsOptions.aggregateFromId]) {
										var aggregatedData = {}; // Агрегированные данные
										var fromData = widget[table.rowsOptions.aggregateFromId].data();
										for (var j = 0; j < fromData.length; j++) {
											table.rowsOptions.aggregateRow(aggregatedData, fromData[j]);
										}
										var aggregatedArray = [];
										var properties = [];
										for (var property in aggregatedData) {
											properties.push(property);
										}
										properties.sort();
										for (var i = 0; i < properties.length; i++) {
											aggregatedArray.push(aggregatedData[properties[i]]);
										}
										if (!widget[table.id])
											widget[table.id] = new kendo.data.DataSource({});
										widget[table.id].data(aggregatedArray);
									}
								}
							}
						});
						gsvc.intersect(geometries, graphic.geometry, function (intersectGeometries) {
							for (var i = 0; i < intersectGeometries.length; i++) {
								var graphic = new Graphic(intersectGeometries[i],
									new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
										new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
											new Color([0, 0, 0, 0]), 0), new Color([0, 0, 0, 0])),
									{
										'OBJECTID': results[i].attributes['OBJECTID']
									}
								);
								widget.highlightPolygonGraphics.add(graphic);
							}
							widget.calcAreas(gsvc, intersectGeometries, blocks, response);
						});
						widget.createResultsGrids(widget.dataSource, widget.aggregatedDataSource, response);
					}
					else {
						countNode.innerHTML = 'Блоки запасов в заданной геометрии не найдены';
						gridContainerNode.style.display = 'none';
						exportResultsNode.style.display = 'none';
						queryingGif.style.display = 'none';
						collapseButtonNode.click();
						collapseButtonNode.click();
					}
				},
				function (layer) {
					return layer.type === 'Feature Layer' && layer.visible;
				}
			);
		},

		clearResultsGrids: function () {
			var countNode = dom.byId('findResultsCount');
			countNode.innerHTML = '';
			var gridContainerNode = dom.byId('findResultsGridContainer');
			var exportResultsNode = dom.byId('exportResultsContainer');
			gridContainerNode.style.display = 'none';
			exportResultsNode.style.display = 'none';
		},


		clearFeatures: function () {
			this.polygonGraphics.clear();
			this.searchPolygonGraphics.clear();
			this.highlightPolygonGraphics.clear();
		},

		FillSymbol: function () {
			var r = Math.floor(256 * Math.random());
			var g = Math.floor(256 * Math.random());
			var b = Math.floor(256 * Math.random());
			return new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
				new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
					new Color([r, g, b, .5]), 2),
				new Color([r, g, b, .05]));
		},
		/**
		 * Подсветка графических объектов на слое
		 * @param{objects} коллекция объектов
		 */
		highlightFeatures: function (objects) {
			var unique = 0;
			array.forEach(objects, function (result) {
				// add a unique key for the store
				result.id = unique;
				unique++;
				var graphic, feature = result; //.feature;
				if (feature.geometry.type === 'polygon') {
					// only add polygons to the map that have rings
					if (feature.geometry.rings && feature.geometry.rings.length > 0) {
						var fillSymbol = this.FillSymbol();
						graphic = new Graphic(feature.geometry, fillSymbol, {
							ren: 1,
							OBJECTID: feature.attributes['OBJECTID'],
							fillSymbol: fillSymbol
						});
						this.polygonGraphics.add(graphic);
					}
				}
			}, this);

			// zoom to layer extent
			var zoomExtent = null;
			//If the layer is a single point then extents are null
			// if there are no features in the layer then extents are null
			// the result of union() to null extents is null

			/*if (this.pointGraphics.graphics.length > 0) {
			 zoomExtent = this.getPointFeaturesExtent(this.pointGraphics.graphics);
			 }
			 if (this.polylineGraphics.graphics.length > 0) {
			 if (zoomExtent === null) {
			 zoomExtent = graphicsUtils.graphicsExtent(this.polylineGraphics.graphics);
			 } else {
			 zoomExtent = zoomExtent.union(graphicsUtils.graphicsExtent(this.polylineGraphics.graphics));
			 }
			 }*/
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
		},

		zoomToExtent: function (extent) {
			this.map.setExtent(extent.expand(1.2));
		}

	});
});