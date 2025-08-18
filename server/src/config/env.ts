import dotenv from 'dotenv'
import path from 'path'

// Load environment variables IMMEDIATELY when this module is imported
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET', 
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GEMINI_API_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars)
  console.error('📝 Please check your .env file in the project root')
  process.exit(1)
}

console.log('✅ Environment variables loaded successfully')
console.log('🔑 GitHub Client ID:', process.env.GITHUB_CLIENT_ID?.substring(0, 10) + '...')
console.log('🤖 Gemini API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...')

export default process.env
