import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Vault AI error boundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', padding: 32, textAlign: 'center',
          background: 'var(--bg)', color: 'var(--text-1)'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Something went wrong</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20, maxWidth: 300 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--accent)', color: '#fff', fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
