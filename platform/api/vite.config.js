import path from "path";
import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig(({ command, mode }) => {
    // Development server configuration
    return {
        define: {
            'process.env.STACK_NAME': JSON.stringify(process.env.STACK_NAME || ''),
        },
        plugins: [
            ...VitePluginNode({
                adapter: 'express',
                appPath: './src/server.ts',
                exportName: 'viteNodeApp',
            }),
        ],
        resolve: {
            alias: {
                'infra-common': path.resolve(__dirname, '../infra/src/common')
            }
        },
        server: {
            port: 3030
        },
    };
});
