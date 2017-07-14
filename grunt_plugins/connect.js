module.exports = function(injection) {
    var grunt = injection.grunt;
    var projectStructure = injection.projectStructure;
    return {
        options: {
            port: projectStructure.serverInfo.port,
            hostname: '*',
            keepalive: true
        },
        app: {
            options: {
                open: 'http://' + projectStructure.serverInfo.hostName + ':' + projectStructure.serverInfo.port + '/index.html',
                base: projectStructure.appDir
            }
        },
        httpsApp: {
        	options: {
            	port: projectStructure.serverInfo.httpsPort,
        		protocol: 'https',
                open: 'https://' + projectStructure.serverInfo.hostName + ':' + projectStructure.serverInfo.httpsPort + '/index.html',
                base: projectStructure.appDir
        	}
        },
        www: {
            options: {
                open: 'http://' + projectStructure.serverInfo.hostName + ':' + projectStructure.serverInfo.port + '/index.html',
                base: projectStructure.wwwDir
            }
        },
        index: {
            options: {
                open: 'http://' + projectStructure.serverInfo.hostName + ':' + projectStructure.serverInfo.port + '/index.html',
                base: './'
            }
        },
        camera9011: {
            options: {
                open: 'http://' + projectStructure.serverInfo.hostName + ':' + projectStructure.serverInfo.port + '/dev_9011/index.html',
                base: './'
            }
        }
    };
};