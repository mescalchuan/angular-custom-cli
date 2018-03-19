var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var mock2easy = require('mock2easy');

var OpenBrowserPlugin = require('open-browser-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
//解决angular压缩后代码无法运行的问题
var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
//提高loader的解析速度
var HappyPack = require('happypack');
var HotModuleReplacementPlugin = webpack.HotModuleReplacementPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var NoEmitOnErrorsPlugin = webpack.NoEmitOnErrorsPlugin;
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var DefinePlugin = webpack.DefinePlugin;
var DllReferencePlugin = webpack.DllReferencePlugin;

//是否为开发环境
var isDevelopment = process.env.NODE_ENV !== 'production';
//externals配置的对象在生产环境下会自动引入CDN的对象，不会将node_modules下的文件打包进来
//在开发环境下，会自动将node_modules里的文件打包
var externals = {
        //框架文件名：import名
        'angular': 'angular'
    }

/**
 * 配置html文件路径
 * 每个页面的入口html名称
 * 配置js文件路径
 * 通用js文件夹
 * 每个页面的入口js
 * 默认打开的页面
 * 端口号
 */
var customConfig = {
    htmlDir: 'pages',
    htmlEntry: 'index.html',
    jsDir: 'entry',
    jsCommonDir: 'common',
    jsEntry: 'main.js',
    serverEntryDir: 'home',
    devServerPort: 3000
};

//mock服务器配置
var mockConfig = {
  port: 3005,
  lazyLoadTime: 3000,
  database: 'mock2easy',
  doc: 'doc',
  ignoreField: [],
  interfaceSuffix: '.json',
  preferredLanguage: 'en'
};

var htmlPath = path.resolve(__dirname, customConfig.htmlDir);
var jsPath = path.resolve(__dirname, customConfig.jsDir);
//配置公共js文件
var commonModule1 = path.resolve(__dirname, customConfig.jsCommonDir + '/app');

var entry = {
    vendor: [commonModule1]
};
var htmlPluginArr = [];

/**
 * 遍历js文件下的所有文件夹，在每个文件夹里面生成打包后的js文件
 * 开发人员在生产环境下手动引入打包后的文件并不现实
 * 使用html-webpack-plain自动生成一个引入了所有打包文件的新html（覆盖原有的）
 */
var files = fs.readdirSync(jsPath);
files.forEach(function(filename) {
    var stats = fs.statSync(path.join(jsPath, filename));
    if (stats.isDirectory()) {
        var entryJSKey = filename + '/' + customConfig.jsEntry.split('.js')[0];
        var template = path.resolve(__dirname, customConfig.htmlDir, filename, customConfig.htmlEntry);
        entry[entryJSKey] = path.join(jsPath, filename, '/' + customConfig.jsEntry);
        if (!isDevelopment) {
            var htmlPlugin = {
                //htmlPlugin的filename的参考路径是output的path
                filename: '../build/' + filename + '/' + customConfig.htmlEntry,
                template: template,
                chunks: ['vendor', entryJSKey],
                inject: true,
                chunksSortMode: 'manual',
                xhtml: true,
                showErrors: true,
                minify: false
            };
            htmlPluginArr.push(new HtmlWebpackPlugin(htmlPlugin));
        }
    }
})
//最基本的webpack配置
var webpackConfig = {
    entry: entry,
    externals: isDevelopment ? {} : externals,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['happypack/loader?id=babel']
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 8192,
                    name: isDevelopment ? '[name]_[hash:8].[ext]' : '../image/[name].[ext]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    devServer: {
        hot: true,
        inline: true,
        progress: true,
        contentBase: path.resolve(__dirname),
        compress: true,
        port: customConfig.devServerPort,
        stats: {
            colors: true
        },
        proxy:{
            '/*.json':{
                target:'http://localhost:3005', // 8005 为mock服务所绑定的端口号
                secure:false
            }
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            }
        }),
        new HappyPack({
            id: 'babel',
            loaders: [{
                loader: 'babel-loader',
                options: {
                    presets: ['es2015', 'stage-2']
                }
            }]
        }),
        new CommonsChunkPlugin({
            name: ['vendor'],
            filename: isDevelopment ? 'vendor.__bundle.js' : 'vendor_[chunkhash:8].bundle.js',
            minChunks: Infinity
        })
    ]
};
//当前环境是开发环境：自动启动入口页面，支持热更新，映射原始代码，开启mock服务
if (isDevelopment) {
    webpackConfig.output = {
        path: path.resolve(__dirname, customConfig.jsDir),
        filename: '[name].__bundle.js',
        chunkFilename: '[id].__bundle.js',
        //开发环境下是否开启了本地服务器？否：是
        publicPath: process.env.NODE_ENV ? '../../entry/' : '/'
    };
    var cssLoader = {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
    };
    var sassLoader = {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
    }
    webpackConfig.module.rules.push(sassLoader);
    webpackConfig.module.rules.push(cssLoader);
    webpackConfig.devtool = 'source-map';
    webpackConfig.plugins = webpackConfig.plugins.concat([
        new HotModuleReplacementPlugin(),
        new NoEmitOnErrorsPlugin(),
        new DllReferencePlugin({
            context: __dirname,
            manifest: require('./entry/angular.manifest.json'),
        }),
        new OpenBrowserPlugin({
            url: 'http://localhost:' + customConfig.devServerPort + '/' + customConfig.htmlDir + '/' + customConfig.serverEntryDir + '/' + customConfig.htmlEntry
        })
    ]);
    mock2easy(mockConfig, function (app) {
        app.listen(mockConfig.port, function () {
            console.log('mockServer has started , see : localhost:' + mockConfig.port);
        });
    });
}
//当前环境是生产环境：去掉注释、压缩代码、生成html文件
else {
    webpackConfig.output = {
        path: path.resolve(__dirname, 'build'),
        filename: '[name]_[chunkhash:8].bundle.js',
        //异步加载模块
        chunkFilename: '[id]_[chunkhash:8].bundle.js',
        publicPath: '../'
    }
    var cssLoader = {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader']
        })
    };
    var sassLoader = {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
            use: ['css-loader', 'postcss-loader', 'sass-loader'],
            fallback: 'style-loader'
        })
    }
    webpackConfig.module.rules.push(sassLoader);
    webpackConfig.module.rules.push(cssLoader);
    webpackConfig.plugins = webpackConfig.plugins.concat([
        new UglifyJsPlugin({
            minimize: true,
            output: {
                comments: false,
                beautify: false
            },
            compress: {
                warnings: false,
                drop_console: true,
                collapse_vars: true,
                reduce_vars: true
            }
        }),
        new ngAnnotatePlugin({
            add: true
        }),
        new ExtractTextPlugin('[name]_[chunkhash:8].bundle.css', {
            allChunks: false
        }),
        new OptimizeCSSPlugin()
    ]);
    webpackConfig.plugins = webpackConfig.plugins.concat(htmlPluginArr);
}

module.exports = webpackConfig;
