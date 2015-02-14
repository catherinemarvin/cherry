// CANNON stuff
var world;
var physicsMaterial;
var sphereShape;
var sphereBody;
var groundBody;

// ThreeJS stuff
var camera, scene, renderer;
var geometry, material, mesh;
var light;

var initCannon = function () {
  world = new CANNON.World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.defaultContactMaterial.contactEquationStiffness = 1e9;
  world.defaultContactMaterial.contactEquationRegularizationTime = 4;
  world.gravity.set(0, -20.0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.broadphase.useBoundingBoxes = true;

  var solver = new CANNON.GSSolver();
  solver.iterations = 7;
  solver.tolerance = 0.1;

  world.solver = new CANNON.SplitSolver(solver);

  // Create a slippery material and add it to the world.

  physicsMaterial = new CANNON.Material("slipperyMaterial");
  var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, 0.0, 0.3);
  world.addContactMaterial(physicsContactMaterial);

  // Create a sphere
  var mass = 5;
  var radius = 1.3;
  sphereShape = new CANNON.Sphere(radius);
  sphereBody = new CANNON.Body( { mass: mass, material: physicsMaterial });
  sphereBody.addShape(sphereShape);
  sphereBody.linearDamping = 0.9;
  world.add(sphereBody);

  var groundShape = new CANNON.Plane();
  groundBody = new CANNON.Body ( { mass: 0, material: physicsMaterial });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
  world.add(groundBody);

};

var init = function () {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 0, 500);

  var ambient = new THREE.AmbientLight(0x111111);
  scene.add(ambient);

  light = new THREE.SpotLight(0xffffff);
  light.position.set(10, 30, 20);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadowCameraNear = 20;
  light.shadowCameraFar = 50;
  light.shadowCameraFov = 40;
  light.shadowMapBias = 0.1;
  light.shadowMapDarkness = 0.7;
  light.shadowMapWidth = 2*512;
  light.shadowMapHeight = 2*512;
  scene.add(light);

  // floor
  geometry = new THREE.PlaneGeometry(300, 300, 50, 50);
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  material = new THREE.MeshLambertMaterial({ color: 0xdddddd });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(groundBody.position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color, 1);
  document.body.appendChild(renderer.domElement);
};

var animate = function () {
  var dt = 1/60;
  requestAnimationFrame(animate);
  world.step(dt);
  renderer.render(scene, camera);
};

initCannon();
init();
animate();
