.PHONY: install build test example lint clean link unlink

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

# Register @elaraai/east globally so sibling repos can npm link it
link:
	npm link

# Unregister
unlink:
	npm unlink