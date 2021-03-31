#version 450

#define PI 3.14159265359
#define DELTA 0.00001

const float SQRT_3 = sqrt(3.0);
// DASH_RATIO = DASH边长 : 厚度
const float DASH_RATIO = 8.0;

const vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 BLACK = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 CYAN = vec4(0.0, 1.0, 1.0, 1.0);
const vec4 ROSE = vec4(1.0, 0.0, 0.5, 1.0);
const vec4 MAGENTA = vec4(1.0, 0.0, 1.0, 1.0);

const vec4 LRED = vec4(253, 81, 69, 255) / 255.0;
const vec4 LORANGE = vec4(255, 113, 101, 255) / 255.0;
const vec4 LBEIGE = vec4(254, 186, 163, 255) / 255.0;
const vec4 LBLUE = vec4(21, 125, 136, 255) / 255.0;
const vec4 LCYAN = vec4(135, 208, 191, 255) / 255.0;

uniform mat4 mx_view;
uniform vec2 vp_size;
uniform vec2 mouse;
uniform float time;

flat layout(location = 0) in float i_thickness;
flat layout(location = 1) in int i_gtype;
flat layout(location = 2) in mat4 i_mx_model;
flat layout(location = 6) in mat4 i_mx_proj;

out vec4 outColor;

float sdf_circle(vec2 pos, float sl) {
   float r = 0.5 * sl;

   return r - length(pos);
}

float sdf_etriangle(vec2 pos, float sl) {
   // The radius of the circle enclosing the etriangle.
   float radius = 0.5 * sl;
   // the side length of etriangle.
   float etsl = SQRT_3 * radius;

   // Map points along the Y axis.
   pos.x = abs(pos.x) - 0.5 * etsl;
   pos.y = pos.y + 0.5 * radius;
   // Map points along the `l: x + √3y = 0` axis.
   pos = pos.x + SQRT_3 * pos.y > 0.0 ? vec2(pos.x - SQRT_3 * pos.y, -SQRT_3 * pos.x - pos.y) / 2.0 : pos;
    
   // 圆角
   // pos.x -= clamp(pos.x, -etsl, 0.0);
   // return length(pos) * sign(pos.y);

   return pos.y;
}

float dot2( in vec2 v ) { return dot(v,v); }

float sdf_heart(vec2 pos, float sl) {
   pos = vec2(abs(pos.x + 0.002), pos.y + 0.5) * 1.214 / sl;

   return pos.y + pos.x > 1.0 ? 
      -sqrt(dot2(pos - vec2(0.25, 0.75))) + sqrt(2.0) / 4.0 :
      sqrt(min(dot2(pos - vec2(0.00, 1.00)), dot2(pos - 0.5 * max(pos.x + pos.y, 0.0)))) * sign(-pos.x + pos.y);
}

void main() {
   const float BLUR = 0.00318;

   mat4 mx_n2p = mat4
   (
      0.5 * vp_size.x,     0.0            ,     0.0,     0.0,
      0.0            ,     0.5 * vp_size.y,     0.0,     0.0,
      0.0            ,     0.0            ,     0.5,     0.0,
      0.5 * vp_size.x,     0.5 * vp_size.y,     0.5,     1.0
   );
   
   mat4 mx_l2p = mx_n2p * i_mx_proj * mx_view * i_mx_model;
   mat4 mx_p2l = inverse(mx_l2p);

   vec4 pp = gl_FragCoord;
   vec2 pl = (mx_p2l * pp).xy;

   // 负值表示在局部空间, 正值表示在屏幕空间.
   // half thickness
   float ht = i_thickness > 0 ? 0.5 * length(mx_p2l * vec4(i_thickness, 0.0, 0.0, 0.0)) : -0.5 * i_thickness;
   // pixel thickness
   float pt = i_thickness > 0 ? i_thickness : length(mx_l2p * vec4(2.0 * ht, 0.0, 0.0, 0.0));

   // NOTE: 弧长恒为像素厚度的DASH_RATIO倍.
   float LENGTH = 2.0 * DASH_RATIO * ht;

   float f = 0;
   vec2 tage = vec2(0.0);
   float in_geometry = 0;
   float in_border = 0;
   float in_dash = 0;

   switch(i_gtype) {
      case 0:
         f = sdf_circle(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // radius in screen space.
         float rad = atan(pl.y, pl.x);
         // [-PI, PI] map to [-1, 1]. 
         float range = rad / PI;
         // dash的份数, 恒为偶数.
         float count = 2.0 * ceil(0.5 * PI / LENGTH);
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, 
            abs(fract((range - 0.5) * count / 4.0 + time) - 0.5) * 2.0);

         outColor = mix(in_geometry * LRED, in_dash * vec4(0.1, 0.1, 0.1, 1.0), in_border);
         break;
      case 1:
         f = sdf_etriangle(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_etriangle(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_etriangle(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * LBEIGE, in_dash * vec4(0.1, 0.1, 0.1, 1.0), in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case 2:
         f = sdf_heart(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // radius in screen space.
         rad = atan(pl.y, pl.x);
         // [-PI, PI] map to [-1, 1]. 
         range = rad / PI;
         // dash的份数, 恒为偶数.
         count = 2.0 * ceil(0.5 * PI / LENGTH);
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, 
            abs(fract((range - 0.5) * count / 4.0 + time) - 0.5) * 2.0);

         outColor = mix(in_geometry * ROSE, in_dash * vec4(0.1, 0.1, 0.1, 1.0), in_border);
         break;
      default:
         outColor = MAGENTA;
         break;
   }
}