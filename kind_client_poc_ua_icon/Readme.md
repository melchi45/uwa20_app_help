디자인팀에서 배포한 SVG 파일 CSS파일로 변환하는 방법

1. FontForge 다운로드
만약에 Github가 인터넷 차단되어 있는 경우 아래 TeamForge에 첨부된 파일 다운로드
http://ctf1.stw.net/sf/go/doc51243?nav=1

2. SVG 파일 카피
kind_client_poc_ua_icon 폴더에 icons를 복사한다.

3. kind_client_poc_ua_icon폴더에 node_modules 생성
<Project Root>/node_modules/grunt-webfont를
kind_client_poc_ua_icon/node_modules에 복사한다.
* 초기에는 node_modules폴더가 없으므로 만든다.

4. CSS 파일 경로 수정
kind_client_poc_ua_icon 폴더에서 Gruntfile.js 열어서
webFont.icon.dest를 원하는 경로로 수정한다.

5. SVG -> CSS
1) kind_client_poc_ua_icon 을 기준으로 명령프롬프트 or 터미널를 실행한다.
2) grunt webfont를 실행한다.
3) 결과물 확인

6. EOT 파일 생성 안될 때
1) grunt-webfont\node_modules\ttf2eot 폴더에 폰트 복사
2) ttf2eot 를 기준으로 명령프롬프트 or 터미널 열기
3) ttf2eot < Techwin-Universal-Icon.ttf > Techwin-Universal-Icon.eot 실행
4) Techwin-Universal-Icon.eot 파일 생성 확인

** 주의
icons.html, icons.css를 SVN 에 add 할 때 line ending 에러가 뜰경우
Editor에서 Save As를 통해서 해결한다.