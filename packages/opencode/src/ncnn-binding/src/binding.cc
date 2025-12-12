#include <napi.h>
#include <windows.h>
#include <iostream>
#include <string>
#include <cstdlib>
#include <glslang/Public/ShaderLang.h>
#include <glslang/Include/ResourceLimits.h>
#include <glslang/SPIRV/GlslangToSpv.h>
#include "llm_engine_wrap.h"
#include "hardware_wrap.h"

static HMODULE glslang_dll = NULL;
static HMODULE spirv_dll = NULL;
using InitializeProcess_t = void (*)();
using FinalizeProcess_t = void (*)();
using TShader_constructor_t = glslang::TShader* (*)(EShLanguage);
using TShader_destructor_t = void (*)(glslang::TShader*);
using TShader_setStringsWithLengths_t = void (*)(glslang::TShader*, const char* const*, const int*, int);
using TShader_setEntryPoint_t = void (*)(glslang::TShader*, const char*);
using TShader_setSourceEntryPoint_t = void (*)(glslang::TShader*, const char*);
// TBuiltInResource is a typedef defined in ResourceLimits.h, not in glslang namespace
using TShader_parse_t = int (*)(glslang::TShader*, const TBuiltInResource*, int, EProfile, bool, bool, EShMessages, glslang::TShader::Includer&);
using TShader_getInfoLog_t = const char* (*)(glslang::TShader*);
using TShader_getInfoDebugLog_t = const char* (*)(glslang::TShader*);
using GlslangToSpv_t = void (*)(const glslang::TIntermediate*, std::vector<unsigned int>&, glslang::SpvOptions*);
using TProgram_constructor_t = glslang::TProgram* (*)();
using TProgram_destructor_t = void (*)(glslang::TProgram*);
static InitializeProcess_t glslang_InitializeProcess = nullptr;
static FinalizeProcess_t glslang_FinalizeProcess = nullptr;
static TShader_constructor_t glslang_TShader_constructor = nullptr;
static TShader_destructor_t glslang_TShader_destructor = nullptr;
static TShader_setStringsWithLengths_t glslang_TShader_setStringsWithLengths = nullptr;
static TShader_setEntryPoint_t glslang_TShader_setEntryPoint = nullptr;
static TShader_setSourceEntryPoint_t glslang_TShader_setSourceEntryPoint = nullptr;
static TShader_parse_t glslang_TShader_parse = nullptr;
static TShader_getInfoLog_t glslang_TShader_getInfoLog = nullptr;
static TShader_getInfoDebugLog_t glslang_TShader_getInfoDebugLog = nullptr;
static GlslangToSpv_t glslang_GlslangToSpv = nullptr;
static TProgram_constructor_t glslang_TProgram_constructor = nullptr;
static TProgram_destructor_t glslang_TProgram_destructor = nullptr;
bool loadGlslangLibraries() {
    // Get Vulkan SDK path from environment variable
    const char* vulkan_sdk = getenv("VULKAN_SDK");
    if (!vulkan_sdk) {
        vulkan_sdk = "C:\\VulkanSDK\\1.3.296.0";  // Fallback to default location
    }
    
    std::string glslang_path = std::string(vulkan_sdk) + "\\Bin\\glslang.dll";
    std::string spirv_path = std::string(vulkan_sdk) + "\\Bin\\SPIRV.dll";
    
    glslang_dll = LoadLibraryA(glslang_path.c_str());
    spirv_dll = LoadLibraryA(spirv_path.c_str());
    
    if (!glslang_dll || !spirv_dll) {
        std::cerr << "Failed to load glslang DLLs" << std::endl;
        return false;
    }
    
    glslang_InitializeProcess = (InitializeProcess_t)GetProcAddress(glslang_dll, "InitializeProcess");
    glslang_FinalizeProcess = (FinalizeProcess_t)GetProcAddress(glslang_dll, "FinalizeProcess");
    glslang_TShader_constructor = (TShader_constructor_t)GetProcAddress(glslang_dll, "TShader_constructor");
    glslang_TShader_destructor = (TShader_destructor_t)GetProcAddress(glslang_dll, "TShader_destructor");
    glslang_TShader_setStringsWithLengths = (TShader_setStringsWithLengths_t)GetProcAddress(glslang_dll, "TShader_setStringsWithLengths");
    glslang_TShader_setEntryPoint = (TShader_setEntryPoint_t)GetProcAddress(glslang_dll, "TShader_setEntryPoint");
    glslang_TShader_setSourceEntryPoint = (TShader_setSourceEntryPoint_t)GetProcAddress(glslang_dll, "TShader_setSourceEntryPoint");
    glslang_TShader_parse = (TShader_parse_t)GetProcAddress(glslang_dll, "TShader_parse");
    glslang_TShader_getInfoLog = (TShader_getInfoLog_t)GetProcAddress(glslang_dll, "TShader_getInfoLog");
    glslang_TShader_getInfoDebugLog = (TShader_getInfoDebugLog_t)GetProcAddress(glslang_dll, "TShader_getInfoDebugLog");
    glslang_GlslangToSpv = (GlslangToSpv_t)GetProcAddress(glslang_dll, "GlslangToSpv");
    glslang_TProgram_constructor = (TProgram_constructor_t)GetProcAddress(glslang_dll, "TProgram_constructor");
    glslang_TProgram_destructor = (TProgram_destructor_t)GetProcAddress(glslang_dll, "TProgram_destructor");
    
    return (glslang_InitializeProcess && glslang_FinalizeProcess && 
            glslang_TShader_constructor && glslang_TShader_destructor &&
            glslang_GlslangToSpv);
}
void unloadGlslangLibraries() {
    if (glslang_dll) FreeLibrary(glslang_dll);
    if (spirv_dll) FreeLibrary(spirv_dll);
    glslang_dll = NULL;
    spirv_dll = NULL;
}
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    if (!loadGlslangLibraries()) {
        std::cerr << "Failed to load glslang libraries" << std::endl;
    }
    
    if (glslang_InitializeProcess) glslang_InitializeProcess();
    
    LLMEngineWrap::Init(env, exports);
    HardwareWrap::Init(env, exports);
    return exports;
}
void module_finalize(napi_env env, void* data, void* hint) {
    if (glslang_FinalizeProcess) glslang_FinalizeProcess();
    unloadGlslangLibraries();
}
NODE_API_MODULE(ncnn_binding, Init)