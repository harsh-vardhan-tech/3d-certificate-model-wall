// app.js (simplified)
const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,1.6,5);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setSize(innerWidth, innerHeight);

// lights
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const spot = new THREE.DirectionalLight(0xffffff,0.6);
spot.position.set(5,10,7); scene.add(spot);

// load certificates from metadata array
const metadata = [
  {id:'cert_01', img:'assets/cert_01.webp', pdf:'assets/cert_01.pdf', pos:[-3,1.6,-2]},
  {id:'cert_02', img:'assets/cert_02.webp', pdf:'assets/cert_02.pdf', pos:[0,1.6,-2]},
  // ...
];

const loader = new THREE.TextureLoader();
const frames = [];

metadata.forEach((m,i)=>{
  loader.load(m.img, (tex)=>{
    const mat = new THREE.MeshStandardMaterial({map:tex});
    const geo = new THREE.PlaneGeometry(1.6,1.1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...m.pos);
    mesh.userData = {...m}; // store metadata on mesh
    scene.add(mesh);
    frames.push(mesh);
  });
});

// raycaster for clicks
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(e){
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = - (e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(frames);
  if(intersects.length){
    const mesh = intersects[0].object;
    zoomToFrameAndShowModal(mesh);
  }
}

window.addEventListener('pointerdown', onPointerDown);

// camera animation + show modal
function zoomToFrameAndShowModal(mesh){
  // compute target camera position (slightly in front of frame)
  const dir = new THREE.Vector3();
  mesh.getWorldDirection(dir); // direction facing
  const targetPos = mesh.position.clone().add(new THREE.Vector3(0,0,1.8)); // adjust distance
  // GSAP animate camera position and lookAt
  gsap.to(camera.position, {duration:1.2, x: targetPos.x, y: targetPos.y, z: targetPos.z, onUpdate:()=>{
    camera.lookAt(mesh.position);
  }, onComplete: ()=>{
    showModal(mesh.userData);
  }});
}

// HTML modal control
const modal = document.getElementById('certModal');
const modalImg = document.getElementById('modalImg');
const downloadBtn = document.getElementById('downloadBtn');
const closeBtn = document.getElementById('closeBtn');

function showModal(data){
  modalImg.src = data.img;          // show HD image (or larger)
  downloadBtn.href = data.pdf;     // pdf download link
  modal.classList.remove('hidden');
  // optionally pause scene interactions
}

function hideModal(){
  modal.classList.add('hidden');
  // animate camera back to default
  gsap.to(camera.position, {duration:1, x:0, y:1.6, z:5, onUpdate:()=>camera.lookAt(0,1.2,0)});
}

closeBtn.addEventListener('click', hideModal);

// render loop
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
