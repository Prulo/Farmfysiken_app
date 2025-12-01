<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <h1>Inloggningsskärm</h1>

      <p class="description">Välkommen {{ user_name }}</p>

      <button @click="checkIn" :disabled="loading || checkedIn" class="button">
        {{ loading ? "Checkar in..." : checkedIn ? "Inloggad" : "Checka In" }}
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
  name: string;
  role?: string;
}

const message = ref("");
const messageType = ref<"success" | "error">("success");
const user_token = ref("");
const user_name = ref("");
const decoded = ref<TokenPayload | null>(null);
const loading = ref(false);
const checkedIn = ref(false);
const router = useRouter();

onMounted(() => {
  user_token.value = localStorage.getItem("token") || "";
  user_name.value = localStorage.getItem("name") || "";

  if (!user_token.value) {
    router.push("/");
    return;
  }

  try {
    decoded.value = jwtDecode<TokenPayload>(user_token.value);

    if (decoded.value.code === "FF01" || decoded.value.role === "admin") {
      router.push("/admin/checkins");
    }
  } catch (err) {
    console.error("Invalid token", err);
    localStorage.removeItem("token");
    router.push("/");
  }
});

const checkIn = async () => {
  if (checkedIn.value || loading.value) return;

  loading.value = true;
  message.value = "";

  try {
    const res = await fetch("/api/checkin/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user_token.value}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      checkedIn.value = true;
      message.value = "Inloggad!";
      messageType.value = "success";

      localStorage.removeItem("token");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } else {
      message.value = data.message || "Check-in misslyckades";
      messageType.value = "error";
    }
  } catch (err) {
    console.error(err);
    message.value = "Serverfel, försök igen";
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
  background-image: url("../public/Tireflip svart väldigt stor@2x.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

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
  background: rgba(41, 43, 46, 0.85);
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
