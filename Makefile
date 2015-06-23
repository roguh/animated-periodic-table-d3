NAME=vis
OUT=dist

all: compress

compress: compile
	# Minify the resulting javascript
	cd $(OUT) ; \
	uglifyjs --screw-ie8 \
	    --in-source-map $(NAME).js.map \
	    --source-map \
	    -mco $(NAME).min.js -- $(NAME).js

compile:
	# Generate source map in OUT and compile the coffee
	coffee --bare -mo $(OUT) -c $(NAME).coffee
