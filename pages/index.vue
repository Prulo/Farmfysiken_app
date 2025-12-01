<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Farmfysiken Login</h1>

      <div class="login-form">
        <!-- FF-prefix input -->
        <div class="username-wrapper">
          <span class="prefix">FF</span>
          <input
            v-model="loginNumber"
            placeholder="00"
            class="input username-input"
          />
        </div>

        <input
          v-model="loginPin"
          type="password"
          placeholder="PIN"
          class="input"
        />

        <button @click="login" class="button">Logga in</button>
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

const loginNumber = ref("");
const loginPin = ref("");
const message = ref("");
const router = useRouter();

const login = async () => {
  message.value = "";

  const fullCode = "FF" + loginNumber.value.trim().toUpperCase();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: fullCode,
        pin: loginPin.value,
      }),
    });

    const user_data = await res.json();

    if (res.ok) {
      // Spara token och namn
      localStorage.setItem("token", user_data.token);
      localStorage.setItem("name", user_data.user.name);

      // Kolla om admin
      if (user_data.user.code === "FF01" || user_data.user.role === "admin") {
        router.push("/admin/checkins");
      } else {
        router.push("/dashboard");
      }
    } else {
      message.value = user_data.message || "Login misslyckades";
    }
  } catch (err) {
    console.error(err);
    message.value = "Fel vid anslutning till server";
  }
};
</script>

<style scoped>
.login-container {
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
  box-sizing: border-box;
}

.login-box * {
  box-sizing: border-box;
}

h1 {
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 20px;
}

.input {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: #136d38;
}

.username-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 16px;
}

.prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  color: black;
  font-weight: bold;
  pointer-events: none;
}

.username-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.username-input:focus {
  outline: none;
  border-color: #136d38;
}

/* Button */
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

/* Message */
.message {
  margin-top: 20px;
  font-weight: 500;
  color: red;
}
</style>
