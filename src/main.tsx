import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/sora/wght.css';
import '@fontsource-variable/figtree/wght.css';
import './styles.css';
import { registerServiceWorker } from './pwa';

registerServiceWorker();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
