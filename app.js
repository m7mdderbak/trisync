// 1. البيانات الأولية
let usersData = JSON.parse(localStorage.getItem('trisync_users_v2')) || {
  "محمد": { pin: "1234", location: "طرطوس 🌊", avatar: "⚓", photo: "", lat: 34.88, lon: 35.88, color: "cyan", birthdate: "" },
  "مصطفى": { pin: "1234", location: "سوريا 🇸🇾", avatar: "🇸🇾", photo: "", lat: 34.80, lon: 38.99, color: "emerald", birthdate: "" },
  "شهد": { pin: "1234", location: "السويد 🇸🇪", avatar: "🇸🇪", photo: "", lat: 60.12, lon: 18.64, color: "purple", birthdate: "" }
};

function saveUsersToStorage() {
  localStorage.setItem('trisync_users_v2', JSON.stringify(usersData));
}

let loggedUser = "محمد";
let userPointsCount = 150;

// 2. تسجيل الدخول
function loginWithAccount() {
  const selectedUser = document.getElementById('user-select').value;
  const enteredPin = document.getElementById('pin-input').value.trim();
  const userData = usersData[selectedUser];

  if (userData && enteredPin === userData.pin) {
    document.getElementById('pin-error').classList.add('hidden');
    loggedUser = selectedUser;

    document.getElementById('current-user-name').innerText = loggedUser;
    updateAvatarDisplay('current-user-avatar-container', userData);

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-content').classList.add('flex');

    initInteractive3DGlobe();
    renderAllMoviesList();
    loadChatMessages();
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

function updateAvatarDisplay(containerId, userData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (userData && userData.photo) {
    container.innerHTML = `<img src="${userData.photo}" class="w-full h-full object-cover rounded-xl">`;
  } else if (userData) {
    container.innerHTML = `<span class="text-sm">${userData.avatar}</span>`;
  }
}

// 3. التنقل بين التبويبات
function switchTab(tabName, btnElement) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-cyan-400');
    btn.classList.add('text-gray-400');
  });

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.remove('hidden');

  if (btnElement) {
    btnElement.classList.remove('text-gray-400');
    btnElement.classList.add('text-cyan-400');
  }
}

// 4. الكرة الأرضية المصححة 3D والإضاءة والدبابيس
let scene, camera, renderer, globeGroup, globeMesh, controls;
let markersData = [];

function initInteractive3DGlobe() {
  const container = document.getElementById('globe-container');
  if (!container) return;
  container.innerHTML = '';

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false;

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // إضاءة كوكب الأرض
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.6 });
  globeMesh = new THREE.Mesh(geometry, material);
  globeGroup.add(globeMesh);

  markersData = [];
  const markersContainer = document.getElementById('html-markers-container');
  if (markersContainer) markersContainer.innerHTML = '';

  Object.keys(usersData).forEach(userName => {
    const user = usersData[userName];
    const pos = latLonToVector3(user.lat, user.lon, 2.02);

    // نقطة مجسمة 3D
    const pinGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: user.color === 'cyan' ? 0x38bdf8 : user.color === 'emerald' ? 0x10b981 : 0xa855f7 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(pos);
    globeGroup.add(pinMesh);

    // بطاقة الـ HTML المترابطة فوق الدبوس
    if (markersContainer) {
      const el = document.createElement('div');
      el.className = `absolute pointer-events-auto transform -translate-x-1/2 -translate-y-full glass-card p-2 rounded-xl text-center shadow-lg border border-${user.color}-500/40 min-w-[70px]`;

      const avatarHTML = user.photo
        ? `<img src="${user.photo}" class="w-7 h-7 rounded-lg object-cover mx-auto mb-1 border border-white/20">`
        : `<div class="w-7 h-7 bg-${user.color}-500/20 text-${user.color}-400 font-bold rounded-lg flex items-center justify-center mx-auto mb-1 text-xs border border-${user.color}-400/30">${user.avatar}</div>`;

      el.innerHTML = `
        ${avatarHTML}
        <h4 class="font-bold text-[10px] text-gray-100">${userName}</h4>
        <p class="text-[8px] text-${user.color}-400 font-medium">${user.location}</p>
      `;

      markersContainer.appendChild(el);
      markersData.push({ element: el, pos: pos });
    }
  });

  camera.position.z = 5.2;

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (globeGroup) globeGroup.rotation.y += 0.0012;
    updateHTMLMarkers();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  animate();
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// معادلة حساب موقع وإخفاء الدبابيس خلف الكرة الأرضية
function updateHTMLMarkers() {
  if (!camera || !markersData.length || !globeMesh) return;

  const globeCenter = new THREE.Vector3();
  globeMesh.getWorldPosition(globeCenter);

  markersData.forEach(marker => {
    const worldPos = marker.pos.clone().applyMatrix4(globeGroup.matrixWorld);
    const camToMarker = worldPos.clone().sub(camera.position).normalize();
    const normal = worldPos.clone().sub(globeCenter).normalize();

    // إذا كانت الزاوية من السطح للكاميرا منفرجة، يعني الدبوس بالجهة الخلفية للكرة
    if (camToMarker.dot(normal) < -0.05) {
      const vector = worldPos.clone().project(camera);
      const container = document.getElementById('globe-container');
      const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;

      marker.element.style.display = 'block';
      marker.element.style.left = `${x}px`;
      marker.element.style.top = `${y}px`;
    } else {
      marker.element.style.display = 'none';
    }
  });
}

