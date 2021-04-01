#version 450

#define PI 3.14159265359
#define DELTA 0.00001

const float SQRT_3 = sqrt(3.0);
// DASH_RATIO = DASH边长 : 厚度
const float DASH_RATIO = 8.0;

// GeometryType
const uint GT_CIRCLE        = 0;
const uint GT_LINE          = 1;
const uint GT_ETRIANGLE     = 2;
const uint GT_SQUARE        = 3;
const uint GT_PENTAGON      = 4;
const uint GT_HEXAGON       = 5;
const uint GT_OCTOGON       = 6;
const uint GT_HEXAGRAM      = 7;
const uint GT_STARFIVE      = 8;
const uint GT_HEART         = 9;

const vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 BLACK = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 CYAN = vec4(0.0, 1.0, 1.0, 1.0);
const vec4 ROSE = vec4(1.0, 0.0, 0.5, 1.0);
const vec4 MAGENTA = vec4(1.0, 0.0, 1.0, 1.0);
const vec4 VIOLET = vec4(0.5, 0.0, 1.0, 1.0);

const vec4 LRED = vec4(253, 81, 69, 255) / 255.0;
const vec4 LORANGE = vec4(255, 113, 101, 255) / 255.0;
const vec4 LBEIGE = vec4(254, 186, 163, 255) / 255.0;
const vec4 LBLUE = vec4(21, 125, 136, 255) / 255.0;
const vec4 LCYAN = vec4(135, 208, 191, 255) / 255.0;
const vec4 LBLACK = vec4(0.1, 0.1, 0.1, 1.0);

uniform mat4 mx_view;
uniform vec2 vp_size;
uniform vec2 mouse;
uniform float time;

flat layout(location = 0) in float i_thickness;
flat layout(location = 1) in uint i_gtype;
flat layout(location = 2) in mat4 i_mx_model;
flat layout(location = 6) in mat4 i_mx_p2l;

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

   // 无圆角
   return pos.y;
}

float sdf_square(vec2 pos, float sl) {
   pos = abs(pos);
   pos = pos.x - pos.y > 0.0 ? pos = pos.yx : pos;
   pos.y -= 0.5 * sl;

   pos.x -= clamp(pos.x, 0, 0.5 * sl);
   
   return length(pos) * sign(-pos.y);
}

float sdf_pentagon(vec2 pos, float sl) {
   const float d = 0.5 * sl * cos(radians(36));
   const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);

   pos.x = abs(pos.x);
   pos -= 2.0 * min(dot(vec2(-k.x, k.y), pos), 0.0) * vec2(-k.x, k.y);
   pos -= 2.0 * min(dot(vec2(k.x, k.y), pos), 0.0) * vec2(k.x, k.y);
   pos -= vec2(clamp(pos.x, -d * k.z, d * k.z), d);    
   return length(pos) * sign(-pos.y);
}

float sdf_hexagon(vec2 pos, float sl) {
   const float d = 0.5 * sl * cos(radians(30));
   const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
   
   pos = abs(pos);
   pos -= 2.0 * min(dot(k.xy, pos), 0.0) * k.xy;
   pos -= vec2(clamp(pos.x, -k.z * d, k.z * d), d);
   return length(pos) * sign(-pos.y);
}

float sdf_octogon(vec2 pos, float sl) {
   const float d = 0.5 * sl * cos(radians(22.5));
   const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623 );
   
   pos = abs(pos);
   pos -= 2.0 * min(dot(vec2(k.x, k.y), pos), 0.0) * vec2(k.x, k.y);
   pos -= 2.0 * min(dot(vec2(-k.x, k.y), pos), 0.0) * vec2(-k.x,k.y);
   pos -= vec2(clamp(pos.x, -k.z * d, k.z * d), d);
   return length(pos) * sign(-pos.y);
}

float sdf_hexagram(vec2 pos, float sl) {
   const float d = 0.25 * sl;
   const vec4 k = vec4(-0.5, 0.8660254038, 0.5773502692, 1.7320508076);

   pos = abs(pos);
   pos -= 2.0 * min(dot(k.xy, pos), 0.0) * k.xy;
   pos -= 2.0 * min(dot(k.yx, pos), 0.0) * k.yx;
   pos -= vec2(clamp(pos.x, k.z * d,k.w * d), d);

   // 圆角, 连续法线
   // return length(pos) * sign(-pos.y);

   // 非圆角, 离散法线
   return -pos.y;
}

float sdf_starfive(vec2 pos, float sl) {
   const float d = 0.5 * sl;
   
   const float an = PI / float(5);
   const float en = PI / 3.0;
   const vec2 acs = vec2(cos(an), sin(an));
   const vec2 ecs = vec2(cos(en), sin(en));

   float bn = mod(atan(pos.x, pos.y), 2.0 * an) - an;
   pos = length(pos) * vec2(cos(bn), abs(sin(bn)));

   pos -= d * acs;
   pos += ecs * clamp(-dot(pos, ecs), 0.0, d * acs.y / ecs.y);

   // 圆角, 连续法线
   // return length(pos) * sign(-pos.x);

   // 非圆角, 离散法线
   return -pos.x;
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

   vec2 pl = (i_mx_p2l * gl_FragCoord).xy;

   float ht = 0.5 * i_thickness;

   // NOTE: 弧长恒为像素厚度的DASH_RATIO倍.
   float LENGTH = DASH_RATIO * i_thickness;

   float f = 0;
   vec2 tage = vec2(0.0);
   float in_geometry = 0;
   float in_border = 0;
   float in_dash = 0;

   switch(i_gtype) {
      case GT_CIRCLE:
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

         outColor = mix(in_geometry * LRED, in_dash * LBLACK, in_border);
         break;
      case GT_LINE:
         outColor = MAGENTA;
         break;
      case GT_ETRIANGLE:
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

         outColor = mix(in_geometry * LORANGE, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_SQUARE:
         f = sdf_square(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_square(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_square(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * LBEIGE, in_dash * LBLACK, in_border);
         break;
      case GT_PENTAGON:
         f = sdf_pentagon(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_pentagon(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_pentagon(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * LBLUE, in_dash * LBLACK, in_border);
         break;
      case GT_HEXAGON:
         f = sdf_hexagon(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_hexagon(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_hexagon(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * LCYAN, in_dash * LBLACK, in_border);
         break;
      case GT_OCTOGON:
         f = sdf_octogon(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_octogon(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_octogon(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * CYAN, in_dash * LBLACK, in_border);
         break;
      case GT_HEXAGRAM:
         f = sdf_hexagram(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_hexagram(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_hexagram(pl + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * MAGENTA, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_STARFIVE:
         f = sdf_starfive(pl, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_starfive(pl + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_starfive(pl + vec2(DELTA, 0.0), 1.0)
               )
         );

         // NOTE: 凹角的dash显示有问题, 需改善
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(0.3 - BLUR, 0.3 + BLUR, fract(dot(pl, tage) / LENGTH + time));

         outColor = mix(in_geometry * VIOLET, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_HEART:
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

         outColor = mix(in_geometry * ROSE, in_dash * LBLACK, in_border);
         break;
      default:
         outColor = MAGENTA;
         break;
   }
}