#include "llm_engine.h"
#include "layer.h"
#include "mat.h"
#include "option.h"
#include <algorithm>
#include <random>
#include <cmath>

namespace ncnn {

class InnerProduct {
public:
    Mat weight_data;
    Mat bias_data;
    int forward(const Mat& bottom_blob, Mat& top_blob, const Option& /* opt */) const {
        int w = bottom_blob.w;
        int h = bottom_blob.h;
        int channels = weight_data.h;
        top_blob.create(channels, h);
        for (int i = 0; i < h; i++) {
            for (int j = 0; j < channels; j++) {
                float sum = 0;
                for (int k = 0; k < w; k++) {
                    sum += bottom_blob.row(i)[k] * weight_data.row(j)[k];
                }
                if (!bias_data.empty()) sum += bias_data[j];
                top_blob.row(i)[j] = sum;
            }
        }
        return 0;
    }
};

// Rotary Position Embedding (RoPE) module
class RoPEModule {
public:
    int forward(const Mat& bottom_blob, Mat& top_blob, int pos_base, const Option& /* opt */) const {
        int seq_len = bottom_blob.h;
        int dim = bottom_blob.w;
        int half = dim / 2;
        top_blob.create(dim, seq_len);
        
        for (int i = 0; i < seq_len; i++) {
            const float* src = bottom_blob.row(i);
            float* dst = top_blob.row(i);
            int pos = pos_base + i;
            
            for (int j = 0; j < half; j++) {
                float theta = powf(10000.0f, -2.0f * j / (float)dim);
                float cos_t = cosf(pos * theta);
                float sin_t = sinf(pos * theta);
                dst[2*j] = src[2*j] * cos_t - src[2*j+1] * sin_t;
                dst[2*j+1] = src[2*j] * sin_t + src[2*j+1] * cos_t;
            }
        }
        return 0;
    }
};

class LayerNorm {
public:
    bool affine = false;
    Mat weight_data;
    Mat bias_data;
    float eps = 1e-5f;
    int forward(const Mat& bottom_blob, Mat& top_blob, const Option& /* opt */) const {
        int w = bottom_blob.w;
        int h = bottom_blob.h;
        top_blob.create(w, h);
        for (int i = 0; i < h; i++) {
            const float* src = bottom_blob.row(i);
            float* dst = top_blob.row(i);
            float mean = 0;
            for (int j = 0; j < w; j++) mean += src[j];
            mean /= w;
            float var = 0;
            for (int j = 0; j < w; j++) var += (src[j] - mean) * (src[j] - mean);
            var /= w;
            float scale = 1.0f / sqrt(var + eps);
            for (int j = 0; j < w; j++) {
                dst[j] = (src[j] - mean) * scale;
                if (affine) {
                    dst[j] = dst[j] * weight_data[j] + bias_data[j];
                }
            }
        }
        return 0;
    }
};

LLMEngine::LLMEngine()
    : n_layers(0), n_head(0), n_kv_head(0), hidden_size(0), vocab_size(0), max_seq_len(0)
{
}

LLMEngine::~LLMEngine()
{
}

bool LLMEngine::load_model(const std::string& model_path)
{
    if (!loader.load(model_path.c_str())) {
        return false;
    }

    if (!tokenizer.load_from_gguf(loader.get_kv_strings(), loader.get_kv_string_arrays())) {
        return false;
    }

    if (!load_weights()) {
        return false;
    }

    if (!detect_architecture()) {
        return false;
    }

    // Initialize KV cache
    key_cache.resize(n_layers);
    value_cache.resize(n_layers);

    return true;
}

bool LLMEngine::load_weights()
{
    for (auto& p : loader.get_tensor_map()) {
        weights[p.first] = dequant_gguf_tensor(p.second, loader.get_file_data());
    }
    return true;
}

bool LLMEngine::detect_architecture()
{
    auto& kv_strings = loader.get_kv_strings();
    auto& kv_ints = loader.get_kv_ints();

    // Try to detect architecture from metadata
    auto arch_it = kv_strings.find("general.architecture");
    if (arch_it != kv_strings.end()) {
        architecture = arch_it->second;
    } else {
        // Fallback: try common prefixes
        if (weights.count("phi3.embed_tokens")) {
            architecture = "phi3";
        } else if (weights.count("model.embed_tokens")) {
            architecture = "llama";
        } else if (weights.count("transformer.wte")) {
            architecture = "gpt2";
        } else {
            return false;
        }
    }

    // Load common parameters
    if (architecture == "phi3") {
        n_layers = kv_ints.at("phi3.block_count");
        n_head = kv_ints.at("phi3.attention.head_count");
        n_kv_head = kv_ints.at("phi3.attention.head_count_kv");
        hidden_size = kv_ints.at("phi3.embedding_length");
        vocab_size = kv_ints.at("phi3.vocab_size");
    } else if (architecture == "llama") {
        n_layers = kv_ints.at("llama.block_count");
        n_head = kv_ints.at("llama.attention.head_count");
        n_kv_head = kv_ints.at("llama.attention.head_count_kv");
        hidden_size = kv_ints.at("llama.embedding_length");
        vocab_size = kv_ints.at("llama.vocab_size");
    } else if (architecture == "gpt2") {
        n_layers = kv_ints.at("gpt2.n_layer");
        n_head = kv_ints.at("gpt2.n_head");
        n_kv_head = n_head; // GPT-2 uses same for KV
        hidden_size = kv_ints.at("gpt2.n_embd");
        vocab_size = kv_ints.at("gpt2.vocab_size");
    } else if (architecture == "mistral") {
        n_layers = kv_ints.at("mistral.block_count");
        n_head = kv_ints.at("mistral.attention.head_count");
        n_kv_head = kv_ints.at("mistral.attention.head_count_kv");
        hidden_size = kv_ints.at("mistral.embedding_length");
        vocab_size = kv_ints.at("mistral.vocab_size");
    } else if (architecture == "qwen2") {
        n_layers = kv_ints.at("qwen2.block_count");
        n_head = kv_ints.at("qwen2.attention.head_count");
        n_kv_head = kv_ints.at("qwen2.attention.head_count_kv");
        hidden_size = kv_ints.at("qwen2.embedding_length");
        vocab_size = kv_ints.at("qwen2.vocab_size");
    }

    max_seq_len = 2048; // Default, could be loaded from metadata

    return true;
}

std::vector<int> LLMEngine::generate(const std::string& prompt, const GenerationConfig& config)
{
    std::vector<int> tokens = tokenizer.encode(prompt);
    if (tokenizer.bos_token() >= 0) {
        tokens.insert(tokens.begin(), tokenizer.bos_token());
    }

    std::vector<int> generated;
    std::vector<int> history = tokens;

    for (int i = 0; i < config.max_tokens; ++i) {
        Mat logits = forward(history);

        float* last_logits = logits.row(logits.h - 1);
        int next_token = sample_token(last_logits, config, history);

        generated.push_back(next_token);
        history.push_back(next_token);

        // Check stop conditions
        if (std::find(config.stop_tokens.begin(), config.stop_tokens.end(), next_token) != config.stop_tokens.end()) {
            break;
        }
        if (tokenizer.eos_token() >= 0 && next_token == tokenizer.eos_token()) {
            break;
        }
    }

    return generated;
}

std::string LLMEngine::generate_text(const std::string& prompt, const GenerationConfig& config)
{
    std::vector<int> tokens = generate(prompt, config);
    return tokenizer.decode(tokens);
}

Mat LLMEngine::forward(const std::vector<int>& tokens)
{
    if (architecture == "phi3") {
        return forward_phi3(tokens);
    } else if (architecture == "llama") {
        return forward_llama(tokens);
    } else if (architecture == "gpt2") {
        return forward_gpt2(tokens);
    } else if (architecture == "mistral") {
        return forward_mistral(tokens);
    } else if (architecture == "qwen2") {
        return forward_qwen(tokens);
    } else {
        // Fallback
        return forward_phi3(tokens);
    }
}

Mat LLMEngine::forward_phi3(const std::vector<int>& tokens)
{
    Option opt;
    opt.use_vulkan_compute = true;

    // Determine embedding prefix
    std::string embed_prefix = architecture == "phi3" ? "phi3.embed_tokens" :
                              architecture == "llama" ? "model.embed_tokens" :
                              architecture == "gpt2" ? "transformer.wte" :
                              architecture == "mistral" ? "model.embed_tokens" :
                              architecture == "qwen2" ? "model.embed_tokens" :
                              "phi3.embed_tokens";

    Mat x(hidden_size, tokens.size());
    for (size_t i = 0; i < tokens.size(); i++) {
        memcpy(x.row(i), weights[embed_prefix].row(tokens[i]), hidden_size * sizeof(float));
    }

    for (int l = 0; l < n_layers; l++) {
        x = forward_layer(l, x, 0);
    }

    // Final layer norm
    LayerNorm final_norm;
    final_norm.affine = true;
    final_norm.eps = 1e-5f;
    std::string final_norm_prefix = architecture == "phi3" ? "phi3.norm" :
                                   architecture == "llama" ? "model.norm" :
                                   architecture == "gpt2" ? "transformer.ln_f" :
                                   architecture == "mistral" ? "model.norm" :
                                   architecture == "qwen2" ? "model.norm" :
                                   "phi3.norm";
    final_norm.weight_data = weights[final_norm_prefix + ".weight"];
    auto final_bias_it = weights.find(final_norm_prefix + ".bias");
    if (final_bias_it != weights.end()) {
        final_norm.bias_data = final_bias_it->second;
    }
    Mat norm_x;
    final_norm.forward(x, norm_x, opt);

    // Language model head
    InnerProduct lm_head;
    lm_head.weight_data = weights["lm_head.weight"];
    final_bias_it = weights.find("lm_head.bias");
    if (final_bias_it != weights.end()) {
        lm_head.bias_data = final_bias_it->second;
    }
    Mat logits(vocab_size, tokens.size());
    lm_head.forward(norm_x, logits, opt);

    return logits;
}

Mat LLMEngine::forward_layer(int layer_idx, const Mat& x, int start_pos)
{
    Option opt;
    opt.use_vulkan_compute = true;

    // Determine weight prefix based on architecture
    std::string prefix;
    std::string attn_prefix;
    if (architecture == "phi3") {
        prefix = "phi3.layers." + std::to_string(layer_idx);
        attn_prefix = prefix + ".self_attn";
    } else if (architecture == "llama") {
        prefix = "model.layers." + std::to_string(layer_idx);
        attn_prefix = prefix + ".self_attn";
    } else if (architecture == "gpt2") {
        prefix = "transformer.h." + std::to_string(layer_idx);
        attn_prefix = prefix + ".attn";
    } else if (architecture == "mistral") {
        prefix = "model.layers." + std::to_string(layer_idx);
        attn_prefix = prefix + ".self_attn";
    } else if (architecture == "qwen2") {
        prefix = "model.layers." + std::to_string(layer_idx);
        attn_prefix = prefix + ".self_attn";
    } else {
        prefix = "phi3.layers." + std::to_string(layer_idx);
        attn_prefix = prefix + ".self_attn";
    }

    // Input layer norm
    LayerNorm norm;
    norm.affine = true;
    norm.eps = 1e-5f;
    norm.weight_data = weights[prefix + ".input_layernorm.weight"];
    auto bias_it = weights.find(prefix + ".input_layernorm.bias");
    if (bias_it != weights.end()) {
        norm.bias_data = bias_it->second;
    }
    Mat norm_out;
    norm.forward(x, norm_out, opt);

    // Attention mechanism
    // Project Q, K, V
    InnerProduct ip_q;
    ip_q.weight_data = weights[attn_prefix + ".q_proj.weight"];
    bias_it = weights.find(attn_prefix + ".q_proj.bias");
    if (bias_it != weights.end()) {
        ip_q.bias_data = bias_it->second;
    }
    Mat q;
    ip_q.forward(norm_out, q, opt);

    InnerProduct ip_k;
    ip_k.weight_data = weights[attn_prefix + ".k_proj.weight"];
    bias_it = weights.find(attn_prefix + ".k_proj.bias");
    if (bias_it != weights.end()) {
        ip_k.bias_data = bias_it->second;
    }
    Mat k;
    ip_k.forward(norm_out, k, opt);

    InnerProduct ip_v;
    ip_v.weight_data = weights[attn_prefix + ".v_proj.weight"];
    bias_it = weights.find(attn_prefix + ".v_proj.bias");
    if (bias_it != weights.end()) {
        ip_v.bias_data = bias_it->second;
    }
    Mat v;
    ip_v.forward(norm_out, v, opt);

    // Multi-head attention with GQA support
    // For GQA: multiple query heads share the same key/value head
    int head_dim = hidden_size / n_head;
    int seq_len = x.h;
    Mat attn_out(hidden_size, seq_len);
    int num_heads_per_kv = n_head / n_kv_head;
    
    RoPEModule rope;
    
    for (int h = 0; h < n_head; h++) {
        int kv_head_idx = h / num_heads_per_kv;  // Which KV head to use for this query head
        int offset = h * head_dim;
        int kv_offset = kv_head_idx * head_dim;  // KV heads use same dimension per head
        
        // Extract query head
        Mat q_h(head_dim, seq_len);
        for (int s = 0; s < seq_len; s++) {
            memcpy(q_h.row(s), q.row(s) + offset, head_dim * sizeof(float));
        }
        
        // Extract key/value head (shared across multiple query heads in GQA)
        Mat k_h(head_dim, seq_len);
        Mat v_h(head_dim, seq_len);
        for (int s = 0; s < seq_len; s++) {
            memcpy(k_h.row(s), k.row(s) + kv_offset, head_dim * sizeof(float));
            memcpy(v_h.row(s), v.row(s) + kv_offset, head_dim * sizeof(float));
        }

        // Apply RoPE
        Mat q_rot, k_rot;
        rope.forward(q_h, q_rot, start_pos, opt);
        rope.forward(k_h, k_rot, start_pos, opt);

        // Compute attention scores: Q @ K^T / sqrt(head_dim)
        Mat scores(seq_len, seq_len);
        for (int i = 0; i < seq_len; i++) {
            for (int j = 0; j < seq_len; j++) {
                float dot = 0;
                for (int d = 0; d < head_dim; d++) {
                    dot += q_rot.row(i)[d] * k_rot.row(j)[d];
                }
                scores.row(i)[j] = dot / sqrtf((float)head_dim);
            }
        }

        // Apply causal mask (for autoregressive generation)
        for (int i = 0; i < seq_len; i++) {
            for (int j = i + 1; j < seq_len; j++) {
                scores.row(i)[j] = -1e9f;
            }
        }

        // Softmax
        for (int i = 0; i < seq_len; i++) {
            float max_val = *std::max_element(scores.row(i), scores.row(i) + seq_len);
            float sum = 0;
            for (int j = 0; j < seq_len; j++) {
                scores.row(i)[j] = expf(scores.row(i)[j] - max_val);
                sum += scores.row(i)[j];
            }
            for (int j = 0; j < seq_len; j++) {
                scores.row(i)[j] /= sum;
            }
        }

        // Apply attention to values: scores @ V
        Mat out_h(head_dim, seq_len);
        for (int i = 0; i < seq_len; i++) {
            for (int d = 0; d < head_dim; d++) {
                float val = 0;
                for (int j = 0; j < seq_len; j++) {
                    val += scores.row(i)[j] * v_h.row(j)[d];
                }
                out_h.row(i)[d] = val;
            }
        }

        // Concatenate heads
        for (int s = 0; s < seq_len; s++) {
            memcpy(attn_out.row(s) + offset, out_h.row(s), head_dim * sizeof(float));
        }
    }

    // Output projection
    InnerProduct ip_o;
    ip_o.weight_data = weights[attn_prefix + ".o_proj.weight"];
    bias_it = weights.find(attn_prefix + ".o_proj.bias");
    if (bias_it != weights.end()) {
        ip_o.bias_data = bias_it->second;
    }
    Mat attn_proj;
    ip_o.forward(attn_out, attn_proj, opt);

    // Residual connection
    Mat res(x.w, x.h);
    for (size_t i = 0; i < x.total(); i++) {
        res[i] = x[i] + attn_proj[i];
    }

    // MLP
    LayerNorm post_norm;
    post_norm.affine = true;
    post_norm.eps = 1e-5f;
    post_norm.weight_data = weights[prefix + ".post_attention_layernorm.weight"];
    bias_it = weights.find(prefix + ".post_attention_layernorm.bias");
    if (bias_it != weights.end()) {
        post_norm.bias_data = bias_it->second;
    }
    Mat post_norm_out;
    post_norm.forward(res, post_norm_out, opt);

    // MLP with SiLU activation
    InnerProduct gate;
    gate.weight_data = weights[prefix + ".mlp.gate_proj.weight"];
    bias_it = weights.find(prefix + ".mlp.gate_proj.bias");
    if (bias_it != weights.end()) {
        gate.bias_data = bias_it->second;
    }
    Mat gate_out;
    gate.forward(post_norm_out, gate_out, opt);

    InnerProduct up;
    up.weight_data = weights[prefix + ".mlp.up_proj.weight"];
    bias_it = weights.find(prefix + ".mlp.up_proj.bias");
    if (bias_it != weights.end()) {
        up.bias_data = bias_it->second;
    }
    Mat up_out;
    up.forward(post_norm_out, up_out, opt);

    // SiLU activation: x * sigmoid(x)
    Mat mlp_hidden(gate_out.w, gate_out.h);
    for (size_t i = 0; i < gate_out.total(); i++) {
        float gate_val = gate_out[i];
        float sigmoid_val = 1.0f / (1.0f + expf(-gate_val));
        mlp_hidden[i] = gate_val * sigmoid_val * up_out[i];
    }

    InnerProduct down;
    down.weight_data = weights[prefix + ".mlp.down_proj.weight"];
    bias_it = weights.find(prefix + ".mlp.down_proj.bias");
    if (bias_it != weights.end()) {
        down.bias_data = bias_it->second;
    }
    Mat mlp_out;
    down.forward(mlp_hidden, mlp_out, opt);

    Mat final_out(res.w, res.h);
    for (size_t i = 0; i < res.total(); i++) {
        final_out[i] = res[i] + mlp_out[i];
    }

    return final_out;
}

int LLMEngine::sample_token(const float* logits, const GenerationConfig& config, const std::vector<int>& history)
{
    // Apply repetition penalty if configured
    std::vector<float> adjusted_logits(vocab_size);
    for (int i = 0; i < vocab_size; i++) {
        adjusted_logits[i] = logits[i];
    }
    
    if (config.repetition_penalty != 1.0f && !history.empty()) {
        for (int token_id : history) {
            if (token_id >= 0 && token_id < vocab_size) {
                adjusted_logits[token_id] /= config.repetition_penalty;
            }
        }
    }
    
    if (!config.do_sample || config.temperature <= 0) {
        // Greedy sampling
        int max_id = 0;
        float max_val = adjusted_logits[0];
        for (int i = 1; i < vocab_size; i++) {
            if (adjusted_logits[i] > max_val) {
                max_val = adjusted_logits[i];
                max_id = i;
            }
        }
        return max_id;
    }

    // Apply temperature
    std::vector<float> probs(vocab_size);
    float max_logit = *std::max_element(adjusted_logits.begin(), adjusted_logits.end());
    float sum = 0;
    for (int i = 0; i < vocab_size; i++) {
        probs[i] = expf((adjusted_logits[i] - max_logit) / config.temperature);
        sum += probs[i];
    }
    for (int i = 0; i < vocab_size; i++) {
        probs[i] /= sum;
    }

    // Top-k filtering
    if (config.top_k > 0 && config.top_k < vocab_size) {
        std::vector<std::pair<float, int>> prob_idx;
        for (int i = 0; i < vocab_size; i++) {
            prob_idx.emplace_back(probs[i], i);
        }
        std::sort(prob_idx.rbegin(), prob_idx.rend());
        for (int i = config.top_k; i < vocab_size; i++) {
            probs[prob_idx[i].second] = 0;
        }
        // Renormalize
        sum = 0;
        for (float p : probs) sum += p;
        for (float& p : probs) p /= sum;
    }

    // Top-p filtering
    if (config.top_p < 1.0f) {
        std::vector<std::pair<float, int>> prob_idx;
        for (int i = 0; i < vocab_size; i++) {
            prob_idx.emplace_back(probs[i], i);
        }
        std::sort(prob_idx.rbegin(), prob_idx.rend());
        float cumsum = 0;
        int cutoff = vocab_size;
        for (int i = 0; i < vocab_size; i++) {
            cumsum += prob_idx[i].first;
            if (cumsum >= config.top_p) {
                cutoff = i + 1;
                break;
            }
        }
        for (int i = cutoff; i < vocab_size; i++) {
            probs[prob_idx[i].second] = 0;
        }
        // Renormalize
        sum = 0;
        for (float p : probs) sum += p;
        for (float& p : probs) p /= sum;
    }

    // Sample
    std::random_device rd;
    std::mt19937 gen(rd());
    std::discrete_distribution<> dist(probs.begin(), probs.end());
    return dist(gen);
}

// Placeholder implementations for other architectures
Mat LLMEngine::forward_llama(const std::vector<int>& tokens) { return forward_phi3(tokens); }
Mat LLMEngine::forward_gpt2(const std::vector<int>& tokens) { return forward_phi3(tokens); }
Mat LLMEngine::forward_mistral(const std::vector<int>& tokens) { return forward_phi3(tokens); }
Mat LLMEngine::forward_qwen(const std::vector<int>& tokens) { return forward_phi3(tokens); }

} // namespace ncnn