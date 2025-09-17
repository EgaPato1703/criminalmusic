import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: ${props => props.theme.components.card.bg};
  border: ${props => props.theme.components.card.border};
  border-radius: ${props => props.theme.components.card.borderRadius};
  padding: ${props => props.theme.spacing[4]};
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const TrackCard = ({ track }) => {
  return (
    <Card>
      <h3>{track?.title || 'Название трека'}</h3>
      <p>{track?.artistName || 'Неизвестный артист'}</p>
    </Card>
  );
};

export default TrackCard;
