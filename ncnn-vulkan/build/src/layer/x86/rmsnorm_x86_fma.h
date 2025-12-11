// Copyright 2024 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_RMSNORM_X86_FMA_H
#define LAYER_RMSNORM_X86_FMA_H

#include "rmsnorm.h"

namespace ncnn {

class RMSNorm_x86_fma : public RMSNorm
{
public:
    RMSNorm_x86_fma();

    virtual int forward_inplace(Mat& bottom_top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_RMSNORM_X86_FMA_H
