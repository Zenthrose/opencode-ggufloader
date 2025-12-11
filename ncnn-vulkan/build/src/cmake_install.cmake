# Install script for directory: C:/opencode-1.0.134/ncnn-vulkan/src

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "C:/opencode-1.0.134/ncnn-vulkan/build/install")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "RelWithDebInfo")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "FALSE")
endif()

# Set path to fallback-tool for dependency-resolution.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "C:/msys64/mingw64/bin/objdump.exe")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib" TYPE STATIC_LIBRARY FILES "C:/opencode-1.0.134/ncnn-vulkan/build/src/libncnn.a")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/ncnn" TYPE FILE FILES
    "C:/opencode-1.0.134/ncnn-vulkan/src/allocator.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/benchmark.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/blob.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/c_api.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/command.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/cpu.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/datareader.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/expression.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/gguf.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/gpu.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/layer.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/layer_shader_type.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/layer_type.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/mat.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/modelbin.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/net.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/option.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/paramdict.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/pipeline.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/pipelinecache.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/simpleocv.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/simpleomp.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/simplestl.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/simplemath.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/simplevk.h"
    "C:/opencode-1.0.134/ncnn-vulkan/src/vulkan_header_fix.h"
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/ncnn_export.h"
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/layer_shader_type_enum.h"
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/layer_type_enum.h"
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/platform.h"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  if(EXISTS "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn/ncnn.cmake")
    file(DIFFERENT _cmake_export_file_changed FILES
         "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn/ncnn.cmake"
         "C:/opencode-1.0.134/ncnn-vulkan/build/src/CMakeFiles/Export/790e04ecad7490f293fc4a38f0c73eb1/ncnn.cmake")
    if(_cmake_export_file_changed)
      file(GLOB _cmake_old_config_files "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn/ncnn-*.cmake")
      if(_cmake_old_config_files)
        string(REPLACE ";" ", " _cmake_old_config_files_text "${_cmake_old_config_files}")
        message(STATUS "Old export file \"$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn/ncnn.cmake\" will be replaced.  Removing files [${_cmake_old_config_files_text}].")
        unset(_cmake_old_config_files_text)
        file(REMOVE ${_cmake_old_config_files})
      endif()
      unset(_cmake_old_config_files)
    endif()
    unset(_cmake_export_file_changed)
  endif()
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn" TYPE FILE FILES "C:/opencode-1.0.134/ncnn-vulkan/build/src/CMakeFiles/Export/790e04ecad7490f293fc4a38f0c73eb1/ncnn.cmake")
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ww][Ii][Tt][Hh][Dd][Ee][Bb][Ii][Nn][Ff][Oo])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn" TYPE FILE FILES "C:/opencode-1.0.134/ncnn-vulkan/build/src/CMakeFiles/Export/790e04ecad7490f293fc4a38f0c73eb1/ncnn-relwithdebinfo.cmake")
  endif()
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/ncnn" TYPE FILE FILES
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/ncnnConfig.cmake"
    "C:/opencode-1.0.134/ncnn-vulkan/build/src/ncnnConfigVersion.cmake"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/pkgconfig" TYPE FILE FILES "C:/opencode-1.0.134/ncnn-vulkan/build/src/ncnn.pc")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
if(CMAKE_INSTALL_LOCAL_ONLY)
  file(WRITE "C:/opencode-1.0.134/ncnn-vulkan/build/src/install_local_manifest.txt"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
endif()
