#include "hardware_wrap.h"
#include <iostream>
#include "cpu.h"
#include "gpu.h"

#if defined(_WIN32)
#include <windows.h>
#include <psapi.h>
#elif defined(__linux__)
#include <sys/sysinfo.h>
#include <unistd.h>
#elif defined(__APPLE__)
#include <sys/sysctl.h>
#include <mach/mach.h>
#endif

Napi::FunctionReference HardwareWrap::constructor;

Napi::Object HardwareWrap::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Hardware", {
    InstanceMethod("getGpuCount", &HardwareWrap::GetGpuCount),
    InstanceMethod("getGpuInfo", &HardwareWrap::GetGpuInfo),
    InstanceMethod("getSystemInfo", &HardwareWrap::GetSystemInfo),
    InstanceMethod("isVulkanAvailable", &HardwareWrap::IsVulkanAvailable),
    InstanceMethod("getVulkanInfo", &HardwareWrap::GetVulkanInfo)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Hardware", func);
  return exports;
}

HardwareWrap::HardwareWrap(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<HardwareWrap>(info) {
  // Vulkan disabled
}

HardwareWrap::~HardwareWrap() {
  // Don't destroy GPU instance here as it might be shared
}

Napi::Value HardwareWrap::GetGpuCount(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // Vulkan disabled
  return Napi::Number::New(env, 0);
}

Napi::Value HardwareWrap::GetGpuInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  int deviceIndex = 0;
  if (info.Length() > 0 && info[0].IsNumber()) {
    deviceIndex = info[0].As<Napi::Number>().Int32Value();
  }

  const ncnn::GpuInfo& gpuInfo = ncnn::get_gpu_info(deviceIndex);

  Napi::Object result = Napi::Object::New(env);
  result.Set("deviceIndex", Napi::Number::New(env, gpuInfo.device_index()));
  result.Set("deviceName", Napi::String::New(env, gpuInfo.device_name()));
  result.Set("vendorId", Napi::Number::New(env, gpuInfo.vendor_id()));
  result.Set("deviceId", Napi::Number::New(env, gpuInfo.device_id()));
  result.Set("apiVersion", Napi::Number::New(env, gpuInfo.api_version()));
  result.Set("driverVersion", Napi::Number::New(env, gpuInfo.driver_version()));

  // GPU type: 0 = discrete, 1 = integrated, 2 = virtual, 3 = cpu
  std::string typeStr;
  switch (gpuInfo.type()) {
    case 0: typeStr = "discrete"; break;
    case 1: typeStr = "integrated"; break;
    case 2: typeStr = "virtual"; break;
    case 3: typeStr = "cpu"; break;
    default: typeStr = "unknown"; break;
  }
  result.Set("type", Napi::String::New(env, typeStr));

  // Memory information
  const VkPhysicalDeviceMemoryProperties& memProps = gpuInfo.physicalDeviceMemoryProperties();
  Napi::Array memoryHeaps = Napi::Array::New(env, memProps.memoryHeapCount);
  for (uint32_t i = 0; i < memProps.memoryHeapCount; ++i) {
    Napi::Object heap = Napi::Object::New(env);
    heap.Set("size", Napi::Number::New(env, (double)memProps.memoryHeaps[i].size));
    heap.Set("flags", Napi::Number::New(env, memProps.memoryHeaps[i].flags));
    memoryHeaps.Set(i, heap);
  }
  result.Set("memoryHeaps", memoryHeaps);

  return result;
}

Napi::Value HardwareWrap::GetSystemInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object result = Napi::Object::New(env);
  
  // Platform detection
  std::string platform;
#if defined(_WIN32)
  platform = "Windows";
#elif defined(__linux__)
  platform = "Linux";
#elif defined(__APPLE__)
  platform = "macOS";
#else
  platform = "Unknown";
#endif
  result.Set("platform", Napi::String::New(env, platform));

  // Architecture detection
  std::string arch;
#if defined(_M_X64) || defined(__x86_64__)
  arch = "x86_64";
#elif defined(_M_IX86) || defined(__i386__)
  arch = "x86";
#elif defined(_M_ARM64) || defined(__aarch64__)
  arch = "arm64";
#elif defined(_M_ARM) || defined(__arm__)
  arch = "arm";
#else
  arch = "unknown";
