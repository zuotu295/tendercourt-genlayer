import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

if (new URLSearchParams(window.location.search).has('static')) {
  document.documentElement.classList.add('static');
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
