import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CoinDetail from './pages/CoinDetail';
import Portfolio from './pages/Portfolio';
import AuthModal from './components/auth/AuthModal';
import SessionWarningModal from './components/session/SessionWarningModal';
import ChatSidebar from './components/chat/ChatSidebar';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { useSessionManager } from './hooks/useSessionManager';
import { useNotificationWebSocket } from './hooks/useNotificationWebSocket';
import { useChatWebSocket } from './hooks/useChatWebSocket';

function App() {
  const { isAuthModalOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { handleExtend, handleDismiss } = useSessionManager();

  // 인증된 사용자만 WebSocket 연결
  useNotificationWebSocket();
  useChatWebSocket();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coins" element={<Dashboard />} />
          <Route path="/coin/:marketCode" element={<CoinDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </main>
      {isAuthenticated && <ChatSidebar />}
      {isAuthModalOpen && <AuthModal />}
      <SessionWarningModal onExtend={handleExtend} onDismiss={handleDismiss} />
    </div>
  );
}

export default App;
