#version 450

uniform mat4 mx_proj;
uniform mat4 mx_model;

layout (location = 0) in vec3 pos;

void main() {
   gl_Position = mx_proj * mx_model * vec4(pos.xyz, 1);
}