import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/toggle.js',
	plugins: [
		babel(),
		nodeResolve(),
		commonjs()
	],
	format: 'cjs',
	dest: 'tmp/lambda/toggle.js',
	external: ['aws-sdk']
};