#endif
  result.Set("arch", Napi::String::New(env, arch));

  // Memory detection
  size_t totalMemory = 0;
  size_t availableMemory = 0;

#if defined(_WIN32)
  MEMORYSTATUSEX memInfo;
  memInfo.dwLength = sizeof(MEMORYSTATUSEX);
  GlobalMemoryStatusEx(&memInfo);
  totalMemory = memInfo.ullTotalPhys;
  availableMemory = memInfo.ullAvailPhys;
#elif defined(__linux__)
  struct sysinfo memInfo;
  sysinfo(&memInfo);
  totalMemory = memInfo.totalram * memInfo.mem_unit;
  availableMemory = memInfo.freeram * memInfo.mem_unit;
#elif defined(__APPLE__)
  int mib[2] = {CTL_HW, HW_MEMSIZE};
  size_t len = sizeof(totalMemory);
  sysctl(mib, 2, &totalMemory, &len, NULL, 0);
  
  vm_size_t page_size;
  mach_port_t mach_port;
  mach_msg_type_number_t count;
  vm_statistics64_data_t vm_stats;
  
  mach_port = mach_host_self();
  count = sizeof(vm_statistics64_data_t) / sizeof(natural_t);
  if (host_statistics64(mach_port, HOST_VM_INFO64, (host_info64_t)&vm_stats, &count) == KERN_SUCCESS) {
    page_size = vm_kernel_page_size;
    availableMemory = (size_t)vm_stat.free_count * (size_t)page_size;
  }
#endif

  result.Set("totalMemory", Napi::Number::New(env, (double)totalMemory));
  result.Set("availableMemory", Napi::Number::New(env, (double)availableMemory));

  // CPU information
  Napi::Object cpuInfo = Napi::Object::New(env);
  
  // CPU core count
  int coreCount = 0;
#if defined(_WIN32)
  SYSTEM_INFO sysInfo;
  ::GetSystemInfo(&sysInfo);
  coreCount = sysInfo.dwNumberOfProcessors;
#elif defined(__linux__) || defined(__APPLE__)
  coreCount = sysconf(_SC_NPROCESSORS_ONLN);
#endif
  cpuInfo.Set("coreCount", Napi::Number::New(env, coreCount));

  // CPU instruction sets
  Napi::Array instructionSets = Napi::Array::New(env);
  int isaIndex = 0;

#if defined(__x86_64__) || defined(_M_X64)
  // x86_64 instruction sets
  if (ncnn::cpu_support_x86_avx()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx"));
  }
  if (ncnn::cpu_support_x86_fma()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "fma"));
  }
  if (ncnn::cpu_support_x86_f16c()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "f16c"));
  }
  if (ncnn::cpu_support_x86_avx2()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx2"));
  }
  if (ncnn::cpu_support_x86_avx_vnni()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx_vnni"));
  }
  if (ncnn::cpu_support_x86_avx512()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx512"));
  }
  if (ncnn::cpu_support_x86_avx512_vnni()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx512_vnni"));
  }
  if (ncnn::cpu_support_x86_avx512_bf16()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx512_bf16"));
  }
  if (ncnn::cpu_support_x86_avx512_fp16()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "avx512_fp16"));
  }
#elif defined(__aarch64__) || defined(_M_ARM64)
  // ARM64 instruction sets
  if (ncnn::cpu_support_arm_neon()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "neon"));
  }
  if (ncnn::cpu_support_arm_asimdhp()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "asimdhp"));
  }
  if (ncnn::cpu_support_arm_asimddp()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "asimddp"));
  }
  if (ncnn::cpu_support_arm_asimdfhm()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "asimdfhm"));
  }
  if (ncnn::cpu_support_arm_bf16()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "bf16"));
  }
  if (ncnn::cpu_support_arm_i8mm()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "i8mm"));
  }
  if (ncnn::cpu_support_arm_sve()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "sve"));
  }
  if (ncnn::cpu_support_arm_sve2()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "sve2"));
  }
  if (ncnn::cpu_support_arm_svebf16()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "svebf16"));
  }
  if (ncnn::cpu_support_arm_svei8mm()) {
    instructionSets.Set(isaIndex++, Napi::String::New(env, "svei8mm"));
  }
#endif

  cpuInfo.Set("instructionSets", instructionSets);
  result.Set("cpu", cpuInfo);

  return result;
}

