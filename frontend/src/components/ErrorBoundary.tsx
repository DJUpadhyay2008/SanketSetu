import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm my-6">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Something went wrong loading this section
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
          </div>

          <Button
            onClick={this.handleReset}
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="text-xs uppercase tracking-wider font-extrabold"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
