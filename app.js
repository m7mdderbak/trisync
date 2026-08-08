let loggedUser = "محمد";
let loggedUserAvatar = "⚓";
let userPointsCount = 150;

// 1. تسجيل الدخول
function loginWithAccount() {
  const selectedUser = document.getElementById('user-select').value;
  const pinInput = document.getElementById('pin-input').value;

  if (pinInput === '2006') {
    loggedUser = selectedUser;
    if (selectedUser === 'محمد') loggedUserAvatar = '⚓';
    if (selectedUser === 'مصطفى') loggedUserAvatar = '🇸🇾';
    if (selectedUser === 'شهد') loggedUserAvatar = '🇸🇪';

    document.getElementById('current-user-name').innerText = loggedUser;
    document.getElementById('current-user-avatar').innerText = loggedUserAvatar;

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-content').classList.add('flex');
    
    initInteractive3DGlobe();
    renderAllMoviesList();
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

// 2. التحكم بالتبويبات
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'text-cyan-400'));
  
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  event.currentTarget.classList.add('active', 'text-cyan-400');
}

// 3. بناء الكرة الأرضية ثلاثية الأبعاد التفاعلية والواقعية مع OrbitControls والدبابيس
let scene, camera, renderer, globeGroup, controls;

function initInteractive3DGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || container.children.length > 0) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // تفعيل التحكم باللمس والتدوير (OrbitControls)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.enableZoom = false; // لمنع تشويه الواجهة على الهاتف

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // تحميل خريطة أرضية حقيقية واقعية ذات ألوان عالية الجودة
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load(
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    undefined,
    undefined,
    () => {
      // خيار احتياطي في حال بطء شبكة الصور
      createProceduralEarthTexture();
    }
  );

  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshBasicMaterial({ map: earthTexture });
  const globe = new THREE.Mesh(geometry, material);
  globeGroup.add(globe);

  // غلاف جوي مضيء
  const atmosGeo = new THREE.SphereGeometry(2.04, 32, 32);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.12,
    wireframe: true
  });
  globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

  // إضافة الدبابيس للأشخاص الثلاثة
  add3DPin(34.88, 35.88, "⚓ طرطوس/محمد", 0x38bdf8); // طرطوس/البحر
  add3DPin(34.80, 38.99, "🇸🇾 سوريا/مصطفى", 0x10b981); // سوريا
  add3DPin(60.12, 18.64, "🇸🇪 السويد/شهد", 0xa855f7);  // السويد

  camera.position.z = 5.2;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// إنشاء خريطة بديلة احتياطية
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(600, 200, 130, 0, Math.PI * 2); ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// إضافة دبوس مجسم ثلاثي الأبعاد مع حلقة مضيئة
function add3DPin(lat, lon, label, colorHex) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = 2.05;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = (r * Math.sin(phi) * Math.sin(theta));
  const y = (r * Math.cos(phi));

  // رأس الدبوس
  const pinGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const pinMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const pinMesh = new THREE.Mesh(pinGeo, pinMat);
  pinMesh.position.set(x, y, z);
  globeGroup.add(pinMesh);

  // قاعدة الدبوس المضيئة
  const ringGeo = new THREE.RingGeometry(0.05, 0.1, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.set(x * 1.01, y * 1.01, z * 1.01);
  ringMesh.lookAt(0, 0, 0);
  globeGroup.add(ringMesh);
}

// 4. التقاط صور الكاميرا الحقيقية بالتحديات
function previewChallengePhoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('challenge-preview-img').src = e.target.result;
      document.getElementById('challenge-preview-box').classList.remove('hidden');
      
      userPointsCount += 50;
      document.getElementById('user-points').innerText = `${loggedUser} 👑 (${userPointsCount} نقطة)`;
    };
    reader.readAsDataURL(file);
  }
}

