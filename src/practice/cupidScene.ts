import * as THREE from 'three';
import { createBear, createPandaKit, createTeddyKit } from './cupidBear';
import type { Panda } from './cupidBear';
import { ARENA_D, ARENA_W, KINDS, PLUSHIE_LIFE, drawPower, isDashing } from './cupidGame';
import type { CupidEvent, CupidRun, Flat } from './cupidGame';

// The full 3D look: full resolution, smooth shading, and real shadows.
// Set it to false for the pixel look, drawn small and scaled up with hard pixels like Sunset Ace.
export const SMOOTH = true;
export const RENDER_W = 480;
export const RENDER_H = 270;

export interface Projected {
  x: number;
  y: number;
}

export interface CupidScene {
  render(run: CupidRun, view: { time: number; delta: number; events: CupidEvent[] }): void;
  // Screen position from 0 to 1 on both axes.
  project(at: Flat, height?: number): Projected;
  // The spot on the arena floor under a point on the canvas, given from 0 to 1.
  groundAt(x: number, y: number): Flat | null;
  // 0 is the best quality, and higher numbers are lighter.
  quality(): number;
  dispose(): void;
}

const lambert = (hex: string, extra: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial({ color: hex, flatShading: !SMOOTH, ...extra });

function heartShape(size: number) {
  const s = size;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5 * s);
  shape.bezierCurveTo(-0.12 * s, -0.36 * s, -0.62 * s, -0.06 * s, -0.56 * s, 0.22 * s);
  shape.bezierCurveTo(-0.5 * s, 0.52 * s, -0.12 * s, 0.56 * s, 0, 0.3 * s);
  shape.bezierCurveTo(0.12 * s, 0.56 * s, 0.5 * s, 0.52 * s, 0.56 * s, 0.22 * s);
  shape.bezierCurveTo(0.62 * s, -0.06 * s, 0.12 * s, -0.36 * s, 0, -0.5 * s);
  return shape;
}

function heartGeometry(size: number, depth: number) {
  const geometry = new THREE.ExtrudeGeometry(heartShape(size), { depth, bevelEnabled: false, curveSegments: SMOOTH ? 14 : 5 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function roundedRect(halfW: number, halfD: number, radius: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfW + radius, -halfD);
  shape.lineTo(halfW - radius, -halfD);
  shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + radius);
  shape.lineTo(halfW, halfD - radius);
  shape.quadraticCurveTo(halfW, halfD, halfW - radius, halfD);
  shape.lineTo(-halfW + radius, halfD);
  shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - radius);
  shape.lineTo(-halfW, -halfD + radius);
  shape.quadraticCurveTo(-halfW, -halfD, -halfW + radius, -halfD);
  return shape;
}

function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = SMOOTH ? THREE.LinearFilter : THREE.NearestFilter;
  texture.minFilter = SMOOTH ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
  texture.anisotropy = SMOOTH ? 8 : 1;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A soft sunset sky behind everything.
function skyTexture() {
  return canvasTexture(4, 64, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, '#6E5BB8');
    gradient.addColorStop(0.45, '#C98BC9');
    gradient.addColorStop(0.8, '#F6B8C4');
    gradient.addColorStop(1, '#FFD9C2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 64);
  });
}

// Crisp tiles with soft vector hearts for the 3D look.
function smoothFloorTexture() {
  const texture = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#FBE3EC';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#F7D5E2';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);
    ctx.fillStyle = '#F3C0D3';
    for (const [x, y] of [
      [64, 64],
      [192, 192],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y + 13);
      ctx.bezierCurveTo(x - 20, y, x - 15, y - 15, x, y - 7);
      ctx.bezierCurveTo(x + 15, y - 15, x + 20, y, x, y + 13);
      ctx.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / 3, 1 / 3);
  return texture;
}

