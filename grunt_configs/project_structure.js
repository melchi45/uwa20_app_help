module.exports = function(injection){
	var appDir = 'app',

		baseAppDir = appDir + '/' + 'base',

		kindDir = 'kind',
		jsDir = 'scripts',
		cssDir = 'styles',
		viewDir = 'views',
			
		livePlayback = 'livePlayback',

		rcDir = 'rich_components',
		cmDir = 'common_modules',
		bcDir = 'base_components',

		wwwDir = 'www',
		reportDir = 'reports',
		docsDir = 'docs',

		customPath = 'custom';

		tcDir = 'test_case',

		cvrgDir = 'coverage',
		utDir = 'unit_test',
		saDir = 'static_analysis',
		customSaDir = customPath + '_' + saDir,

		appJsPath = appDir + '/' + jsDir,
		appCssPath = appDir + '/' + cssDir,
		appViewPath = appDir + '/' + viewDir,

		wwwJsPath = wwwDir + '/' + jsDir,
		wwwCssPath = wwwDir + '/' + cssDir,

		rcReportPath = reportDir + '/' + rcDir,
		cmReportPath = reportDir + '/' + cmDir,

		kindDirPath = appDir + '/' + kindDir,
		baseKindDirPath = baseAppDir + '/' + kindDir,

		rcDirPath = baseKindDirPath + '/' + rcDir,
		cmDirPath = baseKindDirPath + '/' + cmDir,
		customCmDirPath = kindDirPath + '/' + cmDir,
		bcDirPath = baseKindDirPath + '/' + bcDir,

		rcDocsPath = docsDir + '/' + rcDir,
		cmDocsPath = docsDir + '/' + cmDir;
		customDocsPath = docsDir + '/' + customPath;
	
	var originalPlatforms = "platforms_original";
	var originalPlugins = "plugins_original";

	/**
	 * Setting Server Infomation
	 */ 
	var serverInfo = injection.grunt.file.readJSON('./grunt_configs/server_info.json');

	/**
	 * Setting Javascript file of framework user
	 */
	var projectJsCodePath = [
			appJsPath + '/*.js',
			appJsPath + '/**/*.js',
			baseAppDir + '/' + jsDir + '/*.js',
			baseAppDir + '/' + jsDir + '/**/*.js',
	];

	/**
	 * Setting Javascript file of rich components
	 */
	var richComponentsJsCodePath = [
			rcDirPath + '/**/*.js',
			'!' + rcDirPath + '/**/*spec.js',
	];

	/**
	 * Setting Javascript file of common modules
	 */
	var commonModulesJsCodePath = [
			cmDirPath + '/**/*.js',
			customCmDirPath +'/**/*.js',
			'!' + cmDirPath + '/**/*spec.js',
			'!' + customCmDirPath + '/**/*spec.js',
	];

	var customSaConfig = './grunt_configs/custom_sa.json';
	var customSaPath = [];

	var customDocsConfig = './grunt_configs/custom_jsdoc.json';
	var customDocsSrc = [];

	var totalJsCodePath = [].concat(
			projectJsCodePath,
			richComponentsJsCodePath,
			commonModulesJsCodePath
	);
	
	return {
		appDir: appDir,
		baseAppDir : baseAppDir,
		kindDir: kindDir,
		jsDir: jsDir,
		cssDir: cssDir,
		viewDir: viewDir,
		livePlayback: livePlayback,
		rcDir: rcDir,
		cmDir: cmDir,
		bcDir: bcDir,
		wwwDir: wwwDir,
		reportDir: reportDir,
		docsDir: docsDir,
		tcDir: tcDir,
		cvrgDir: cvrgDir,
		utDir: utDir,
		saDir: saDir,
		customSaDir: customSaDir,
		appJsPath: appJsPath,
		appCssPath: appCssPath,
		appViewPath: appViewPath,
		wwwJsPath: wwwJsPath,
		wwwCssPath: wwwCssPath,
		rcReportPath: rcReportPath,
		cmReportPath: cmReportPath,
		kindDirPath: kindDirPath,
		rcDirPath: rcDirPath,
		cmDirPath: cmDirPath,
		bcDirPath: bcDirPath,
		rcDocsPath: rcDocsPath,
		cmDocsPath: cmDocsPath,
		customDocsPath: customDocsPath,
		serverInfo: serverInfo,
		projectJsCodePath: projectJsCodePath,
		richComponentsJsCodePath: richComponentsJsCodePath,
		commonModulesJsCodePath: commonModulesJsCodePath,
		totalJsCodePath: totalJsCodePath,
		originalPlatforms: originalPlatforms,
		originalPlugins: originalPlugins,
		customSaPath: customSaPath,
		customSaConfig: customSaConfig,
		customDocsConfig: customDocsConfig,
		customDocsSrc: customDocsSrc
	};
};