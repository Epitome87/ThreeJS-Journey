import * as THREE from 'https://cdn.skypack.dev/three@0.133.0'; //'./node_modules/three/build/three.module.js'; //'https://unpkg.com/three@0.133.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/controls/OrbitControls.js'; //'./node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/loaders/GLTFLoader.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';
import { gsap } from './node_modules/gsap/gsap-core.js';

const textureKeys = ['map', 'normalMap']; // etc...

// The core ThreeJS components:
let scene, camera, renderer;

// For Stats
let stats;

// Global references to our lights
let pointLight, pointLight2;

// GUI for value testing
const gui = new dat.GUI();

// To load our own models!
const loader = new GLTFLoader();

// Properties we want on the GUI
const world = {
  plane: {
    width: 10,
    height: 10,
    widthSegments: 10,
    heightSegments: 10,
  },
  light: {
    position: { x: 0, y: 0, z: 0 },
  },
};

init();
initScene();
initGUI();
initPlayerMovement();

let pumpkinModel = {
  geometry: {
    url: 'skeletonCrossbow.glb',
  },
  material: {
    metalness: 0.0,
    roughness: 1.0,
  },
  mesh: undefined,
};

let pumpkinMesh;

setTimeout(() => {
  loadMesh(pumpkinModel).then((loadedMesh) => {
    console.log('MY MESH', loadedMesh);

    loadedMesh.castShadow = true;
    // loadedMesh.receiveShadow = true;

    pumpkinModel.mesh = loadedMesh.geometry.scene;

    // No freaking clue why I add the loadedmeh's geo.scene prop, but it works!
    scene.add(pumpkinModel.mesh);

    // pumpkinModel.mesh does not have castShadow true when loadedMesh.castShadow does -- why are they different?!
    console.log(pumpkinModel.mesh);

    console.log('SCENE AFTER:', scene);
  });
}, 1);

console.log('SCENE BEFORE:', scene);

// sampleScene();

// Initialize scene, camera, and renderer
function init() {
  // Create the Scene
  scene = new THREE.Scene();

  // Let's add fog to the scene!
  // scene.fog = new THREE.Fog(0x00ffff, 10, 50);
  scene.fog = new THREE.FogExp2(0x00ffff, 0.02);
  scene.castShadow = true;

  // Create the Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Position the camera 1 unit up and 5 units back
  camera.position.set(0, 1, 5);

  // Set up the Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor('#e5e5e5');
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  document.body.appendChild(renderer.domElement);

  // Adjust the canvas size when we adjust window
  window.addEventListener('resize', (event) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Initialize OrbitControls
  new OrbitControls(camera, renderer.domElement);

  // Initialize Stats
  stats = new Stats();
  document.body.appendChild(stats.dom);
}

// Set up all the gui values we wish to watch
function initGUI() {
  // Object, property, min value, max value
  gui.add(world.plane, 'width', 1, 20).onChange(generatePlane);
  gui.add(world.plane, 'height', 1, 20).onChange(generatePlane);
  gui.add(world.plane, 'widthSegments', 1, 20).onChange(generatePlane);
  gui.add(world.plane, 'heightSegments', 1, 20).onChange(generatePlane);

  function generatePlane() {
    planeMesh.geometry.dispose(); // Get rid
    planeMesh.geometry = new THREE.PlaneGeometry(
      world.plane.width,
      world.plane.height,
      world.plane.widthSegments,
      world.plane.heightSegments
    );
    generateRandomHeights();
  }
}

function initScene() {
  // Create a blue point light
  pointLight = createLight(0x0088ff);
  // scene.add(pointLight);

  // Create a pink point ilght
  pointLight2 = createLight(0xff8888);
  scene.add(pointLight2);

  // Box to serve as the "Room" we're in
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshPhongMaterial({
    color: 0xa0adaf,
    shininess: 10,
    specular: 0x111111,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 10;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

createLights();

// Render loop
render();

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// GSAP timeline stuff
// let tl = gsap.timeline().delay(0.3);
let tl = gsap.timeline({ paused: true });
// tl.to(sphereMesh.scale, 10, { x: 2, ease: 'elastic' });
tl.to(sphereMesh.position, 3, { x: 2, ease: 'elastic' });
tl.to(sphereMesh.rotation, 10, { y: Math.PI * 0.5, ease: 'elastic' }, '=-1.5');

// const eventType = "mouseMove";
const eventType = 'click';
// window.addEventListener(eventType, onMouseMove);
// Play timeline on any click
// document.body.addEventListener('click', (event) => {
//   tl.play();
// });

function onMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children, true);
  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set(0x00ff00);

    let intersectedTimeline = gsap.timeline({ paused: false });
    // tl.to(sphereMesh.scale, 10, { x: 2, ease: 'elastic' });
    intersectedTimeline.to(intersects[i].object.position, 3, {
      x: 2,
      ease: 'elastic',
    });
    intersectedTimeline.to(
      intersects[i].object.rotation,
      10,
      { y: Math.PI * 0.5, ease: 'elastic' },
      '=-1.5'
    );
  }
}

const cubes = [];
for (let i = 0; i < 10; i++) {
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh.position.set(-10 + i * 2, 0, 0);
  // scene.add(cubeMesh);
}

function generateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 1, 2, 1);

  return canvas;
}

