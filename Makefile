install:
	npm ci

start:
	npx nodemon server/bin/server.js

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage

.PHONY: install
