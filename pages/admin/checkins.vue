<template>
  <div class="admin-container">
    <!-- Totals -->
    <div class="totals">
      <div class="total-box">
        <h3>Today</h3>
        <p>{{ todayCount }}</p>
      </div>
      <div class="total-box">
        <h3>This Month</h3>
        <p>{{ monthCount }}</p>
      </div>
      <div class="total-box">
        <h3>This Year</h3>
        <p>{{ yearCount }}</p>
      </div>
      <div class="total-box">
        <h3>All Time</h3>
        <p>{{ allTimeCount }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-buttons">
        <button
          :class="{ active: filterRange === 'day' }"
          @click="filterRange = 'day'"
        >
          Day
        </button>
        <button
          :class="{ active: filterRange === 'week' }"
          @click="filterRange = 'week'"
        >
          Week
        </button>
        <button
          :class="{ active: filterRange === 'month' }"
          @click="filterRange = 'month'"
        >
          Month
        </button>
        <button
          :class="{ active: filterRange === 'year' }"
          @click="filterRange = 'year'"
        >
          Year
        </button>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search member code"
      />
    </div>

    <!-- Checkins -->
    <section class="checkins">
      <div v-if="Object.keys(displayedGroups).length === 0">
        <p>No check-ins found.</p>
      </div>

      <div v-else>
        <div v-for="(group, key) in displayedGroups" :key="String(key)">
          <div v-html="renderGroup(group, String(key), 1)"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";

interface Checkin {
  _id: string;
  timestamp?: string;
  userId?: { code?: string } | null;
}

const router = useRouter();
const token = ref("");
const checkins = ref<Checkin[]>([]);
const searchQuery = ref("");
const filterRange = ref<"day" | "week" | "month" | "year">("day");
const openGroups = ref<string[]>([]);

// MOUNT
onMounted(async () => {
  token.value = localStorage.getItem("token") || "";
  if (!token.value) router.push("/");

  try {
    const decoded = jwtDecode<any>(token.value);
    if (decoded.code !== "FF01" && decoded.role !== "admin")
      router.push("/dashboard");
  } catch {
    localStorage.removeItem("token");
    router.push("/");
  }

  await fetchCheckins();
  window.addEventListener("toggle", handleToggleEvent);
});

onBeforeUnmount(() => {
  window.removeEventListener("toggle", handleToggleEvent);
});

const fetchCheckins = async () => {
  try {
    const res = await fetch("/api/checkin/list", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) checkins.value = data;
  } catch (err) {
    console.error("Error fetching checkins:", err);
  }
};

const parseTimestamp = (input: any): Date | null => {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
};

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// FILTERS
const filteredCheckins = computed(() =>
  checkins.value.filter((c) =>
    c.userId?.code?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

// TOTALS
const todayCount = computed(() => {
  const today = new Date().toLocaleDateString();
  return filteredCheckins.value.filter(
    (c) => parseTimestamp(c.timestamp)?.toLocaleDateString() === today
  ).length;
});

const monthCount = computed(() => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return filteredCheckins.value.filter((c) => {
    const d = parseTimestamp(c.timestamp);
    return d && d.getMonth() === month && d.getFullYear() === year;
  }).length;
});

const yearCount = computed(() => {
  const year = new Date().getFullYear();
  return filteredCheckins.value.filter((c) => {
    const d = parseTimestamp(c.timestamp);
    return d && d.getFullYear() === year;
  }).length;
});

const allTimeCount = computed(() => filteredCheckins.value.length);

// GROUPING
const groupByDay = (list: Checkin[]): Record<string, Checkin[]> => {
  const grouped: Record<string, Checkin[]> = {};
  list.forEach((c) => {
    const d = parseTimestamp(c.timestamp);
    if (!d) return;
    const day = d.toLocaleDateString();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(c);
  });
  return grouped;
};

const groupByWeek = (
  list: Checkin[]
): Record<string, Record<string, Checkin[]>> => {
  const grouped: Record<string, Record<string, Checkin[]>> = {};
  list.forEach((c) => {
    const d = parseTimestamp(c.timestamp);
    if (!d) return;
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    const weekKey = `Week ${week} - ${year}`;
    const dayKey = d.toLocaleDateString();
    if (!grouped[weekKey]) grouped[weekKey] = {};
    if (!grouped[weekKey][dayKey]) grouped[weekKey][dayKey] = [];
    grouped[weekKey][dayKey].push(c);
  });
  return grouped;
};

const groupByMonth = (
  list: Checkin[]
): Record<string, Record<string, Checkin[]>> => {
  const grouped: Record<string, Record<string, Checkin[]>> = {};
  list.forEach((c) => {
    const d = parseTimestamp(c.timestamp);
    if (!d) return;
    const monthKey = d.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const dayKey = d.toLocaleDateString();
    if (!grouped[monthKey]) grouped[monthKey] = {};
    if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];
    grouped[monthKey][dayKey].push(c);
  });
  return grouped;
};

const groupByYear = (
  list: Checkin[]
): Record<string, Record<string, Record<string, Checkin[]>>> => {
  const grouped: Record<string, Record<string, Record<string, Checkin[]>>> = {};
  list.forEach((c) => {
    const d = parseTimestamp(c.timestamp);
    if (!d) return;
    const yearKey = String(d.getFullYear());
    const monthKey = d.toLocaleString("default", { month: "long" });
    const dayKey = d.toLocaleDateString();
    if (!grouped[yearKey]) grouped[yearKey] = {};
    if (!grouped[yearKey][monthKey]) grouped[yearKey][monthKey] = {};
    if (!grouped[yearKey][monthKey][dayKey])
      grouped[yearKey][monthKey][dayKey] = [];
    grouped[yearKey][monthKey][dayKey].push(c);
  });
  return grouped;
};

const displayedGroups = computed(() => {
  const list = filteredCheckins.value;
  switch (filterRange.value) {
    case "day":
      return groupByDay(list);
    case "week":
      return groupByWeek(list);
    case "month":
      return groupByMonth(list);
    case "year":
      return groupByYear(list);
    default:
      return {};
  }
});

// RENDER
const countCheckins = (group: any): number => {
  if (Array.isArray(group)) return group.length;
  if (typeof group === "object")
    return Object.values(group).reduce((sum, g) => sum + countCheckins(g), 0);
  return 0;
};

const renderGroup = (group: any, name: string, level = 1): string => {
  let html = `<div class="group-wrapper">`;
  html += `<button class="group-toggle level-${level}" onclick="window.dispatchEvent(new CustomEvent('toggle',{detail:'${name}'}))">${name} (${countCheckins(
    group
  )})</button>`;
  html += `<div class="group-content" style="display:${
    openGroups.value.includes(name) ? "block" : "none"
  };">`;
  if (Array.isArray(group)) {
    html += `<table class="checkin-table"><thead><tr><th>Member Code</th><th>Time</th></tr></thead><tbody>`;
    group.forEach((c: Checkin) => {
      html += `<tr><td>${c.userId?.code ?? "-"}</td><td>${
        c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : "-"
      }</td></tr>`;
    });
    html += `</tbody></table>`;
  } else {
    Object.entries(group).forEach(([k, v]) => {
      html += renderGroup(v, String(k), level + 1);
    });
  }
  html += `</div></div>`;
  return html;
};

// EVENT HANDLER
const handleToggleEvent = (e: CustomEvent) => {
  const key = e.detail;
  if (openGroups.value.includes(key))
    openGroups.value = openGroups.value.filter((k) => k !== key);
  else openGroups.value.push(key);
};
</script>

<style scoped>
.admin-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px;
  font-family: "Inter", sans-serif;
}