// Helper function for creating a Light
function createLight(color) {
  const intensity = 1.5;
  const light = new THREE.PointLight(color, intensity, 20);
  light.castShadow = true;
  light.shadow.bias = -0.005; // reduces self-shadowing on double-sided objectsw

  let geometry = new THREE.SphereGeometry(0.3, 12, 6);
  let material = new THREE.MeshBasicMaterial({ color: color });
  material.color.multiplyScalar(intensity);
  let sphere = new THREE.Mesh(geometry, material);
  light.add(sphere);

  const texture = new THREE.CanvasTexture(generateTexture());
  texture.magFilter = THREE.NearestFilter;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(1, 4.5);

  geometry = new THREE.SphereGeometry(2, 32, 8);
  material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    alphaMap: texture,
    alphaTest: 0.5,
  });

  sphere = new THREE.Mesh(geometry, material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  light.add(sphere);

  // custom distance material
  const distanceMaterial = new THREE.MeshDistanceMaterial({
    alphaMap: material.alphaMap,
    alphaTest: material.alphaTest,
  });
  sphere.customDistanceMaterial = distanceMaterial;

  return light;
}

// Creating Lights
function createLights() {
  const ambientLight = new THREE.AmbientLight(0xd9cfc5, 0.5);
  // ambientLight.castShadow = true;
  // scene.add(ambientLight);

  // setInterval(() => {
  //   ambientLight.intensity += 0.01;
  //   if (ambientLight.intensity >= 1) ambientLight.intensity = 0;
  // }, 100);

  // Params: Color, Intensity
  const light = new THREE.DirectionalLight(0x91bbe6, 1);
  // Params: X, Y, Z, where do we want this relative to where it is right now (center)?
  light.position.set(0, 0, 1);
  // scene.add(light);

  const backLight = new THREE.DirectionalLight(0xffffff, 1);
  // Params: X, Y, Z, where do we want this relative to where it is right now (center)?
  backLight.position.set(0, 0, -1);
  // scene.add(backLight);

  // SPOTLIGHT
  const spotLightColor = 0xffff00;
  const spotLight = new THREE.SpotLight(spotLightColor);
  spotLight.position.set(0, 5, 0);
  // spotLight.rotation.set(0, Math.PI / 2, 0);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;
  scene.add(spotLight);

  let cameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
  scene.add(cameraHelper);

  gui.add(world.light.position, 'x', -5, 5).onChange(() => {
    setLightPosition(spotLight);
  });
  gui.add(world.light.position, 'y', -5, 5).onChange(() => {
    setLightPosition(spotLight);
  });
  gui.add(world.light.position, 'z', -5, 5).onChange(() => {
    setLightPosition(spotLight);
  });
}

function setLightPosition(light) {
  light.position.set(
    world.light.position.x,
    world.light.position.y,
    world.light.position.z
  );
}

// Helper Functions
function generateRandomHeights() {
  // This gets the array of x y z vertices
  const { array } = planeMesh.geometry.attributes.position;

  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const y = array[i + 1];
    const z = array[i + 2];

    // Change the Z-idnex
    array[i + 2] = z + Math.random();
  }
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  // cubeMesh.rotation.x += 0.01;
  // planeMesh.rotation.x += 0.01;

  // Attempt at bounce effect
  // pumpkinModel.rotation.y += 0.01;

  let time = performance.now() * 0.001;

  pointLight.position.x = Math.sin(time * 0.6) * 9;
  pointLight.position.y = Math.sin(time * 0.7) * 9 + 6;
  pointLight.position.z = Math.sin(time * 0.8) * 9;

  pointLight.rotation.x = time;
  pointLight.rotation.z = time;

  time += 10000;

  pointLight2.position.x = Math.sin(time * 0.6) * 9;
  pointLight2.position.y = Math.sin(time * 0.7) * 9 + 6;
  pointLight2.position.z = Math.sin(time * 0.8) * 9;

  pointLight2.rotation.x = time;
  pointLight2.rotation.z = time;

  renderer.render(scene, camera);

  stats.update();
}