Napi::Value HardwareWrap::IsVulkanAvailable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Try to create GPU instance to check Vulkan availability
  int result = ncnn::create_gpu_instance();
  bool available = (result == 0);

  return Napi::Boolean::New(env, available);
}

Napi::Value HardwareWrap::GetVulkanInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::Object result = Napi::Object::New(env);
  
  // Check if Vulkan is available
  int createResult = ncnn::create_gpu_instance();
  bool available = (createResult == 0);
  result.Set("available", Napi::Boolean::New(env, available));
  
  if (!available) {
    result.Set("error", Napi::String::New(env, "Failed to create Vulkan instance"));
    return result;
  }

  // Get GPU count
  int gpuCount = ncnn::get_gpu_count();
  result.Set("gpuCount", Napi::Number::New(env, gpuCount));

  // Get GPU information for each device
  Napi::Array gpus = Napi::Array::New(env, gpuCount);
  for (int i = 0; i < gpuCount; i++) {
    const ncnn::GpuInfo& gpuInfo = ncnn::get_gpu_info(i);
    
    Napi::Object gpu = Napi::Object::New(env);
    gpu.Set("deviceIndex", Napi::Number::New(env, gpuInfo.device_index()));
    gpu.Set("deviceName", Napi::String::New(env, gpuInfo.device_name()));
    gpu.Set("vendorId", Napi::Number::New(env, gpuInfo.vendor_id()));
    gpu.Set("deviceId", Napi::Number::New(env, gpuInfo.device_id()));
    gpu.Set("apiVersion", Napi::Number::New(env, gpuInfo.api_version()));
    gpu.Set("driverVersion", Napi::Number::New(env, gpuInfo.driver_version()));

    // GPU type
    std::string typeStr;
    switch (gpuInfo.type()) {
      case 0: typeStr = "discrete"; break;
      case 1: typeStr = "integrated"; break;
      case 2: typeStr = "virtual"; break;
      case 3: typeStr = "cpu"; break;
      default: typeStr = "unknown"; break;
    }
    gpu.Set("type", Napi::String::New(env, typeStr));

    // Memory information
    const VkPhysicalDeviceMemoryProperties& memProps = gpuInfo.physicalDeviceMemoryProperties();
    Napi::Array memoryHeaps = Napi::Array::New(env, memProps.memoryHeapCount);
    uint64_t totalVRAM = 0;
    
    for (uint32_t j = 0; j < memProps.memoryHeapCount; ++j) {
      Napi::Object heap = Napi::Object::New(env);
      heap.Set("size", Napi::Number::New(env, (double)memProps.memoryHeaps[j].size));
      heap.Set("flags", Napi::Number::New(env, memProps.memoryHeaps[j].flags));
      
      // Only count device local memory (VRAM)
      if (memProps.memoryHeaps[j].flags & VK_MEMORY_HEAP_DEVICE_LOCAL_BIT) {
        totalVRAM += memProps.memoryHeaps[j].size;
      }
      
      memoryHeaps.Set(j, heap);
    }
    gpu.Set("memoryHeaps", memoryHeaps);
    gpu.Set("totalVRAM", Napi::Number::New(env, (double)totalVRAM));

    // Vulkan version information
    uint32_t apiVersion = gpuInfo.api_version();
    uint32_t major = VK_VERSION_MAJOR(apiVersion);
    uint32_t minor = VK_VERSION_MINOR(apiVersion);
    uint32_t patch = VK_VERSION_PATCH(apiVersion);
    
    Napi::Object version = Napi::Object::New(env);
    version.Set("major", Napi::Number::New(env, major));
    version.Set("minor", Napi::Number::New(env, minor));
    version.Set("patch", Napi::Number::New(env, patch));
    version.Set("string", Napi::String::New(env, 
      std::to_string(major) + "." + std::to_string(minor) + "." + std::to_string(patch)));
    gpu.Set("apiVersionInfo", version);

    // Compatibility level
    std::string compatibilityLevel = "full";
    if (major < 1 || (major == 1 && minor < 1)) {
      compatibilityLevel = "minimal";
    } else if (major == 1 && minor < 2) {
      compatibilityLevel = "reduced";
    } else if (major == 1 && minor < 3) {
      compatibilityLevel = "basic";
    }
    gpu.Set("compatibilityLevel", Napi::String::New(env, compatibilityLevel));

    gpus.Set(i, gpu);
  }
  result.Set("gpus", gpus);

  return result;
}