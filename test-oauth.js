// Quick OAuth URL test
require('dotenv').config();

console.log('🔍 OAuth Configuration Test');
console.log('============================');
console.log('');

console.log('Environment Variables:');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '***HIDDEN***' : 'MISSING');
console.log('GITHUB_CALLBACK_URL:', process.env.GITHUB_CALLBACK_URL);
console.log('SERVER_URL:', process.env.SERVER_URL);
console.log('');

// Generate OAuth URL
const clientId = process.env.GITHUB_CLIENT_ID;
const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${process.env.SERVER_URL}/api/auth/github/callback`;

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: callbackUrl,
  scope: 'read:user user:email repo',
  state: 'test-state-123'
});

const oauthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

console.log('Generated OAuth URL:');
console.log(oauthUrl);
console.log('');

console.log('🎯 What to check on GitHub:');
console.log('1. Go to: https://github.com/settings/developers');
console.log('2. Find your "Git Profile Analytics" app');
console.log('3. Make sure Authorization callback URL is EXACTLY:');
console.log('   ' + callbackUrl);
console.log('');
console.log('📝 Note: Using 127.0.0.1 instead of localhost');
console.log('   This follows GitHub OAuth RFC recommendations');
console.log('');

console.log('🧪 Test this URL:');
console.log('Copy the OAuth URL above and paste it in your browser');
console.log('It should redirect to GitHub login, not show 404');
