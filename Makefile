install:
	npm ci

start:
	heroku local -f Procfile.dev

start-backend:
	npx nodemon --exec npx babel-node server/bin/server.js

start-frontend:
	npx webpack serve

lint:
	npx eslint .

test:
	npm test -- --no-coverage

test-coverage:
	npm test

migrate:
	npx knex --esm migrate:latest

migration:
	npx knex --esm migrate:make ${name}

.PHONY: install test
