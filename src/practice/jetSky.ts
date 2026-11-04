import * as THREE from 'three';

// The sky is drawn as one effect: for every pixel a ray flies out from the camera, through the
// clouds as real volumes of light and shadow, until it reaches the jets, the ocean, or the sun.
export const SUN = new THREE.Vector3(0.1, 0.17, -0.98).normalize();
export const CLOUD_BASE = 180;
export const CLOUD_TOP = 1300;

const NOISE_SIZE = 48;

function worleyLayer(size: number, cells: number, random: () => number) {
  const points = new Float32Array(cells * cells * cells * 3);
  for (let i = 0; i < points.length; i += 1) points[i] = random();
  const layer = new Float32Array(size * size * size);
  const wrap = (value: number) => ((value % cells) + cells) % cells;
  let index = 0;
  for (let z = 0; z < size; z += 1) {
    const pz = (z / size) * cells;
    const cz = Math.floor(pz);
    for (let y = 0; y < size; y += 1) {
      const py = (y / size) * cells;
      const cy = Math.floor(py);
      for (let x = 0; x < size; x += 1) {
        const px = (x / size) * cells;
        const cx = Math.floor(px);
        let nearest = 9;
        for (let dz = -1; dz <= 1; dz += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              const at = (wrap(cx + dx) + wrap(cy + dy) * cells + wrap(cz + dz) * cells * cells) * 3;
              const ox = cx + dx + points[at] - px;
              const oy = cy + dy + points[at + 1] - py;
              const oz = cz + dz + points[at + 2] - pz;
              nearest = Math.min(nearest, ox * ox + oy * oy + oz * oz);
            }
          }
        }
        layer[index] = 1 - Math.min(1, Math.sqrt(nearest) * 1.05);
        index += 1;
      }
    }
  }
  return layer;
}

let sharedNoise: THREE.Data3DTexture | null = null;

// Puffy noise that repeats seamlessly. Red holds big billows, and green holds fine erosion.
function cloudNoise() {
  if (sharedNoise) return sharedNoise;
  let seed = 90210;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const size = NOISE_SIZE;
  const big = [worleyLayer(size, 4, random), worleyLayer(size, 8, random), worleyLayer(size, 16, random)];
  const fine = [worleyLayer(size, 8, random), worleyLayer(size, 16, random), worleyLayer(size, 24, random)];
  const data = new Uint8Array(size * size * size * 2);
  for (let i = 0; i < big[0].length; i += 1) {
    data[i * 2] = Math.round(255 * (big[0][i] * 0.62 + big[1][i] * 0.27 + big[2][i] * 0.11));
    data[i * 2 + 1] = Math.round(255 * (fine[0][i] * 0.55 + fine[1][i] * 0.3 + fine[2][i] * 0.15));
  }
  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RGFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  sharedNoise = texture;
  return texture;
}

// A limited set of colors, built around the gold, rust, and slate of a sun behind storm clouds.
const PALETTE = [
  '#0D080C', '#1C1216', '#2E1D1E', '#452A22', '#5F3820', '#724018', '#82491C', '#955418', '#A9601A', '#BC6E18', '#CF7C16',
  '#DF8C18', '#EE9C1A', '#F6AD22', '#FBBE2E', '#FFCD44', '#FFDB5E', '#FFE680', '#FFF0A6', '#FFF7CC', '#FFFCE8',
  '#7C2A12', '#973412', '#B23E0E', '#CC4C0C', '#E25A0C',
  '#23232F', '#2E2E3B', '#3A3A48', '#494854', '#585560', '#6A6568', '#7E7670', '#938876', '#A89A80', '#BCAC8E', '#D0BE9C',
  '#3F5266', '#566B7E', '#6E8494',
  '#D8272E',
];

// How far the dither nudges each pixel. Higher values look grittier.
const DITHER = '0.062';

const paletteGlsl = () => {
  const items = PALETTE.map((hex) => {
    const c = new THREE.Color();
    c.setStyle(hex, THREE.LinearSRGBColorSpace);
    return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
  });
  return `const int PAL_SIZE = ${items.length};
  const vec3 PAL[${items.length}] = vec3[${items.length}](${items.join(', ')});`;
};

