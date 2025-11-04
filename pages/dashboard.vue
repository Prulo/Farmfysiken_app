<template>
  <div class="p-10 text-center">
    <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
    <button @click="checkIn" class="bg-green-600 text-white px-4 py-2 rounded">
      Check In
    </button>
    <p v-if="message" class="mt-2 text-green-700">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const message = ref("");

const checkIn = async () => {
  message.value = "";
  const token = localStorage.getItem("token");
  if (!token) {
    message.value = "Not logged in";
    return;
  }

  try {
    const res = await fetch("/api/checkin/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      message.value = "Checked in successfully!";
    } else {
      message.value = data.message || "Check-in failed";
    }
  } catch (err) {
    message.value = "Error connecting to server";
  }
};
</script>
