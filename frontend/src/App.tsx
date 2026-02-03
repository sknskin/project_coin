import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CoinDetail from './pages/CoinDetail';
import Portfolio from './pages/Portfolio';
import CoinInfo from './pages/CoinInfo';
import MyPage from './pages/MyPage';
import MemberManagement from './pages/admin/MemberManagement';
import MemberDetail from './pages/admin/MemberDetail';
import Statistics from './pages/admin/Statistics';
import AuthModal from './components/auth/AuthModal';
import SessionWarningModal from './components/session/SessionWarningModal';
import ChatSidebar from './components/chat/ChatSidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { useSessionManager } from './hooks/useSessionManager';
import { useNotificationWebSocket } from './hooks/useNotificationWebSocket';
import { useChatWebSocket } from './hooks/useChatWebSocket';
import { useVisitorTracking } from './hooks/useVisitorTracking';

function App() {
  const { isAuthModalOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { handleExtend, handleDismiss } = useSessionManager();

  // 방문자 추적
  useVisitorTracking();

  // 인증된 사용자만 WebSocket 연결
  useNotificationWebSocket();
  useChatWebSocket();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coins" element={<Dashboard />} />
          <Route path="/coin/:marketCode" element={<CoinDetail />} />
          <Route path="/coin-info" element={<CoinInfo />} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/admin/members" element={<AdminRoute><MemberManagement /></AdminRoute>} />
          <Route path="/admin/members/:id" element={<AdminRoute><MemberDetail /></AdminRoute>} />
          <Route path="/admin/statistics" element={<AdminRoute><Statistics /></AdminRoute>} />
        </Routes>
      </main>
      {isAuthenticated && <ChatSidebar />}
      {isAuthModalOpen && <AuthModal />}
      <SessionWarningModal onExtend={handleExtend} onDismiss={handleDismiss} />
    </div>
  );
}

export default App;
