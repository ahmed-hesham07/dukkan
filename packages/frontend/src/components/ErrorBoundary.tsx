import { Component, type ReactNode, type ErrorInfo } from 'react';
import { log } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('React ErrorBoundary caught an error', error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          style={{ background: '#F5F4FF' }}
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}
          >
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" style={{ color: '#DC2626' }}>
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-black mb-2" style={{ color: '#130F2A' }}>
            حدث خطأ غير متوقع
          </h1>
          <p className="text-sm mb-6 max-w-xs font-medium" style={{ color: '#9C94B8' }}>
            Something went wrong — حدث خطأ في التطبيق
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre
              className="text-xs mb-6 max-w-sm w-full overflow-auto text-start p-4 rounded-2xl font-mono"
              style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}
            >
              {this.state.error.message}
            </pre>
          )}

          <div className="w-full max-w-xs">
            <button onClick={this.handleReset} className="btn-primary">
              العودة للرئيسية / Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