/* Totals */
.totals {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}
.total-box {
  flex: 1;
  background: #e7f4e7;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}
.total-box h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #2b7b2a;
}
.total-box p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1b5e1b;
}

/* Filters */
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.filter-buttons button {
  padding: 8px 14px;
  border: none;
  background: #52b44f;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.filter-buttons button.active {
  background: #2b7b2a;
}
.filters input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

/* Groups */
.group-wrapper {
  width: 100%;
}

:deep(.group-toggle) {
  width: 100%;
  text-align: left;
  padding: 12px 18px;
  background: #4caf50;
  border: none;
  color: white;
  font-weight: 500;
  cursor: pointer;
  margin-top: 5px;
  border-radius: 6px;
  transition: background 0.2s;
}
:deep(.group-toggle:hover) {
  background: #3e923e;
}

:deep(.checkin-table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}

.checkin-table th,
:deep(.checkin-table td) {
  border: 1px solid #ddd;
  padding: 6px 10px;
  text-align: left;
}

:deep(.checkin-table th) {
  background-color: #f2f2f2;
}

:deep(.group-toggle),
:deep(.group-toggle.level-2),
:deep(.group-toggle.level-3),
:deep(.group-toggle.level-4) {
  width: 100%;
  background: #4caf50;
  color: white;
  border-radius: 6px;
  padding: 12px 18px;
  margin-top: 5px;
  border: none;
  text-align: left;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
:deep(.group-toggle:hover) {
  background: #3e923e;
}
</style>
