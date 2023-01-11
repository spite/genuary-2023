import {
  scene,
  getControls,
  renderer,
  camera,
  addResize,
  resize,
} from "../modules/renderer.js";
import {
  mesh,
  randomizeShape,
  render as renderObject,
  resize as resizeObject,
  color as objectColor,
} from "./object.js";

scene.add(mesh);
mesh.rotation.z = 0.1;

camera.position.set(1, 0.3, 1).setLength(4);

import { Post } from "./post.js";

const post = new Post(renderer);
const controls = getControls();

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
    time += dt;
    mesh.rotation.y += dt / 4000;
  }
  renderObject(renderer, scene, camera, running);
  post.render(objectColor);

  renderer.setAnimationLoop(render);
}

function randomize() {
  randomizeShape();
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

renderer.setClearColor(0x101010, 1);

function myResize(w, h, dPR) {
  resizeObject(w * dPR, h * dPR);
  post.setSize(w, h, dPR);
}
addResize(myResize);

resize();
init();
