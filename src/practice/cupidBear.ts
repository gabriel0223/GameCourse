import * as THREE from 'three';

// Love Attack's white bear as a low-poly model: an original polar bear cub in a red scarf.
// It faces +x, stands on y = 0, and is about 2 units tall.

export interface BearPose {
  // Seconds, for the walk cycle and the scarf.
  time: number;
  // 0 when still, 1 at full walking speed.
  walk: number;
  dashing: boolean;
  drawing: boolean;
  // The direction to face, in radians around the vertical axis.
  heading: number;
  delta: number;
  // Seconds since she grabbed a plushie, for a happy hop.
  cheer: number;
}

export interface Bear {
  group: THREE.Group;
  pose(pose: BearPose): void;
  dispose(): void;
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
  let stride = 0;
  return {
    group,
    pose({ time, walk, dashing, drawing, heading: target, delta, cheer }) {
      // Turns quickly but not instantly, so she reads as a creature and not an arrow.
      let gap = target - heading;
      gap = Math.atan2(Math.sin(gap), Math.cos(gap));
      heading += gap * Math.min(1, delta * 18);
      turn.rotation.y = heading;

      stride += delta * (dashing ? 22 : 11) * Math.max(walk, 0.0001);
      const swing = Math.sin(stride) * 0.7 * walk;
      legs[0].rotation.z = swing;
      legs[1].rotation.z = -swing;
      // When drawing, both arms reach forward to hold the bow.
      arms[0].rotation.z = drawing ? 1.25 : -swing * 0.8;
      arms[1].rotation.z = drawing ? 1.05 : swing * 0.8;
      arms[0].rotation.x = drawing ? -0.35 : 0;
      arms[1].rotation.x = drawing ? 0.35 : 0;

      const bob = Math.abs(Math.sin(stride)) * 0.06 * walk;
      const breathe = Math.sin(time * 2.4) * 0.012 * (1 - walk);
      body.position.y = bob + breathe;
      // A little hop with both arms up after a grab.
      const hop = cheer < 0.45 ? Math.sin((cheer / 0.45) * Math.PI) : 0;
      turn.position.y = hop * 0.45;
      if (hop > 0 && !drawing) {
        arms[0].rotation.z = 2.6 * hop;
        arms[1].rotation.z = 2.6 * hop;
      }
      body.rotation.z = dashing ? -0.35 : -0.08 * walk;
      // Tipped up a little, so the camera above can see her face.
      head.rotation.z = 0.28 + Math.sin(time * 1.7) * 0.04 * (1 - walk);

      tail.rotation.y = 0.35 + Math.sin(time * (7 + walk * 8)) * (0.15 + walk * 0.25);
      tail.rotation.z = -0.25 + walk * 0.35 + Math.sin(time * 9) * 0.06;
      tailFar.rotation.z = Math.sin(time * 11 + 1) * 0.3;
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
