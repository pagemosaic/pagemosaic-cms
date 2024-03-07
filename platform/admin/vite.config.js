import path from "path";
import {readFileSync} from "fs";
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const infraPkg = JSON.parse(readFileSync('../infra/package.json', 'utf8'));

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
    if (command === 'serve') {
        return {
            base: '/admin',
            define: {
                'process.env.STACK_NAME': JSON.stringify(process.env.STACK_NAME || ''),
            },
            build: {
                rollupOptions: {
                    external: [
                        ...Object.keys(pkg.devDependencies || {}),
                        ...Object.keys(infraPkg.devDependencies || {})
                    ]
                }
            },
            plugins: [react()],
            resolve: {
                alias: {
                    '@': path.resolve(__dirname, "./src"),
                    'infra-common': path.resolve(__dirname, '../infra/src/common')
                },
            },
            server: {
                host: '0.0.0.0',
                cors: {
                    origin: '*'
                },
                port: 8080,
                proxy: {
                    '/api': 'http://localhost:3030',
                }
            },
            preview: {
                host: '0.0.0.0',
                cors: {
                    origin: '*'
                },
                port: 8080,
                proxy: {
                    '/api': 'http://localhost:3030',
                }
            },
        };
    }
    return {
        base: '/admin',
        plugins: [react()],
        define: {
            'process.env.STACK_NAME': JSON.stringify(process.env.STACK_NAME || ''),
        },
        build: {
            chunkSizeWarningLimit: 5000,
            rollupOptions: {
                external: [
                    ...Object.keys(pkg.devDependencies || {}),
                    ...Object.keys(infraPkg.devDependencies || {})
                ]
            }
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, "./src"),
                'infra-common': path.resolve(__dirname, '../infra/src/common')
            },
        },
        server: {
            host: '0.0.0.0',
            port: 8080,
        },
        preview: {
            host: '0.0.0.0',
            port: 8080,
        },
    };
});
