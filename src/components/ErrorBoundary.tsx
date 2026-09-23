import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import Header from "./Header";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReloading: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReloading: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isReloading: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Log to error reporting service in production
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Reset state first
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReloading: false,
    });
    // Navigate to home using window.location for a clean reset
    try {
      window.location.href = "/";
    } catch (err) {
      // Fallback if navigation fails
      window.location.replace("/");
    }
  };

  handleReload = () => {
    // Set loading state
    this.setState({ isReloading: true });
    
    // Use a small delay to show loading state, then reload
    setTimeout(() => {
      try {
        // Clear any cached state
        if (window.localStorage) {
          // Optionally clear specific cache items if needed
          // localStorage.clear();
        }
        // Force a hard reload
        window.location.reload();
      } catch (err) {
        // If reload fails, try replace
        window.location.replace(window.location.href);
      }
    }, 300);
  };

  handleGoBack = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReloading: false,
    });
    // Go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
              <Card className="border-destructive/50 shadow-lg">
                <CardHeader className="text-center p-6 sm:p-8">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
                      <AlertTriangle className="relative h-16 w-16 sm:h-20 sm:w-20 text-destructive" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">
                    Oops! Algo deu errado
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-muted-foreground">
                    Ocorreu um erro inesperado na aplicação. Não se preocupe, seus dados estão seguros.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
                  {process.env.NODE_ENV === "development" && this.state.error && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs sm:text-sm font-mono text-destructive break-all mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <details className="mt-3">
                          <summary className="text-xs sm:text-sm cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            Detalhes técnicos do erro
                          </summary>
                          <pre className="mt-2 text-[10px] sm:text-xs overflow-auto max-h-48 p-3 bg-background rounded border border-border">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      O que você gostaria de fazer?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={this.handleReset}
                        variant="default"
                        className="gap-2 flex-1"
                        disabled={this.state.isReloading}
                      >
                        <Home className="h-4 w-4" />
                        Voltar para Home
                      </Button>
                      <Button
                        onClick={this.handleGoBack}
                        variant="outline"
                        className="gap-2 flex-1"
                        disabled={this.state.isReloading}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Página Anterior
                      </Button>
                      <Button
                        onClick={this.handleReload}
                        variant="outline"
                        className="gap-2 flex-1"
                        disabled={this.state.isReloading}
                      >
                        {this.state.isReloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Recarregando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Recarregar Página
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {this.state.isReloading && (
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Recarregando a página...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

