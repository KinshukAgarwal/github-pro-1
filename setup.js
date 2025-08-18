#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Setting up GitHub Profile Analytics Platform...\n')

// Check Node.js version
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion)
  process.exit(1)
}

console.log('✅ Node.js version check passed:', nodeVersion)

// Function to run commands
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    process.exit(1)
  }
}

// Function to create directories
function createDirectories() {
  const dirs = [
    'logs',
    'server/logs',
    'client/public',
    'shared'
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  })
}

// Function to copy environment files
function setupEnvironmentFiles() {
  console.log('\n🔧 Setting up environment files...')
  
  const envFiles = [
    { src: 'server/.env.example', dest: 'server/.env' },
    { src: 'client/.env.example', dest: 'client/.env' }
  ]

  envFiles.forEach(({ src, dest }) => {
    if (!fs.existsSync(dest)) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log(`✅ Created ${dest} from ${src}`)
      } else {
        console.warn(`⚠️  ${src} not found, skipping ${dest}`)
      }
    } else {
      console.log(`ℹ️  ${dest} already exists, skipping`)
    }
  })
}

// Function to install dependencies
function installDependencies() {
  // Install root dependencies
  runCommand('npm install', 'Installing root dependencies')
  
  // Install client dependencies
  runCommand('cd client && npm install', 'Installing client dependencies')
  
  // Install server dependencies
  runCommand('cd server && npm install', 'Installing server dependencies')
}

// Function to build TypeScript
function buildTypeScript() {
  runCommand('cd server && npm run build', 'Building server TypeScript')
}

// Function to run tests
function runTests() {
  console.log('\n🧪 Running tests...')
  try {
    execSync('cd server && npm test', { stdio: 'inherit' })
    console.log('✅ Server tests passed')
  } catch (error) {
    console.warn('⚠️  Server tests failed, but continuing setup')
  }

  try {
    execSync('cd client && npm test -- --run', { stdio: 'inherit' })
    console.log('✅ Client tests passed')
  } catch (error) {
    console.warn('⚠️  Client tests failed, but continuing setup')
  }
}

// Function to check for required tools
function checkRequiredTools() {
  console.log('\n🔍 Checking for required tools...')
  
  const tools = [
    { command: 'git --version', name: 'Git' },
    { command: 'docker --version', name: 'Docker (optional)' },
    { command: 'docker-compose --version', name: 'Docker Compose (optional)' }
  ]

  tools.forEach(({ command, name }) => {
    try {
      execSync(command, { stdio: 'pipe' })
      console.log(`✅ ${name} is available`)
    } catch (error) {
      if (name.includes('optional')) {
        console.log(`⚠️  ${name} not found (optional)`)
      } else {
        console.error(`❌ ${name} is required but not found`)
      }
    }
  })
}

// Function to display next steps
function displayNextSteps() {
  console.log('\n🎉 Setup completed successfully!\n')
  
  console.log('📋 Next steps:')
  console.log('1. Set up GitHub OAuth App:')
  console.log('   - Go to GitHub Settings > Developer settings > OAuth Apps')
  console.log('   - Create new OAuth App with:')
  console.log('     * Homepage URL: https://git-viz-lytics.vercel.app')
  console.log('     * Callback URL: https://git-viz-lytics.vercel.app/api/auth/github/callback')
  console.log('   - For local development, also create a separate OAuth app with:')
  console.log('     * Homepage URL: http://localhost:3000')
  console.log('     * Callback URL: http://localhost:5000/api/auth/github/callback')
  console.log('   - Copy Client ID and Secret to your .env files\n')
  
  console.log('2. Configure environment variables:')
  console.log('   - Edit server/.env with your GitHub OAuth credentials')
  console.log('   - Edit client/.env with your GitHub Client ID')
  console.log('   - Add JWT_SECRET and other required variables\n')
  
  console.log('3. Start the development servers:')
  console.log('   npm run dev\n')
  
  console.log('4. Access the application:')
  console.log('   - Production: https://git-viz-lytics.vercel.app')
  console.log('   - Local Frontend: http://localhost:3000')
  console.log('   - Local Backend API: http://localhost:5000')
  console.log('   - Health check: http://localhost:5000/health\n')
  
  console.log('5. Optional - Set up database and Redis:')
  console.log('   - Install PostgreSQL and Redis locally, or')
  console.log('   - Use Docker: docker-compose up -d db redis\n')
  
  console.log('📚 Documentation:')
  console.log('   - Development guide: DEVELOPMENT.md')
  console.log('   - API documentation: Available after starting the server')
  console.log('   - Project README: README.md\n')
  
  console.log('🐛 Troubleshooting:')
  console.log('   - Check logs in the logs/ directory')
  console.log('   - Verify environment variables are set correctly')
  console.log('   - Ensure ports 3000 and 5000 are available\n')
  
  console.log('Happy coding! 🚀')
}

// Main setup function
async function main() {
  try {
    checkRequiredTools()
    createDirectories()
    setupEnvironmentFiles()
    installDependencies()
    buildTypeScript()
    
    // Ask if user wants to run tests
    console.log('\n❓ Would you like to run tests? (This may take a few minutes)')
    console.log('   You can skip this and run tests later with: npm test')
    
    // For automated setup, skip tests by default
    // runTests()
    
    displayNextSteps()
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }
