#ifndef HARDWARE_WRAP_H
#define HARDWARE_WRAP_H

#include <napi.h>
#include "../ncnn/gpu.h"

class HardwareWrap : public Napi::ObjectWrap<HardwareWrap> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  HardwareWrap(const Napi::CallbackInfo& info);
  ~HardwareWrap();

 private:
  static Napi::FunctionReference constructor;

  // Hardware detection methods
  Napi::Value GetGpuCount(const Napi::CallbackInfo& info);
  Napi::Value GetGpuInfo(const Napi::CallbackInfo& info);
  Napi::Value GetSystemInfo(const Napi::CallbackInfo& info);
  Napi::Value IsVulkanAvailable(const Napi::CallbackInfo& info);
  Napi::Value GetVulkanInfo(const Napi::CallbackInfo& info);
};

#endif // HARDWARE_WRAP_H