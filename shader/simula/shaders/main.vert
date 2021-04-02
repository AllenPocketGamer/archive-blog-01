#version 450

// Geometry Type
const uint GT_CIRCLE        = 0;
const uint GT_LINE          = 1;
const uint GT_ETRIANGLE     = 2;
const uint GT_SQUARE        = 3;
const uint GT_PENTAGON      = 4;
const uint GT_HEXAGON       = 5;
const uint GT_OCTOGON       = 6;
const uint GT_HEXAGRAM      = 7;
const uint GT_STARFIVE      = 8;
const uint GT_HEART         = 9;

// Coordniate Space
const uint CP_GEOMETRY      = 0;
const uint CP_LOCAL         = 1;
const uint CP_WORLD         = 2;
const uint CP_VIEW          = 3;
const uint CP_CLIP          = 4;
const uint CP_NDC           = 5;
const uint CP_SCREEN        = 6;

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform vec2 vp_size;

layout(location = 0) in vec3 pos;
layout(location = 1) in vec4 extras;
layout(location = 2) in float thickness;
layout(location = 3) in float gtype; 

// o_thickness表示在几何局部空间
layout(location = 0) out uint o_gtype;
layout(location = 1) out float o_thickness;
layout(location = 2) out uint o_thickness_space;
layout(location = 3) out mat4 o_mx_g2l;

mat4 to_matrix(vec2 position, vec2 complex, vec2 scale) {
    return mat4(
        complex.x * scale.x, complex.y * scale.x, 0.0, 0.0,     // column 0
        -complex.y * scale.y, complex.x * scale.y, 0.0, 0.0,    // column 1
        0.0, 0.0, 1.0, 0.0,                                     // column 2
        position.x, position.y, 0.0, 1.0                        // column 3
    );
}

mat4 to_matrix(vec2 position, float angle, float size) {
    float rad = radians(angle);
    return to_matrix(position, vec2(cos(rad), sin(rad)), vec2(size));
}

void main() {
    // correct mx_proj
    const mat4 mx_proj_crt = mat4(
        mx_proj[0],
        mx_proj[1],
        mx_proj[2],
        vec4(0.0, 0.0, mx_proj[3][2], mx_proj[3][3])
    );

    const mat4 mx_n2s = mat4
    (
       0.5 * vp_size.x,     0.0            ,     0.0,     0.0,
       0.0            ,     0.5 * vp_size.y,     0.0,     0.0,
       0.0            ,     0.0            ,     0.5,     0.0,
       0.5 * vp_size.x,     0.5 * vp_size.y,     0.5,     1.0
    );

    o_gtype = uint(gtype);
    o_thickness_space = thickness < 0 ? CP_LOCAL : CP_SCREEN;
    o_thickness = abs(thickness);
    o_mx_g2l = to_matrix(extras.xy, extras.z, extras.w);

    // 特殊类型GT_LINE
    if(o_gtype == GT_LINE) {
        const mat4 mx_l2s = mx_n2s * mx_proj_crt * mx_view;

        const vec2 ab = extras.zw - extras.xy;
        const float len = length(ab);
        
        const vec2 position = (extras.xy + extras.zw) / 2.0;
        const vec2 complex = ab / len;
        const vec2 norm = vec2(-complex.y, complex.x);

        // 线段的厚度(local space)可以在vertex中直接求得;
        // 这里需要在局部空间的厚度来构成mx_g2l;
        // 说实话这个分支挺丑的, 但在不影响性能的情况下就先这样吧.
        const float th_l = o_thickness_space == CP_LOCAL ? 
            o_thickness :
            o_thickness / length(mx_l2s * vec4(norm, 0.0, 0.0));

        const vec2 scale = vec2(len, th_l);

        o_mx_g2l = to_matrix(position, complex, scale);

        o_thickness_space = CP_LOCAL;
        o_thickness = th_l;
    }

   // NOTE: mx_l2w被设定为单位矩阵, 在mx_view与i_mx_g2l之间被省略.
    gl_Position = mx_proj_crt * mx_view * o_mx_g2l * vec4(pos.xyz, 1);
}