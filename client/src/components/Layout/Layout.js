import React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.primaryBg};
`;

const Layout = ({ children }) => {
  return (
    <LayoutContainer>
      {children}
    </LayoutContainer>
  );
};

export default Layout;

