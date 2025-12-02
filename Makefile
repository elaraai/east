.PHONY: install build test example coverage release-patch release-minor release-major release-prepatch release-preminor release-premajor release-prerelease

build:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build

install:
	. ${NVM_DIR}/nvm.sh && nvm use && npm ci

test:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm test

lint:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm run lint

example:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm run example

clean:
	rm -rf ./dist