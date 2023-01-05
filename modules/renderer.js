import {
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "../third_party/three.module.js";
import { OrbitControls } from "../third_party/OrbitControls.js";

const renderer = new WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});

document.body.append(renderer.domElement);
renderer.outputEncoding = sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new Scene();

const camera = new PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(2, 2, 2);
camera.lookAt(scene.position);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  const dPR = renderer.getPixelRatio();

  for (const fn of resizes) {
    fn(w, h, dPR);
  }
}

const updates = [];

function addUpdate(fn) {
  updates.push(fn);
}

const resizes = [];

function addResize(fn) {
  resizes.push(fn);
}

window.addEventListener("resize", () => resize());

resize();

function getControls(cam = camera) {
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.dampingFactor = 0.05;
  controls.enableDamping = true;
  return controls;
}

export { renderer, scene, addUpdate, addResize, getControls, camera, resize };
