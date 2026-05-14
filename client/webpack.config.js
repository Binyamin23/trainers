const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  mode: "development",
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/,
        loader: 'ts-loader',    
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new copyWebpackPlugin({
      patterns: [
        {from: 'public/icons', to: 'icons'},
        {from: 'public/images', to: 'images'}
      ]
    })
  ],
  devServer: {  
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    }, 
    port: 9000,
    hot: true
  }
}
