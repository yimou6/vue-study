const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = (env) => {
    const isDEV = env.NODE_ENV === 'dev'
    const outputFile = isDEV ? 'test' : 'dict'
    return {
        mode: isDEV ? 'development' : 'production',
        entry: isDEV ? './src/test.js' : './src/index.js',
        output: {
            filename: isDEV ? 'bundle.js' : 'vue.study.js',
            path: path.resolve(__dirname, outputFile)
        },
        plugins: isDEV
            ? [new HtmlWebpackPlugin({
                template: './test/index.html'
            })]
            : [],
        devtool: 'inline-source-map',
        devServer: {
            port: 3000
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        },
        performance: {
            hints: 'warning',
            maxEntrypointSize: 1000000000,
            maxAssetSize: 1000000000,
        }
    }
}
