NPM := npm

.PHONY: setup dev build test clean

setup:
	$(NPM) install

dev:
	$(NPM) run dev

build:
	$(NPM) run build

test:
	$(NPM) run test

clean:
	rm -rf node_modules dist
