#version 450

// GeometryType
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

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform vec2 vp_size;

layout(location = 0) in vec3 pos;
layout(location = 1) in vec4 extras;
layout(location = 2) in float thickness;
layout(location = 3) in float gtype; 

// o_thickness表示在几何局部空间
layout(location = 0) out float o_thickness;
layout(location = 1) out uint o_gtype;
layout(location = 2) out mat4 o_mx_model;
layout(location = 6) out mat4 o_mx_p2l;

mat4 to_matrix(vec2 position, vec2 complex, vec2 scale) {
    return mat4(
        complex.x * scale.x, complex.y * scale.x, 0.0, 0.0,     // column 0
        -complex.y * scale.y, complex.x * scale.y, 0.0, 0.0,    // column 1
        0.0, 0.0, 1.0, 0.0,                                     // column 2
        position.x, position.y, 0.0, 1.0                        // column 3
    );
}

mat4 to_matrix(const vec2 pa, const vec2 pb, const float thickness_t) {
    const vec2 ab = pb - pa;
    const float len = length(ab);

    const vec2 position = (pa + pb) / 2.0;
    const vec2 complex = ab / len;
    const vec2 scale = vec2(len, thickness_t);

    return to_matrix(position, complex, scale);
}

mat4 to_matrix(vec2 position, float angle, float size) {
    float rad = radians(angle);
    return to_matrix(position, vec2(cos(rad), sin(rad)), vec2(size));
}

void main() {
    // correct mx_proj
    mat4 t_mx_proj = mx_proj;
    t_mx_proj[3][0] = t_mx_proj[3][1] = 0.0;

    o_gtype = uint(gtype);

    const mat4 mx_n2p = mat4
    (
       0.5 * vp_size.x,     0.0            ,     0.0,     0.0,
       0.0            ,     0.5 * vp_size.y,     0.0,     0.0,
       0.0            ,     0.0            ,     0.5,     0.0,
       0.5 * vp_size.x,     0.5 * vp_size.y,     0.5,     1.0
    );

    const mat4 mx_p2w = inverse(mx_n2p * t_mx_proj * mx_view);
    
    // 负值表示在Transform2D局部空间, 正值表示在屏幕空间(NOTE: 在该实验shader中Transform2D为单位矩阵).
    //
    // thickness_t表示在Transform2D空间的宽度
    const float thickness_t = thickness < 0 ? -thickness : length(mx_p2w * vec4(thickness, 0.0, 0.0, 0.0));

    if(o_gtype == GT_LINE) {
        o_mx_model = to_matrix(extras.xy, extras.zw, thickness_t);

        // GT_LINE比较特殊, 边厚度恒为1.0(在Geometry Space中).
        //
        // o_thickness这里含义改变了, 改成了thickness_t / len
        o_thickness = thickness_t / length(extras.zw - extras.xy);
    } else {
        o_mx_model = to_matrix(extras.xy, extras.z, extras.w);

        // 为什么选vec4(thickness_t, 0.0, 0.0, 0.0)? 因为我假设Transform2D -> Geometry的缩放变化是各向同性的;
        // NOTE: 这个假设并不牢靠, 在移植时, 正确的边厚度应该在pixel shader中计算.
        o_thickness = length(inverse(o_mx_model) * vec4(thickness_t, 0.0, 0.0, 0.0));
    }
    

    const mat4 mx_l2n = t_mx_proj * mx_view * o_mx_model;
    const mat4 mx_l2p = mx_n2p * mx_l2n;
    o_mx_p2l = inverse(mx_l2p);

    gl_Position = mx_l2n * vec4(pos.xyz, 1);
}