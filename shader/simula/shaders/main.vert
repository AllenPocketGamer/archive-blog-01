#version 450

uniform mat4 mx_proj;
uniform mat4 mx_view;

layout(location = 0) in vec3 pos;
layout(location = 1) in vec4 extras;
layout(location = 2) in float thickness;
layout(location = 3) in float gtype; 

layout(location = 0) out float o_thickness;
layout(location = 1) out int o_gtype;
layout(location = 2) out mat4 o_mx_model;
layout(location = 6) out mat4 o_mx_proj;

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
   o_mx_model = to_matrix(extras.xy, extras.z, extras.w);
   o_thickness = thickness;
   o_gtype = int(gtype);
   
   // correct mx_proj
   o_mx_proj = mx_proj;
   o_mx_proj[3][0] = o_mx_proj[3][1] = 0.0;

   gl_Position = o_mx_proj * mx_view * o_mx_model * vec4(pos.xyz, 1);
}