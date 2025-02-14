const { SvgoDefaultConfig } = require('./svgo.config.js');

const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminOptipng = require('imagemin-optipng');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminJpegtran = require('imagemin-jpegtran');

module.exports = {
    plugins: [
        imageminMozjpeg({
            quality: 85,
            progressive: true,
        }),
        imageminOptipng({
            optimizationLevel: 3,
        }),
        imageminPngquant({
            speed: 3,
            quality: [0.85, 1.0],
        }),
        imageminSvgo(SvgoDefaultConfig),
        imageminGifsicle({
            optimizationLevel: 3,
        }),
        imageminJpegtran({
            progressive: true,
        }),
    ],
};
