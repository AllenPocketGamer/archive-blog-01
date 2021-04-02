#version 450

#define PI 3.14159265359
#define SQRT_3 1.73205080757
#define DELTA 0.00001

// Quad centra in geometry space.
const vec4 QUAD_CENTRA = vec4(0.0, 0.0, 0.0, 1.0);

// DASH_PROPORTION = DASH边长 : 厚度
const float DASH_PROPORTION = 8.0;
// Dash边中空白的占比.
const float DASH_EMPTY_RATIO = 0.3;
// 抗锯齿边缘像素个数(TODO: 未完工)
const float BLUR = 0.00318;

// Geometry Type
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

// Coordniate Space
const uint CP_GEOMETRY      = 0;
const uint CP_LOCAL         = 1;
const uint CP_WORLD         = 2;
const uint CP_VIEW          = 3;
const uint CP_CLIP          = 4;
const uint CP_NDC           = 5;
const uint CP_SCREEN        = 6;

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

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform vec2 vp_size;
uniform vec2 mouse;
uniform float time;

flat layout(location = 0) in uint i_gtype;
flat layout(location = 1) in float i_thickness;
flat layout(location = 2) in uint i_thickness_space;
flat layout(location = 3) in mat4 i_mx_g2l;

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
   // correct mx_proj
   const mat4 mx_proj_crt = mat4(
      mx_proj[0],
      mx_proj[1],
      mx_proj[2],
      vec4(0.0, 0.0, mx_proj[3][2], mx_proj[3][3])
   );

   const mat4 mx_n2s = mat4
   (
      0.5 * vp_size.x,     0.0            ,     0.0,     0.0,
      0.0            ,     0.5 * vp_size.y,     0.0,     0.0,
      0.0            ,     0.0            ,     0.5,     0.0,
      0.5 * vp_size.x,     0.5 * vp_size.y,     0.5,     1.0
   );

   // NOTE: mx_l2w被设定为单位矩阵, 在mx_view与i_mx_g2l之间被省略.
   const mat4 mx_g2s = mx_n2s * mx_proj_crt * mx_view * i_mx_g2l;
   const mat4 mx_s2g = inverse(mx_g2s);

   // frag in geometry space.
   const vec4 pg = mx_s2g * gl_FragCoord;

   // thickness in geometry space.
   float th_g = 0.0;
   if(i_thickness_space == CP_SCREEN) {
      // quad centra in screen space.
      const vec4 cs = mx_g2s * QUAD_CENTRA;
      
      // vector from quad centra to frag in screen space(scale length to i_thickness).
      const vec4 v_c2p = vec4(i_thickness * normalize((gl_FragCoord - cs).xyz), 0.0);
      
      th_g = length((mx_s2g * v_c2p));
   } else { // CP_LOCAL
      // quad centra in local space.
      const vec4 cl = i_mx_g2l * QUAD_CENTRA;
      // frag in local space.
      const vec4 pl = i_mx_g2l * pg;

      // vector from quad centra to frag in local space(scale length to i_thickness).
      const vec4 v_c2p = vec4(i_thickness * normalize((pl - cl).xyz), 0.0);

      th_g = length(inverse(i_mx_g2l) * v_c2p);
   }
   
   const float ht = 0.5 * th_g;

   // NOTE: 无法兼容GT_LINE.
   const float LENGTH = DASH_PROPORTION * th_g;

   float f = 0;
   vec2 tage = vec2(0.0);
   float in_geometry = 0;
   float in_border = 0;
   float in_dash = 0;

   switch(i_gtype) {
      case GT_CIRCLE:
         f = sdf_circle(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // radius in screen space.
         float rad = atan(pg.y, pg.x);
         // [-PI, PI] map to [-1, 1]. 
         float range = rad / PI;
         // dash的份数, 恒为偶数.
         float count = 2.0 * ceil(0.5 * PI / LENGTH);
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, 
            abs(fract((range - 0.5) * count / 4.0 + time) - 0.5) * 2.0);

         outColor = mix(in_geometry * LRED, in_dash * LBLACK, in_border);
         break;
      case GT_LINE: // GT_LINE的i_thickness必然位于local space;
         const float len_l = DASH_PROPORTION * i_thickness;
         const float len_g = len_l / length(i_mx_g2l * vec4(1.0, 0.0, 0.0, 0.0));
      
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(pg.x / len_g - time));
         in_border = smoothstep(0.0, 0.2, 0.5 - abs(pg.y));

         outColor = in_border * in_dash * LBLACK;
         break;
      case GT_ETRIANGLE:
         f = sdf_etriangle(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_etriangle(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_etriangle(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * LORANGE, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_SQUARE:
         f = sdf_square(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_square(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_square(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * LBEIGE, in_dash * LBLACK, in_border);
         break;
      case GT_PENTAGON:
         f = sdf_pentagon(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_pentagon(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_pentagon(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * LBLUE, in_dash * LBLACK, in_border);
         break;
      case GT_HEXAGON:
         f = sdf_hexagon(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_hexagon(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_hexagon(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * LCYAN, in_dash * LBLACK, in_border);
         break;
      case GT_OCTOGON:
         f = sdf_octogon(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_octogon(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_octogon(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * CYAN, in_dash * LBLACK, in_border);
         break;
      case GT_HEXAGRAM:
         f = sdf_hexagram(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_hexagram(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_hexagram(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * MAGENTA, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_STARFIVE:
         f = sdf_starfive(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // sdf(x, y) divided by numeriral gradient(numerical GPU gradient is not precise enough).
         tage = normalize(
            vec2(
               sdf_starfive(pg.xy + vec2(0.0, DELTA), 1.0) - f,
               f - sdf_starfive(pg.xy + vec2(DELTA, 0.0), 1.0)
               )
         );

         // NOTE: 凹角的dash显示有问题, 需改善
         // 可读性差, 得标明各个有效参数的含义
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, fract(dot(pg.xy, tage) / LENGTH + time));

         outColor = mix(in_geometry * VIOLET, in_dash * LBLACK, in_border);
         // outColor = 0.5 * (LBEIGE * in_dash + LRED * in_border);
         break;
      case GT_HEART:
         f = sdf_heart(pg.xy, 1.0);
         in_geometry = smoothstep(-BLUR, BLUR, f - ht);
         in_border = 1.0 - smoothstep(ht - BLUR, ht + BLUR, abs(f - ht));

         // radius in screen space.
         rad = atan(pg.y, pg.x);
         // [-PI, PI] map to [-1, 1]. 
         range = rad / PI;
         // dash的份数, 恒为偶数.
         count = 2.0 * ceil(0.5 * PI / LENGTH);
         in_dash = smoothstep(DASH_EMPTY_RATIO - BLUR, DASH_EMPTY_RATIO + BLUR, 
            abs(fract((range - 0.5) * count / 4.0 + time) - 0.5) * 2.0);

         outColor = mix(in_geometry * ROSE, in_dash * LBLACK, in_border);
         break;
      default:
         outColor = MAGENTA;
         break;
   }
}