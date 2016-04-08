define({
	map: true, // Если выставить false, виджет поиска не грузится
	queries: [ // описание запросов поиска
		{
			description: 'Поиск скважины по названию', // описание запроса для списка выбора
			url: esriConfig.defaults.mapService, // ссылка на сервис карт
			layerIds: [1, 2, 4, 5], // id слоёв в сервисе
			searchFields: ['DHHOLENAME', 'DHHOLENAME', 'N', 'N'], // поля, по которым будет производиться поиск
			minChars: 1 // минимальное количество символов для начала поиска
		},
		{
			description: 'Поиск блока запасов',
			url: esriConfig.defaults.mapServicesFolder + 'Geology/Reserve/MapServer/',
			layerIds: [9],
			searchFields: ['Block_Num, Description'],
			minChars: 1
		}/*,
		 {
		 description: 'Find A Public Safety Location By Name',
		 url: 'http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/PublicSafety/PublicSafetyOperationalLayers/MapServer',
		 layerIds: [1, 2, 3, 4, 5, 6, 7],
		 searchFields: ['FDNAME, PDNAME', 'NAME', 'RESNAME'],
		 minChars: 2
		 },
		 {
		 description: 'Find Incident By Code/Description',
		 url: 'http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/PublicSafety/PublicSafetyOperationalLayers/MapServer',
		 layerIds: [15, 17, 18],
		 searchFields: ['FCODE', 'DESCRIPTION'],
		 minChars: 4
		 }*/
	]
});