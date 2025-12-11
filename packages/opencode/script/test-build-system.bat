@echo off
echo Testing Build System Compatibility
echo =====================================

echo.
echo 1. Checking Required Tools:

where cmake >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] CMake: Available
    cmake --version
) else (
    echo    [FAIL] CMake: Not found
)

where gcc >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] GCC: Available
    gcc --version | findstr /r "gcc.*[0-9]"
) else (
    echo    [FAIL] GCC: Not found
)

where g++ >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] G++: Available
) else (
    echo    [FAIL] G++: Not found
)

where python >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] Python: Available
    python --version
) else (
    echo    [FAIL] Python: Not found
)

echo.
echo 2. Checking Vulkan Support:

if exist "C:\VulkanSDK\1.3.296.0" (
    echo    [OK] Vulkan SDK found: C:\VulkanSDK\1.3.296.0
) else if exist "C:\VulkanSDK\1.4.328.1" (
    echo    [OK] Vulkan SDK found: C:\VulkanSDK\1.4.328.1
) else if exist "C:\Program Files\VulkanSDK\1.3.296.0" (
    echo    [OK] Vulkan SDK found: C:\Program Files\VulkanSDK\1.3.296.0
) else if exist "C:\Program Files\VulkanSDK\1.4.328.1" (
    echo    [OK] Vulkan SDK found: C:\Program Files\VulkanSDK\1.4.328.1
) else (
    echo    [WARN] Vulkan SDK not found in standard locations
    echo    Note: Will attempt to build without Vulkan or use system installation
)

echo.
echo 3. Checking ncnn-vulkan Source:

if exist "..\..\ncnn-vulkan\CMakeLists.txt" (
    echo    [OK] ncnn-vulkan source found
    echo    [OK] CMakeLists.txt found
) else (
    echo    [FAIL] ncnn-vulkan source not found
)

echo.
echo 4. Checking Node.js Binding:

if exist "src\ncnn-binding\binding.gyp" (
    echo    [OK] Node.js binding source found
    echo    [OK] binding.gyp found
) else (
    echo    [FAIL] Node.js binding source not found
)

echo.
echo 5. Environment Variables:

if defined VULKAN_SDK (
    echo    [OK] VULKAN_SDK: %VULKAN_SDK%
) else (
    echo    [WARN] VULKAN_SDK: Not set
)

if defined VULKAN_RT (
    echo    [OK] VULKAN_RT: %VULKAN_RT%
) else (
    echo    [WARN] VULKAN_RT: Not set
)

if defined MSYSTEM (
    echo    [OK] MSYSTEM: %MSYSTEM%
) else (
    echo    [WARN] MSYSTEM: Not set
)

echo.
echo 6. Platform Information:

echo    Platform: %OS%
echo    Architecture: %PROCESSOR_ARCHITECTURE%

echo.
echo 7. Testing Build Configuration:

if not exist "..\..\ncnn-vulkan\build" (
    mkdir "..\..\ncnn-vulkan\build"
    echo    [OK] Build directory created
) else (
    echo    [OK] Build directory exists
)

echo.
echo Summary:
echo The build system is configured to work with MinGW on Windows.
echo Visual Studio is not required.
echo.
echo Next steps:
echo 1. Run: npm run build:ncnn
echo 2. If successful, run: npm run build:all
echo 3. Test with: node -e "require('./ncnn-binding/')"
echo.
echo [SUCCESS] Build system compatibility test complete!
pause