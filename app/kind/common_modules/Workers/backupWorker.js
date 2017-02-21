'use strict';

importScripts('../MediaSession/BackupSession/avi_format_writer.js',
			'../MediaSession/BackupSession/avi_file_writer.js',
			'../MediaSession/BackupSession/BackupSession.js',
			'../MediaSession/BackupSession/audioBackup.js',
			'../MediaSession/BackupSession/videoBackup.js',
			'../Util/util.js');

addEventListener('message', receiveMessage, false);

var backupSession = null;

/**
* processing received messsage from workerManager
*
* @function : receiveMessage
*/
function receiveMessage(event) {
  var message = event.data;
  if( message.type !== 'backup' ) return;

  if( message.data.command !== undefined ) {
	if( message.data.command === 'check' && backupSession !== null ) {
		sendMessage('backupClose',0);
	} else if( message.data.command === 'start' ) {
      backupSession = BackupSession(sendMessage);
	  if( message.data.filename !== undefined && message.data.filename !== null ) {
		backupSession.setFileName(message.data.filename);
	  }
	} else if( message.data.command === 'stop') {
      backupSession.endSession();
	  backupSession = null;
	  sendMessage('terminate');
	  close();
	}
	return;
  }

  if( backupSession === null ) return;
  if( message.data.frameinfo !== undefined && message.data.streamData !== undefined ) {
	backupSession.sendData(message.data.frameinfo, message.data.streamData);
  }
}

/**
* send message to workerManager
*
* @function : sendMessage
*/
function sendMessage(target, data) {
  var event = {
	'type' : target,
	'data' : data
  };
  postMessage(event);
}