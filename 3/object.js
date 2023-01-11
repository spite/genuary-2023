import {
  ByteType,
  DataTexture,
  FloatType,
  GLSL3,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  RawShaderMaterial,
  RedFormat,
  RGBAFormat,
  UnsignedByteType,
  Vector3,
  Mesh,
  DoubleSide,
  TorusKnotGeometry,
  TorusGeometry,
  AdditiveBlending,
} from "../third_party/three.module.js";
import { randomInRange } from "../modules/Maf.js";
import {
  loadBunny,
  loadIcosahedron,
  loadDodecahedron,
  loadSuzanne,
} from "../modules/models.js";
import { getFBO } from "../modules/fbo.js";
import { ShaderPass } from "../modules/ShaderPass.js";
import { shader as orthoVertexShader } from "../shaders/ortho.js";

const SLICES = 10;
const LINES = 512;

const vertexShader = `precision highp float;

in vec3 position;
in vec3 normal;
in vec3 uv;
in mat4 instanceMatrix;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform sampler2D offsetTexture;
uniform sampler2D vectorsTexture;
uniform vec3 channel;

out vec2 vUv;
out vec3 vColor;
out vec3 vNormal;
out float i;
out vec4 mvPosition;

void main() {
  vNormal = normalMatrix * normal;
  vUv = vec2(.5 * position.y + .5, .5);
  i = instanceMatrix[0][0];
  float offset = texture(offsetTexture, vec2(i/${LINES}., .5)).r * 255.;
  vec4 vector = texture(vectorsTexture, vec2(.5, offset / ${SLICES}.)) * .05;
  mvPosition = modelViewMatrix * vec4(position + vector.xyz, 1.);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `precision highp float;

in vec3 vColor;
in vec2 vUv;
in float i;
in vec3 vNormal;
in vec4 mvPosition;

uniform sampler2D offsetTexture;
uniform vec3 channel;

out vec4 color;

void main() {
  color.a = 1.;
  vec3 l = normalize(vec3(1.));
  vec3 n = normalize(vNormal);
  vec3 e = normalize(-mvPosition.xyz);
  color.rgb = .5 + .5 * vec3(max(dot(n,l), 0.));
  float rim = max(dot(n, e), 0.);
  rim = .5 + .5 * rim;
  color.rgb *= vec3(rim);
  color.rgb *= channel;
  vec4 offset = texture(offsetTexture, vec2(vUv.x, .5));
  if(round(i) != round(offset.r * 255.) ) {
    discard;
  }
}
`;

function generateOffsetTexture() {
  const data = new Uint8ClampedArray(LINES * 4);
  const texture = new DataTexture(data, LINES, 1, RGBAFormat);
  return { data, texture };
}

const offsetTextures = [
  generateOffsetTexture(),
  generateOffsetTexture(),
  generateOffsetTexture(),
];

const vectors = new Float32Array(SLICES * 4);
const vectorsTexture = new DataTexture(
  vectors,
  1,
  SLICES,
  RGBAFormat,
  FloatType
);

const material = new RawShaderMaterial({
  uniforms: {
    offsetTexture: { value: null },
    vectorsTexture: { value: vectorsTexture },
    channel: { value: new Vector3() },
  },
  vertexShader,
  fragmentShader,
  side: DoubleSide,
  glslVersion: GLSL3,
  // wireframe: true,
});

// const geometry = new IcosahedronGeometry(1, 10);
const geometry = new TorusKnotGeometry(0.5, 0.15, 200, 40, 4, 2);
// const geometry = new TorusGeometry(0.5, 0.2, 40, 40);

const mesh = new InstancedMesh(geometry, material, SLICES);

const mat = new Matrix4();
for (let i = 0; i < LINES; i++) {
  mat.elements[0] = i;
  mesh.setMatrixAt(i, mat);
}
mesh.instanceMatrix.needsUpdate = true;

function updateOffsetTexture(texture) {
  const data = texture.data;
  const MIN = 1; //Math.round(randomInRange(1, 10));
  const MAX = 10; //Math.round(randomInRange(10, 30));
  for (let i = 0; i < LINES; i++) {
    const skip = Math.floor(randomInRange(MIN, MAX));
    const c = Math.floor(randomInRange(0, SLICES));
    for (let j = i; j < i + skip; j++) {
      data[j * 4] = c;
      data[j * 4 + 1] = c;
      data[j * 4 + 2] = c;
      data[j * 4 + 3] = c;
    }
    i += skip;
  }
  texture.texture.needsUpdate = true;
}

function updateVectorsTexture() {
  const tmp = new Vector3();
  for (let i = 0; i < SLICES; i++) {
    tmp.set(randomInRange(-1, 1), randomInRange(-1, 1), randomInRange(-1, 1));
    vectors[i * 4] = tmp.x;
    vectors[i * 4 + 1] = tmp.y;
    vectors[i * 4 + 2] = tmp.z;
    vectors[i * 4 + 3] = 0;
  }
  vectorsTexture.needsUpdate = true;
}

updateVectorsTexture();

const debug = new Mesh(
  new PlaneGeometry(1, 1),
  new MeshBasicMaterial({ map: null })
);

async function suzanne() {
  const res = await loadIcosahedron();
  mesh.geometry = res;
}

// suzanne();

const colorRed = getFBO(1, 1, { samples: 4 });
const colorGreen = getFBO(1, 1, { samples: 4 });
const colorBlue = getFBO(1, 1, { samples: 4 });

const combineFs = `precision highp float;

in vec2 vUv;

uniform sampler2D red;
uniform sampler2D green;
uniform sampler2D blue;

out vec4 color;

void main() {
  color = texture(red, vUv) + texture(green, vUv) + texture(blue, vUv);
}
`;

const combineShader = new RawShaderMaterial({
  uniforms: {
    red: { value: colorRed.texture },
    green: { value: colorGreen.texture },
    blue: { value: colorBlue.texture },
  },
  vertexShader: orthoVertexShader,
  fragmentShader: combineFs,
  glslVersion: GLSL3,
});

const combinePass = new ShaderPass(combineShader);

function render(renderer, scene, camera, animate) {
  if (animate) {
    updateOffsetTexture(offsetTextures[0]);
    updateOffsetTexture(offsetTextures[1]);
    updateOffsetTexture(offsetTextures[2]);
  }

  material.uniforms.channel.value.set(1, 0, 0);
  material.uniforms.offsetTexture.value = offsetTextures[0].texture;
  renderer.setRenderTarget(colorRed);
  renderer.render(scene, camera);

  material.uniforms.channel.value.set(0, 1, 0);
  material.uniforms.offsetTexture.value = offsetTextures[1].texture;
  renderer.setRenderTarget(colorGreen);
  renderer.render(scene, camera);

  material.uniforms.channel.value.set(0, 0, 1);
  material.uniforms.offsetTexture.value = offsetTextures[2].texture;
  renderer.setRenderTarget(colorBlue);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);

  combinePass.render(renderer);
}

function resize(w, h) {
  colorRed.setSize(w, h);
  colorGreen.setSize(w, h);
  colorBlue.setSize(w, h);
  combinePass.setSize(w, h);
}

const output = combinePass.texture;

export {
  mesh,
  updateOffsetTexture,
  updateVectorsTexture,
  debug,
  render,
  resize,
  output as color,
};
