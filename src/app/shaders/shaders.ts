export const vertexShader = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 u_texel;

    void main () {
        vUv = .5 * (position.xy + 1.);
        vL = vUv - vec2(u_texel.x, 0.);
        vR = vUv + vec2(u_texel.x, 0.);
        vT = vUv + vec2(0., u_texel.y);
        vB = vUv - vec2(0., u_texel.y);
        gl_Position = vec4(position.xy, 0., 1.);
    }
`;

export const advectionShader = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform float u_dt;

vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
    vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
    vec4 previous = texture2D(u_input_texture, coord);

    // Mantener el rastro suavemente
    gl_FragColor = mix(previous, vec4(0.0), 0.02); // Ajusta 0.02 para mayor persistencia
    gl_FragColor.rgb *= 0.99; // Suavizar desvanecimiento
    gl_FragColor.a = 1.0;
}
`;

export const divergenceShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_velocity_texture;

    void main() {
        float L = texture2D(u_velocity_texture, vL).x;
        float R = texture2D(u_velocity_texture, vR).x;
        float T = texture2D(u_velocity_texture, vT).y;
        float B = texture2D(u_velocity_texture, vB).y;
        vec2 C = texture2D(u_velocity_texture, vUv).xy;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`;

export const pressureShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_pressure_texture;
    uniform sampler2D u_divergence_texture;

    void main() {
        float L = texture2D(u_pressure_texture, vL).x;
        float R = texture2D(u_pressure_texture, vR).x;
        float T = texture2D(u_pressure_texture, vT).x;
        float B = texture2D(u_pressure_texture, vB).x;
        float C = texture2D(u_pressure_texture, vUv).x;
        float divergence = texture2D(u_divergence_texture, vUv).x;
        float pressure = (L + R + T + B - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`;

export const splatShader = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;

void main() {
    vec2 p = vUv - u_point.xy;
    p.x *= u_ratio;
    float splatEffect = exp(-dot(p, p) / u_point_size);
    vec3 splat = splatEffect * u_point_value;

    // Mezclar suavemente con la textura base
    vec3 base = texture2D(u_input_texture, vUv).rgb;
    gl_FragColor = vec4(base + splat, 1.0);
}
`;

export const gradientShader = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D u_pressure_texture;
    uniform sampler2D u_velocity_texture;

    void main() {
        float L = texture2D(u_pressure_texture, vL).x;
        float R = texture2D(u_pressure_texture, vR).x;
        float T = texture2D(u_pressure_texture, vT).x;
        float B = texture2D(u_pressure_texture, vB).x;
        vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`;

export const displayShader = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_texture;

void main() {
    vec3 color = texture2D(u_texture, vUv).rgb;
    gl_FragColor = vec4(color, 1.0); // Evita invertir los colores para un efecto más natural
}
`;