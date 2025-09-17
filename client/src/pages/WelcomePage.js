import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../hooks/useTelegram';
import toast from 'react-hot-toast';

// Styled components
const WelcomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${props => props.theme.spacing[6]};
  background: radial-gradient(circle at center, 
    rgba(139, 0, 0, 0.1) 0%, 
    ${props => props.theme.colors.black} 70%
  );
  position: relative;
  overflow: hidden;
`;

const BackgroundEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(0, 255, 255, 0.05) 0%, transparent 50%);
  animation: ${props => props.theme.criminal.effects.pulse};
  z-index: -1;
`;

const Logo = styled(motion.h1)`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: ${props => props.theme.fontWeights.black};
  color: ${props => props.theme.colors.darkRed};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[4]};
  text-shadow: 
    0 0 10px ${props => props.theme.colors.neonBlue},
    0 0 20px ${props => props.theme.colors.neonBlue},
    0 0 30px ${props => props.theme.colors.neonBlue};
  line-height: 1.1;
`;

const Subtitle = styled(motion.p)`
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.lg};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[8]};
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const RoleSelectionContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
  width: 100%;
  max-width: 400px;
`;

const RoleCard = styled(motion.button)`
  background: ${props => props.theme.components.card.bg};
  border: 2px solid ${props => props.selected ? props.theme.colors.neonBlue : 'rgba(0, 255, 255, 0.2)'};
  border-radius: ${props => props.theme.components.card.borderRadius};
  padding: ${props => props.theme.spacing[6]};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(0, 255, 255, 0.1), 
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const RoleIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${props => props.theme.spacing[4]};
  text-align: center;
`;

const RoleTitle = styled.h3`
  font-family: ${props => props.theme.fonts.secondary};
  font-size: ${props => props.theme.fontSizes['2xl']};
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing[2]};
  text-align: center;
`;

const RoleDescription = styled.p`
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  line-height: 1.5;
`;

const ArtistForm = styled(motion.div)`
  margin-top: ${props => props.theme.spacing[6]};
  width: 100%;
  max-width: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const Label = styled.label`
  display: block;
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing[2]};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  background: ${props => props.theme.components.input.bg};
  border: ${props => props.theme.components.input.border};
  border-radius: ${props => props.theme.components.input.borderRadius};
  color: ${props => props.theme.colors.textPrimary};
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.md};
  
  &::placeholder {
    color: ${props => props.theme.components.input.placeholder};
  }
  
  &:focus {
    border: ${props => props.theme.components.input.focus.border};
    box-shadow: ${props => props.theme.components.input.focus.shadow};
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  background: ${props => props.theme.components.input.bg};
  border: ${props => props.theme.components.input.border};
  border-radius: ${props => props.theme.components.input.borderRadius};
  color: ${props => props.theme.colors.textPrimary};
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.md};
  resize: vertical;
  
  &::placeholder {
    color: ${props => props.theme.components.input.placeholder};
  }
  
  &:focus {
    border: ${props => props.theme.components.input.focus.border};
    box-shadow: ${props => props.theme.components.input.focus.shadow};
    outline: none;
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[6]};
  background: ${props => props.theme.components.button.primary.bg};
  color: ${props => props.theme.components.button.primary.color};
  border: ${props => props.theme.components.button.primary.border};
  border-radius: ${props => props.theme.radii.lg};
  font-family: ${props => props.theme.fonts.secondary};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fontWeights.bold};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: ${props => props.theme.spacing[6]};
  
  &:hover {
    background: ${props => props.theme.components.button.primary.hover.bg};
    box-shadow: ${props => props.theme.components.button.primary.hover.shadow};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WelcomePage = () => {
  const { loginWithTelegram, setupUserRole } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [artistData, setArtistData] = useState({
    pseudonym: '',
    city: '',
    genre: '',
    description: ''
  });

  const handleRoleSelect = (role) => {
    hapticFeedback('selection');
    setSelectedRole(role);
    
    if (role === 'artist') {
      setShowArtistForm(true);
    } else {
      setShowArtistForm(false);
    }
  };

  const handleArtistDataChange = (field, value) => {
    setArtistData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      hapticFeedback('medium');
      
      if (!selectedRole) {
        toast.error('Выберите свою роль в криминальном мире');
        return;
      }

      // First login with Telegram
      const user = await loginWithTelegram();
      
      // Then setup role
      const roleData = {
        role: selectedRole,
        ...(selectedRole === 'artist' && {
          artistProfile: artistData
        })
      };
      
      await setupUserRole(roleData);
      
      hapticFeedback('success');
      
    } catch (error) {
      console.error('Welcome setup error:', error);
      hapticFeedback('error');
    }
  };

  return (
    <WelcomeContainer>
      <BackgroundEffect />
      
      <Logo
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        CRIMINAL<br />MUSIC
      </Logo>
      
      <Subtitle
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Underground Platform
      </Subtitle>
      
      <RoleSelectionContainer
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <RoleCard
          selected={selectedRole === 'listener'}
          onClick={() => handleRoleSelect('listener')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RoleIcon>🎧</RoleIcon>
          <RoleTitle>Слушатель</RoleTitle>
          <RoleDescription>
            Исследуй тёмные улицы музыки, собирай коллекции и открывай новых артистов подполья
          </RoleDescription>
        </RoleCard>
        
        <RoleCard
          selected={selectedRole === 'artist'}
          onClick={() => handleRoleSelect('artist')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RoleIcon>🎤</RoleIcon>
          <RoleTitle>Артист</RoleTitle>
          <RoleDescription>
            Создавай музыку андеграунда, загружай треки и строй свою криминальную империю звука
          </RoleDescription>
        </RoleCard>
      </RoleSelectionContainer>
      
      {showArtistForm && (
        <ArtistForm
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <FormGroup>
            <Label>Псевдоним *</Label>
            <Input
              type="text"
              placeholder="Твой криминальный псевдоним"
              value={artistData.pseudonym}
              onChange={(e) => handleArtistDataChange('pseudonym', e.target.value)}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Город/Улица</Label>
            <Input
              type="text"
              placeholder="Откуда ты родом?"
              value={artistData.city}
              onChange={(e) => handleArtistDataChange('city', e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Жанр</Label>
            <Input
              type="text"
              placeholder="Твой стиль музыки"
              value={artistData.genre}
              onChange={(e) => handleArtistDataChange('genre', e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Описание стиля</Label>
            <TextArea
              placeholder="Расскажи о своём звуке и стиле..."
              value={artistData.description}
              onChange={(e) => handleArtistDataChange('description', e.target.value)}
            />
          </FormGroup>
        </ArtistForm>
      )}
      
      {selectedRole && (
        <SubmitButton
          onClick={handleSubmit}
          disabled={selectedRole === 'artist' && !artistData.pseudonym}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Войти в Criminal Music
        </SubmitButton>
      )}
    </WelcomeContainer>
  );
};

export default WelcomePage;