// 5. مكتبة أعظم 20 فيلماً عالمياً وتقييماتها الحقيقية IMDb
const moviesList = [
  { title: "The Shawshank Redemption", year: 1994, genre: "دراما", rating: "⭐ 9.3 / 10" },
  { title: "The Godfather", year: 1972, genre: "جريمة / دراما", rating: "⭐ 9.2 / 10" },
  { title: "The Dark Knight", year: 2008, genre: "أكشن / إثارة", rating: "⭐ 9.0 / 10" },
  { title: "Inception", year: 2010, genre: "خيال علمي / غموض", rating: "⭐ 8.8 / 10" },
  { title: "Interstellar", year: 2014, genre: "مغامرة / خيال علمي", rating: "⭐ 8.7 / 10" },
  { title: "Fight Club", year: 1999, genre: "دراما / غموض", rating: "⭐ 8.8 / 10" },
  { title: "Pulp Fiction", year: 1994, genre: "جريمة / دراما", rating: "⭐ 8.9 / 10" },
  { title: "Oppenheimer", year: 2023, genre: "سيرة ذاتية / دراما", rating: "⭐ 8.9 / 10" },
  { title: "Gladiator", year: 2000, genre: "ملحمي / أكشن", rating: "⭐ 8.5 / 10" },
  { title: "Whiplash", year: 2014, genre: "دراما / موسيقى", rating: "⭐ 8.5 / 10" },
  { title: "Spirited Away", year: 2001, genre: "أنيميشن / خيال", rating: "⭐ 8.6 / 10" },
  { title: "Parasite", year: 2019, genre: "إثارة / دراما", rating: "⭐ 8.5 / 10" },
  { title: "Se7en", year: 1995, genre: "جريمة / غموض", rating: "⭐ 8.6 / 10" },
  { title: "The Prestige", year: 2006, genre: "غموض / إثارة", rating: "⭐ 8.5 / 10" },
  { title: "Dune: Part Two", year: 2024, genre: "خيال علمي / مغامرة", rating: "⭐ 8.6 / 10" },
  { title: "The Green Mile", year: 1999, genre: "دراما / خيال", rating: "⭐ 8.6 / 10" },
  { title: "Matrix", year: 1999, genre: "خيال علمي / أكشن", rating: "⭐ 8.7 / 10" },
  { title: "Goodfellas", year: 1990, genre: "جريمة / سيرة ذاتية", rating: "⭐ 8.7 / 10" },
  { title: "Schindler's List", year: 1993, genre: "تاريخي / دراما", rating: "⭐ 9.0 / 10" },
  { title: "12 Angry Men", year: 1957, genre: "جريمة / دراما", rating: "⭐ 9.0 / 10" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = `${randomMovie.title} (${randomMovie.year})`;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-rating').innerText = `تقييم IMDb الحقيقي: ${randomMovie.rating}`;
  document.getElementById('movie-card').classList.remove('hidden');
}

function renderAllMoviesList() {
  const container = document.getElementById('movies-list-grid');
  if (!container) return;
  container.innerHTML = "";

  moviesList.forEach((movie, index) => {
    const item = document.createElement('div');
    item.className = "bg-gray-900/80 p-2.5 rounded-xl border border-white/5 flex justify-between items-center text-xs";
    item.innerHTML = `
      <div class="text-right">
        <p class="font-bold text-gray-200">${index + 1}. ${movie.title} <span class="text-[10px] text-gray-500">(${movie.year})</span></p>
        <p class="text-[10px] text-gray-400">${movie.genre}</p>
      </div>
      <span class="text-amber-400 font-bold text-[11px]">${movie.rating}</span>
    `;
    container.appendChild(item);
  });
}

function toggleAllMoviesList() {
  const list = document.getElementById('all-movies-container');
  list.classList.toggle('hidden');
}

// 6. البروفايل والشات والغرفة السرية
function openEditProfileModal() {
  document.getElementById('edit-name-input').value = loggedUser;
  document.getElementById('edit-avatar-input').value = loggedUserAvatar;
  document.getElementById('profile-modal').classList.remove('hidden');
  document.getElementById('profile-modal').classList.add('flex');
}

function closeEditProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
  document.getElementById('profile-modal').classList.remove('flex');
}

function saveProfileChanges() {
  const newName = document.getElementById('edit-name-input').value.trim();
  const newAvatar = document.getElementById('edit-avatar-input').value.trim();

  if (newName !== "") {
    loggedUser = newName;
    document.getElementById('current-user-name').innerText = newName;
  }
  if (newAvatar) {
    loggedUserAvatar = newAvatar;
    document.getElementById('current-user-avatar').innerText = newAvatar;
  }
  closeEditProfileModal();
}

function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحار: أدخل موقعك الحالي أو اسم البحر/الميناء:");
  if (newLocation && newLocation.trim() !== "") {
    document.getElementById('card-loc-mohamed').innerText = newLocation;
  }
}

function openDirectChat(name, icon) {
  document.getElementById('chat-user-name').innerText = name;
  document.getElementById('chat-user-icon').innerText = icon;
  document.getElementById('direct-chat-modal').classList.remove('hidden');
  document.getElementById('direct-chat-modal').classList.add('flex');
}

function closeDirectChat() {
  document.getElementById('direct-chat-modal').classList.add('hidden');
  document.getElementById('direct-chat-modal').classList.remove('flex');
}

function sendDirectMessage() {
  const input = document.getElementById('direct-chat-input');
  const messagesBox = document.getElementById('direct-chat-messages');
  if (input.value.trim() !== "") {
    const msg = document.createElement('div');
    msg.className = "bg-cyan-600/30 border border-cyan-500/30 p-2.5 rounded-2xl max-w-[80%] self-end text-cyan-100 mr-auto text-left";
    msg.innerText = input.value;
    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    input.value = "";
  }
}

function sendShadowMessage() {
  const input = document.getElementById('shadow-input');
  const box = document.getElementById('shadow-chat-box');
  if (input.value.trim() !== "") {
    const msgDiv = document.createElement('div');
    msgDiv.className = "bg-purple-950/50 border border-purple-500/30 p-2.5 rounded-xl text-purple-200";
    msgDiv.innerHTML = `<span class="font-bold text-purple-400">👤 عضو مجهول:</span> ${input.value}`;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    input.value = "";
  }
  }
      
