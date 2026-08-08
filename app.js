let loggedUser = "محمد";
let loggedUserAvatar = "⚓";

// 1. تسجيل الدخول باختيار الحساب والرمز 2006
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
    
    initRealisticGlobe();
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

// 3. بناء الكرة الأرضية ثلاثية الأبعاد بواقعية الألوان + الدبابيس والإشارات
let scene, camera, renderer, globeGroup;

function initRealisticGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || container.children.length > 0) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // إنشاء خريطة واقعية باستخدام Canvas لتفادي مشاكل التحميل
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // لون المحيطات الأزرق الداكن
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // رسم تضاريس خضراء وذهبية حقيقية
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(600, 200, 120, 0, Math.PI * 2); // قارة أوربا وآسيا
  ctx.arc(520, 280, 90, 0, Math.PI * 2);  // إفريقيا
  ctx.arc(250, 220, 110, 0, Math.PI * 2); // أمريكا الشمالية
  ctx.arc(320, 340, 80, 0, Math.PI * 2);  // أمريكا الجنوبية
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);

  // مجسم الكرة الأرضية
  const geometry = new THREE.SphereGeometry(2, 48, 48);
  const material = new THREE.MeshBasicMaterial({
    map: texture
  });
  
  const globe = new THREE.Mesh(geometry, material);
  globeGroup.add(globe);

  // إضافة الغلاف الجوي المضيء
  const atmosGeometry = new THREE.SphereGeometry(2.05, 32, 32);
  const atmosMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.15,
    wireframe: true
  });
  const atmos = new THREE.Mesh(atmosGeometry, atmosMaterial);
  globeGroup.add(atmos);

  // إضافة دبابيس المواقع فوق الكرة الأرضية
  addPin(35, 38, "🇸🇾 مصطفى", 0x10b981);  // سوريا
  addPin(60, 15, "🇸🇪 شهد", 0xa855f7);   // السويد
  addPin(25, 55, "⚓ محمد", 0x38bdf8);   // البحر

  camera.position.z = 5.3;

  function animate() {
    requestAnimationFrame(animate);
    globeGroup.rotation.y += 0.003;
    renderer.render(scene, camera);
  }
  animate();
}

// دالة إضافة دبوس مع نصوص وصور بالألوان فوق الموقع
function addPin(lat, lon, labelText, colorHex) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const radius = 2.05;

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  // مجسم الدبوس
  const pinGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const pinMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const pinMesh = new THREE.Mesh(pinGeo, pinMat);
  pinMesh.position.set(x, y, z);
  globeGroup.add(pinMesh);
}

// 4. تعديل البروفايل (الاسم والصورة)
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

    if (loggedUser === 'محمد' || loggedUser === document.getElementById('card-name-mohamed').innerText) {
      document.getElementById('card-name-mohamed').innerText = newName;
      if (newAvatar) document.getElementById('card-avatar-mohamed').innerText = newAvatar;
    }
    if (loggedUser === 'مصطفى' || loggedUser === document.getElementById('card-name-mustafa').innerText) {
      document.getElementById('card-name-mustafa').innerText = newName;
      if (newAvatar) document.getElementById('card-avatar-mustafa').innerText = newAvatar;
    }
    if (loggedUser === 'شهد' || loggedUser === document.getElementById('card-name-shahad').innerText) {
      document.getElementById('card-name-shahad').innerText = newName;
      if (newAvatar) document.getElementById('card-avatar-shahad').innerText = newAvatar;
    }
  }

  if (newAvatar) {
    loggedUserAvatar = newAvatar;
    document.getElementById('current-user-avatar').innerText = newAvatar;
  }

  closeEditProfileModal();
}

// 5. وضع البحار
function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحار: أدخل موقعك الحالي أو اسم البحر/الميناء:");
  if (newLocation && newLocation.trim() !== "") {
    document.getElementById('card-loc-mohamed').innerText = newLocation;
  }
}

// 6. الشات المباشر
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

// 7. الغرفة السرية
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

// 8. سينما الأسبوع
const moviesList = [
  { title: "Inception", genre: "خيال علمي / غموض" },
  { title: "Interstellar", genre: "مغامرة / خيال علمي" },
  { title: "The Dark Knight", genre: "أكشن / دراما" },
  { title: "Gladiator", genre: "ملحمي / أكشن" },
  { title: "Whiplash", genre: "دراما / موسيقى" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = randomMovie.title;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-card').classList.remove('hidden');
                            }
        
