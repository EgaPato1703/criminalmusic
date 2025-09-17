import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Global styles with criminal theme */
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html {
    scroll-behavior: smooth;
    height: 100%;
  }
  
  body {
    font-family: ${props => props.theme.fonts.primary};
    background: linear-gradient(135deg, 
      ${props => props.theme.colors.black} 0%, 
      ${props => props.theme.colors.secondaryBg} 50%, 
      ${props => props.theme.colors.black} 100%
    );
    color: ${props => props.theme.colors.textPrimary};
    line-height: ${props => props.theme.lineHeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    min-height: 100vh;
    position: relative;
    
    /* Background pattern for criminal feel */
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 25% 25%, ${props => props.theme.colors.darkRed}22 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, ${props => props.theme.colors.neonBlue}11 0%, transparent 50%);
      opacity: 0.1;
      z-index: -1;
      pointer-events: none;
    }
  }
  
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.secondary};
    font-weight: ${props => props.theme.fontWeights.bold};
    line-height: ${props => props.theme.lineHeights.tight};
    margin-bottom: ${props => props.theme.spacing[4]};
  }
  
  h1 {
    font-size: ${props => props.theme.fontSizes['4xl']};
    text-shadow: 0 0 10px ${props => props.theme.colors.neonBlue};
  }
  
  h2 {
    font-size: ${props => props.theme.fontSizes['3xl']};
  }
  
  h3 {
    font-size: ${props => props.theme.fontSizes['2xl']};
  }
  
  h4 {
    font-size: ${props => props.theme.fontSizes.xl};
  }
  
  h5 {
    font-size: ${props => props.theme.fontSizes.lg};
  }
  
  h6 {
    font-size: ${props => props.theme.fontSizes.md};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing[4]};
    color: ${props => props.theme.colors.textSecondary};
  }
  
  /* Links */
  a {
    color: ${props => props.theme.colors.neonBlue};
    text-decoration: none;
    transition: ${props => props.theme.transitions.fast};
    
    &:hover {
      color: ${props => props.theme.colors.bloodRed};
      text-shadow: 0 0 5px currentColor;
    }
    
    &:focus {
      outline: 2px solid ${props => props.theme.colors.focus};
      outline-offset: 2px;
    }
  }
  
  /* Buttons */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    transition: ${props => props.theme.transitions.normal};
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:focus {
      outline: 2px solid ${props => props.theme.colors.focus};
      outline-offset: 2px;
    }
  }
  
  /* Form elements */
  input, textarea, select {
    font-family: inherit;
    color: ${props => props.theme.colors.textPrimary};
    background: ${props => props.theme.components.input.bg};
    border: ${props => props.theme.components.input.border};
    border-radius: ${props => props.theme.components.input.borderRadius};
    padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
    transition: ${props => props.theme.transitions.normal};
    
    &::placeholder {
      color: ${props => props.theme.components.input.placeholder};
    }
    
    &:focus {
      border: ${props => props.theme.components.input.focus.border};
      box-shadow: ${props => props.theme.components.input.focus.shadow};
      outline: none;
    }
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.black};
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, 
      ${props => props.theme.colors.darkRed}, 
      ${props => props.theme.colors.neonBlue}
    );
    border-radius: 4px;
    transition: background 0.3s ease;
    
    &:hover {
      background: linear-gradient(45deg, 
        ${props => props.theme.colors.neonBlue}, 
        ${props => props.theme.colors.darkRed}
      );
    }
  }
  
  /* Selection */
  ::selection {
    background: rgba(0, 255, 255, 0.3);
    color: #ffffff;
  }
  
  ::-moz-selection {
    background: rgba(0, 255, 255, 0.3);
    color: #ffffff;
  }
  
  /* Lists */
  ul, ol {
    list-style: none;
  }
  
  /* Images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  
  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .text-gradient {
    background: linear-gradient(45deg, 
      ${props => props.theme.colors.darkRed}, 
      ${props => props.theme.colors.neonBlue}
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .neon-glow {
    text-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor,
      0 0 20px currentColor;
  }
  
  .glass-effect {
    background: ${props => props.theme.colors.glassEffect};
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 255, 255, 0.1);
  }
  
  /* Criminal theme animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes glitch {
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
  }
  
  @keyframes neonFlicker {
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
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  /* Responsive design */
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    body {
      font-size: ${props => props.theme.fontSizes.sm};
    }
    
    h1 {
      font-size: ${props => props.theme.fontSizes['3xl']};
    }
    
    h2 {
      font-size: ${props => props.theme.fontSizes['2xl']};
    }
    
    h3 {
      font-size: ${props => props.theme.fontSizes.xl};
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    body {
      font-size: ${props => props.theme.fontSizes.xs};
    }
    
    h1 {
      font-size: ${props => props.theme.fontSizes['2xl']};
    }
    
    h2 {
      font-size: ${props => props.theme.fontSizes.xl};
    }
    
    h3 {
      font-size: ${props => props.theme.fontSizes.lg};
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    body {
      background: linear-gradient(135deg, 
        ${props => props.theme.colors.black} 0%, 
        ${props => props.theme.colors.secondaryBg} 50%, 
        ${props => props.theme.colors.black} 100%
      );
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    * {
      border-color: ${props => props.theme.colors.neonBlue} !important;
    }
    
    .text-gradient {
      background: none;
      -webkit-background-clip: unset;
      -webkit-text-fill-color: unset;
      color: ${props => props.theme.colors.neonBlue};
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default GlobalStyles;
