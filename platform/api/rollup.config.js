import path from "path";
import {readFileSync} from 'fs';
import { fileURLToPath } from 'url';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const infraPkg = JSON.parse(readFileSync('../infra/package.json', 'utf8'));

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
        }
    ],
    external: [
        'util',
        'tty',
        'string_decoder',
        'fs',
        'http',
        'https',
        'path',
        'net',
        'async_hooks',
        'crypto',
        'stream',
        'zlib',
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(infraPkg.devDependencies || {})
    ],
    plugins: [
        alias({
            entries: {
                'infra-common': path.resolve(__dirname, '../infra/src/common')
            }
        }),
        json(),
        resolve({preferBuiltins: true, exportConditions: ['node']}),
        replace({
            preventAssignment: true,
            values: {
                'process.env.STACK_NAME': JSON.stringify(process.env.STACK_NAME || '')
            }
        }),
        commonjs(),
        typescript({
            include: ['src/**/*', '../infra/src/common/**/*']
        }),
    ],
};