function floorTexture() {
  if (SMOOTH) return smoothFloorTexture();
  const texture = canvasTexture(32, 32, (ctx) => {
    ctx.fillStyle = '#FBE3EC';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#F6D2E0';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillRect(16, 16, 16, 16);
    // A tiny heart in every other tile.
    ctx.fillStyle = '#F2B9CF';
    for (const [x, y] of [
      [6, 6],
      [22, 22],
    ]) {
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x + 3, y, 2, 1);
      ctx.fillRect(x - 0, y + 1, 5, 1);
      ctx.fillRect(x + 1, y + 2, 3, 1);
      ctx.fillRect(x + 2, y + 3, 1, 1);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / 3, 1 / 3);
  return texture;
}

interface Rival {
  panda: Panda;
  shadow: THREE.Mesh;
  // Real shadows wait until the bear lands, or a falling bear casts one far off to the side.
  casting: boolean;
}

interface Bit {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  max: number;
  spin: number;
  gravity: number;
}

export function createCupidScene(canvas: HTMLCanvasElement): CupidScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: SMOOTH, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(RENDER_W, RENDER_H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The 3D look draws at the canvas's real size, sharp on any screen.
  let resizer: ResizeObserver | null = null;
  // Quality steps for the 3D look. A slow computer steps down so the game stays smooth.
  const QUALITY = [
    { resolution: 1, shadows: 2048 },
    { resolution: 0.75, shadows: 1024 },
    { resolution: 0.5, shadows: 1024 },
    { resolution: 0.35, shadows: 512 },
  ];
  let quality = 0;
  let slowFrames = 0;
  let measured = 0;
  const fit = () => {
    if (!SMOOTH) return;
    const scale = Math.min(2, window.devicePixelRatio || 1) * QUALITY[quality].resolution;
    const width = Math.max(RENDER_W * 0.75, Math.round(canvas.clientWidth * scale));
    renderer.setSize(width, Math.round((width * RENDER_H) / RENDER_W), false);
  };
  if (SMOOTH) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    fit();
    resizer = new ResizeObserver(fit);
    resizer.observe(canvas);
  }

  const scene = new THREE.Scene();
  const sky = skyTexture();
  scene.background = sky;
  scene.fog = new THREE.Fog('#E9A9C4', 34, 70);

  const camera = new THREE.PerspectiveCamera(34, RENDER_W / RENDER_H, 0.5, 200);
  const cameraHome = new THREE.Vector3(0, 17.5, 12.8);
  const cameraLook = new THREE.Vector3(0, 0, 0.9);
  camera.position.copy(cameraHome);
  camera.lookAt(cameraLook);

  scene.add(new THREE.HemisphereLight('#FFF1F6', '#9C7FC0', 1.5));
  const sun = new THREE.DirectionalLight('#FFE2C8', 1.7);
  sun.position.set(-6, 14, 9);
  scene.add(sun);
  if (SMOOTH) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
  }
  // Every model casts a real shadow in the 3D look.
  const shade = <T extends THREE.Object3D>(object: T) => {
    if (SMOOTH) object.traverse((child) => (child.castShadow = child instanceof THREE.Mesh));
    return object;
  };

  const disposables: Array<{ dispose(): void }> = [sky];
  const keep = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  // The arena: a tiled floor on a puffy cloud island.
  const floorShape = roundedRect(ARENA_W + 1.3, ARENA_D + 1.3, 2.2);
  const floorGeometry = keep(new THREE.ExtrudeGeometry(floorShape, { depth: 1.2, bevelEnabled: false, curveSegments: 6 }));
  floorGeometry.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeometry, [
    keep(new THREE.MeshLambertMaterial({ map: keep(floorTexture()) })),
    keep(lambert('#E7B6CF')),
  ]);
  floor.position.y = -1.2;
  floor.receiveShadow = SMOOTH;
  scene.add(floor);

  const puffGeometry = keep(new THREE.IcosahedronGeometry(1, SMOOTH ? 3 : 1));
  const rim: Array<[number, number, number]> = [];
  const halfW = ARENA_W + 1.6;
  const halfD = ARENA_D + 1.6;
  const perimeter = 4 * (halfW + halfD);
  for (let i = 0; i < 54; i += 1) {
    let along = (i / 54) * perimeter;
    let x: number;
    let z: number;
    if (along < 2 * halfW) [x, z] = [-halfW + along, -halfD];
    else if ((along -= 2 * halfW) < 2 * halfD) [x, z] = [halfW, -halfD + along];
    else if ((along -= 2 * halfD) < 2 * halfW) [x, z] = [halfW - along, halfD];
    else [x, z] = [-halfW, halfD - (along - 2 * halfW)];
    rim.push([x, z, 0.75 + ((i * 37) % 10) / 22]);
  }
  const rimMesh = new THREE.InstancedMesh(puffGeometry, keep(lambert('#FFF4F8')), rim.length);
  const placer = new THREE.Object3D();
  rim.forEach(([x, z, size], index) => {
    placer.position.set(x, -0.55 + size * 0.25, z);
    placer.scale.set(size * 1.25, size * 0.8, size * 1.25);
    placer.updateMatrix();
    rimMesh.setMatrixAt(index, placer.matrix);
  });
  rimMesh.receiveShadow = SMOOTH;
  scene.add(rimMesh);

  // She always plays as the white bear.
  const bear = createBear(SMOOTH);
  disposables.push(bear);
  scene.add(shade(bear.group));

  const shadowGeometry = keep(new THREE.CircleGeometry(1, 16));
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadowMaterial = keep(new THREE.MeshBasicMaterial({ color: '#7A4A78', transparent: true, opacity: 0.32, depthWrite: false }));
  const makeShadow = (size: number) => {
    const mesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    mesh.scale.set(size, 1, size * 0.75);
    mesh.position.y = 0.02;
    return mesh;
  };
  const heroShadow = makeShadow(0.5);
  // In the 3D look a real shadow replaces the painted one.
  heroShadow.visible = !SMOOTH;
  scene.add(heroShadow);

  // The heart bow lies flat beside her and turns with her aim.
  const bow = new THREE.Group();
  const bowWood = keep(lambert('#E8476E'));
  const bowArc = new THREE.Mesh(keep(SMOOTH ? new THREE.TorusGeometry(0.5, 0.06, 8, 24, Math.PI) : new THREE.TorusGeometry(0.5, 0.06, 4, 10, Math.PI)), bowWood);
  bowArc.rotation.x = -Math.PI / 2;
  bowArc.rotation.z = -Math.PI / 2;
  bow.add(bowArc);
  const stringGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
  keep(stringGeometry);
  const bowString = new THREE.Line(stringGeometry, keep(new THREE.LineBasicMaterial({ color: '#FFF4F8' })));
  bow.add(bowString);
  const nocked = new THREE.Group();
  bow.add(nocked);
  scene.add(shade(bow));

  // Aim guide dots on the floor.
  const dotGeometry = keep(new THREE.CircleGeometry(0.09, 6));
  dotGeometry.rotateX(-Math.PI / 2);
  const dotMaterial = keep(new THREE.MeshBasicMaterial({ color: '#FF7FA8', transparent: true, opacity: 0.8, depthWrite: false }));
  const DOTS = 9;
  const dots = new THREE.InstancedMesh(dotGeometry, dotMaterial, DOTS);
  scene.add(dots);

  // Arrows, plushies, and bears share geometry and get their own pieces as they appear.
  const shaftGeometry = keep(new THREE.BoxGeometry(1, 0.07, 0.07));
  shaftGeometry.translate(-0.25, 0, 0);
  const headGeometry = keep(heartGeometry(0.42, 0.08));
  headGeometry.rotateZ(Math.PI / 2);
  headGeometry.rotateX(-Math.PI / 2);
  const featherGeometry = keep(new THREE.BoxGeometry(0.22, 0.04, 0.22));
  const smallHeart = keep(heartGeometry(0.22, 0.06));
  const sparkGeometry = keep(new THREE.BoxGeometry(0.1, 0.1, 0.1));
  // A thrown broken heart: the left half of a heart, ending in a jagged crack. The right half mirrors it.
  const halfHeart = new THREE.Shape();
  halfHeart.moveTo(0, -0.3);
  halfHeart.bezierCurveTo(-0.07, -0.22, -0.37, -0.04, -0.34, 0.13);
  halfHeart.bezierCurveTo(-0.3, 0.31, -0.07, 0.34, 0, 0.18);
  halfHeart.lineTo(0.04, 0.09);
  halfHeart.lineTo(-0.03, 0);
  halfHeart.lineTo(0.04, -0.1);
  halfHeart.lineTo(0, -0.3);
  const brokenGeometry = keep(new THREE.ExtrudeGeometry(halfHeart, { depth: 0.12, bevelEnabled: false, curveSegments: SMOOTH ? 12 : 4 }));
  brokenGeometry.translate(0, 0, -0.06);
  const shaftMaterial = keep(lambert('#F7E3C8'));
  const fullShaft = keep(lambert('#FFD45E', { emissive: '#B07A10' }));
  const headMaterial = keep(lambert('#FF4F86', { emissive: '#6A0A2A' }));
  const fullHead = keep(lambert('#FF6FA0', { emissive: '#D0306A' }));
  const featherMaterial = keep(lambert('#FFFFFF'));
  const teddies = keep(createTeddyKit(SMOOTH));
  // A soft gold glow on the floor under each plushie, so it stands out in a crowd.
  const glowGeometry = keep(new THREE.RingGeometry(0.55, 0.85, 20));
  glowGeometry.rotateX(-Math.PI / 2);
  const glowMaterial = keep(new THREE.MeshBasicMaterial({ color: '#FFD45E', transparent: true, opacity: 0.55, depthWrite: false }));
  const brokenMaterial = keep(lambert('#8E4BC4', { emissive: '#3A1060' }));
  const pandas = keep(createPandaKit(SMOOTH));
  const bitMaterials = {
    pink: keep(new THREE.MeshBasicMaterial({ color: '#FF7FA8' })),
    white: keep(new THREE.MeshBasicMaterial({ color: '#FFFFFF' })),
    gold: keep(new THREE.MeshBasicMaterial({ color: '#FFD45E' })),
    blue: keep(new THREE.MeshBasicMaterial({ color: '#8EC8F7' })),
    grey: keep(new THREE.MeshBasicMaterial({ color: '#C9C0E0' })),
  };

  function makeArrow(full: boolean) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(shaftGeometry, full ? fullShaft : shaftMaterial));
    const head = new THREE.Mesh(headGeometry, full ? fullHead : headMaterial);
    head.position.x = 0.3;
    group.add(head);
    for (const side of [-1, 1]) {
      const feather = new THREE.Mesh(featherGeometry, featherMaterial);
      feather.position.set(-0.68, 0, side * 0.08);
      feather.rotation.y = side * 0.5;
      group.add(feather);
    }
    return group;
  }

  const rivals = new Map<number, Rival>();
  const arrows = new Map<number, THREE.Group>();
  const plushies = new Map<number, { group: THREE.Group; teddy: THREE.Group; glow: THREE.Mesh; born: number }>();
  let lastGrab = -10;
  let lastShot = -10;
  let hitAt: Flat | null = null;
  let clock = 0;
  const thrown = new Map<number, { group: THREE.Group; shadow: THREE.Mesh }>();
  // Each broken heart is two halves, clipped down the middle with a jagged gap.
  function makeBroken() {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const half = new THREE.Mesh(brokenGeometry, brokenMaterial);
      half.scale.set(side * -1.6, 1.6, 1.6);
      half.position.x = side * 0.07;
      half.rotation.z = side * -0.18;
      group.add(half);
    }
    return shade(group);
  }
  const bits: Bit[] = [];
  let shake = 0;

  function burst(at: Flat, height: number, count: number, geometry: THREE.BufferGeometry, material: THREE.Material, speed: number, gravity = 9) {
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const push = speed * (0.6 + Math.random() * 0.6);
      mesh.position.set(at.x, height, at.z);
      scene.add(mesh);
      bits.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * push, 2.5 + Math.random() * 3, Math.sin(angle) * push),
        life: 0.55 + Math.random() * 0.35,
        max: 0.9,
        spin: (Math.random() - 0.5) * 12,
        gravity,
      });
    }
  }

  function readEvents(run: CupidRun, events: CupidEvent[]) {
    for (const event of events) {
      if (event.type === 'pop') {
        // A charmed bear bursts into hearts and sparkles.
        const big = event.kind === 'brute';
        burst(event.at, 1, big ? 18 : 10, smallHeart, bitMaterials.pink, big ? 6 : 4.5);
        burst(event.at, 1, big ? 10 : 6, sparkGeometry, bitMaterials.white, 3.5);
      } else if (event.type === 'charge') {
        burst(event.at, 0.2, 10, sparkGeometry, bitMaterials.grey, 3, 3);
      } else if (event.type === 'hit') {
        burst(event.at, 0.9, 4, sparkGeometry, bitMaterials.white, 3);
      } else if (event.type === 'grab') {
        lastGrab = clock;
        burst(event.at, 0.8, 12, smallHeart, bitMaterials.pink, 3.5, 4);
        burst(event.at, 0.8, 8, sparkGeometry, bitMaterials.gold, 3, 2);
      } else if (event.type === 'plushie') {
        burst(event.at, 0.4, 8, sparkGeometry, bitMaterials.gold, 2, -2);
      } else if (event.type === 'plushieGone') {
        burst(event.at, 0.5, 8, sparkGeometry, bitMaterials.grey, 2, -1);
      } else if (event.type === 'plushieHit') {
        hitAt = event.at;
        burst(event.at, 0.7, 10, sparkGeometry, bitMaterials.white, 3);
      } else if (event.type === 'hurt') {
        shake = 0.35;
        burst(event.at, 0.8, 8, sparkGeometry, bitMaterials.blue, 4);
      } else if (event.type === 'shot') {
        lastShot = clock;
        if (event.full) burst(run.player.pos, 0.8, 6, sparkGeometry, bitMaterials.gold, 2.5);
        burst(run.player.pos, 0.8, 6, sparkGeometry, bitMaterials.gold, 2.5);
      } else if (event.type === 'dash') {
        burst(run.player.pos, 0.2, 6, sparkGeometry, bitMaterials.white, 2, 2);
      } else if (event.type === 'over') {
        burst(run.player.pos, 0.8, 14, smallHeart, bitMaterials.grey, 4);
      }
    }
  }

  function sync<T extends { id: number }, M>(items: T[], meshes: Map<number, M>, make: (item: T) => M, update: (mesh: M, item: T) => void, remove: (mesh: M) => void) {
    const seen = new Set<number>();
    for (const item of items) {
      seen.add(item.id);
      let mesh = meshes.get(item.id);
      if (!mesh) {
        mesh = make(item);
        meshes.set(item.id, mesh);
      }
      update(mesh, item);
    }
    for (const [id, mesh] of meshes) {
      if (!seen.has(id)) {
        remove(mesh);
        meshes.delete(id);
      }
    }
  }

  const aimMatrix = new THREE.Object3D();
  const project = (at: Flat, height = 0): Projected => {
    const point = new THREE.Vector3(at.x, height, at.z).project(camera);
    return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
  };

  return {
    render(run, { time, delta, events }) {
      clock = time;
      // Two seconds of mostly slow frames steps the quality down, one step at a time.
      if (SMOOTH && quality < QUALITY.length - 1 && delta > 0) {
        measured += 1;
        if (delta > 1 / 40) slowFrames += 1;
        if (measured >= 120 || (measured >= 20 && slowFrames >= 20)) {
          if (slowFrames > measured * 0.5) {
            quality += 1;
            fit();
            sun.shadow.mapSize.set(QUALITY[quality].shadows, QUALITY[quality].shadows);
            sun.shadow.map?.dispose();
            sun.shadow.map = null;
          }
          measured = 0;
          slowFrames = 0;
        }
      }
      readEvents(run, events);
      const player = run.player;
      const hurt = time < player.hurtUntil && run.status === 'running';
      bear.group.position.set(player.pos.x, 0.02, player.pos.z);
      bear.group.visible = run.status === 'over' ? Math.floor(time * 6) % 2 === 0 : !hurt || Math.floor(time * 14) % 2 === 0;
      const footfall = bear.pose({
        time,
        speed: run.status === 'running' ? player.moving : 0,
        dashing: isDashing(run),
        drawing: player.drawing,
        heading: Math.atan2(-player.face.z, player.face.x),
        delta,
        cheer: time - lastGrab,
        recoil: time - lastShot,
      });
      // Little puffs of dust where her feet land.
      if (footfall && bear.group.visible) burst(player.pos, 0.05, 3, sparkGeometry, bitMaterials.white, 1.2, 6);
      heroShadow.position.set(player.pos.x, 0.02, player.pos.z);

      // The bow sits a step ahead of her, with the string pulled back as she draws.
      const power = drawPower(player);
      const angle = Math.atan2(-player.face.z, player.face.x);
      bow.position.set(player.pos.x + player.face.x * 0.55, 0.72, player.pos.z + player.face.z * 0.55);
      bow.rotation.y = angle;
      bow.visible = run.status !== 'over';
      const pull = -0.12 - power * 0.42;
      const points = stringGeometry.attributes.position as THREE.BufferAttribute;
      points.setXYZ(0, 0, 0, -0.5);
      points.setXYZ(1, pull, 0, 0);
      points.setXYZ(2, 0, 0, 0.5);
      points.needsUpdate = true;
      nocked.visible = player.drawing;
      if (player.drawing && !nocked.children.length) nocked.add(makeArrow(false));
      nocked.position.x = pull + 0.75;
      const full = power >= 1;
      const nockedArrow = nocked.children[0] as THREE.Group | undefined;
      if (nockedArrow) {
        (nockedArrow.children[0] as THREE.Mesh).material = full ? fullShaft : shaftMaterial;
        (nockedArrow.children[1] as THREE.Mesh).material = full ? fullHead : headMaterial;
      }
      bowWood.emissive.set(full ? '#B03060' : '#000000');

      // Dots show where an arrow will go, and stretch out as the draw grows.
      const reach = 2.2 + power * 4.5;
      dotMaterial.color.set(full ? '#FFD45E' : '#FF7FA8');
      dotMaterial.opacity = player.drawing ? 0.95 : 0.45;
      for (let i = 0; i < DOTS; i += 1) {
        const along = 1 + ((i + 1) / DOTS) * reach;
        aimMatrix.position.set(player.pos.x + player.face.x * along, 0.03, player.pos.z + player.face.z * along);
        aimMatrix.scale.setScalar(i === DOTS - 1 ? 1.8 : 1);
        aimMatrix.updateMatrix();
        dots.setMatrixAt(i, aimMatrix.matrix);
      }
      dots.instanceMatrix.needsUpdate = true;
      dots.visible = run.status === 'running' || run.status === 'countdown';

      sync(
        run.enemies,
        rivals,
        (enemy) => {
          const panda = pandas.make(enemy.kind);
          const shadow = makeShadow(KINDS[enemy.kind].radius);
          scene.add(panda.group, shadow);
          return { panda, shadow, casting: false };
        },
        (rival, enemy) => {
          const { panda, shadow } = rival;
          if (SMOOTH && !rival.casting && enemy.spawning <= 0) {
            shade(panda.group);
            rival.casting = true;
          }
          const radius = KINDS[enemy.kind].radius;
          const landing = Math.max(0, enemy.spawning);
          // The shadow grows first, then the bear drops in and lands with a squash.
          const fall = Math.min(1, landing / 0.4);
          panda.group.position.set(enemy.pos.x, fall * fall * 9, enemy.pos.z);
          panda.group.visible = landing < 0.4;
          const grow = 1 - Math.min(1, landing / 0.75);
          shadow.scale.set(radius * (0.3 + 0.7 * grow), 1, radius * 0.75 * (0.3 + 0.7 * grow));
          shadow.position.set(enemy.pos.x, 0.025, enemy.pos.z);
          // In the 3D look, the painted shadow only marks where a bear is about to land.
          shadow.visible = !SMOOTH || landing > 0.05;
          const windupLength = enemy.kind === 'brute' ? 0.7 : 0.55;
          panda.pose({
            time,
            delta,
            speed: run.status === 'running' ? enemy.speed : 0,
            heading: Math.atan2(-enemy.face.z, enemy.face.x),
            windup: enemy.windup > 0 ? 1 - enemy.windup / windupLength : 0,
            charging: enemy.charging > 0,
            flash: enemy.flash > 0,
          });
        },
        ({ panda, shadow }) => {
          scene.remove(panda.group, shadow);
          panda.dispose();
        },
      );

      sync(
        run.arrows,
        arrows,
        (arrow) => {
          const mesh = shade(makeArrow(arrow.full));
          scene.add(mesh);
          return mesh;
        },
        (mesh, arrow) => {
          mesh.position.set(arrow.pos.x, 0.72, arrow.pos.z);
          mesh.rotation.y = Math.atan2(-arrow.dir.z, arrow.dir.x);
          if (arrow.full && Math.random() < 0.5) {
            const spark = new THREE.Mesh(sparkGeometry, bitMaterials.gold);
            spark.position.copy(mesh.position);
            scene.add(spark);
            bits.push({ mesh: spark, vel: new THREE.Vector3(0, 0.5, 0), life: 0.3, max: 0.3, spin: 4, gravity: 0 });
          }
        },
        (mesh) => scene.remove(mesh),
      );

      sync(
        run.plushies,
        plushies,
        () => {
          const group = new THREE.Group();
          const teddy = shade(teddies.make());
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.y = 0.03;
          group.add(glow, teddy);
          scene.add(group);
          return { group, teddy, glow, born: time };
        },
        (item, plushie) => {
          item.group.position.set(plushie.pos.x, 0, plushie.pos.z);
          // Pops in with a little bounce, then sways and blinks before it fades.
          const age = time - item.born;
          const pop = age < 0.35 ? Math.sin((age / 0.35) * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1;
          item.teddy.scale.setScalar(1.25 * Math.min(1.15, pop));
          const fallen = hitAt && Math.hypot(hitAt.x - plushie.pos.x, hitAt.z - plushie.pos.z) < 0.01;
          if (fallen) {
            item.teddy.rotation.x += (-1.35 - item.teddy.rotation.x) * Math.min(1, delta * 10);
            item.teddy.rotation.z = 0;
            item.teddy.position.y = 0;
          } else {
            item.teddy.rotation.z = Math.sin(time * 2.4 + plushie.id) * 0.1;
            item.teddy.position.y = Math.abs(Math.sin(time * 3 + plushie.id)) * 0.08;
          }
          const ending = plushie.life < 3 && !fallen;
          item.group.visible = !ending || Math.floor(time * (plushie.life < 1.2 ? 14 : 7)) % 2 === 0;
          item.glow.scale.setScalar(0.85 + 0.15 * (plushie.life / PLUSHIE_LIFE) + Math.sin(time * 5) * 0.04);
        },
        (item) => scene.remove(item.group),
      );

      sync(
        run.thrown,
        thrown,
        () => {
          const group = makeBroken();
          const shadow = makeShadow(0.25);
          shadow.visible = !SMOOTH;
          scene.add(group, shadow);
          return { group, shadow };
        },
        ({ group, shadow }, item) => {
          group.position.set(item.pos.x, 0.8, item.pos.z);
          group.rotation.y = time * 9 + item.id;
          shadow.position.set(item.pos.x, 0.025, item.pos.z);
        },
        ({ group, shadow }) => scene.remove(group, shadow),
      );

      for (let i = bits.length - 1; i >= 0; i -= 1) {
        const bit = bits[i];
        bit.life -= delta;
        bit.vel.y -= bit.gravity * delta;
        bit.mesh.position.addScaledVector(bit.vel, delta);
        bit.mesh.rotation.y += bit.spin * delta;
        bit.mesh.rotation.z += bit.spin * 0.5 * delta;
        bit.mesh.scale.setScalar(Math.max(0.05, bit.life / bit.max));
        if (bit.life <= 0 || bit.mesh.position.y < -0.5) {
          scene.remove(bit.mesh);
          bits.splice(i, 1);
        }
      }

      shake = Math.max(0, shake - delta);
      camera.position.copy(cameraHome);
      if (shake > 0) {
        const amount = shake * 0.6;
        camera.position.x += (Math.random() - 0.5) * amount;
        camera.position.z += (Math.random() - 0.5) * amount;
      }
      camera.lookAt(cameraLook);
      renderer.render(scene, camera);
    },
    project,
    quality: () => quality,
    groundAt(x, y) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.72);
      const hit = new THREE.Vector3();
      return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
    },
    dispose() {
      resizer?.disconnect();
      for (const rival of rivals.values()) rival.panda.dispose();
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
  };
}

