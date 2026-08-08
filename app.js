// بيانات المستخدمين الافتراضية
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

// 1. تسجيل الدخول باستخدام كلمة مرور خاصة واستخراج اسم المستخدم الصحيح
function loginWithAccount() {
  const selectedUserRaw = document.getElementById('user-select').value;
  const pinInput = document.getElementById('pin-input').value.trim();

  // استخراج الاسم الأساسي فقط (مثل "محمد" أو "مصطفى" أو "شهد")
  const selectedUser = selectedUserRaw.split(' ')[0].trim();

  const userData = usersData[selectedUser];

  if (userData && pinInput === userData.pin) {
    document.getElementById('pin-error').classList.add('hidden');
    loggedUser = selectedUser;

    document.getElementById('current-user-name').innerText = loggedUser;
    updateAvatarDisplay('current-user-avatar-container', userData);

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('app-content').classList.add('flex');
    
    initInteractive3DGlobe();
    renderAllMoviesList();
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

function updateAvatarDisplay(containerId, userData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (userData.photo) {
    container.innerHTML = `<img src="${userData.photo}" class="w-full h-full object-cover rounded-xl">`;
  } else {
    container.innerHTML = `<span class="text-base">${userData.avatar}</span>`;
  }
}

// 2. التحكم بالتبويبات
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'text-cyan-400'));
  
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  event.currentTarget.classList.add('active', 'text-cyan-400');
}

// 3. الكرة الأرضية والكروت الفوقية ثلاثية الأبعاد
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

  // إعداد الكروت والدبابيس لكل شخص
  markersData = [];
  const markersContainer = document.getElementById('html-markers-container');
  markersContainer.innerHTML = '';

  Object.keys(usersData).forEach(userName => {
    const user = usersData[userName];
    const pos = latLonToVector3(user.lat, user.lon, 2.05);

    // إضافة دبوس مضيء على الطابة
    const pinGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: user.color === 'cyan' ? 0x38bdf8 : user.color === 'emerald' ? 0x10b981 : 0xa855f7 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(pos);
    globeGroup.add(pinMesh);

    // إنشاء الكارت الـ HTML المعلق فوق الدبوس
    const el = document.createElement('div');
    el.className = `absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-full glass-card p-2 rounded-2xl border border-${user.color}-500/40 text-center shadow-lg backdrop-blur-md bg-gray-950/80 transition-transform active:scale-95`;
    
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
  });

  camera.position.z = 5.2;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    globeGroup.rotation.y += 0.001;
    updateHTMLMarkers();
    renderer.render(scene, camera);
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

// تحديث مواقع الكروت الـ HTML لتتحرك مع الطابة
function updateHTMLMarkers() {
  if (!camera || !markersData.length) return;

  markersData.forEach(marker => {
    const worldPos = marker.pos.clone().applyMatrix4(globeGroup.matrixWorld);
    
    const cameraDistance = camera.position.distanceTo(globeGroup.position);
    const markerDistance = camera.position.distanceTo(worldPos);

    if (markerDistance < cameraDistance) {
      const proj = worldPos.clone().project(camera);
      const container = document.getElementById('globe-container');
      const x = (proj.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-proj.y * 0.5 + 0.5) * container.clientHeight;

      marker.element.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      marker.element.style.opacity = '1';
      marker.element.style.display = 'block';
    } else {
      marker.element.style.display = 'none';
    }
  });
}

// 4. تعديل البروفايل وكلمة السر والصورة الشخصية
function openEditProfileModal() {
  const current = usersData[loggedUser];
  document.getElementById('edit-name-input').value = loggedUser;
  document.getElementById('edit-photo-input').value = current.photo || "";
  document.getElementById('edit-pin-input').value = current.pin;
  
  document.getElementById('profile-modal').classList.remove('hidden');
  document.getElementById('profile-modal').classList.add('flex');
}

function closeEditProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
  document.getElementById('profile-modal').classList.remove('flex');
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
  location.reload();
}

// 5. التحديات والكاميرا
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

