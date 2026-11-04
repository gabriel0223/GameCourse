import * as THREE from 'three';
import { rightWing } from './jetGame';
import type { Jet, JetRun, Vec } from './jetGame';
import { SUN, createSkyPass } from './jetSky';

// Drawn tiny and scaled up with hard pixels, for the look of an early 3D console.
export const RENDER_W = 320;
export const RENDER_H = 180;
const TRAIL_POINTS = 1800;
const MAX_TRACERS = 48;
const FOV = 52;
const FAR = 12000;
const NEAR = 1;
// How far behind and above the jet the camera rides.
const CAMERA_BACK = 27;
const CAMERA_UP = 6.6;
// Tips the view down a little, so the whole jet sits in frame with the sky ahead of it.
const CAMERA_TILT = -0.1;
const WING_TIP = 7.3;

// Quality steps, from richest to lightest. The game moves between them to hold a smooth frame rate.
const QUALITY = [
  { steps: 48, light: 4 },
  { steps: 36, light: 3 },
  { steps: 26, light: 2 },
  { steps: 18, light: 1 },
];

const SNAP = /* glsl */ `
  // Corners snap to the pixel grid, which gives models the shimmer of early 3D hardware.
  vec4 snapped(vec4 p) {
    vec2 grid = vec2(${RENDER_W / 2}., ${RENDER_H / 2}.);
    p.xy = floor(p.xy / p.w * grid + 0.5) / grid * p.w;
    return p;
  }
`;

// Solid models lit by the low sun, with deep shadow on the far side.
function modelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN } },
    vertexShader: /* glsl */ `
      attribute vec3 color;
      varying vec3 vColor;
      varying vec3 vWorld;
      ${SNAP}
      void main() {
        vColor = color;
        vec4 w = modelMatrix * vec4(position, 1.);
        vWorld = w.xyz;
        gl_Position = snapped(projectionMatrix * viewMatrix * w);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying vec3 vWorld;
      uniform vec3 uSun;
      void main() {
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        vec3 v = normalize(cameraPosition - vWorld);
        if (dot(n, v) < 0.) n = -n;
        float sun = max(dot(n, uSun), 0.);
        vec3 c = vColor * (vec3(0.3, 0.27, 0.3) + vec3(0.15, 0.12, 0.1) * max(n.y, 0.) + vec3(1.1, 0.7, 0.32) * sun);
        vec3 h = normalize(uSun + v);
        c += vec3(1., 0.72, 0.3) * pow(max(dot(n, h), 0.), 40.) * 0.16;
        float rim = pow(1. - max(dot(n, v), 0.), 3.);
        c += vec3(1.0, 0.56, 0.16) * rim * max(dot(-v, uSun), 0.) * 1.1;
        gl_FragColor = vec4(c, 1.);
      }`,
    side: THREE.DoubleSide,
  });
}

class Shape {
  private points: number[] = [];
  private colors: number[] = [];

  private tint(hex: string) {
    return new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
  }

  poly(corners: number[][], hex: string) {
    const c = this.tint(hex);
    for (let i = 1; i < corners.length - 1; i += 1) {
      for (const corner of [corners[0], corners[i], corners[i + 1]]) {
        this.points.push(corner[0], corner[1], corner[2]);
        this.colors.push(c.r, c.g, c.b);
      }
    }
    return this;
  }

  // Adds a piece and its reflection across the middle of the aircraft.
  both(corners: number[][], hex: string) {
    this.poly(corners, hex);
    return this.poly(
      corners.map(([x, y, z]) => [-x, y, z]),
      hex,
    );
  }

  // A hull made of rings along its length. Each ring is [z, half width, half height, center y].
  loft(rings: number[][], sides: number, hex: string, offsetX = 0) {
    const ring = ([z, w, h, y]: number[]) =>
      Array.from({ length: sides }, (_, i) => {
        const a = ((i + 0.5) / sides) * Math.PI * 2;
        return [offsetX + Math.cos(a) * w, y + Math.sin(a) * h, z];
      });
    for (let r = 0; r < rings.length - 1; r += 1) {
      const near = ring(rings[r]);
      const far = ring(rings[r + 1]);
      for (let i = 0; i < sides; i += 1) {
        const j = (i + 1) % sides;
        this.poly([near[i], far[i], far[j], near[j]], hex);
      }
    }
    return this;
  }

