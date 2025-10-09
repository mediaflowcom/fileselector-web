const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        include: /\.min\.css$/
      }),
      new TerserPlugin({
        include: /\.min\.js$/
      })
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), 
    new MiniCssExtractPlugin({
      filename: 'css/fileselector.min.css'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/fileselector.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: true,
      template: path.resolve(__dirname, 'src', 'index.html'),
      minify: {removeRedundantAttributes: false} // do not remove type="text"
    }),
    new webpack.DefinePlugin({
      FS_VERSION: JSON.stringify(require("./package.json").version)
    }),
    new CopyWebpackPlugin({ 
      patterns: [
        { 
          from: './src/js/presets', 
          to: './',
          globOptions: { ignore: [ '**/env.js'] } 
        }
      ] 
    })
  ],
  entry: {
    'fileselector': path.resolve(__dirname, './src/js/fileselector.js'),
  },
  devServer: {
    client: {
      overlay: false,
    },
    static: [{
      directory: path.join(__dirname, 'dist'),
    },
    {
      directory: path.join(__dirname, './src/js/presets'),
    }],
  },    
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'dist'),
  },
};