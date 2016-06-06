import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/status.js',
	plugins: [
		babel(),
		nodeResolve(),
		commonjs()
	],
	format: 'cjs',
	dest: 'tmp/lambda/status.js',
	external: ['aws-sdk']
};
