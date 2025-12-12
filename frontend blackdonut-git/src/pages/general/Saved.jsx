import React, { useEffect, useState } from 'react'
import '../../styles/reels.css'
import '../../styles/logo-responsive.css'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import ReelFeed from '../../components/ReelFeed'

const Saved = () => {
    const [ videos, setVideos ] = useState([])

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.GET_SAVES}`, { withCredentials: true })
            .then(response => {
                const savedFoods = response.data.savedFoods
                    .filter((item) => item.food !== null) // Filter out deleted items
                    .map((item) => ({
                        _id: item.food._id,
                        name: item.food.name,
                        video: item.food.video,
                        description: item.food.description,
                        likeCount: item.food.likeCount,
                        savesCount: item.food.savesCount,
                        commentsCount: item.food.commentsCount,
                        foodPartner: item.food.foodPartner,
                        isSaved: true,
                    }))
                setVideos(savedFoods)
            })
    }, [])

    const removeSaved = async (item) => {
        try {
            await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.SAVE}`, { foodId: item._id }, { withCredentials: true })
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: Math.max(0, (v.savesCount ?? 1) - 1) } : v))
        } catch {
            // noop
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
            {/* Top-left Brand Name */}
            <div
                style={{
                    position: 'fixed',
                    top: '30px',
                    left: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 10
                }}
                className="desktop-logo"
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

            <ReelFeed
                items={videos}
                onSave={removeSaved}
                emptyMessage="No saved videos yet."
            />
            
            {/* Copyright Footer - Desktop Only */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    fontSize: '0.75rem',
                    color: '#666',
                    zIndex: 5
                }}
                className="desktop-only"
            >
                {String.fromCharCode(...[169, 32, 50, 48, 50, 53, 32, 83, 97, 110, 106, 105, 98, 32, 75, 117, 109, 97, 114, 32, 68, 101, 107, 97, 32, 8212, 32, 65, 108, 108, 32, 82, 105, 103, 104, 116, 115, 32, 82, 101, 115, 101, 114, 118, 101, 100])}
            </div>
        </div>
    )
}

export default Saved