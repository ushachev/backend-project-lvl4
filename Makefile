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
	npm test

test-coverage:
	npm test -- --coverage

migrate:
	npx knex --esm migrate:latest

migration:
	npx knex --esm migrate:make ${name}

secret:
	npx secure-session-gen-key > secret-key
	npx babel-node makeSecret.js

.PHONY: install test
