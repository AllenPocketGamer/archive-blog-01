#version 450

// 临时变量, 四个像素宽
const float PTHICKNESS = 4;

const float PI = 3.1415926;
const vec4 CYAN = vec4(0.0, 1.0, 1.0, 1.0);
const vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 MAGENTA = vec4(1.0, 0.5, 1.0, 1.0);

uniform mat4 mx_v2c;
uniform mat4 mx_w2v;
uniform mat4 mx_l2w;
uniform vec2 vp_size;
uniform float time;

// Custom uniform variables
uniform float thickness;

out vec4 outColor;

float sdf_circle(vec2 pos, float sl) {
   float r = 0.5 * sl;

   return r - length(pos);
}

// window space to ndc
vec4 wp_to_ndc(vec4 pos_w) {
   return vec4(2. * pos_w.xy / vp_size - 1.0, 2. * pos_w.z - 1., 1.);
}

vec4 clip_to_ndc(vec4 pos_c) {
   return pos_c / pos_c.w;
}

vec4 clip_to_wp(vec4 pos_c) {
   vec4 pos_n = clip_to_ndc(pos_c);
   return vec4((0.5 * pos_n.xy + 0.5) * vp_size, 0.5 * pos_n.z + 0.5, 1.0 / pos_c.w);
}

void main() {
   mat4 mx_l2c = mx_v2c * mx_w2v * mx_l2w;
   mat4 mx_c2l = inverse(mx_v2c * mx_w2v * mx_l2w);

   vec4 centra_c = mx_l2c * vec4(0.0, 0.0, 0.0, 1.0);
   vec4 centra_n = clip_to_ndc(centra_c);
   vec4 centra_w = clip_to_wp(centra_c);
   
   vec4 pos_n = wp_to_ndc(gl_FragCoord);
   vec4 pos_c = pos_n / gl_FragCoord.w;
   vec4 pos_l = mx_c2l * pos_c;
   
   vec3 op_w = gl_FragCoord.xyz - centra_w.xyz;
   float scale = PTHICKNESS / length(op_w.xy);
   vec3 ob_w = op_w * scale;

   vec4 ob_n = wp_to_ndc(vec4(ob_w, 0.0));   

   // xy in local space.
   vec2 pos = pos_l.xy;

   float rad = atan(pos.y, pos.x);
   float is_dash = step(0.2, fract(rad / PI * 16.0 + time));

   float d = sdf_circle(pos, 1.0 - thickness);
   float is_circle = step(0.0, d);
   float is_border = step(abs(d), 0.5 * thickness);

   outColor = MAGENTA * is_dash * is_border;
   outColor = is_dash * is_border > 0 ? WHITE : is_circle * CYAN;
}