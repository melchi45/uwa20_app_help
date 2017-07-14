


all:
	@echo ">> Building Webiewer"
	@rm -fr ./www
	@cp ./app/base/kind/rich_components/rest_client/rest_client_config_release.js ./app/base/kind/rich_components/rest_client/rest_client_config.js
	@grunt minimize:camera

clean:
	@rm -vrf ./www
