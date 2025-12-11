# AI/LLM Integration with ncnn-vulkan

This document describes the enhanced AI/LLM integration system that allows users to download and run AI/LLM models from Hugging Face without external inference engines.

## Overview

The ncnn-vulkan integration provides:

- **Local AI inference** without external dependencies
- **Vulkan GPU acceleration** with CPU fallback
- **Hardware compatibility checking** and model filtering
- **Automatic model detection** and requirements validation
- **Cross-platform support** (Windows, Linux, macOS)
- **Version-agnostic Vulkan** support (1.0+)

## System Requirements

### Minimum Requirements
- **RAM**: 4GB (for small models like Qwen 1.5B)
- **CPU**: x86_64 or ARM64 with basic instruction sets
- **Storage**: 2GB free space for models
- **OS**: Windows 10+, Linux, or macOS

### Recommended Requirements
- **RAM**: 16GB+ (for medium to large models)
- **CPU**: Modern CPU with AVX2/NEON instruction sets
- **GPU**: Vulkan-compatible GPU with 4GB+ VRAM
- **Vulkan**: 1.3+ (1.4+ recommended)

### Supported Instruction Sets

#### x86_64
- **Required**: AVX (for Phi-3 Mini and larger models)
- **Recommended**: AVX2, FMA, F16C
- **Advanced**: AVX512, AVX512-VNNI, AVX512-BF16

#### ARM64
- **Required**: NEON
- **Recommended**: ASIMDHP, ASIMDDP, ASIMDFHM
- **Advanced**: SVE, SVE2, SVEBF16

## Available Models

### Small Models (4GB+ RAM)
- **Qwen 1.5B**: 1.2GB, 32K context, multilingual
- **Phi-3 Mini**: 4.2GB, 4K context, high quality

### Medium Models (8GB+ RAM)
- **Llama 3 8B**: 8.5GB, 8K context, reasoning

### Large Models (24GB+ RAM)
- **Llama 3 70B**: 42GB, 8K context, advanced reasoning

### Multimodal Models
- **LLaVA 1.5 7B**: 8.7GB, vision+language

## Installation and Setup

### Prerequisites
```bash
# Required tools
- CMake 3.12+
- GCC/Clang or MSVC
- Python 3.8+
- Node.js 16+
- Vulkan SDK 1.3+ (optional but recommended)
```

### Build Process
```bash
# 1. Build ncnn-vulkan
npm run build:ncnn

# 2. Build Node.js binding
npm run build:all

# 3. Test installation
node -e "require('./ncnn-binding/')"
```

### Windows Setup with MinGW
The build system is configured to work with MinGW without Visual Studio:

1. Install MinGW-w64
2. Install CMake
3. Install Vulkan SDK (optional)
4. Run build commands above

## Usage

### System Information
```bash
# Check system capabilities
system_info

# Detailed system information
system_info --detailed
```

### Model Management
```bash
# Download a model with compatibility checking
hf_gguf_download --model-id "microsoft/Phi-3-mini-4k-instruct-gguf" --filename "phi-3-mini-4k-instruct-q4.gguf" --model-type "phi-3-mini"

# Analyze a downloaded model
hf_gguf_analyze --model-path "models/gguf/phi-3-mini-4k-instruct-q4.gguf"

# Analyze with automatic model type detection
hf_gguf_analyze --model-path "models/gguf/llama-3-8b-q4.gguf"
```

### Compatibility Checking
The system automatically checks:

- **Memory requirements** (RAM and VRAM)
- **CPU instruction sets** (AVX2, NEON, etc.)
- **Vulkan availability** and version
- **Architecture compatibility** (x86_64, ARM64)

### Performance Tiers

| Tier | Description | Typical Performance |
|------|-------------|-------------------|
| **Excellent** | Modern hardware with GPU | 15-25 tokens/sec |
| **Good** | Decent hardware, some limitations | 8-15 tokens/sec |
| **Fair** | Older hardware, CPU-only | 3-8 tokens/sec |
| **Poor** | Minimal hardware, significant limits | 1-3 tokens/sec |
| **Unusable** | Doesn't meet requirements | N/A |

## Configuration

### Model Requirements Database
Models are defined in `src/provider/model-database.ts` with:

