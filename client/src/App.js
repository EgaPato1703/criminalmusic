import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Layout from './components/Layout/Layout';
import LoadingScreen from './components/UI/LoadingScreen';
import ErrorBoundary from './components/UI/ErrorBoundary';

// Pages
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import MoodRadioPage from './pages/MoodRadioPage';
import CollectionPage from './pages/CollectionPage';
import ArtistPage from './pages/ArtistPage';
import TrackPage from './pages/TrackPage';
import SettingsPage from './pages/SettingsPage';

// Telegram WebApp integration
import { useTelegram } from './hooks/useTelegram';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.black} 0%, 
    ${props => props.theme.colors.secondaryBg} 50%, 
    ${props => props.theme.colors.black} 100%
  );
  position: relative;
  overflow-x: hidden;
`;

const CriminalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0.05;
  background-image: 
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300FFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  animation: ${props => props.theme.criminal.effects.pulse};
`;

const AppContent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !appReady) {
    return <LoadingScreen />;
  }

  return (
    <AppContainer>
      <CriminalBackground />
      
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WelcomePage />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ArtistPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/radio" element={<MoodRadioPage />} />
                <Route path="/radio/:mood" element={<MoodRadioPage />} />
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="/track/:trackId" element={<TrackPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </AppContainer>
  );
};

const App = () => {
  const { webApp } = useTelegram();

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
      webApp.setHeaderColor('#000000');
      webApp.setBackgroundColor('#000000');
      webApp.enableClosingConfirmation();
    }
  }, [webApp]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <PlayerProvider>
            <AppContent />
          </PlayerProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;