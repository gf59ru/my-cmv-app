define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'esri/dijit/Measurement',
	'esri/toolbars/draw',
	'esri/tasks/ProjectParameters',
	'dojo/i18n!esri/nls/jsapi',
	'dojo/aspect',
	'dojo/_base/lang',
	'dojo/dom-construct',
	'dojo/topic'
], function (declare,
			 _WidgetBase,
			 Measurement,
			 Draw,
			 ProjectParameters,
			 esriBundle,
			 aspect,
			 lang,
			 domConstruct,
			 topic) {

	return declare([_WidgetBase], {
		declaredClass: 'gis.dijit.Measurement',
		mapClickMode: null,
		drawToolbar: null,
		postCreate: function () {
			this.inherited(arguments);

			this.drawToolbar = new Draw(this.map);
			this.drawToolbar.on('draw-end', lang.hitch(this, 'onDrawToolbarDrawEnd'));

			this.measure = new Measurement({
				map: this.map,
				defaultAreaUnit: this.defaultAreaUnit,
				defaultLengthUnit: this.defaultLengthUnit
			}, domConstruct.create('div')).placeAt(this.domNode);
			this.locationButton = domConstruct.place('<button data-dojo-type="dijit/form/Button" data-dojo-props="iconClass:\'clearIcon\',showLabel:true">Координаты</button>', this.domNode, 1);
			this.locationButton.onclick = lang.hitch(this, function () {
				this.disconnectMapClick();
				this.map.enableSnapping();
				esriBundle.toolbars.draw.addPoint = 'Выберите точку для измерения координат';
				this.drawToolbar.activate(esri.toolbars.Draw.POINT);
			});
			this.locationResult = domConstruct.place('<div></div>', this.domNode, 2);
			this.measure.startup();
			/*this.measureTool.on('measure-end', function(event) {
			 console.log(event);
			 });*/
			this.measure.hideTool('location');
			aspect.after(this.measure, 'setTool', lang.hitch(this, 'checkMeasureTool'));
			aspect.after(this.measure, 'closeTool', lang.hitch(this, 'checkMeasureTool'));
			this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));
			if (this.parentWidget && this.parentWidget.toggleable) {
				this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
					this.onLayoutChange(this.parentWidget.open);
				})));
			}
		},
		onDrawToolbarDrawEnd: function (event) {
			this.drawToolbar.deactivate();
			if (event.geometry.type === 'point') {
				var point = event.geometry;
				point.setSpatialReference(this.Controller.map.spatialReference);
				var projectParams = new ProjectParameters();
				projectParams.geometries = [point];
				projectParams.outSR = this.Controller['systemsOfAxes'].selectedSpatialReference;
				esriConfig.defaults.geometryService.project(projectParams, lang.hitch(this, function (geometries) {
					for (var i = 0; i < geometries.length; i++) {
						var geometry = geometries[i];
						var table = '<table style="width: 100%">\n';
						table += '\t<tr>\n';
						table += '\t\t<td>X (E)</td>\n';
						table += '\t\t<td>Y (N)</td>\n';
						table += '\t</tr>\n';
						table += '\t<tr>\n';
						table += '\t\t<td>' + kendo.format('{0:#,##0.###}', geometry.x) + '</td>\n';
						table += '\t\t<td>' + kendo.format('{0:#,##0.###}', geometry.y) + '</td>\n';
						table += '\t</tr>\n';
						table += '</table>\n';
						this.locationResult.innerHTML = table;
					}
				}));
			}
			this.connectMapClick();
		},
		checkMeasureTool: function () {
			// no measurement tool is active
			if (!this.measure.activeTool || this.measure.activeTool === '') {
				if (this.mapClickMode === 'measure') {
					this.connectMapClick();
				}
				// a measurement tool is active
			} else {
				if (this.mapClickMode !== 'measure') {
					this.disconnectMapClick();
				}
			}
		},
		disconnectMapClick: function () {
			topic.publish('mapClickMode/setCurrent', 'measure');
		},
		connectMapClick: function () {
			topic.publish('mapClickMode/setDefault');
		},
		onLayoutChange: function (open) {
			// end measurement on close of title pane
			if (!open && this.mapClickMode === 'measure') {
				this.connectMapClick();
			}
		},
		setMapClickMode: function (mode) {
			this.mapClickMode = mode;
			if (mode !== 'measure') {
				this.measure.setTool('area', false);
				this.measure.setTool('distance', false);
				this.measure.setTool('location', false);
				this.measure.clearResult();
			}
		},
	});
});