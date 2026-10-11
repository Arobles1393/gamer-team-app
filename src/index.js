import React from 'react';
import ReactDOM from 'react-dom/client';
// Primero: así también se reportan los errores al cargar (si hay DSN)
import { initErrorReporting } from "./monitoring/errorReporting";
import './index.css';
// Antes que la app: idioma, traducciones y locale de PrimeReact
import './i18n';
import reportWebVitals from './reportWebVitals';
import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import { BrowserRouter } from "react-router-dom";
// Importado directo (no desde ./routes) para evitar el ciclo App → routes → App
import RootRoutes from "./routes/RootRoutes";
import { ErrorBoundary } from "./components/ErrorBoundary";

initErrorReporting();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <PrimeReactProvider value={{ ripple: true }}>
        {/* Último recurso: si algo falla fuera de las páginas */}
        <ErrorBoundary>
          <RootRoutes />
        </ErrorBoundary>
      </PrimeReactProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