const SHARED = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uScene;
  uniform sampler2D uDepth;
  uniform sampler3D uNoise;
  uniform vec3 uCam;
  uniform mat3 uRot;
  uniform vec2 uTan;
  uniform vec2 uClip;
  uniform vec3 uSun;
  uniform float uTime;
  uniform vec2 uLayer;

  float bayer(vec2 p) {
    const float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    ivec2 i = ivec2(mod(p, 4.));
    return (m[i.y * 4 + i.x] + 0.5) / 16.;
  }

  vec3 viewRay() {
    return vec3((vUv * 2. - 1.) * uTan, -1.);
  }

  // How far a ray travels before it reaches a model, or -1 if it misses them all.
  float sceneDistance(vec3 view) {
    if (texture(uScene, vUv).a <= 0.5) return -1.;
    float z = texture(uDepth, vUv).r * 2. - 1.;
    float eye = 2. * uClip.x * uClip.y / (uClip.y + uClip.x - z * (uClip.y - uClip.x));
    return eye * length(view);
  }

  vec3 skyColor(vec3 d) {
    float h = max(d.y, 0.);
    float toSun = dot(d, uSun);
    float facing = toSun * 0.5 + 0.5;
    vec3 c = mix(vec3(0.97, 0.56, 0.10), vec3(0.76, 0.36, 0.10), smoothstep(0.0, 0.16, h));
    c = mix(c, vec3(0.34, 0.30, 0.36), smoothstep(0.1, 0.42, h));
    c = mix(c, vec3(0.10, 0.14, 0.24), smoothstep(0.4, 0.95, h));
    // The sky falls into dusky slate away from the sun.
    c = mix(mix(vec3(0.46, 0.36, 0.34), vec3(0.20, 0.24, 0.34), smoothstep(0., 0.5, h)), c, smoothstep(0.1, 0.8, facing));
    float s = max(toSun, 0.);
    c += vec3(1.0, 0.56, 0.12) * pow(s, 7.) * 0.42;
    c += vec3(1.0, 0.72, 0.28) * pow(s, 48.) * 0.75;
    c += vec3(1.0, 0.9, 0.6) * pow(s, 420.) * 1.8;
    return c;
  }

  float coverageAt(vec2 xz) {
    float wide = texture(uNoise, vec3(xz / 11000., 0.37)).r;
    return smoothstep(0.26, 0.56, wide);
  }

