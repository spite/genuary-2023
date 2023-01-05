import {
  scene,
  getControls,
  renderer,
  camera,
  addResize,
  resize,
} from "../modules/renderer.js";
import {
  InstancedMesh,
  Matrix4,
  Group,
  Object3D,
  Vector3,
  PCFSoftShadowMap,
  DirectionalLight,
  sRGBEncoding,
  HemisphereLight,
  DynamicDrawUsage,
  Vector2,
  Mesh,
  BoxGeometry,
  MeshNormalMaterial,
} from "../third_party/three.module.js";
import { Easings } from "../modules/easings.js";
import { mix, clamp } from "../modules/Maf.js";

import { SSAO } from "./SSAO.js";
import { Post } from "./post.js";
// import { DeviceOrientationControls } from "../third_party/DeviceOrientationControls.js";
// import { capture } from "../modules/capture.js";

const controls = getControls();
// controls.enableZoom = false;
// controls.enablePan = false;

const ssao = new SSAO();
const post = new Post(renderer);

async function init() {
  render();
}

let frames = 0;
const loopDuration = 10;

let time = 0;
let prevTime = performance.now();

const cubes = [];
const group = new Group();

const material = new MeshNormalMaterial();
const geometry = new BoxGeometry(1, 1, 1);

function addCube(x, y, z) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  const offset = (z + 1) * 9 + (y + 1) * 3 + (x + 1);
  cubes.push({ mesh, x, y, z, offset });
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

  const steps = 27;
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
    c.mesh.scale.setScalar(Easings.InOutQuad(f));
  });

  const zoomTime = Easings.Linear(effectTime);
  const s = mix(1, 1 / 3, zoomTime);
  group.scale.setScalar(s);
  group.position.x = mix(0, -1, zoomTime);
  group.position.y = mix(0, -1, zoomTime);
  group.position.z = mix(0, -1, zoomTime);

  scene.rotation.x = (speed * time) / 1000;
  scene.rotation.y = (speed * time) / 1100;
  scene.rotation.z = (speed * time) / 900;

  // renderer.render(scene, camera);

  ssao.render(renderer, scene, camera);
  post.render(ssao.output);

  // capture(renderer.domElement);

  // if (frames > 10 * 60 && window.capturer.capturing) {
  //   window.capturer.stop();
  //   window.capturer.save();
  // }
  // frames++;

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

renderer.setClearColor(0x262626, 1);

function myResize(w, h, dPR) {
  ssao.setSize(w, h, dPR);
  post.setSize(w, h, dPR);
}
addResize(myResize);

resize();
init();

// window.start = () => {
//   frames = 0;
//   window.capturer.start();
// };
