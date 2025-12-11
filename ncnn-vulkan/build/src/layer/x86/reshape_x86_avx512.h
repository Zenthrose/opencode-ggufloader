// Copyright 2019 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_RESHAPE_X86_AVX512_H
#define LAYER_RESHAPE_X86_AVX512_H

#include "reshape.h"

namespace ncnn {

class Reshape_x86_avx512 : public Reshape
{
public:
    Reshape_x86_avx512();

    virtual int forward(const std::vector<Mat>& bottom_blobs, std::vector<Mat>& top_blobs, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_RESHAPE_X86_AVX512_H
