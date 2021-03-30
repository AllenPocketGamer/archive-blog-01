#version 450

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform mat4 mx_model;

layout (location = 0) in vec3 pos;

void main() {
   // correct mx_proj
   mat4 mx_proj_crt = mx_proj;
   mx_proj_crt[3][0] = mx_proj_crt[3][1] = 0.0;

   gl_Position = mx_proj_crt * mx_view * mx_model * vec4(pos.xyz, 1);
}