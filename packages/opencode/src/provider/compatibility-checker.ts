import { ModelRequirements, SystemInfo, CompatibilityResult } from "./model-requirements"
import { getModelRequirements } from "./model-database"

export class CompatibilityChecker {
  
  /**
   * Check if a model is compatible with the given system
   */
  static checkCompatibility(modelId: string, systemInfo: SystemInfo): CompatibilityResult {
    const model = getModelRequirements(modelId)
    if (!model) {
      return {
        compatible: false,
        reason: `Unknown model: ${modelId}`,
        warnings: [],
        performance_tier: "unusable",
        recommendations: ["Choose a model from the supported model list"],
        missing_requirements: ["model_definition"]
      }
    }

    const issues: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []
    const missingRequirements: string[] = []

    // Check memory requirements
    const memoryCheck = this.checkMemoryCompatibility(model, systemInfo)
    issues.push(...memoryCheck.issues)
    warnings.push(...memoryCheck.warnings)
    missingRequirements.push(...memoryCheck.missing)

    // Check CPU requirements
    const cpuCheck = this.checkCpuCompatibility(model, systemInfo)
    issues.push(...cpuCheck.issues)
    warnings.push(...cpuCheck.warnings)
    missingRequirements.push(...cpuCheck.missing)

    // Check Vulkan requirements
    const vulkanCheck = this.checkVulkanCompatibility(model, systemInfo)
    issues.push(...vulkanCheck.issues)
    warnings.push(...vulkanCheck.warnings)
    missingRequirements.push(...vulkanCheck.missing)

    // Check architecture compatibility
    const archCheck = this.checkArchitectureCompatibility(model, systemInfo)
    issues.push(...archCheck.issues)
    warnings.push(...archCheck.warnings)
    missingRequirements.push(...archCheck.missing)

    // Determine overall compatibility
    const compatible = issues.length === 0
    const performanceTier = this.calculatePerformanceTier(model, systemInfo, issues, warnings)
    const performanceEstimate = this.estimatePerformance(model, systemInfo)

    // Generate recommendations
    if (!compatible) {
      recommendations.push(...this.generateRecommendations(model, systemInfo, missingRequirements))
    }

    return {
      compatible,
      reason: compatible ? "Model is compatible with your system" : issues.join("; "),
      warnings,
      performance_tier: performanceTier,
      recommendations,
      missing_requirements: missingRequirements,
      performance_estimate: performanceEstimate
    }
  }

  /**
   * Check memory compatibility
   */
  private static checkMemoryCompatibility(model: ModelRequirements, systemInfo: SystemInfo) {
    const issues: string[] = []
    const warnings: string[] = []
    const missing: string[] = []

    // Check system memory
    if (systemInfo.totalMemory < model.memory.minimum) {
      issues.push(`Insufficient system memory: need ${this.formatBytes(model.memory.minimum)}, have ${this.formatBytes(systemInfo.totalMemory)}`)
      missing.push("system_memory")
    } else if (systemInfo.totalMemory < model.memory.recommended) {
      warnings.push(`Limited system memory: recommended ${this.formatBytes(model.memory.recommended)}, have ${this.formatBytes(systemInfo.totalMemory)}`)
    }

    // Check VRAM if Vulkan is available
    if (systemInfo.vulkan?.available && model.memory.vramMinimum) {
      const bestGPU = this.getBestGPU(systemInfo.vulkan.gpus)
      if (bestGPU && bestGPU.totalVRAM < model.memory.vramMinimum) {
        issues.push(`Insufficient VRAM: need ${this.formatBytes(model.memory.vramMinimum)}, have ${this.formatBytes(bestGPU.totalVRAM)}`)
        missing.push("vram")
      } else if (bestGPU && bestGPU.totalVRAM < (model.memory.vramRecommended || model.memory.vramMinimum * 2)) {
        warnings.push(`Limited VRAM: recommended ${this.formatBytes(model.memory.vramRecommended || model.memory.vramMinimum * 2)}, have ${this.formatBytes(bestGPU.totalVRAM)}`)
      }
    }

    return { issues, warnings, missing }
  }

