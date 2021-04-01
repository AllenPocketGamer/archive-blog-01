#version 450

#define PI 3.14159265358979323846

const vec4 ROYAL_BLUE       = vec4(48, 87, 225, 255) / 255.0;
const vec4 LAVENDER_BLUE    = vec4(206, 216, 247, 255) / 255.0;
const vec4 RESOLUTION_BLUE  = vec4(0, 32, 130, 255) / 255.0;

const float GRID_SIZE = 100.0;
const float GRID_SUB_COUNT = 5.0;
const float GRID_THICKNESS = 2.0;

uniform vec2 vp_size;
uniform vec2 mouse;
uniform float time;

out vec4 outColor;

float rand(float n){return fract(sin(n) * 43758.5453123);}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}
	
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float noise(vec2 p, float freq ){
	float unit = vp_size.x/freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(PI*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

void main() {
    vec2 p = gl_FragCoord.xy + vec2(0.5);
    vec2 c = vp_size / 2.0;

    float n = noise(p, 1000);
    // create the background grid
    vec2 grid_uv = p - c;
    float grid = dot(
        step(
            mod(
                grid_uv.xyxy,
                vec4(GRID_SIZE / GRID_SUB_COUNT, GRID_SIZE / GRID_SUB_COUNT, GRID_SIZE, GRID_SIZE)
                ),
            vec4(GRID_THICKNESS)
            ),
        vec4(.1, .1, .2, .2)
        ) * step(0.5, n);

    // background
    outColor = clamp(ROYAL_BLUE + vec4(vec3(grid), 0.0), 0.0, 1.0);
    outColor *= (1.0 - length(c - p) / vp_size.x);

    // grain
    outColor.rgb += n * 0.10;
    outColor.rgb = clamp(outColor.rgb, 0.0, 1.0);
}