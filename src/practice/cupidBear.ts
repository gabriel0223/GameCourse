import * as THREE from 'three';

// Love Attack's white bear as a low-poly model: an original polar bear cub in a red scarf.
// It faces +x, stands on y = 0, and is about 1.6 units tall.

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
}

export interface Bear {
  group: THREE.Group;
  pose(pose: BearPose): void;
  dispose(): void;
}

const flat = (hex: string) => new THREE.MeshLambertMaterial({ color: hex, flatShading: true });

export function createBear(): Bear {
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
  const ball = new THREE.IcosahedronGeometry(1, 1);
  const smooth = new THREE.IcosahedronGeometry(1, 2);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const ring = new THREE.TorusGeometry(0.31, 0.085, 5, 12);
  const outline = new THREE.MeshBasicMaterial({ color: '#2B1B38', side: THREE.BackSide });
  const geometries = [ball, smooth, box, ring];
  const materials = [fur, muzzle, pad, ink, shine, scarf, scarfShade, outline];

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

  body.add(part(ball, fur, 0, 0.6, 0, 0.42, 0.46, 0.4));
  body.add(part(ball, muzzle, 0.2, 0.55, 0, 0.22, 0.3, 0.3));
  body.add(part(ball, fur, -0.4, 0.5, 0, 0.1));

  const head = new THREE.Group();
  head.position.set(0.06, 1.12, 0);
  body.add(head);
  head.add(part(smooth, fur, 0, 0, 0, 0.4, 0.37, 0.39));
  head.add(part(ball, muzzle, 0.34, -0.08, 0, 0.2, 0.15, 0.17));
  head.add(part(smooth, ink, 0.52, -0.04, 0, 0.065, 0.055, 0.075));
  for (const side of [-1, 1]) {
    head.add(part(smooth, ink, 0.27, 0.07, side * 0.2, 0.05, 0.065, 0.05));
    head.add(part(box, shine, 0.3, 0.1, side * 0.225, 0.018, 0.022, 0.012));
    const ear = new THREE.Group();
    ear.position.set(-0.06, 0.3, side * 0.25);
    ear.add(part(ball, fur, 0, 0, 0, 0.13, 0.12, 0.08));
    ear.add(part(ball, pad, 0.035, -0.005, side * 0.02, 0.07, 0.065, 0.04));
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

  // A dark shell behind each big shape gives the model the same outline as the pixel sprites.
  const OUTLINE = 0.055;
  const shelled = new Set<THREE.Material>([fur, scarf]);
  const shells: THREE.Mesh[] = [];
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && shelled.has(child.material as THREE.Material)) shells.push(child);
  });
  for (const mesh of shells) {
    const shell = new THREE.Mesh(mesh.geometry, outline);
    shell.position.copy(mesh.position);
    shell.rotation.copy(mesh.rotation);
    const grow = mesh.geometry === ring ? 1.25 : 1;
    shell.scale.set(mesh.scale.x + OUTLINE * grow, mesh.scale.y + OUTLINE * grow, mesh.scale.z + OUTLINE * grow);
    mesh.parent!.add(shell);
  }
  group.scale.setScalar(1.3);

  let heading = 0;
  let stride = 0;
  return {
    group,
    pose({ time, walk, dashing, drawing, heading: target, delta }) {
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
