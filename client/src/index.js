import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GlobalStyles from './styles/GlobalStyles';
import { criminalTheme } from './styles/theme';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={criminalTheme}>
        <GlobalStyles />
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a0000',
              color: '#00FFFF',
              border: '1px solid #8B0000',
              borderRadius: '8px',
              fontFamily: 'Metal Mania, cursive',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0, 255, 255, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#00FFFF',
                secondary: '#000000',
              },
            },
            error: {
              iconTheme: {
                primary: '#8B0000',
                secondary: '#000000',
              },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
