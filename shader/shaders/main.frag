#version 450

uniform vec2 vp_size;
uniform vec2 m_pos;
uniform float time;

out vec4 outColor;

float sdf_circle(vec2 pos, float sl) {
	float r = 0.5 * sl;

	return r - length(pos);
}

void main() {
	vec2 uv = gl_FragCoord.xy / vp_size;
	vec2 pos = uv - vec2(0.5, 0.5);

	float d = sdf_circle(pos, .2);
	float in_circle = step(0.0, d);
	float in_border = step(abs(d), 0.04);

	vec2 n = normalize(pos);
	n = sign(n) * vec2(0.707, 0.707);

	float thickness = 50.0;
	float is_dash = step(0.5, fract((n.y * pos.x - n.x * pos.y) * thickness + time));

	outColor = vec4(1.0, 0.5, 0.5, 1.0) * is_dash * in_circle * in_border;
	// outColor = vec4(n, 0.0, 1.0);
}