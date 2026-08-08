let currentChatUser = "";

// 1. شاشة الدخول السرية (PIN: 2006)
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

// 2. التنقل بين التبويبات
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'text-cyan-400'));
  
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  event.currentTarget.classList.add('active', 'text-cyan-400');
}

// 3. بناء الكرة الأرضية 3D
let scene, camera, renderer, globe;

function initGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || container.children.length > 0) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(2, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  camera.position.z = 5.2;

  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.003;
    renderer.render(scene, camera);
  }
  animate();
}

// 4. وضع البحار لمحمد
function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحار: أدخل موقعك الحالي أو اسم البحر/الميناء:");
  if (newLocation && newLocation.trim() !== "") {
    document.getElementById('card-loc-mohamed').innerText = newLocation;
  }
}

// 5. فتح وإغلاق الشات المباشر
function openDirectChat(name, icon) {
  currentChatUser = name;
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

// 6. الغرفة السرية
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

// 7. سينما الأسبوع
const moviesList = [
  { title: "Inception", genre: "خيال علمي / غموض" },
  { title: "Interstellar", genre: "مغامرة / خيال علمي" },
  { title: "The Dark Knight", genre: "أكشن / دراما" },
  { title: "Gladiator", genre: "ملحمي / أكشن" },
  { title: "Whiplash", genre: "دراما / موسيقى" },
  { title: "The Prestige", genre: "إثارة / غموض" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = randomMovie.title;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-card').classList.remove('hidden');
                                            }
