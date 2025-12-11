// Copyright 2017 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_SCALE_X86_FMA_H
#define LAYER_SCALE_X86_FMA_H

#include "scale.h"

namespace ncnn {

class Scale_x86_fma : public Scale
{
public:
    Scale_x86_fma();

    virtual int forward_inplace(std::vector<Mat>& bottom_top_blobs, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_SCALE_X86_FMA_H
