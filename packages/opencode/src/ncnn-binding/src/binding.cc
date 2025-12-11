#include <napi.h>
#include <windows.h>
#include <iostream>
#include <glslang/Public/ShaderLang.h>
#include <glslang/SPIRV/GlslangToSpv.h>
#include "llm_engine_wrap.h"
#include "hardware_wrap.h"
static HMODULE glslang_dll = NULL;
static HMODULE spirv_dll = NULL;
typedef void (*InitializeProcess_t)();
typedef void (*FinalizeProcess_t)();
typedef glslang::TShader* (*TShader_constructor_t)(glslang::EShLanguage);
typedef void (*TShader_destructor_t)(glslang::TShader*);
typedef void (*TShader_setStringsWithLengths_t)(glslang::TShader*, const char* const*, const int*, int);
typedef void (*TShader_setEntryPoint_t)(glslang::TShader*, const char*);
typedef void (*TShader_setSourceEntryPoint_t)(glslang::TShader*, const char*);
typedef int (*TShader_parse_t)(glslang::TShader*, const glslang::TBuiltInResource*, int, glslang::EProfile, bool, bool, glslang::EShMessages, glslang::TShader::Includer&);
typedef const char* (*TShader_getInfoLog_t)(glslang::TShader*);
typedef const char* (*TShader_getInfoDebugLog_t)(glslang::TShader*);
typedef void (*GlslangToSpv_t)(const glslang::TIntermediate*, std::vector<unsigned int>&, glslang::SpvOptions*);
typedef glslang::TProgram* (*TProgram_constructor_t)();
typedef void (*TProgram_destructor_t)(glslang::TProgram*);
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
    glslang_dll = LoadLibraryA("C:\\VulkanSDK\\1.3.296.0\\Bin\\glslang.dll");
    spirv_dll = LoadLibraryA("C:\\VulkanSDK\\1.3.296.0\\Bin\\SPIRV.dll");
    
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