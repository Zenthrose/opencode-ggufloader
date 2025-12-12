cmake_minimum_required(VERSION 3.10)
project(ncnn_binding)

# Force cmake-js to use build subdirectory
if(NOT DEFINED CMAKE_BINARY_DIR OR CMAKE_BINARY_DIR STREQUAL CMAKE_SOURCE_DIR)
    set(CMAKE_BINARY_DIR "${CMAKE_SOURCE_DIR}/build")
endif()

# Detect node-addon-api include path
execute_process(COMMAND node -p "require('node-addon-api').include"
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE NODE_ADDON_API_DIR
  OUTPUT_STRIP_TRAILING_WHITESPACE)

include_directories(${CMAKE_JS_INC})
include_directories(${NODE_ADDON_API_DIR})
include_directories(node_modules/node-addon-api)

# NCNN settings - use relative paths from workspace root
get_filename_component(WORKSPACE_ROOT "${CMAKE_SOURCE_DIR}/../../../../.." ABSOLUTE)
set(NCNN_BUILD_DIR "${WORKSPACE_ROOT}/ncnn-vulkan/build")

include_directories("${WORKSPACE_ROOT}/ncnn-vulkan/src" "${WORKSPACE_ROOT}/ncnn-vulkan/build/src")
# Get Vulkan SDK path from environment or use default
if(DEFINED ENV{VULKAN_SDK})
    set(VULKAN_SDK_DIR "$ENV{VULKAN_SDK}")
else()
    # Try to find Vulkan SDK in common locations
    if(EXISTS "C:/VulkanSDK")
        file(GLOB VULKAN_SDK_VERSIONS "C:/VulkanSDK/*")
        list(SORT VULKAN_SDK_VERSIONS)
        list(REVERSE VULKAN_SDK_VERSIONS)
        if(VULKAN_SDK_VERSIONS)
            list(GET VULKAN_SDK_VERSIONS 0 VULKAN_SDK_DIR)
        else()
            set(VULKAN_SDK_DIR "C:/VulkanSDK/1.3.296.0")
        endif()
    else()
        set(VULKAN_SDK_DIR "C:/VulkanSDK/1.3.296.0")
    endif()
endif()
# Get node-gyp cache directory dynamically
if(DEFINED ENV{USERPROFILE})
    set(NODE_GYP_CACHE "$ENV{USERPROFILE}/AppData/Local/node-gyp/Cache")
elseif(DEFINED ENV{HOME})
    set(NODE_GYP_CACHE "$ENV{HOME}/.node-gyp")
else()
    set(NODE_GYP_CACHE "C:/Users/$ENV{USERNAME}/AppData/Local/node-gyp/Cache")
endif()
link_directories("${NCNN_BUILD_DIR}/src" "${NODE_GYP_CACHE}/25.2.1/x64" "${VULKAN_SDK_DIR}/Lib")

find_package(OpenMP REQUIRED)

# NAPI settings
add_definitions(-DNAPI_DISABLE_CPP_EXCEPTIONS)

if(WIN32)
    add_definitions(-DNOMINMAX)
endif()

# Fix DELAYLOAD issue for MinGW
if(MINGW)
    # Clear problematic DELAYLOAD flag for MinGW
    set(CMAKE_SHARED_LINKER_FLAGS "")
endif()

# Set output properties for Node.js addon
add_library(ncnn_binding SHARED 
    src/binding.cc 
    src/llm_engine_wrap.cc 
    src/hardware_wrap.cc
)

# Set output name to match Node.js expectations (ncnn_binding.node on Windows)
set_target_properties(ncnn_binding PROPERTIES
    PREFIX ""
    SUFFIX ".node"
    OUTPUT_NAME "ncnn_binding"
)

# Ensure output goes to build/Release for cmake-js compatibility
set_target_properties(ncnn_binding PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/Release"
    RUNTIME_OUTPUT_DIRECTORY_DEBUG "${CMAKE_BINARY_DIR}/Debug"
    RUNTIME_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/Release"
)

include_directories("${VULKAN_SDK_DIR}/Include")
# Keep the conditional logic - it's good
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(GLSLANG_LIBS
        "${VULKAN_SDK_DIR}/lib/glslangd.lib"
        "${VULKAN_SDK_DIR}/lib/SPIRVd.lib"
        "${VULKAN_SDK_DIR}/lib/OSDependentd.lib"
        "${VULKAN_SDK_DIR}/lib/MachineIndependentd.lib"
        "${VULKAN_SDK_DIR}/lib/GenericCodeGend.lib"
        "${VULKAN_SDK_DIR}/lib/SPIRV-Tools-optd.lib"
    )
else()
    set(GLSLANG_LIBS
        "${VULKAN_SDK_DIR}/lib/glslang.lib"
        "${VULKAN_SDK_DIR}/lib/SPIRV.lib"
        "${VULKAN_SDK_DIR}/lib/OSDependent.lib"
        "${VULKAN_SDK_DIR}/lib/MachineIndependent.lib"
        "${VULKAN_SDK_DIR}/lib/GenericCodeGen.lib"
        "${VULKAN_SDK_DIR}/lib/SPIRV-Tools-opt.lib"
    )
endif()
# Single target_link_libraries call
target_link_libraries(ncnn_binding 
    ${NCNN_BUILD_DIR}/src/libncnn.a 
    node 
    vulkan-1
    ${GLSLANG_LIBS}     # Use the conditional variable
    OpenMP::OpenMP_CXX
)
