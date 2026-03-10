import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // TODO: Send error to error tracking service (e.g., Sentry, LogRocket)
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <Container maxWidth="md">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            py: 4,
                        }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                maxWidth: 600,
                                width: '100%',
                            }}
                        >
                            <ErrorIcon
                                sx={{
                                    fontSize: 80,
                                    color: 'error.main',
                                    mb: 2,
                                }}
                            />

                            <Typography variant="h4" gutterBottom fontWeight="bold">
                                Oops! Something went wrong
                            </Typography>

                            <Typography variant="body1" color="text.secondary" paragraph>
                                We're sorry for the inconvenience. An unexpected error has occurred.
                            </Typography>

                            {import.meta.env.DEV && this.state.error && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        my: 3,
                                        textAlign: 'left',
                                        bgcolor: 'grey.50',
                                        maxHeight: 300,
                                        overflow: 'auto',
                                    }}
                                >
                                    <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Error:</strong> {this.state.error.toString()}
                                        {'\n\n'}
                                        <strong>Stack:</strong>
                                        {'\n'}
                                        {this.state.errorInfo?.componentStack}
                                    </Typography>
                                </Paper>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={this.handleReset}
                                    size="large"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={this.handleReload}
                                    startIcon={<RefreshIcon />}
                                    size="large"
                                >
                                    Reload Page
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                                If the problem persists, please contact support.
                            </Typography>
                        </Paper>
                    </Box>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
