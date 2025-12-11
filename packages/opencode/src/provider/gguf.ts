import z from "zod"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateId } from "../util/id"
import { CompatibilityChecker } from "./compatibility-checker"
import { getModelRequirements } from "./model-database"

// GGUF Provider Configuration Schema
export const ggufConfigSchema = z.object({
  baseURL: z.string().optional(),
  apiKey: z.string().optional(),
  modelPath: z.string().describe("Path to GGUF model file"),
  contextLength: z.number().optional().default(4096),
  temperature: z.number().optional().default(0.8),
  gpuLayers: z.number().optional().default(-1), // -1 = auto-detect
  vulkan: z.boolean().optional().default(true)
})

export type GgufConfig = z.infer<typeof ggufConfigSchema>

// GGUF Provider Factory
export function createGgufProvider(config: GgufConfig) {
  // Check compatibility before creating provider
  const compatibility = checkModelCompatibility(config.modelPath || "unknown", config)
  if (!compatibility.compatible) {
    throw new Error(`Model not compatible: ${compatibility.reason}`)
  }

  // For now, create a mock OpenAI-compatible provider
  // This will be replaced with actual ncnn-vulkan integration
  const mockBaseURL = "http://localhost:8080/v1" // Placeholder for future REST API

  return createOpenAICompatible({
    name: "gguf",
    apiKey: "mock-key", // Not used for local inference
    baseURL: mockBaseURL
  })
}

// Enhanced compatibility checking function
export function checkModelCompatibility(modelId: string, config?: Partial<GgufConfig>) {
  // Import Hardware class dynamically to avoid circular dependencies
  const { Hardware } = require("../ncnn-binding")
  
  try {
    const hardware = new Hardware()
    const systemInfo = hardware.getSystemInfo()
    
    // Add Vulkan info if available
    if (hardware.isVulkanAvailable()) {
      systemInfo.vulkan = hardware.getVulkanInfo()
    }
    
    return CompatibilityChecker.checkCompatibility(modelId, systemInfo)
  } catch (error) {
    return {
      compatible: false,
      reason: `Failed to detect system capabilities: ${error.message}`,
      warnings: [],
      performance_tier: "unusable" as const,
      recommendations: ["Install Vulkan drivers", "Check system requirements"],
      missing_requirements: ["system_detection"]
    }
  }
}

// Model definitions for GGUF provider
export const ggufModels = {
  "phi-3-mini": {
    id: "phi-3-mini",
    displayName: "Phi-3 Mini",
    description: "Microsoft Phi-3 Mini 4K Instruct",
    contextLength: 4096,
    recommended: true,
    memoryRequired: 4.2 * 1024 * 1024 * 1024, // 4.2GB
    supportsVulkan: true
  },
  "llama-3-8b": {
    id: "llama-3-8b",
    displayName: "Llama 3 8B",
    description: "Meta Llama 3 8B Instruct",
    contextLength: 8192,
    recommended: true,
    memoryRequired: 8.5 * 1024 * 1024 * 1024, // 8.5GB
    supportsVulkan: true
  },
  "qwen-1.5b": {
    id: "qwen-1.5b",
    displayName: "Qwen 1.5B",
    description: "Alibaba Qwen 1.5B Chat",
    contextLength: 32768,
    recommended: true,
    memoryRequired: 1.2 * 1024 * 1024 * 1024, // 1.2GB
    supportsVulkan: true
  }
}

// Hardware compatibility checker
export function checkHardwareCompatibility(modelId: string, hardware: any) {
  const model = ggufModels[modelId as keyof typeof ggufModels]
  if (!model) return { compatible: false, reason: "Unknown model" }

  const availableMemory = hardware.system?.availableMemory || 0
  const hasVulkan = hardware.gpu?.vulkanAvailable || false

  if (model.memoryRequired > availableMemory) {
    return {
      compatible: false,
      reason: `Insufficient memory: ${model.displayName} requires ${(model.memoryRequired / (1024*1024*1024)).toFixed(1)}GB, only ${(availableMemory / (1024*1024*1024)).toFixed(1)}GB available`
    }
  }

  if (model.supportsVulkan && !hasVulkan) {
    return {
      compatible: true, // Still compatible, just slower
      reason: "Vulkan not available - will use CPU-only mode (slower)",
      warning: true
    }
  }

  return { compatible: true, reason: "Fully compatible" }
}