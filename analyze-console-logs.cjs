const { chromium } = require('playwright');

async function analyzeConsoleLogss() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console message 수집
  const consoleMessages = [];
  const networkRequests = [];
  const errors = [];

  // Console 메시지 캐치
  page.on('console', msg => {
    const msgType = msg.type();
    const text = msg.text();
    consoleMessages.push({
      type: msgType,
      text: text,
      timestamp: new Date().toISOString()
    });

    console.log(`📊 [${msgType.toUpperCase()}] ${text}`);
  });

  // 에러 캐치
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ [PAGE ERROR] ${error.message}`);
  });

  // 네트워크 요청 모니터링
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log(`🌐 [NETWORK ERROR] ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully');

    // 페이지가 완전히 로드될 때까지 기다림
    await page.waitForTimeout(3000);

    // React 컴포넌트가 마운트될 때까지 기다림
    try {
      await page.waitForSelector('[data-testid="login-page"], .login-page, h1', { timeout: 5000 });
      console.log('✅ Login page elements found');
    } catch (e) {
      console.log('⚠️  Login page elements not found, but continuing...');
    }

    // 추가로 잠시 더 기다려서 모든 로그 수집
    await page.waitForTimeout(2000);

    console.log('\n📋 CONSOLE ANALYSIS SUMMARY');
    console.log('='.repeat(50));

    if (consoleMessages.length === 0) {
      console.log('✅ No console messages found');
    } else {
      const errorMsgs = consoleMessages.filter(msg => msg.type === 'error');
      const warnMsgs = consoleMessages.filter(msg => msg.type === 'warning');
      const infoMsgs = consoleMessages.filter(msg => msg.type === 'info' || msg.type === 'log');

      if (errorMsgs.length > 0) {
        console.log(`\n❌ ERRORS (${errorMsgs.length}):`);
        errorMsgs.forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg.text}`);
        });
      }

      if (warnMsgs.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnMsgs.length}):`);
        warnMsgs.forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg.text}`);
        });
      }

      if (infoMsgs.length > 0) {
        console.log(`\n📋 INFO/LOG (${infoMsgs.length}):`);
        infoMsgs.forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg.text}`);
        });
      }
    }

    if (errors.length > 0) {
      console.log(`\n💥 PAGE ERRORS (${errors.length}):`);
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`     Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }

    // 네트워크 요청 중 실패한 것들 체크
    const failedRequests = networkRequests.filter(req =>
      req.url.includes('localhost:8080') ||
      req.url.includes('/api/') ||
      req.url.includes('google')
    );

    if (failedRequests.length > 0) {
      console.log(`\n🌐 RELEVANT NETWORK REQUESTS (${failedRequests.length}):`);
      failedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🏁 Analysis complete. Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

analyzeConsoleLogss().catch(console.error);