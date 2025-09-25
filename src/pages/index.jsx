import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from "@/components/dev/ErrorBoundary.jsx";
import ProtectedRoute, { PublicRoute } from "@/components/ProtectedRoute.jsx";

// 懒加载组件
const Layout = lazy(() => import("./Layout.jsx"));
const DayView = lazy(() => import("./DayView"));
const Insights = lazy(() => import("./Insights"));
const Analytics = lazy(() => import("./Analytics"));
const Settings = lazy(() => import("./Settings"));
const ReflectionHistory = lazy(() => import("./ReflectionHistory"));
const Home = lazy(() => import("./Home.jsx"));
const DebugHome = lazy(() => import("./DebugHome.jsx"));
const FeatureXList = lazy(() => import("./FeatureXList.jsx"));
const AdminPanel = lazy(() => import("./AdminPanel.jsx"));
const MonitoringDashboard = lazy(() => import("./MonitoringDashboard.jsx"));
const DataManagement = lazy(() => import("../components/DataManagement.jsx"));
const ExperimentalFeatures = lazy(() => import("../components/ExperimentalFeatures.jsx"));
const PrivacyPolicy = lazy(() => import("./Legal/Privacy.tsx"));
const TermsOfService = lazy(() => import("./Legal/TOS.tsx"));
const Status = lazy(() => import("./Status.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const Register = lazy(() => import("./Register.jsx"));

// 加载中组件
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    加载中...
  </div>
);

const PAGES = {
    
    Home: Home,
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
        <Suspense fallback={<LoadingSpinner />}>
            <Layout currentPageName={currentPage}>
                <Routes>            
                    {/* 默认首页路由 - 重定向到登录页面 */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* DebugHome 路由 - 放在最前面确保可见 */}
                    <Route path="/debug" element={<DebugHome />} />
                    
                    {/* 认证页面路由 - 只有未登录用户可访问 */}
                    <Route path="/login" element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } />
                    <Route path="/register" element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } />
                    
                    {/* 具体页面路由 - 需要登录才能访问 */}
                    <Route path="/Home" element={
                      <ProtectedRoute>
                        <Layout currentPageName="Home">
                          <Home />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/DayView" element={
                      <ProtectedRoute>
                        <Layout currentPageName="DayView">
                          <DayView />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/Insights" element={
                      <ProtectedRoute>
                        <Layout currentPageName="Insights">
                          <Insights />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/Analytics" element={
                      <ProtectedRoute>
                        <Layout currentPageName="Analytics">
                          <Analytics />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/Settings" element={
                      <ProtectedRoute>
                        <Layout currentPageName="Settings">
                          <Settings />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/ReflectionHistory" element={
                      <ProtectedRoute>
                        <Layout currentPageName="ReflectionHistory">
                          <ReflectionHistory />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/FeatureX" element={
                      <ProtectedRoute>
                        <Layout currentPageName="FeatureX">
                          <FeatureXList />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminPanel />
                      </ProtectedRoute>
                    } />
                    <Route path="/monitoring" element={
                      <ProtectedRoute>
                        <MonitoringDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/data-management" element={
                      <ProtectedRoute>
                        <DataManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/experimental-features" element={
                      <ProtectedRoute>
                        <ExperimentalFeatures />
                      </ProtectedRoute>
                    } />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/tos" element={<TermsOfService />} />
                    <Route path="/status" element={<Status />} />
                    
                    {/* 404 兜底路由 - 显示页面未找到提示 */}
                    <Route path="*" element={<div style={{padding:24}}>404 Not Found</div>} />
                </Routes>
            </Layout>
        </Suspense>
    );
}


export default function Pages() {
    return (
        <Router>
            <ErrorBoundary>
                <PagesContent />
            </ErrorBoundary>
        </Router>
    );
}