  /**
   * Check CPU compatibility
   */
  private static checkCpuCompatibility(model: ModelRequirements, systemInfo: SystemInfo) {
    const issues: string[] = []
    const warnings: string[] = []
    const missing: string[] = []

    // Check core count
    if (systemInfo.cpu.coreCount < model.cpu.minCores) {
      issues.push(`Insufficient CPU cores: need ${model.cpu.minCores}, have ${systemInfo.cpu.coreCount}`)
      missing.push("cpu_cores")
    } else if (systemInfo.cpu.coreCount < model.cpu.recommendedCores) {
      warnings.push(`Limited CPU cores: recommended ${model.cpu.recommendedCores}, have ${systemInfo.cpu.coreCount}`)
    }

    // Check instruction sets
    const availableISA = new Set(systemInfo.cpu.instructionSets)
    
    for (const requiredISA of model.cpu.required_isa) {
      if (!availableISA.has(requiredISA)) {
        issues.push(`Missing required CPU instruction set: ${requiredISA}`)
        missing.push(`cpu_${requiredISA}`)
      }
    }

    const missingRecommendedISA = model.cpu.recommended_isa.filter(isa => !availableISA.has(isa))
    if (missingRecommendedISA.length > 0) {
      warnings.push(`Missing recommended CPU instruction sets: ${missingRecommendedISA.join(", ")}`)
    }

    return { issues, warnings, missing }
  }

  /**
   * Check Vulkan compatibility
   */
  private static checkVulkanCompatibility(model: ModelRequirements, systemInfo: SystemInfo) {
    const issues: string[] = []
    const warnings: string[] = []
    const missing: string[] = []

    if (!systemInfo.vulkan?.available) {
      if (model.vulkan.requires_gpu) {
        issues.push("Vulkan is required but not available on this system")
        missing.push("vulkan")
      } else {
        warnings.push("Vulkan is not available - will use CPU-only mode (slower)")
      }
      return { issues, warnings, missing }
    }

    // Check Vulkan version
    if (model.vulkan.minimum_version) {
      const bestGPU = this.getBestGPU(systemInfo.vulkan.gpus)
      if (bestGPU) {
        const requiredVersion = this.parseVersion(model.vulkan.minimum_version)
        const availableVersion = {
          major: bestGPU.apiVersionInfo.major,
          minor: bestGPU.apiVersionInfo.minor,
          patch: bestGPU.apiVersionInfo.patch
        }

        if (!this.isVersionCompatible(availableVersion, requiredVersion)) {
          issues.push(`Vulkan version too old: need ${model.vulkan.minimum_version}, have ${bestGPU.apiVersionInfo.string}`)
          missing.push("vulkan_version")
        }
      }
    }

    // Check GPU requirement
    if (model.vulkan.requires_gpu && systemInfo.vulkan.gpuCount === 0) {
      issues.push("Model requires GPU but no Vulkan-compatible GPU found")
      missing.push("gpu")
    }

    return { issues, warnings, missing }
  }

  /**
   * Check architecture compatibility
   */
  private static checkArchitectureCompatibility(model: ModelRequirements, systemInfo: SystemInfo) {
    const issues: string[] = []
    const warnings: string[] = []
    const missing: string[] = []

    if (!model.cpu.architecture.includes(systemInfo.arch)) {
      issues.push(`Unsupported architecture: ${systemInfo.arch} (supported: ${model.cpu.architecture.join(", ")})`)
      missing.push("architecture")
    }

    return { issues, warnings, missing }
  }

  /**
   * Calculate performance tier based on compatibility
   */
  private static calculatePerformanceTier(
    model: ModelRequirements, 
    systemInfo: SystemInfo, 
    issues: string[], 
    warnings: string[]
  ): "unusable" | "poor" | "fair" | "good" | "excellent" {
    if (issues.length > 0) return "unusable"
    
    const hasGPU = systemInfo.vulkan?.available && systemInfo.vulkan.gpuCount > 0
    const hasRecommendedMemory = systemInfo.totalMemory >= model.memory.recommended
    const hasRecommendedCPU = systemInfo.cpu.coreCount >= model.cpu.recommendedCores
    const hasRecommendedISA = model.cpu.recommended_isa.every(isa => 
      systemInfo.cpu.instructionSets.includes(isa)
    )

    if (hasGPU && hasRecommendedMemory && hasRecommendedCPU && hasRecommendedISA) {
      return "excellent"
    } else if (hasGPU && hasRecommendedMemory && hasRecommendedCPU) {
      return "good"
    } else if (hasGPU && hasRecommendedMemory) {
      return "fair"
    } else if (warnings.length <= 2) {
      return "fair"
    } else {
      return "poor"
    }
  }

