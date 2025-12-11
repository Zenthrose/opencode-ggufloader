import z from "zod"
import { Tool } from "./tool"
import path from "path"
import fs from "fs/promises"
import { Instance } from "../project/instance"
import os from "os"
import { checkModelCompatibility } from "../provider/gguf"
import { getModelRequirements } from "../provider/model-database"

const GGUF_DOWNLOAD_SCHEMA = z.object({
  modelId: z.string().describe("Hugging Face model ID (e.g., 'microsoft/Phi-3-mini-4k-instruct')"),
  filename: z.string().describe("GGUF filename to download"),
  skipCompatibilityCheck: z.boolean().optional().describe("Skip hardware compatibility check"),
  modelType: z.string().optional().describe("Model type for compatibility checking (e.g., 'phi-3-mini', 'llama-3-8b')")
})

export const GgufDownloadTool = Tool.define("hf_gguf_download", {
  description: "Download GGUF files from Hugging Face with hardware compatibility checking",
  parameters: GGUF_DOWNLOAD_SCHEMA,
  async execute(params, ctx) {
    const { modelId, filename, skipCompatibilityCheck = false, modelType } = params

    // Enhanced compatibility checking
    if (!skipCompatibilityCheck && modelType) {
      const compatibility = checkModelCompatibility(modelType)
      
      if (!compatibility.compatible) {
        return {
          title: "❌ Model Not Compatible",
          metadata: { compatible: false },
          output: `Model "${modelType}" is not compatible with your system:\n\n${compatibility.reason}\n\nMissing Requirements:\n${compatibility.missing_requirements.map(req => `• ${req}`).join('\n')}\n\nRecommendations:\n${compatibility.recommendations.map(rec => `• ${rec}`).join('\n')}`,
          attachments: []
        }
      }

      // Show warnings if any
      if (compatibility.warnings.length > 0) {
        ctx.metadata({
          title: `⚠️ Compatibility Warnings for ${modelType}`,
          metadata: { warnings: compatibility.warnings },
        })
      }
    }

    // Basic memory check as fallback
    if (!skipCompatibilityCheck && !modelType) {
      const systemMemory = os.totalmem()
      const availableMemory = os.freemem()

      if (availableMemory < 4 * 1024 * 1024 * 1024) { // Less than 4GB available
        return {
          title: "Download Blocked: Insufficient Memory",
          metadata: {},
          output: `❌ Download blocked: Only ${(availableMemory / (1024 * 1024 * 1024)).toFixed(1)}GB memory available. GGUF models require at least 4GB free memory.\n\nRecommendations:\n• Close other applications\n• Use smaller models (Qwen 1.5B, Phi-3 Mini)\n• Or use --skip-compatibility-check to override`,
          attachments: []
        }
      }
    }

    // Construct download URL
    const downloadUrl = `https://huggingface.co/${modelId}/resolve/main/${filename}`

    // Create models directory if it doesn't exist
    const modelsDir = path.join(Instance.worktree, "models", "gguf")
    await fs.mkdir(modelsDir, { recursive: true })

    const outputPath = path.join(modelsDir, filename)

    ctx.metadata({
      title: `Downloading ${filename}`,
      metadata: {
        model: modelId,
        file: filename,
        url: downloadUrl
      }
    })

    try {
      // Download the file
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const totalSize = contentLength ? parseInt(contentLength) : 0

      // For now, download without progress tracking
      // This will be enhanced with progress tracking later
      const buffer = await response.arrayBuffer()
      await fs.writeFile(outputPath, new Uint8Array(buffer))

      const fileSize = (await fs.stat(outputPath)).size

      return {
        title: `✅ Downloaded ${filename}`,
        metadata: {},
        let output = `Successfully downloaded ${filename}\n` +
                   `• Model: ${modelId}\n` +
                   `• Size: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB\n` +
                   `• Location: ${outputPath}\n`

        // Add compatibility information if model type was specified
        if (modelType && !skipCompatibilityCheck) {
          const compatibility = checkModelCompatibility(modelType)
          output += `• Compatibility: ${compatibility.compatible ? '✅ Compatible' : '❌ Not Compatible'}\n`
          output += `• Performance Tier: ${compatibility.performance_tier}\n`
          
          if (compatibility.performance_estimate) {
            output += `• Estimated Speed: ${compatibility.performance_estimate.tokens_per_second?.toFixed(1)} tokens/sec\n`
            output += `• Memory Usage: ${compatibility.performance_estimate.memory_usage_percent?.toFixed(1)}%\n`
          }
          
          if (compatibility.warnings.length > 0) {
            output += `\n⚠️ Warnings:\n${compatibility.warnings.map(w => `• ${w}`).join('\n')}\n`
          }
        }

        output += `\nUse 'hf_gguf_analyze ${outputPath}' for detailed analysis.`
        attachments: []
      }

    } catch (error) {
      return {
        title: "Download Failed",
        metadata: {},
        output: `❌ Failed to download ${filename}: ${error.message}\n\n` +
                `Troubleshooting:\n` +
                `• Check model ID and filename spelling\n` +
                `• Verify the model exists on Hugging Face\n` +
                `• Ensure you have internet connection\n` +
                `• Some models require authentication`,
        attachments: []
      }
    }
  }
})