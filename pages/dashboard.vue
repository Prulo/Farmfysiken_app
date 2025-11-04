<template>
  <div class="p-10 max-w-md mx-auto text-center">
    <h1 class="text-3xl font-bold mb-6">Member Dashboard</h1>

    <p class="mb-4">Welcome! Use the button below to check in at the gym.</p>

    <button
      @click="checkIn"
      :disabled="loading"
      class="bg-green-600 text-white px-4 py-2 rounded"
    >
      {{ loading ? "Checking In..." : "Check In" }}
    </button>

    <p
      v-if="message"
      :class="
        messageType === 'success' ? 'mt-4 text-green-700' : 'mt-4 text-red-600'
      "
    >
      {{ message }}
    </p>
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

// Get token from localStorage when dashboard loads
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

    // Redirect admins to admin page
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

      // Wait 3 seconds before logging out
      setTimeout(() => {
        localStorage.removeItem("token"); // remove token
        router.push("/"); // redirect to login page
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
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