`;

const CLOUD_FRAGMENT = /* glsl */ `
  ${SHARED}
  uniform int uSteps;
  uniform int uLightSteps;

  const float RANGE = 9000.;
  const float NEAR_STEP = 90.;
  const vec3 SUN_LIGHT = vec3(2.1, 1.28, 0.5);
  const vec3 SHADE_LOW = vec3(0.17, 0.12, 0.12);
  const vec3 SHADE_HIGH = vec3(0.36, 0.32, 0.35);

  float cloudDensity(vec3 p, bool fine) {
    float h = (p.y - uLayer.x) / (uLayer.y - uLayer.x);
    if (h < 0. || h > 1.) return 0.;
    vec3 q = p + vec3(uTime * 3., 0., uTime * 1.2);
    float cover = coverageAt(q.xz);
    if (cover <= 0.) return 0.;
    // Thick areas tower high, and thin areas stay as low banks.
    float top = mix(0.2, 1.0, cover * cover * cover);
    float round = smoothstep(0., 0.05, h) * smoothstep(top, top * 0.6, h);
    float shape = texture(uNoise, q / vec3(1500., 1100., 1500.)).r;
    float d = (shape * 0.8 + round * 0.42 - (1.02 - cover * 0.5)) * 3.4 * step(0.001, round);
    if (d <= 0.) return 0.;
    if (fine) {
      float wisps = texture(uNoise, q / 260.).g;
      d -= (1. - wisps) * 0.42 * (1. - min(d, 1.) * 0.7);
    }
    return max(d, 0.);
  }

  // A looser check than the real density, so big steps can't skip past a thin distant cloud.
  bool cloudNear(vec3 p) {
    float h = (p.y - uLayer.x) / (uLayer.y - uLayer.x);
    if (h < 0. || h > 1.) return false;
    vec3 q = p + vec3(uTime * 3., 0., uTime * 1.2);
    float cover = coverageAt(q.xz);
    if (cover <= 0.) return false;
    float top = mix(0.2, 1.0, cover * cover * cover);
    return h < top * 1.05 && texture(uNoise, q / vec3(1500., 1100., 1500.)).r * 0.8 + 0.42 - (1.02 - cover * 0.5) > -0.12;
  }

  float phase(float c) {
    const float g = 0.72;
    float gg = g * g;
    float forward = (1. - gg) / pow(1. + gg - 2. * g * c, 1.5);
    return min(mix(1., forward, 0.34), 3.2);
  }

  float lightThrough(vec3 p) {
    float total = 0.;
    float stride = 46.;
    float at = stride * 0.5;
    for (int i = 0; i < uLightSteps; i++) {
      total += cloudDensity(p + uSun * at, false) * stride;
      at += stride;
      stride *= 2.1;
    }
    return exp(-total * 0.0145);
  }

  // Returns the light scattered toward the camera, and how much of what's behind shows through.
  vec4 marchClouds(vec3 ro, vec3 rd, float limit, float jitter) {
    float enter = 0.;
    float leave = min(limit, RANGE);
    if (abs(rd.y) > 1e-4) {
      float a = (uLayer.x - ro.y) / rd.y;
      float b = (uLayer.y - ro.y) / rd.y;
      enter = max(min(a, b), 0.);
      leave = min(leave, max(a, b));
    } else if (ro.y < uLayer.x || ro.y > uLayer.y) {
      return vec4(0., 0., 0., 1.);
    }
    if (leave <= enter) return vec4(0., 0., 0., 1.);

    vec3 light = vec3(0.);
    float through = 1.;
    float span = leave - enter;
    float cosSun = dot(rd, uSun);
    float scatter = phase(cosSun);
    // Big steps cross empty air and grow with distance. Reaching a cloud, the ray backs up and
    // walks through it in small steps, so the surface stays soft without any visible rings.
    float growth = pow(span / NEAR_STEP + 1., 2. / float(uSteps));
    float reach = NEAR_STEP * (pow(growth, jitter) - 1.);
    bool inside = false;
    int empty = 0;
    int budget = uSteps + uSteps / 2;
    for (int i = 0; i < budget; i++) {
      if (reach >= span) break;
      float t = enter + reach;
      vec3 p = ro + rd * t;
      if (!inside) {
        if (cloudNear(p)) {
          inside = true;
          empty = 0;
          reach = max(reach - (reach + NEAR_STEP) * (1. - 1. / growth), 0.) + jitter * 12.;
        } else {
          reach = (reach + NEAR_STEP) * growth - NEAR_STEP;
        }
        continue;
      }
      float stride = 9. + t * 0.03 + t * t * 0.000012;
      reach += stride;
      float d = cloudDensity(p, t < 3600.);
      if (d <= 0.) {
        empty += 1;
        if (empty > 3) inside = false;
        continue;
      }
      empty = 0;
      // Light bounces around inside a cloud, so even its heart never goes fully dark.
      float lit = mix(lightThrough(p), 1., 0.06);
      float h = clamp((p.y - uLayer.x) / (uLayer.y - uLayer.x), 0., 1.);
      // Thin edges catch less light than the body of a cloud, which draws dark creases.
      float body = 1. - exp(-d * 5.);
      vec3 shade = mix(SHADE_LOW, SHADE_HIGH, h * h);
      vec3 color = shade + SUN_LIGHT * lit * scatter * mix(0.42, 1., body);
      // Distance dissolves the clouds into the warm air.
      float haze = 1. - exp(-t * 0.00017);
      color = mix(color, skyColor(normalize(vec3(rd.x, 0.02, rd.z))), haze * 0.86);
      float pass = exp(-d * stride * 0.03);
      light += through * (1. - pass) * color;
      through *= pass;
      if (through < 0.015) break;
    }
    return vec4(light, through);
  }

  void main() {
    vec3 view = viewRay();
    vec3 rd = normalize(uRot * view);
    float limit = sceneDistance(view);
    if (limit < 0.) limit = rd.y < -1e-4 ? -uCam.y / rd.y : 1e6;
    // Uneven starting points turn the steps of the march into fine grain, which the next pass smooths.
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    outColor = marchClouds(uCam, rd, limit, jitter);
  }
