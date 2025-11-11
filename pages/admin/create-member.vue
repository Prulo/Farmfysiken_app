<template>
  <div class="container">
    <h1>Create Member</h1>

    <div class="form">
      <input v-model="newCode" placeholder="Member Code (FF10+)" />
      <input v-model="newPin" type="password" placeholder="4-digit PIN" />
      <input v-model="newName" placeholder="Full Name (optional)" />
      <button @click="createMember">
        {{ creating ? "Creating..." : "Create" }}
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

const token = localStorage.getItem("token") || "";

const createMember = async () => {
  creating.value = true;
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
        name: newName.value,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      createMessage.value = "Member created successfully!";
      createMessageType.value = "success";
      newCode.value = "";
      newPin.value = "";
      newName.value = "";
    } else {
      createMessage.value = data.message;
      createMessageType.value = "error";
    }
  } catch {
    createMessage.value = "Server error";
    createMessageType.value = "error";
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  background: #007a33;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background: #005a26;
}
.success {
  color: green;
}
.error {
  color: red;
}
</style>
