"use strict";

kindFramework.
constant('ONLINE_HELP_CONFIG', {
  ROOT: 'views/help/',
  INDEX: 'index.html',
  MAIN: 'main.html',
  SETUP_URL: 'setup',
  HELP_URL: 'help',
  USE_MULTI_LANGUAGE: true,
  DEFAULT_LANGUAGE: 'English',
  SUPPORT_LANGUAGES: [
    'English',
    'Korean',
    'Spanish',
    'Chinese'
  ],
  WIDTH: 1024,
  HEIGHT: 800,
  /**
   * externalPTZ, RS485, RS485&422 페이지의 HTML파일이 동일하여
   * 온라인 헬퍼 작성시 이슈 발생하였습니다.
   * 온라인 헬퍼 오픈시 html 경로를 수정하여 오픈합니다.
   *
   * 포맷
   *    REPLACE_TEMPLATE: {
   *        <URL Name>: {
   *            from: <From HTML Name>
   *            to: <To HTML Name>
   *        }
   *    }
   */
  REPLACE_TEMPLATE: {
    'rs485': {
      from: 'externalPTZ',
      to: 'rs485'
    },
    'rs485422': {
      from: 'externalPTZ',
      to: 'rs485422'
    }
  }
});