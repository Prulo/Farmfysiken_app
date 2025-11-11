<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1 class="title">Farmfysiken Admin Panel</h1>
      <nav class="nav-links">
        <RouterLink to="/admin/create-member">Create Member</RouterLink>
        <RouterLink to="/admin/checkins">Check-ins</RouterLink>
        <RouterLink to="/admin/users">User list</RouterLink>
        <button @click="logout" class="text-red-600 font-semibold">
          Logout
        </button>
      </nav>
    </header>

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  code: string;
  role?: string;
}

const router = useRouter();

onMounted(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/");
    return;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.code !== "FF01" && decoded.role !== "admin") {
      router.push("/dashboard");
    }
  } catch {
    localStorage.removeItem("token");
    router.push("/");
  }
});

const logout = () => {
  localStorage.removeItem("token");
  router.push("/");
};
</script>

<style scoped>
.admin-header {
  background: #2f855a;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-links a {
  margin: 0 10px;
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a.router-link-active {
  text-decoration: underline;
}

.admin-main {
  padding: 2rem;
}
</style>
