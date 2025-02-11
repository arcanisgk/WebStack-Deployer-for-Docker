const fs = require('fs');
const path = require('path');
const sass = require('sass');

// Paths
const sourcePath = path.join(__dirname, 'custom.scss');
const cssOutputPath = path.join(__dirname, '..', 'gui', 'src','assets','css', 'bootstrap.css');
const bootstrapJsSource = path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js', 'bootstrap.bundle.min.js');
const jsOutputPath = path.join(__dirname, '..', 'gui', 'src','assets','js', 'bootstrap.bundle.min.js');

// Compile SCSS
const result = sass.compile(sourcePath, {style: 'compressed'});
fs.writeFileSync(cssOutputPath, result.css);

// Copy JS file
fs.copyFileSync(bootstrapJsSource, jsOutputPath);