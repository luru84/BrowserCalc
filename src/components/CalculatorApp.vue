<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from "vue";
import type { Operator } from "../lib/calculator";
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

const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
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

const onHistoryReuse = (entry: string) => {
  mergeState({ ...state, displayValue: entry, newInput: false });
};
const onHistoryClear = () => {
  mergeState({ ...state, history: [] });
};
const onHistoryCopy = async (entry: string) => {
  if (navigator?.clipboard) {
    await navigator.clipboard.writeText(entry);
  }
};

const handleKey = (e: KeyboardEvent) => {
  const key = e.key;
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
      <div class="display" :class="{ error: indicatorOps.err }" aria-live="polite">
        <div class="indicators">
          <span v-if="indicatorOps.op" class="pill">{{ indicatorOps.op }}</span>
          <span v-if="indicatorOps.err" class="pill error">ERR</span>
          <span v-if="indicatorOps.mem" class="pill">M</span>
        </div>
        <div>{{ display }}</div>
      </div>

      <div class="memory-row" aria-label="メモリ">
        <button class="btn" type="button" @click="onMemory('MC')" aria-label="メモリクリア">MC</button>
        <button class="btn" type="button" @click="onMemory('MR')" aria-label="メモリリコール">MR</button>
        <button class="btn" type="button" @click="onMemory('MS')" aria-label="メモリセット">MS</button>
        <button class="btn" type="button" @click="onMemory('M+')" aria-label="メモリ加算">M+</button>
        <button class="btn" type="button" @click="onMemory('M-')" aria-label="メモリ減算">M-</button>
      </div>

      <div class="utility-row" aria-label="ユーティリティ">
        <button class="btn" type="button" @click="onClearEntry" aria-label="クリアエントリ">CE</button>
        <button class="btn" type="button" @click="onClear" aria-label="全クリア">C</button>
        <button class="btn" type="button" @click="onBackspace" aria-label="バックスペース">⌫</button>
        <button class="btn operator" type="button" @click="onToggleSign" aria-label="符号反転">+/−</button>
        <button class="btn operator" type="button" @click="onPercent" aria-label="パーセント">%</button>
        <button class="btn operator" type="button" @click="onTaxIn" aria-label="税込">税込</button>
        <button class="btn operator" type="button" @click="onTaxOut" aria-label="税抜">税抜</button>
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
        <button class="btn operator" type="button" @click="onOperator('+')" aria-label="足し算">＋</button>
        <button class="btn accent" type="button" @click="onEquals" aria-label="イコール">=</button>
      </div>

      <div class="settings-toggle-row" aria-label="設定トグル">
        <div></div>
        <div></div>
        <div></div>
        <button
          class="btn operator"
          type="button"
          @click="showSettings = !showSettings"
          :aria-expanded="showSettings"
          aria-controls="settings-panel"
        >
          {{ showSettings ? "設定を閉じる" : "設定を開く" }}
        </button>
      </div>
    </section>

    <aside
      v-if="showSettings"
      id="settings-panel"
      class="panel"
      aria-label="設定・情報"
    >
      <h2>設定</h2>
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
            <input type="radio" name="mode" value="sequential" :checked="state.mode === 'sequential'" @change="() => mergeState(toggleMode(state, 'sequential'))" />
            逐次計算
          </label>
          <label>
            <input type="radio" name="mode" value="expression" :checked="state.mode === 'expression'" @change="() => mergeState(toggleMode(state, 'expression'))" />
            式評価
          </label>
        </div>
      </div>

      <h2>ヘルプ</h2>
      <p>ショートカット: 数字/演算子/Enter/Backspace/Esc/+/−/% など。</p>

      <h2>履歴</h2>
      <div class="setting checkbox">
        <button class="btn" type="button" @click="onHistoryClear" aria-label="履歴クリア">履歴クリア</button>
      </div>
      <ul aria-label="履歴" style="list-style:none; padding:0; margin:0;">
        <li v-for="(h, idx) in state.history" :key="idx" style="margin-bottom:8px;">
          <div style="font-size:13px; color:#475569">{{ h.expression }}</div>
          <div style="font-weight:600">{{ h.result }}</div>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="btn" type="button" @click="onHistoryReuse(h.result)" aria-label="履歴を再利用">再利用</button>
            <button class="btn" type="button" @click="onHistoryCopy(h.result)" aria-label="履歴をコピー">コピー</button>
          </div>
        </li>
      </ul>
    </aside>
  </div>
</template>
