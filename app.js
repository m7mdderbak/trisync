// 0. مسح أي بيانات كاش قديمة
if (!localStorage.getItem('trisync_v999')) {
  localStorage.clear();
  localStorage.setItem('trisync_v999', 'true');
}

// 1. بيانات المستخدمين
let usersData = JSON.parse(localStorage.getItem('trisync_users')) || {
  "محمد": { pin: "1234", location: "طرطوس 🌊", avatar: "⚓", photo: "", lat: 34.88, lon: 35.88, color: "cyan" },
  "مصطفى": { pin: "1234", location: "سوريا 🇸🇾", avatar: "🇸🇾", photo: "", lat: 34.80, lon: 38.99, color: "emerald" },
  "شهد": { pin: "1234", location: "السويد 🇸🇪", avatar: "🇸🇪", photo: "", lat: 60.12, lon: 18.64, color: "purple" }
};

function saveUsersToStorage() {
  localStorage.setItem('trisync_users', JSON.stringify(usersData));
}

let loggedUser = "محمد";
let userPointsCount = 150;

// 2. تسجيل الدخول
function loginWithAccount() {
  const userSelect = document.getElementById('user-select');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');

  const selectedUser = userSelect.value;
  const enteredPin = pinInput.value.trim();

  const userData = usersData[selectedUser];

  if (userData && enteredPin === userData.pin) {
    if (pinError) pinError.classList.add('hidden');
    loggedUser = selectedUser;

    document.getElementById('current-user-name').innerText = loggedUser;
    updateAvatarDisplay('current-user-avatar-container', userData);

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-content').classList.add('flex');
    
    initInteractive3DGlobe();
    renderAllMoviesList();
  } else {
    if (pinError) pinError.classList.remove('hidden');
  }
}

function updateAvatarDisplay(containerId, userData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (userData && userData.photo) {
    container.innerHTML = `<img src="${userData.photo}" class="w-full h-full object-cover rounded-xl">`;
  } else if (userData) {
    container.innerHTML = `<span class="text-base">${userData.avatar}</span>`;
  }
}

// 3. التنقل بين التبويبات
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'text-cyan-400'));
  
  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.remove('hidden');
  
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active', 'text-cyan-400');
  }
}

// 4. الكرة الأرضية والكروت
let scene, camera, renderer, globeGroup, controls;
let markersData = [];

function initInteractive3DGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || container.children.length > 0) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.enableZoom = false;

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshBasicMaterial({ map: earthTexture });
  const globe = new THREE.Mesh(geometry, material);
  globeGroup.add(globe);

  markersData = [];
  const markersContainer = document.getElementById('html-markers-container');
  if (markersContainer) markersContainer.innerHTML = '';

  Object.keys(usersData).forEach(userName => {
    const user = usersData[userName];
    const pos = latLonToVector3(user.lat, user.lon, 2.05);

    const pinGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: user.color === 'cyan' ? 0x38bdf8 : user.color === 'emerald' ? 0x10b981 : 0xa855f7 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(pos);
    globeGroup.add(pinMesh);

    if (markersContainer) {
      const el = document.createElement('div');
      el.className = `absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-full glass-card p-2 rounded-2xl text-center shadow-lg backdrop-blur-md bg-gray-950/80 transition-transform active:scale-95 border border-${user.color}-500/40`;
      
      const avatarHTML = user.photo 
        ? `<img src="${user.photo}" class="w-8 h-8 rounded-xl object-cover mx-auto mb-1 border border-white/20">`
        : `<div class="w-8 h-8 bg-${user.color}-500/20 text-${user.color}-400 font-bold rounded-xl flex items-center justify-center mx-auto mb-1 border border-${user.color}-400 text-sm">${user.avatar}</div>`;

      el.innerHTML = `
        ${avatarHTML}
        <h3 class="font-bold text-[10px] text-gray-200">${userName}</h3>
        <p class="text-[8px] text-${user.color}-400 font-medium">${user.location}</p>
      `;

      el.onclick = () => openDirectChat(userName, user.avatar);
      markersContainer.appendChild(el);
      markersData.push({ element: el, pos: pos });
    }
  });

  camera.position.z = 5.2;

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (globeGroup) globeGroup.rotation.y += 0.001;
    updateHTMLMarkers();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  animate();
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

