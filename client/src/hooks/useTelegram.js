import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we're in Telegram WebApp environment
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      
      // Get user data from Telegram
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      // Mark as ready
      tg.ready();
      setIsReady(true);
      
      // Configure WebApp
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Set theme colors for criminal theme
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
      
      // Handle back button
      tg.BackButton.onClick(() => {
        window.history.back();
      });
      
    } else {
      // Development mode - create mock Telegram user
      console.warn('Not in Telegram WebApp environment, using mock data');
      
      const mockUser = {
        id: 123456789,
        first_name: 'Criminal',
        last_name: 'User',
        username: 'criminal_dev',
        language_code: 'ru'
      };
      
      const mockWebApp = {
        initData: 'mock_init_data',
        initDataUnsafe: { user: mockUser },
        ready: () => console.log('Mock WebApp ready'),
        expand: () => console.log('Mock WebApp expanded'),
        close: () => console.log('Mock WebApp closed'),
        enableClosingConfirmation: () => console.log('Mock closing confirmation enabled'),
        setHeaderColor: (color) => console.log('Mock header color set:', color),
        setBackgroundColor: (color) => console.log('Mock background color set:', color),
        BackButton: {
          show: () => console.log('Mock back button shown'),
          hide: () => console.log('Mock back button hidden'),
          onClick: (callback) => console.log('Mock back button click handler set')
        },
        MainButton: {
          text: '',
          color: '#000000',
          textColor: '#00FFFF',
          isVisible: false,
          isActive: true,
          show: () => console.log('Mock main button shown'),
          hide: () => console.log('Mock main button hidden'),
          setText: (text) => console.log('Mock main button text set:', text),
          onClick: (callback) => console.log('Mock main button click handler set')
        },
        HapticFeedback: {
          impactOccurred: (style) => console.log('Mock haptic feedback:', style),
          notificationOccurred: (type) => console.log('Mock notification feedback:', type),
          selectionChanged: () => console.log('Mock selection feedback')
        }
      };
      
      setWebApp(mockWebApp);
      setUser(mockUser);
      setIsReady(true);
    }
  }, []);

  // Utility functions
  const showBackButton = () => {
    if (webApp && webApp.BackButton) {
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp && webApp.BackButton) {
      webApp.BackButton.hide();
    }
  };

  const showMainButton = (text, onClick) => {
    if (webApp && webApp.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp && webApp.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const hapticFeedback = (type = 'light') => {
    if (webApp && webApp.HapticFeedback) {
      switch (type) {
        case 'light':
        case 'medium':
        case 'heavy':
          webApp.HapticFeedback.impactOccurred(type);
          break;
        case 'success':
        case 'warning':
        case 'error':
          webApp.HapticFeedback.notificationOccurred(type);
          break;
        case 'selection':
          webApp.HapticFeedback.selectionChanged();
          break;
        default:
          webApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const closeApp = () => {
    if (webApp) {
      webApp.close();
    }
  };

  const shareToChat = (url, text) => {
    if (webApp && webApp.openTelegramLink) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      webApp.openTelegramLink(shareUrl);
    } else {
      // Fallback for non-Telegram environment
      if (navigator.share) {
        navigator.share({
          title: text,
          url: url
        });
      } else {
        // Copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
      }
    }
  };

  const openLink = (url) => {
    if (webApp && webApp.openLink) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    webApp,
    user,
    isReady,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    closeApp,
    shareToChat,
    openLink
  };
};
