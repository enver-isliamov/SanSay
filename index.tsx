import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker следует регистрировать только в производственной среде,
// так как в среде разработки AI Studio возникает ошибка Same-Origin Policy.
const isDevelopmentEnvironment = window.location.hostname.includes('usercontent.goog');

if ('serviceWorker' in navigator && !isDevelopmentEnvironment) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
