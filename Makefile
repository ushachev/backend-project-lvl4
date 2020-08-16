install:
	npm ci

start:
	npx nodemon server/bin/server.js

lint:
	npx eslint .

test:
	npm test -- --no-coverage

test-coverage:
	npm test

.PHONY: install test
