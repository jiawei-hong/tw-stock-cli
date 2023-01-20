const path = require('path')
const WebpackBuildNotifierPlugin = require('webpack-build-notifier')

module.exports = {
  target: 'node',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-env'] },
          },
          { loader: 'ts-loader' },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new WebpackBuildNotifierPlugin({
      title: 'tw-stock',
      suppressSuccess: true,
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
