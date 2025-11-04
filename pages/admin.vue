<template>
  <div class="p-10 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-4">Admin Panel</h1>
    <table class="border-collapse border w-full">
      <thead>
        <tr class="border-b">
          <th class="border px-2 py-1">User</th>
          <th class="border px-2 py-1">Email</th>
          <th class="border px-2 py-1">Check-in Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="checkin in checkins" :key="checkin._id" class="border-b">
          <td class="border px-2 py-1">{{ checkin.userId.name }}</td>
          <td class="border px-2 py-1">{{ checkin.userId.email }}</td>
          <td class="border px-2 py-1">
            {{ new Date(checkin.timestamp).toLocaleString() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const checkins = ref<any[]>([]);

const fetchCheckins = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/checkin/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      checkins.value = data;
    } else {
      console.error(data.message || "Failed to fetch check-ins");
    }
  } catch (err) {
    console.error("Error fetching check-ins", err);
  }
};

onMounted(() => {
  fetchCheckins();
});
</script>
