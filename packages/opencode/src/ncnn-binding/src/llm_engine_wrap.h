#ifndef LLM_ENGINE_WRAP_H
#define LLM_ENGINE_WRAP_H

#include <napi.h>
#include "../ncnn/llm_engine.h"

class LLMEngineWrap : public Napi::ObjectWrap<LLMEngineWrap> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  LLMEngineWrap(const Napi::CallbackInfo& info);
  ~LLMEngineWrap();

 private:
  static Napi::FunctionReference constructor;

  // Wrapped methods
  Napi::Value LoadModel(const Napi::CallbackInfo& info);
  Napi::Value GenerateText(const Napi::CallbackInfo& info);
  Napi::Value GetTokenizer(const Napi::CallbackInfo& info);

  // Internal LLMEngine instance
  ncnn::LLMEngine* engine_;
};

#endif // LLM_ENGINE_WRAP_H