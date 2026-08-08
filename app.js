let usersData = JSON.parse(localStorage.getItem('trisync_users')) || {
  "محمد": { pin: "1234", lat: 34.88, lon: 35.88, photo: "", birthdate: "" },
  "مصطفى": { pin: "1234", lat: 34.80, lon: 38.99, photo: "", birthdate: "" },
  "شهد": { pin: "1234", lat: 60.12, lon: 18.64, photo: "", birthdate: "" }
};
let loggedUser = "محمد";

// معالجة الصور
document.getElementById('edit-photo-input').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = (event) => usersData[loggedUser].photo = event.target.result;
  reader.readAsDataURL(e.target.files[0]);
});

function loginWithAccount() {
  const pin = document.getElementById('pin-input').value;
  if (pin === "1234") {
    loggedUser = document.getElementById('user-select').value;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    initInteractive3DGlobe();
    loadMessages();
  } else {
    alert("PIN غير صحيح");
  }
}

// 1. الموقع الجغرافي
function updateMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      usersData[loggedUser].lat = pos.coords.latitude;
      usersData[loggedUser].lon = pos.coords.longitude;
      localStorage.setItem('trisync_users', JSON.stringify(usersData));
      alert("تم تحديث موقعك!");
      initInteractive3DGlobe();
    });
  }
}

// 2. الكرة الأرضية المصححة
let scene, camera, renderer, globeGroup, markersData = [];

function initInteractive3DGlobe() {
  const container = document.getElementById('globe-container');
  container.innerHTML = '';
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({alpha:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  globeGroup = new THREE.Group();
  scene.add(globeGroup);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({color: 0x1e3a8a, wireframe: true}));
  globeGroup.add(globe);

  markersData = [];
  const mContainer = document.getElementById('html-markers-container');
  mContainer.innerHTML = '';

  Object.keys(usersData).forEach(name => {
    const user = usersData[name];
    const el = document.createElement('div');
    el.className = "absolute bg-white text-black p-1 rounded-full text-[10px] font-bold";
    el.innerText = name[0];
    mContainer.appendChild(el);
    markersData.push({el, lat: user.lat, lon: user.lon});
  });

  camera.position.z = 6;
  function animate() {
    requestAnimationFrame(animate);
    markersData.forEach(m => {
      const pos = latLonToVector3(m.lat, m.lon, 2);
      const vector = pos.clone().project(camera);
      // التصحيح: إخفاء الدبوس إذا كان خلف الكرة
      if (pos.clone().applyMatrix4(globeGroup.matrixWorld).z > camera.position.z - 2) {
         m.el.style.display = 'block';
         const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
         const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;
         m.el.style.transform = `translate(${x}px, ${y}px)`;
      } else {
         m.el.style.display = 'none';
      }
    });
    renderer.render(scene, camera);
  }
  animate();
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-(radius*Math.sin(phi)*Math.cos(theta)), radius*Math.cos(phi), radius*Math.sin(phi)*Math.sin(theta));
}

// 3. الدردشة مع تزامن (Storage Sync)
function sendMessage() {
  const input = document.getElementById('chat-input');
  const chat = JSON.parse(localStorage.getItem('messages') || '[]');
  chat.push({user: loggedUser, text: input.value});
  localStorage.setItem('messages', JSON.stringify(chat));
  input.value = "";
  loadMessages();
}

function loadMessages() {
  const chat = JSON.parse(localStorage.getItem('messages') || '[]');
  const box = document.getElementById('chat-box');
  box.innerHTML = chat.map(m => `<p><b>${m.user}:</b> ${m.text}</p>`).join('');
}

// استماع للتغييرات في المتصفح (عشان التزامن)
window.addEventListener('storage', () => loadMessages());

function openEditProfileModal() { document.getElementById('profile-modal').classList.remove('hidden'); document.getElementById('profile-modal').classList.add('flex'); }
function closeEditProfileModal() { document.getElementById('profile-modal').classList.add('hidden'); }
function saveProfileChanges() {
  usersData[loggedUser].birthdate = document.getElementById('edit-birthdate').value;
  localStorage.setItem('trisync_users', JSON.stringify(usersData));
  closeEditProfileModal();
}
