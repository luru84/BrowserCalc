<script setup lang="ts">
import { computed, reactive } from "vue";
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
  setOperator,
  toggleSign,
} from "../lib/calculator";

const state = reactive(createInitialState());

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

const display = computed(() => state.displayValue);
const indicatorOps = computed(() => ({
  op: state.pendingOperator,
  err: state.error,
}));
</script>

<template>
  <section class="card" aria-label="電卓">
    <div class="display" :class="{ error: indicatorOps.err }" aria-live="polite">
      <div class="indicators">
        <span v-if="indicatorOps.op" class="pill">{{ indicatorOps.op }}</span>
        <span v-if="indicatorOps.err" class="pill error">ERR</span>
      </div>
      <div>{{ display }}</div>
    </div>

    <div class="top-row" aria-label="ユーティリティ">
      <button class="btn" type="button" @click="onClearEntry" aria-label="クリアエントリ">
        CE
      </button>
      <button class="btn" type="button" @click="onClear" aria-label="全クリア">C</button>
      <button class="btn" type="button" @click="onBackspace" aria-label="バックスペース">
        ⌫
      </button>
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
  </section>
</template>
