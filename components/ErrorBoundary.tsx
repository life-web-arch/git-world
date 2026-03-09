"use client";
import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("3D Engine Critical Crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', color: '#ff4444', padding: '2rem', fontFamily: 'monospace', zIndex: 99999 }}>
          <h2>CRITICAL ENGINE FAILURE</h2>
          <p style={{ marginTop: '1rem', color: '#fff' }}>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '2rem', padding: '10px 20px', background: '#ff4444', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
