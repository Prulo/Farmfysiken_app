<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Farmfysiken Login</h1>

      <div class="login-form">
        <h2>Member Login</h2>

        <input
          v-model="loginCode"
          placeholder="Code (FF01, FF10+)"
          class="input"
        />
        <input
          v-model="loginPin"
          type="password"
          placeholder="4-digit PIN"
          class="input"
        />
        <button @click="login" class="button">Login</button>
      </div>

      <p v-if="message" class="message">
        {{ message }}
      </p>
    </div>
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

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f3f3;
}

.login-box {
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

h2 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 20px;
}

.input {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #136d38;
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

.button:hover {
  background-color: #0f552b;
}

.message {
  margin-top: 20px;
  color: red;
  font-weight: 500;
}
</style>