function updateHTMLMarkers() {
  if (!camera || !markersData.length) return;

  markersData.forEach(marker => {
    const worldPos = marker.pos.clone().applyMatrix4(globeGroup.matrixWorld);
    const cameraDistance = camera.position.distanceTo(globeGroup.position);
    const markerDistance = camera.position.distanceTo(worldPos);

    if (markerDistance < cameraDistance) {
      const proj = worldPos.clone().project(camera);
      const container = document.getElementById('globe-container');
      if (container) {
        const x = (proj.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-proj.y * 0.5 + 0.5) * container.clientHeight;
        marker.element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        marker.element.style.opacity = '1';
        marker.element.style.display = 'block';
      }
    } else {
      marker.element.style.display = 'none';
    }
  });
}

// 5. تعديل البروفايل
function openEditProfileModal() {
  const current = usersData[loggedUser];
  document.getElementById('edit-name-input').value = loggedUser;
  document.getElementById('edit-photo-input').value = current ? (current.photo || "") : "";
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

function saveProfileChanges() {
  const newName = document.getElementById('edit-name-input').value.trim();
  const newPhoto = document.getElementById('edit-photo-input').value.trim();
  const newPin = document.getElementById('edit-pin-input').value.trim();

  if (newName !== "" && newName !== loggedUser) {
    usersData[newName] = { ...usersData[loggedUser] };
    delete usersData[loggedUser];
    loggedUser = newName;
  }

  if (newPin !== "") usersData[loggedUser].pin = newPin;
  usersData[loggedUser].photo = newPhoto;

  saveUsersToStorage();
  document.getElementById('current-user-name').innerText = loggedUser;
  updateAvatarDisplay('current-user-avatar-container', usersData[loggedUser]);

  closeEditProfileModal();
}

// 6. التحديات والأفلام
function previewChallengePhoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('challenge-preview-img').src = e.target.result;
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
  { title: "Pulp Fiction", year: 1994, genre: "جريمة", rating: "⭐ 8.9" },
  { title: "Inception", year: 2010, genre: "خيال علمي", rating: "⭐ 8.8" },
  { title: "Interstellar", year: 2014, genre: "خيال علمي", rating: "⭐ 8.7" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = `${randomMovie.title} (${randomMovie.year})`;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-rating').innerText = `تقييم IMDb: ${randomMovie.rating}`;
  document.getElementById('movie-card').classList.remove('hidden');
}

function renderAllMoviesList() {
  const container = document.getElementById('all-movies-container');
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
  if (list) list.classList.toggle('hidden');
}

// 7. الدردشات ووضع البحر
function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحر: أدخل اسم المكان الحالي:");
  if (newLocation && newLocation.trim() !== "") {
    usersData[loggedUser].location = newLocation;
    saveUsersToStorage();
    location.reload();
  }
}

function openDirectChat(name, icon) {
  document.getElementById('chat-user-name').innerText = name;
  const user = usersData[name];
  updateAvatarDisplay('chat-user-icon', user || { avatar: icon });
  const modal = document.getElementById('direct-chat-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDirectChat() {
  const modal = document.getElementById('direct-chat-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function sendDirectMessage() {
  const input = document.getElementById('direct-chat-input');
  const messagesBox = document.getElementById('direct-chat-messages');
  if (input.value.trim() !== "") {
    const msg = document.createElement('div');
    msg.className = "bg-cyan-600/30 border border-cyan-500/30 p-2 rounded-xl text-cyan-100 mr-auto text-left max-w-[80%]";
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
    msgDiv.className = "bg-purple-950/50 border border-purple-500/30 p-2.5 rounded-xl text-purple-200 text-xs";
    msgDiv.innerHTML = `<span class="font-bold text-purple-400">👤 عضو مجهول:</span> ${input.value}`;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    input.value = "";
  }
}