  build(material: THREE.Material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.points, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    return new THREE.Mesh(geometry, material);
  }
}

// A twin-engine, twin-tail fighter. The nose points toward -z.
function makeJet() {
  const HULL = '#8C8E96';
  const LIGHT = '#A8A8AC';
  const DARK = '#3C3E48';
  const shape = new Shape();
  shape.loft(
    [
      [-10, 0.04, 0.04, -0.1],
      [-8.6, 0.32, 0.3, -0.1],
      [-6.6, 0.62, 0.56, 0],
      [-4.2, 0.92, 0.82, 0.1],
      [-2, 1.05, 0.86, 0.12],
      [1, 1.15, 0.74, 0.12],
      [5, 1.05, 0.6, 0.1],
      [8, 0.6, 0.4, 0.1],
    ],
    8,
    HULL,
  );
  // Boxy intakes and engine bodies on each side.
  for (const side of [-1, 1]) {
    shape.loft(
      [
        [-3.2, 0.66, 0.62, -0.25],
        [-1, 0.8, 0.72, -0.2],
        [4, 0.84, 0.68, -0.05],
        [7.6, 0.72, 0.62, 0],
        [8.8, 0.62, 0.54, 0],
      ],
      6,
      LIGHT,
      side * 1.42,
    );
    shape.loft(
      [
        [8.7, 0.64, 0.56, 0],
        [9.5, 0.56, 0.5, 0],
        [9.6, 0.3, 0.26, 0],
      ],
      8,
      DARK,
      side * 1.42,
    );
  }
  shape.both([[0.5, -0.1, -3.2], [2.1, -0.1, -3.2], [2.1, -0.85, -3.1], [0.7, -0.85, -3.1]], '#17161C');
  // The canopy, with a dark frame and a sky-tinted glass.
  shape.loft(
    [
      [-6.3, 0.05, 0.05, 0.62],
      [-5.2, 0.42, 0.34, 0.76],
      [-3.8, 0.52, 0.46, 0.92],
      [-2.2, 0.36, 0.32, 0.86],
      [-0.6, 0.06, 0.06, 0.82],
    ],
    6,
    '#26374C',
  );
  // Swept wings and tailplanes, slightly thick at the root.
  const wing = [[1.5, 0.2, -2.2], [WING_TIP, -0.1, 3.7], [WING_TIP, -0.1, 4.8], [2, 0.2, 5.6]];
  shape.both(wing, LIGHT);
  shape.both(wing.map(([x, y, z]) => [x, y - (x < 3 ? 0.3 : 0.04), z]), '#6C6C74');
  shape.both([[WING_TIP - 0.1, -0.09, 3.6], [WING_TIP, -0.1, 3.7], [WING_TIP, -0.1, 4.8], [WING_TIP - 1.5, -0.04, 4.6], [WING_TIP - 1.5, -0.04, 2.5]], '#B8322A');
  shape.both([[1.6, 0.08, 6.2], [4.8, -0.12, 8.6], [4.8, -0.12, 9.5], [1.8, 0.08, 8.9]], HULL);
  // Twin tails, leaning outward.
  shape.both([[1.2, 0.5, 4.9], [1.8, 2.7, 7.7], [1.85, 2.7, 8.8], [1.35, 0.5, 8.3]], '#74747C');
  shape.both([[1.64, 2.0, 6.9], [1.8, 2.7, 7.7], [1.85, 2.7, 8.8], [1.7, 2.0, 8.6]], '#B8322A');
  // Missiles on the wings, with their fins.
  for (const x of [-5.6, -3.9, 3.9, 5.6]) {
    shape.loft(
      [
        [0.6, 0.02, 0.02, -0.55],
        [1.1, 0.17, 0.17, -0.55],
        [5, 0.17, 0.17, -0.55],
      ],
      5,
      '#D4D0C8',
      x,
    );
    shape.poly([[x, -0.25, 2.6], [x, -0.1, 2.6], [x, -0.1, 4.2], [x, -0.36, 4.2]], '#4A4A52');
  }
  const jet = new THREE.Group();
  jet.add(shape.build(modelMaterial()));
  const flames: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const cone = new THREE.ConeGeometry(0.5, 4, 6);
    cone.rotateX(-Math.PI / 2);
    cone.translate(0, 0, 2);
    const flame = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.0, 0.35) }));
    flame.position.set(side * 1.42, 0, 9.3);
    jet.add(flame);
    flames.push(flame);
  }
  return { jet, flames };
}

