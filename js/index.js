// CANNON stuff
var world;
var shape, mass, body;

// ThreeJS stuff
var camera, scene, renderer;
var geometry, material, mesh;
var timeStep = 1/60;

var initCannon = function () {
  world = new CANNON.World();
  world.gravity.set(0, -20, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
  mass = 1;
  body = new CANNON.Body({
    mass: mass
  });
  body.addShape(shape);
  body.angularVelocity.set(0, 10, 0);
  body.angularDamping = 0.5;
  world.add(body);

  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
  world.add(groundBody);
};

var initThree = function () {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 0 , 500);

  var ambient = new THREE.AmbientLight(0x111111);
  scene.add(ambient);

  var light = new THREE.SpotLight(0xffffff);
  light.position.set(10,30,20);
  light.target.position.set(0,0,0);
  light.castShadow = true;
  light.shadowCameraNear = 20;
  light.shadowCameraFar = 50;
  light.shadowCameraFov = 40;

  light.shadowMapBias = 0.1;
  light.shadowMapDarkness = 0.7;
  light.shadowMapWidth = 2 * 512;
  light.shadowMapHeight = 2 * 512;
  scene.add(light);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.z = 5;
  scene.add(camera);

  // Floor

  var floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
  floorGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  var floorMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );

  var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.castShadow = true;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  geometry = new THREE.BoxGeometry(2, 2, 2);
  material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setClearColor(scene.fog.color, 1);
  document.body.appendChild(renderer.domElement);
};

var animate = function () {
  requestAnimationFrame(animate);
  updatePhysics();
  renderer.render(scene, camera);
};

var updatePhysics = function () {
  // Step the physics world
  world.step(timeStep);

  // Copy coordinates from Cannon to Three
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
};

initCannon();
initThree();
animate();