function initPlayerMovement() {
  document.addEventListener('keydown', (event) => {
    event = event || window.event;
    // Use event.keyCode
    switch (event.code) {
      case 'KeyW':
        pumpkinModel.mesh.position.z -= 0.1;
        break;
      case 'KeyS':
        pumpkinModel.mesh.position.z += 0.1;
        break;
      case 'KeyA':
        pumpkinModel.mesh.position.x -= 0.1;
        break;
      case 'KeyD':
        pumpkinModel.mesh.position.x += 0.1;
        break;
      case 'KeyQ':
        pumpkinModel.mesh.position.y += 0.1;
        break;
      case 'KeyE':
        pumpkinModel.mesh.position.y -= 0.1;
        break;
    }
  });
}

function sampleScene() {
  const planeSize = 40;
  const groundPlaneTexture = new THREE.TextureLoader().load(
    'https://threejsfundamentals.org/threejs/resources/images/checker.png'
  );

  groundPlaneTexture.wrapS = THREE.RepeatWrapping;
  groundPlaneTexture.wrapT = THREE.RepeatWrapping;
  groundPlaneTexture.magFilter = THREE.NearestFilter;
  const repeats = planeSize / 2;
  groundPlaneTexture.repeat.set(repeats, repeats);

  // Ground Plane
  const samplePlaneGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
  const samplePlaneMaterial = new THREE.MeshPhongMaterial({
    // color: 0xff0000,
    map: groundPlaneTexture,
    alphaMap: groundPlaneTexture,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    specular: 0x111111,
    color: 0xa0adaf,
    shininess: 10,
  });
  const samplePlaneMesh = new THREE.Mesh(
    samplePlaneGeometry,
    samplePlaneMaterial
  );
  // samplePlaneMesh.castShadow = true;
  samplePlaneMesh.receiveShadow = true;

  scene.add(samplePlaneMesh);

  samplePlaneMesh.rotation.set(Math.PI / 2, 0, 0);

  const groundPlaneGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
  const groundPlaneMaterial = new THREE.MeshPhongMaterial({
    // color: 0xfff228,
    map: groundPlaneTexture,

    side: THREE.DoubleSide,
  });
  const groundMesh = new THREE.Mesh(groundPlaneGeometry, groundPlaneMaterial);
  groundMesh.castShadow = true;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
  // Push back into distance
  groundMesh.position.set(0, 0, -5);

  // Light from Above
  const directionalLight = new THREE.DirectionalLight(0x91bbe6, 1);
  directionalLight.position.set(0, 10, 0);
  // scene.add(directionalLight);

  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 500;
  directionalLight.shadow.camera.far = 4000;
  directionalLight.shadow.camera.fov = 30;
}

function createFancyPlane() {
  // Params: Width: float, Height: Float, Width, WidthSegments: Int, HeightSegments: Int
  const planeGeometry = new THREE.PlaneGeometry(5, 5, 10, 10);
  const planeMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide,
    flatShading: THREE.FlatShading,
  });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(planeMesh);
}

function loadMesh(model) {
  const promises = [loadGeometry(model.geometry), loadMaterial(model.material)];

  return Promise.all(promises).then((result) => {
    // console.log('RESULT:', result);
    return new THREE.Mesh(result[0], result[1]);
  });
}

function loadGeometry(model) {
  return new Promise((resolve) => {
    new GLTFLoader().load(model.url, resolve);

    // Works
    // new GLTFLoader().load(model.url, (gltf) => {
    //   console.log('GLTF', gltf);
    //   console.log('GLTF.scene: ', gltf.scene);
    //   scene.add(gltf.scene);
    //   resolve();
    // });
  });
}

function loadMaterial(model) {
  const params = {};
  const promises = Object.keys(model).map((key) => {
    // load textures for supported keys
    if (textureKeys.indexOf(key) !== -1) {
      return loadTexture(model[key]).then((texture) => {
        params[key] = texture;
      });
      // just copy the value otherwise
    } else {
      params[key] = model[key];
    }
  });

  return Promise.all(promises).then(() => {
    return new THREE.MeshStandardMaterial(params);
  });
}

function loadTexture(url) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(url, resolve);
  });
}
