<template>
  <div class="user-list-container">
    <h1 class="heading-text">Användarlista</h1>

    <input
      v-model="search"
      type="text"
      placeholder="Sök efter namn eller kod (t.ex. FF10)"
      class="search-input"
    />

    <p v-if="loading">Laddar användare...</p>

    <table v-else class="user-table">
      <thead>
        <tr>
          <th>Kod</th>
          <th>Namn</th>
          <th>Kommentar</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in filteredUsers"
          :key="user._id"
          @click="openUserModal(user)"
          class="cursor-pointer hover:bg-gray-100"
        >
          <td>{{ user.code }}</td>
          <td>{{ user.name || "-" }}</td>
          <td>
            <div class="comment-scroll">
              {{ user.comment || "-" }}
            </div>
          </td>
          <td>
            <span class="status-wrapper">
              <span
                class="status-dot"
                :class="
                  user.active ? 'status-dot-active' : 'status-dot-inactive'
                "
              ></span>
              {{ user.active ? "Aktiv" : "Inaktiv" }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="filteredUsers.length === 0 && !loading">
      Inga användare hittades.
    </p>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Användare: {{ modalUser.code }}</h2>

        <label>
          Namn:
          <input v-model="modalUser.name" type="text" />
        </label>

        <label>
          Kommentar:
          <textarea v-model="modalUser.comment"></textarea>
        </label>

        <label>
          Nytt lösenord:
          <input
            v-model="newPassword"
            type="password"
            placeholder="Lämna tomt om inget ändras"
          />
        </label>

        <div class="modal-buttons">
          <button @click="updateUser">Spara</button>
          <button @click="deleteUser(modalUser)">Ta Bort</button>
          <button @click="toggleUserStatus(true)" :disabled="modalUser.active">
            Aktivera
          </button>
          <button
            @click="toggleUserStatus(false)"
            :disabled="!modalUser.active"
          >
            Inaktivera
          </button>
          <button @click="closeModal">Stäng</button>
        </div>

        <p v-if="modalMessage">{{ modalMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

interface User {
  _id: string;
  code: string;
  name?: string;
  comment?: string;
  active?: boolean;
}

interface TokenPayload {
  id: string;
  code: string;
  role?: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const search = ref("");
const router = useRouter();
const token = ref("");

const showModal = ref(false);
const modalUser = ref<User>({ _id: "", code: "" });
const newPassword = ref("");
const modalMessage = ref("");

onMounted(async () => {
  token.value = localStorage.getItem("token") || "";
  if (!token.value) router.push("/");

  try {
    const decoded = jwtDecode<TokenPayload>(token.value);
    if (decoded.code !== "FF01" && decoded.role !== "admin")
      router.push("/dashboard");
  } catch {
    localStorage.removeItem("token");
    router.push("/");
  }

  await fetchUsers();
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await fetch("/api/admin/list-users", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (res.ok) users.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  const s = search.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.code.toLowerCase().includes(s) ||
      (u.name && u.name.toLowerCase().includes(s))
  );
});

const openUserModal = (user: User) => {
  modalUser.value = { ...user };
  newPassword.value = "";
  modalMessage.value = "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const updateUser = async () => {
  try {
    const res = await fetch(`/api/admin/update-user/${modalUser.value._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        name: modalUser.value.name,
        comment: modalUser.value.comment,
        password: newPassword.value || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const idx = users.value.findIndex((u) => u._id === modalUser.value._id);
      if (idx !== -1) users.value[idx] = { ...modalUser.value };
      closeModal();
    } else {
      modalMessage.value = data.message || "Kunde inte uppdatera användare";
    }
  } catch {
    modalMessage.value = "Fel vid anslutning till server";
  }
};

const deleteUser = async (user: User) => {
  if (!confirm(`Är du säker på att du vill radera ${user.code}?`)) return;

  try {
    const res = await fetch(`/api/admin/delete-user/${user._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (res.ok) {
      users.value = users.value.filter((u) => u._id !== user._id);
      closeModal();
    } else {
      alert(data.message || "Radering misslyckades");
    }
  } catch {
    alert("Fel vid anslutning till server");
  }
};

const toggleUserStatus = async (status: boolean) => {
  try {
    const res = await fetch(
      `/api/admin/toggle-user-status/${modalUser.value._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({ active: status }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      modalUser.value.active = status;
      const idx = users.value.findIndex((u) => u._id === modalUser.value._id);
      if (idx !== -1) users.value[idx].active = status;
      modalMessage.value = `Användaren är nu ${status ? "aktiv" : "inaktiv"}`;
    } else {
      modalMessage.value = data.message || "Kunde inte ändra status";
    }
  } catch {
    modalMessage.value = "Fel vid anslutning till server";
  }
};
</script>

<style scoped>
.user-list-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.heading-text {
  color: white;
  margin-bottom: 16px;
}

/* Sökfält */
.search-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Tabell */
.user-table {
  width: 100%;
  border-collapse: collapse;
  box-sizing: border-box;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  color: #ccc;
  padding: 8px;
  box-sizing: border-box;
}

.user-table th {
  background-color: #ecb336;
  color: black;
}

.user-table tr:hover {
  background-color: #555454;
  cursor: pointer;
}

.comment-scroll {
  max-width: 600px;
  max-height: 60px;
  overflow-y: auto;
  word-break: break-word;
  white-space: pre-wrap;
  padding: 4px;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Statusindikatorer */
.status-dot-active,
.status-dot-inactive {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.status-dot-active {
  background: green;
}

.status-dot-inactive {
  background: red;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
}

/* Formfält i modal */
.modal-content label {
  display: block;
  margin-bottom: 10px;
}

.modal-content input {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.modal-content textarea {
  width: 100%;
  height: 120px;
  padding: 6px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  resize: none;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.modal-buttons button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.comment-scroll::-webkit-scrollbar,
.modal-content textarea::-webkit-scrollbar {
  width: 6px;
}

.comment-scroll::-webkit-scrollbar-thumb,
.modal-content textarea::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.comment-scroll::-webkit-scrollbar-track,
.modal-content textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
}

@media (max-width: 480px) {
  .modal-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .modal-buttons button {
    width: 100%;
  }
}
</style>
