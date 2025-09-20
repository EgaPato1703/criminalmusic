import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

// Keyframes
const glitchAnimation = keyframes`
  0%, 100% { 
    transform: translate(0);
    filter: hue-rotate(0deg);
  }
  10% { 
    transform: translate(-2px, -1px);
    filter: hue-rotate(90deg);
  }
  20% { 
    transform: translate(2px, 1px);
    filter: hue-rotate(180deg);
  }
  30% { 
    transform: translate(-1px, 2px);
    filter: hue-rotate(270deg);
  }
  40% { 
    transform: translate(1px, -2px);
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: translate(-2px, 1px);
    filter: hue-rotate(90deg);
  }
  60% { 
    transform: translate(2px, -1px);
    filter: hue-rotate(180deg);
  }
  70% { 
    transform: translate(-1px, -2px);
    filter: hue-rotate(270deg);
  }
  80% { 
    transform: translate(1px, 2px);
    filter: hue-rotate(0deg);
  }
  90% { 
    transform: translate(-2px, -1px);
    filter: hue-rotate(90deg);
  }
`;

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseBackground = keyframes`
  0%, 100% { 
    background: radial-gradient(circle at center, 
      rgba(26, 0, 0, 0.8) 0%, 
      ${props => props.theme?.colors?.black || '#000000'} 70%
    ); 
  }
  50% { 
    background: radial-gradient(circle at center, 
      rgba(42, 0, 0, 0.8) 0%, 
      rgba(16, 0, 0, 0.9) 70%
    ); 
  }
`;

const neonFlicker = keyframes`
  0%, 100% {
    text-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor,
      0 0 20px currentColor;
  }
  50% {
    text-shadow: 
      0 0 2px currentColor,
      0 0 5px currentColor,
      0 0 8px currentColor,
      0 0 12px currentColor;
  }
`;

// Styled components
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, 
    rgba(26, 0, 0, 0.8) 0%, 
    ${props => props.theme.colors.black} 70%
  );
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: ${pulseBackground} 3s infinite;
`;

const LoadingLogo = styled.div`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: ${props => props.theme.fontWeights.black};
  color: ${props => props.theme.colors.darkRed};
  text-shadow: 
    0 0 10px ${props => props.theme.colors.neonBlue},
    0 0 20px ${props => props.theme.colors.neonBlue},
    0 0 30px ${props => props.theme.colors.neonBlue},
    2px 2px 4px rgba(0,0,0,0.8);
  animation: ${glitchAnimation} 2s infinite;
  margin-bottom: ${props => props.theme.spacing[8]};
  text-align: center;
  line-height: 1.2;
  user-select: none;
`;

const LoadingSubtitle = styled.div`
  font-family: ${props => props.theme.fonts.primary};
  font-size: clamp(0.8rem, 2.5vw, 1.2rem);
  color: ${props => props.theme.colors.textSecondary};
  text-shadow: 0 0 5px ${props => props.theme.colors.neonBlue};
  margin-bottom: ${props => props.theme.spacing[8]};
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: ${neonFlicker} 3s infinite;
  text-align: center;
`;

const SpinnerContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing[4]};
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 3px solid ${props => props.theme.colors.dirtyGray};
  border-top: 3px solid ${props => props.theme.colors.neonBlue};
  border-radius: 50%;
  animation: ${spinAnimation} 1.2s linear infinite;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30px;
    height: 30px;
    border: 2px solid ${props => props.theme.colors.darkRed};
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: ${spinAnimation} 1.8s linear infinite reverse;
  }
`;

const LoadingText = styled(motion.div)`
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textMuted};
  text-align: center;
  margin-top: ${props => props.theme.spacing[4]};
  letter-spacing: 1px;
`;

const LoadingDots = styled.span`
  &::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    80%, 100% { content: '...'; }
  }
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(0, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing[4]};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent,
      ${props => props.theme.colors.neonBlue},
      transparent
    );
    animation: loading-progress 2s ease-in-out infinite;
  }
  
  @keyframes loading-progress {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const CriminalQuotes = [
  "Загружаем тёмные архивы...",
  "Подключаемся к подпольной сети...",
  "Расшифровываем секретные треки...",
  "Проникаем в криминальную базу...",
  "Активируем чёрный рынок музыки...",
  "Синхронизируемся с уличной сетью..."
];

const LoadingScreen = ({ message, progress }) => {
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % CriminalQuotes.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <LoadingContainer>
      <LoadingLogo>
        CRIMINAL<br />MUSIC
      </LoadingLogo>
      
      <LoadingSubtitle>
        Underground Platform
      </LoadingSubtitle>
      
      <SpinnerContainer>
        <Spinner />
        
        <LoadingText
          key={quoteIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {message || CriminalQuotes[quoteIndex]}
          <LoadingDots />
        </LoadingText>
        
        {progress !== undefined ? (
          <div style={{ width: '200px', marginTop: '16px' }}>
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #8B0000, #00FFFF)',
                  borderRadius: '2px'
                }}
              />
            </div>
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '12px',
              color: '#2F2F2F'
            }}>
              {progress}%
            </div>
          </div>
        ) : (
          <ProgressBar />
        )}
      </SpinnerContainer>
    </LoadingContainer>
  );
};

export default LoadingScreen;