function makeDrone() {
  const shape = new Shape();
  shape.loft(
    [
      [-5.4, 0.1, 0.08, 0],
      [-2.6, 1.4, 0.8, 0.1],
      [1.4, 1.7, 0.9, 0.1],
      [4.6, 0.7, 0.4, 0],
    ],
    6,
    '#3A3640',
  );
  shape.both([[1, 0, -2.6], [8.6, -0.2, 3.2], [8.6, -0.2, 4], [1.2, 0, 3.8]], '#55505A');
  shape.both([[0.6, 0.6, 2], [2.2, 2.3, 4.2], [2.2, 2.3, 4.9], [0.7, 0.6, 4.4]], '#2C2830');
  const drone = new THREE.Group();
  drone.add(shape.build(modelMaterial()));
  const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.08, 0.08) }));
  eye.position.set(0, 0.55, -2.8);
  drone.add(eye);
  return drone;
}

function makeMissile(enemy: boolean) {
  const shape = new Shape();
  shape.loft(
    [
      [-2.3, 0.02, 0.02, 0],
      [-1.6, 0.26, 0.26, 0],
      [2.2, 0.26, 0.26, 0],
    ],
    5,
    enemy ? '#C8301E' : '#E8E4DC',
  );
  shape.both([[0.05, 0, 1.2], [0.8, 0, 2.2], [0.05, 0, 2.2]], '#4A4A52');
  return shape.build(modelMaterial());
}

function makeTrails() {
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3);
  const velocity = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3);
  const color = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3);
  const born = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS).fill(-100), 1);
  const span = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS).fill(1.8), 1);
  geometry.setAttribute('position', position);
  geometry.setAttribute('aVelocity', velocity);
  geometry.setAttribute('aColor', color);
  geometry.setAttribute('aBorn', born);
  geometry.setAttribute('aSpan', span);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aVelocity;
      attribute vec3 aColor;
      attribute float aBorn;
      attribute float aSpan;
      uniform float uTime;
      varying vec3 vColor;
      varying float vLife;
      void main() {
        float age = uTime - aBorn;
        vLife = 1. - age / aSpan;
        vColor = aColor;
        vec4 p = viewMatrix * vec4(position + aVelocity * age, 1.);
        gl_Position = projectionMatrix * p;
        gl_PointSize = vLife > 0. ? clamp((1. + 2.5 * vLife) * 90. / max(-p.z, 1.), 1., 3.) : 0.;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vLife;
      float pattern(vec2 p) {
        const float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
        ivec2 i = ivec2(mod(p, 4.));
        return (m[i.y * 4 + i.x] + 0.5) / 16.;
      }
      void main() {
        // Fades through a dither pattern instead of transparency.
        if (vLife <= 0. || pattern(gl_FragCoord.xy) > vLife * 1.5) discard;
        gl_FragColor = vec4(vColor, 1.);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  let next = 0;
  const emit = (at: Vec, time: number, tint: THREE.Color, drift: Vec = { x: 0, y: 0, z: 0 }, life = 1.8) => {
    position.setXYZ(next, at.x, at.y, at.z);
    velocity.setXYZ(next, drift.x, drift.y, drift.z);
    color.setXYZ(next, tint.r, tint.g, tint.b);
    born.setX(next, time);
    span.setX(next, life);
    next = (next + 1) % TRAIL_POINTS;
    position.needsUpdate = true;
    velocity.needsUpdate = true;
    color.needsUpdate = true;
    born.needsUpdate = true;
    span.needsUpdate = true;
  };
  return { points, emit, material };
}

function makeTracers() {
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array(MAX_TRACERS * 6), 3);
  geometry.setAttribute('position', position);
  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: new THREE.Color(1.4, 1.15, 0.5) }));
  lines.frustumCulled = false;
  const update = (run: JetRun) => {
    const bullets = run.bullets.slice(-MAX_TRACERS);
    bullets.forEach((bullet, index) => {
      const { pos, vel } = bullet;
      position.setXYZ(index * 2, pos.x, pos.y, pos.z);
      position.setXYZ(index * 2 + 1, pos.x - vel.x * 0.022, pos.y - vel.y * 0.022, pos.z - vel.z * 0.022);
    });
    position.needsUpdate = true;
    geometry.setDrawRange(0, bullets.length * 2);
  };
  return { lines, update };
}

