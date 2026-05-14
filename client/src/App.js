import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import api from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import FactChecks from './pages/FactChecks';
import Sources from './pages/Sources';
import Categories from './pages/Categories';
import Trending from './pages/Trending';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import AIClaimAnalyzer from './pages/AIClaimAnalyzer';
import AISentiment from './pages/AISentiment';
import AISourceChecker from './pages/AISourceChecker';
import AIPatternDetector from './pages/AIPatternDetector';
import AISummaryGenerator from './pages/AISummaryGenerator';
import AIAutoCategorize from './pages/AIAutoCategorize';
import AITrendPrediction from './pages/AITrendPrediction';
import AISourceTrace from './pages/AISourceTrace';
import AIPersonalizedDebunk from './pages/AIPersonalizedDebunk';
import AIIntegrations from './pages/AIIntegrations';
import AIRealtimeMonitor from './pages/AIRealtimeMonitor';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfViralMisinformationEarlyWarning from './pages/CfViralMisinformationEarlyWarning';
import CfMisinformationSourceTracing from './pages/CfMisinformationSourceTracing';
import CfPredictiveClaimVerification from './pages/CfPredictiveClaimVerification';
import CfDebunkingPersonalization from './pages/CfDebunkingPersonalization';
import CfFactCheckSeoOptimization from './pages/CfFactCheckSeoOptimization';
import GapTrendingCategoriesLackAiEndpointsForTrendPredictionA from './pages/GapTrendingCategoriesLackAiEndpointsForTrendPredictionA';
import GapSourcesLacksAiCredibilityScoringEndpoint from './pages/GapSourcesLacksAiCredibilityScoringEndpoint';
import GapLimitedSocialPlatformIntegrationNoTwitterFacebookTikt from './pages/GapLimitedSocialPlatformIntegrationNoTwitterFacebookTikt';
import GapNoRealTimeSpreadMonitoringEngine from './pages/GapNoRealTimeSpreadMonitoringEngine';
import GapLimitedFactCheckNetworkIntegrationSnopesFactcheck from './pages/GapLimitedFactCheckNetworkIntegrationSnopesFactcheck';
import GapNoVerdictExplainabilitySurface from './pages/GapNoVerdictExplainabilitySurface';
import GapNoWebhooks from './pages/GapNoWebhooks';
import GapNoNotificationsSystem from './pages/GapNoNotificationsSystem';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { section: 'Overview', items: [
      { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'Fact-Checking', items: [
      { path: '/claims', icon: '📋', label: 'Claims Monitor', badge: null },
      { path: '/factchecks', icon: '✅', label: 'Fact Checks' },
      { path: '/sources', icon: '🔗', label: 'Sources' },
      { path: '/categories', icon: '🏷️', label: 'Categories' },
    ]},
    { section: 'Monitoring', items: [
      { path: '/trending', icon: '📈', label: 'Trending Topics' },
      { path: '/alerts', icon: '🚨', label: 'Alerts' },
    ]},
    { section: 'AI Tools', items: [
      { path: '/ai/claim-analyzer', icon: '🤖', label: 'Claim Analyzer' },
      { path: '/ai/sentiment', icon: '💭', label: 'Sentiment Analysis' },
      { path: '/ai/source-checker', icon: '🔍', label: 'Source Checker' },
      { path: '/ai/pattern-detector', icon: '🧩', label: 'Pattern Detector' },
      { path: '/ai/summary-generator', icon: '📝', label: 'Summary Generator' },
      { path: '/ai/auto-categorize', icon: '🏷️', label: 'Auto-Categorize' },
      { path: '/ai/trend-prediction', icon: '📈', label: 'Trend Prediction' },
      { path: '/ai/source-trace', icon: '🕸️', label: 'Source Tracing' },
      { path: '/ai/personalized-debunk', icon: '🎯', label: 'Personalized Debunk' },
      { path: '/ai/realtime-monitor', icon: '📡', label: 'Real-Time Monitor' },
      { path: '/ai/integrations', icon: '🔌', label: 'Integrations' },
    ]},
    { section: 'Organization', items: [
      { path: '/team', icon: '👥', label: 'Team' },
      { path: '/reports', icon: '📑', label: 'Reports' },
    ]},
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>FactCheck AI</h1>
        <p>Combat Misinformation Platform</p>
      </div>
      <div className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <div
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <div className="name">{user.name || 'User'}</div>
            <div className="role">{user.role || 'Fact Checker'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><AppLayout><Claims /></AppLayout></ProtectedRoute>} />
        <Route path="/factchecks" element={<ProtectedRoute><AppLayout><FactChecks /></AppLayout></ProtectedRoute>} />
        <Route path="/sources" element={<ProtectedRoute><AppLayout><Sources /></AppLayout></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><AppLayout><Categories /></AppLayout></ProtectedRoute>} />
        <Route path="/trending" element={<ProtectedRoute><AppLayout><Trending /></AppLayout></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><AppLayout><Team /></AppLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AppLayout><Alerts /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/claim-analyzer" element={<ProtectedRoute><AppLayout><AIClaimAnalyzer /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/sentiment" element={<ProtectedRoute><AppLayout><AISentiment /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/source-checker" element={<ProtectedRoute><AppLayout><AISourceChecker /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/pattern-detector" element={<ProtectedRoute><AppLayout><AIPatternDetector /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/summary-generator" element={<ProtectedRoute><AppLayout><AISummaryGenerator /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/auto-categorize" element={<ProtectedRoute><AppLayout><AIAutoCategorize /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/trend-prediction" element={<ProtectedRoute><AppLayout><AITrendPrediction /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/source-trace" element={<ProtectedRoute><AppLayout><AISourceTrace /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/personalized-debunk" element={<ProtectedRoute><AppLayout><AIPersonalizedDebunk /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/realtime-monitor" element={<ProtectedRoute><AppLayout><AIRealtimeMonitor /></AppLayout></ProtectedRoute>} />
        <Route path="/ai/integrations" element={<ProtectedRoute><AppLayout><AIIntegrations /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/viral-misinformation-early-warning" element={<CfViralMisinformationEarlyWarning />} />
        <Route path="/cf/misinformation-source-tracing" element={<CfMisinformationSourceTracing />} />
        <Route path="/cf/predictive-claim-verification" element={<CfPredictiveClaimVerification />} />
        <Route path="/cf/debunking-personalization" element={<CfDebunkingPersonalization />} />
        <Route path="/cf/fact-check-seo-optimization" element={<CfFactCheckSeoOptimization />} />
        <Route path="/gap/trending-categories-lack-ai-endpoints-for-trend-prediction-a" element={<GapTrendingCategoriesLackAiEndpointsForTrendPredictionA />} />
        <Route path="/gap/sources-lacks-ai-credibility-scoring-endpoint" element={<GapSourcesLacksAiCredibilityScoringEndpoint />} />
        <Route path="/gap/limited-social-platform-integration-no-twitter-facebook-tikt" element={<GapLimitedSocialPlatformIntegrationNoTwitterFacebookTikt />} />
        <Route path="/gap/no-real-time-spread-monitoring-engine" element={<GapNoRealTimeSpreadMonitoringEngine />} />
        <Route path="/gap/limited-fact-check-network-integration-snopes-factcheck" element={<GapLimitedFactCheckNetworkIntegrationSnopesFactcheck />} />
        <Route path="/gap/no-verdict-explainability-surface" element={<GapNoVerdictExplainabilitySurface />} />
        <Route path="/gap/no-webhooks" element={<GapNoWebhooks />} />
        <Route path="/gap/no-notifications-system" element={<GapNoNotificationsSystem />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
