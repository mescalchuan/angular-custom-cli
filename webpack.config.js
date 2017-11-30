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
var HotModuleReplacementPlugin = webpack.HotModuleReplacementPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var NoEmitOnErrorsPlugin = webpack.NoEmitOnErrorsPlugin;
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var DefinePlugin = webpack.DefinePlugin;

//是否为开发环境
var isDevelopment = process.env.NODE_ENV !== 'production';
//externals配置的对象在生产环境下会自动引入CDN的对象，不会将node_modules下的文件打包进来
//在开发环境下，会自动将node_modules里的文件打包
var externals = {
        //框架文件名：import名
        'angular': 'angular'
    }
    /*
     *   配置html文件路径  
     *   每个页面的入口html名称
     *   配置js文件路径
     *   通用js文件夹
     *   每个页面的入口js
     *   默认打开的页面
     *   端口号
     */
var customConfig = {
    htmlDir: 'pages',
    htmlEntry: 'index.html',
    jsDir: 'entry',
    jsCommonDir: 'common',
    jsEntry: 'main.js',
    serverEntryDir: 'sellerCenter',
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

/*
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
                let htmlPlugin = {
                    filename: template,
                    template: template,
                    chunks: [],
                    inject: true,
                    chunksSortMode: 'manual',
                    xhtml: true,
                    showErrors: true,
                    minify: false
                };
                htmlPlugin.chunks = ['vendor', entryJSKey];
                htmlPluginArr.push(new HtmlWebpackPlugin(htmlPlugin));
            }
        }
    })
    //最基本的webpack配置
var webpackConfig = {
    entry: entry,
    output: {
        path: jsPath,
        filename: isDevelopment ? '[name].__bundle.js' : '[name].bundle.js',
    },
    externals: isDevelopment ? {} : externals,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015', 'stage-2']
                    }
                }
            },
            {
                test: /\.(jpg|png|jpeg|gif)$/,
                use: ['url-loader']
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
        new CommonsChunkPlugin({
            name: ['vendor'],
            filename: isDevelopment ? 'vendor.__bundle.js' : 'vendor.bundle.js',
            minChunks: Infinity
        })
    ]
};
//当前环境是开发环境：自动启动入口页面，支持热更新，映射原始代码，开启mock服务
if (isDevelopment) {
    var cssLoader = {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    };
    webpackConfig.module.rules.push(cssLoader);
    webpackConfig.devtool = 'source-map';
    webpackConfig.plugins = webpackConfig.plugins.concat([
        new HotModuleReplacementPlugin(),
        new NoEmitOnErrorsPlugin(),
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
    var cssLoader = {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader'
        })
    };
    webpackConfig.module.rules.push(cssLoader);
    webpackConfig.plugins = webpackConfig.plugins.concat([
        new UglifyJsPlugin({
            minimize: true,
            output: {
                comments: false,
            },
            compress: {
                warnings: false
            }
        }),
        new ngAnnotatePlugin({
            add: true 
        }),
        new ExtractTextPlugin('[name].bundle.css', {
            allChunks: false
        }),
        new OptimizeCSSPlugin()
    ]);
    webpackConfig.plugins = webpackConfig.plugins.concat(htmlPluginArr);
}

module.exports = webpackConfig;