// CANNON stuff
var world;
var sphereShape, sphereBody;

// ThreeJS stuff
var camera, scene, renderer;
var geometry, material, mesh;
var timeStep = 1/60;

// Boxes
var boxes = [];
var boxMeshes = [];

// Projectiles
var balls = [];
var ballMeshes = [];
var ballShape, ballGeometry;
var shootDirection, shootVelo;
var projector;


// Pointer Lock
var controls, time = Date.now();

var initCannon = function () {
  world = new CANNON.World();
  world.gravity.set(0, -20, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  var physicsMaterial = new CANNON.Material("slipperyMaterial");
  var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, 0.0, 0.3);
  world.addContactMaterial(physicsContactMaterial);

  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
  world.add(groundBody);

  // Sphere body for controls
  var mass = 5, radius = 1.3;
  sphereShape = new CANNON.Sphere(radius);
  sphereBody = new CANNON.Body({ mass: mass});
  sphereBody.addShape(sphereShape);
  sphereBody.position.set(0,5,0);
  sphereBody.linearDamping = 0.9;
  world.add(sphereBody);
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

  // Floor

  var floorGeometry = new THREE.PlaneGeometry(300, 300, 50, 50);
  floorGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  var floorMaterial = new THREE.MeshLambertMaterial( { color: 0xdddddd } );

  var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.castShadow = true;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Boxes
  var halfExtents = new CANNON.Vec3(1,1,1);
  var boxShape = new CANNON.Box(halfExtents);
  var boxGeometry = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
  for (var i = 0; i < 7; i++) {
    var x = (Math.random() - 0.5) * 20;
    var y = 1 + (Math.random() - 0.5) * 1;
    var z = (Math.random() - 0.5) * 20;
    var boxBody = new CANNON.Body({ mass: 5});
    boxBody.addShape(boxShape);
    var boxMesh = new THREE.Mesh(boxGeometry, floorMaterial);
    world.add(boxBody);
    scene.add(boxMesh);
    boxBody.position.set(x,y,z);
    boxMesh.position.set(x,y,z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxes.push(boxBody);
    boxMeshes.push(boxMesh);
  }


  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;
  renderer.setClearColor(scene.fog.color, 1);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, true);

  // Pointer Lock Controls
  controls = new THREE.PointerLockControls(camera, sphereBody);
  scene.add(controls.getObject());
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
  for (var i = 0; i < boxes.length; i++) {
    boxMeshes[i].position.copy(boxes[i].position);
    boxMeshes[i].quaternion.copy(boxes[i].quaternion);
  }

  for (i = 0; i < balls.length; i++ ){
    ballMeshes[i].position.copy(balls[i].position);
    ballMeshes[i].quaternion.copy(balls[i].quaternion);
  }
};

var pointerLock = function () {
  var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

  if (havePointerLock) {
    var element = document.body;
    var pointerLockChange = function (event) {
      if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        var blocker = document.getElementById("blocker");
        controls.enabled = true;
        blocker.style.display = "none";
      }
    };
    var pointerLockError = function (event) {
      console.log(event);
      console.log(":(");
    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerLockChange, false );
    document.addEventListener( 'mozpointerlockchange', pointerLockChange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerLockChange, false );
    document.addEventListener( 'pointerlockerror', pointerLockError, false );
    document.addEventListener( 'mozpointerlockerror', pointerLockError, false );
    document.addEventListener( 'webkitpointerlockerror', pointerLockError, false );

    // Ask the browser lock the pointer

    document.body.addEventListener("click", function (event) {
      var instructions = document.getElementById("instructions");
      instructions.style.display = "none";
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
      element.requestPointerLock();
    }, false);
  } else {
    instructions.innerHTML = "No pointer lock for you";
  }
};

var onWindowResize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// Shooting

var initShooting = function () {
  window.addEventListener("click", shoot);

  ballShape = new CANNON.Sphere(0.2);
  ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
  shootDirection = new THREE.Vector3();
  shootVelo = 15;
  projector = new THREE.Projector();
};


var shoot = function () {
  if (!controls.enabled) {
    return;
  }

  var x = sphereBody.position.x;
  var y = sphereBody.position.y;
  var z = sphereBody.position.z;

  var ballBody = new CANNON.Body({ mass: 1 });
  ballBody.addShape(ballShape);

  var ballMesh = new THREE.Mesh(ballGeometry, material);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;

  world.add(ballBody);
  scene.add(ballMesh);

  balls.push(ballBody);
  ballMeshes.push(ballMesh);

  getShootDir(shootDirection);

  ballBody.velocity.set(shootDirection.x * shootVelo, shootDirection.y * shootVelo, shootDirection.z * shootVelo);

  // Move the ball outside the player sphere
  x += shootDirection.x * (sphereShape.radius*1.02 + ballShape.radius);
  y += shootDirection.y * (sphereShape.radius*1.02 + ballShape.radius);
  z += shootDirection.z * (sphereShape.radius*1.02 + ballShape.radius);
  ballBody.position.set(x,y,z);
  ballMesh.position.set(x,y,z);
};

var getShootDir = function (targetVec) {
  var vector = targetVec;
  targetVec.set(0,0,1);
  projector.unprojectVector(vector, camera);
  var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize());
  targetVec.x = ray.direction.x;
  targetVec.y = ray.direction.y;
  targetVec.z = ray.direction.z;
};

pointerLock();
initCannon();
initThree();
initShooting();
animate();
