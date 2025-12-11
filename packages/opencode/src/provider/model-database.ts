import { ModelRequirements, SystemInfo, CompatibilityResult } from "./model-requirements"

// Pre-defined model requirements database
export const modelDatabase: Record<string, ModelRequirements> = {
  // Small models - good for older hardware
  "qwen-1.5b": {
    id: "qwen-1.5b",
    displayName: "Qwen 1.5B Chat",
    description: "Alibaba Qwen 1.5B - Small efficient model for general chat",
    category: "llm",
    memory: {
      minimum: 2 * 1024 * 1024 * 1024, // 2GB
      recommended: 4 * 1024 * 1024 * 1024, // 4GB
      vramMinimum: 1 * 1024 * 1024 * 1024, // 1GB
      vramRecommended: 2 * 1024 * 1024 * 1024 // 2GB
    },
    cpu: {
      architecture: ["x86_64", "arm64"],
      required_isa: [],
      recommended_isa: ["avx2", "neon"],
      minCores: 2,
      recommendedCores: 4
    },
    vulkan: {
      minimum_version: "1.0",
      required_extensions: [],
      optional_extensions: ["VK_KHR_push_descriptor"],
      requires_gpu: false
    },
    performance: {
      tier: "low",
      speed: "moderate",
      context_length: 32768,
      tokens_per_second: {
        cpu: 8,
        gpu: 25
      }
    },
    metadata: {
      huggingface_id: "Qwen/Qwen1.5-1.8B-Chat",
      file_size: 1.2 * 1024 * 1024 * 1024, // 1.2GB
      quantization: "Q4_K_M",
      context_length: 32768,
      license: "Apache-2.0",
      languages: ["en", "zh"],
      tags: ["small", "efficient", "multilingual"]
    }
  },

  "phi-3-mini": {
    id: "phi-3-mini",
    displayName: "Phi-3 Mini",
    description: "Microsoft Phi-3 Mini 4K - High quality small model",
    category: "llm",
    memory: {
      minimum: 3 * 1024 * 1024 * 1024, // 3GB
      recommended: 6 * 1024 * 1024 * 1024, // 6GB
      vramMinimum: 2 * 1024 * 1024 * 1024, // 2GB
      vramRecommended: 4 * 1024 * 1024 * 1024 // 4GB
    },
    cpu: {
      architecture: ["x86_64", "arm64"],
      required_isa: ["avx"], // Basic AVX required
      recommended_isa: ["avx2", "fma", "neon"],
      minCores: 4,
      recommendedCores: 6
    },
    vulkan: {
      minimum_version: "1.1",
      required_extensions: [],
      optional_extensions: ["VK_KHR_push_descriptor"],
      requires_gpu: false
    },
    performance: {
      tier: "medium",
      speed: "moderate",
      context_length: 4096,
      tokens_per_second: {
        cpu: 6,
        gpu: 20
      }
    },
    metadata: {
      huggingface_id: "microsoft/Phi-3-mini-4k-instruct-gguf",
      file_size: 4.2 * 1024 * 1024 * 1024, // 4.2GB
      quantization: "Q4_K_M",
      context_length: 4096,
      license: "MIT",
      languages: ["en"],
      tags: ["small", "high-quality", "instruction-tuned"]
    }
  },

  "llama-3-8b": {
    id: "llama-3-8b",
    displayName: "Llama 3 8B Instruct",
    description: "Meta Llama 3 8B - High performance medium model",
    category: "llm",
    memory: {
      minimum: 6 * 1024 * 1024 * 1024, // 6GB
      recommended: 12 * 1024 * 1024 * 1024, // 12GB
      vramMinimum: 4 * 1024 * 1024 * 1024, // 4GB
      vramRecommended: 8 * 1024 * 1024 * 1024 // 8GB
    },
    cpu: {
      architecture: ["x86_64", "arm64"],
      required_isa: ["avx2"], // AVX2 required for good performance
      recommended_isa: ["avx2", "fma", "f16c", "neon"],
      minCores: 6,
      recommendedCores: 8
    },
    vulkan: {
      minimum_version: "1.2",
      required_extensions: [],
      optional_extensions: ["VK_KHR_push_descriptor"],
      requires_gpu: true // GPU recommended for good performance
    },
    performance: {
      tier: "high",
      speed: "fast",
      context_length: 8192,
      tokens_per_second: {
        cpu: 3,
        gpu: 15
      }
    },
    metadata: {
      huggingface_id: "meta-llama/Meta-Llama-3-8B-Instruct-GGUF",
      file_size: 8.5 * 1024 * 1024 * 1024, // 8.5GB
      quantization: "Q4_K_M",
      context_length: 8192,
      license: "Llama-3",
      languages: ["en"],
      tags: ["medium", "high-quality", "instruction-tuned", "reasoning"]
    }
  },

  "llama-3-70b": {
    id: "llama-3-70b",
    displayName: "Llama 3 70B Instruct",
    description: "Meta Llama 3 70B - Large high-performance model",
    category: "llm",
    memory: {
      minimum: 24 * 1024 * 1024 * 1024, // 24GB
      recommended: 48 * 1024 * 1024 * 1024, // 48GB
      vramMinimum: 16 * 1024 * 1024 * 1024, // 16GB
      vramRecommended: 32 * 1024 * 1024 * 1024 // 32GB
    },
    cpu: {
      architecture: ["x86_64"],
      required_isa: ["avx2"],
      recommended_isa: ["avx512", "fma", "f16c", "avx512_vnni"],
      minCores: 8,
      recommendedCores: 16
    },
    vulkan: {
      minimum_version: "1.3",
      required_extensions: ["VK_KHR_push_descriptor"],
      optional_extensions: ["VK_KHR_maintenance1"],
      requires_gpu: true // GPU required
    },
    performance: {
      tier: "ultra",
      speed: "very_fast",
      context_length: 8192,
      tokens_per_second: {
        cpu: 0.5,
        gpu: 8
      }
    },
    metadata: {
      huggingface_id: "meta-llama/Meta-Llama-3-70B-Instruct-GGUF",
      file_size: 42 * 1024 * 1024 * 1024, // 42GB
      quantization: "Q4_K_M",
      context_length: 8192,
      license: "Llama-3",
      languages: ["en"],
      tags: ["large", "high-quality", "instruction-tuned", "reasoning", "advanced"]
    }
  },

  // Vision models
  "llava-1.5-7b": {
    id: "llava-1.5-7b",
    displayName: "LLaVA 1.5 7B",
    description: "Vision-Language model for image understanding",
    category: "multimodal",
    memory: {
      minimum: 8 * 1024 * 1024 * 1024, // 8GB
      recommended: 16 * 1024 * 1024 * 1024, // 16GB
      vramMinimum: 6 * 1024 * 1024 * 1024, // 6GB
      vramRecommended: 12 * 1024 * 1024 * 1024 // 12GB
    },
    cpu: {
      architecture: ["x86_64", "arm64"],
      required_isa: ["avx2"],
      recommended_isa: ["avx2", "fma", "f16c", "neon"],
      minCores: 6,
      recommendedCores: 8
    },
    vulkan: {
      minimum_version: "1.2",
      required_extensions: [],
      optional_extensions: ["VK_KHR_push_descriptor"],
      requires_gpu: true
    },
    performance: {
      tier: "high",
      speed: "fast",
      context_length: 4096,
      tokens_per_second: {
        cpu: 2,
        gpu: 12
      }
    },
    metadata: {
      huggingface_id: "liuhaotian/llava-v1.5-7b-gguf",
      file_size: 8.7 * 1024 * 1024 * 1024, // 8.7GB
      quantization: "Q4_K_M",
      context_length: 4096,
      license: "Apache-2.0",
      languages: ["en"],
      tags: ["vision", "multimodal", "image-understanding"]
    }
  }
}

// Helper function to get model by ID
export function getModelRequirements(modelId: string): ModelRequirements | null {
  return modelDatabase[modelId] || null
}

// Get all models
export function getAllModels(): ModelRequirements[] {
  return Object.values(modelDatabase)
}

// Get models by category
export function getModelsByCategory(category: string): ModelRequirements[] {
  return Object.values(modelDatabase).filter(model => model.category === category)
}

// Get models by performance tier
export function getModelsByTier(tier: string): ModelRequirements[] {
  return Object.values(modelDatabase).filter(model => model.performance.tier === tier)
}