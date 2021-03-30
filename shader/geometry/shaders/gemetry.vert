#version 450

uniform mat4 mx_v2c;
uniform mat4 mx_w2v;
uniform mat4 mx_l2w;

layout(location = 0) in vec3 pos;

void main() {
   mat4 mx_l2c = mx_v2c * mx_w2v * mx_l2w;

   gl_Position = mx_l2c * vec4(pos, 1);
}
