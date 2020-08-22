const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const routesMapping = {
  root: 'welcome',
  newUser: 'newUser',
};

const templateParameters = {
  assetPath(filename) {
    return `/assets/${filename}`;
  },
  route(name) {
    return `${routesMapping[name]}.html`;
  },
};

module.exports = {
  mode: 'development',
  entry: join(__dirname, 'src', 'index.js'),
  devServer: {
    contentBase: './dist',
    index: 'welcome.html',
    host: 'localhost',
    port: 5001,
  },
  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: 'pug-loader',
      },
    ],
  },
  plugins: [
    ...Object.values(routesMapping).map((name) => new HtmlWebpackPlugin({
      template: `./server/views/pages/${name}.pug`,
      filename: `${name}.html`,
      templateParameters,
    })),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: 'assets' },
      ],
    }),
  ],
};