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
  token.value = localStorage.getItem("token") || "";
  if (!token.value) {
    message.value = "Not logged in, redirecting...";
    messageType.value = "error";
    setTimeout(() => router.push("/"), 1500);
    return;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token.value);

    if (decoded.code === "FF01" || decoded.role === "admin") {
      router.push("/admin");
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
  background-color: #f3f3f3;
}

.dashboard-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

h1 {
  color: #136d38;
  font-size: 2rem;
  margin-bottom: 20px;
}

.description {
  color: #333;
  margin-bottom: 24px;
  font-size: 1rem;
}

.button {
  width: 100%;
  padding: 12px;
  background-color: #136d38;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover:not(:disabled) {
  background-color: #0f552b;
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
