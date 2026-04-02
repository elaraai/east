.PHONY: install build test test-export example lint clean

build:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build

install:
	. ${NVM_DIR}/nvm.sh && nvm use && npm ci

test:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm test

test-export:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run test:export

lint:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm run lint

example:
	. ${NVM_DIR}/nvm.sh && nvm use && npm run build && npm run example

clean:
	rm -rf ./dist