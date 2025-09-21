#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Test URL
const loginUrl = 'http://localhost:3000/login';

console.log('🧪 Testing Login Page at:', loginUrl);
console.log('==========================================\n');

// Function to make HTTP request and capture response
function testLoginPage() {
  return new Promise((resolve, reject) => {
    const req = http.get(loginUrl, (res) => {
      let data = '';

      console.log('📋 HTTP Response Status:', res.statusCode);
      console.log('📋 HTTP Response Headers:', JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Function to check if server is responsive
function checkServerHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/', (res) => {
      console.log('✅ Server is responsive on port 3000');
      resolve(true);
    });

    req.on('error', (error) => {
      console.log('❌ Server is not responding on port 3000:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Server health check timeout'));
    });
  });
}

// Main test function
async function runTests() {
  try {
    // 1. Check server health
    console.log('1️⃣ Checking server health...');
    await checkServerHealth();
    console.log('');

    // 2. Test login page
    console.log('2️⃣ Testing login page...');
    const response = await testLoginPage();

    console.log('📊 Analysis:');
    console.log('------------');

    if (response.statusCode === 200) {
      console.log('✅ Login page loads successfully (HTTP 200)');

      // Check for common issues in the HTML
      const html = response.body;

      // Check if it's actually HTML
      if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
        console.log('✅ Response is valid HTML');

        // Check for React root element
        if (html.includes('id="root"')) {
          console.log('✅ React root element found');
        } else {
          console.log('⚠️  React root element not found');
        }

        // Check for common script errors in HTML
        if (html.includes('Error:') || html.includes('script error')) {
          console.log('⚠️  Potential script errors found in HTML');
        }

        // Check Content-Type
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          console.log('✅ Correct Content-Type header');
        } else {
          console.log('⚠️  Unexpected Content-Type:', contentType);
        }

      } else {
        console.log('❌ Response is not HTML content');
        console.log('🔍 Response preview:', response.body.substring(0, 200) + '...');
      }

    } else if (response.statusCode === 404) {
      console.log('❌ Login page not found (HTTP 404)');
      console.log('🔍 This suggests routing issues');

    } else if (response.statusCode >= 500) {
      console.log('❌ Server error (HTTP', response.statusCode + ')');
      console.log('🔍 This suggests server-side issues');

    } else {
      console.log('⚠️  Unexpected status code:', response.statusCode);
    }

    console.log('');
    console.log('3️⃣ Manual Testing Recommendations:');
    console.log('----------------------------------');
    console.log('• Open browser and navigate to: ' + loginUrl);
    console.log('• Open Developer Tools (F12)');
    console.log('• Check Console tab for JavaScript errors');
    console.log('• Check Network tab for failed requests');
    console.log('• Look for authentication service initialization errors');
    console.log('• Verify environment variables are loaded correctly');

  } catch (error) {
    console.log('❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Possible causes:');
      console.log('   • Development server is not running');
      console.log('   • Server is running on a different port');
      console.log('   • Firewall blocking the connection');
      console.log('');
      console.log('💡 Try running: yarn dev');
    }
  }
}

// Run the tests
runTests().catch(console.error);