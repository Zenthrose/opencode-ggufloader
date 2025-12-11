import z from "zod"
import { Tool } from "./tool"
import os from "os"

const SYSTEM_SCAN_SCHEMA = z.object({
  detailed: z.boolean().optional().describe("Include detailed hardware information")
})

export const SystemScanTool = Tool.define("hf_system_scan", {
  description: "Analyze system hardware capabilities for GGUF model compatibility",
  parameters: SYSTEM_SCAN_SCHEMA,
  async execute(params, ctx) {
    const { detailed = false } = params

    // Get basic system information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      availableMemory: os.freemem(),
      cpuCount: os.cpus().length
    }

    // For now, mock Vulkan/GPU detection since binding isn't built yet
    // This will be replaced with actual hardware detection
    const gpuInfo = {
      vulkanAvailable: false, // Will be detected by binding
      gpuCount: 0,
      gpus: [],
      recommendedModels: {
        small: "Qwen 1.5B, Phi-3 Mini (2-4GB RAM)",
        medium: "Llama 3 8B, Mistral 7B (8-16GB RAM)",
        large: "Llama 3 70B (40GB+ VRAM required - not compatible)"
      }
    }

    const compatibilityReport = {
      system: systemInfo,
      gpu: gpuInfo,
      recommendations: {
        maxModelSize: systemInfo.availableMemory > 16 * 1024 * 1024 * 1024 ? "Large models possible" :
                     systemInfo.availableMemory > 8 * 1024 * 1024 * 1024 ? "Medium models recommended" :
                     "Small models only",
        vulkanStatus: gpuInfo.vulkanAvailable ? "Vulkan available - GPU acceleration enabled" :
                      "Vulkan not detected - CPU-only mode",
        memoryNote: `Available memory: ${(systemInfo.availableMemory / (1024 * 1024 * 1024)).toFixed(1)}GB`
      }
    }

    if (detailed) {
      compatibilityReport.system.cpuDetails = os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed
      }))
    }

    ctx.metadata({
      title: "System Compatibility Report",
      metadata: {
        platform: systemInfo.platform,
        memory: `${(systemInfo.availableMemory / (1024 * 1024 * 1024)).toFixed(1)}GB available`,
        vulkan: gpuInfo.vulkanAvailable ? "Available" : "Not detected"
      }
    })

    return {
      title: "System Compatibility Report",
      metadata: {},
      output: JSON.stringify(compatibilityReport, null, 2),
      attachments: []
    }
  }
})