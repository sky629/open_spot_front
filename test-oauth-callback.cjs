const { chromium } = require('playwright');

async function testOAuthCallback() {
  console.log('🧪 Testing OAuth Callback Flow');
  console.log('==========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Console 로그 수집
    const consoleLogs = [];
    page.on('console', msg => {
      const timestamp = new Date().toISOString();
      consoleLogs.push({
        timestamp,
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });

      // 실시간으로 중요한 로그 출력
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`   [${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    // 네트워크 요청/응답 수집
    const networkEvents = [];
    page.on('request', request => {
      networkEvents.push({
        type: 'request',
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method()
      });
    });

    page.on('response', response => {
      networkEvents.push({
        type: 'response',
        timestamp: new Date().toISOString(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });

      // 실시간으로 실패한 요청 출력
      if (response.status() >= 400) {
        console.log(`   ❌ Failed request: ${response.method()} ${response.url()} - ${response.status()}`);
      }
    });

    // 시뮬레이션된 OAuth 콜백 URL 생성
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const mockUser = {
      id: '123456789',
      name: 'Test User',
      email: 'test@example.com',
      profileImage: 'https://example.com/avatar.jpg'
    };

    const callbackUrl = `http://localhost:3000/auth/login/success?token=${encodeURIComponent(mockToken)}&user=${encodeURIComponent(JSON.stringify(mockUser))}`;

    console.log('1️⃣ Navigating to OAuth callback URL...');
    console.log(`   URL: ${callbackUrl.substring(0, 100)}...`);

    await page.goto(callbackUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('2️⃣ Taking screenshot of callback page...');
    await page.screenshot({ path: 'oauth-callback-page.png' });

    console.log('3️⃣ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('4️⃣ Checking current URL...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('/map')) {
      console.log('   ✅ Successfully redirected to map page');
      await page.screenshot({ path: 'map-page-after-login.png' });
    } else if (currentUrl.includes('/login')) {
      console.log('   ⚠️ Redirected back to login page - possible authentication failure');
    } else {
      console.log('   ⚠️ Unexpected URL after OAuth callback');
    }

    console.log('5️⃣ Checking page content...');

    // 성공/에러 메시지 확인
    const successIndicators = await page.locator('text=/로그인.*완료/i, text=/성공/i, .success').all();
    const errorIndicators = await page.locator('text=/오류/i, text=/실패/i, text=/error/i, .error').all();

    if (successIndicators.length > 0) {
      console.log('   ✅ Success indicators found on page');
      for (const indicator of successIndicators) {
        const text = await indicator.textContent();
        console.log(`      Success: ${text}`);
      }
    }

    if (errorIndicators.length > 0) {
      console.log('   ❌ Error indicators found on page');
      for (const indicator of errorIndicators) {
        const text = await indicator.textContent();
        console.log(`      Error: ${text}`);
      }
    }

    console.log('\n6️⃣ Analyzing console logs...');
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');
    const authLogs = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('auth') ||
      log.text.toLowerCase().includes('token') ||
      log.text.toLowerCase().includes('user')
    );

    console.log(`   Total logs: ${consoleLogs.length}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Auth-related logs: ${authLogs.length}`);

    if (errors.length > 0) {
      console.log('\n   ❌ Console Errors:');
      errors.forEach((error, index) => {
        console.log(`      ${index + 1}. [${error.timestamp}] ${error.text}`);
      });
    }

    if (authLogs.length > 0) {
      console.log('\n   🔐 Auth-related logs:');
      authLogs.forEach((log, index) => {
        console.log(`      ${index + 1}. [${log.timestamp}] ${log.type}: ${log.text}`);
      });
    }

    console.log('\n7️⃣ Analyzing network activity...');
    const failedRequests = networkEvents.filter(event =>
      event.type === 'response' && event.status >= 400
    );

    console.log(`   Total network events: ${networkEvents.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n   ❌ Failed requests:');
      failedRequests.forEach((request, index) => {
        console.log(`      ${index + 1}. ${request.url} - ${request.status} ${request.statusText}`);
      });
    }

    // 상세 리포트 저장
    const report = {
      timestamp: new Date().toISOString(),
      testUrl: callbackUrl,
      finalUrl: currentUrl,
      consoleLogs,
      networkEvents,
      summary: {
        redirectedToMap: currentUrl.includes('/map'),
        redirectedToLogin: currentUrl.includes('/login'),
        totalLogs: consoleLogs.length,
        errors: errors.length,
        warnings: warnings.length,
        authLogs: authLogs.length,
        totalNetworkEvents: networkEvents.length,
        failedRequests: failedRequests.length
      }
    };

    require('fs').writeFileSync('oauth-callback-report.json', JSON.stringify(report, null, 2));
    console.log('\n📝 Detailed report saved to: oauth-callback-report.json');

    console.log('\n📊 Test Summary:');
    if (currentUrl.includes('/map')) {
      console.log('   ✅ OAuth callback flow completed successfully');
    } else {
      console.log('   ❌ OAuth callback flow failed or incomplete');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n⏸️ Test completed. Browser will stay open for manual inspection.');
    console.log('   Close the browser manually when done.');
    // await browser.close(); // 수동으로 닫을 수 있도록 주석 처리
  }
}

testOAuthCallback().catch(console.error);