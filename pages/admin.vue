<template>
  <div class="p-10 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Admin Panel</h1>

    <!-- Create Member -->
    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-2">Add New Member</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          v-model="newCode"
          placeholder="Member Code (FF10+)"
          class="border p-2"
        />
        <input
          v-model="newPin"
          type="password"
          placeholder="4-digit PIN"
          class="border p-2"
        />
        <button
          @click="createMember"
          class="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {{ creating ? "Creating..." : "Create Member" }}
        </button>
      </div>
      <p
        v-if="createMessage"
        :class="
          createMessageType === 'error'
            ? 'text-red-600 mt-2'
            : 'text-green-600 mt-2'
        "
      >
        {{ createMessage }}
      </p>
    </section>

    <!-- Check-ins List -->
    <section>
      <h2 class="text-xl font-semibold mb-4">Member Check-ins</h2>

      <div
        v-for="(group, date) in groupedCheckins"
        :key="date"
        class="mb-4 border rounded"
      >
        <button
          @click="toggleGroup(date)"
          class="w-full text-left px-4 py-2 bg-gray-100 font-medium"
        >
          {{ date }} ({{ group.length }} check-ins)
        </button>

        <div v-show="openGroups.includes(date)" class="px-4 py-2">
          <table class="w-full border-collapse border">
            <thead>
              <tr class="border-b">
                <th class="border px-2 py-1">Member Code</th>
                <th class="border px-2 py-1">Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="checkin in group" :key="checkin._id" class="border-b">
                <td class="border px-2 py-1">{{ checkin.userId.code }}</td>
                <td class="border px-2 py-1">
                  {{ new Date(checkin.timestamp).toLocaleTimeString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="message" class="mt-4 text-red-600">{{ message }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  code: string;
  role?: string;
}

interface Checkin {
  _id: string;
  timestamp: string;
  userId: { code: string };
}

// Router + token
const router = useRouter();
const token = ref("");

// Admin check
onMounted(async () => {
  token.value = localStorage.getItem("token") || "";
  if (!token.value) {
    router.push("/");
    return;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token.value);
    if (decoded.code !== "FF01" && decoded.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  } catch {
    localStorage.removeItem("token");
    router.push("/");
    return;
  }

  await fetchCheckins();
});

// --- CREATE MEMBER ---
const newCode = ref("");
const newPin = ref("");
const creating = ref(false);
const createMessage = ref("");
const createMessageType = ref<"success" | "error">("success");

const createMember = async () => {
  if (!newCode.value || !newPin.value) {
    createMessage.value = "Code and PIN are required";
    createMessageType.value = "error";
    return;
  }

  creating.value = true;
  createMessage.value = "";

  try {
    const res = await fetch("/api/admin/create-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ code: newCode.value, pin: newPin.value }),
    });
    const data = await res.json();
    if (res.ok) {
      createMessage.value = "Member created!";
      createMessageType.value = "success";
      newCode.value = "";
      newPin.value = "";
      await fetchCheckins();
    } else {
      createMessage.value = data.message || "Failed to create member";
      createMessageType.value = "error";
    }
  } catch {
    createMessage.value = "Error connecting to server";
    createMessageType.value = "error";
  } finally {
    creating.value = false;
  }
};

// --- FETCH CHECKINS ---
const checkins = ref<Checkin[]>([]);
const message = ref("");
const openGroups = ref<string[]>([]);

const fetchCheckins = async () => {
  try {
    const res = await fetch("/api/checkin/list", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (res.ok) {
      checkins.value = data.sort(
        (
          a: { timestamp: string | number | Date },
          b: { timestamp: string | number | Date }
        ) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else {
      message.value = data.message || "Failed to fetch check-ins";
    }
  } catch {
    message.value = "Error connecting to server";
  }
};

// --- GROUP CHECKINS BY DATE ---
const groupedCheckins = computed(() => {
  const groups: Record<string, Checkin[]> = {};
  checkins.value.forEach((c) => {
    const date = new Date(c.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(c);
  });
  return groups;
});

const toggleGroup = (date: string) => {
  if (openGroups.value.includes(date)) {
    openGroups.value = openGroups.value.filter((d) => d !== date);
  } else {
    openGroups.value.push(date);
  }
};
</script>

<style scoped>
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
