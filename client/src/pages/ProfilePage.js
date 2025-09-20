import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const ProfileContainer = styled.div`
  padding: ${props => props.theme.spacing[4]};
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const ProfileTitle = styled.h1`
  font-family: ${props => props.theme.fonts.secondary};
  color: ${props => props.theme.colors.textPrimary};
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <ProfileContainer>
      <ProfileTitle>Профиль {user?.displayName}</ProfileTitle>
      <p>Страница профиля в разработке...</p>
    </ProfileContainer>
  );
};

export default ProfilePage;

