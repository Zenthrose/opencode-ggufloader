import z from "zod"
import { Tool } from "./tool"

const SYSTEM_INFO_SCHEMA = z.object({
  detailed: z.boolean().optional().default(false).describe("Show detailed hardware information")
})

export const SystemInfoTool = Tool.define("system_info", {
  description: "Display system hardware information and AI/LLM compatibility",
  parameters: SYSTEM_INFO_SCHEMA,
  async execute(params, ctx) {
    const { detailed = false } = params

    try {
      // Import Hardware class dynamically
      const { Hardware } = require("../ncnn-binding")
      const hardware = new Hardware()

      let output = `🖥️ System Information\n`
      output += `═══════════════════════════════════════\n\n`

      // Get system info
      const systemInfo = hardware.getSystemInfo()
      
      output += `📋 Basic Information:\n`
      output += `• Platform: ${systemInfo.platform}\n`
      output += `• Architecture: ${systemInfo.arch}\n`
      output += `• CPU Cores: ${systemInfo.cpu.coreCount}\n`
      output += `• Total Memory: ${this.formatBytes(systemInfo.totalMemory)}\n`
      output += `• Available Memory: ${this.formatBytes(systemInfo.availableMemory)}\n`
      output += `• Memory Usage: ${((systemInfo.totalMemory - systemInfo.availableMemory) / systemInfo.totalMemory * 100).toFixed(1)}%\n\n`

      // CPU instruction sets
      if (detailed && systemInfo.cpu.instructionSets.length > 0) {
        output += `🔧 CPU Instruction Sets:\n`
        systemInfo.cpu.instructionSets.forEach(isa => {
          output += `• ${isa}\n`
        })
        output += `\n`
      }

      // Vulkan information
      const vulkanAvailable = hardware.isVulkanAvailable()
      output += `🎮 Vulkan Support:\n`
      output += `• Available: ${vulkanAvailable ? '✅ Yes' : '❌ No'}\n`

      if (vulkanAvailable) {
        try {
          const vulkanInfo = hardware.getVulkanInfo()
          output += `• GPU Count: ${vulkanInfo.gpuCount}\n`
          
          if (vulkanInfo.gpuCount > 0) {
            output += `• GPUs:\n`
            vulkanInfo.gpus.forEach((gpu, index) => {
              output += `  ${index + 1}. ${gpu.deviceName}\n`
              output += `     Type: ${gpu.type}\n`
              output += `     VRAM: ${this.formatBytes(gpu.totalVRAM)}\n`
              output += `     Vulkan: ${gpu.apiVersionInfo.string}\n`
              output += `     Compatibility: ${gpu.compatibilityLevel}\n`
            })
          }
        } catch (error) {
          output += `• Error getting GPU info: ${error.message}\n`
        }
      } else {
        output += `• Note: Vulkan is required for GPU acceleration\n`
        output += `• CPU-only mode will be used (slower performance)\n`
      }

      output += `\n`

      // AI/LLM Compatibility Assessment
      output += `🤖 AI/LLM Compatibility:\n`
      
      const compatibility = this.assessAICompatibility(systemInfo, vulkanAvailable)
      output += `• Overall Compatibility: ${compatibility.overall}\n`
      output += `• Recommended Models: ${compatibility.recommendedModels.join(', ')}\n`
      output += `• Performance Expectation: ${compatibility.performance}\n`
      
      if (compatibility.limitations.length > 0) {
        output += `\n⚠️ Limitations:\n`
        compatibility.limitations.forEach(limit => {
          output += `• ${limit}\n`
        })
      }

      if (compatibility.recommendations.length > 0) {
        output += `\n💡 Recommendations:\n`
        compatibility.recommendations.forEach(rec => {
          output += `• ${rec}\n`
        })
      }

      output += `\n`

      // Performance tier explanation
      output += `📊 Performance Tiers:\n`
      output += `• Excellent: Modern hardware with GPU acceleration\n`
      output += `• Good: Decent hardware, may have some limitations\n`
      output += `• Fair: Older hardware, CPU-only or limited GPU\n`
      output += `• Poor: Minimal hardware, significant limitations\n`
      output += `• Unusable: Hardware doesn't meet minimum requirements\n`

      return {
        title: "🖥️ System Information",
        metadata: {
          platform: systemInfo.platform,
          arch: systemInfo.arch,
          cores: systemInfo.cpu.coreCount,
          memory: systemInfo.totalMemory,
          vulkan: vulkanAvailable,
          compatibility: compatibility.overall
        },
        output,
        attachments: []
      }

    } catch (error) {
      return {
        title: "❌ System Detection Failed",
        metadata: { error: error.message },
        output: `Failed to detect system information: ${error.message}\n\nTroubleshooting:\n• Ensure ncnn-vulkan binding is properly built\n• Check if Vulkan drivers are installed\n• Verify system permissions`,
        attachments: []
      }
    }
  },

  // Assess AI/LLM compatibility based on system info
  assessAICompatibility(systemInfo: any, vulkanAvailable: boolean) {
    const memoryGB = systemInfo.totalMemory / (1024 * 1024 * 1024)
    const cores = systemInfo.cpu.coreCount
    const hasAVX2 = systemInfo.cpu.instructionSets.includes('avx2')
    const hasNEON = systemInfo.cpu.instructionSets.includes('neon')
    const hasAVX512 = systemInfo.cpu.instructionSets.includes('avx512')

    let overall = "Unusable"
    let recommendedModels: string[] = []
    let performance = "Very Poor"
    const limitations: string[] = []
    const recommendations: string[] = []

    // Basic requirements check
    if (memoryGB < 4) {
      limitations.push("Less than 4GB RAM - insufficient for most AI models")
      overall = "Unusable"
    } else if (memoryGB < 8) {
      limitations.push("Limited RAM - only small models recommended")
      overall = "Poor"
      recommendedModels.push("Qwen 1.5B", "Phi-3 Mini")
      performance = "Poor"
    } else if (memoryGB < 16) {
      limitations.push("Moderate RAM - medium models may be slow")
      overall = "Fair"
      recommendedModels.push("Qwen 1.5B", "Phi-3 Mini", "Llama 3 8B")
      performance = "Fair"
    } else if (memoryGB < 32) {
      overall = "Good"
      recommendedModels.push("Phi-3 Mini", "Llama 3 8B", "LLaVA 1.5 7B")
      performance = "Good"
    } else {
      overall = "Excellent"
      recommendedModels.push("Llama 3 8B", "Llama 3 70B", "LLaVA 1.5 7B")
      performance = "Excellent"
    }

    // CPU capability assessment
    if (!hasAVX2 && !hasNEON) {
      limitations.push("CPU lacks modern instruction sets (AVX2/NEON)")
      recommendations.push("Consider upgrading to a modern CPU for better performance")
      if (overall !== "Unusable") {
        overall = "Poor"
      }
    }

    if (cores < 4) {
      limitations.push("Limited CPU cores - may impact performance")
      recommendations.push("Close background applications during inference")
    }

    // GPU assessment
    if (!vulkanAvailable) {
      limitations.push("No GPU acceleration available - CPU-only mode")
      recommendations.push("Install Vulkan drivers for GPU acceleration")
      recommendations.push("Ensure your GPU supports Vulkan compute")
      if (overall === "Excellent") {
        overall = "Good"
      } else if (overall === "Good") {
        overall = "Fair"
      }
    }

    // Advanced features
    if (hasAVX512) {
      recommendations.push("Your CPU supports AVX512 - excellent for large models")
      if (memoryGB >= 32) {
        recommendedModels.push("Llama 3 70B")
      }
    }

    // Platform-specific recommendations
    if (systemInfo.platform === "Windows") {
      recommendations.push("Ensure Vulkan Runtime is installed from LunarG or Microsoft Store")
    } else if (systemInfo.platform === "Linux") {
      recommendations.push("Install mesa-vulkan-drivers or NVIDIA Vulkan drivers")
    } else if (systemInfo.platform === "macOS") {
      recommendations.push("Vulkan support is available on Apple Silicon Macs")
      if (systemInfo.arch === "arm64") {
        recommendations.push("Apple Silicon Macs have excellent NEON support")
      }
    }

    return {
      overall,
      recommendedModels,
      performance,
      limitations,
      recommendations
    }
  },

  // Format bytes into human readable string
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