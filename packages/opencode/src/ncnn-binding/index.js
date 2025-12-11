const binding = require('./build/Release/ncnn_binding');

class LLMEngine {
  constructor() {
    this._engine = new binding.LLMEngine();
  }

  async loadModel(modelPath) {
    return this._engine.loadModel(modelPath);
  }

  async generateText(prompt, options = {}) {
    return this._engine.generateText(prompt, options);
  }

  getTokenizer() {
    return this._engine.getTokenizer();
  }
}

class Hardware {
  constructor() {
    this._hardware = new binding.Hardware();
  }

  getGpuCount() {
    return this._hardware.getGpuCount();
  }

  getGpuInfo(deviceIndex = 0) {
    return this._hardware.getGpuInfo(deviceIndex);
  }

  getSystemInfo() {
    return this._hardware.getSystemInfo();
  }

  isVulkanAvailable() {
    return this._hardware.isVulkanAvailable();
  }

  getVulkanInfo() {
    return this._hardware.getVulkanInfo();
  }
}

module.exports = {
  LLMEngine,
  Hardware
};