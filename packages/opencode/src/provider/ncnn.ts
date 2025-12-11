import type {
    LanguageModelV2,
    LanguageModelV2CallWarning,
    LanguageModelV2FinishReason,
    LanguageModelV2StreamPart,
} from "@ai-sdk/provider"
import { createRequire } from "node:module"

// Use createRequire to import the CJS binding
const require = createRequire(import.meta.url)
let binding: any
try {
    binding = require("../ncnn-binding")
} catch (e) {
    console.warn("Failed to load ncnn-binding:", e)
}

export interface NcnnConfig {
    modelPath: string
    gpuLayers?: number
    contextLength?: number
}

export class NcnnLanguageModel implements LanguageModelV2 {
    readonly specificationVersion = "v2"
    readonly defaultObjectGenerationMode = "json"
    readonly provider = "ncnn"
    readonly modelId: string
    readonly supportedUrls = {}

    private config: NcnnConfig
    private engine: any = null

    constructor(modelId: string, config: NcnnConfig) {
        this.modelId = modelId
        this.config = config
    }

    private getEngine() {
        if (this.engine) return this.engine
        if (!binding) throw new Error("ncnn-binding is not available")
        this.engine = new binding.LLMEngine()
        return this.engine
    }

    async doGenerate(options: any) {
        const engine = this.getEngine()

        let prompt = ""
        if (options.inputFormat === "prompt") {
            prompt = options.input.map((c: any) => c.text).join("")
        } else {
            prompt = options.prompt
                .map((m: any) => {
                    const text = m.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("")
                    return `${m.role}: ${text}`
                })
                .join("\n") + "\nassistant:"
        }

        try {
            await engine.loadModel(this.config.modelPath)
        } catch (e) {
            throw new Error(`Failed to load model at ${this.config.modelPath}: ${e}`)
        }

        const text: string = await engine.generateText(prompt, {
            maxTokens: 1024,
            temperature: 0.7
        })

        return {
            content: [{ type: "text" as const, text }],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            finishReason: "stop" as LanguageModelV2FinishReason,
            warnings: [] as LanguageModelV2CallWarning[]
        }
    }

    async doStream(options: any) {
        const result = await this.doGenerate(options)

        const stream = new ReadableStream<LanguageModelV2StreamPart>({
            start(controller) {
                if (result.content && result.content[0]?.type === "text") {
                    controller.enqueue({ type: "text-delta", delta: result.content[0].text, id: "0" })
                }
                controller.enqueue({
                    type: "finish",
                    finishReason: result.finishReason,
                    usage: result.usage,
                })
                controller.close()
            },
        })

        return {
            stream,
            rawCall: { rawPrompt: null, rawSettings: {} },
        }
    }
}

export interface NcnnProvider {
    (modelId: string): NcnnLanguageModel
    languageModel(modelId: string): NcnnLanguageModel
}

export function createNcnn(config: NcnnConfig): NcnnProvider {
    const createModel = (modelId: string) => new NcnnLanguageModel(modelId, config)

    const provider = function (modelId: string) {
        return createModel(modelId)
    }

    provider.languageModel = createModel
    return provider
}
