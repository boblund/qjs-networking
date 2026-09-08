// webpack.config.js
const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

module.exports = ( env = {} ) => {
	const isQuickJS = !!env.quickjs;

	return {
		mode: 'development', //'production'
		devtool: 'source-map', // false, //
		entry: './index.mjs',

		//new

		resolve: {
			alias: {
				'amazon-cognito-identity-js': path.resolve( __dirname, 'amazon-cognito-identity-shim.mjs' )
			}
		},


		output: {
			filename: 'bundle.js',
			path: path.resolve( __dirname, 'dist' ),
			publicPath: '',        // relative, not absolute-from-root — matters for file:// resolution
			chunkLoading: false,
			// do NOT set `module: true` here — that switches output to real ESM
		},
		plugins: [
			new HtmlWebpackPlugin( {
				template: 'index.html',
				//favicon: 'favicon.png',
				scriptLoading: 'blocking',
				publicPath: ''
			} )
		],
		target: 'web',
		module: {
			rules: [
				{
					test: /\.css$/,
					resourceQuery: /stylesheet/,
					use: [
						{
							loader: 'css-loader',
							options: {
								exportType: 'css-style-sheet',
								esModule: true
							}
						}
					]
				},
				{
					test: /\.css$/,
					resourceQuery: { not: [ /stylesheet/ ] },
					use: [ 'style-loader', 'css-loader' ],
				},
				{
					test: /.(mjs|js)$/,
					use: [
						{ loader: "ifdef-loader", options: {
							QUICKJS: isQuickJS,
							WEBPACK: true,
							"ifdef-uncomment-prefix": "// #code "
						} }
					]
				},
				{
					test: /\.js$/,
					exclude: /(node_modules)/,
					use: {
						loader: "babel-loader",
					}
				}
			]
		}
	};
};
