// Copyright 2019 Tencent
// SPDX-License-Identifier: BSD-3-Clause

#ifndef LAYER_CAST_X86_FMA_H
#define LAYER_CAST_X86_FMA_H

#include "cast.h"

namespace ncnn {

class Cast_x86_fma : public Cast
{
public:
    Cast_x86_fma();

    virtual int forward(const Mat& bottom_blob, Mat& top_blob, const Option& opt) const;
};

} // namespace ncnn

#endif // LAYER_CAST_X86_FMA_H
