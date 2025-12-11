// Copyright 2017 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_HARDSIGMOID_X86_FMA_H
#define LAYER_HARDSIGMOID_X86_FMA_H

#include "hardsigmoid.h"

namespace ncnn {

class HardSigmoid_x86_fma : public HardSigmoid
{
public:
    HardSigmoid_x86_fma();

    virtual int forward_inplace(Mat& bottom_top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_HARDSIGMOID_X86_FMA_H
