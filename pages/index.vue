<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Farmfysiken Login</h1>

      <div class="login-form">
        <h2>Member Login</h2>

        <input v-model="loginCode" placeholder="Användarnamn" class="input" />
        <input
          v-model="loginPin"
          type="password"
          placeholder="PIN"
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

    const user_data = await res.json();

    if (res.ok) {
      console.log("inne i ress", user_data);
      localStorage.setItem("token", user_data.token);
      // lagra ingen viktig info
      router.push("/dashboard");
    } else {
      message.value = user_data.message || "Login failed";
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
  background-image: url("../public/Tireflip\ svart\ väldigt\ stor@2x.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;

  position: relative;
}

.login-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.login-box {
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

h2 {
  font-size: 1.25rem;
  color: #ffffff;
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
  background-color: #ecb336;
  color: black;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #d76c0f;
}

.message {
  margin-top: 20px;
  color: red;
  font-weight: 500;
}
</style>
