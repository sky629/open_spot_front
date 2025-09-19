import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { MapPage } from './pages/MapPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TokenHandler } from './components/TokenHandler';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import './App.css';

// 개발 도구 초기화 (개발 모드에서만)
if (import.meta.env.DEV) {
  import('./utils/devTools');
  import('./utils/performance');
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* 모든 페이지에서 토큰 처리 */}
            <TokenHandler />

            <Routes>
              {/* 로그인 페이지 (공개 경로) */}
              <Route path="/login" element={<LoginPage />} />

              {/* OAuth 성공 콜백 페이지 (공개 경로) */}
              <Route path="/auth/login/success" element={<AuthCallbackPage />} />

              {/* 지도 페이지 (보호된 경로) */}
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />

              {/* 기본 경로: 토큰 있으면 지도, 없으면 로그인 */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 처리: 로그인 페이지로 리다이렉트 */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;