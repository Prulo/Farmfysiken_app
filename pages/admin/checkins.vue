<template>
  <div class="admin-container">
    <!-- Summary -->
    <section class="summary">
      <div class="summary-card">
        <h3>Today</h3>
        <p>{{ totals.today }}</p>
      </div>
      <div class="summary-card">
        <h3>This Week</h3>
        <p>{{ totals.week }}</p>
      </div>
      <div class="summary-card">
        <h3>This Month</h3>
        <p>{{ totals.month }}</p>
      </div>
      <div class="summary-card">
        <h3>All Time</h3>
        <p>{{ totals.all }}</p>
      </div>
    </section>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-buttons">
        <button
          v-for="range in ranges"
          :key="range"
          :class="{ active: filterRange === range }"
          @click="filterRange = range"
        >
          {{ range.charAt(0).toUpperCase() + range.slice(1) }}
        </button>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search member code (e.g. FF10)"
      />
    </div>

    <!-- Checkins Table -->
    <section class="checkins">
      <div
        v-for="(group, date) in filteredGroupedCheckins"
        :key="date"
        class="checkin-group"
      >
        <button @click="toggleGroup(date)" class="group-toggle">
          {{ date }} ({{ group.length }} check-ins)
        </button>

        <div v-show="openGroups.includes(date)" class="checkin-table">
          <table>
            <thead>
              <tr>
                <th>Member Code</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="checkin in group" :key="checkin._id">
                <td>{{ checkin.userId.code }}</td>
                <td>{{ new Date(checkin.timestamp).toLocaleTimeString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="message" class="error-message">{{ message }}</p>
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

const router = useRouter();
const token = ref("");
const checkins = ref<Checkin[]>([]);
const message = ref("");
const openGroups = ref<string[]>([]);
const filterRange = ref<"day" | "week" | "month" | "all">("all");
const ranges: ("day" | "week" | "month" | "all")[] = [
  "day",
  "week",
  "month",
  "all",
];
const searchQuery = ref("");

// ✅ Totals
const totals = computed(() => {
  const now = new Date();
  let today = 0,
    week = 0,
    month = 0,
    all = checkins.value.length;

  checkins.value.forEach((c) => {
    const date = new Date(c.timestamp);
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (date.toDateString() === now.toDateString()) today++;
    if (diffDays <= 7) week++;
    if (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
      month++;
  });

  return { today, week, month, all };
});

// --- Auth check ---
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

const fetchCheckins = async () => {
  try {
    const res = await fetch("/api/checkin/list", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (res.ok) {
      checkins.value = data.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else {
      message.value = data.message || "Failed to fetch check-ins";
    }
  } catch {
    message.value = "Error connecting to server";
  }
};

// --- Group and Filter Logic ---
const groupedCheckins = computed(() => {
  const groups: Record<string, Checkin[]> = {};
  checkins.value.forEach((c) => {
    const date = new Date(c.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(c);
  });
  return groups;
});

const filteredGroupedCheckins = computed(() => {
  const now = new Date();
  const filtered = Object.entries(groupedCheckins.value).reduce(
    (acc, [date, items]) => {
      const groupDate = new Date(date);
      let include = true;

      if (filterRange.value === "day") {
        include = groupDate.toDateString() === now.toDateString();
      } else if (filterRange.value === "week") {
        const diff =
          (now.getTime() - groupDate.getTime()) / (1000 * 60 * 60 * 24);
        include = diff <= 7;
      } else if (filterRange.value === "month") {
        include =
          groupDate.getMonth() === now.getMonth() &&
          groupDate.getFullYear() === now.getFullYear();
      }

      const filteredItems = items.filter((i) =>
        i.userId.code.toLowerCase().includes(searchQuery.value.toLowerCase())
      );

      if (include && filteredItems.length > 0) {
        acc[date] = filteredItems;
      }

      return acc;
    },
    {} as Record<string, Checkin[]>
  );

  return filtered;
});

const toggleGroup = (date: string) => {
  if (openGroups.value.includes(date)) {
    openGroups.value = openGroups.value.filter((d) => d !== date);
  } else {
    openGroups.value.push(date);
  }
};

const logout = () => {
  localStorage.removeItem("token");
  router.push("/");
};
</script>

<style scoped>
.admin-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px;
  font-family: Arial, sans-serif;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 30px;
  padding-bottom: 10px;
}

.admin-header h1 {
  font-size: 28px;
  color: #006837;
}

.admin-header nav a,
.admin-header nav button {
  margin-left: 15px;
  text-decoration: none;
  color: #006837;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
}

.logout-btn {
  color: #b30000 !important;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  background: #f5fdf8;
  border: 1px solid #cfe7d6;
  border-radius: 8px;
  text-align: center;
  padding: 15px;
}

.summary-card h3 {
  color: #555;
  font-size: 14px;
  margin-bottom: 8px;
}

.summary-card p {
  color: #006837;
  font-size: 24px;
  font-weight: bold;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 25px;
  gap: 10px;
}

.filter-buttons button {
  background: #59aa59;
  border: none;
  border-radius: 5px;
  padding: 8px 15px;
  cursor: pointer;
}

.filter-buttons button.active {
  background: #006837;
  color: white;
}

.filters input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.checkin-group {
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.group-toggle {
  width: 100%;
  text-align: left;
  background: #52b44f;
  padding: 10px;
  font-weight: bold;
  border: none;
  border-bottom: 1px solid #ccc;
  cursor: pointer;
}

.checkin-table table {
  width: 100%;
  border-collapse: collapse;
}

.checkin-table th,
.checkin-table td {
  border: 1px solid #ccc;
  padding: 6px 10px;
  text-align: left;
}

.checkin-table tr:nth-child(even) {
  background: #fafafa;
}

.error-message {
  color: #b30000;
  margin-top: 15px;
}
</style>
