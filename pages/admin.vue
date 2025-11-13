<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1 class="title">Farmfysiken Admin Panel</h1>

      <button class="hamburger-btn" @click="menuOpen = !menuOpen">☰</button>

      <nav :class="['nav-links', menuOpen ? 'open' : '']">
        <RouterLink to="/admin/create-member">Create Member</RouterLink>
        <RouterLink to="/admin/checkins">Check-ins</RouterLink>
        <RouterLink to="/admin/users">User list</RouterLink>
        <button @click="logout" class="logout-btn">Logout</button>
      </nav>
    </header>

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  code: string;
  role?: string;
}

const router = useRouter();
const menuOpen = ref(false);

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
  background: #000000;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

/* Hamburger-knapp */
.hamburger-btn {
  display: none; /* dold som default på stora skärmar */
  background: none;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
}

.logout-btn {
  background: #ecb336;
}

/* Navigationslänkar */
.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.admin-main {
  padding: 2rem;
}

/* Responsiv: under 768px (t.ex. iPad i stående) */
@media (max-width: 768px) {
  .hamburger-btn {
    display: block;
  }

  .nav-links {
    flex-direction: column;
    position: absolute;
    top: 100%;
    right: 0;
    background: #2f855a;
    width: 200px;
    display: none;
    padding: 1rem;
    border-radius: 0 0 8px 8px;
  }

  .nav-links.open {
    display: flex;
  }

  .nav-links a,
  .nav-links button {
    margin: 0.5rem 0;
  }
}

.admin-container {
  background-color: #292b2e;
  min-height: 100vh;
}
</style>
