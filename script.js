const token = localStorage.getItem("token");
const isLoggedIn = !!token;


// DOM refs
let add_task_btn = document.querySelector(".add-task-btn");
const input = document.querySelector(".task-input");
let container = document.querySelector(".container");

// helper for auth headers
function authHeaders(extra = {}) {
    return {
        ...extra,
        Authorization: `Bearer ${token}`
    };
}

// ADD TASK
function addTask() {
    if (!isLoggedIn) {
        alert("Please login to add tasks");
        return;
    }

    if (input.value.trim() === "") {
        alert("Your task is empty");
        return;
    }

    fetch("http://localhost:3000/tasks", {
        method: "POST",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({ text: input.value })
    })
    .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
    })
    .then(newTask => {
        const taskElement = createTaskElement(newTask);
        container.appendChild(taskElement);
        input.value = "";
    })
    .catch(err => console.error(err));
}

// DELETE TASK
container.addEventListener("click", function (e) {
    const deleteBtn = e.target.closest(".delete-btn");
    if (!deleteBtn) return;

    if (!isLoggedIn) return;

    const taskBox = deleteBtn.closest(".task-box");
    const taskId = taskBox.dataset.id;

    fetch(`http://localhost:3000/tasks/${taskId}`, {
        method: "DELETE",
        headers: authHeaders()
    }).then(res => {
        if (res.ok) taskBox.remove();
    });
});

// CREATE TASK ELEMENT
function createTaskElement(taskData) {
    const task_box = document.createElement("div");
    task_box.dataset.id = taskData._id;
    task_box.classList.add("task-box");

    const task = document.createElement("div");
    task.classList.add("task");

    const complete_button = document.createElement("div");
    complete_button.classList.add("complete-button");

    const task_text = document.createElement("div");
    task_text.classList.add("task-text");

    const p = document.createElement("p");
    p.textContent = taskData.text;

    if (taskData.completed) {
        p.style.textDecoration = "line-through";
        complete_button.textContent = "✓";
    }

    const delete_btn = document.createElement("div");
    delete_btn.classList.add("delete-btn");

    const icon = document.createElement("i");
    icon.classList.add("fa-solid", "fa-trash");

    delete_btn.appendChild(icon);
    task_text.appendChild(p);
    task.appendChild(complete_button);
    task.appendChild(task_text);
    task_box.appendChild(task);
    task_box.appendChild(delete_btn);

    return task_box;
}

// LOAD TASKS (only if logged in)
if (isLoggedIn) {
    fetch("http://localhost:3000/tasks", {
        headers: authHeaders()
    })
    .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
    })
    .then(tasks => {
        container.innerHTML = "";
        tasks.forEach(task => {
            container.appendChild(createTaskElement(task));
        });
    })
    .catch(err => console.error(err));
}

// BUTTON EVENTS
add_task_btn.addEventListener("click", addTask);

input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask();
});

// COMPLETE TASK
container.addEventListener("click", async function (e) {
    if (!e.target.classList.contains("complete-button")) return;
    if (!isLoggedIn) return;

    const taskBox = e.target.closest(".task-box");
    const taskId = taskBox.dataset.id;
    const p = taskBox.querySelector(".task-text p");

    const isCompleted = p.style.textDecoration === "line-through";
    const newState = !isCompleted;

    const res = await fetch(`http://localhost:3000/tasks/${taskId}`, {
        method: "PATCH",
        headers: authHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({ completed: newState })
    });

    if (!res.ok) return;

    p.style.textDecoration = newState ? "line-through" : "none";
    e.target.textContent = newState ? "✓" : "";
});

// for login/signup
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
//const authDiv = document.getElementById("auth");
const userBar = document.getElementById("userBar");
const userEmailSpan = document.getElementById("userEmail");
const openAuthBtn = document.getElementById("openAuthBtn");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");

openAuthBtn.onclick = () => {
    authModal.style.display = "flex";
};

closeAuth.onclick = () => {
    authModal.style.display = "none";
};



if (isLoggedIn) {
    openAuthBtn.style.display = "none";
    userBar.style.display = "block";
    userEmailSpan.textContent = `Hello, ${localStorage.getItem("username")} `;
} else {
    openAuthBtn.style.display = "block";
    userBar.style.display = "none";
}


function setLoggedIn(user) {
    localStorage.setItem("token", user.token);
    localStorage.setItem("username", user.user.username);
    authModal.style.display = "none";
    location.reload();
}

loginBtn.onclick = async () => {
    const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value
        })
});

    if (!res.ok) {
        alert("Login failed");
        return;
    }

    const data = await res.json();
    setLoggedIn(data);
};

signupBtn.onclick = async () => {
    const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value
        })
    });

    if (!res.ok) {
        alert("Signup failed");
        return;
    }

    alert("Signup successful. Now login.");
};

logoutBtn.onclick = () => {
    localStorage.clear();
    location.reload();
};
