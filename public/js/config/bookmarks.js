define({
	map: true, // Если выставить false, работает только редактирование и удаление (добавление и переход приводят к ошибке в консоли)
	editable: true, // Можно ли редактировать закладки
	bookmarks: [
		{
			extent: { // координаты видимого прямоугольника
				xmin: -1345.7063333246297,
				ymin: 36538.109737033024,
				xmax: 7299.80136568846,
				ymax: 45617.91827587597,
				spatialReference: esriConfig.defaults.spatialReferenceBer // система координат
			},
			name: 'СКРУ-1' // наименование закладки
		},
		{
			extent: {
				xmin: -1889.585721566491,
				ymin: 28426.336221223697,
				xmax: 6269.682045171086,
				ymax: 38032.11889764946,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'СКРУ-2'
		},
		{
			extent: {
				xmin: 4721.606572507833,
				ymin: 28402.475971069187,
				xmax: 15399.371474936945,
				ymax: 46115.33863743767,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'СКРУ-3'
		},
		{
			extent: {
				xmin: 5679.883605950574,
				ymin: 4463.681446925737,
				xmax: 15402.780151017656,
				ymax: 14146.788975554518,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'БКПРУ-2'
		},
		{
			extent: {
				xmin: 82.42496972635854,
				ymin: 12647.091187126003,
				xmax: 23543.90484616111,
				ymax: 25858.901544116437,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'БКПРУ-4'
		},
		{
			extent: {
				xmin: -5604.285449782154,
				ymin: -92.70929557457566,
				xmax: 7230.943934208818,
				ymax: 12115.8394586863,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'Усть-Яйвинский участок'
		},
		{
			extent: {
				xmin: 8000,
				ymin: 28000,
				xmax: 28000,
				ymax: 48000,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: '1 очередь освоения Лицензионного участка'
		},
		{
			extent: {
				xmin: 3000,
				ymin: 44000,
				xmax: 27000,
				ymax: 60000,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: '2 очередь освоения Лицензионного участка'
		},
		{
			extent: {
				xmin: 3733.4217297569467,
				ymin: 38038.8795924345,
				xmax: 25484.191040755846,
				ymax: 59748.14678195957,
				spatialReference: esriConfig.defaults.spatialReferenceBer
			},
			name: 'Половодовский участок'
		}
	]
});