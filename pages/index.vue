<template>
  <div class="p-10 max-w-md mx-auto">
    <h1 class="text-3xl font-bold mb-4">Farmfysiken Login</h1>

    <div>
      <h2 class="text-xl font-semibold mb-2">Login</h2>
      <input
        v-model="loginCode"
        placeholder="Code (FF01, FF10+)"
        class="border p-2 mb-2 w-full"
      />
      <input
        v-model="loginPin"
        type="password"
        placeholder="4-digit PIN"
        class="border p-2 mb-2 w-full"
      />
      <button @click="login" class="bg-green-600 text-white px-4 py-2 rounded">
        Login
      </button>
    </div>

    <p v-if="message" class="mt-4 text-red-600">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const loginCode = ref("");
const loginPin = ref("");
const message = ref("");
const router = useRouter();

const login = async () => {
  message.value = "";
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: loginCode.value, pin: loginPin.value }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token); // important
      router.push("/dashboard");
    } else {
      message.value = data.message || "Login failed";
    }
  } catch (err) {
    message.value = "Error connecting to server";
  }
};
</script>
