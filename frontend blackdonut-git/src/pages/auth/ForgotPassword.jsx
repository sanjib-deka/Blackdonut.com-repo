import React, { useState } from 'react';
import '../../styles/auth-shared.css';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/CustomAlert';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('user'); // 'user' or 'foodpartner'
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = userType === 'user'
                ? API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_USER
                : API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_FOODPARTNER;

            const response = await axios.post(
                `${API_CONFIG.BASE_URL}${endpoint}`,
                { email },
                { withCredentials: true }
            );

            setAlert({
                type: 'success',
                message: response.data.message
            });

            setEmailSent(true);
            setTimeout(() => {
                navigate('/user/login');
            }, 3000);

        } catch (error) {
            setLoading(false);
            const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
            setAlert({
                type: 'error',
                message: errorMessage
            });
        }
    };

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

            <div className="auth-card" role="region" aria-labelledby="forgot-password-title">
                <header>
                    <h1 id="forgot-password-title" className="auth-title">
                        {emailSent ? 'Check Your Email' : 'Forgot Password'}
                    </h1>
                    <p className="auth-subtitle">
                        {emailSent
                            ? 'We sent a password reset link to your email. Check your inbox.'
                            : 'Enter your email address and we\'ll send you a link to reset your password.'}
                    </p>
                </header>

                {!emailSent ? (
                    <>
                        {/* Toggle Button */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    background: '#e8e8e8',
                                    borderRadius: '12px',
                                    padding: '6px',
                                    gap: '6px',
                                    border: '1px solid #d0d0d0'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setUserType('user')}
                                    style={{
                                        padding: '10px 24px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: userType === 'user' ? '#2a2a2a' : 'transparent',
                                        color: userType === 'user' ? '#fff' : '#666',
                                        cursor: 'pointer',
                                        fontWeight: userType === 'user' ? 600 : 500,
                                        transition: 'all 0.3s ease',
                                        fontSize: '13px',
                                        boxShadow: userType === 'user' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('foodpartner')}
                                    style={{
                                        padding: '10px 24px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: userType === 'foodpartner' ? '#2a2a2a' : 'transparent',
                                        color: userType === 'foodpartner' ? '#fff' : '#666',
                                        cursor: 'pointer',
                                        fontWeight: userType === 'foodpartner' ? 600 : 500,
                                        transition: 'all 0.3s ease',
                                        fontSize: '13px',
                                        boxShadow: userType === 'foodpartner' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    Food Partner
                                </button>
                            </div>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            <div className="field-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="auth-submit" type="submit" disabled={loading || !email}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <button
                            onClick={() => {
                                setEmailSent(false);
                                setEmail('');
                            }}
                            style={{
                                padding: '10px 20px',
                                background: '#2a2a2a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <div className="auth-alt-action">
                    Remember your password? <a href="/user/login">Back to login</a>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
