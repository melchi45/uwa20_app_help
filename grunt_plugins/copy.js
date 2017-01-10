module.exports = function(injection) {
    var grunt = injection.grunt;
    var projectStructure = injection.projectStructure;

    var appToWwwConfig = grunt.file.readJSON('./grunt_configs/app_to_www_config.json');
    
    return {
        indexHtmlToWww: {
            files: [{
                expand: true,
                cwd: projectStructure.appDir,
                dest: projectStructure.wwwDir,
                src: ['index.html']
            }]
        },
        indexHtmlToApp: {
            files: [{
                expand: true,
                cwd: projectStructure.wwwDir,
                dest: projectStructure.appDir,
                src: ['index.html']
            }]
        },
        views9011: {
            files: [{
                expand: true,
                cwd: projectStructure.appDir,
                dest: projectStructure.wwwDir,
                src: ['views/setup/heatmap/**', 'views/setup/peoplecounting/**']
            }]
        },
        platformsForBuild: {
            files: [{
                expand: true,
                cwd: projectStructure.originalPlatforms,
                dest: 'platforms',
                src: ['**']
            }]
        },
        pluginsForBuild: {
            files: [{
                expand: true,
                cwd: projectStructure.originalPlugins,
                dest: 'plugins',
                src: ['**']
            }]
        },
        app: {
            files: [{
                expand: true,
                cwd: projectStructure.baseAppDir,
                dest: projectStructure.wwwDir + '/base',
                src: ['**', '!{' + projectStructure.jsDir + ',' + projectStructure.cssDir + ',' + projectStructure.kindDir + ',' + projectStructure.viewDir + ',**/external-modules}/**'
                    // '**/**',
                    // '**',
                    // '!{' + projectStructure.jsDir + ',' + projectStructure.cssDir + ',' + projectStructure.kindDir +',**/'+
                    // projectStructure.jsDir + ',**/' + projectStructure.cssDir + ',**/' + projectStructure.kindDir +  ',**/external-modules}/**'
                ]
            }, {
                expand: true,
                cwd: projectStructure.appDir,
                dest: projectStructure.wwwDir,
                src: appToWwwConfig
            }]
        },
        techwinIconInApp: {
            files: [{
                expand: true,
                cwd: projectStructure.appDir + '/styles/fonts/Techwin-Universal-Icon',
                dest: projectStructure.wwwDir + '/styles',
                src: ['*.ttf', '*.svg', '*.woff', '*.woff2']
            }]
        },
        notoSansInApp: {
            files: [{
                expand: true,
                cwd: projectStructure.appDir + '/styles/fonts',
                dest: projectStructure.wwwDir + '/styles',
                src: ['*.ttf']
            }]
        },
        bootstrapFonts: {
            files: [{
                expand: true,
                cwd: projectStructure.bcDirPath + '/bootstrap/dist',
                dest: projectStructure.wwwDir,
                src: ['fonts/**']
            }]
        },
        fontAwesomeFonts: {
            files: [{
                expand: true,
                cwd: projectStructure.bcDirPath + '/font-awesome',
                dest: projectStructure.wwwDir,
                src: ['fonts/**']
            }]
        },
        jQueryUiImage: {
            files: [{
                expand: true,
                cwd: projectStructure.bcDirPath + '/jquery-ui',
                dest: projectStructure.wwwDir + '/styles',
                src: ['images/**']
            }]
        },
        temp: {
            files: [{
                expand: true,
                cwd: '.tmp/concat',
                dest: projectStructure.wwwDir,
                src: ['**']
            }]
        }
    };
};