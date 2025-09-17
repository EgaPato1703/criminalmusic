import React from 'react';
import styled from 'styled-components';

const MoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing[4]};
`;

const MoodCard = styled.div`
  background: ${props => props.theme.components.card.bg};
  border: ${props => props.theme.components.card.border};
  border-radius: ${props => props.theme.components.card.borderRadius};
  padding: ${props => props.theme.spacing[4]};
  text-align: center;
  cursor: pointer;
  
  &:hover {
    border-color: ${props => props.theme.colors.neonBlue};
  }
`;

const MoodSelector = ({ moods = [], onMoodSelect }) => {
  return (
    <MoodGrid>
      {moods.map((mood) => (
        <MoodCard key={mood.id} onClick={() => onMoodSelect(mood.id)}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{mood.icon}</div>
          <div>{mood.name}</div>
        </MoodCard>
      ))}
    </MoodGrid>
  );
};

export default MoodSelector;
