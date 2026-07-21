<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from "vue";
import type { Mode, Operator } from "../lib/calculator";
import {
  applyPercent,
  applyTaxExcluded,
  applyTaxIncluded,
  backspace,
  clearAll,
  clearEntry,
  createInitialState,
  equals,
  inputDecimal,
  inputDigit,
  memoryAdd,
  memoryClear,
  memoryRecall,
  memoryStore,
  memorySubtract,
  reuseHistoryEntry,
  setOperator,
  toggleSign,
  toggleMode,
  updateSettings,
} from "../lib/calculator";
import { applyTheme, loadSettings, saveSettings, type Settings } from "../lib/settings";

const settings = reactive<Settings>(loadSettings());
applyTheme(settings.theme);

const state = reactive(
  createInitialState({
    taxRate: settings.taxRate,
    precision: settings.precision,
    grouping: settings.grouping,
    scientific: settings.scientific,
    mode: settings.mode,
  }),
);

const mergeState = (next: typeof state) => {
  Object.assign(state, next);
};

const onDigit = (digit: string) => mergeState(inputDigit(state, digit));
const onDecimal = () => mergeState(inputDecimal(state));
const onOperator = (op: Operator) => mergeState(setOperator(state, op));
const onEquals = () => mergeState(equals(state));
const onClear = () => mergeState(clearAll(state));
const onClearEntry = () => mergeState(clearEntry(state));
const onBackspace = () => mergeState(backspace(state));
const onToggleSign = () => mergeState(toggleSign(state));
const onPercent = () => mergeState(applyPercent(state));
const onTaxIn = () => mergeState(applyTaxIncluded(state));
const onTaxOut = () => mergeState(applyTaxExcluded(state));
const onMemory = (action: string) => {
  const handlers: Record<string, () => void> = {
    MC: () => mergeState(memoryClear(state)),
    MR: () => mergeState(memoryRecall(state)),
    MS: () => mergeState(memoryStore(state)),
    "M+": () => mergeState(memoryAdd(state)),
    "M-": () => mergeState(memorySubtract(state)),
  };
  handlers[action]?.();
};

const syncCalcSettings = () =>
  mergeState(
    updateSettings(state, {
      taxRate: settings.taxRate,
      precision: settings.precision,
      grouping: settings.grouping,
      scientific: settings.scientific,
    }),
  );

const updateSetting = <K extends Exclude<keyof Settings, "mode">>(key: K, value: Settings[K]) => {
  settings[key] = value;
  saveSettings(settings);
  if (key === "theme") applyTheme(settings.theme);
  syncCalcSettings();
};

const display = computed(() => state.displayValue);
const indicatorOps = computed(() => ({
  op: state.pendingOperator,
  err: state.error,
  mem: state.memoryValue !== null,
}));
const showSettings = ref(false);
const activePanel = ref<"history" | "settings">("history");

const closeSettings = () => {
  showSettings.value = false;
};
const openPanel = (panel: "history" | "settings") => {
  if (showSettings.value && activePanel.value === panel) {
    closeSettings();
    return;
  }
  activePanel.value = panel;
  showSettings.value = true;
};

const onModeChange = (mode: Mode) => {
  mergeState(toggleMode(state, mode));
  settings.mode = mode;
  saveSettings(settings);
};

const onHistoryReuse = (entry: string) => {
  mergeState(reuseHistoryEntry(state, entry));
};
const onHistoryClear = () => {
  mergeState({ ...state, history: [] });
};
const onHistoryCopy = async (entry: string) => {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(entry);
      return;
    } catch {
      // fall through to legacy copy path
    }
  }

  if (typeof document === "undefined") return;
  const textarea = document.createElement("textarea");
  textarea.value = entry;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const handleKey = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null;
  const isFormField =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    !!target?.closest("input, textarea, select, [contenteditable='true']");

  if (isFormField) return;

  const key = e.key;
  if (key === "Escape" && showSettings.value) {
    closeSettings();
    e.preventDefault();
    return;
  }
  if (/^[0-9]$/.test(key)) {
    onDigit(key);
    e.preventDefault();
    return;
  }
  if (key === ".") {
    onDecimal();
    e.preventDefault();
    return;
  }
  if (["+", "-", "*", "/"].includes(key)) {
    onOperator(key as Operator);
    e.preventDefault();
    return;
  }
  if (key === "Enter" || key === "=") {
    onEquals();
    e.preventDefault();
    return;
  }
  if (key === "Backspace") {
    onBackspace();
    e.preventDefault();
    return;
  }
  if (key === "Escape" || key.toLowerCase() === "c") {
    onClear();
    e.preventDefault();
    return;
  }
  if (key === "%") {
    onPercent();
    e.preventDefault();
    return;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKey);
});
</script>

