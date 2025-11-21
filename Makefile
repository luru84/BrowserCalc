NPM := npm

.PHONY: setup dev build test lint typecheck clean

setup:
	$(NPM) install

dev:
	$(NPM) run dev

build:
	$(NPM) run build

test:
	$(NPM) run test

lint:
	$(NPM) run lint

typecheck:
	$(NPM) run typecheck

clean:
	rm -rf node_modules dist
