// Copyright 2023 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_SHUFFLECHANNEL_X86_FMA_H
#define LAYER_SHUFFLECHANNEL_X86_FMA_H

#include "shufflechannel.h"

namespace ncnn {

class ShuffleChannel_x86_fma : public ShuffleChannel
{
public:
    ShuffleChannel_x86_fma();

    virtual int forward(const Mat& bottom_blob, Mat& top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_SHUFFLECHANNEL_X86_FMA_H
