define([
	'dojo/dom',
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/_base/lang',
	'esri/geometry/Extent',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dojo/_base/array',
	'dojox/lang/functional',
	'dojo/text!./SystemOfAxes/templates/SystemOfAxes.html',
	'dijit/form/DropDownButton',
	'xstyle/css!./SystemOfAxes/css/SystemOfAxes.css'
], function (dom,
			 declare,
			 _WidgetBase,
			 _TemplatedMixin,
			 _WidgetsInTemplateMixin,
			 lang,
			 Extent,
			 DropDownMenu,
			 MenuItem,
			 array,
			 functional,
			 template) {

	// main basemap widget
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString: template,
		widgetsInTemplate: true,
		title: 'Системы координат',
		postCreate: function () {
			this.inherited(arguments);
			this.menu = new DropDownMenu({
				style: 'display: none;' //,
				//baseClass: this.menuClass
			});
			for (var i = 0; i < this.systemsList.length; i++) {
				var system = this.systemsList[i];
				this.addSystemOfAxes(system.title, system.spatialReference);
			}
			this.dropDownButton.set('dropDown', this.menu);
		},
		/**
		 * Добавление системы координат в выпадающий список
		 * @param title Заголовок
		 * @param spatialReference Описание системы координат
		 */
		addSystemOfAxes: function (title, spatialReference) {
			var menuItem = new MenuItem({
				label: title,
				iconClass: this.compareSpatialReferences(spatialReference, this.selectedSpatialReference) ? 'selectedIcon' : 'emptyIcon',
				spatialReference: spatialReference,
				onClick: lang.hitch(this, function () {
					if (!this.compareSpatialReferences(spatialReference, this.selectedSpatialReference)) {
						this.selectedSpatialReference = spatialReference;
						var ch = this.menu.getChildren();
						array.forEach(ch, lang.hitch(this, function (c) {
							if (this.compareSpatialReferences(c.spatialReference, this.selectedSpatialReference)) {
								c.set('iconClass', 'selectedIcon');
							} else {
								c.set('iconClass', 'emptyIcon');
							}
						}));
					}
				})
			});
            this.menu.addChild(menuItem);
		},
		/**
		 * Сравнение систем координат
		 * @param sr1 Первая система
		 * @param sr2 Вторая система
		 * @returns {boolean} true, если равны
		 */
		compareSpatialReferences: function (sr1, sr2) {
			if (sr1 && sr2) {
				if (sr1.wkid && sr2.wkid) {
					return sr1.wkid === sr2.wkid;
				}
				if (sr1.wkt && sr2.wkt) {
					return sr1.wkt === sr2.wkt;
				}
			}
			return false;
		},
		startup: function () {
			this.inherited(arguments);
		}
	});
});
