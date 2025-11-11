<template>
  <div class="user-list-container">
    <h1>Användarlista</h1>

    <!-- Search -->
    <input
      v-model="search"
      type="text"
      placeholder="Sök efter namn eller kod (t.ex. FF10)"
      class="search-input"
    />

    <!-- Loading -->
    <p v-if="loading">Laddar användare...</p>

    <!-- Table -->
    <table v-else class="user-table">
      <thead>
        <tr>
          <th>Kod</th>
          <th>Namn</th>
          <th>Kommentar</th>
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
          <td>{{ user.comment || "-" }}</td>
        </tr>
      </tbody>
    </table>

    <p v-if="filteredUsers.length === 0 && !loading">
      Inga användare hittades.
    </p>

    <!-- Modal -->
    <div v-if="selectedUser" class="modal-overlay">
      <div class="modal-content">
        <h2>Användare: {{ selectedUser.code }}</h2>

        <label>
          Namn:
          <input v-model="selectedUser.name" type="text" />
        </label>

        <label>
          Kommentar:
          <textarea v-model="selectedUser.comment"></textarea>
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
          <button @click="closeModal">Avbryt</button>
        </div>
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

// Modal state
const selectedUser = ref<User | null>(null);
const newPassword = ref("");

// --- Auth & fetch users ---
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

// --- Modal functions ---
const openUserModal = (user: User) => {
  selectedUser.value = { ...user }; // kopiera för att inte direkt ändra listan
  newPassword.value = "";
};

const closeModal = () => {
  selectedUser.value = null;
  newPassword.value = "";
};

const updateUser = async () => {
  if (!selectedUser.value) return;

  try {
    const res = await fetch(
      `/api/admin/update-user/${selectedUser.value._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({
          name: selectedUser.value.name,
          comment: selectedUser.value.comment,
          password: newPassword.value || undefined,
        }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      // uppdatera listan lokalt
      const idx = users.value.findIndex(
        (u) => u._id === selectedUser.value?._id
      );
      if (idx !== -1) users.value[idx] = { ...selectedUser.value! };
      closeModal();
    } else {
      alert(data.message || "Kunde inte uppdatera användare");
    }
  } catch (err) {
    console.error(err);
    alert("Fel vid anslutning till server");
  }
};
</script>

<style scoped>
.user-list-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.search-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
}
.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 8px;
}
.user-table th {
  background-color: #f4f4f4;
}
.user-table tr:hover {
  background-color: #f9f9f9;
  cursor: pointer;
}

/* Modal */
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
  width: 400px;
}
.modal-content label {
  display: block;
  margin-bottom: 10px;
}
.modal-content input,
.modal-content textarea {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.modal-buttons button {
  padding: 6px 12px;
}
</style>
