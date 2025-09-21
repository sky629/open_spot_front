const { chromium } = require('playwright');

async function testMapPage() {
  console.log('🚀 Starting Map Page Error Analysis...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    permissions: ['geolocation']
  });

  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  const errors = [];
  const networkFailures = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
      errors.push(text);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`);
    } else if (type === 'log') {
      console.log(`📝 Console Log: ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
    errors.push(`Page Error: ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`🚫 Network Failure: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    networkFailures.push({
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText
    });
  });

  try {
    console.log('1. 📍 Direct navigation to /map page...');
    await page.goto('http://localhost:3000/map', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    console.log('\n2. 🔍 Analyzing page state...');

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if redirected to login
    if (currentUrl.includes('/login')) {
      console.log('✅ Correctly redirected to login page (ProtectedRoute working)');

      // Check for login form elements
      const googleLoginButton = await page.locator('button:has-text("Google")').first();
      const isGoogleButtonVisible = await googleLoginButton.isVisible().catch(() => false);
      console.log(`Google login button visible: ${isGoogleButtonVisible}`);

    } else if (currentUrl.includes('/map')) {
      console.log('⚠️  Stayed on map page - checking authentication state...');

      // Check for map container
      const mapContainer = await page.locator('[id*="map"], [class*="map"], [class*="Map"]').first();
      const isMapVisible = await mapContainer.isVisible().catch(() => false);
      console.log(`Map container visible: ${isMapVisible}`);

      // Check for loading states
      const loadingElements = await page.locator('[class*="loading"], [class*="Loading"]').count();
      console.log(`Loading elements found: ${loadingElements}`);

      // Check for error messages
      const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
      console.log(`Error elements found: ${errorElements}`);

    } else {
      console.log(`❓ Unexpected redirect to: ${currentUrl}`);
    }

    console.log('\n3. 🏗️  Checking React component rendering...');

    // Check for React app root
    const reactRoot = await page.locator('#root').isVisible().catch(() => false);
    console.log(`React root rendered: ${reactRoot}`);

    // Check for any React error boundaries
    const errorBoundary = await page.locator('[class*="error-boundary"], [class*="ErrorBoundary"]').count();
    console.log(`Error boundary elements: ${errorBoundary}`);

    // Check for specific component elements
    const protectedRoute = await page.locator('[data-testid*="protected"], [class*="protected"]').count();
    console.log(`Protected route elements: ${protectedRoute}`);

    console.log('\n4. 🌐 Checking network requests...');

    // Wait for any pending network requests
    await page.waitForTimeout(2000);

    // Check for API calls
    const apiCalls = networkFailures.filter(req => req.url.includes('/api/'));
    if (apiCalls.length > 0) {
      console.log('API call failures:');
      apiCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url}: ${call.error}`);
      });
    } else {
      console.log('No API call failures detected');
    }

    console.log('\n5. 🗺️  Checking Naver Maps integration...');

    // Check for Naver Maps script loading
    const naverMapsScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script =>
        script.src && (script.src.includes('naver') || script.src.includes('map'))
      );
    });
    console.log(`Naver Maps script loaded: ${naverMapsScript}`);

    // Check for global naver object
    const naverGlobal = await page.evaluate(() => typeof window.naver !== 'undefined');
    console.log(`Global naver object available: ${naverGlobal}`);

    console.log('\n6. 📊 Authentication state analysis...');

    // Check localStorage for auth tokens
    const authState = await page.evaluate(() => {
      try {
        const authStore = localStorage.getItem('auth-store');
        return authStore ? JSON.parse(authStore) : null;
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('Auth store state:', JSON.stringify(authState, null, 2));

    // Check cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(cookie =>
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('jwt')
    );
    console.log(`Auth-related cookies: ${authCookies.length}`);

    console.log('\n7. 📸 Taking screenshot for visual analysis...');
    await page.screenshot({
      path: '/Users/kang/Documents/dev/toy/open_spot_front/map-page-error-analysis.png',
      fullPage: true
    });

    console.log('\n8. 🔍 Testing authenticated access...');

    // Try to manually set authentication (if we're on login page)
    if (currentUrl.includes('/login')) {
      console.log('Attempting to bypass authentication for testing...');

      // Set mock auth state
      await page.evaluate(() => {
        const mockAuthState = {
          state: {
            isAuthenticated: true,
            user: { email: 'test@example.com', name: 'Test User' },
            accessToken: 'mock-token'
          },
          version: 0
        };
        localStorage.setItem('auth-store', JSON.stringify(mockAuthState));
      });

      // Navigate to map again
      await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const newUrl = page.url();
      console.log(`After mock auth, current URL: ${newUrl}`);

      if (newUrl.includes('/map')) {
        console.log('✅ Successfully accessed map page with mock auth');

        // Check for map rendering issues
        const mapContainerAfterAuth = await page.locator('[id*="map"], [class*="map"]').first();
        const isMapVisibleAfterAuth = await mapContainerAfterAuth.isVisible().catch(() => false);
        console.log(`Map container visible after auth: ${isMapVisibleAfterAuth}`);

        // Take another screenshot
        await page.screenshot({
          path: '/Users/kang/Documents/dev/toy/open_spot_front/map-page-with-mock-auth.png',
          fullPage: true
        });
      }
    }

  } catch (error) {
    console.log(`❌ Test execution error: ${error.message}`);
    errors.push(`Test execution error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 ERROR ANALYSIS SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n🔴 Total Errors Found: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log(`\n🚫 Network Failures: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    networkFailures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.method} ${failure.url} - ${failure.error}`);
    });
  }

  console.log(`\n📝 Console Messages Summary:`);
  const messagesByType = consoleMessages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(messagesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} messages`);
  });

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      networkFailures: networkFailures.length,
      consoleMessages: messagesByType
    },
    errors,
    networkFailures,
    consoleMessages,
    authState: authState || null
  };

  require('fs').writeFileSync(
    '/Users/kang/Documents/dev/toy/open_spot_front/map-page-error-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Analysis complete! Check map-page-error-report.json for detailed results.');

  await browser.close();
}

testMapPage().catch(console.error);