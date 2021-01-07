import { join } from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const mode = process.env.NODE_ENV || 'development';

export default {
  mode,
  devtool: 'source-map',
  output: {
    path: join(__dirname, 'dist', 'public'),
  },
  devServer: {
    host: 'localhost',
    port: 5001,
    publicPath: '/assets/',
    compress: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'public' },
      ],
    }),
  ],
};
