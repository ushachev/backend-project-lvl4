install:
	npm ci

start:
	heroku local -f Procfile.dev

start-backend:
	npx nodemon server/bin/server.js

lint:
	npx eslint .

test:
	npm test -- --no-coverage

test-coverage:
	npm test

.PHONY: install test
