<template>
  <div class="p-10 max-w-md mx-auto">
    <h1 class="text-3xl font-bold mb-4">Farmfysiken</h1>

    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">Register</h2>
      <input
        v-model="regName"
        placeholder="Name"
        class="border p-2 mb-2 w-full"
      />
      <input
        v-model="regEmail"
        placeholder="Email"
        class="border p-2 mb-2 w-full"
      />
      <input
        v-model="regPassword"
        type="password"
        placeholder="Password"
        class="border p-2 mb-2 w-full"
      />
      <button
        @click="register"
        class="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Register
      </button>
    </div>

    <div>
      <h2 class="text-xl font-semibold mb-2">Login</h2>
      <input
        v-model="loginEmail"
        placeholder="Email"
        class="border p-2 mb-2 w-full"
      />
      <input
        v-model="loginPassword"
        type="password"
        placeholder="Password"
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

const regName = ref("");
const regEmail = ref("");
const regPassword = ref("");
const loginEmail = ref("");
const loginPassword = ref("");
const message = ref("");

const router = useRouter();

const register = async () => {
  message.value = "";
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName.value,
        email: regEmail.value,
        password: regPassword.value,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } else {
      message.value = data.message || "Registration failed";
    }
  } catch (err) {
    message.value = "Error connecting to server";
  }
};

const login = async () => {
  message.value = "";
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } else {
      message.value = data.message || "Login failed";
    }
  } catch (err) {
    message.value = "Error connecting to server";
  }
};
</script>
