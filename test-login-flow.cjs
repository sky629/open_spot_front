const { chromium } = require('playwright');

async function testLoginFlow() {
  console.log('🧪 Testing Complete Login Flow');
  console.log('==========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // 1초 지연으로 천천히 실행
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Console 로그 수집
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // 네트워크 요청 수집
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    // 네트워크 응답 수집
    const networkResponses = [];
    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('2️⃣ Taking screenshot of login page...');
    await page.screenshot({ path: 'login-page.png' });

    console.log('3️⃣ Checking page elements...');

    // 로그인 폼 요소 확인
    const loginForm = await page.locator('text=Google로 로그인').first();
    const isLoginButtonVisible = await loginForm.isVisible();
    console.log(`   Google 로그인 버튼 표시: ${isLoginButtonVisible}`);

    // 에러 메시지 확인
    const errorElements = await page.locator('[role="alert"], .error, .error-message').all();
    if (errorElements.length > 0) {
      console.log('   ⚠️ Error elements found on page');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`      Error: ${text}`);
      }
    }

    console.log('4️⃣ Analyzing console logs...');
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');

    if (errors.length > 0) {
      console.log('   ❌ Console Errors Found:');
      errors.forEach(error => {
        console.log(`      ${error.text}`);
      });
    } else {
      console.log('   ✅ No console errors');
    }

    if (warnings.length > 0) {
      console.log('   ⚠️ Console Warnings:');
      warnings.forEach(warning => {
        console.log(`      ${warning.text}`);
      });
    }

    console.log('5️⃣ Analyzing network requests...');
    const failedRequests = networkResponses.filter(response => response.status >= 400);

    if (failedRequests.length > 0) {
      console.log('   ❌ Failed Network Requests:');
      failedRequests.forEach(request => {
        console.log(`      ${request.method} ${request.url} - ${request.status} ${request.statusText}`);
      });
    } else {
      console.log('   ✅ All network requests successful');
    }

    if (isLoginButtonVisible) {
      console.log('\n6️⃣ Testing Google login button click...');

      // 새 탭이나 리다이렉트를 감지하기 위해 대기
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        page.click('text=Google로 로그인'),
        page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null)
      ]);

      if (newPage) {
        console.log('   ✅ New page/tab opened for OAuth');
        console.log(`   New page URL: ${newPage.url()}`);
        await newPage.screenshot({ path: 'oauth-page.png' });

        // OAuth 페이지에서 콘솔 로그 수집
        const oauthConsoleLogs = [];
        newPage.on('console', msg => {
          oauthConsoleLogs.push({
            type: msg.type(),
            text: msg.text()
          });
        });

        // 잠시 대기 후 콘솔 로그 확인
        await new Promise(resolve => setTimeout(resolve, 3000));

        const oauthErrors = oauthConsoleLogs.filter(log => log.type === 'error');
        if (oauthErrors.length > 0) {
          console.log('   ❌ OAuth page errors:');
          oauthErrors.forEach(error => {
            console.log(`      ${error.text}`);
          });
        }

        await newPage.close();
      } else {
        console.log('   ⚠️ No new page opened - checking current page URL');
        console.log(`   Current URL: ${page.url()}`);

        // 현재 페이지가 OAuth URL로 리다이렉트되었는지 확인
        if (page.url().includes('oauth') || page.url().includes('google') || page.url().includes('auth')) {
          console.log('   ✅ Redirected to OAuth URL');
          await page.screenshot({ path: 'oauth-redirect.png' });
        }
      }
    }

    console.log('\n📊 Test Summary:');
    console.log(`   Total console logs: ${consoleLogs.length}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Network requests: ${networkRequests.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);

    // 상세 로그를 파일로 저장
    const detailedReport = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      networkRequests,
      networkResponses,
      summary: {
        totalLogs: consoleLogs.length,
        errors: errors.length,
        warnings: warnings.length,
        totalRequests: networkRequests.length,
        failedRequests: failedRequests.length
      }
    };

    require('fs').writeFileSync('login-flow-report.json', JSON.stringify(detailedReport, null, 2));
    console.log('\n📝 Detailed report saved to: login-flow-report.json');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n⏸️ Test completed. Browser will stay open for manual inspection.');
    console.log('   Close the browser manually when done.');
    // await browser.close(); // 수동으로 닫을 수 있도록 주석 처리
  }
}

testLoginFlow().catch(console.error);