// 6. قائمة الـ 100 فيلم العالمية
const moviesList = [
  { title: "The Shawshank Redemption", year: 1994, genre: "دراما", rating: "⭐ 9.3" },
  { title: "The Godfather", year: 1972, genre: "جريمة", rating: "⭐ 9.2" },
  { title: "The Dark Knight", year: 2008, genre: "أكشن", rating: "⭐ 9.0" },
  { title: "The Godfather Part II", year: 1974, genre: "جريمة", rating: "⭐ 9.0" },
  { title: "12 Angry Men", year: 1957, genre: "دراما", rating: "⭐ 9.0" },
  { title: "Schindler's List", year: 1993, genre: "تاريخي", rating: "⭐ 9.0" },
  { title: "The Lord of the Rings: The Return of the King", year: 2003, genre: "خيال", rating: "⭐ 9.0" },
  { title: "Pulp Fiction", year: 1994, genre: "جريمة", rating: "⭐ 8.9" },
  { title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, genre: "خيال", rating: "⭐ 8.8" },
  { title: "The Good, the Bad and the Ugly", year: 1966, genre: "غرب أمريكي", rating: "⭐ 8.8" },
  { title: "Forrest Gump", year: 1994, genre: "دراما / كوميديا", rating: "⭐ 8.8" },
  { title: "Fight Club", year: 1999, genre: "دراما / إثارة", rating: "⭐ 8.8" },
  { title: "Inception", year: 2010, genre: "خيال علمي", rating: "⭐ 8.8" },
  { title: "The Lord of the Rings: The Two Towers", year: 2002, genre: "خيال", rating: "⭐ 8.8" },
  { title: "Star Wars: Episode V - The Empire Strikes Back", year: 1980, genre: "خيال علمي", rating: "⭐ 8.7" },
  { title: "The Matrix", year: 1999, genre: "خيال علمي", rating: "⭐ 8.7" },
  { title: "Goodfellas", year: 1990, genre: "جريمة", rating: "⭐ 8.7" },
  { title: "One Flew Over the Cuckoo's Nest", year: 1975, genre: "دراما", rating: "⭐ 8.7" },
  { title: "Se7en", year: 1995, genre: "غموض / إثارة", rating: "⭐ 8.6" },
  { title: "Seven Samurai", year: 1954, genre: "مغامرة", rating: "⭐ 8.6" },
  { title: "It's a Wonderful Life", year: 1946, genre: "دراما", rating: "⭐ 8.6" },
  { title: "The Silence of the Lambs", year: 1991, genre: "إثارة", rating: "⭐ 8.6" },
  { title: "Saving Private Ryan", year: 1998, genre: "حربي", rating: "⭐ 8.6" },
  { title: "City of God", year: 2002, genre: "جريمة", rating: "⭐ 8.6" },
  { title: "Interstellar", year: 2014, genre: "خيال علمي", rating: "⭐ 8.7" },
  { title: "Life Is Beautiful", year: 1997, genre: "دراما", rating: "⭐ 8.6" },
  { title: "The Green Mile", year: 1999, genre: "دراما", rating: "⭐ 8.6" },
  { title: "Star Wars: Episode IV - A New Hope", year: 1977, genre: "خيال علمي", rating: "⭐ 8.6" },
  { title: "Terminator 2: Judgment Day", year: 1991, genre: "أكشن / خيال علمي", rating: "⭐ 8.6" },
  { title: "Back to the Future", year: 1985, genre: "خيال علمي", rating: "⭐ 8.5" },
  { title: "Spirited Away", year: 2001, genre: "أنيميشن", rating: "⭐ 8.6" },
  { title: "Psycho", year: 1960, genre: "رعب / إثارة", rating: "⭐ 8.5" },
  { title: "The Pianist", year: 2002, genre: "سيرة ذاتية", rating: "⭐ 8.5" },
  { title: "Parasite", year: 2019, genre: "إثارة / دراما", rating: "⭐ 8.5" },
  { title: "Leon: The Professional", year: 1994, genre: "أكشن / جريمة", rating: "⭐ 8.5" },
  { title: "The Lion King", year: 1994, genre: "أنيميشن", rating: "⭐ 8.5" },
  { title: "Gladiator", year: 2000, genre: "ملحمي", rating: "⭐ 8.5" },
  { title: "American History X", year: 1998, genre: "دراما", rating: "⭐ 8.5" },
  { title: "The Departed", year: 2006, genre: "جريمة", rating: "⭐ 8.5" },
  { title: "Whiplash", year: 2014, genre: "موسيقى / دراما", rating: "⭐ 8.5" },
  { title: "The Prestige", year: 2006, genre: "غموض", rating: "⭐ 8.5" },
  { title: "The Usual Suspects", year: 1995, genre: "غموض / جريمة", rating: "⭐ 8.5" },
  { title: "Casablanca", year: 1942, genre: "رومانسي / دراما", rating: "⭐ 8.5" },
  { title: "Grave of the Fireflies", year: 1988, genre: "أنيميشن", rating: "⭐ 8.5" },
  { title: "Harakiri", year: 1962, genre: "تاريخي", rating: "⭐ 8.6" },
  { title: "Intouchables", year: 2011, genre: "سيرة ذاتية / كوميديا", rating: "⭐ 8.5" },
  { title: "Modern Times", year: 1936, genre: "كوميديا", rating: "⭐ 8.5" },
  { title: "Once Upon a Time in the West", year: 1968, genre: "غرب أمريكي", rating: "⭐ 8.5" },
  { title: "Rear Window", year: 1954, genre: "غموض", rating: "⭐ 8.5" },
  { title: "Alien", year: 1979, genre: "رعب / خيال علمي", rating: "⭐ 8.5" },
  { title: "City Lights", year: 1931, genre: "رومانسي / كوميديا", rating: "⭐ 8.5" },
  { title: "Apocalypse Now", year: 1979, genre: "حربي", rating: "⭐ 8.4" },
  { title: "Memento", year: 2000, genre: "غموض / إثارة", rating: "⭐ 8.4" },
  { title: "Django Unchained", year: 2012, genre: "غرب أمريكي / إثارة", rating: "⭐ 8.5" },
  { title: "WALL-E", year: 2008, genre: "أنيميشن", rating: "⭐ 8.4" },
  { title: "The Lives of Others", year: 2006, genre: "دراما", rating: "⭐ 8.4" },
  { title: "Sunset Boulevard", year: 1950, genre: "دراما", rating: "⭐ 8.4" },
  { title: "Paths of Glory", year: 1957, genre: "حربي", rating: "⭐ 8.4" },
  { title: "The Shining", year: 1980, genre: "رعب", rating: "⭐ 8.4" },
  { title: "The Great Dictator", year: 1940, genre: "كوميديا", rating: "⭐ 8.4" },
  { title: "Avengers: Infinity War", year: 2018, genre: "أكشن", rating: "⭐ 8.4" },
  { title: "Witness for the Prosecution", year: 1957, genre: "جريمة / دراما", rating: "⭐ 8.4" },
  { title: "Aliens", year: 1986, genre: "خيال علمي", rating: "⭐ 8.4" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "أنيميشن", rating: "⭐ 8.4" },
  { title: "Dr. Strangelove", year: 1964, genre: "كوميديا", rating: "⭐ 8.4" },
  { title: "The Dark Knight Rises", year: 2012, genre: "أكشن", rating: "⭐ 8.4" },
  { title: "Oldboy", year: 2003, genre: "غموض / إثارة", rating: "⭐ 8.4" },
  { title: "Amadeus", year: 1984, genre: "سيرة ذاتية", rating: "⭐ 8.4" },
  { title: "Inglourious Basterds", year: 2009, genre: "حربي / إثارة", rating: "⭐ 8.4" },
  { title: "Coco", year: 2017, genre: "أنيميشن", rating: "⭐ 8.4" },
  { title: "Joker", year: 2019, genre: "جريمة / دراما", rating: "⭐ 8.4" },
  { title: "Toy Story", year: 1995, genre: "أنيميشن", rating: "⭐ 8.3" },
  { title: "Braveheart", year: 1995, genre: "ملحمي", rating: "⭐ 8.3" },
  { title: "Das Boot", year: 1981, genre: "حربي", rating: "⭐ 8.3" },
  { title: "Avengers: Endgame", year: 2019, genre: "أكشن", rating: "⭐ 8.4" },
  { title: "Princess Mononoke", year: 1997, genre: "أنيميشن", rating: "⭐ 8.4" },
  { title: "Once Upon a Time in America", year: 1984, genre: "جريمة", rating: "⭐ 8.3" },
  { title: "Good Will Hunting", year: 1997, genre: "دراما", rating: "⭐ 8.3" },
  { title: "Your Name.", year: 2016, genre: "أنيميشن", rating: "⭐ 8.4" },
  { title: "3 Idiots", year: 2009, genre: "كوميديا / دراما", rating: "⭐ 8.4" },
  { title: "Singin' in the Rain", year: 1952, genre: "موسيقي", rating: "⭐ 8.3" },
  { title: "Requiem for a Dream", year: 2000, genre: "دراما", rating: "⭐ 8.3" },
  { title: "High and Low", year: 1963, genre: "جريمة", rating: "⭐ 8.4" },
  { title: "Capernaum", year: 2018, genre: "دراما", rating: "⭐ 8.4" },
  { title: "Star Wars: Episode VI - Return of the Jedi", year: 1983, genre: "خيال علمي", rating: "⭐ 8.3" },
  { title: "2001: A Space Odyssey", year: 1968, genre: "خيال علمي", rating: "⭐ 8.3" },
  { title: "Eternal Sunshine of the Spotless Mind", year: 2004, genre: "رومانسي / خيال", rating: "⭐ 8.3" },
  { title: "Reservoir Dogs", year: 1992, genre: "جريمة", rating: "⭐ 8.3" },
  { title: "The Hunt", year: 2012, genre: "دراما", rating: "⭐ 8.3" },
  { title: "Citizen Kane", year: 1941, genre: "دراما", rating: "⭐ 8.3" },
  { title: "Lawrence of Arabia", year: 1962, genre: "تاريخي", rating: "⭐ 8.3" },
  { title: "M", year: 1931, genre: "جريمة / غموض", rating: "⭐ 8.3" },
  { title: "North by Northwest", year: 1959, genre: "إثارة", rating: "⭐ 8.3" },
  { title: "Vertigo", year: 1958, genre: "غموض", rating: "⭐ 8.3" },
  { title: "Amélie", year: 2001, genre: "كوميديا / رومانسي", rating: "⭐ 8.3" },
  { title: "A Clockwork Orange", year: 1971, genre: "جريمة / خيال علمي", rating: "⭐ 8.3" },
  { title: "Full Metal Jacket", year: 1987, genre: "حربي", rating: "⭐ 8.3" },
  { title: "Scarface", year: 1983, genre: "جريمة", rating: "⭐ 8.3" },
  { title: "Oppenheimer", year: 2023, genre: "سيرة ذاتية / دراما", rating: "⭐ 8.9" },
  { title: "Dune: Part Two", year: 2024, genre: "خيال علمي / مغامرة", rating: "⭐ 8.6" }
];

function generateRandomMovie() {
  const randomMovie = moviesList[Math.floor(Math.random() * moviesList.length)];
  document.getElementById('movie-title').innerText = `${randomMovie.title} (${randomMovie.year})`;
  document.getElementById('movie-genre').innerText = `التصنيف: ${randomMovie.genre}`;
  document.getElementById('movie-rating').innerText = `تقييم IMDb الحقيقي: ${randomMovie.rating} / 10`;
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

// 7. الشات المباشر والغرفة السرية
function openSailorModal() {
  const newLocation = prompt("⚓ وضع البحر: أدخل اسم البحر أو الميناء المتواجد به:");
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
    const msgDiv = document.createElement
