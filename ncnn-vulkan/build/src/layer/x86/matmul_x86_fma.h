// Copyright 2022 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_MATMUL_X86_FMA_H
#define LAYER_MATMUL_X86_FMA_H

#include "matmul.h"

namespace ncnn {

class MatMul_x86_fma : public MatMul
{
public:
    MatMul_x86_fma();

    virtual int create_pipeline(const Option& opt);
    virtual int destroy_pipeline(const Option& opt);

    virtual int forward(const std::vector<Mat>& bottom_blobs, std::vector<Mat>& top_blobs, const Option& opt) const;

public:
    Layer* gemm;
};

} // namespace ncnn

#endif // LAYER_MATMUL_X86_FMA_H
