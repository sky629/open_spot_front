// URL 파라미터에서 JWT 토큰 처리하는 컴포넌트
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export const TokenHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleTokenFromUrl = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const accessToken = urlParams.get('access_token');
        const error = urlParams.get('error');

        // 에러 처리
        if (error) {
          logger.error('OAuth login error from backend', { error });
          navigate('/login?error=' + encodeURIComponent(error), { replace: true });
          return;
        }

        // 토큰 처리 (token 또는 access_token 파라미터)
        const jwtToken = token || accessToken;
        if (jwtToken) {
          logger.userAction('JWT token received from backend OAuth', {
            tokenLength: jwtToken.length,
            hasToken: !!token,
            hasAccessToken: !!accessToken
          });

          // 토큰으로부터 사용자 정보 설정
          await setUserFromToken(jwtToken);

          // URL에서 토큰 파라미터 제거하고 지도 페이지로 이동
          navigate('/map', { replace: true });
          return;
        }

        // 토큰이 없으면 로그인 페이지로
        if (location.pathname === '/') {
          navigate('/login', { replace: true });
        }

      } catch (error) {
        logger.error('Failed to handle token from URL', error);
        navigate('/login?error=' + encodeURIComponent('토큰 처리 중 오류가 발생했습니다.'), { replace: true });
      }
    };

    handleTokenFromUrl();
  }, [location.search, navigate, setUserFromToken]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};