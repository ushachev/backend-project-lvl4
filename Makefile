install:
	npm ci

start:
	npx nodemon --require esm server/bin/server.js

lint:
	npx eslint .

test:
	npm test -- --no-coverage --reporter=spec

test-coverage:
	npm test -- --coverage --coverage-report=lcovonly

.PHONY: install test
