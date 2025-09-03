import Layout from "./Layout.jsx";

import Home from "./Home";

import PlanTrip from "./PlanTrip";

import TripDetails from "./TripDetails";

import Trips from "./Trips";

import TripDetailsSample from "./TripDetailsSample";

import UserProfile from "./UserProfile";

import AdminSettings from "./AdminSettings";

import AdminPanel from "./AdminPanel";

import Bloggers from "./Bloggers";

import BloggerProfile from "./BloggerProfile";

import BloggerManagement from "./BloggerManagement";

import BloggerDashboard from "./BloggerDashboard";

import TripEditor from "./TripEditor";

import Checkout from "./Checkout";

import BookingConfirmation from "./BookingConfirmation";

import PlanningChat from "./PlanningChat";

import CreateBloggerTrip from "./CreateBloggerTrip";

import AdminBloggerManager from "./AdminBloggerManager";

import BloggerApplication from "./BloggerApplication";

import BloggerLogin from "./BloggerLogin";

import Documentation from "./Documentation";

import BloggerCreateTrip from "./BloggerCreateTrip";

import PublicBloggerProfile from "./PublicBloggerProfile";

import BloggerTripDetails from "./BloggerTripDetails";

import AdaptBloggerTrip from "./AdaptBloggerTrip";

import AdaptedTripDetails from "./AdaptedTripDetails";

import HomePage from "./HomePage";

import AdminVideoSubmissions from "./AdminVideoSubmissions";

import HotelChangeConfirmation from "./HotelChangeConfirmation";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    PlanTrip: PlanTrip,
    
    TripDetails: TripDetails,
    
    Trips: Trips,
    
    TripDetailsSample: TripDetailsSample,
    
    UserProfile: UserProfile,
    
    AdminSettings: AdminSettings,
    
    AdminPanel: AdminPanel,
    
    Bloggers: Bloggers,
    
    BloggerProfile: BloggerProfile,
    
    BloggerManagement: BloggerManagement,
    
    BloggerDashboard: BloggerDashboard,
    
    TripEditor: TripEditor,
    
    Checkout: Checkout,
    
    BookingConfirmation: BookingConfirmation,
    
    PlanningChat: PlanningChat,
    
    CreateBloggerTrip: CreateBloggerTrip,
    
    AdminBloggerManager: AdminBloggerManager,
    
    BloggerApplication: BloggerApplication,
    
    BloggerLogin: BloggerLogin,
    
    Documentation: Documentation,
    
    BloggerCreateTrip: BloggerCreateTrip,
    
    PublicBloggerProfile: PublicBloggerProfile,
    
    BloggerTripDetails: BloggerTripDetails,
    
    AdaptBloggerTrip: AdaptBloggerTrip,
    
    AdaptedTripDetails: AdaptedTripDetails,
    
    HomePage: HomePage,
    
    AdminVideoSubmissions: AdminVideoSubmissions,
    
    HotelChangeConfirmation: HotelChangeConfirmation,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/PlanTrip" element={<PlanTrip />} />
                
                <Route path="/TripDetails" element={<TripDetails />} />
                
                <Route path="/Trips" element={<Trips />} />
                
                <Route path="/TripDetailsSample" element={<TripDetailsSample />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/Bloggers" element={<Bloggers />} />
                
                <Route path="/BloggerProfile" element={<BloggerProfile />} />
                
                <Route path="/BloggerManagement" element={<BloggerManagement />} />
                
                <Route path="/BloggerDashboard" element={<BloggerDashboard />} />
                
                <Route path="/TripEditor" element={<TripEditor />} />
                
                <Route path="/Checkout" element={<Checkout />} />
                
                <Route path="/BookingConfirmation" element={<BookingConfirmation />} />
                
                <Route path="/PlanningChat" element={<PlanningChat />} />
                
                <Route path="/CreateBloggerTrip" element={<CreateBloggerTrip />} />
                
                <Route path="/AdminBloggerManager" element={<AdminBloggerManager />} />
                
                <Route path="/BloggerApplication" element={<BloggerApplication />} />
                
                <Route path="/BloggerLogin" element={<BloggerLogin />} />
                
                <Route path="/Documentation" element={<Documentation />} />
                
                <Route path="/BloggerCreateTrip" element={<BloggerCreateTrip />} />
                
                <Route path="/PublicBloggerProfile" element={<PublicBloggerProfile />} />
                
                <Route path="/BloggerTripDetails" element={<BloggerTripDetails />} />
                
                <Route path="/AdaptBloggerTrip" element={<AdaptBloggerTrip />} />
                
                <Route path="/AdaptedTripDetails" element={<AdaptedTripDetails />} />
                
                <Route path="/HomePage" element={<HomePage />} />
                
                <Route path="/AdminVideoSubmissions" element={<AdminVideoSubmissions />} />
                
                <Route path="/HotelChangeConfirmation" element={<HotelChangeConfirmation />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}