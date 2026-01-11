/* =======================
   CONFIG
======================= */
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://YOUR-BACKEND.onrender.com"; // <-- change later

/* =======================
   AUTH STATE
======================= */
const token = localStorage.getItem("token");
const isLoggedIn = !!token;

/* =======================
   DOM REFS
======================= */
const add_task_btn = document.querySelector(".add-task-btn");
const input = document.querySelector(".task-input");
const container = document.querySelector(".container");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userBar = document.getElementById("userBar");
const userEmailSpan = document.getElementById("userEmail");
const openAuthBtn = document.getElementById("openAuthBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

/* =======================
   HELPERS
======================= */
function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${token}`
  };
}

/* =======================
   AUTH UI
======================= */
openAuthBtn.onclick = () => (authModal.style.display = "flex");
closeAuth.onclick = () => (authModal.style.display = "none");

if (isLoggedIn) {
  openAuthBtn.style.display = "none";
  userBar.style.display = "block";
  userEmailSpan.textContent = `Hello, ${localStorage.getItem("username")}`;
} else {
  openAuthBtn.style.display = "block";
  userBar.style.display = "none";
}

/* =======================
   TASK ACTIONS
======================= */
function addTask() {
  if (!isLoggedIn) return alert("Please login to add tasks");
  if (!input.value.trim()) return alert("Your task is empty");

  fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text: input.value })
  })
    .then(res => res.json())
    .then(task => {
      container.appendChild(createTaskElement(task));
      input.value = "";
    })
    .catch(console.error);
}

function createTaskElement(taskData) {
  const taskBox = document.createElement("div");
  taskBox.className = "task-box";
  taskBox.dataset.id = taskData._id;

  taskBox.innerHTML = `
    <div class="task">
      <div class="complete-button">${taskData.completed ? "✓" : ""}</div>
      <div class="task-text">
        <p style="text-decoration:${taskData.completed ? "line-through" : "none"}">
          ${taskData.text}
        </p>
      </div>
    </div>
    <div class="delete-btn">
      <i class="fa-solid fa-trash"></i>
    </div>
  `;

  return taskBox;
}

/* =======================
   LOAD TASKS
======================= */
if (isLoggedIn) {
  fetch(`${API_BASE}/tasks`, { headers: authHeaders() })
    .then(res => res.json())
    .then(tasks => {
      container.innerHTML = "";
      tasks.forEach(t => container.appendChild(createTaskElement(t)));
    })
    .catch(console.error);
}

/* =======================
   TASK EVENTS
======================= */
add_task_btn.addEventListener("click", addTask);
input.addEventListener("keydown", e => e.key === "Enter" && addTask());

container.addEventListener("click", async e => {
  const taskBox = e.target.closest(".task-box");
  if (!taskBox || !isLoggedIn) return;

  const taskId = taskBox.dataset.id;

  // DELETE
  if (e.target.closest(".delete-btn")) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (res.ok) taskBox.remove();
  }

  // COMPLETE
  if (e.target.classList.contains("complete-button")) {
    const p = taskBox.querySelector("p");
    const completed = p.style.textDecoration !== "line-through";

    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ completed })
    });

    if (res.ok) {
      p.style.textDecoration = completed ? "line-through" : "none";
      e.target.textContent = completed ? "✓" : "";
    }
  }
});

/* =======================
   AUTH ACTIONS
======================= */
function setLoggedIn(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.user.username);
  location.reload();
}

loginBtn.onclick = async () => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameInput.value,
      password: passwordInput.value
    })
  });

  if (!res.ok) return alert("Login failed");
  setLoggedIn(await res.json());
};

signupBtn.onclick = async () => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameInput.value,
      password: passwordInput.value
    })
  });

  if (!res.ok) return alert("Signup failed");
  alert("Signup successful. Please login.");
};

logoutBtn.onclick = () => {
  localStorage.clear();
  location.reload();
};
