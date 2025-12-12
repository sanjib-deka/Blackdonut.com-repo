import React, { useState, useEffect } from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomAlert from '../../components/CustomAlert';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [resetSuccess, setResetSuccess] = useState(false);

    // Extract from URL query params
    const token = searchParams.get('token');
    const userId = searchParams.get('id');
    const userType = searchParams.get('type'); // 'user' or 'foodpartner'

    useEffect(() => {
        if (!token || !userId || !userType) {
            setAlert({
                type: 'error',
                message: 'Invalid reset link. Please request a new one.'
            });
            setTimeout(() => navigate('/user/login'), 2000);
        }
    }, [token, userId, userType, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAlert({
                type: 'error',
                message: 'Passwords do not match'
            });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setAlert({
                type: 'error',
                message: 'Password must be at least 6 characters'
            });
            setLoading(false);
            return;
        }

        try {
            const endpoint = userType === 'user'
                ? API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_USER
                : API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_FOODPARTNER;

            const body = userType === 'user'
                ? {
                    token,
                    userId,
                    newPassword: passwordData.newPassword
                }
                : {
                    token,
                    foodPartnerId: userId,
                    newPassword: passwordData.newPassword
                };

            const response = await axios.post(
                `${API_CONFIG.BASE_URL}${endpoint}`,
                body,
                { withCredentials: true }
            );

            setAlert({
                type: 'success',
                message: 'Password reset successfully!'
            });

            setResetSuccess(true);
            setTimeout(() => {
                navigate('/user/login');
            }, 2000);

        } catch (error) {
            setLoading(false);
            const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
            setAlert({
                type: 'error',
                message: errorMessage
            });
        }
    };

    if (!token || !userId || !userType) {
        return null;
    }

    return (
        <div className="auth-page-wrapper">
            {/* Top-left Brand Name */}
            <div
                style={{
                    position: 'fixed',
                    top: '30px',
                    left: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 5
                }}
            >
                <img
                    src="/bottombardonot.png"
                    alt="Black Donut Logo"
                    style={{
                        height: '50px',
                        width: 'auto',
                        objectFit: 'contain'
                    }}
                />
                <div
                    style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        letterSpacing: '1px',
                        color: '#c0bfb8',
                        textTransform: 'uppercase'
                    }}
                >
                    Black Donut
                </div>
            </div>

            {alert && (
                <CustomAlert
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="auth-card" role="region" aria-labelledby="reset-password-title">
                <header>
                    <h1 id="reset-password-title" className="auth-title">
                        {resetSuccess ? 'Password Reset' : 'Create New Password'}
                    </h1>
                    <p className="auth-subtitle">
                        {resetSuccess
                            ? 'Your password has been reset successfully. Redirecting to login...'
                            : 'Enter your new password below.'}
                    </p>
                </header>

                {!resetSuccess && (
                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="field-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                value={passwordData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                value={passwordData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-alt-action">
                    <a href="/user/login">Back to login</a>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
