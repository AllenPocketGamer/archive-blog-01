#version 450

const vec4 ROYAL_BLUE       = vec4(48, 87, 225, 255) / 255.0;
const vec4 LAVENDER_BLUE    = vec4(206, 216, 247, 255) / 255.0;
const vec4 RESOLUTION_BLUE  = vec4(0, 32, 130, 255) / 255.0;

const float GRID_SIZE = 64.0;

uniform vec2 vp_size;
uniform float time;

out vec4 outColor;

float rand(float n){
    return fract(cos(n*89.42)*343.42);
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    vec2 p = gl_FragCoord.xy + vec2(0.5);
    vec2 c = vp_size / 2.0 + 0.25 * vp_size * sin(time * 0.5);

    // background + grid
    outColor = min(mod(p.y, GRID_SIZE), mod(p.x, GRID_SIZE)) > 0.5 ? ROYAL_BLUE : LAVENDER_BLUE; 
    outColor *= (1.0 - length(c - p) / vp_size.x);

    // grain
    outColor.rgb += rand(p) * 0.08;
    outColor.rgb = clamp(outColor.rgb, 0.0, 1.0);
}