#!/usr/bin/env node

/**
 * Build script for ncnn-vulkan integration
 * This script builds ncnn-vulkan and the Node.js binding
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const NCNN_DIR = path.join(__dirname, '..', '..', '..', 'ncnn-vulkan')
const BUILD_DIR = path.join(NCNN_DIR, 'build')
const BINDING_DIR = path.join(__dirname, '..', 'src', 'ncnn-binding')

function runCommand(command, cwd = process.cwd()) {
  console.log(`Running: ${command}`)
  console.log(`In directory: ${cwd}`)
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, CMAKE_BUILD_TYPE: 'Release' }
    })
  } catch (error) {
    console.error(`Command failed: ${command}`)
    throw error
  }
}

function buildNcnnVulkan() {
  console.log('🔧 Building ncnn-vulkan...')

  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true })
  }

  // Configure with CMake - default args
  let cmakeArgs = [
    '..',
    '-DNCNN_VULKAN=ON',
    '-DNCNN_BUILD_TOOLS=OFF',
    '-DNCNN_BUILD_EXAMPLES=OFF',
    '-DNCNN_BUILD_TESTS=OFF',
    '-DNCNN_BUILD_BENCHMARK=OFF',
    '-DNCNN_RUNTIME_CPU=ON', // Enable runtime CPU dispatch
    '-DNCNN_SIMPLEVK=ON', // Use minimal Vulkan loader
    '-DCMAKE_BUILD_TYPE=RelWithDebInfo'
  ]

  // Check for Vulkan SDK
  const vulkanSDK = process.env.VULKAN_SDK || process.env.VULKAN_RT
  if (!vulkanSDK) {
    console.log('WARNING: Vulkan SDK not found in environment variables')
    console.log('   Looking for system Vulkan installation...')
  } else {
    // Normalize path to use forward slashes for CMake
    const vulkanPath = vulkanSDK.replace(/\\/g, '/')
    console.log(`Found Vulkan SDK: ${vulkanPath}`)

    // Add Vulkan specific flags
    cmakeArgs.push('-DNCNN_SYSTEM_GLSLANG=ON')
    cmakeArgs.push(`-Dglslang_DIR=${vulkanPath}/Lib/cmake/glslang`)
    cmakeArgs.push(`-DGLSLANG_TARGET_DIR=${vulkanPath}/Lib/cmake/glslang`)
    cmakeArgs.push(`-DCMAKE_CXX_FLAGS="-I${vulkanPath}/Include"`) // Backup include path
    cmakeArgs.push(`-DVulkan_INCLUDE_DIR=${vulkanPath}/Include`)
    cmakeArgs.push(`-DVulkan_LIBRARY=${vulkanPath}/Lib/vulkan-1.lib`)
  }

  // Add platform-specific optimizations
  if (process.platform === 'win32') {
    // Check for MinGW vs Visual Studio
    if (process.env.MSYSTEM || fs.existsSync('C:\\MinGW\\bin\\gcc.exe')) {
      cmakeArgs.push('-G', 'Ninja') // Use Ninja
      console.log('Using MinGW compiler')
    } else {
      cmakeArgs.push('-A', 'x64') // Visual Studio x64 architecture
      console.log('Using Visual Studio compiler')
    }
  }

  // Try to find Vulkan automatically
  try {
    runCommand(`cmake ${cmakeArgs.join(' ')}`, BUILD_DIR)
  } catch (error) {
    console.log('ERROR: CMake configuration failed')
    console.log('   Trying without Vulkan...')

    // Fallback: build without Vulkan
    let fallbackArgs = cmakeArgs.filter(arg => arg !== '-DNCNN_VULKAN=ON')
    fallbackArgs.push('-DNCNN_VULKAN=OFF')

    // Fix: cmakeArgs first element might be '..'
    let cmd = 'cmake'
    if (fallbackArgs[0] === '..') {
      cmd += ' ..'
      fallbackArgs.shift()
    }

    runCommand(`${cmd} ${fallbackArgs.join(' ')}`, BUILD_DIR)
    console.log('WARNING: Built without Vulkan support - CPU-only mode')
  }

  // Build
  if (process.platform === 'win32' && (process.env.MSYSTEM || fs.existsSync('C:\\MinGW\\bin\\gcc.exe'))) {
    runCommand(`cmake --build . --config RelWithDebInfo --parallel -j4`, BUILD_DIR)
  } else {
    runCommand(`cmake --build . --config RelWithDebInfo --parallel`, BUILD_DIR)
  }

  // Install the library
  runCommand(`cmake --install . --prefix install`, BUILD_DIR)

  console.log('SUCCESS: ncnn-vulkan built successfully')
}

function buildNodeBinding() {
  console.log('🔧 Building Node.js binding...')

  // Change to binding directory
  process.chdir(BINDING_DIR)

  // Set environment variables for ncnn-vulkan
  const ncnnIncludePath = path.join(NCNN_DIR, 'src')
  const ncnnLibPath = path.join(BUILD_DIR, 'src')

  // Platform-specific library paths
  let libExtension = '.a'
  let libPrefix = 'lib'

  // MinGW uses .a even on Windows, MSVC uses .lib
  if (process.platform === 'win32' && !process.env.MSYSTEM && !fs.existsSync('C:\\MinGW\\bin\\gcc.exe')) {
    // Visual Studio
    libExtension = '.lib'
    libPrefix = ''
  } else if (process.platform === 'darwin') {
    libExtension = '.a'
    libPrefix = 'lib'
  }
  // MinGW on Windows uses .a with lib prefix (default)

  // Check if ncnn library exists
  const ncnnLib = path.join(ncnnLibPath, `${libPrefix}ncnn${libExtension}`)
  if (!fs.existsSync(ncnnLib)) {
    console.log('ERROR: ncnn library not found, attempting to locate...')

    // Try different locations
    const possiblePaths = [
      path.join(BUILD_DIR, 'lib', `${libPrefix}ncnn${libExtension}`),
      path.join(BUILD_DIR, 'Release', `${libPrefix}ncnn${libExtension}`),
      path.join(BUILD_DIR, 'src', 'Release', `${libPrefix}ncnn${libExtension}`)
    ]

    let foundLib = null
    for (const libPath of possiblePaths) {
      if (fs.existsSync(libPath)) {
        foundLib = libPath
        break
      }
    }

    if (!foundLib) {
      throw new Error('ncnn library not found. Make sure ncnn-vulkan is built first.')
    }

    process.env.LIBRARY_PATH = path.dirname(foundLib)
  } else {
    process.env.LIBRARY_PATH = ncnnLibPath
  }

  process.env.C_INCLUDE_PATH = ncnnIncludePath

  // Add additional compiler flags for better compatibility
  let cflags = [
    '-DNOMINMAX', // Windows compatibility
    '-D_CRT_SECURE_NO_WARNINGS', // Windows secure functions
    '-O3', // Maximum optimization
  ]

  // Platform-specific optimizations
  if (process.platform === 'win32') {
    if (process.env.MSYSTEM || fs.existsSync('C:\\MinGW\\bin\\gcc.exe')) {
      // MinGW-specific flags
      cflags.push('-march=native') // Optimize for current CPU
      cflags.push('-static-libgcc') // Static linking for MinGW
      cflags.push('-static-libstdc++') // Static linking for MinGW
      console.log('Using MinGW-specific compiler flags')
    } else {
      // Visual Studio flags
      cflags.push('/arch:AVX2') // Enable AVX2
      console.log('Using Visual Studio compiler flags')
    }
  } else {
    cflags.push('-march=native') // Optimize for current CPU
  }

  process.env.CFLAGS = cflags.join(' ')
  process.env.CXXFLAGS = cflags.join(' ')

  // Build the binding
  try {
    runCommand('npm run build')
  } catch (error) {
    console.log('ERROR: Node.js binding build failed')
    console.log('   Trying with verbose output...')
    runCommand('npm run build -- --verbose')
  }

  // Return to original directory
  process.chdir(path.join(BINDING_DIR, '..'))

  console.log('SUCCESS: Node.js binding built successfully')
}

function main() {
  console.log('🚀 Building ncnn-vulkan integration...')

  try {
    buildNcnnVulkan()
    buildNodeBinding()
    console.log('🎉 All builds completed successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}