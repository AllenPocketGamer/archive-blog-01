#version 450

const float PI = 3.1415926;

const vec4 ROSE = vec4(1.0, 0.0, 0.5, 1.0);
const vec4 LORANGE = vec4(1.0, 0.5, 0.2, 1.0);

uniform mat4 mx_proj;
uniform mat4 mx_view;
uniform mat4 mx_model;
uniform vec2 vp_size;
uniform float time;

uniform float pthickness;

out vec4 outColor;

float sdf_circle(vec2 pos, float sl) {
   float r = 0.5 * sl;

   return r - length(pos);
}

void main() {
	float da = gl_FragCoord.z;

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

   float thickness = length(mx_p2l * vec4(pthickness, 0.0, 0.0, 0.0));

   float d = sdf_circle(pl.xy, 1.0);
   float in_circle = step(0, d - 0.5 * thickness);
   float in_border = step(abs(d - 0.5 * thickness), 0.5 * thickness);

   const float ARC = 4.0 * PI;

   float rp = length(mx_l2p * vec4(0.5, 0.0, 0.0, 0.0));
   float count = 2.0 * PI * rp / ARC;

   float rad = atan(pl.y, pl.x);
   float in_dash = step(0.25, fract(rad / PI * count / 4.0 + time));

   outColor = mix(in_circle * LORANGE, ROSE, in_border * in_dash);
}