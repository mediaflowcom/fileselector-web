const path = require('path');
const cors = require('cors');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
    minimize: false, // Disable minification
    minimizer: [
      new CssMinimizerPlugin({
        include: /\.min\.css$/
      }),
      // Remove TerserPlugin to prevent JS minification
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), 
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
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      devServer.app.use(cors());
      return middlewares;
    },
  },
  output: {
    filename: '[name].js', // Serve unminified JS
    path: path.resolve(__dirname, 'dist'),
  },
};
