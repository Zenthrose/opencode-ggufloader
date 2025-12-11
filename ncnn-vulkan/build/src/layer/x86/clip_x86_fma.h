// Copyright 2017 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_CLIP_X86_FMA_H
#define LAYER_CLIP_X86_FMA_H

#include "clip.h"

namespace ncnn {

class Clip_x86_fma : public Clip
{
public:
    Clip_x86_fma();

    virtual int forward_inplace(Mat& bottom_top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_CLIP_X86_FMA_H
