const puppeteer = require('puppeteer');

async function checkConsoleErrors() {
  let browser;

  try {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Console messages 수집
    const consoleMessages = [];
    const errors = [];
    const networkErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

      console.log(`📊 [${type.toUpperCase()}] ${text}`);
    });

    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ [PAGE ERROR] ${error.message}`);
    });

    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(`🌐 [NETWORK ERROR] ${response.status()} ${response.url()}`);
      }
    });

    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded, waiting for React to render...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // JavaScript 에러가 있는지 체크
    const jsErrors = await page.evaluate(() => {
      return window.onerror ? 'JS errors detected' : 'No JS errors';
    });

    console.log('\n📋 SUMMARY');
    console.log('='.repeat(50));

    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
    const infoMessages = consoleMessages.filter(msg => ['info', 'log'].includes(msg.type));

    if (errorMessages.length > 0) {
      console.log(`\n❌ CONSOLE ERRORS (${errorMessages.length}):`);
      errorMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
    } else {
      console.log('\n✅ No console errors found!');
    }

    if (warningMessages.length > 0) {
      console.log(`\n⚠️  CONSOLE WARNINGS (${warningMessages.length}):`);
      warningMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n💥 PAGE ERRORS (${errors.length}):`);
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log(`\n🌐 NETWORK ERRORS (${networkErrors.length}):`);
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.status} ${error.url}`);
      });
    }

    if (errorMessages.length === 0 && errors.length === 0 && networkErrors.length === 0) {
      console.log('\n🎉 All checks passed! No errors found.');
    }

    // 스크린샷 찍기
    await page.screenshot({ path: 'login-page-console-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved as: login-page-console-check.png');

    // 잠시 브라우저를 열어놓기
    console.log('\n⏳ Browser will stay open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkConsoleErrors().catch(console.error);