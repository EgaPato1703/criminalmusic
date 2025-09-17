import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#00FFFF',
          background: '#000000'
        }}>
          <h1>Что-то пошло не так</h1>
          <p>Произошла ошибка в приложении</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
