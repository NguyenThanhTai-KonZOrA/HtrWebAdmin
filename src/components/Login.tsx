import React, { useState, useEffect } from "react";
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardHeader,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { authAdminService as loginApi } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { UserRole } from "../constants/roles";

const Login: React.FC = () => {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, token, role } = useAuth();

    useEffect(() => {
        // Only navigate if we have a valid token and not currently loading/submitting
        if (token && !loading) {
            // Check if there's a "from" location (user was redirected to login)
            const from = (location.state as any)?.from?.pathname;

            if (from && from !== '/login') {
                // If user tried to access a specific page, go there
                navigate(from, { replace: true });
            } else {
                // Otherwise, redirect based on role
                if (role === UserRole.ADMIN) {
                    navigate('/admin-registration', { replace: true });
                } else if (role === UserRole.USER) {
                    navigate('/admin-registration', { replace: true });
                } else if (role === UserRole.MANAGER) {
                    navigate('/admin-registration', { replace: true });
                } else if (role === UserRole.VIEWER) {
                    navigate('/admin-registration', { replace: true });
                } else {
                    // Default fallback if role is not recognized
                    navigate('/admin-registration', { replace: true });
                }
            }
        }
    }, [token, navigate, location.state, loading, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password");
            setLoading(false);
            return;
        }

        try {
            const response = await loginApi.login({ userName: username, password });

            // Only proceed with login if we got a valid response
            if (response && response.token && response.refreshToken && response.tokenExpiration) {
                login(response.userName, response.token, response.refreshToken, response.tokenExpiration);
                // Set loading to false so useEffect can navigate
                setLoading(false);
            } else {
                setError("Invalid response from server");
                setLoading(false);
            }
        } catch (err: any) {
            console.error("Sign in error:", err);

            // Extract meaningful error message
            let errorMessage = "Sign in failed";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data) {
                errorMessage = typeof err.response.data === 'string'
                    ? err.response.data
                    : "Invalid username or password";
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                bgcolor: "linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                minHeight: "100vh",
                minWidth: "100vw",
            }}
        >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
                <Card
                    sx={{
                        borderRadius: 4,
                        boxShadow: 6,
                        px: { xs: 2, sm: 4 },
                        py: 4,
                        bgcolor: "background.paper",
                        width: "100%",
                        maxWidth: 480,
                        transition: 'opacity 0.2s ease-in-out',
                        opacity: loading ? 0.9 : 1,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: 1,
                            color: "primary.main",
                            mt: 1,
                            alignContent: 'center',
                            textAlign: 'center',
                            mb: 2,
                        }}
                    >
                        Registration Management System
                    </Typography>
                    <CardHeader
                        // avatar={
                        //     <Box
                        //         sx={{
                        //             bgcolor: "primary.main",
                        //             width: 56,
                        //             height: 56,
                        //             borderRadius: "50%",
                        //             display: "flex",
                        //             alignItems: "center",
                        //             justifyContent: "center",
                        //             boxShadow: 2,
                        //             mb: 1,
                        //         }}
                        //     >
                        //         <LockOutlinedIcon sx={{ color: "white", fontSize: 32 }} />
                        //     </Box>
                        // }

                        title={
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    letterSpacing: 1,
                                    color: "primary.main",
                                    mt: 1,
                                }}
                            >
                                Sign in
                            </Typography>
                        }
                        subheader={
                            <Typography variant="body1" color="text.secondary">
                                Welcome back! Please Sign in to continue.
                            </Typography>
                        }
                        sx={{ textAlign: "center", pb: 0 }}
                    />
                    <CardContent>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }} noValidate>
                            <TextField
                                required
                                fullWidth
                                margin="normal"
                                label="User Name"
                                value={username}
                                onChange={(e) => {
                                    setUserName(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={loading}
                                autoComplete="username"
                                autoFocus
                                error={!!error && !username.trim()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonOutlineIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        transition: 'all 0.2s ease-in-out',
                                    }
                                }}
                            />
                            <TextField
                                required
                                fullWidth
                                margin="normal"
                                type={showPwd ? "text" : "password"}
                                label="Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={loading}
                                autoComplete="current-password"
                                error={!!error && !password.trim()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPwd((show) => !show)}
                                                edge="end"
                                                size="small"
                                                disabled={loading}
                                            >
                                                {showPwd ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        transition: 'all 0.2s ease-in-out',
                                    }
                                }}
                            />

                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mt: 2,
                                        animation: 'fadeIn 0.3s ease-in-out',
                                        '@keyframes fadeIn': {
                                            from: { opacity: 0, transform: 'translateY(-10px)' },
                                            to: { opacity: 1, transform: 'translateY(0)' },
                                        }
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    letterSpacing: 1,
                                    boxShadow: 3,
                                }}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;
