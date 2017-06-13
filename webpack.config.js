/* eslint global-require: "off" */
const path = require('path');
const webpack = require('webpack');

const DEBUG = 'DEBUG' in process.env && parseInt(process.env.DEBUG, 10) > 0;
const PROD = process.argv.indexOf('-p') !== -1;
const NODE_ENV = PROD ? 'production' : 'development';
const USE_SOURCE_MAP = DEBUG && !PROD;
const USE_LINTERS = DEBUG;

const BUILD_DIR = path.resolve(__dirname, 'build');

console.log(`Output dir: ${BUILD_DIR}`);
console.log(`Enviroment: ${NODE_ENV}`);
console.log(`Debug: ${DEBUG ? 'enabled' : 'disabled'}`);
console.log(`Linters: ${USE_LINTERS ? 'enabled' : 'disabled'}`);
console.log(`Source maps: ${USE_SOURCE_MAP ? 'enabled' : 'disabled'}`);
console.log('---\nWebpack running...');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');

const banner = new String(''); // eslint-disable-line no-new-wrappers
banner.toString = () => {
    return `Generated by Intecmedia.Webpack: ${new Date().toISOString()} | ${NODE_ENV} | [file]?v=[chunkhash]`;
};

const htmlOptions = {
    inject: false,
    minify: false,
};

module.exports = {

    devServer: {
        overlay: true,
        compress: false,
    },

    entry: {
        vendor: [
            'jquery',
            './source/js/vendor.js',
        ],
        app: './source/js/app.js',
    },

    output: {
        path: BUILD_DIR,
        filename: 'js/app.min.js',
    },

    performance: {
        hints: PROD && !DEBUG ? 'error' : false,
        maxAssetSize: 512 * 1024,
        maxEntrypointSize: 256 * 1024,
    },

    plugins: [
        // dev-and-prod
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'js/vendor.min.js',
        }),
        new ExtractTextPlugin({
            filename: 'css/app.min.css',
        }),
        new webpack.BannerPlugin({
            banner: banner,
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            _: 'underscore',
        }),
        new webpack.DefinePlugin({
            'NODE_ENV': JSON.stringify(NODE_ENV),
        }),
        new HtmlWebpackPlugin(Object.assign(htmlOptions, {
            filename: 'index.html',
            template: './source/index.html',
        })),
        new webpack.LoaderOptionsPlugin({
            test: /\.(jpe?g|png|gif|svg)$/i,
            exclude: /fonts/,
            options: {
                customInterpolateName: (url) => url.replace(/^img\/img\//, 'img/'),
            },
        }),
    ].concat(PROD ? [
        // prod-only
        new webpack.optimize.UglifyJsPlugin({
            banner: banner,
            comments: false,
        }),
    ] : [
        // dev-only
    ]).concat(USE_LINTERS ? [
        new StyleLintPlugin({
            fix: true,
            files: ['**/*.scss'],
            syntax: 'scss',
        }),
    ] : []),

    devtool: USE_SOURCE_MAP ? 'eval-source-map' : '',

    resolve: {
        alias: {
            modernizr: path.resolve(__dirname, '.modernizrrc'),
        },
    },

    module: {
        rules: [
            // html loaders
            {
                test: /\.html$/,
                loader: 'underscore-template-loader',
                options: {
                    attributes: ['img:src'],
                },
            },
            // javascript loaders
            {
                test: /\.modernizrrc$/,
                loader: 'modernizr-loader!json-loader',
            },
            {
                test: /\.js$/,
                include: /node_modules/,
                loader: 'imports-loader',
                options: {
                    $: 'jquery',
                    jQuery: 'jquery',
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['env'],
                            forceEnv: NODE_ENV,
                            cacheDirectory: !PROD,
                        },
                    },
                ].concat(USE_LINTERS ? [
                    {
                        loader: 'eslint-loader',
                        options: {
                            fix: true,
                            cache: !PROD,
                        },
                    },
                ] : []),
            },
            // image loaders
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                exclude: /fonts/,
                loaders: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'img/[folder]/[name].[ext]?[hash]',
                        },
                    },
                    {
                        loader: path.join(__dirname, 'imagemin.loader.js'),
                        options: {
                            plugins: [
                                require('imagemin-jpegtran')({
                                    // https://github.com/imagemin/imagemin-jpegtran
                                }),
                                require('imagemin-svgo')({
                                    // https://github.com/imagemin/imagemin-svgo
                                }),
                                require('imagemin-pngquant')({
                                    // https://github.com/imagemin/imagemin-pngquant
                                }),
                            ],
                        },
                    },
                ],
            },
            // font loaders
            {
                test: /\.(eot|woff|woff2|ttf|svg)(\?v=.+)?$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name].[ext]?[hash]',
                },
            },
            // css loaders
            {
                test: /\.s?css$/,
                loaders: (PROD ? [] : ['css-hot-loader']).concat(ExtractTextPlugin.extract({
                    publicPath: '../',
                    fallback: [
                        {
                            loader: 'style-loader',
                            options: {
                                sourceMap: USE_SOURCE_MAP,
                            },
                        },
                    ],
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 2, // index of 'sass-loader'
                                sourceMap: USE_SOURCE_MAP,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: USE_SOURCE_MAP ? 'inline' : false,
                                plugins: [
                                    // dev-and-prod
                                    require('postcss-cssnext')(),
                                    require('postcss-url')({
                                        filter: '**/img/*',
                                        maxSize: 32 * 1024,
                                        url: 'inline',
                                    }),
                                ].concat(PROD ? [
                                    // prod-only
                                    require('css-mqpacker')(),
                                    require('cssnano')({
                                        autoprefixer: false,
                                        discardComments: {
                                            removeAll: true,
                                        },
                                    }),
                                ] : [
                                    // dev-only
                                ]),
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                data: `$NODE_ENV: ${NODE_ENV};`,
                                indentWidth: 4,
                                sourceMap: USE_SOURCE_MAP ? 'inline' : false,
                                sourceMapEmbed: USE_SOURCE_MAP,
                                sourceComments: USE_SOURCE_MAP,
                            },
                        },
                    ],
                })),
            },
        ],
    },

};