// 5. تعديل البروفايل، الصورة، وتحديث الـ GPS
function openEditProfileModal() {
  const current = usersData[loggedUser];
  document.getElementById('edit-name-input').value = loggedUser;
  document.getElementById('edit-birthdate-input').value = current ? (current.birthdate || "") : "";
  document.getElementById('edit-pin-input').value = current ? current.pin : "1234";

  const modal = document.getElementById('profile-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeEditProfileModal() {
  const modal = document.getElementById('profile-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// قراءة ملف الصورة
document.getElementById('edit-image-file').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      usersData[loggedUser].photo = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function updateMyLocationGPS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        usersData[loggedUser].lat = pos.coords.latitude;
        usersData[loggedUser].lon = pos.coords.longitude;
        usersData[loggedUser].location = "موقعي الحالي 📍";
        saveUsersToStorage();
        alert("تم تحديث إحداثيات موقعك الجغرافي بنجاح!");
        initInteractive3DGlobe();
      },
      () => alert("يرجى إعطاء صلاحية الموقع (GPS) للمتصفح.")
    );
  }
}

function saveProfileChanges() {
  const newName = document.getElementById('edit-name-input').value.trim();
  const newPin = document.getElementById('edit-pin-input').value.trim();
  const newBirth = document.getElementById('edit-birthdate-input').value;

  if (newName !== "" && newName !== loggedUser) {
    usersData[newName] = { ...usersData[loggedUser] };
    delete usersData[loggedUser];
    loggedUser = newName;
  }

  if (newPin !== "") usersData[loggedUser].pin = newPin;
  usersData[loggedUser].birthdate = newBirth;

  saveUsersToStorage();
  document.getElementById('current-user-name').innerText = loggedUser;
  updateAvatarDisplay('current-user-avatar-container', usersData[loggedUser]);

  closeEditProfileModal();
  initInteractive3DGlobe();
}

// 6. نظام الدردشة
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (input.value.trim() === "") return;

  const chat = JSON.parse(localStorage.getItem('trisync_messages') || '[]');
  chat.push({ user: loggedUser, text: input.value.trim(), time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) });
  localStorage.setItem('trisync_messages', JSON.stringify(chat));

  input.value = "";
  loadChatMessages();
}

function loadChatMessages() {
  const chat = JSON.parse(localStorage.getItem('trisync_messages') || '[]');
  const box = document.getElementById('chat-box');
  if (!box) return;

  box.innerHTML = chat.map(m => `
    <div class="p-2 rounded-xl text-xs ${m.user === loggedUser ? 'bg-cyan-600/30 border border-cyan-500/30 mr-auto text-cyan-100 max-w-[85%]' : 'bg-gray-800/80 border border-white/5 text-gray-200 max-w-[85%]'}">
      <div class="flex justify-between items-center gap-2 mb-1">
        <span class="font-bold text-[10px] ${m.user === loggedUser ? 'text-cyan-300' : 'text-purple-400'}">${m.user}</span>
        <span class="text-[8px] text-gray-400">${m.time || ''}</span>
      </div>
      <p>${m.text}</p>
    </div>
  `).join('');

  box.scrollTop = box.scrollHeight;
}

window.addEventListener('storage', () => loadChatMessages());

// 7. التحديات والأفلام
function previewChallengePhoto(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      document.getElementById('challenge-preview-img').src = event.target.result;
      document.getElementById('challenge-preview-box').classList.remove('hidden');
      userPointsCount += 50;
      document.getElementById('user-points').innerText = `👑 (${userPointsCount} نقطة)`;
    };
    reader.readAsDataURL(file);
  }
}

const moviesList = [
  { title: "The Shawshank Redemption", year: 1994, genre: "دراما", rating: "⭐ 9.3" },
  { title: "The Godfather", year: 1972, genre: "جريمة", rating: "⭐ 9.2" },
  { title: "The Dark Knight", year: 2008, genre: "أكشن", rating: "⭐ 9.0" },
  { title: "Inception", year: 2010, genre: "خيال علمي", rating: "⭐ 8.8" },
  { title: "Interstellar", year: 2014, genre: "خيال علمي", rating: "⭐ 8.7" }
];

function generateRandomMovie() {
  const m = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = `${m.title} (${m.year})`;
  document.getElementById('movie-genre').innerText = `التصنيف: ${m.genre}`;
  document.getElementById('movie-rating').innerText = `تقييم IMDb: ${m.rating}`;
  document.getElementById('movie-card').classList.remove('hidden');
}

function renderAllMoviesList() {
  const container = document.getElementById('all-movies-container');
  if (!container) return;
  container.innerHTML = moviesList.map((m, i) => `
    <div class="bg-gray-900/80 p-2 rounded-xl border border-white/5 flex justify-between items-center text-xs">
      <div>
        <p class="font-bold text-gray-200">${i + 1}. ${m.title} <span class="text-[10px] text-gray-500">(${m.year})</span></p>
        <p class="text-[10px] text-gray-400">${m.genre}</p>
      </div>
      <span class="text-amber-400 font-bold text-[11px]">${m.rating}</span>
    </div>
  `).join('');
}

function toggleAllMoviesList() {
  document.getElementById('all-movies-container').classList.toggle('hidden');
}
  
