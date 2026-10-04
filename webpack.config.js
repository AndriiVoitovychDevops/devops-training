// Webpack збирає frontend/src у frontend/dist: один JS-файл з хешем у назві + index.html.
// Хеш (contenthash) змінюється тільки коли змінився код — браузер і S3 правильно кешують файли.
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './frontend/src/index.js',
  output: {
    filename: 'assets/app.[contenthash:8].js',
    path: path.resolve(__dirname, 'frontend/dist'),
    clean: true, // видаляти старі файли перед кожною збіркою
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './frontend/src/index.html' }),
  ],
};
