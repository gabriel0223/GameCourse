import * as THREE from 'three';

// Love Attack's white bear as a low-poly model: an original polar bear cub in a red scarf.
// It faces +x, stands on y = 0, and is about 2 units tall.

export interface BearPose {
  // Seconds, for the scarf and breathing.
  time: number;
  // How fast she's really moving, in units per second. The stride follows it, so feet don't slide.
  speed: number;
  dashing: boolean;
  drawing: boolean;
  // The direction to face, in radians around the vertical axis.
  heading: number;
  delta: number;
  // Seconds since she grabbed a plushie, for a happy hop.
  cheer: number;
  // Seconds since she let an arrow go, for a little kick back.
  recoil: number;
}

export interface Bear {
  group: THREE.Group;
  // Returns true on the frame a foot lands, so the scene can kick up dust.
  pose(pose: BearPose): boolean;
  dispose(): void;
}

// A running gait shared by every bear: the stride advances with distance covered, the body
// bounces twice per stride, squashes as each foot lands, and leans forward with speed.
interface Gait {
  stride: number;
  walk: number;
  swing: number;
  lift: number;
  bounce: number;
  squash: number;
}

const newGait = (): Gait => ({ stride: 0, walk: 0, swing: 0, lift: 0, bounce: 0, squash: 0 });

function stepGait(gait: Gait, speed: number, delta: number, runSpeed: number, strideLength: number): boolean {
  const before = Math.sin(gait.stride);
  // Eases in and out, so starting and stopping don't snap.
  const target = Math.min(1, speed / runSpeed);
  gait.walk += (target - gait.walk) * Math.min(1, delta * 14);
  gait.stride += (speed * delta * Math.PI) / strideLength;
  const phase = Math.sin(gait.stride);
  gait.swing = phase * 0.95 * gait.walk;
  gait.lift = Math.cos(gait.stride) * 0.12 * gait.walk;
  gait.bounce = Math.abs(phase) * 0.17 * gait.walk;
  gait.squash = (1 - Math.abs(phase)) ** 4 * gait.walk;
  return gait.walk > 0.2 && Math.sign(phase) !== Math.sign(before);
}

// Smooth shading for the full 3D look, or flat facets for the pixel look.
const fill = (hex: string, smooth: boolean) => new THREE.MeshLambertMaterial({ color: hex, flatShading: !smooth });

