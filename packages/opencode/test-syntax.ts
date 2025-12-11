// Simple test to verify TypeScript syntax
import { ModelRequirements } from "./src/provider/model-requirements"
import { CompatibilityChecker } from "./src/provider/compatibility-checker"

console.log("TypeScript imports successful")

// Test basic compatibility checking
const testSystemInfo = {
  platform: "Windows",
  arch: "x86_64", 
  totalMemory: 16 * 1024 * 1024 * 1024,
  availableMemory: 12 * 1024 * 1024 * 1024,
  cpu: {
    coreCount: 8,
    instructionSets: ["avx2", "fma", "f16c"]
  },
  vulkan: {
    available: true,
    gpuCount: 1,
    gpus: [{
      deviceIndex: 0,
      deviceName: "Test GPU",
      vendorId: 0x10de,
      deviceId: 0x1234,
      type: "discrete",
      totalVRAM: 8 * 1024 * 1024 * 1024,
      apiVersionInfo: {
        major: 1,
        minor: 3,
        patch: 0,
        string: "1.3.0"
      },
      compatibilityLevel: "full"
    }]
  }
}

const result = CompatibilityChecker.checkCompatibility("phi-3-mini", testSystemInfo)
console.log("Compatibility check result:", result)