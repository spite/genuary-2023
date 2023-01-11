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
  MeshBasicMaterial,
} from "../third_party/three.module.js";
import {
  mesh,
  debug,
  updateOffsetTexture,
  updateVectorsTexture,
  render as renderObject,
  resize as resizeObject,
  color as objectColor,
} from "./object.js";

scene.add(mesh);
// scene.add(debug);

import { SSAO } from "./SSAO.js";
import { Post } from "./post.js";
// import { DeviceOrientationControls } from "../third_party/DeviceOrientationControls.js";
// import { capture } from "../modules/capture.js";

const post = new Post(renderer);
const controls = getControls();
// controls.enableZoom = false;
// controls.enablePan = false;

async function init() {
  render();
}

let frames = 0;

let time = 0;
let prevTime = performance.now();

function render() {
  controls.update();
  const t = performance.now();
  const dt = t - prevTime;
  prevTime = t;

  if (running) {
    //updateOffsetTexture();
    // updateVectorsTexture();
    time += dt;
  }
  renderObject(renderer, scene, camera, running);
  // renderer.render(scene, camera);
  // ssao.render(renderer, scene, camera);
  post.render(objectColor);

  // capture(renderer.domElement);

  // if (frames > 10 * 60 && window.capturer.capturing) {
  //   window.capturer.stop();
  //   window.capturer.save();
  // }
  // frames++;

  renderer.setAnimationLoop(render);
}

function randomize() {}

function goFullscreen() {
  if (renderer.domElement.webkitRequestFullscreen) {
    renderer.domElement.webkitRequestFullscreen();
  } else {
    renderer.domElement.requestFullscreen();
  }
}

let running = true;

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyR") {
    randomize();
  }
  if (e.code === "Space") {
    running = !running;
  }
  if (e.code === "KeyF") {
    goFullscreen();
  }
});

document.querySelector("#randomizeBtn").addEventListener("click", (e) => {
  randomize();
});

document.querySelector("#pauseBtn").addEventListener("click", (e) => {
  running = !running;
});

document.querySelector("#fullscreenBtn").addEventListener("click", (e) => {
  goFullscreen();
});

renderer.setClearColor(0x050505, 1);

function myResize(w, h, dPR) {
  resizeObject(w * dPR, h * dPR);
  // ssao.setSize(w, h, dPR);
  post.setSize(w, h, dPR);
}
addResize(myResize);

resize();
init();

// window.start = () => {
//   frames = 0;
//   window.capturer.start();
// };
