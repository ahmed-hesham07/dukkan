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
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
          style={{ background: '#080810' }}
        >
          <div
            className="absolute top-0 start-0 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(247,37,133,0.15) 0%, transparent 70%)' }}
          />
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6 relative z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(247,37,133,0.2), rgba(247,37,133,0.08))',
              border: '1px solid rgba(247,37,133,0.3)',
            }}
          >
            ⚠️
          </div>
          <h1 className="text-2xl font-black text-white mb-2 relative z-10">
            حدث خطأ غير متوقع
          </h1>
          <p className="text-white/40 text-sm mb-6 max-w-xs relative z-10">
            Something went wrong / حدث خطأ في التطبيق
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre
              className="text-xs mb-6 max-w-full overflow-auto text-start p-4 rounded-2xl relative z-10"
              style={{ background: 'rgba(247,37,133,0.1)', border: '1px solid rgba(247,37,133,0.2)', color: '#f72585' }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div className="relative z-10 w-full max-w-xs">
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
