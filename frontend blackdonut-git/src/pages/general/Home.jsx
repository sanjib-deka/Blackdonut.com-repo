import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API_CONFIG from '../../utils/apiConfig'
import '../../styles/reels.css'
import ReelFeed from '../../components/ReelFeed'

const Home = () => {
    const [videos, setVideos] = useState([])
    // Autoplay behavior is handled inside ReelFeed

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.GET_ALL}`, { withCredentials: true })
            .then(response => {
                console.log('✅ Food items fetched:', response.data);
                
                const mappedFoods = response.data.foodItems.map((item) => ({
                    _id: item._id,
                    name: item.name,
                    video: item.video,
                    description: item.description,
                    likeCount: item.likeCount,
                    savesCount: item.savesCount,
                    commentsCount: item.commentCount,
                    foodPartner: item.foodPartner,
                }))
                setVideos(mappedFoods)
            })
            .catch((err) => { 
                console.error("❌ Error fetching food items:", err);
                console.error("❌ Error response:", err.response?.data);
            })
    }, [])

    // Using local refs within ReelFeed; keeping map here for dependency parity if needed

    async function likeVideo(item) {
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.LIKE}`, { foodId: item._id }, {withCredentials: true})

        if(response.data.like){
            // console.log("Video liked");
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, likeCount: v.likeCount + 1 } : v))
        }else{
            // console.log("Video unliked");
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, likeCount: v.likeCount - 1 } : v))
        }
        
    }

    async function saveVideo(item) {
        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FOOD.SAVE}`, { foodId: item._id }, { withCredentials: true })
        
        if(response.data.save){
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: v.savesCount + 1 } : v))
        }else{
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: v.savesCount - 1 } : v))
        }
    }

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={saveVideo}
            emptyMessage="No videos available."
        />
    )
}

export default Home