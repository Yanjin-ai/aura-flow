import Layout from "./Layout.jsx";

import DayView from "./DayView";

import Insights from "./Insights";

import Analytics from "./Analytics";

import Settings from "./Settings";

import ReflectionHistory from "./ReflectionHistory";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    DayView: DayView,
    
    Insights: Insights,
    
    Analytics: Analytics,
    
    Settings: Settings,
    
    ReflectionHistory: ReflectionHistory,
    
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
                
                    <Route path="/" element={<DayView />} />
                
                
                <Route path="/DayView" element={<DayView />} />
                
                <Route path="/Insights" element={<Insights />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/ReflectionHistory" element={<ReflectionHistory />} />
                
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