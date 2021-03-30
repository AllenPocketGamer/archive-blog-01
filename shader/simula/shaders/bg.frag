#version 450

const float GRID_SIZE = 64.0;

uniform vec2 vp_size;

out vec4 outColor;

void main() {
    vec2 p = gl_FragCoord.xy + vec2(0.5);
    vec2 c = vp_size / 2.0;

    outColor = vec4(0.5, 0.5, 0.5, 1.0) * (1.0 - length(c - p) / vp_size.x);
    outColor *= clamp(min(mod(p.y, GRID_SIZE), mod(p.x, GRID_SIZE)), 0.9, 1.0);
}