  /**
   * Estimate performance metrics
   */
  private static estimatePerformance(model: ModelRequirements, systemInfo: SystemInfo) {
    const hasGPU = systemInfo.vulkan?.available && systemInfo.vulkan.gpuCount > 0
    const baseTPS = hasGPU ? model.performance.tokens_per_second.gpu : model.performance.tokens_per_second.cpu
    
    // Adjust based on system capabilities
    let performanceMultiplier = 1.0
    
    // Memory factor
    if (systemInfo.totalMemory < model.memory.recommended) {
      performanceMultiplier *= 0.7
    }
    
    // CPU factor
    if (systemInfo.cpu.coreCount < model.cpu.recommendedCores) {
      performanceMultiplier *= 0.8
    }
    
    // ISA factor
    const hasRecommendedISA = model.cpu.recommended_isa.every(isa => 
      systemInfo.cpu.instructionSets.includes(isa)
    )
    if (!hasRecommendedISA) {
      performanceMultiplier *= 0.6
    }

    const estimatedTPS = baseTPS * performanceMultiplier
    const memoryUsagePercent = (model.memory.minimum / systemInfo.totalMemory) * 100

    let bottleneck: "memory" | "cpu" | "gpu" | "none" = "none"
    if (systemInfo.totalMemory < model.memory.recommended) bottleneck = "memory"
    else if (systemInfo.cpu.coreCount < model.cpu.recommendedCores) bottleneck = "cpu"
    else if (!hasGPU && model.vulkan.requires_gpu) bottleneck = "gpu"

    return {
      tokens_per_second: estimatedTPS,
      memory_usage_percent: Math.min(memoryUsagePercent, 100),
      bottleneck
    }
  }

  /**
   * Generate recommendations for incompatible systems
   */
  private static generateRecommendations(
    model: ModelRequirements, 
    systemInfo: SystemInfo, 
    missingRequirements: string[]
  ): string[] {
    const recommendations: string[] = []

    if (missingRequirements.includes("system_memory")) {
      recommendations.push("Close other applications to free up memory")
      recommendations.push("Consider using a smaller model (e.g., Qwen 1.5B, Phi-3 Mini)")
    }

    if (missingRequirements.includes("vram")) {
      recommendations.push("Use CPU-only mode if available")
      recommendations.push("Consider a model with lower VRAM requirements")
    }

    if (missingRequirements.includes("cpu_cores")) {
      recommendations.push("Close background applications to free up CPU resources")
    }

    if (missingRequirements.some(req => req.startsWith("cpu_"))) {
      recommendations.push("Consider upgrading to a CPU with modern instruction sets (AVX2, NEON)")
    }

    if (missingRequirements.includes("vulkan")) {
      recommendations.push("Install or update Vulkan drivers")
      recommendations.push("Ensure your GPU supports Vulkan compute")
    }

    // Suggest alternative models
    const alternatives = this.getAlternativeModels(model, systemInfo)
    if (alternatives.length > 0) {
      recommendations.push(`Consider these compatible alternatives: ${alternatives.map(m => m.displayName).join(", ")}`)
    }

    return recommendations
  }

  /**
   * Get alternative models that are compatible
   */
  private static getAlternativeModels(model: ModelRequirements, systemInfo: SystemInfo) {
    // This would be implemented to suggest compatible alternatives
    // For now, return empty array
    return []
  }

  /**
   * Get the best GPU from available GPUs
   */
  private static getBestGPU(gpus: any[]) {
    if (!gpus || gpus.length === 0) return null
    
    // Prefer discrete GPUs with most VRAM
    return gpus.reduce((best, current) => {
      if (current.type === "discrete" && current.totalVRAM > (best?.totalVRAM || 0)) {
        return current
      }
      return best
    }, gpus[0])
  }

  /**
   * Parse version string into components
   */
  private static parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    }
  }

  /**
   * Check if available version meets minimum requirements
   */
  private static isVersionCompatible(
    available: { major: number; minor: number; patch: number },
    required: { major: number; minor: number; patch: number }
  ): boolean {
    if (available.major > required.major) return true
    if (available.major < required.major) return false
    if (available.minor > required.minor) return true
    if (available.minor < required.minor) return false
    return available.patch >= required.patch
  }

  /**
   * Format bytes into human readable string
   */
  private static formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`
  }
}