export interface ViewInput {
  lookX: number;
  lookY: number;
  delta: number;
  // Keeps the camera still in tests and pictures.
  time: number;
}

const toThree = (at: Vec) => new THREE.Vector3(at.x, at.y, at.z);

export interface Projected {
  x: number;
  y: number;
  front: boolean;
}

export interface JetScene {
  render(run: JetRun, view: ViewInput): void;
  project(at: Vec): Projected;
  quality: number;
  dispose(): void;
}

const VAPOR = new THREE.Color(0.95, 0.9, 0.78);
const SMOKE = new THREE.Color(0.86, 0.8, 0.7);
const ENEMY_SMOKE = new THREE.Color(0.9, 0.3, 0.12);
const FIRE = [new THREE.Color(1.3, 1.0, 0.4), new THREE.Color(1.1, 0.45, 0.08), new THREE.Color(0.2, 0.14, 0.14)];
const SPARK = new THREE.Color(1.3, 1.1, 0.5);

// Builds a rotation from the way the jet is pointing. Three.js cameras and models face -z, like the jet.
function attitude(jet: Jet, target: THREE.Quaternion) {
  const nose = toThree(jet.nose);
  const up = toThree(jet.up);
  const right = new THREE.Vector3().crossVectors(nose, up);
  return target.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, nose.negate()));
}

