import z from "zod"

// Model requirements schema for compatibility checking
export const modelRequirementsSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string(),
  category: z.enum(["llm", "vision", "audio", "multimodal"]),
  
  // Memory requirements in bytes
  memory: z.object({
    minimum: z.number(),
    recommended: z.number(),
    vramMinimum: z.number().optional(),
    vramRecommended: z.number().optional()
  }),
  
  // CPU requirements
  cpu: z.object({
    architecture: z.array(z.string()).default(["x86_64", "arm64"]),
    required_isa: z.array(z.string()).default([]),
    recommended_isa: z.array(z.string()).default([]),
    minCores: z.number().default(2),
    recommendedCores: z.number().default(4)
  }),
  
  // Vulkan requirements
  vulkan: z.object({
    minimum_version: z.string().optional().default("1.0"),
    required_extensions: z.array(z.string()).default([]),
    optional_extensions: z.array(z.string()).default([]),
    requires_gpu: z.boolean().default(false)
  }),
  
  // Performance classification
  performance: z.object({
    tier: z.enum(["low", "medium", "high", "ultra"]),
    speed: z.enum(["slow", "moderate", "fast", "very_fast"]),
    context_length: z.number(),
    tokens_per_second: z.object({
      cpu: z.number().optional(),
      gpu: z.number().optional()
    })
  }),
  
  // Model metadata
  metadata: z.object({
    huggingface_id: z.string().optional(),
    file_size: z.number().optional(),
    quantization: z.string().optional(),
    context_length: z.number(),
    license: z.string().optional(),
    languages: z.array(z.string()).default(["en"]),
    tags: z.array(z.string()).default([])
  })
})

export type ModelRequirements = z.infer<typeof modelRequirementsSchema>

// System information schema
export const systemInfoSchema = z.object({
  platform: z.string(),
  arch: z.string(),
  totalMemory: z.number(),
  availableMemory: z.number(),
  cpu: z.object({
    coreCount: z.number(),
    instructionSets: z.array(z.string())
  }),
  vulkan: z.object({
    available: z.boolean(),
    gpuCount: z.number(),
    gpus: z.array(z.object({
      deviceIndex: z.number(),
      deviceName: z.string(),
      vendorId: z.number(),
      deviceId: z.number(),
      type: z.string(),
      totalVRAM: z.number(),
      apiVersionInfo: z.object({
        major: z.number(),
        minor: z.number(),
        patch: z.number(),
        string: z.string()
      }),
      compatibilityLevel: z.string()
    }))
  }).optional()
})

export type SystemInfo = z.infer<typeof systemInfoSchema>

// Compatibility result schema
export const compatibilityResultSchema = z.object({
  compatible: z.boolean(),
  reason: z.string(),
  warnings: z.array(z.string()).default([]),
  performance_tier: z.enum(["unusable", "poor", "fair", "good", "excellent"]),
  recommendations: z.array(z.string()).default([]),
  missing_requirements: z.array(z.string()).default([]),
  performance_estimate: z.object({
    tokens_per_second: z.number().optional(),
    memory_usage_percent: z.number().optional(),
    bottleneck: z.enum(["memory", "cpu", "gpu", "none"]).optional()
  }).optional()
})

export type CompatibilityResult = z.infer<typeof compatibilityResultSchema>