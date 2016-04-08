/**
 * Настройки виджета расчёта запасов
 */
define([
	'dojo/_base/Color',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/graphicsUtils',
	'dojo/_base/array'
], function (Color,
             SimpleLineSymbol,
             SimpleFillSymbol,
             graphicsUtils,
             array) {
	// Элементы для заголовков колонок общей таблицы
	var headerP = '<p style="text-align: center; vertical-align: middle; white-space: normal">';
	var _P = '</p>';
	// стиль ячеек по умолчанию
	var defaultStyle = 'font-size: 12px; padding: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap';
	// Начало элемента шаблона
	var templatePLeft = '<p style="text-align:left;' + defaultStyle;
	var templatePRight = '<p style="text-align:right;' + defaultStyle;
	var templatePCenter = '<p style="text-align:center;' + defaultStyle;
	var plastIndex = function (plast) {
		switch (plast) {
			case 'КС':
				return 1 + '.' + plast;
			case 'Кр III':
				return 2 + '.' + plast;
			case 'Кр II':
				return 3 + '.' + plast;
			case 'Кр I':
				return 4 + '.' + plast;
			case 'АБ':
				return 5 + '.' + plast;
			case 'В':
				return 6 + '.' + plast;
			default:
				return 7 + '.' + plast;
		}
	};
	return {
		map: true,
		mapClickMode: true,
		// таблицы с результатами расчёта
		resultTables: [
			// Общая таблица
			{
				// идентификатор таблицы
				id: 'resultSource',
				// Описание добавления строк данных
				rowsOptions: {
					// Начальная подготовка строки. После начальной подготовки строка заполняется всеми существующими атрибутами
					prepareRow: function (attribs, areas, i) {
						var intersectArea = areas[i * 2];
						if (intersectArea > 0) {
							var blockArea = areas[i * 2 + 1];
							var density = attribs['DENSITY'];
							return {
								indexedPlast: plastIndex(attribs.PLAST),
								intersectArea: intersectArea,
								blockArea: blockArea,
								areaPercent: intersectArea / blockArea * 100,
								rawSaltResources: intersectArea * attribs.M * density / 1000,
								KClResources: attribs.KCL * intersectArea * attribs.M * density / 100000,
								K2OResources: attribs.KCL * intersectArea * attribs.M * density / 100000 * esriConfig.defaults.K2OMultiplier,
								MgCl2Resources: attribs.MGCL2 * intersectArea * attribs.M * density / 100000,
								MgOResources: attribs.MGCL2 * intersectArea * attribs.M * density / 100000 * esriConfig.defaults.MgOMultiplier,
								BrResources: attribs.BR * intersectArea * attribs.M * density / 100000
							};
						}
					}
				},
				// настройки хранилища данных
				datasource: {
					// группируемые поля
					group: ['indexedPlast', 'RUDA', 'BALANCE'],
					// поля с агрегацией
					aggregates: [
						{
							field: 'rawSaltResources',
							aggregate: 'sum'
						}, {
							field: 'KClResources',
							aggregate: 'sum'
						}, {
							field: 'K2OResources',
							aggregate: 'sum'
						}, {
							field: 'MgCl2Resources',
							aggregate: 'sum'
						}, {
							field: 'MgOResources',
							aggregate: 'sum'
						}, {
							field: 'BrResources',
							aggregate: 'sum'
						}
					]
				},
				// Настройки грида
				grid: {
					// html-элемент
					node: '#findResultsGrid',
					// настройки грида
					change: function () {
						var selectedRows = this.select();
						if (selectedRows.length > 0) {
							var dataItem = this.dataItem(selectedRows[0]);
							var widget = this.options.widget;
							array.forEach(widget.highlightPolygonGraphics.graphics, function (graphic) {
								if (graphic.attributes['OBJECTID'] == dataItem.OBJECTID) {
									graphic.setSymbol(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
										new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
											new Color([255, 0, 0, .75]), 2), new Color([255, 0, 0, .5])));
									var ext = graphicsUtils.graphicsExtent([graphic]);
									while (ext.getHeight() < 1 && ext.getWidth() < 1)
										ext = ext.expand(2);
									widget.map.setExtent(ext.expand(2), true);
								}
								else
									graphic.setSymbol(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
										new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
											new Color([0, 0, 0, 0]), 0), new Color([0, 0, 0, 0])));
							});
						}
					},
					scrollable: true,
					resizable: true,
					selectable: 'row',
					// Описание колонок
					columns: [
						{
							headerTemplate: headerP + 'Номер блока и категория' + _P,
							field: 'NAME',
							width: '150px',
							groupable: false,
							template: templatePCenter + '">#=BLOCK_NUM+\'-\'+CATEGORY#' + _P
						}, {
							headerTemplate: headerP + 'Рудник' + _P,
							field: 'RUDNIK',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=RUDNIK#' + _P
						}, {
							headerTemplate: headerP + '№ лицензии' + _P,
							field: 'LICENSE',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=LICENSE#' + _P
						}, {
							headerTemplate: headerP + 'Участок разведки' + _P,
							field: 'GEOLICENSEAREA',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=GEOLICENSEAREA#' + _P
						}, {
							headerTemplate: headerP + 'Площадь пересечения, м<sup>2</sup>' + _P,
							field: 'intersectArea',
							width: '150px',
							groupable: false,
							template: templatePRight +
							'">#if(intersectArea){#' +
							'#if (intersectArea < ' + esriConfig.defaults.minIntersectAreaWarning + ') { #<span style="color: red;font-weight: bold"># }#' +
							'#=kendo.format("{0: \\#,\\#\\#0.\\#}", intersectArea)#' +
							'#if (intersectArea < ' + esriConfig.defaults.minIntersectAreaWarning + ') { #</span># }#' +
							'#}#' + _P
						}, {
							headerTemplate: headerP + 'Площадь блока, м<sup>2</sup>' + _P,
							field: 'blockArea',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", blockArea)#' + _P/*,
							 aggregates: ['sum'],
							 groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
							 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P*/
						}, {
							headerTemplate: headerP + 'Процент от площади блока' + _P,
							field: 'areaPercent',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0.\\#}", areaPercent)#' + _P
						}, {
							headerTemplate: headerP + 'Документальная площадь, м<sup>2</sup>' + _P,
							field: 'AREA_DOC',
							width: '150px',
							groupable: false,
							template: templatePRight +
							'">#if(AREA_DOC){# #=kendo.format("{0: \\#,\\#\\#0}", AREA_DOC)# #} else {#Не указана#}#' + _P/*,
							 aggregates: ['sum'],
							 groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P*/
						}, {
							headerTemplate: headerP + 'Разница площадей' + _P,
							field: 'Area_Diff_Percent',
							width: '150px',
							groupable: false,
							template: templatePRight +
							'">#if(AREA_DOC){#' +
							'#var different = (blockArea - AREA_DOC) / AREA_DOC# ' +
							'#if (Math.abs(different) > ' + esriConfig.defaults.maxAreasDifferentWarning + ') { #<span style="color: red;font-weight: bold"># }#' +
							'#=kendo.format("{0: \\#,\\#\\#0.\\#%}", different)#' +
							'#if (Math.abs(different) > ' + esriConfig.defaults.maxAreasDifferentWarning + ') { #</span># }#' +
							'#}#' + _P
						}, {
							headerTemplate: headerP + 'Мощность, м' + _P,
							field: 'M',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0.\\#\\#}", M)#' + _P
						}, {
							headerTemplate: headerP + 'Объём, м<sup>3</sup>' + _P,
							field: 'Volume',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", intersectArea * M)#' + _P
						}, {
							headerTemplate: headerP + 'Объёмная масса, т/м<sup>3</sup>' + _P,
							field: 'DENSITY',
							width: '150px',
							groupable: false,
							template: templatePRight +
							'">#=kendo.format("{0: \\#,\\#\\#0.\\#\\#\\#}", DENSITY)#' + _P
						}, {
							headerTemplate: headerP + 'Запасы сырых солей, т' + _P,
							field: 'rawSaltResources',
							width: '150px',
							groupable: false,
							template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", rawSaltResources)#' + _P,
							aggregates: ['sum'],
							groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
							 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
						}, {
							headerTemplate: headerP + 'Содержание, %' + _P,
							columns: [
								{
									headerTemplate: headerP + 'KCl' + _P,
									field: 'KCL',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0.\\#}", KCL)#' + _P
								}, {
									headerTemplate: headerP + 'MgCl<sub>2</sub>' + _P,
									field: 'MGCL2',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0.\\#}", MGCL2)#' + _P
								}, {
									headerTemplate: headerP + 'Br' + _P,
									field: 'BR',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0.\\#}", BR)#' + _P
								}
							]
						}, {
							headerTemplate: headerP + 'Запасы, т</p></',
							columns: [
								{
									headerTemplate: headerP + 'KCl' + _P,
									field: 'KClResources',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", KClResources)#' + _P,
									aggregates: ['sum'],
									groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
								 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
								}, {
									headerTemplate: headerP + 'K<sub>2</sub>O' + _P,
									field: 'K2OResources',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", K2OResources)#' + _P,
									aggregates: ['sum'],
									groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
									 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
								}, {
									headerTemplate: headerP + 'MgCl<sub>2</sub>' + _P,
									field: 'MgCl2Resources',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", MgCl2Resources)#' + _P,
									aggregates: ['sum'],
									groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
									 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
								}, {
									headerTemplate: headerP + 'Mg<sub>2</sub>O' + _P,
									field: 'MgOResources',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", MgOResources)#' + _P,
									aggregates: ['sum'],
									groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
									 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
								}, {
									headerTemplate: headerP + 'Br' + _P,
									field: 'BrResources',
									width: '70px',
									groupable: false,
									template: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", BrResources)#' + _P,
									aggregates: ['sum'],
									groupFooterTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/*,
									 footerTemplate: templatePRight + '">#=kendo.format("{0: \\#,\\#\\#0}", sum)#' + _P/**/
								}
							]
						}, {
							groupHeaderTemplate: headerP + 'Пласт: #=value.substring(2)#' + _P,
							field: 'indexedPlast',
							hidden: true
						}, {
							title: 'Руда',
							field: 'RUDA',
							hidden: true
						}, {
							title: 'Баланс',
							field: 'BALANCE',
							hidden: true
						}
					]
				},
				export: {
					title: 'Расчёт запасов',
					pushHeaderRows: function (rows) {
						rows.push({
							cells: [
								{
									value: 'Номер блока и категория',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								}, {
									value: 'Рудник',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								}, {
									value: '№ лицензии',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								}, {
									value: 'Участок разведки',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{
									value: 'Площадь пересечения, кв.м',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{
									value: 'Площадь блока, кв.м',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{
									value: 'Процент от площади блока',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{
									value: 'Документальная площадь, кв.м',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{value: 'Разница площадей', rowSpan: 2, bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Мощность, м', rowSpan: 2, bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Объём, куб.м', rowSpan: 2, bold: true, hAlign: 'center', vAlign: 'center'},
								{
									value: 'Объёмная масса, т/куб.м',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{
									value: 'Запасы сырых солей, т',
									rowSpan: 2,
									bold: true,
									hAlign: 'center',
									vAlign: 'center'
								},
								{value: 'Содержание, %', colSpan: 3, bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Запасы, т', colSpan: 5, bold: true, hAlign: 'center', vAlign: 'center'}
							]
						});
						rows.push({
							cells: [
								{value: 'KCl', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'MgCl2', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Br', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'KCl', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'K2O', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'MgCl2', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'MgO', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Br', bold: true, hAlign: 'center', vAlign: 'center'}
							]
						});
					},
					sort: function (a, b) {
						if (a.PLAST !== b.PLAST)
							return a.PLAST > b.PLAST ? 1 : -1;
						else if (a.RUDA !== b.RUDA)
							return a.RUDA > b.RUDA ? 1 : -1;
						else if (a.BALANCE !== b.balance)
							return a.BALANCE > b.BALANCE ? 1 : -1;
						else
							return 0;
					},
					fill: function (data, rows) {
						// Вставка заголовочной или итоговой строки
						var pushHeaderOrTotalRow = function (level, totals, row) {
							var text;
							var background;
							var format;
							switch (Math.abs(level)) {
								case 0:
									text = 'Итого';
									background = '#BBBBBB';
									format = '@';
									break;
								case 1:
									text = 'Пласт ' + row.PLAST;
									background = '#CCCCCC';
									format = '@';
									break;
								case 2:
									text = row.RUDA;
									background = '#DDDDDD';
									format = '\t\t@';
									break;
								case 3:
									text = row.BALANCE;
									background = '#EEEEEE';
									format = '\t\t\t\t@';
									break;
								default:
									return;
							}
							if (level < 0)
								text = 'Итого ' + text;
							rows.push({
								cells: [
									{value: text, bold: true, format: format, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{
										value: level <= 0 ? totals.rawSalt : undefined,
										format: '#,##0',
										bold: true,
										background: background
									},
									{bold: true, background: background},
									{bold: true, background: background},
									{bold: true, background: background},
									{
										value: level <= 0 ? totals.KCl : undefined,
										format: '#,##0',
										bold: true,
										background: background
									},
									{
										value: level <= 0 ? totals.K2O : undefined,
										format: '#,##0',
										bold: true,
										background: background
									},
									{
										value: level <= 0 ? totals.MgCl2 : undefined,
										format: '#,##0',
										bold: true,
										background: background
									},
									{
										value: level <= 0 ? totals.MgO : undefined,
										format: '#,##0',
										bold: true,
										background: background
									},
									{
										value: level <= 0 ? totals.Br : undefined,
										format: '#,##0',
										bold: true,
										background: background
									}
								]
							});
						};
						var oldRow = undefined;
						var prepareTotals = function () {
							return {
								rawSalt: 0,
								KCl: 0,
								K2O: 0,
								MgCl2: 0,
								MgO: 0,
								Br: 0
							}
						};
						var addRowToTotals = function (totals, row) {
							totals.rawSalt += row.rawSaltResources;
							totals.KCl += row.KClResources;
							totals.K2O += row.K2OResources;
							totals.MgCl2 += row.MgCl2Resources;
							totals.MgO += row.MgOResources;
							totals.Br += row.BrResources;
						};
						var nullTotals = function (totals) {
							totals.rawSalt = 0;
							totals.KCl = 0;
							totals.K2O = 0;
							totals.MgCl2 = 0;
							totals.MgO = 0;
							totals.Br = 0;
						};
						var generalTotals = prepareTotals();
						var plastTotals = prepareTotals();
						var rudaTotals = prepareTotals();
						var balanceTotals = prepareTotals();
						for (var r = 0; r < data.length; r++) {
							var row = data[r];
							addRowToTotals(generalTotals, row);
							var levels = {};
							if (!oldRow || oldRow.PLAST !== row.PLAST) {
								levels.PLAST = true;
								levels.RUDA = true;
								levels.BALANCE = true;
							}
							else if (oldRow.RUDA !== row.RUDA) {
								levels.RUDA = true;
								levels.BALANCE = true;
							}
							else if (oldRow.BALANCE !== row.BALANCE)
								levels.BALANCE = true;
							// итоговые строки
							if (oldRow) {
								if (levels.BALANCE) {
									pushHeaderOrTotalRow(-3, balanceTotals, oldRow);
									nullTotals(balanceTotals);
								}
								if (levels.RUDA) {
									pushHeaderOrTotalRow(-2, rudaTotals, oldRow);
									nullTotals(rudaTotals);
								}
								if (levels.PLAST) {
									pushHeaderOrTotalRow(-1, plastTotals, oldRow);
									nullTotals(plastTotals);
								}
							}
							addRowToTotals(plastTotals, row);
							addRowToTotals(rudaTotals, row);
							addRowToTotals(balanceTotals, row);
							// заголовочные строки
							if (levels.PLAST)
								pushHeaderOrTotalRow(1, plastTotals, row);
							if (levels.RUDA)
								pushHeaderOrTotalRow(2, rudaTotals, row);
							if (levels.BALANCE)
								pushHeaderOrTotalRow(3, balanceTotals, row);
							
							oldRow = {
								PLAST: row.PLAST,
								RUDA: row.RUDA,
								BALANCE: row.BALANCE
							};
							var areaDifference = row.AREA_DOC === '' ? '' : (row.AREA_DOC - row.blockArea) / row.AREA_DOC;
							var areaDifferenceCell = {
								value: areaDifference/*'Разница площадей'*/,
								format: '#,##0.0%'
							};
							if (!isNaN(areaDifference) && Math.abs(areaDifference) >= .1)
								areaDifferenceCell.color = '#ff0000';
							rows.push({
								cells: [
									{
										value: row.BLOCK_NUM + '-' + row.CATEGORY/*'Номер блока и категория'*/,
										hAlign: 'center'
									},
									{value: row.RUDNIK/*'Рудник'*/},
									{value: row.LICENSE/*'№ лицензии'*/},
									{value: row.GEOLICENSEAREA/*'Участок разведки'*/},
									{value: row.intersectArea/*'Площадь пересечения, кв.м'*/, format: '#,##0'},
									{value: row.blockArea/*'Площадь блока, кв.м'*/, format: '#,##0'},
									{value: row.areaPercent/*'Процент от площади блока'*/, format: '#,##0'},
									{
										value: row.AREA_DOC === '' ? 'Не указана' : row.AREA_DOC/*'Документальная площадь, кв.м'*/,
										format: '#,##0'
									},
									areaDifferenceCell, /*'Разница площадей'*/
									{value: row.M/*'Мощность, м'*/, format: '#,##0.##'},
									{value: row.intersectArea * row.M/*'Объём, куб.м'*/, format: '#,##0'},
									{value: row.DENSITY/*'Объёмная масса, т/куб.м'*/, format: '#,##0.###'},
									{value: row.rawSaltResources, format: '#,##0'},
									{value: row.KCL/*'Содержание KCl, %*/, format: '#,##0.#'},
									{value: row.MGCL2/*'Содержание MgCl2, %*/, format: '#,##0.#'},
									{value: row.BR/*'Содержание Br, %*/, format: '#,##0.#'},
									{value: row.KClResources/*'Запасы KCl, т'*/, format: '#,##0'},
									{value: row.K2OResources/*'Запасы K2O, т'*/, format: '#,##0'},
									{value: row.MgCl2Resources/*'Запасы MgCl2, т'*/, format: '#,##0'},
									{value: row.MgOResources/*'Запасы MgO, т'*/, format: '#,##0'},
									{value: row.BrResources/*'Запасы Br, т'*/, format: '#,##0'}
								]
							});
						}
						// окончательные итоги
						pushHeaderOrTotalRow(-3, balanceTotals, oldRow);
						pushHeaderOrTotalRow(-2, rudaTotals, oldRow);
						pushHeaderOrTotalRow(-1, plastTotals, oldRow);
						pushHeaderOrTotalRow(0, generalTotals);
					},
					freezePane: {
						rowSplit: 2,
						colSplit: 1
					},
					columnsCount: 17
				}
			},
			// Таблица с агрегированными данными
			{
				id: 'aggregatedSource',
				rowsOptions: {
					aggregateFromId: 'resultSource',
					aggregateRow: function (aggregatedData, row) {
						// Агрегация данных для второй таблицы
						// заголовочные строки
						if (!aggregatedData[row.BALANCE]) {
							aggregatedData[row.BALANCE] = {
								title: row.BALANCE + ' запасы',
								rawSaltResources: '',
								KClResources: '',
								K2OResources: '',
								MgCl2Resources: '',
								MgOResources: '',
								BrResources: '',
								headerOrTotal: true
							};
						}
						// идентификаторы строк данных и итоговых строк
						// у строк с данными разделитель в идентификаторе - пробел, а у итоговых строк - разделитель, чтобы данные автоматически были впереди итогов
						var rowId = row.BALANCE + ' ' + row.PLAST + ' ' + row.RUDA;
						var totalRowId = row.BALANCE + '_Всего';
						// строки с данными
						if (!aggregatedData[rowId]) {
							aggregatedData[rowId] = {
								title: 'Пласт ' + row.PLAST + ' ' + row.RUDA,
								rawSaltResources: row.rawSaltResources ? row.rawSaltResources / 1000 : 0,
								KClResources: row.KClResources ? row.KClResources / 1000 : 0,
								K2OResources: row.K2OResources ? row.K2OResources / 1000 : 0,
								MgCl2Resources: row.MgCl2Resources ? row.MgCl2Resources / 1000 : 0,
								MgOResources: row.MgOResources ? row.MgOResources / 1000 : 0,
								BrResources: row.BrResources ? row.BrResources / 1000 : 0,
								headerOrTotal: false
							};
						}
						else {
							aggregatedData[rowId].rawSaltResources += row.rawSaltResources ? row.rawSaltResources / 1000 : 0;
							aggregatedData[rowId].KClResources += row.KClResources ? row.KClResources / 1000 : 0;
							aggregatedData[rowId].K2OResources += row.K2OResources ? row.K2OResources / 1000 : 0;
							aggregatedData[rowId].MgCl2Resources += row.MgCl2Resources ? row.MgCl2Resources / 1000 : 0;
							aggregatedData[rowId].MgOResources += row.MgOResources ? row.MgOResources / 1000 : 0;
							aggregatedData[rowId].BrResources += row.BrResources ? row.BrResources / 1000 : 0;
						}
						// итоговые строки
						if (!aggregatedData[totalRowId]) {
							aggregatedData[totalRowId] = {
								title: 'Всего',
								rawSaltResources: row.rawSaltResources ? row.rawSaltResources / 1000 : 0,
								KClResources: row.KClResources ? row.KClResources / 1000 : 0,
								K2OResources: row.K2OResources ? row.K2OResources / 1000 : 0,
								MgCl2Resources: row.MgCl2Resources ? row.MgCl2Resources / 1000 : 0,
								MgOResources: row.MgOResources ? row.MgOResources / 1000 : 0,
								BrResources: row.BrResources ? row.BrResources / 1000 : 0,
								headerOrTotal: true
							};
						}
						else {
							aggregatedData[totalRowId].rawSaltResources += row.rawSaltResources ? row.rawSaltResources / 1000 : 0;
							aggregatedData[totalRowId].KClResources += row.KClResources ? row.KClResources / 1000 : 0;
							aggregatedData[totalRowId].K2OResources += row.K2OResources ? row.K2OResources / 1000 : 0;
							aggregatedData[totalRowId].MgCl2Resources += row.MgCl2Resources ? row.MgCl2Resources / 1000 : 0;
							aggregatedData[totalRowId].MgOResources += row.MgOResources ? row.MgOResources / 1000 : 0;
							aggregatedData[totalRowId].BrResources += row.BrResources ? row.BrResources / 1000 : 0;
						}
					}
				},
				datasource: {
					aggregates: [
						{
							field: 'rawSaltResources',
							aggregate: 'sum'
						}, {
							field: 'KClResources',
							aggregate: 'sum'
						}, {
							field: 'K2OResources',
							aggregate: 'sum'
						}, {
							field: 'MgCl2Resources',
							aggregate: 'sum'
						}, {
							field: 'MgOResources',
							aggregate: 'sum'
						}, {
							field: 'BrResources',
							aggregate: 'sum'
						}
					]
				},
				grid: {
					node: '#findAggregateResultsGrid',
					scrollable: true,
					resizable: true,
					columns: [
						{
							field: 'title',
							title: 'Итого запасы, тыс.т',
							width: '200px',
							groupable: false,
							template: templatePLeft +
							'">#if(headerOrTotal){#<b>#}# #=title# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'rawSaltResources',
							title: 'Сырые соли',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", rawSaltResources)# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'KClResources',
							title: 'KCl',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", KClResources)# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'K2OResources',
							title: 'K<sub>2</sub>O',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", K2OResources)# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'MgCl2Resources',
							title: 'MgCl<sub>2</sub>',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", MgCl2Resources)# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'MgOResources',
							title: 'MgO',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", MgOResources)# #if(headerOrTotal){#</b>#}#' + _P
						}, {
							field: 'BrResources',
							title: 'Br',
							width: '150px',
							groupable: false,
							template: templatePCenter +
							'">#if(headerOrTotal){#<b>#}# #=kendo.format("{0: \\#,\\#\\#0}", BrResources)# #if(headerOrTotal){#</b>#}#  ' + _P
						}, {
							field: 'headerOrTotal',
							hidden: true
						}
					]
				},
				export: {
					title: 'Расчёт запасов - итого',
					pushHeaderRows: function (rows) {
						rows.push({
							cells: [
								{value: 'Итого запасы, тыс.т', bold: true, hAlign: 'left', vAlign: 'center'},
								{value: 'Сырые соли', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'KCl', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'K2O', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'MgCl2', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'MgO', bold: true, hAlign: 'center', vAlign: 'center'},
								{value: 'Br', bold: true, hAlign: 'center', vAlign: 'center'}
							]
						});
					},
					fill: function (data, rows) {
						for (var r = 0; r < data.length; r++) {
							var row = data[r];
							rows.push({
								cells: [
									{value: row.title, bold: row.headerOrTotal, hAlign: 'left', vAlign: 'center'},
									{
										value: row.rawSaltResources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									},
									{
										value: row.KClResources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									},
									{
										value: row.K2OResources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									},
									{
										value: row.MgCl2Resources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									},
									{
										value: row.MgOResources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									},
									{
										value: row.BrResources,
										bold: row.headerOrTotal,
										hAlign: 'center',
										vAlign: 'center',
										format: '#,##0.##'
									}
								]
							});
						}
					},
					freezePane: {
						rowSplit: 1
					},
					columnsCount: 7
				}
			}
		]
	}
});