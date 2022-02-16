const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  target: 'node',
  entry: './src/index.js',
  module: {},
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'umd',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
}
