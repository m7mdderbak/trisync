// --- 1. التحقق من الرمز السري ---
function loginWithPin() {
  const pinInput = document.getElementById('pin-input').value;
  if (pinInput === '2006') {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-content').classList.add('flex');
    initGlobe();
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

// --- 2. التحكم بالتنقل بين الصفحات (Tabs) ---
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.add('hidden'));
  
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

// --- 3. بناء الكرة الأرضية ثلاثية الأبعاد (Three.js 3D Globe) ---
let scene, camera, renderer, globe;

function initGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || container.children.length > 0) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // مجسم الكرة الأرضية
  const geometry = new THREE.SphereGeometry(2, 36, 36);
  const material = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  camera.position.z = 5.5;

  // دوران خفيف ومستمر للكرة الأرضية
  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0025;
    renderer.render(scene, camera);
  }
  animate();
}

// --- 4. وضع البحار الخاص بمحمد (تغيير الموقع فوراً) ---
function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحار: أدخل موقعك الحالي أو اسم السفينة/الميناء:");
  if (newLocation && newLocation.trim() !== "") {
    document.getElementById('card-loc-mohamed').innerText = newLocation;
    alert(`تم تحديث موقعك الملاحي إلى: ${newLocation}`);
  }
}

// --- 5. ميزة تعديل الأسماء الشخصية ---
function editProfile(currentName) {
  const newName = prompt(`تعديل الاسم الحالي (${currentName}):`);
  if (newName && newName.trim() !== "") {
    if (currentName === 'محمد') document.getElementById('card-name-mohamed').innerText = newName;
    if (currentName === 'مصطفى') document.getElementById('card-name-mustafa').innerText = newName;
    if (currentName === 'شهد') document.getElementById('card-name-shahad').innerText = newName;
  }
}

// --- 6. الغرفة السرية (The Shadow Room) ---
function sendShadowMessage() {
  const input = document.getElementById('shadow-input');
  const box = document.getElementById('shadow-chat-box');
  
  if (input.value.trim() !== "") {
    const msgDiv = document.createElement('div');
    msgDiv.className = "bg-purple-950/60 border border-purple-500/30 p-2 rounded-lg text-purple-200";
    msgDiv.innerHTML = `<span class="font-bold text-purple-400">👤 عضو مجهول:</span> ${input.value}`;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    input.value = "";
  }
}

// --- 7. مولد أفلام السينما العشوائي ---
const moviesList = [
  { title: "Inception", genre: "خيال علمي / غموض" },
  { title: "Interstellar", genre: "مغامرة / خيال علمي" },
  { title: "The Dark Knight", genre: "أكشن / دراما" },
  { title: "Gladiator", genre: "ملحمي / أكشن" },
  { title: "Whiplash", genre: "دراما / موسيقى" },
  { title: "Parasite", genre: "إثارة / دراما" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = randomMovie.title;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-card').classList.remove('hidden');
}

// --- 8. الشات المباشر عند النقر على البطاقات ---
function openDirectChat(name) {
  alert(`فتح الشات المباشر والخاص مع: ${name}`);
}
  
