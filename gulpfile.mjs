import gulp from 'gulp';
const { watch, series, src, dest,parallel } = gulp;
import browserSync  from 'browser-sync';
const bs = browserSync.create();
import concat       from'gulp-concat';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import {deleteSync} from 'del';
import gulpIf       from'gulp-if';
import cssnano      from'gulp-cssnano';
import useref       from'gulp-useref';
import uglify       from'gulp-uglify';
import imagemin, {gifsicle, optipng} from 'gulp-imagemin';
import webp         from 'gulp-webp';
import jpegRecompress from'imagemin-jpeg-recompress';
import cache          from 'gulp-cache';
const reload       = browserSync.reload;
// PATH for folder/files - relative to gulpfile.js
var devPaths = {
  root: 'assets/',
  allCss: 'assets/scss/plugins.scss',
  scss: 'assets/scss/',
  css: 'assets/css/',
  allScripts: 'assets/js/plugins.js',
  scripts: 'assets/js/',
  images: 'assets/images/',
  fonts: 'assets/fonts/',
  html: 'dist/',
  headerFolder: '',
  headerTpl: '*.html'
}
var distPaths = {
  root: 'dist/assets/',
  css: 'dist/assets/css/',
  scripts: 'dist/assets/js/',
  images: 'dist/assets/images/',
  fonts: 'dist/assets/fonts/',
  html: 'dist/',
  headerFolder: 'build/',
  headerTpl: 'dist/*.html'
}

// browserSync
var sync = {
  server: {
    baseDir: "./dist"
  },
}

// autoprefixer
var settingsAutoprefixer = {
  browsers: [
    'last 2 versions'
  ]
}

// critical css
var critical = {
  base: 'dist/',
  ignore: ['@font-face','content',/url\(/ /*, /.modal/,/.dropdown/*/],
  include: [/.col-/, /svg/, '.row', '.img-fluid', '.modal'],
  minify: true,
  timeout: 3000000,
  width: 2000,
  height: 1000
}
const config = {
  critical: critical,
  devPaths: devPaths,
  distPaths: distPaths,
  settingsAutoprefixer: settingsAutoprefixer,
  basepath: 'src/',
  sync: sync
}
var plugins = [
  './node_modules/jquery/dist/jquery.js',
];

const list_plugins = {
  list: plugins
}
function webp_clean(cb) {
  deleteSync(config.basepath+config.devPaths.images + 'webp');
    cb();
}
function convertImageToWebp() {
    return src([config.basepath+config.devPaths.images + '**/*.{png,jpg,jpeg}', '!webp'])
        .pipe(webp())
        .pipe(dest(config.basepath+config.distPaths.images + '/webp'))
}
function convertImageToWebpdevPaths() {
    return src([config.basepath+config.devPaths.images + '**/*.{png,jpg,jpeg}', '!webp'])
        .pipe(webp())
        .pipe(dest(config.distPaths.images + '/webp'))
}
function clean(cb) {
  console.log(config);
  deleteSync(config.sync.server.baseDir);
  deleteSync(config.distPaths.headerFolder);
    cb();
}
function browser_sync_reload(cb) {
    browserSync.reload();
    cb();
}
function browser_sync_refresh(cb) {
    browserSync.reload({stream:true});
    cb();
}
function useref_builder() {
    return src('./'+config.devPaths.html+config.devPaths.headerTpl)
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(dest(config.distPaths.headerFolder))
}
function html_build(cb) {
    src(config.basepath+config.devPaths.headerTpl)
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', cssnano({zindex: false})))
        .pipe(dest(config.distPaths.headerFolder));
    return cb();
}
function images_build(cb) {
    src(config.distPaths.images + '**/*.{png,jpg,jpeg,webp,svg}')
        .pipe(dest(config.distPaths.headerFolder + config.devPaths.images));
    return cb();
}
function sass_tocss() {
    return src(config.basepath+config.devPaths.scss + '**/*.scss')
        // .pipe(gulpIf(!flags.production, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        // .pipe(autoprefixer({ browsers: config.settingsAutoprefixer.browsers }))
        // .pipe(gulpIf(!flags.production, sourcemaps.write()))
        .pipe(dest(config.basepath+config.devPaths.css))
}
function javascript(cb) {
    // console.log("hello");
    src(config.basepath+config.devPaths.scripts + '**/*.js')
        .pipe(dest(config.distPaths.scripts));
    cb();
}
function pluginsScripts(cb) {
        src(list_plugins.list)
        .pipe(concat('plugins.js'))
        .pipe(dest(config.basepath+config.devPaths.scripts));
    cb();
}
function css(cb) {
    src(config.basepath+config.devPaths.css + '**/*.css')
        .pipe(cssnano({zindex: false}))
        .pipe(dest(config.distPaths.css))
        .pipe(browserSync.reload({stream:true}));
    cb();
}
function html_change(cb) {
    console.log(config.basepath + '**/*.html');
    src(config.basepath + '**/*.html')
        .pipe(dest(config.distPaths.html));
    cb();
}
function browser_sync(cb) {
    browserSync.init(config.sync);
    cb();
}
function fonts() {
    return src(config.basepath+config.devPaths.fonts + '**/*.{woff,woff2,otf,ttf}')
        .pipe(dest(config.distPaths.fonts))
}
function fonts_build() {
    return src(config.basepath+config.devPaths.fonts + '**/*.{woff,woff2,otf,ttf}')
        .pipe(dest(config.distPaths.headerFolder + config.devPaths.fonts))
}
function watch_change() {
    watch(config.basepath+config.devPaths.scss+'**/*.scss', sass_tocss);
    watch(config.basepath+config.devPaths.css+'**/*.css', series(css,  browser_sync_refresh));
    watch(config.basepath+config.devPaths.scripts+'**/*.js', series(javascript,  browser_sync_reload));
    // watch('./list_plugins.js', series(pluginsScripts,  browser_sync_reload));
    watch(config.basepath+"**/*.html", series(html_change, browser_sync_reload ));
    watch(config.basepath+config.devPaths.images + '**/*.{png,jpg,jpeg,svg,webp}', series(images_clean,webp_clean, convertImageToWebpdevPaths, images, images_webp ));
    watch(config.basepath+config.devPaths.fonts+"**/*.{woff,woff2,otf,ttf}", fonts);
    // watch(config.basepath+config.devPaths.images + '**/*.webp', images_webp);
}
function images_webp() {
    return src(config.basepath+config.devPaths.images + '**/*.webp').pipe(dest(config.distPaths.images))
}
function images_clean(cb) {
    // return src(config.basepath+config.distPaths.images + '**/*.webp').pipe(dest(config.distPaths.images))
    del.sync(config.distPaths.images);
    cb();
}
function images() {
    return src(config.basepath+config.devPaths.images + '**/*.{png,jpg,jpeg,svg}')
        .pipe(cache(imagemin([
            gifsicle({interlaced: true}),
            jpegRecompress({
                loops:4,
                min: 50,
                max: 95,
                quality:'high'
            }),
            optipng({optimizationLevel: 7})
        ])))
        .pipe(dest(config.distPaths.images))
}
const allTasks = series(clean, webp_clean, convertImageToWebpdevPaths, images, images_webp, fonts, html_change,pluginsScripts, javascript, sass_tocss, css, browser_sync, watch_change);
const buildall = series(clean, webp_clean, convertImageToWebp, images, images_webp, fonts, html_change,pluginsScripts, javascript, sass_tocss, css, html_build,images_build,fonts_build);

export {
  allTasks as default,
  buildall as build,
}
