import cors from 'cors';
import {app} from './app';

const corsOptions = {
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
};
app.use(cors(corsOptions));
export const viteNodeApp = app;
