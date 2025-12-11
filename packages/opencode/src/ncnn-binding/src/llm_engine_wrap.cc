#include "llm_engine_wrap.h"
#include <iostream>

Napi::FunctionReference LLMEngineWrap::constructor;

Napi::Object LLMEngineWrap::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "LLMEngine", {
    InstanceMethod("loadModel", &LLMEngineWrap::LoadModel),
    InstanceMethod("generateText", &LLMEngineWrap::GenerateText),
    InstanceMethod("getTokenizer", &LLMEngineWrap::GetTokenizer)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("LLMEngine", func);
  return exports;
}

LLMEngineWrap::LLMEngineWrap(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<LLMEngineWrap>(info) {
  engine_ = new ncnn::LLMEngine();
}

LLMEngineWrap::~LLMEngineWrap() {
  if (engine_) {
    delete engine_;
    engine_ = nullptr;
  }
}

Napi::Value LLMEngineWrap::LoadModel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string modelPath = info[0].As<Napi::String>().Utf8Value();
  bool result = engine_->load_model(modelPath);

  return Napi::Boolean::New(env, result);
}

Napi::Value LLMEngineWrap::GenerateText(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string prompt = info[0].As<Napi::String>().Utf8Value();

  // Parse optional config object
  ncnn::GenerationConfig config;
  if (info.Length() > 1 && info[1].IsObject()) {
    Napi::Object configObj = info[1].As<Napi::Object>();

    if (configObj.Has("maxTokens")) {
      config.max_tokens = configObj.Get("maxTokens").As<Napi::Number>().Int32Value();
    }
    if (configObj.Has("temperature")) {
      config.temperature = configObj.Get("temperature").As<Napi::Number>().FloatValue();
    }
    if (configObj.Has("topP")) {
      config.top_p = configObj.Get("topP").As<Napi::Number>().FloatValue();
    }
    if (configObj.Has("topK")) {
      config.top_k = configObj.Get("topK").As<Napi::Number>().Int32Value();
    }
  }

  std::string result = engine_->generate_text(prompt, config);
  return Napi::String::New(env, result);
}

Napi::Value LLMEngineWrap::GetTokenizer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Return a simple object with tokenizer methods
  Napi::Object tokenizer = Napi::Object::New(env);

  // We can't directly expose the C++ Tokenizer object, so we'll create wrapper methods
  // For now, return a placeholder object
  tokenizer.Set("bosToken", Napi::Number::New(env, engine_->get_tokenizer().bos_token()));
  tokenizer.Set("eosToken", Napi::Number::New(env, engine_->get_tokenizer().eos_token()));

  return tokenizer;
}