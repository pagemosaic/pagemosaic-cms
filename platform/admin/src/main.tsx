import 'allotment/dist/style.css';
// import '@/styles/github-markdown.css';
import '@/styles/index.css';
import '@/styles/tailwind.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {App} from '@/App';
import {Toaster} from '@/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
        <Toaster />
    </React.StrictMode>
);
