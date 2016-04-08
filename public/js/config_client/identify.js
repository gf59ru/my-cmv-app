define({
	map: true,
	mapClickMode: true, // false - отключение идентификации по щелчку
	mapRightClickMenu: true, // false - отключение контекстного меню идентификации по правой кнопке
	identifyLayerInfos: true, // false - идентификация по слоям отключается. Где включается, не нашёл
	identifyTolerance: 5, // Точность координат при поиске объектов под курсором мыши. Чем меньше значение, тем труднее попасть по точкам

	// config object definition:
	//	{<layer id>:{
	//		<sub layer number>:{
	//			<pop-up definition, see link below>
	//			}
	//		},
	//	<layer id>:{
	//		<sub layer number>:{
	//			<pop-up definition, see link below>
	//			}
	//		}
	//	}

	// for details on pop-up definition see: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html

	identifies: { // шаблоны для окна идентификации
		/*meetupHometowns: { // id слоя
		 0: { // id слоя в сервисе (если слой без подслоёв, например, FeatureLayer, указывается 0)
			 title: 'Hometowns', // заголовок
			 fieldInfos: [{ // поля
				 fieldId: 'Location', // имя поля (id) - используется в модуле FindBlocks в поиске геометрии для расчётов запасов в блоках. Если алиас совпадает с id, поле можно пропускать (указывать только fieldName)
				 fieldName: 'Координаты', // имя поля (алиас) - требуется для стандартного окна идентификации
				 visible: true // видимость
				 }]
			 }
		 },*/
		berezniki: {
			0: {
				title: 'Скважины',
				fieldInfos: [{
					fieldName: 'PROJECT',
					visible: true
				}, {
					fieldName: 'SHEETNUM',
					visible: false
				}, {
					fieldName: 'DHHOLENAME',
					visible: true
				}, {
					fieldName: 'PROPERTYID',
					visible: false
				}, {
					fieldName: 'HOLEID',
					visible: false
				}, {
					fieldName: 'DHEAST',
					visible: true
				}, {
					fieldName: 'DHNORTH',
					visible: true
				}, {
					fieldName: 'DHELEV',
					visible: true
				}, {
					fieldName: 'DHDEPTH',
					visible: true
				}, {
					fieldName: 'DHSKVNOMER',
					visible: true
				}, {
					fieldName: 'DHTYPE',
					visible: true
				}, {
					fieldName: 'DHRUDNIK',
					visible: true
				}, {
					fieldName: 'DHYEARS',
					visible: true
				}, {
					fieldName: 'DHYEARF',
					visible: true
				}, {
					fieldName: 'DHZW',
					visible: true
				}, {
					fieldName: 'DHPLAST',
					visible: true
				}, {
					fieldName: 'DHZPLAST',
					visible: true
				}, {
					fieldName: 'DHPLACE',
					visible: true
				}, {
					fieldName: 'DHPRIMECH',
					visible: true
				}, {
					fieldName: 'DHOTHET',
					visible: true
				}, {
					fieldName: 'DHGEOLOG',
					visible: true
				}, {
					fieldName: 'ESRI_OID',
					visible: true
				}]
			},
			1: {

			},
			4: {

			},
			5: {

			},
			6: {

			},
			7: {

			},
			8: {
				title: 'Балансовая принадлежность запасов пл. АБ',
				fieldInfos: [{
					fieldId: 'OBJECTID',
					fieldName: 'OBJECTID',
					visible: true
				}, {
					fieldId: 'RUDNIK',
					fieldName: 'Рудник',
					visible: true
				}, {
					fieldId: 'PLAST',
					fieldName: 'Пласт',
					visible: true
				}, {
					fieldId: 'BLOCK_NUM',
					fieldName: 'Block_Num',
					visible: true
				}, {
					fieldId: 'CATEGORY',
					fieldName: 'Категория',
					visible: true
				}, {
					fieldId: 'RUDA',
					fieldName: 'Руда',
					visible: true
				}, {
					fieldId: 'BALANCE',
					fieldName: 'Balance',
					visible: true
				}, {
					fieldId: 'BALANCE_ADD',
					fieldName: 'Balance_Add',
					visible: true
				}, {
					fieldId: 'AREA_DOC',
					fieldName: 'Документальная площадь',
					visible: true
				}, {
					fieldId: 'AREA_GEOM',
					fieldName: 'Геометрическая площадь',
					visible: true
				}, {
					fieldId: 'AREA_DIFF',
					fieldName: 'Разница площадей',
					visible: true
				}, {
					fieldId: 'M',
					fieldName: 'M',
					visible: true
				}, {
					fieldId: 'V',
					fieldName: 'V',
					visible: true
				}, {
					fieldId: 'DENSITY',
					fieldName: 'Плотность',
					visible: true
				}, {
					fieldId: 'KCL',
					fieldName: 'KCl',
					visible: true
				}, {
					fieldId: 'MGCL2',
					fieldName: 'MgCl2',
					visible: true
				}, {
					fieldId: 'NACL',
					fieldName: 'NaCl',
					visible: true
				}, {
					fieldId: 'CASO4',
					fieldName: 'CaSO4',
					visible: true
				}, {
					fieldId: 'N_O',
					fieldName: 'Н.О.',
					visible: true
				}, {
					fieldId: 'BR',
					fieldName: 'Br',
					visible: true
				}, {
					fieldId: 'ZAPAS_SS',
					fieldName: 'Запас с.с.',
					visible: true
				}, {
					fieldId: 'ZAPAS_KCL',
					fieldName: 'Запасы KCl',
					visible: true
				}, {
					fieldId: 'ZAPAS_K2O',
					fieldName: 'Запасы K2O',
					visible: true
				}, {
					fieldId: 'ZAPAS_BR',
					fieldName: 'Запасы Br',
					visible: true
				}, {
					fieldId: 'DESCRIPTION',
					fieldName: 'Описание',
					visible: true
				}, {
					fieldId: 'CATEGORYGIS',
					fieldName: 'Категория ГИС',
					visible: true
				}, {
					fieldId: 'NAME',
					fieldName: 'Название блока',
					visible: true
				}, {
					fieldId: 'PROTOCOL_DATE',
					fieldName: 'Дата протокола',
					visible: true
				}, {
					fieldId: 'PROTOCOL_NUM',
					fieldName: 'Номер протокола',
					visible: true
				}, {
					fieldId: 'ZAPAS_MGCL2',
					fieldName: 'Запасы MgCl2',
					visible: true
				}, {
					fieldId: 'ZAPAS_MGO',
					fieldName: 'Запасы MgO',
					visible: true
				}, {
					fieldId: 'ID',
					fieldName: 'ID',
					visible: true
				}, {
					fieldId: 'CODE',
					fieldName: 'Код',
					visible: true
				}, {
					fieldId: 'CODE2',
					fieldName: 'Cod2',
					visible: true
				}, {
					fieldId: 'OLD_ID',
					fieldName: 'OLD_ID',
					visible: true
				}, {
					fieldId: 'GLOBALID',
					fieldName: 'GlobalID',
					visible: true
				}, {
					fieldId: 'BLOCK_FULL',
					fieldName: 'Полное название блока',
					visible: true
				}, {
					fieldId: 'CANCEL_DATE',
					fieldName: 'Дата прекращения действия',
					visible: true
				}, {
					fieldId: 'CANCEL_GKZ_DATE',
					fieldName: 'Дата переутверждения в ГКЗ',
					visible: true
				}, {
					fieldId: 'GKZ',
					fieldName: 'Утвержден в ГКЗ',
					visible: true
				}, {
					fieldId: 'PART_REPORT',
					fieldName: '№ части (отчет)',
					visible: true
				}, {
					fieldId: 'PART_PROTOCOL',
					fieldName: '№ части (протокол)',
					visible: true
				}]
			},
			9: {

			}
		}
		/*meetupHometowns: { // id слоя
		 0: { // id слоя в сервисе
		 title: 'Hometowns', // заголовок
		 fieldInfos: [{ // поля
		 fieldName: 'Location', // имя поля
		 visible: true // видимость
		 }]
		 }
		 },
		 louisvillePubSafety: {
		 2: {
		 title: 'Police Station',
		 fieldInfos: [{
		 fieldName: 'Name',
		 visible: true
		 }, {
		 fieldName: 'Address',
		 visible: true
		 }, {
		 fieldName: 'Type',
		 visible: true
		 }, {
		 fieldName: 'Police Function',
		 visible: true
		 }, {
		 fieldName: 'Last Update Date',
		 visible: true
		 }]
		 },
		 8: {
		 title: 'Traffic Camera',
		 description: '{Description} lasted updated: {Last Update Date}',
		 mediaInfos: [{
		 title: '',
		 caption: '',
		 type: 'image',
		 value: {
		 sourceURL: '{Location URL}',
		 linkURL: '{Location URL}'
		 }
		 }]
		 }
		 }*/
	}
});