import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-box">
            <span className="error-boundary-icon" aria-hidden="true">
              <AlertTriangle size={48} color="var(--warning)" />
            </span>
            <h2 className="error-boundary-title">Algo salio mal</h2>
            <p className="error-boundary-msg">{this.state.error?.message || 'Error inesperado'}</p>
            <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
