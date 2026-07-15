import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  source?: 'frontend-web' | 'frontend-admin';
}

interface State {
  hasError: boolean;
  error?: Error;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    // Send error to backend for file logging
    fetch(`${API_URL}/api/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: this.props.source || 'frontend-web',
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    }).catch(() => {
      // Silently fail — don't crash on error reporting failure
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>!</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#1c1b1b' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#76777b', marginBottom: '24px', fontSize: '14px' }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: '#2d666d',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
