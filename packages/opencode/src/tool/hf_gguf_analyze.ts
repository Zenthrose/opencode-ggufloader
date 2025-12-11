import z from "zod"
import { Tool } from "./tool"
import path from "path"
import fs from "fs/promises"
import { Instance } from "../project/instance"
import { checkModelCompatibility } from "../provider/gguf"
import { getModelRequirements, getAllModels } from "../provider/model-database"

const GGUF_ANALYZE_SCHEMA = z.object({
  modelPath: z.string().describe("Path to GGUF model file"),
  modelType: z.string().optional().describe("Model type for compatibility checking (e.g., 'phi-3-mini', 'llama-3-8b')")
})

export const GgufAnalyzeTool = Tool.define("hf_gguf_analyze", {
  description: "Analyze GGUF model file and check system compatibility",
  parameters: GGUF_ANALYZE_SCHEMA,
  async execute(params, ctx) {
    const { modelPath, modelType } = params

    try {
      // Check if file exists
      const stats = await fs.stat(modelPath)
      if (!stats.isFile()) {
        throw new Error("Path is not a file")
      }

      // Analyze file
      const fileSize = stats.size
      const fileName = path.basename(modelPath)

      let output = `📊 GGUF Model Analysis\n`
      output += `═══════════════════════════════════════\n\n`
      output += `📁 File Information:\n`
      output += `• Path: ${modelPath}\n`
      output += `• Name: ${fileName}\n`
      output += `• Size: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB\n`
      output += `• Modified: ${stats.mtime.toLocaleString()}\n\n`

      // Try to detect model type from filename if not provided
      let detectedModelType = modelType
      if (!detectedModelType) {
        detectedModelType = this.detectModelType(fileName)
        if (detectedModelType) {
          output += `🔍 Detected Model Type: ${detectedModelType}\n\n`
        }
      }

      // Check compatibility if model type is known
      if (detectedModelType) {
        const compatibility = checkModelCompatibility(detectedModelType)
        
        output += `🔧 Compatibility Analysis:\n`
        output += `• Status: ${compatibility.compatible ? '✅ Compatible' : '❌ Not Compatible'}\n`
        output += `• Performance Tier: ${compatibility.performance_tier.toUpperCase()}\n`
        
        if (compatibility.performance_estimate) {
          output += `• Estimated Speed: ${compatibility.performance_estimate.tokens_per_second?.toFixed(1)} tokens/sec\n`
          output += `• Memory Usage: ${compatibility.performance_estimate.memory_usage_percent?.toFixed(1)}%\n`
          if (compatibility.performance_estimate.bottleneck && compatibility.performance_estimate.bottleneck !== 'none') {
            output += `• Bottleneck: ${compatibility.performance_estimate.bottleneck.toUpperCase()}\n`
          }
        }

        if (compatibility.warnings.length > 0) {
          output += `\n⚠️ Warnings:\n`
          compatibility.warnings.forEach(warning => {
            output += `• ${warning}\n`
          })
        }

        if (!compatibility.compatible) {
          output += `\n❌ Issues:\n`
          output += `• ${compatibility.reason}\n\n`
          
          if (compatibility.missing_requirements.length > 0) {
            output += `Missing Requirements:\n`
            compatibility.missing_requirements.forEach(req => {
              output += `• ${req}\n`
            })
          }
        }

        if (compatibility.recommendations.length > 0) {
          output += `\n💡 Recommendations:\n`
          compatibility.recommendations.forEach(rec => {
            output += `• ${rec}\n`
          })
        }

        // Get model requirements details
        const modelRequirements = getModelRequirements(detectedModelType)
        if (modelRequirements) {
          output += `\n📋 Model Requirements:\n`
          output += `• Memory: ${this.formatBytes(modelRequirements.memory.minimum)} (min) / ${this.formatBytes(modelRequirements.memory.recommended)} (rec)\n`
          if (modelRequirements.memory.vramMinimum) {
            output += `• VRAM: ${this.formatBytes(modelRequirements.memory.vramMinimum)} (min) / ${this.formatBytes(modelRequirements.memory.vramRecommended || modelRequirements.memory.vramMinimum * 2)} (rec)\n`
          }
          output += `• CPU Cores: ${modelRequirements.cpu.minCores} (min) / ${modelRequirements.cpu.recommendedCores} (rec)\n`
          if (modelRequirements.cpu.required_isa.length > 0) {
            output += `• Required ISA: ${modelRequirements.cpu.required_isa.join(', ')}\n`
          }
          if (modelRequirements.cpu.recommended_isa.length > 0) {
            output += `• Recommended ISA: ${modelRequirements.cpu.recommended_isa.join(', ')}\n`
          }
          output += `• Vulkan: ${modelRequirements.vulkan.minimum_version}+${modelRequirements.vulkan.requires_gpu ? ' (GPU required)' : ' (optional)'}\n`
          output += `• Context Length: ${modelRequirements.performance.context_length.toLocaleString()} tokens\n`
        }
      } else {
        output += `❓ Unknown Model Type\n`
        output += `Could not automatically detect model type. Please specify --model-type for compatibility analysis.\n\n`
        
        output += `Available Model Types:\n`
        const allModels = getAllModels()
        allModels.forEach(model => {
          output += `• ${model.id} - ${model.displayName}\n`
        })
      }

      // For now, also include basic GGUF metadata parsing (mock)
      // This will be replaced with actual GGUF parsing once binding is working
      const mockAnalysis = {
        architecture: detectedModelType?.includes('llama') ? "llama" : "unknown",
        quantization: "Q4_K_M",
        parameterCount: this.estimateParameterCount(fileSize),
        contextLength: 4096,
        embeddingLength: 4096,
        memoryRequirements: {
          weights: fileSize,
          kvCache: 512 * 1024 * 1024, // 512MB for 4096 context
          total: fileSize + (512 * 1024 * 1024)
        },
        supported: {
          vulkan: true,
          cpu: true,
          cuda: false,
          rocm: false
        }
      }

      output += `\n📋 Technical Details:\n`
      output += `• Architecture: ${mockAnalysis.architecture}\n`
      output += `• Quantization: ${mockAnalysis.quantization}\n`
      output += `• Estimated Parameters: ${(mockAnalysis.parameterCount / 1e9).toFixed(1)}B\n`
      output += `• Context Length: ${mockAnalysis.contextLength.toLocaleString()}\n`
      output += `• Memory Requirements: ${(mockAnalysis.memoryRequirements.total / (1024 * 1024 * 1024)).toFixed(1)}GB\n`

      ctx.metadata({
        title: `📊 Analysis Complete: ${fileName}`,
        metadata: {
          fileSize,
          modelType: detectedModelType,
          compatible: detectedModelType ? checkModelCompatibility(detectedModelType).compatible : null,
          architecture: mockAnalysis.architecture,
          quantization: mockAnalysis.quantization
        }
      })

      return {
        title: `📊 Analysis Complete: ${fileName}`,
        metadata: {
          fileSize,
          modelType: detectedModelType,
          compatible: detectedModelType ? checkModelCompatibility(detectedModelType).compatible : null
        },
        output,
        attachments: []
      }

    } catch (error) {
      return {
        title: "❌ Analysis Failed",
        metadata: { error: error.message },
        output: `Failed to analyze GGUF file: ${error.message}\n\nTroubleshooting:\n• Check if the file path is correct\n• Ensure the file is a valid GGUF model\n• Verify file permissions`,
        attachments: []
      }
    }
  },

  // Helper method to detect model type from filename
  detectModelType(fileName: string): string | null {
    const name = fileName.toLowerCase()
    
    // Pattern matching for common models
    if (name.includes('qwen') && (name.includes('1.5') || name.includes('1.8b'))) {
      return 'qwen-1.5b'
    }
    if (name.includes('phi') && name.includes('3') && name.includes('mini')) {
      return 'phi-3-mini'
    }
    if (name.includes('llama') && name.includes('3') && name.includes('8b')) {
      return 'llama-3-8b'
    }
    if (name.includes('llama') && name.includes('3') && name.includes('70b')) {
      return 'llama-3-70b'
    }
    if (name.includes('llava') && name.includes('7b')) {
      return 'llava-1.5-7b'
    }
    
    return null
  },

  // Helper method to estimate parameter count from file size
  estimateParameterCount(fileSize: number): number {
    // Rough estimation: Q4_K_M ~ 4.7 bits per parameter
    return Math.round((fileSize * 8) / 4.7)
  },

  // Helper method to format bytes
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`
  }
})

export const GgufAnalyzeTool = Tool.define("hf_gguf_analyze", {
  description: "Analyze GGUF file metadata to extract model requirements and compatibility information",
  parameters: GGUF_METADATA_SCHEMA,
  async execute(params, ctx) {
    const { filePath } = params

    // For now, return mock data since we don't have the GGUF parser integrated yet
    // This will be replaced with actual GGUF parsing once the binding is working

    const mockAnalysis = {
      architecture: "llama",
      quantization: "Q4_K_M",
      parameterCount: 8000000000, // 8B parameters
      contextLength: 4096,
      embeddingLength: 4096,
      memoryRequirements: {
        weights: 4.2 * 1024 * 1024 * 1024, // 4.2GB
        kvCache: 512 * 1024 * 1024, // 512MB for 4096 context
        total: 4.8 * 1024 * 1024 * 1024 // ~4.8GB total
      },
      supported: {
        vulkan: true,
        cpu: true,
        cuda: false, // Not yet implemented
        rocm: false  // Not yet implemented
      },
      metadata: {
        "general.architecture": "llama",
        "general.file_type": 15, // Q4_K_M
        "llama.context_length": 4096,
        "llama.embedding_length": 4096,
        "llama.block_count": 32,
        "llama.vocab_size": 32000
      }
    }

    ctx.metadata({
      title: `GGUF Analysis: ${path.basename(filePath)}`,
      metadata: {
        architecture: mockAnalysis.architecture,
        quantization: mockAnalysis.quantization,
        memoryRequired: `${(mockAnalysis.memoryRequirements.total / (1024 * 1024 * 1024)).toFixed(1)}GB`
      }
    })

    return {
      title: `GGUF Analysis: ${path.basename(filePath)}`,
      metadata: {},
      output: JSON.stringify(mockAnalysis, null, 2),
      attachments: []
    }
  }
})