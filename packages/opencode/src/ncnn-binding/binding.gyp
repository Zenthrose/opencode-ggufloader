{
  "targets": [
    {
      "target_name": "ncnn_binding",
      "sources": [
        "src/binding.cc",
        "src/llm_engine_wrap.cc",
        "src/hardware_wrap.cc",
        "ncnn/allocator.cpp",
        "ncnn/benchmark.cpp",
        "ncnn/blob.cpp",
        "ncnn/command.cpp",
        "ncnn/cpu.cpp",
        "ncnn/datareader.cpp",
        "ncnn/expression.cpp",
        "ncnn/gguf.cpp",
        "ncnn/gpu.cpp",
        "ncnn/layer.cpp",
        "ncnn/llm_engine.cpp",
        "ncnn/mat.cpp",
        "ncnn/mat_pixel.cpp",
        "ncnn/mat_pixel_affine.cpp",
        "ncnn/mat_pixel_drawing.cpp",
        "ncnn/mat_pixel_resize.cpp",
        "ncnn/mat_pixel_rotate.cpp",
        "ncnn/modelbin.cpp",
        "ncnn/net.cpp",
        "ncnn/option.cpp",
        "ncnn/paramdict.cpp",
        "ncnn/pipeline.cpp",
        "ncnn/pipelinecache.cpp",
        "ncnn/simplemath.cpp",
        "ncnn/simpleocv.cpp",
        "ncnn/simpleomp.cpp",
        "ncnn/simplestl.cpp",
        "ncnn/simplevk.cpp",
        "ncnn/tokenizer.cpp",
        "ncnn/layer/concat.cpp",
        "ncnn/layer/innerproduct.cpp",
        "ncnn/layer/matmul.cpp",
        "ncnn/layer/rmsnorm.cpp",
        "ncnn/layer/softmax.cpp",
        "ncnn/layer/reshape.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "ncnn"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "NCNN_VULKAN=ON",
        "NCNN_SIMPLEVK=1"
      ],
      "cflags": [
        "-std=c++11",
        "-fexceptions"
      ],
      "cflags_cc": [
        "-std=c++11",
        "-fexceptions"
      ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [
            "vulkan-1.lib"
          ],
          "include_dirs": [
            "ncnn",
            "$(VULKAN_SDK)/Include"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/arch:AVX2"]
            }
          },
          "defines": [
            "WIN32_LEAN_AND_MEAN",
            "NOMINMAX"
          ]
        }],
        ["OS=='linux'", {
          "libraries": [
            "-lvulkan"
          ],
          "include_dirs": [
            "ncnn"
          ]
        }],
        ["OS=='mac'", {
          "libraries": [
            "-lvulkan"
          ],
          "include_dirs": [
            "ncnn"
          ],
          "xcode_settings": {
            "OTHER_CFLAGS": [
              "-std=c++11",
              "-fexceptions"
            ]
          }
        }]
      ]
    }
  ]
}