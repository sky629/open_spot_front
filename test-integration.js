// Simple integration test for the new architecture
// This can be run in the browser console to test the DI container and services

console.log('🧪 Starting integration test...');

// Test 1: Check if all environment variables are loaded correctly
console.log('📋 Environment Configuration:');
console.log('- API_BASE_URL:', __API_BASE_URL__);
console.log('- NAVER_MAP_CLIENT_ID:', __NAVER_MAP_CLIENT_ID__ ? '✅ Set' : '❌ Missing');
console.log('- GOOGLE_CLIENT_ID:', __GOOGLE_CLIENT_ID__ ? '✅ Set' : '❌ Missing');

// Test 2: Test API endpoints configuration
import { API_ENDPOINTS, API_CONFIG } from './src/constants/api.js';

console.log('🔗 API Configuration:');
console.log('- Base URL:', API_CONFIG.BASE_URL);
console.log('- Auth Login Endpoint:', API_ENDPOINTS.AUTH.GOOGLE_LOGIN);
console.log('- Expected URL should be Gateway (port 8080):', API_CONFIG.BASE_URL.includes('8080') ? '✅ Correct' : '❌ Wrong port');

// Test 3: Check if service registration works
console.log('🏭 Testing Service Registration...');

try {
  // Import and test the service registration
  import('./src/setup/serviceRegistration.js').then(({ registerServices, getAuthService }) => {
    registerServices();
    console.log('✅ Services registered successfully');

    const authService = getAuthService();
    console.log('✅ Auth service resolved:', authService);
    console.log('- Has API client:', authService.apiClient ? '✅ Yes' : '❌ No');
    console.log('- Can get user:', typeof authService.getUser === 'function' ? '✅ Yes' : '❌ No');
  });
} catch (error) {
  console.error('❌ Service registration failed:', error);
}

console.log('🧪 Integration test completed. Check above for any failures.');