export function createBear(smooth: boolean): Bear {
  const flat = (hex: string) => fill(hex, smooth);
  const detail = smooth ? 3 : 1;
  const fur = flat('#FBF8FF');
  // A little glow of its own keeps white fur white, even on the shaded side.
  fur.emissive.set('#4A4458');
  const muzzle = flat('#EFE6F6');
  muzzle.emissive.set('#3A3446');
  const pad = flat('#E9B9C9');
  const ink = new THREE.MeshBasicMaterial({ color: '#2B1B38' });
  const shine = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const scarf = flat('#E8476F');
  const scarfShade = flat('#B32F55');
  const ball = new THREE.IcosahedronGeometry(1, detail);
  const round = new THREE.IcosahedronGeometry(1, detail + 1);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const ring = smooth ? new THREE.TorusGeometry(0.31, 0.085, 12, 32) : new THREE.TorusGeometry(0.31, 0.085, 5, 12);
  const geometries = [ball, round, box, ring];
  const materials = [fur, muzzle, pad, ink, shine, scarf, scarfShade];

  const part = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  };

  const group = new THREE.Group();
  // Everything that turns to face her aim.
  const turn = new THREE.Group();
  group.add(turn);
  // Everything above the legs, so the body can bob and lean on its own.
  const body = new THREE.Group();
  turn.add(body);

  // Chibi proportions: a small body under a big head, so the face reads from far away.
  body.add(part(ball, fur, 0, 0.56, 0, 0.36, 0.4, 0.34));
  body.add(part(ball, muzzle, 0.18, 0.52, 0, 0.19, 0.25, 0.25));
  body.add(part(ball, fur, -0.34, 0.45, 0, 0.09));

  const head = new THREE.Group();
  head.position.set(0.05, 1.2, 0);
  body.add(head);
  head.add(part(round, fur, 0, 0, 0, 0.53, 0.48, 0.51));
  head.add(part(ball, muzzle, 0.45, -0.12, 0, 0.21, 0.16, 0.2));
  head.add(part(round, ink, 0.64, -0.07, 0, 0.08, 0.065, 0.09));
  for (const side of [-1, 1]) {
    head.add(part(round, ink, 0.38, 0.06, side * 0.27, 0.075, 0.1, 0.07));
    head.add(part(box, shine, 0.43, 0.11, side * 0.29, 0.03, 0.035, 0.02));
    const ear = new THREE.Group();
    ear.position.set(-0.1, 0.4, side * 0.33);
    ear.add(part(ball, fur, 0, 0, 0, 0.16, 0.15, 0.1));
    ear.add(part(ball, pad, 0.05, -0.01, side * 0.025, 0.09, 0.085, 0.05));
    head.add(ear);
  }

  // The scarf wraps the neck, and its tail streams out behind.
  const wrap = new THREE.Mesh(ring, scarf);
  wrap.position.set(0.02, 0.88, 0);
  wrap.rotation.x = Math.PI / 2;
  wrap.scale.set(1.05, 1, 1.2);
  body.add(wrap);
  const tail = new THREE.Group();
  tail.position.set(-0.3, 0.88, 0.14);
  body.add(tail);
  const tailNear = part(box, scarf, -0.13, -0.02, 0, 0.28, 0.07, 0.14);
  const tailFar = part(box, scarfShade, -0.34, -0.06, 0, 0.18, 0.06, 0.13);
  tail.add(tailNear, tailFar);

  const limb = (x: number, y: number, z: number, sx: number, sy: number, sz: number, padded: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const mesh = part(ball, fur, 0, -sy * 0.75, 0, sx, sy, sz);
    pivot.add(mesh);
    if (padded) pivot.add(part(ball, pad, 0.06, -sy * 1.45, 0, sx * 0.55, sy * 0.25, sz * 0.7));
    return pivot;
  };
  const legs = [limb(0, 0.3, 0.2, 0.15, 0.2, 0.15, true), limb(0, 0.3, -0.2, 0.15, 0.2, 0.15, true)];
  const arms = [limb(0.08, 0.82, 0.36, 0.11, 0.22, 0.11, false), limb(0.08, 0.82, -0.36, 0.11, 0.22, 0.11, false)];
  turn.add(...legs);
  body.add(...arms);

  group.scale.setScalar(1.3);

  let heading = 0;
  let bank = 0;
  const gait = newGait();
  return {
    group,
    pose({ time, speed, dashing, drawing, heading: target, delta, cheer, recoil }) {
      // Snappy turns, with a lean into the turn while running.
      let gap = target - heading;
      gap = Math.atan2(Math.sin(gap), Math.cos(gap));
      heading += gap * Math.min(1, delta * 26);
      turn.rotation.y = heading;
      const footfall = stepGait(gait, dashing ? Math.min(speed, 14) : speed, delta, 8.5, 0.62);
      const { walk, swing, lift, bounce, squash } = gait;
      bank += (Math.max(-0.4, Math.min(0.4, -gap * 0.9)) * walk - bank) * Math.min(1, delta * 10);
      turn.rotation.x = bank;

      legs[0].rotation.z = swing;
      legs[1].rotation.z = -swing;
      legs[0].position.y = 0.3 + Math.max(0, lift);
      legs[1].position.y = 0.3 + Math.max(0, -lift);
      // Arms pump against the legs, or hold the bow out in front while drawing.
      arms[0].rotation.z = drawing ? 1.3 : -swing * 1.15;
      arms[1].rotation.z = drawing ? 1.1 : swing * 1.15;
      arms[0].rotation.x = drawing ? -0.35 : -0.15 * walk;
      arms[1].rotation.x = drawing ? 0.35 : 0.15 * walk;

      const breathe = Math.sin(time * 2.6) * 0.015 * (1 - walk);
      body.position.y = bounce + breathe;
      // Squashes as each foot lands, and stretches long during a dash.
      const stretch = dashing ? 0.16 : 0;
      body.scale.set(1 + squash * 0.07 + stretch, 1 - squash * 0.1 - stretch * 0.6, 1 + squash * 0.07);
      body.rotation.z = dashing ? -0.6 : -0.3 * walk;
      // A quick shove back when an arrow flies.
      const kick = recoil < 0.16 ? 1 - recoil / 0.16 : 0;
      body.position.x = -kick * 0.14;
      if (dashing) {
        arms[0].rotation.z = -1.3;
        arms[1].rotation.z = -1.3;
      }

      // A happy hop with both arms up after a grab.
      const hop = cheer < 0.4 ? Math.sin((cheer / 0.4) * Math.PI) : 0;
      turn.position.y = hop * 0.55;
      if (hop > 0 && !drawing) {
        arms[0].rotation.z = 2.7 * hop;
        arms[1].rotation.z = 2.7 * hop;
      }
      // Tipped up so the camera above can see her face, nodding with each step.
      head.rotation.z = 0.28 - bounce * 0.6 + Math.sin(time * 1.7) * 0.04 * (1 - walk);

      tail.rotation.y = 0.35 + Math.sin(time * (7 + walk * 10)) * (0.15 + walk * 0.3);
      tail.rotation.z = -0.25 + walk * 0.5 + Math.sin(time * 11) * 0.08;
      tailFar.rotation.z = Math.sin(time * 13 + 1) * 0.35;
      return footfall;
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}

// The plushies she collects: an original sitting teddy with a red bow, facing the camera.
export interface TeddyKit {
  make(): THREE.Group;
  dispose(): void;
}

export function createTeddyKit(smooth: boolean): TeddyKit {
  const flat = (hex: string) => fill(hex, smooth);
  const detail = smooth ? 3 : 1;
  const brown = flat('#A06B44');
  brown.emissive.set('#2A160C');
  const tan = flat('#E2BC8E');
  tan.emissive.set('#2A1E10');
  const ink = new THREE.MeshBasicMaterial({ color: '#2B1B38' });
  const shine = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const bow = flat('#E8476F');
  const ball = new THREE.IcosahedronGeometry(1, detail);
  const round = new THREE.IcosahedronGeometry(1, detail + 1);
  const box = new THREE.BoxGeometry(1, 1, 1);

  const part = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };

  return {
    make() {
      const group = new THREE.Group();
      const teddy = new THREE.Group();
      // Leans back a little, so its face looks up at the camera.
      teddy.rotation.x = -0.35;
      group.add(teddy);
      part(teddy, ball, brown, 0, 0.3, 0, 0.3, 0.29, 0.26);
      part(teddy, ball, tan, 0, 0.27, 0.19, 0.17, 0.17, 0.08);
      for (const side of [-1, 1]) {
        part(teddy, ball, brown, side * 0.16, 0.1, 0.17, 0.11, 0.09, 0.15);
        part(teddy, ball, tan, side * 0.16, 0.1, 0.31, 0.07, 0.07, 0.03);
        part(teddy, ball, brown, side * 0.3, 0.33, 0.06, 0.08, 0.14, 0.08);
        part(teddy, ball, brown, side * 0.2, 0.98, 0, 0.1, 0.1, 0.06);
        part(teddy, ball, tan, side * 0.2, 0.98, 0.04, 0.055, 0.055, 0.03);
        part(teddy, round, ink, side * 0.11, 0.78, 0.25, 0.045, 0.045, 0.03);
        part(teddy, box, shine, side * 0.11 + 0.015, 0.795, 0.275, 0.015, 0.015, 0.01);
        // The bow's two loops.
        const loop = part(teddy, box, bow, side * 0.1, 0.55, 0.24, 0.13, 0.08, 0.04);
        loop.rotation.z = side * 0.35;
      }
      part(teddy, round, brown, 0, 0.75, 0, 0.3, 0.27, 0.27);
      part(teddy, ball, tan, 0, 0.68, 0.22, 0.12, 0.09, 0.08);
      part(teddy, round, ink, 0, 0.71, 0.3, 0.045, 0.035, 0.03);
      part(teddy, ball, bow, 0, 0.55, 0.26, 0.05, 0.05, 0.04);
      group.scale.setScalar(1.25);
      return group;
    },
    dispose() {
      for (const geometry of [ball, round, box]) geometry.dispose();
      for (const material of [brown, tan, ink, shine, bow]) material.dispose();
    },
  };
}