<template>
  <div class="shell">
    <section class="card" aria-label="電卓">
      <div class="toolbar mobile-toolbar">
        <div class="toolbar-group">
          <button
            class="btn operator menu-btn"
            type="button"
            @click="openPanel('history')"
            :aria-expanded="showSettings && activePanel === 'history'"
            aria-controls="settings-panel"
            aria-label="履歴パネルを開く"
          >
            履歴
          </button>
          <button
            class="btn operator menu-btn"
            type="button"
            @click="openPanel('settings')"
            :aria-expanded="showSettings && activePanel === 'settings'"
            aria-controls="settings-panel"
            aria-label="設定パネルを開く"
          >
            設定
          </button>
        </div>
        <div class="status-chips" aria-label="状態">
          <span v-if="indicatorOps.mem" class="status-chip">M</span>
          <span class="status-chip">{{ state.mode === "expression" ? "式評価" : "入力順" }}</span>
        </div>
      </div>

      <div class="toolbar desktop-toolbar">
        <button
          class="btn operator menu-btn"
          type="button"
          @click="openPanel('settings')"
          :aria-expanded="showSettings && activePanel === 'settings'"
          aria-controls="settings-panel"
          aria-label="設定メニューを開閉"
        >
          ☰ 設定
        </button>
        <button
          class="btn operator menu-btn"
          type="button"
          @click="openPanel('history')"
          :aria-expanded="showSettings && activePanel === 'history'"
          aria-controls="settings-panel"
          aria-label="履歴パネルを開閉"
        >
          履歴
        </button>
      </div>

      <div class="display" :class="{ error: indicatorOps.err }" aria-live="polite">
        <div class="indicators">
          <span v-if="indicatorOps.op" class="pill">{{ indicatorOps.op }}</span>
          <span v-if="indicatorOps.err" class="pill error">ERR</span>
          <span v-if="indicatorOps.mem" class="pill">M</span>
        </div>
        <div>{{ display }}</div>
      </div>

      <div class="utility-row utility-row-main" aria-label="主操作">
        <button class="btn" type="button" @click="onClearEntry" aria-label="クリアエントリ">CE</button>
        <button class="btn" type="button" @click="onClear" aria-label="全クリア">C</button>
        <button class="btn" type="button" @click="onBackspace" aria-label="バックスペース">⌫</button>
        <button class="btn operator" type="button" @click="onToggleSign" aria-label="符号反転">+/−</button>
        <button class="btn operator" type="button" @click="onOperator('+')" aria-label="足し算">＋</button>
      </div>

      <div class="grid" aria-label="キー入力">
        <button class="btn" type="button" @click="onDigit('7')">7</button>
        <button class="btn" type="button" @click="onDigit('8')">8</button>
        <button class="btn" type="button" @click="onDigit('9')">9</button>
        <button class="btn operator" type="button" @click="onOperator('/')" aria-label="割り算">÷</button>

        <button class="btn" type="button" @click="onDigit('4')">4</button>
        <button class="btn" type="button" @click="onDigit('5')">5</button>
        <button class="btn" type="button" @click="onDigit('6')">6</button>
        <button class="btn operator" type="button" @click="onOperator('*')" aria-label="掛け算">×</button>

        <button class="btn" type="button" @click="onDigit('1')">1</button>
        <button class="btn" type="button" @click="onDigit('2')">2</button>
        <button class="btn" type="button" @click="onDigit('3')">3</button>
        <button class="btn operator" type="button" @click="onOperator('-')" aria-label="引き算">−</button>

        <button class="btn wide" type="button" @click="onDigit('0')">0</button>
        <button class="btn" type="button" @click="onDecimal" aria-label="小数点">.</button>
        <button class="btn accent" type="button" @click="onEquals" aria-label="イコール">=</button>
      </div>

      <div class="secondary-dock" aria-label="補助操作">
        <div class="secondary-group tax-row" aria-label="税計算">
          <button class="btn operator secondary-btn" type="button" @click="onPercent" aria-label="パーセント">%</button>
          <button class="btn operator secondary-btn" type="button" @click="onTaxIn" aria-label="税込">税込</button>
          <button class="btn operator secondary-btn" type="button" @click="onTaxOut" aria-label="税抜">税抜</button>
        </div>

        <div class="secondary-group memory-row" aria-label="メモリ">
          <button class="btn secondary-btn" type="button" @click="onMemory('MC')" aria-label="メモリクリア">MC</button>
          <button class="btn secondary-btn" type="button" @click="onMemory('MR')" aria-label="メモリリコール">MR</button>
          <button class="btn secondary-btn" type="button" @click="onMemory('MS')" aria-label="メモリセット">MS</button>
          <button class="btn secondary-btn" type="button" @click="onMemory('M+')" aria-label="メモリ加算">M+</button>
          <button class="btn secondary-btn" type="button" @click="onMemory('M-')" aria-label="メモリ減算">M-</button>
        </div>
      </div>
    </section>

    <div v-if="showSettings" class="settings-backdrop" @click="closeSettings" aria-hidden="true"></div>

    <aside
      id="settings-panel"
      class="panel settings-panel"
      :class="{ open: showSettings }"
      aria-label="設定・情報"
      @click.stop
    >
      <div class="settings-header">
        <div>
          <p class="sheet-kicker">Calculator</p>
          <h2>{{ activePanel === "history" ? "履歴" : "設定" }}</h2>
        </div>
        <button class="btn" type="button" @click="closeSettings" aria-label="設定パネルを閉じる">閉じる</button>
      </div>
      <div class="panel-tabs" role="tablist" aria-label="履歴と設定の切り替え">
        <button
          class="panel-tab"
          :class="{ active: activePanel === 'history' }"
          type="button"
          role="tab"
          :aria-selected="activePanel === 'history'"
          @click="activePanel = 'history'"
        >
          履歴
        </button>
        <button
          class="panel-tab"
          :class="{ active: activePanel === 'settings' }"
          type="button"
          role="tab"
          :aria-selected="activePanel === 'settings'"
          @click="activePanel = 'settings'"
        >
          設定
        </button>
      </div>

      <div v-if="activePanel === 'settings'" class="panel-content">
        <div class="setting">
          <label for="taxRate">税率 (%)</label>
          <input
            id="taxRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            :value="settings.taxRate * 100"
            @input="(e) => updateSetting('taxRate', Number((e.target as HTMLInputElement).value) / 100)"
          />
        </div>

        <div class="setting">
          <label for="precision">表示精度（小数点以下）</label>
          <select
            id="precision"
            :value="settings.precision"
            @change="(e) => updateSetting('precision', Number((e.target as HTMLSelectElement).value))"
          >
            <option :value="2">2桁</option>
            <option :value="3">3桁</option>
            <option :value="4">4桁</option>
          </select>
        </div>

        <div class="setting checkbox">
          <label>
            <input type="checkbox" :checked="settings.grouping" @change="(e) => updateSetting('grouping', (e.target as HTMLInputElement).checked)" />
            桁区切り（,）を表示する
          </label>
        </div>

        <div class="setting checkbox">
          <label>
            <input
              type="checkbox"
              :checked="settings.scientific"
              @change="(e) => updateSetting('scientific', (e.target as HTMLInputElement).checked)"
            />
            桁あふれ時に科学表記へ切替
          </label>
        </div>

        <div class="setting">
          <label>テーマ</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="theme" value="light" :checked="settings.theme === 'light'" @change="() => updateSetting('theme', 'light')" />
              ライト
            </label>
            <label>
              <input type="radio" name="theme" value="dark" :checked="settings.theme === 'dark'" @change="() => updateSetting('theme', 'dark')" />
              ダーク
            </label>
          </div>
        </div>

        <div class="setting">
          <label>モード</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="mode" value="sequential" :checked="state.mode === 'sequential'" @change="() => onModeChange('sequential')" />
              入力順（逐次計算）
            </label>
            <label>
              <input type="radio" name="mode" value="expression" :checked="state.mode === 'expression'" @change="() => onModeChange('expression')" />
              式評価
            </label>
          </div>
        </div>

        <h2>ヘルプ</h2>
        <p>ショートカット: 数字/演算子/Enter/Backspace/Esc/+/−/% など。</p>
      </div>

      <div v-else class="panel-content">
        <div class="history-actions">
          <button class="btn" type="button" @click="onHistoryClear" aria-label="履歴クリア">履歴クリア</button>
        </div>
        <ul class="history-list" aria-label="履歴">
          <li v-for="(h, idx) in state.history" :key="idx" class="history-item">
            <div class="history-expression">{{ h.expression }}</div>
            <div class="history-result">{{ h.result }}</div>
            <div class="history-buttons">
              <button class="btn" type="button" @click="onHistoryReuse(h.result)" aria-label="履歴を再利用">再利用</button>
              <button class="btn" type="button" @click="onHistoryCopy(h.result)" aria-label="履歴をコピー">コピー</button>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.mobile-toolbar,
