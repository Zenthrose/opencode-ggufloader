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

# NCNN settings - directly specify paths since find_package doesn't work with cmake-js
set(NCNN_BUILD_DIR "C:/opencode-1.0.134/ncnn-vulkan/build")

include_directories(C:/opencode-1.0.134/ncnn-vulkan/src C:/opencode-1.0.134/ncnn-vulkan/build/src)
link_directories(${NCNN_BUILD_DIR}/src C:/Users/Zenthrose/AppData/Local/node-gyp/Cache/25.2.1/x64 C:/VulkanSDK/1.3.296.0/Lib)

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

add_library(ncnn_binding SHARED 
    src/binding.cc 
    src/llm_engine_wrap.cc 
    src/hardware_wrap.cc
)

include_directories(C:/VulkanSDK/1.3.296.0/Include)
include_directories(C:/VulkanSDK/1.3.296.0/Include/glslang)
include_directories(C:/VulkanSDK/1.3.296.0/Include/SPIRV)
# Keep the conditional logic (lines 48-66) - it's good
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(GLSLANG_LIBS
        C:/VulkanSDK/1.3.296.0/lib/glslangd.lib        #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/SPIRVd.lib          #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/OSDependentd.lib    #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/MachineIndependentd.lib #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/GenericCodeGend.lib #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/SPIRV-Tools-optd.lib #  Correct Vulkan SDK path
    )
else()
    set(GLSLANG_LIBS
        C:/VulkanSDK/1.3.296.0/lib/glslang.lib         #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/SPIRV.lib           #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/OSDependent.lib     #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/MachineIndependent.lib #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/GenericCodeGen.lib  #  Correct Vulkan SDK path
        C:/VulkanSDK/1.3.296.0/lib/SPIRV-Tools-opt.lib #  Correct Vulkan SDK path
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
