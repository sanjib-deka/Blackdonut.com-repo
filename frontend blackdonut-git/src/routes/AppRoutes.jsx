import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from '../pages/auth/Register';
import UserLogin from '../pages/auth/UserLogin';
import FoodPartnerLogin from '../pages/auth/FoodPartnerLogin';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Home from '../pages/general/Home';
import CreateFood from '../pages/food-parthner/CreateFood';
import Profile from '../pages/food-parthner/Profile';
import PartnerReelView from '../pages/food-parthner/PartnerReelView';
import Saved from '../pages/general/Saved';
import BottomNav from '../components/BottomNav';
import FoodPartnerProfile from '../pages/food-parthner/foodParthnerProfile';
import FoodPartnerReelfeed from '../pages/food-parthner/foodParthnerReelfeed';
import EditPartner from '../pages/editData/editParthner';
import EditProfilePicture from '../pages/editData/editProfilePicture';
import IntroDekstop from '../pages/intro/introDekstop';

const AppRoutes = () => {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<IntroDekstop/>} />
            <Route path="/user/register" element={<Register/>} />
            <Route path="/user/login" element={<UserLogin/>} />
            <Route path="/forgot-password" element={<ForgotPassword/>} />
            <Route path="/reset-password" element={<ResetPassword/>} />
            <Route path="/food-partner/register" element={<Register/>} />
            <Route path="/food-partner/login" element={<FoodPartnerLogin/>} />
            <Route path="/Welcome/to/blackDonut" element={<IntroDekstop/>} />
            <Route path="/home" element={<><Home/> <BottomNav /></>} />
            <Route path="/create-food" element={<CreateFood/>} />
            <Route path="/food-partner/:id" element={<Profile/>} />
            <Route path="/food-partner/:id/reel/:index" element={<PartnerReelView/>} />
            <Route path="/saved" element={<><Saved /><BottomNav /></>} />
            <Route path="/food-partner/profile" element={<FoodPartnerProfile/>} />
            <Route path="/food-partner/reelfeed/:index" element={<FoodPartnerReelfeed/>} />
            <Route path="/food-partner/reelfeed" element={<FoodPartnerReelfeed/>} />
            <Route path="/food-partner/edit" element={<EditPartner/>} />
            <Route path="/food-partner/edit-picture" element={<EditProfilePicture/>} />
        </Routes>
    </Router>
  )
}

export default AppRoutes
