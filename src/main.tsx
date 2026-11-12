import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import './styles.css';
import App from './App';
import { DataProvider } from './state/DataContext';

const Router = import.meta.env.VITE_ARTIFACT ? MemoryRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <DataProvider>
        <App />
      </DataProvider>
    </Router>
  </StrictMode>,
);
