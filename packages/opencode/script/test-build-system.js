#!/usr/bin/env node

/**
 * Test script to verify build system compatibility
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 Testing Build System Compatibility')
console.log('=====================================\n')

// Test 1: Check for required tools
console.log('1. Checking Required Tools:')

const tools = [
  { name: 'CMake', command: 'cmake --version' },
  { name: 'GCC', command: 'gcc --version' },
  { name: 'G++', command: 'g++ --version' },
  { name: 'Python', command: 'python --version' }
]

for (const tool of tools) {
  try {
    const output = execSync(tool.command, { encoding: 'utf8', stdio: 'pipe' })
    console.log(`   [OK] ${tool.name}: Available`)
    if (tool.name === 'GCC') {
      const version = output.split('\n')[0]
      console.log(`      Version: ${version.trim()}`)
    }
  } catch (error) {
    console.log(`   [FAIL] ${tool.name}: Not found`)
  }
}

// Test 2: Check for Vulkan
console.log('\n2. Checking Vulkan Support:')

const vulkanPaths = [
  'C:\\VulkanSDK\\1.3.296.0',
  'C:\\VulkanSDK\\1.4.328.1',
  'C:\\Program Files\\VulkanSDK\\1.3.296.0',
  'C:\\Program Files\\VulkanSDK\\1.4.328.1'
]

let vulkanFound = false
for (const vPath of vulkanPaths) {
  if (fs.existsSync(vPath)) {
    console.log(`   [OK] Vulkan SDK found: ${vPath}`)
    vulkanFound = true
    break
  }
}

if (!vulkanFound) {
  console.log('   [WARN] Vulkan SDK not found in standard locations')
  console.log('   Note: Will attempt to build without Vulkan or use system installation')
}

// Test 3: Check ncnn-vulkan source
console.log('\n3. Checking ncnn-vulkan Source:')

const ncnnPath = path.join(__dirname, '..', 'ncnn-vulkan')
if (fs.existsSync(ncnnPath)) {
  console.log('   [OK] ncnn-vulkan source found')
  
  const cmakePath = path.join(ncnnPath, 'CMakeLists.txt')
  if (fs.existsSync(cmakePath)) {
    console.log('   [OK] CMakeLists.txt found')
  } else {
    console.log('   [FAIL] CMakeLists.txt not found')
  }
} else {
  console.log('   [FAIL] ncnn-vulkan source not found')
}

// Test 4: Check Node.js binding source
console.log('\n4. Checking Node.js Binding:')

const bindingPath = path.join(__dirname, '..', 'src', 'ncnn-binding')
if (fs.existsSync(bindingPath)) {
  console.log('   [OK] Node.js binding source found')
  
  const gypPath = path.join(bindingPath, 'binding.gyp')
  if (fs.existsSync(gypPath)) {
    console.log('   [OK] binding.gyp found')
  } else {
    console.log('   [FAIL] binding.gyp not found')
  }
} else {
  console.log('   ❌ Node.js binding source not found')
}

// Test 5: Environment variables
console.log('\n5. Environment Variables:')

const envVars = [
  'VULKAN_SDK',
  'VULKAN_RT',
  'MSYSTEM',
  'PATH'
]

for (const envVar of envVars) {
  const value = process.env[envVar]
  if (value) {
    if (envVar === 'PATH') {
      console.log(`   [OK] ${envVar}: Set (length: ${value.length} chars)`)
    } else {
      console.log(`   [OK] ${envVar}: ${value}`)
    }
  } else {
    console.log(`   [WARN] ${envVar}: Not set`)
  }
}

// Test 6: Platform detection
console.log('\n6. Platform Information:')

console.log(`   Platform: ${process.platform}`)
console.log(`   Architecture: ${process.arch}`)
console.log(`   Node.js: ${process.version}`)

// Test 7: Build configuration test
console.log('\n7. Testing Build Configuration:')

const buildDir = path.join(ncnnPath, 'build')
if (!fs.existsSync(buildDir)) {
  try {
    fs.mkdirSync(buildDir, { recursive: true })
    console.log('   [OK] Build directory created')
  } catch (error) {
    console.log(`   [FAIL] Failed to create build directory: ${error.message}`)
  }
} else {
  console.log('   [OK] Build directory exists')
}

// Summary
console.log('\n📋 Summary:')
console.log('The build system is configured to work with MinGW on Windows.')
console.log('Visual Studio is not required.')
console.log('\nNext steps:')
console.log('1. Run: npm run build:ncnn')
console.log('2. If successful, run: npm run build:all')
console.log('3. Test with: node -e "require(\'./ncnn-binding\')"')

console.log('\n[SUCCESS] Build system compatibility test complete!')