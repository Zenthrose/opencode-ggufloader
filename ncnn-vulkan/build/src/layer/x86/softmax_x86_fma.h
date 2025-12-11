// Copyright 2022 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_SOFTMAX_X86_FMA_H
#define LAYER_SOFTMAX_X86_FMA_H

#include "softmax.h"

namespace ncnn {

class Softmax_x86_fma : public Softmax
{
public:
    Softmax_x86_fma();

    virtual int forward_inplace(Mat& bottom_top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_SOFTMAX_X86_FMA_H
