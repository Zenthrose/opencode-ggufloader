// Copyright 2019 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_TANH_X86_FMA_H
#define LAYER_TANH_X86_FMA_H

#include "tanh.h"

namespace ncnn {

class TanH_x86_fma : public TanH
{
public:
    TanH_x86_fma();

    virtual int forward_inplace(Mat& bottom_top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_TANH_X86_FMA_H
