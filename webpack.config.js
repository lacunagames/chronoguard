import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import path from 'path';

module.exports = {
	entry: {
		game: './client/game.js',
	},
	output: {
		path: path.join(__dirname, 'static/'),
		filename: '[name].bundle.js',
		publicPath: '/static/'
	},
	resolve: {
		modules: [
			path.resolve('./static'),
			path.resolve('./node_modules'),
			path.resolve('./client'),
		],
	},
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{ loader: 'babel-loader' },
				],
			},
			{
				test: /\.jsx$/,
				exclude: /node_modules/,
				use: [
					{ loader: 'babel-loader' },
				],
			},
			{
				test: /\.scss$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{loader: 'css-loader', options: {url: false}},
						'sass-loader',
					],
				}),
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: 'css-loader',
				}),
			},
			{
				test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 10000,
							mimetype: 'application/font-woff',
						},
					},
				],
			},
			{
				test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 10000,
							mimetype: 'application/font-woff',
						},
					},
				],
			},
			{
				test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
					},
				],
			},
			{
				test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 10000,
							mimetype: 'image/svg+xml',
						},
					},
				],
			},
			{
				test: /\.(jpe?g|png|gif|)$/,
				use: [
					{
						loader: 'file-loader',
					},
				],
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
		  'process.env.NODE_ENV': JSON.stringify('production')
		}),
		new ExtractTextPlugin('[name].bundle.css'),
		new webpack.optimize.UglifyJsPlugin(),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'game',
			filename: 'game.bundle.js'
		})
	],
};

