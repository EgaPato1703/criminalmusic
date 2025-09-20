import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { tracksAPI, moodsAPI } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

// Components
import TrackCard from '../components/Music/TrackCard';
import MoodSelector from '../components/Music/MoodSelector';
import LoadingScreen from '../components/UI/LoadingScreen';

// Styled components
const HomeContainer = styled.div`
  padding: ${props => props.theme.spacing[4]};
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled(motion.div)`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[8]};
  padding: ${props => props.theme.spacing[6]};
  background: ${props => props.theme.components.card.bg};
  border: ${props => props.theme.components.card.border};
  border-radius: ${props => props.theme.components.card.borderRadius};
  backdrop-filter: ${props => props.theme.components.card.backdropFilter};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(0, 255, 255, 0.05), 
      transparent
    );
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const WelcomeTitle = styled.h1`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing[3]};
  text-shadow: 0 0 10px ${props => props.theme.colors.neonBlue};
`;

const WelcomeText = styled.p`
  font-family: ${props => props.theme.fonts.primary};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.md};
  line-height: 1.6;
`;

const Section = styled(motion.section)`
  margin-bottom: ${props => props.theme.spacing[8]};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const SectionTitle = styled.h2`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: ${props => props.theme.fontSizes['2xl']};
  color: ${props => props.theme.colors.textPrimary};
  margin: 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg, 
      ${props => props.theme.colors.darkRed}, 
      ${props => props.theme.colors.neonBlue}
    );
  }
`;

const ViewAllButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.neonBlue};
  border: 1px solid ${props => props.theme.colors.neonBlue};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.radii.md};
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  
  &:hover {
    background: rgba(0, 255, 255, 0.1);
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
`;

const TracksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing[4]};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing[4]};
  margin-bottom: ${props => props.theme.spacing[8]};
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme.components.card.bg};
  border: ${props => props.theme.components.card.border};
  border-radius: ${props => props.theme.components.card.borderRadius};
  padding: ${props => props.theme.spacing[4]};
  text-align: center;
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
  }
`;

const StatValue = styled.div`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: ${props => props.theme.fontSizes['3xl']};
  font-weight: ${props => props.theme.fontWeights.bold};
  color: ${props => props.theme.colors.neonBlue};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-family: ${props => props.theme.fonts.primary};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing[8]};
  color: ${props => props.theme.colors.textMuted};
  
  h3 {
    font-family: ${props => props.theme.fonts.secondary};
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: ${props => props.theme.spacing[3]};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing[4]};
  }
`;

const HomePage = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { hapticFeedback } = useTelegram();
  
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalArtists: 0,
    onlineUsers: 0
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    setStats(prev => ({ ...prev, onlineUsers }));
  }, [onlineUsers]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load trending tracks
      const trendingResponse = await tracksAPI.getTrending({ limit: 6 });
      if (trendingResponse.success) {
        setTrendingTracks(trendingResponse.data.tracks);
      }
      
      // Load recent tracks
      const recentResponse = await tracksAPI.getTracks({ 
        sort: 'recent', 
        limit: 6 
      });
      if (recentResponse.success) {
        setRecentTracks(recentResponse.data.tracks);
      }
      
      // Load available moods
      const moodsResponse = await moodsAPI.getMoods();
      if (moodsResponse.success) {
        setMoods(moodsResponse.data.moods);
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalTracks: recentResponse.data?.pagination?.total || 0,
        totalArtists: Math.floor((recentResponse.data?.pagination?.total || 0) / 3) // Rough estimate
      }));
      
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (moodId) => {
    hapticFeedback('selection');
    // Navigate to mood radio page
    window.location.href = `/radio/${moodId}`;
  };

  const handleViewAll = (section) => {
    hapticFeedback('light');
    
    switch (section) {
      case 'trending':
        window.location.href = '/search?sort=trending';
        break;
      case 'recent':
        window.location.href = '/search?sort=recent';
        break;
      default:
        window.location.href = '/search';
    }
  };

  if (loading) {
    return <LoadingScreen message="Загружаем главную страницу..." />;
  }

  return (
    <HomeContainer>
      {/* Welcome Section */}
      <WelcomeSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <WelcomeTitle>
          Добро пожаловать, {user?.displayName}!
        </WelcomeTitle>
        <WelcomeText>
          Исследуй тёмные переулки музыки в Criminal Music. 
          {user?.role === 'artist' 
            ? ' Создавай свои шедевры и завоёвывай улицы звуком.'
            : ' Открывай новых артистов подполья и собирай коллекции.'
          }
        </WelcomeText>
      </WelcomeSection>

      {/* Stats Section */}
      <StatsSection>
        <StatCard
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatValue>{stats.totalTracks}</StatValue>
          <StatLabel>Треков в архиве</StatLabel>
        </StatCard>
        
        <StatCard
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatValue>{stats.totalArtists}</StatValue>
          <StatLabel>Артистов андеграунда</StatLabel>
        </StatCard>
        
        <StatCard
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StatValue>{stats.onlineUsers}</StatValue>
          <StatLabel>Онлайн сейчас</StatLabel>
        </StatCard>
      </StatsSection>

      {/* Mood Selector */}
      {moods.length > 0 && (
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SectionHeader>
            <SectionTitle>Радио по настроению</SectionTitle>
          </SectionHeader>
          <MoodSelector 
            moods={moods} 
            onMoodSelect={handleMoodSelect}
          />
        </Section>
      )}

      {/* Trending Tracks */}
      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <SectionHeader>
          <SectionTitle>В тренде</SectionTitle>
          <ViewAllButton onClick={() => handleViewAll('trending')}>
            Смотреть все
          </ViewAllButton>
        </SectionHeader>
        
        {trendingTracks.length > 0 ? (
          <TracksGrid>
            {trendingTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <TrackCard track={track} />
              </motion.div>
            ))}
          </TracksGrid>
        ) : (
          <EmptyState>
            <h3>Пока нет трендовых треков</h3>
            <p>Будьте первыми, кто зажжёт улицы музыкой!</p>
          </EmptyState>
        )}
      </Section>

      {/* Recent Tracks */}
      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <SectionHeader>
          <SectionTitle>Последние релизы</SectionTitle>
          <ViewAllButton onClick={() => handleViewAll('recent')}>
            Смотреть все
          </ViewAllButton>
        </SectionHeader>
        
        {recentTracks.length > 0 ? (
          <TracksGrid>
            {recentTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <TrackCard track={track} />
              </motion.div>
            ))}
          </TracksGrid>
        ) : (
          <EmptyState>
            <h3>Нет новых треков</h3>
            <p>Скоро здесь появятся свежие релизы из подполья</p>
          </EmptyState>
        )}
      </Section>
    </HomeContainer>
  );
};

export default HomePage;
