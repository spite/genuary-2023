import {
  scene,
  getControls,
  renderer,
  camera,
  addResize,
  resize,
} from "../modules/renderer.js";
import {
  Group,
  Mesh,
  BoxGeometry,
  MeshNormalMaterial,
  OrthographicCamera,
  Vector3,
} from "../third_party/three.module.js";
import { Easings } from "../modules/easings.js";
import { mix, clamp } from "../modules/Maf.js";

import { SSAO } from "./SSAO.js";
import { Post } from "./post.js";

// const camera = new OrthographicCamera(-2, 2, 2, -2, -20, 20);
const controls = getControls();

const ssao = new SSAO();
const post = new Post(renderer);

async function init() {
  render();
}

const loopDuration = 10;

let time = 0;
let prevTime = performance.now();

const cubes = [];
const group = new Group();

const material = new MeshNormalMaterial();
const geometry = new BoxGeometry(1, 1, 1);

const offsets = [
  3.9, // 0
  2.4, // 1
  3.8, // 2
  2.0, // 3
  1.5, // 4
  2.1, // 5
  3.2, // 6
  2.5, // 7
  3.3, // 8
  2.8, // 9
  1, // 10
  2.9, // 11
  0.5, // 12
  0, // 13
  0.5, // 14
  3, // 15
  1, // 16
  3.1, // 17
  3.6, // 18
  2.6, // 19
  3.7, // 20
  2.2, // 21
  1.5, // 22
  2.3, // 23
  3.5, // 24
  2.7, // 25
  3.4, // 26
];

function addCube(x, y, z) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  const ptr = (z + 1) * 9 + (y + 1) * 3 + (x + 1);
  cubes.push({
    mesh,
    x,
    y,
    z,
    position: new Vector3(x, y, z),
    dir: new Vector3(x, y, z).normalize(),
    offset: clamp(offsets[ptr] - 0.49, 0, 10),
  });
  group.add(mesh);
}

for (let z = -1; z < 2; z++) {
  for (let y = -1; y < 2; y++) {
    for (let x = -1; x < 2; x++) {
      addCube(x, y, z);
    }
  }
}

scene.add(group);

camera.position.set(4.5, 4.5, 4.5);
camera.lookAt(group.position);

const speed = 0.5;

function render() {
  controls.update();
  const t = performance.now();
  const dt = t - prevTime;
  prevTime = t;

  if (running) {
    time += dt;
  }

  const effectTime = ((0.001 * time) % loopDuration) / loopDuration;
  const loopTime = Easings.Linear(effectTime);

  const steps = 4;
  const tmp = new Vector3();
  cubes.forEach((c) => {
    let f;
    const o = c.offset / steps;
    c.mesh.visible = true;
    if (loopTime < o) {
      f = 0;
      c.mesh.visible = false;
    } else {
      f = (loopTime - o) / (1 / steps);
    }
    if (c.offset === 0) f = 1;
    f = clamp(0, 1, f);
    c.mesh.scale.setScalar(Easings.OutQuint(f));
    tmp.copy(c.dir).multiplyScalar(5).add(c.position);
    c.mesh.position.copy(c.position);
    c.mesh.position.lerp(tmp, 1 - Easings.OutQuint(f));
  });

  const zoomTime = Easings.Linear(effectTime);
  const s = mix(1, 1 / 3, zoomTime);
  group.scale.setScalar(s);
  // group.position.x = mix(0, -1, zoomTime);
  // group.position.y = mix(0, -1, zoomTime);
  // group.position.z = mix(0, -1, zoomTime);

  scene.rotation.x = (speed * time) / 1000;
  scene.rotation.y = (speed * time) / 1100;
  scene.rotation.z = (speed * time) / 900;

  ssao.render(renderer, scene, camera);
  post.render(ssao.output);

  renderer.setAnimationLoop(render);
}

function goFullscreen() {
  if (renderer.domElement.webkitRequestFullscreen) {
    renderer.domElement.webkitRequestFullscreen();
  } else {
    renderer.domElement.requestFullscreen();
  }
}

let running = true;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    running = !running;
  }
  if (e.code === "KeyF") {
    goFullscreen();
  }
});

document.querySelector("#pauseBtn").addEventListener("click", (e) => {
  running = !running;
});

document.querySelector("#fullscreenBtn").addEventListener("click", (e) => {
  goFullscreen();
});

renderer.setClearColor(0x1a1a1a, 1);

function myResize(w, h, dPR) {
  // const aspect = window.innerWidth / window.innerHeight;
  // const frustumSize = 5;
  // camera.left = (-frustumSize * aspect) / 2;
  // camera.right = (frustumSize * aspect) / 2;
  // camera.top = frustumSize / 2;
  // camera.bottom = -frustumSize / 2;

  // camera.updateProjectionMatrix();
  ssao.setSize(w, h, dPR);
  post.setSize(w, h, dPR);
}
addResize(myResize);

resize();
init();
