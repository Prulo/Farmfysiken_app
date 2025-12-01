<template>
  <div class="container">
    <h1 class="heading-text">Skapa Användare</h1>

    <div class="form">
      <input v-model="newCode" placeholder="Användar kod" />
      <input v-model="newPin" type="password" placeholder="PIN" />
      <input v-model="newName" placeholder="Namn" />
      <button @click="createMember">
        {{ creating ? "Skapar..." : "Skapa" }}
      </button>
    </div>

    <p v-if="createMessage" :class="createMessageType">{{ createMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const newCode = ref("");
const newPin = ref("");
const newName = ref("");
const creating = ref(false);
const createMessage = ref("");
const createMessageType = ref("success");

const createMember = async () => {
  creating.value = true;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  if (!token) {
    createMessage.value = "You are not authenticated";
    createMessageType.value = "error";
    creating.value = false;
    return;
  }

  try {
    const res = await fetch("/api/admin/create-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: newCode.value,
        pin: newPin.value,
        name: newName.value || undefined,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      createMessage.value = "Member created successfully!";
      createMessageType.value = "success";
      newCode.value = "";
      newPin.value = "";
      newName.value = "";
    } else {
      createMessage.value = data.message || "Error creating member";
      createMessageType.value = "error";
    }
  } catch (err) {
    console.error(err);
    createMessage.value = "Server error";
    createMessageType.value = "error";
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.heading-text {
  color: white;
}
.container {
  max-width: 600px;
  margin: 40px auto;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form input,
.form button {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  background: #ecb336;
  color: rgb(0, 0, 0);
  border: none;
  cursor: pointer;
}

button:hover {
  background: #d76c0f;
}

.success {
  color: #d76c0f;
}
.error {
  color: red;
}
</style>
