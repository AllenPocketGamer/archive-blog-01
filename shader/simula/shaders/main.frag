#version 450

const float PI = 3.1415926;

const vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 CYAN = vec4(0.0, 1.0, 1.0, 1.0);
const vec4 ROSE = vec4(1.0, 0.0, 0.5, 1.0);

const vec4 LRED = vec4(253, 81, 69, 255) / 255.0;
const vec4 LORANGE = vec4(255, 113, 101, 255) / 255.0;
const vec4 LBEIGE = vec4(254, 186, 163, 255) / 255.0;
const vec4 LBLUE = vec4(21, 125, 136, 255) / 255.0;
const vec4 LCYAN = vec4(135, 208, 191, 255) / 255.0;

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform mat4 mx_model;
uniform vec2 vp_size;
uniform float time;

uniform float thickness;

out vec4 outColor;

float sdf_circle(vec2 pos, float sl) {
   float r = 0.5 * sl;

   return r - length(pos);
}

void main() {
   const float BLUR = 0.00318;

   // correct mx_proj
   mat4 mx_proj_crt = mx_proj;
   mx_proj_crt[3][0] = mx_proj_crt[3][1] = 0.0;

   mat4 mx_n2p = mat4
   (
      0.5 * vp_size.x,     0.0            ,     0.0,     0.0,
      0.0            ,     0.5 * vp_size.y,     0.0,     0.0,
      0.0            ,     0.0            ,     0.5,     0.0,
      0.5 * vp_size.x,     0.5 * vp_size.y,     0.5,     1.0
   );
   
   mat4 mx_l2p = mx_n2p * mx_proj_crt * mx_view * mx_model;
   mat4 mx_p2l = inverse(mx_l2p);

   vec4 pp = gl_FragCoord;
   vec4 pl = mx_p2l * pp;

   // 负值表示在局部空间, 正值表示在屏幕空间.
   // half thickness
   float ht = thickness > 0 ? 0.5 * length(mx_p2l * vec4(thickness, 0.0, 0.0, 0.0)) : -0.5 * thickness;
   // pixel thickness
   float pt = thickness > 0 ? thickness : length(mx_l2p * vec4(2.0 * ht, 0.0, 0.0, 0.0));

   float f = sdf_circle(pl.xy, 1.0);
   float in_circle = smoothstep(-BLUR, BLUR, f - ht);
   float in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

   // 弧长恒为像素厚度的PI倍.
   float ARC = pt * PI;
   // radius in screen space.
   float rad = atan(pl.y, pl.x);
   float rp = length(mx_l2p * vec4(0.5, 0.0, 0.0, 0.0));
   // [-PI, PI] map to [-1, 1]. 
   float range = rad / PI;
   // dash的份数, 恒为偶数.
   float count = 2.0 * ceil(0.5 * PI * rp / ARC);
   float in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, 
      abs(fract((range - 0.5) * count / 4.0 + time) - 0.5) * 2.0);

   outColor = mix(in_circle * LCYAN, in_dash * LBEIGE, in_border);
}