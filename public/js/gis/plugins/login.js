define(['esri/IdentityManager',
		'esri/ServerInfo'],
function (esriId,
          ServerInfo) {
	return {
		login: function (loggedIn, notLoggedIn) {
			var serverInfo = new ServerInfo({
				server: esriConfig.defaults.mapServer,
				tokenServiceUrl: esriConfig.defaults.mapServicesFolder + 'Test_Sec'
			});
			/*esriId.on('dialog-create', function (event) {
				console.log(event);
			});*/
			esriId.registerServers([serverInfo]);
			// Вход (показ диалога с вводом логина и пароля)
			esriId.getCredential(serverInfo.tokenServiceUrl);
			// Проверка доступности ресурсов
			esriId.checkSignInStatus(esriConfig.defaults.mapServicesFolder + 'System/CachingTools/GPServer').then(function () {  // Ресурс доступен
				if (loggedIn)
					loggedIn();
			}).otherwise(function () {  // Ресурс недоступен
				if (notLoggedIn)
					notLoggedIn();
			});
		}
	}
});