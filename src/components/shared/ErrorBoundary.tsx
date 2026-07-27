import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              The screen failed to load. You can try again — your chats are safe.
            </p>
          </div>
          <Button onClick={this.handleReset} size="sm" variant="outline">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