```typescript
{
  id: "model-id",
  displayName: "Model Name",
  memory: {
    minimum: bytes,
    recommended: bytes,
    vramMinimum: bytes,
    vramRecommended: bytes
  },
  cpu: {
    architecture: ["x86_64", "arm64"],
    required_isa: ["avx2"],
    recommended_isa: ["avx2", "fma", "f16c"],
    minCores: 4,
    recommendedCores: 8
  },
  vulkan: {
    minimum_version: "1.2",
    required_extensions: ["VK_KHR_push_descriptor"],
    optional_extensions: ["VK_KHR_maintenance1"],
    requires_gpu: true
  }
}
```

### Hardware Detection
The system detects:

- **Platform**: Windows, Linux, macOS
- **Architecture**: x86_64, ARM64, etc.
- **CPU cores** and instruction sets
- **Memory**: Total and available RAM
- **GPU**: Vulkan-compatible devices, VRAM, drivers
- **Vulkan version** and extensions

## Troubleshooting

### Build Issues

#### "Vulkan SDK not found"
- Install Vulkan Runtime from LunarG
- Set VULKAN_SDK environment variable
- Build without Vulkan (CPU-only mode)

#### "ncnn library not found"
- Run `npm run build:ncnn` first
- Check build directory for libncnn.a/libncnn.lib
- Verify CMake completed successfully

#### "Node.js binding build failed"
- Check node-gyp installation: `npm install -g node-gyp`
- Verify C++ compiler is available
- Check library paths in binding.gyp

### Runtime Issues

#### "Model not compatible"
- Check system requirements with `system_info`
- Try smaller models (Qwen 1.5B, Phi-3 Mini)
- Verify Vulkan drivers are up to date

#### "Vulkan not available"
- Install/update GPU drivers
- Install Vulkan Runtime
- Check GPU compatibility with Vulkan Hardware Database

#### "Poor performance"
- Ensure GPU acceleration is working
- Check if model matches hardware capabilities
- Consider using quantized models (Q4_K_M)

## Architecture

### Components

1. **Hardware Detection** (`src/ncnn-binding/src/hardware_wrap.cc`)
   - CPU instruction set detection via ncnn's ruapu library
   - Memory detection via platform APIs
   - Vulkan GPU enumeration and capabilities

2. **Model Database** (`src/provider/model-database.ts`)
   - Pre-defined model requirements
   - Performance characteristics
   - Compatibility metadata

3. **Compatibility Checker** (`src/provider/compatibility-checker.ts`)
   - System vs requirements matching
   - Performance tier calculation
   - Recommendation generation

4. **Tools Integration**
   - `hf_gguf_download`: Download with compatibility checking
   - `hf_gguf_analyze`: Model analysis and system assessment
   - `system_info`: Hardware capabilities display

### Data Flow

```
User Request → Compatibility Check → Model Download → Analysis → Inference
     ↓                    ↓                ↓           ↓
System Detection → Requirements Match → File Validation → GPU/CPU Execution
```

## Future Enhancements

### Planned Features
- [ ] Dynamic model loading from Hugging Face API
- [ ] Automatic quantization support
- [ ] Multi-GPU support
- [ ] Model streaming for large models
- [ ] Performance benchmarking
- [ ] GUI model manager

### Extensibility
The system is designed to be extensible:

- **New Models**: Add to model-database.ts
- **New Architectures**: Extend CPU detection
- **New Platforms**: Add platform-specific code
- **New Tools**: Implement Tool interface

## Security and Privacy

- **Local Inference**: All processing happens locally
- **No Data Transmission**: Models run without internet access
- **Privacy Preserving**: No data sent to external services
- **User Control**: Complete control over model selection and usage

## Performance Optimization

### GPU Acceleration
- Uses Vulkan compute shaders for parallel processing
- Automatic GPU selection and memory management
- Fallback to CPU if GPU unavailable

### CPU Optimization
- Runtime instruction set dispatch
- Multi-threading support
- Memory-efficient quantization

### Memory Management
- KV cache optimization
- Memory pooling
- Garbage collection minimization

This integration provides a complete, self-contained AI/LLM inference system that works across different hardware configurations while maintaining high performance and user privacy.