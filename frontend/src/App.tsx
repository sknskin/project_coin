import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import CoinDetail from './pages/CoinDetail';
import Portfolio from './pages/Portfolio';
import AuthModal from './components/auth/AuthModal';
import SessionWarningModal from './components/session/SessionWarningModal';
import { useUIStore } from './store/uiStore';
import { useSessionManager } from './hooks/useSessionManager';

function App() {
  const { isAuthModalOpen } = useUIStore();
  const { handleExtend, handleDismiss } = useSessionManager();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coin/:marketCode" element={<CoinDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </main>
      {isAuthModalOpen && <AuthModal />}
      <SessionWarningModal onExtend={handleExtend} onDismiss={handleDismiss} />
    </div>
  );
}

export default App;
