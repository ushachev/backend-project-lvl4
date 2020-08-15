install:
	npm ci

start:
	npx nodemon --require esm server/bin/server.js

lint:
	npx eslint .

test:
	npm test -- --no-coverage

test-coverage:
	npm test

.PHONY: install test