export function createJetScene(canvas: HTMLCanvasElement): JetScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(RENDER_W, RENDER_H, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = true;
  renderer.setClearColor(0x000000, 0);

  const depthTexture = new THREE.DepthTexture(RENDER_W, RENDER_H);
  depthTexture.type = THREE.UnsignedIntType;
  const target = new THREE.WebGLRenderTarget(RENDER_W, RENDER_H, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthTexture,
  });
  // Half-float colors keep dark cloud shading smooth, and nearly every graphics card supports them.
  const floats = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  const cloudTarget = new THREE.WebGLRenderTarget(RENDER_W, RENDER_H, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: floats ? THREE.HalfFloatType : THREE.UnsignedByteType,
    depthBuffer: false,
  });
  const sky = createSkyPass(target.texture, depthTexture, cloudTarget.texture);
  const skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, RENDER_W / RENDER_H, NEAR, FAR);
  const trails = makeTrails();
  const tracers = makeTracers();
  const { jet, flames } = makeJet();
  scene.add(trails.points, tracers.lines, jet);

  const drones = new Map<number, THREE.Group>();
  const missiles = new Map<number, THREE.Mesh>();
  const blasts: Array<{ mesh: THREE.Mesh; age: number; size: number }> = [];
  const blastMaterial = new THREE.ShaderMaterial({
    uniforms: { uLife: { value: 1 } },
    vertexShader: /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */ `
      uniform float uLife;
      void main() {
        if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.) > uLife * 2.) discard;
        gl_FragColor = vec4(mix(vec3(1.1, 0.4, 0.06), vec3(1.4, 1.1, 0.5), uLife), 1.);
      }`,
  });
  const blastShape = new THREE.IcosahedronGeometry(1, 1);
  const camPos = new THREE.Vector3();
  const camTurn = new THREE.Quaternion();
  const jetTurn = new THREE.Quaternion();
  const swing = new THREE.Quaternion();
  const swingEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const back = new THREE.Vector3();
  const look = { x: 0, y: 0 };
  let started = false;
  let flash = 0;
  let shake = 0;
  let level = 1;
  let slow = 0;
  let quick = 0;

  // Moves between quality steps slowly, so the picture doesn't keep changing.
  const adapt = (delta: number) => {
    slow = delta > 0.021 ? slow + 1 : Math.max(0, slow - 2);
    quick = delta < 0.0145 ? quick + 1 : 0;
    if (slow > 30 && level < QUALITY.length - 1) {
      level += 1;
      slow = 0;
      quick = 0;
    } else if (quick > 400 && level > 0) {
      level -= 1;
      quick = 0;
    }
  };

  const blast = (at: Vec, size: number, time: number) => {
    const material = blastMaterial.clone();
    const mesh = new THREE.Mesh(blastShape, material);
    mesh.position.copy(toThree(at));
    scene.add(mesh);
    blasts.push({ mesh, age: 0, size });
    for (let i = 0; i < 70; i += 1) {
      const angle = (i / 70) * Math.PI * 14;
      const rise = (i / 70) * 2 - 1;
      const spread = Math.sqrt(Math.max(0, 1 - rise * rise)) * size * 2.6;
      trails.emit(at, time, FIRE[i % FIRE.length], { x: Math.cos(angle) * spread, y: rise * size * 2.6, z: Math.sin(angle) * spread });
    }
    flash = Math.max(flash, 0.12);
  };

  const api: JetScene = {
    quality: level,
    render(run, view) {
      const { delta, time } = view;
      adapt(delta);
      api.quality = level;
      trails.material.uniforms.uTime.value = time;
      tracers.update(run);

      for (const event of run.events) {
        if (event.type === 'drone-down') blast(event.pos, 22, time);
        if (event.type === 'crashed') blast(event.pos, 16, time);
        if (event.type === 'drone-hit') {
          for (let i = 0; i < 6; i += 1) {
            const a = (i / 6) * Math.PI * 2;
            trails.emit(event.pos, time, SPARK, { x: Math.cos(a) * 40, y: Math.sin(a) * 40, z: Math.cos(a * 2) * 30 }, 0.4);
          }
        }
      }
      run.events.length = 0;

      attitude(run.jet, jetTurn);
      jet.visible = run.status !== 'over';
      jet.position.copy(toThree(run.jet.pos));
      jet.quaternion.copy(jetTurn);
      // The rudder leans the model a little, so a flat turn still feels like a turn.
      jet.rotateZ(-run.jet.yawRate * 0.3);
      const boost = Math.max(0, (run.jet.speed - 120) / 70);
      const burn = 0.45 + boost * 0.8 + Math.sin(time * 47) * 0.08;
      for (const flame of flames) flame.scale.set(0.8 + boost * 0.3, 0.8 + boost * 0.3, burn);

      // Hard turns pull white vapor off the wingtips, which also draws out the shape of a roll.
      const strain = Math.abs(run.jet.pitchRate) + Math.abs(run.jet.rollRate) * 0.35;
      if (run.status === 'running' && strain > 0.85) {
        const right = rightWing(run.jet);
        for (const side of [-1, 1]) {
          const tip = { x: run.jet.pos.x + right.x * WING_TIP * side, y: run.jet.pos.y + right.y * WING_TIP * side, z: run.jet.pos.z + right.z * WING_TIP * side };
          trails.emit(tip, time, VAPOR, undefined, 0.9);
        }
      }

      const seen = new Set<number>();
      for (const drone of run.drones) {
        seen.add(drone.id);
        let mesh = drones.get(drone.id);
        if (!mesh) {
          mesh = makeDrone();
          // Oversized on purpose, so a drone is more than a speck at this resolution.
          mesh.scale.setScalar(2.4);
          drones.set(drone.id, mesh);
          scene.add(mesh);
        }
        mesh.position.copy(toThree(drone.pos));
        mesh.rotation.set(0, -drone.yaw, -(drone.wantYaw - drone.yaw) * 0.6, 'YXZ');
      }
      for (const [id, mesh] of drones) {
        if (!seen.has(id)) {
          scene.remove(mesh);
          drones.delete(id);
        }
      }

      seen.clear();
      for (const missile of run.missiles) {
        seen.add(missile.id);
        let mesh = missiles.get(missile.id);
        if (!mesh) {
          mesh = makeMissile(missile.enemy);
          missiles.set(missile.id, mesh);
          scene.add(mesh);
        }
        mesh.position.copy(toThree(missile.pos));
        mesh.lookAt(mesh.position.clone().sub(toThree(missile.dir)));
        if (run.status === 'running') trails.emit(missile.pos, time, missile.enemy ? ENEMY_SMOKE : SMOKE);
      }
      for (const [id, mesh] of missiles) {
        if (!seen.has(id)) {
          scene.remove(mesh);
          missiles.delete(id);
        }
      }

      for (const item of blasts) {
        item.age += delta;
        item.mesh.scale.setScalar(item.size * (0.4 + item.age * 2.6));
        (item.mesh.material as THREE.ShaderMaterial).uniforms.uLife.value = Math.max(0, 1 - item.age * 1.8);
      }
      while (blasts.length && blasts[0].age > 0.6) {
        const item = blasts.shift();
        if (item) {
          scene.remove(item.mesh);
          (item.mesh.material as THREE.Material).dispose();
        }
      }

      // The camera follows with a little lag, so a turn shows the jet swinging into it.
      if (!started) camTurn.copy(jetTurn);
      camTurn.slerp(jetTurn, Math.min(1, delta * 8.5));
      const ease = Math.min(1, delta * 6);
      look.x += (view.lookX - look.x) * ease;
      look.y += (view.lookY - look.y) * ease;
      swingEuler.set(CAMERA_TILT - look.y * 1.1, -look.x * 2.7, 0);
      swing.setFromEuler(swingEuler);
      const turn = camTurn.clone().multiply(swing);
      const reach = CAMERA_BACK + boost * 2.2;
      back.set(0, CAMERA_UP, reach).applyQuaternion(turn);
      const wanted = toThree(run.jet.pos).add(back);
      wanted.y = Math.max(wanted.y, 6);
      if (run.firing) shake = 0.12;
      shake = Math.max(0, shake - delta);
      if (shake > 0) wanted.add(new THREE.Vector3(Math.sin(time * 91) * 0.07, Math.sin(time * 113) * 0.07, 0));
      camPos.copy(wanted);
      started = true;
      camera.position.copy(camPos);
      camera.quaternion.copy(turn);
      camera.fov = FOV + boost * 7;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      flash = Math.max(0, flash - delta * 0.5);
      const uniforms = sky.uniforms;
      (uniforms.uCam.value as THREE.Vector3).copy(camera.position);
      (uniforms.uRot.value as THREE.Matrix3).setFromMatrix4(camera.matrixWorld);
      const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      (uniforms.uTan.value as THREE.Vector2).set(tanY * camera.aspect, tanY);
      (uniforms.uClip.value as THREE.Vector2).set(NEAR, FAR);
      uniforms.uTime.value = time;
      uniforms.uSteps.value = QUALITY[level].steps;
      uniforms.uLightSteps.value = QUALITY[level].light;
      uniforms.uFlash.value = flash;

      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(cloudTarget);
      renderer.render(sky.cloudScene, skyCamera);
      renderer.setRenderTarget(null);
      renderer.render(sky.skyScene, skyCamera);
    },
    project(at) {
      const point = toThree(at);
      const ahead = point.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3())) > 0;
      point.project(camera);
      return { x: point.x, y: point.y, front: ahead };
    },
    dispose() {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | undefined;
        material?.dispose?.();
      });
      blastShape.dispose();
      blastMaterial.dispose();
      sky.dispose();
      depthTexture.dispose();
      target.dispose();
      cloudTarget.dispose();
      renderer.dispose();
    },
  };
  return api;
}

