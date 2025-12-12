import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../../utils/apiConfig';
import '../../styles/create-food.css';
import { useNavigate } from 'react-router-dom';

const CreateFood = () => {
    const [ name, setName ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ videoFile, setVideoFile ] = useState(null);
    const [ videoURL, setVideoURL ] = useState('');
    const [ fileError, setFileError ] = useState('');
    const [ videoWarning, setVideoWarning ] = useState('');
    const [ step, setStep ] = useState(1); // 1: Upload, 2: Details, 3: Complete
    const [ uploading, setUploading ] = useState(false);
    const [ uploadProgress, setUploadProgress ] = useState(0);
    const [ profileData, setProfileData ] = useState(null);
    const [ successNotification, setSuccessNotification ] = useState(false);
    const [ showWarningModal, setShowWarningModal ] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    // Fetch profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD_PARTNER.GET_ME}`, {
                    withCredentials: true,
                });
                setProfileData(response.data.foodPartner);
            } catch (error) {
                // console.error('Error fetching profile:', error);
                if (error.response?.status === 401) {
                    navigate('/food-partner/login', { replace: true });
                }
            }
        };
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (!videoFile) {
            setVideoURL('');
            return;
        }
        const url = URL.createObjectURL(videoFile);
        setVideoURL(url);
        return () => URL.revokeObjectURL(url);
    }, [ videoFile ]);

    const onFileChange = (e) => {
        const file = e.target.files && e.target.files[ 0 ];
        if (!file) { setVideoFile(null); setFileError(''); setVideoWarning(''); return; }
        if (!file.type.startsWith('video/')) { setFileError('Please select a valid video file.'); setVideoWarning(''); return; }
        
        const fileSizeInMB = file.size / 1024 / 1024;
        
        // Check if file exceeds 40MB hard limit
        if (fileSizeInMB > 40) {
            setFileError('Video size exceeds 40MB limit. Please select a smaller file.');
            setVideoWarning('');
            setVideoFile(null);
            return;
        }
        
        // Check if file exceeds 25MB and show warning
        if (fileSizeInMB > 25) {
            setVideoWarning('Large video file detected. It may take longer to load for users during scrolling.');
        } else {
            setVideoWarning('');
        }
        
        setFileError('');
        setVideoFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[ 0 ];
        if (!file) { return; }
        if (!file.type.startsWith('video/')) { setFileError('Please drop a valid video file.'); setVideoWarning(''); return; }
        
        const fileSizeInMB = file.size / 1024 / 1024;
        
        // Check if file exceeds 40MB hard limit
        if (fileSizeInMB > 40) {
            setFileError('Video size exceeds 40MB limit. Please select a smaller file.');
            setVideoWarning('');
            return;
        }
        
        // Check if file exceeds 25MB and show warning
        if (fileSizeInMB > 25) {
            setVideoWarning('Large video file detected. It may take longer to load for users during scrolling.');
        } else {
            setVideoWarning('');
        }
        
        setFileError('');
        setVideoFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const openFileDialog = () => fileInputRef.current?.click();

    const handleUploadClick = () => {
        if (!videoFile) {
            setFileError('Please select a video first');
            return;
        }
        setStep(2);
        setFileError('');
    };

    const handleSubmitDetails = async (e) => {
        e?.preventDefault?.();

        if (!name.trim()) {
            setShowWarningModal(true);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append("video", videoFile);

        setUploading(true);
        setUploadProgress(0);

        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.CREATE}`, formData, {
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            })

            // console.log(response.data);
            setUploading(false);
            setStep(3);
            setSuccessNotification(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate("/food-partner/profile");
            }, 2000);
        } catch (error) {
            setUploading(false);
            // Handle authentication errors
            if (error.response && error.response.status === 401) {
                navigate('/food-partner/login', { replace: true });
            } else {
                // console.error('Upload error:', error);
                setFileError('Failed to upload video. Please try again.');
                setStep(2);
            }
        }
    };

    const isDisabled = useMemo(() => !name.trim() || !videoFile, [ name, videoFile ]);

    return (
        <div className="create-food-page">
            {/* Warning Modal */}
            {showWarningModal && (
                <div className="cf-modal-overlay">
                    <div className="cf-modal">
                        <div className="cf-modal-icon">⚠️</div>
                        <h2 className="cf-modal-title">Missing Food Name</h2>
                        <p className="cf-modal-message">Please fill in the food name before posting your video.</p>
                        <div className="cf-modal-actions">
                            <button
                                type="button"
                                className="cf-modal-btn cf-modal-btn-primary"
                                onClick={() => setShowWarningModal(false)}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification */}
            {successNotification && (
                <div className="success-notification">
                    <div className="notification-content">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <div className="notification-text">
                            <h3>Video Uploaded Successfully!</h3>
                            <p>Your video has been posted to <strong>{profileData?.name || 'your profile'}</strong></p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 1: Video Upload */}
            {step === 1 && (
                <div className="cf-main-container">
                    <div className="cf-upload-section">
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <img
                                src="/bottombardonot.png"
                                alt="Black Donut Logo"
                                style={{
                                    height: '60px',
                                    width: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div className="cf-upload-header">
                            <h1 className="cf-title">Create Food Post</h1>
                            <p className="cf-subtitle">Upload your first video</p>
                        </div>

                        <input
                            id="foodVideo"
                            ref={fileInputRef}
                            className="file-input-hidden"
                            type="file"
                            accept="video/*"
                            onChange={onFileChange}
                        />

                        <div
                            className="cf-dropzone"
                            role="button"
                            tabIndex={0}
                            onClick={openFileDialog}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFileDialog(); } }}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                        >
                            <div className="cf-dropzone-content">
                                <svg className="cf-upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2v20M2 12h20" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <h2 className="cf-dropzone-title">Click to upload or drag & drop</h2>
                                <p className="cf-dropzone-hint">MP4, WebM, MOV • Up to 40MB</p>
                            </div>
                        </div>

                        {fileError && <div className="cf-error-message">{fileError}</div>}

                        {videoWarning && <div className="cf-warning-message">{videoWarning}</div>}

                        {videoFile && (
                            <div className="cf-selected-file">
                                <div className="cf-file-info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                                        <path d="M9 12.75v-1.5c0-.62.67-1 1.2-.68l4.24 2.45c.53.3.53 1.05 0 1.35L10.2 16.82c-.53.31-1.2-.06-1.2-.68v-1.5" />
                                    </svg>
                                    <div className="cf-file-details">
                                        <p className="cf-file-name">{videoFile.name}</p>
                                        <p className="cf-file-size">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="cf-remove-btn"
                                    onClick={() => { setVideoFile(null); setFileError(''); setVideoWarning(''); fileInputRef.current.value = ''; }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {videoFile && (
                            <button
                                type="button"
                                className="cf-btn-primary cf-btn-lg"
                                onClick={handleUploadClick}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 2: Details Form */}
            {step === 2 && (
                <div className="cf-main-container">
                    <div className="cf-details-section">
                        {/* Profile Header */}
                        <div className="cf-profile-header">
                            {profileData?.profileImage && (
                                <img src={profileData.profileImage} alt={profileData.name} className="cf-profile-pic" />
                            )}
                            <div className="cf-profile-info">
                                <h2 className="cf-profile-name">{profileData?.name || 'Food Partner'}</h2>
                                <p className="cf-profile-label">Food Partner</p>
                            </div>
                        </div>

                        {/* Small Video Preview on Top Right */}
                        {videoURL && (
                            <div className="cf-preview-side">
                                <video src={videoURL} />
                                <div className="cf-preview-badge">Preview</div>
                            </div>
                        )}

                        {/* Form */}
                        <form className="cf-form" onSubmit={handleSubmitDetails}>
                            <div className="cf-form-group">
                                <label htmlFor="foodName" className="cf-label">Food Name *</label>
                                <input
                                    id="foodName"
                                    type="text"
                                    className="cf-input"
                                    placeholder="e.g., Spicy Paneer Wrap"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={uploading}
                                />
                            </div>

                            <div className="cf-form-group">
                                <label htmlFor="foodDesc" className="cf-label">Description</label>
                                <textarea
                                    id="foodDesc"
                                    className="cf-textarea"
                                    placeholder="Write a short description: ingredients, taste, spice level, etc."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={uploading}
                                    rows={5}
                                />
                            </div>



                            {fileError && <div className="cf-error-message">{fileError}</div>}

                            {uploading && (
                                <div className="cf-progress-section">
                                    <div className="cf-progress-label">
                                        <span>Uploading</span>
                                    </div>
                                    <div className="cf-progress-bar">
                                        <div className="cf-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                </div>
                            )}

                            <div className="cf-form-actions">
                                <button
                                    type="button"
                                    className="cf-btn-secondary"
                                    onClick={() => {
                                        setStep(1);
                                        setName('');
                                        setDescription('');
                                        setFileError('');
                                        setUploadProgress(0);
                                    }}
                                    disabled={uploading}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="cf-btn-primary"
                                    disabled={isDisabled || uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Post Video'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 3: Premium Success Screen */}
            {step === 3 && (
                <div className="cf-main-container cf-premium-success">
                    <div className="cf-success-wrapper">
                        {/* Animated checkmark circle */}
                        <div className="cf-success-circle">
                            <svg className="cf-checkmark-svg" viewBox="0 0 52 52">
                                <circle className="cf-checkmark-circle" cx="26" cy="26" r="25" />
                                <path className="cf-checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>

                        {/* Success message */}
                        <div className="cf-success-content">
                            <h1 className="cf-success-title">Video Posted</h1>
                            <p className="cf-success-subtitle">Your content is now live</p>
                        </div>

                        {/* Details card */}
                        <div className="cf-success-card">
                            <div className="cf-success-detail">
                                <span className="cf-detail-label">Food</span>
                                <span className="cf-detail-value">{name}</span>
                            </div>
                            <div className="cf-success-divider"></div>
                            <div className="cf-success-detail">
                                <span className="cf-detail-label">Partner</span>
                                <span className="cf-detail-value">{profileData?.name || 'Your Profile'}</span>
                            </div>
                        </div>

                        {/* Action text */}
                        <p className="cf-success-note">Redirecting to your profile...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateFood;