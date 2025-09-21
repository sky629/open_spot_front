const { chromium } = require('playwright');

async function quickMapTest() {
  console.log('🚀 Quick Map Page Test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
    errors.push(error.message);
  });

  try {
    // Go to login page first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded');

    // Set mock auth state
    await page.evaluate(() => {
      const mockAuthState = {
        state: {
          user: {
            id: 'test-123',
            name: 'Test User',
            email: 'test@example.com',
            profileImageUrl: null
          },
          isAuthenticated: true
        },
        version: 0
      };
      localStorage.setItem('auth-store', JSON.stringify(mockAuthState));
    });

    console.log('✅ Mock auth state set');

    // Navigate to map page
    await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle' });
    console.log('✅ Navigated to map page');

    // Wait a bit and check for errors
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/map')) {
      console.log('✅ Successfully stayed on map page');

      // Check if map container is visible
      const mapVisible = await page.locator('#map, [class*="map"], [class*="Map"]').first().isVisible().catch(() => false);
      console.log(`Map container visible: ${mapVisible}`);

      // Take screenshot
      await page.screenshot({
        path: '/Users/kang/Documents/dev/toy/open_spot_front/quick-test-result.png',
        fullPage: true
      });

    } else {
      console.log('❌ Redirected away from map page');
    }

    console.log(`\n📊 Errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Error summary:');
      const errorSummary = {};
      errors.forEach(error => {
        if (error.includes('infinite loop') || error.includes('Maximum update depth')) {
          errorSummary['Infinite Loop'] = (errorSummary['Infinite Loop'] || 0) + 1;
        } else if (error.includes('prop')) {
          errorSummary['Prop Warning'] = (errorSummary['Prop Warning'] || 0) + 1;
        } else {
          errorSummary['Other'] = (errorSummary['Other'] || 0) + 1;
        }
      });
      console.log(errorSummary);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }

  await browser.close();
}

quickMapTest().catch(console.error);