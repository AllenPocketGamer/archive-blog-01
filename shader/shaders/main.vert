#version 450

uniform mat4 mx_w2c;
uniform mat4 mx_l2w;

layout(location = 0) in vec3 pos;

out vec4 color;

void main() {
	gl_Position = mx_w2c * mx_l2w * vec4(pos, 1.0);
}