.desktop-toolbar,
.toolbar-group,
.status-chips,
.secondary-dock,
.secondary-group,
.memory-row,
.tax-row,
.panel-tabs,
.history-actions,
.history-buttons {
  display: flex;
}

.mobile-toolbar,
.desktop-toolbar,
.secondary-dock {
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mobile-toolbar {
  margin-bottom: 0.75rem;
}

.desktop-toolbar {
  display: none;
}

.toolbar-group,
.status-chips,
.secondary-group,
.panel-tabs,
.history-buttons {
  gap: 0.5rem;
}

.status-chip {
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 999px;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
}

.utility-row-main {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 0.7rem;
}

.secondary-dock {
  align-items: stretch;
  flex-direction: column;
  margin-top: 0.9rem;
}

.secondary-group {
  flex-wrap: wrap;
}

.secondary-btn {
  flex: 1 1 calc(20% - 0.4rem);
  min-width: 3.2rem;
}

.tax-row .secondary-btn {
  flex-basis: calc(33.333% - 0.35rem);
}

.memory-row {
  flex-wrap: nowrap;
  margin: 0;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: none;
}

.memory-row::-webkit-scrollbar {
  display: none;
}

.memory-row .secondary-btn {
  flex: 0 0 auto;
  min-width: 3.4rem;
}

.settings-panel {
  border-radius: 1.5rem 1.5rem 0 0;
  bottom: 0;
  left: 0;
  max-height: min(78vh, 46rem);
  overflow: auto;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  position: fixed;
  right: 0;
  transform: translateY(100%);
  transition: transform 0.24s ease;
  z-index: 40;
}

.settings-panel.open {
  transform: translateY(0);
}

.settings-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.settings-header h2 {
  margin: 0;
}

.sheet-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.15rem;
  opacity: 0.7;
  text-transform: uppercase;
}

