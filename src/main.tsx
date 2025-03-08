import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, UNSAFE_DataRouterContext } from 'react-router-dom';
import App from './App';
import './index.css';

// Enable React Router v7 future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={router.future}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