`;

const COMPOSE_FRAGMENT = /* glsl */ `
  ${SHARED}
  uniform sampler2D uCloud;
  uniform float uFlash;
  ${paletteGlsl()}

  vec3 oceanColor(vec3 ro, vec3 rd, float t) {
    vec3 p = ro + rd * t;
    float calm = 1. / (1. + t / 1800.);
    vec2 drift = vec2(uTime * 2.2, uTime * 1.3);
    float a = texture(uNoise, vec3((p.xz + drift) / 300., uTime * 0.012)).g;
    float b = texture(uNoise, vec3((p.zx - drift * 1.7) / 110., 0.4 + uTime * 0.02)).g;
    float c = texture(uNoise, vec3((p.xz + drift.yx) / 760., 0.7)).r;
    vec2 tilt = vec2(a - 0.47, c - 0.42) * 0.9 + vec2(b - 0.47, a - b) * 0.55;
    vec3 n = normalize(vec3(tilt.x * calm, 1., tilt.y * calm));
    vec3 r = reflect(rd, n);
    r.y = abs(r.y);
    float fresnel = 0.03 + 0.97 * pow(1. - max(dot(-rd, n), 0.), 5.);
    vec3 deep = vec3(0.022, 0.016, 0.022);
    vec3 color = mix(deep, skyColor(r) * 0.8, fresnel);
    // Sunlight breaks up on the waves into a burning path toward the sun.
    float glint = pow(max(dot(r, uSun), 0.), 70.);
    vec3 flat_r = reflect(rd, vec3(0., 1., 0.));
    float path = pow(max(dot(normalize(vec3(flat_r.x, flat_r.y * 0.3, flat_r.z)), normalize(vec3(uSun.x, uSun.y * 0.3, uSun.z))), 0.), 26.);
    color += vec3(1.0, 0.6, 0.14) * (glint * 2.8 + path * smoothstep(0.42, 0.62, b) * 1.1);
    // Cloud shadows slide over the water, far from the clouds casting them under a low sun.
    vec2 toSun = uSun.xz / uSun.y * (uLayer.x + uLayer.y) * 0.5;
    float shade = coverageAt(p.xz + toSun);
    color *= 1. - shade * 0.62;
    float haze = 1. - exp(-t * 0.00022);
    return mix(color, skyColor(normalize(vec3(rd.x, 0.015, rd.z))), haze);
  }

  vec3 nearestColor(vec3 c) {
    vec3 best = PAL[0];
    float bestScore = 1e9;
    for (int i = 0; i < PAL_SIZE; i++) {
      vec3 diff = (c - PAL[i]) * vec3(0.9, 1.1, 0.75);
      float score = dot(diff, diff);
      if (score < bestScore) {
        bestScore = score;
        best = PAL[i];
      }
    }
    return best;
  }

  // Averages nearby cloud pixels to clear the grain, without smearing clouds over the models.
  vec4 smoothClouds() {
    ivec2 at = ivec2(gl_FragCoord.xy);
    ivec2 last = textureSize(uCloud, 0) - 1;
    if (texelFetch(uScene, at, 0).a > 0.5) return texelFetch(uCloud, at, 0);
    vec4 total = vec4(0.);
    float weight = 0.;
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        ivec2 near = clamp(at + ivec2(x, y), ivec2(0), last);
        if (texelFetch(uScene, near, 0).a > 0.5) continue;
        float w = exp(-float(x * x + y * y) / 2.4);
        total += texelFetch(uCloud, near, 0) * w;
        weight += w;
      }
    }
    return total / weight;
  }

  void main() {
    vec2 ndc = vUv * 2. - 1.;
    vec3 view = viewRay();
    vec3 rd = normalize(uRot * view);

    float reach = sceneDistance(view);
    vec3 back;
    if (reach >= 0.) {
      back = texture(uScene, vUv).rgb;
      back = mix(back, skyColor(normalize(vec3(rd.x, 0.02, rd.z))), (1. - exp(-reach * 0.00017)) * 0.8);
    } else if (rd.y < -1e-4) {
      back = oceanColor(uCam, rd, -uCam.y / rd.y);
    } else {
      back = skyColor(rd);
    }

    vec4 cloud = smoothClouds();
    vec3 c = back * cloud.a + cloud.rgb;

    // Strong contrast: crushed shadows and blown-out highlights.
    c = clamp(c, 0., 1.);
    c = mix(c, c * c * (3. - 2. * c), 0.62);
    vec2 edge = ndc * vec2(0.82, 0.92);
    c *= 1. - dot(edge, edge) * 0.2;
    c += uFlash * vec3(1.0, 0.7, 0.3);

    // A light ordered dither nudges every pixel before it snaps to the palette.
    c += (bayer(gl_FragCoord.xy) - 0.5) * ${DITHER};
    outColor = vec4(nearestColor(c), 1.);
  }
`;

export interface SkyPass {
  cloudScene: THREE.Scene;
  skyScene: THREE.Scene;
  uniforms: Record<string, THREE.IUniform>;
  dispose(): void;
}

function fullScreen(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0., 1.);
      }`,
    fragmentShader,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material, geometry: mesh.geometry };
}

export function createSkyPass(colorTexture: THREE.Texture, depthTexture: THREE.Texture, cloudTexture: THREE.Texture): SkyPass {
  const uniforms: Record<string, THREE.IUniform> = {
    uScene: { value: colorTexture },
    uDepth: { value: depthTexture },
    uCloud: { value: cloudTexture },
    uNoise: { value: cloudNoise() },
    uCam: { value: new THREE.Vector3() },
    uRot: { value: new THREE.Matrix3() },
    uTan: { value: new THREE.Vector2(1, 1) },
    uClip: { value: new THREE.Vector2(1, 12000) },
    uSun: { value: SUN },
    uTime: { value: 0 },
    uSteps: { value: 36 },
    uLightSteps: { value: 3 },
    uLayer: { value: new THREE.Vector2(CLOUD_BASE, CLOUD_TOP) },
    uFlash: { value: 0 },
  };
  const clouds = fullScreen(CLOUD_FRAGMENT, uniforms);
  const sky = fullScreen(COMPOSE_FRAGMENT, uniforms);
  return {
    cloudScene: clouds.scene,
    skyScene: sky.scene,
    uniforms,
    dispose() {
      clouds.material.dispose();
      clouds.geometry.dispose();
      sky.material.dispose();
      sky.geometry.dispose();
    },
  };
}
