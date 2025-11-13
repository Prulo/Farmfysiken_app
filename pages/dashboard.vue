<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <h1>Member Dashboard</h1>

      <p class="description">
        Welcome! Use the button below to check in at the gym.
      </p>

      <button @click="checkIn" :disabled="loading" class="button">
        {{ loading ? "Checking In..." : "Check In" }}
      </button>

      <p v-if="message" :class="['message', messageType]">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  code: string;
  role?: string;
}

const message = ref("");
const messageType = ref<"success" | "error">("success");
const token = ref("");
const loading = ref(false);
const router = useRouter();

onMounted(() => {
  const token = localStorage.getItem("token") || "";
  if (!token) {
    router.push("/");
    return;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);

    if (decoded.code === "FF01" || decoded.role === "admin") {
      // Admins go directly to check-ins
      router.push("/admin/checkins");
    }
  } catch (err) {
    console.error("Invalid token", err);
    localStorage.removeItem("token");
    router.push("/");
  }
});

const checkIn = async () => {
  if (!token.value) {
    message.value = "Not logged in";
    messageType.value = "error";
    return;
  }

  message.value = "";
  loading.value = true;

  try {
    const res = await fetch("/api/checkin/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      message.value = "Checked in successfully!";
      messageType.value = "success";

      setTimeout(() => {
        localStorage.removeItem("token");
        router.push("/");
      }, 3000);
    } else {
      message.value = data.message || "Check-in failed";
      messageType.value = "error";
    }
  } catch (err) {
    console.error(err);
    message.value = "Error connecting to server";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;

  /* Bakgrundsbild */
  background-image: url("../public/Tireflip\ svart\ väldigt\ stor@2x.png"); /* Lägg bilden i public/ */
  background-size: contain; /* täcker hela skärmen */
  background-position: center; /* centrerad */
  background-repeat: no-repeat;

  position: relative;
}

/* Overlay för kontrast */
.dashboard-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.dashboard-box {
  position: relative;
  z-index: 1;
  background: rgba(41, 43, 46, 0.85); /* semi-transparent */
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

h1 {
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 20px;
}

.description {
  color: #ffffff;
  margin-bottom: 24px;
  font-size: 1rem;
}

.button {
  width: 100%;
  padding: 12px;
  background-color: #ecb336;
  color: black;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover:not(:disabled) {
  background-color: #d76c0f;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 20px;
  font-weight: 500;
}

.message.success {
  color: #136d38;
}

.message.error {
  color: red;
}
</style>