.panel-tabs {
  margin-bottom: 1rem;
}

.panel-tab {
  background: transparent;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 999px;
  cursor: pointer;
  flex: 1 1 0;
  font: inherit;
  padding: 0.7rem 0.9rem;
}

.panel-tab.active {
  background: var(--key-operator);
  color: var(--key-operator-text);
  border-color: transparent;
  font-weight: 700;
}

.panel-content {
  display: grid;
  gap: 1rem;
}

.history-actions {
  justify-content: flex-end;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-item {
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.8rem;
}

.history-expression {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.history-result {
  font-weight: 600;
  margin-top: 0.2rem;
}

.history-buttons {
  margin-top: 0.5rem;
}

@media (min-width: 768px) {
  .mobile-toolbar {
    display: none;
  }

  .desktop-toolbar {
    display: flex;
    margin-bottom: 0.75rem;
  }

  .secondary-dock {
    flex-direction: row;
    justify-content: space-between;
  }

  .secondary-group {
    flex: 1 1 0;
  }

  .memory-row {
    flex-wrap: wrap;
    margin: 0;
    overflow: visible;
    padding-bottom: 0;
  }

  .memory-row .secondary-btn {
    flex: 1 1 calc(20% - 0.4rem);
    min-width: 3.2rem;
  }

  .settings-panel {
    border-radius: 1.5rem 0 0 1.5rem;
    bottom: 1rem;
    left: auto;
    max-height: calc(100vh - 2rem);
    top: 1rem;
    transform: translateX(100%);
    width: min(26rem, 42vw);
  }

  .settings-panel.open {
    transform: translateX(0);
  }
}
</style>
