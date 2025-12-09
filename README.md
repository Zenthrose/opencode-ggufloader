# OpenCode GGUF Loader

An AI-powered tool for loading and running GGUF models with Vulkan-accelerated inference, integrated into the OpenCode development environment.

## Overview

OpenCode GGUF Loader is a comprehensive project that combines several technologies to enable efficient AI model loading and inference:

- **OpenCode**: An interactive CLI tool for software engineering tasks, providing AI-assisted coding, debugging, and project management. Built with a focus on terminal UI and supporting multiple AI providers.
- **ncnn**: A high-performance neural network inference framework optimized for mobile and embedded devices, supporting both CPU and GPU acceleration through Vulkan.
- **Vulkan**: A low-level graphics and compute API that enables GPU acceleration for high-performance computing tasks, providing cross-platform GPU support.
- **ncnn-binding**: A Node.js N-API binding that bridges JavaScript applications (like OpenCode) with ncnn's C++ inference capabilities, enabling GGUF model loading and execution.

The project integrates these components to allow OpenCode to load and run GGUF (GPT-Generated Unified Format) models with hardware acceleration, enabling advanced AI features within the development workflow.

## Architecture

```
OpenCode (CLI Tool)
    ↓
ncnn-binding (Node.js N-API)
    ↓
ncnn (Inference Engine)
    ↓
Vulkan (GPU Acceleration)
```

## Features

- **GGUF Model Support**: Load and run GGUF-formatted AI models for various tasks
- **Vulkan GPU Acceleration**: Leverage GPU hardware for faster inference and better performance
- **Node.js Integration**: Seamless JavaScript/TypeScript integration with native performance
- **Cross-Platform**: Windows, Linux, and macOS support with Vulkan compatibility
- **High Performance**: Optimized for real-time AI tasks in development environments
- **Open Source**: 100% open source with community-driven development

## Build Process

⚠️ **Important Note**: The current build process is extremely complex due to the integration of multiple native libraries, cross-compilation requirements, Vulkan SDK dependencies, and the need for multiple build retries due to compilation timeouts. Plans are actively in process to simplify this with automated build scripts, Docker containers, and improved tooling to make the setup more accessible.

### Prerequisites

- Node.js >= 16.0.0
- CMake >= 3.12
- Ninja build system
- MSYS2 (Windows) or equivalent toolchain (Linux/macOS)
- Vulkan SDK (latest version)
- Git
- Python (for some build scripts)

### Build Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Zenthrose/opencode-ggufloader.git
   cd opencode-ggufloader
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Vulkan SDK**
   - Download and install Vulkan SDK from https://vulkan.lunarg.com/sdk/home
   - Ensure Vulkan libraries are in PATH

4. **Build ncnn with Vulkan support**
   - This involves compiling ncnn with Vulkan acceleration
   - Complex process requiring Vulkan SDK configuration
   - May require multiple build attempts due to compilation timeouts
   - Involves setting up include paths and library linking

5. **Build the Node.js binding**
   - Compiles the N-API binding that connects Node.js to ncnn
   - Links ncnn libraries with Node.js runtime
   - Generates native addon for JavaScript use

6. **Run OpenCode with GGUF loading**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

## Usage

Once built, the GGUF loader integrates seamlessly with OpenCode for AI-assisted development:

```javascript
const { loadGGUFModel } = require("@opencode-ai/ncnn-binding")

// Load a GGUF model for AI tasks
const model = await loadGGUFModel("path/to/model.gguf")

// Use in development workflow
const codeSuggestions = await model.generateCode(context)
const bugAnalysis = await model.analyzeCode(codeSnippet)
```

## Project Components

### OpenCode Core

- Terminal-based AI coding assistant
- Supports multiple AI providers (Claude, OpenAI, Google, local models)
- LSP integration for enhanced coding experience
- Client/server architecture for remote access

### ncnn Integration

- High-performance neural network inference
- Vulkan backend for GPU acceleration
- Optimized for embedded and mobile devices
- Supports various model formats including GGUF

### Vulkan Acceleration

- Cross-platform GPU compute API
- Hardware-accelerated inference
- Better performance for large models
- Future-proof with modern GPU support

### Node.js Binding

- N-API based native addon
- Seamless JavaScript integration
- Memory-efficient data transfer
- Asynchronous operation support

## Contributing

We welcome contributions to simplify the build process and improve the integration!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (especially build process)
5. Submit a pull request

### Areas for Improvement

- Build script automation
- Docker containerization
- Cross-platform build standardization
- Documentation improvements
- Performance optimizations

## Development Setup

For developers working on the integration:

```bash
# Install development dependencies
npm install

# Build in development mode
npm run build

# Run tests
npm test

# Type checking
npm run typecheck
```

## Troubleshooting

### Common Build Issues

- **Vulkan SDK not found**: Ensure Vulkan SDK is installed and in PATH
- **Compilation timeouts**: The build may timeout; retry the same command
- **Missing dependencies**: Check CMake, Ninja, and compiler versions
- **Node.js version**: Ensure Node.js >= 16.0.0

### Performance Tips

- Use SSD for faster compilation
- Increase RAM if possible
- Consider using `-j 1` for more stable builds

## License

MIT License - see LICENSE file for details

## Credits and Acknowledgments

### OpenCode Team

This project builds upon the OpenCode framework, an AI coding agent built for the terminal. Special thanks to the OpenCode team for their open source license agreement that enabled this integration.

### Integration by Zenthrose

The integration of OpenCode, ncnn, Vulkan, and the Node.js binding was implemented by Zenthrose, combining these technologies to create a seamless GGUF loading experience within the OpenCode development environment.

### ncnn Framework

This project would not be possible without the excellent ncnn framework developed by the Tencent team. ncnn provides the high-performance neural network inference capabilities that power the GPU-accelerated model loading.

- **ncnn Repository**: https://github.com/Tencent/ncnn
- **License**: Apache 2.0

## Future Plans

- **Simplified Build Process**: Automated scripts and Docker support
- **Enhanced Performance**: Further Vulkan optimizations
- **Model Format Support**: Expand beyond GGUF
- **Mobile Support**: iOS/Android integration
- **Web Integration**: Browser-based model loading
- **Plugin Architecture**: Extensible AI capabilities

## Community

- **Discord**: Join our community at https://opencode.ai/discord
- **Documentation**: Full docs at https://opencode.ai/docs
- **Issues**: Report bugs and request features on GitHub

---

**Built with ❤️ by the OpenCode team and integrated by Zenthrose**