// The jealous bears: original pandas with a hair bow, lashes, a pout, and an anger mark.
// Like the white bear, each faces +x and stands on y = 0.
export type PandaKind = 'chaser' | 'thrower' | 'brute';

export interface PandaPose {
  time: number;
  delta: number;
  speed: number;
  heading: number;
  // 0 to 1 through a wind-up, or 0 when not winding up.
  windup: number;
  charging: boolean;
  // Lights up for a moment when an arrow hits.
  flash: boolean;
}

export interface Panda {
  group: THREE.Group;
  pose(pose: PandaPose): void;
  dispose(): void;
}

export interface PandaKit {
  make(kind: PandaKind): Panda;
  dispose(): void;
}

const BOWS: Record<PandaKind, string> = { chaser: '#FF5C93', thrower: '#A86BE8', brute: '#E83A4F' };
const SIZES: Record<PandaKind, number> = { chaser: 1.08, thrower: 1.08, brute: 1.75 };

export function createPandaKit(smooth: boolean): PandaKit {
  const flat = (hex: string) => fill(hex, smooth);
  const detail = smooth ? 3 : 1;
  const black = flat('#2A2530');
  const lips = flat('#F07FA2');
  const anger = new THREE.MeshBasicMaterial({ color: '#FF3B4E' });
  const shine = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const heartMaterial = flat('#8E4BC4');
  const bows = Object.fromEntries(Object.entries(BOWS).map(([kind, hex]) => [kind, flat(hex)])) as Record<PandaKind, THREE.MeshLambertMaterial>;
  const ball = new THREE.IcosahedronGeometry(1, detail);
  const round = new THREE.IcosahedronGeometry(1, detail + 1);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const vein = new THREE.TorusGeometry(0.11, 0.032, 6, 12, Math.PI / 2);
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.5);
  heartShape.bezierCurveTo(-0.12, -0.36, -0.62, -0.06, -0.56, 0.22);
  heartShape.bezierCurveTo(-0.5, 0.52, -0.12, 0.56, 0, 0.3);
  heartShape.bezierCurveTo(0.12, 0.56, 0.5, 0.52, 0.56, 0.22);
  heartShape.bezierCurveTo(0.62, -0.06, 0.12, -0.36, 0, -0.5);
  const heart = new THREE.ExtrudeGeometry(heartShape, { depth: 0.2, bevelEnabled: false, curveSegments: smooth ? 12 : 4 });
  heart.translate(0, 0, -0.1);

  return {
    make(kind) {
      // Each panda has its own white, so it can flash on a hit without flashing the others.
      const white = flat('#FAF8F6');
      white.emissive.set('#1E1C22');
      const part = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        parent.add(mesh);
        return mesh;
      };

      const group = new THREE.Group();
      const turn = new THREE.Group();
      group.add(turn);
      const body = new THREE.Group();
      turn.add(body);
      part(body, ball, white, 0, 0.55, 0, 0.34, 0.38, 0.32);
      // The black band over the shoulders that every panda has.
      part(body, ball, black, -0.03, 0.8, 0, 0.33, 0.16, 0.34);
      part(body, ball, black, -0.31, 0.45, 0, 0.08);

      const head = new THREE.Group();
      head.position.set(0.05, 1.17, 0);
      body.add(head);
      part(head, round, white, 0, 0, 0, 0.5, 0.46, 0.48);
      part(head, ball, white, 0.43, -0.12, 0, 0.19, 0.14, 0.18);
      part(head, round, black, 0.6, -0.07, 0, 0.07, 0.055, 0.08);
      // A little pout.
      part(head, ball, lips, 0.56, -0.2, 0, 0.04, 0.03, 0.065);
      for (const side of [-1, 1]) {
        part(head, ball, black, -0.08, 0.37, side * 0.31, 0.15, 0.14, 0.09);
        // Droopy eye patches with a bright eye inside.
        const patch = part(head, round, black, 0.36, 0.02, side * 0.21, 0.12, 0.16, 0.09);
        patch.rotation.x = side * 0.5;
        part(head, round, shine, 0.45, 0.05, side * 0.23, 0.045, 0.05, 0.04);
        // Angry brows that tilt down toward the middle.
        const brow = part(head, box, black, 0.42, 0.22, side * 0.2, 0.05, 0.05, 0.2);
        brow.rotation.x = side * 0.55;
        // Lashes flick out from the outer corner of each eye.
        for (const [dy, tilt] of [
          [0.1, 0.5],
          [0.05, 0.9],
        ] as const) {
          const lash = part(head, box, black, 0.4, 0.04 + dy, side * 0.33, 0.02, 0.09, 0.025);
          lash.rotation.x = side * tilt;
        }
      }
      // A hair bow in her own color, perched by one ear.
      const bow = new THREE.Group();
      bow.position.set(0.02, 0.44, 0.17);
      bow.rotation.x = 0.35;
      for (const side of [-1, 1]) {
        const loop = part(bow, ball, bows[kind], 0, 0, side * 0.1, 0.06, 0.08, 0.1);
        loop.rotation.x = side * 0.4;
      }
      part(bow, ball, bows[kind], 0, 0, 0, 0.045);
      head.add(bow);

      // The anger mark: four curved strokes bulging toward the middle, like a popping vein.
      const mark = new THREE.Group();
      for (const [sx, sy, spin] of [
        [1, 1, Math.PI],
        [-1, 1, Math.PI * 1.5],
        [-1, -1, 0],
        [1, -1, Math.PI / 2],
      ]) {
        const stroke = new THREE.Mesh(vein, anger);
        stroke.position.set(sx * 0.15, sy * 0.15, 0);
        stroke.rotation.z = spin;
        mark.add(stroke);
      }
      mark.position.set(0.15, 2.3, 0.25);
      group.add(mark);

      const limb = (parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, y, z);
        part(pivot, ball, black, 0, -sy * 0.75, 0, sx, sy, sz);
        parent.add(pivot);
        return pivot;
      };
      const legs = [limb(turn, 0, 0.3, 0.18, 0.14, 0.19, 0.14), limb(turn, 0, 0.3, -0.18, 0.14, 0.19, 0.14)];
      const arms = [limb(body, 0.06, 0.8, 0.33, 0.1, 0.21, 0.1), limb(body, 0.06, 0.8, -0.33, 0.1, 0.21, 0.1)];
      // Throwers hold up a broken heart while winding up.
      const held = part(arms[0], heart, heartMaterial, 0, -0.5, 0, 0.42);
      held.rotation.y = Math.PI / 2;
      held.visible = false;

      group.scale.setScalar(SIZES[kind]);
      const gait = newGait();
      let heading = 0;
      return {
        group,
        pose({ time, delta, speed, heading: target, windup, charging, flash }) {
          let gap = target - heading;
          gap = Math.atan2(Math.sin(gap), Math.cos(gap));
          heading += gap * Math.min(1, delta * 14);
          turn.rotation.y = heading;
          stepGait(gait, speed, delta, kind === 'brute' ? 6 : 5.5, kind === 'brute' ? 0.7 : 0.5);
          const { walk, swing, lift, bounce, squash } = gait;
          legs[0].rotation.z = swing;
          legs[1].rotation.z = -swing;
          legs[0].position.y = 0.3 + Math.max(0, lift);
          legs[1].position.y = 0.3 + Math.max(0, -lift);
          // Stomping mad: arms swing hard, fists up.
          arms[0].rotation.z = -swing * 1.2;
          arms[1].rotation.z = swing * 1.2;
          body.position.y = bounce + Math.sin(time * 3 + group.id) * 0.012 * (1 - walk);
          body.scale.set(1 + squash * 0.08, 1 - squash * 0.11, 1 + squash * 0.08);
          body.rotation.z = -0.32 * walk;
          head.rotation.z = 0.28 - bounce * 0.6;
          held.visible = false;
          body.position.x = 0;
          arms[0].rotation.x = 0;
          if (windup > 0 && kind === 'thrower') {
            // Holds the broken heart up over her head, leaning back to throw.
            held.visible = true;
            arms[0].rotation.z = 2.9 * Math.min(1, windup * 1.8);
            arms[0].rotation.x = 0.25;
            body.rotation.z = 0.25 * windup;
          } else if (windup > 0 && kind === 'brute') {
            // Crouches and shakes with rage before the charge.
            body.scale.set(1.08, 0.86, 1.08);
            body.position.x = Math.sin(time * 70) * 0.04;
            body.rotation.z = -0.45;
            arms[0].rotation.z = -0.8;
            arms[1].rotation.z = -0.8;
          } else if (charging) {
            body.rotation.z = -0.7;
            arms[0].rotation.z = -1.5;
            arms[1].rotation.z = -1.5;
          }
          white.emissive.set(flash ? '#FFFFFF' : windup > 0 && kind === 'brute' ? '#5A1020' : '#1E1C22');
          // The mark faces the camera and throbs, faster when she's about to attack.
          mark.rotation.y = 0;
          const throb = 1 + Math.max(0, Math.sin(time * (windup > 0 ? 24 : 9) + group.id)) * 0.35;
          mark.scale.setScalar(throb);
          mark.position.y = 2.3 + bounce;
        },
        dispose() {
          white.dispose();
        },
      };
    },
    dispose() {
      for (const geometry of [ball, round, box, heart, vein]) geometry.dispose();
      for (const material of [black, lips, anger, shine, heartMaterial, ...Object.values(bows)]) material.dispose();
    },
  };
}
