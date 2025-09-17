type CounterSettings = {
  value: number;
  step: number;
};

const initialValue = Number.isFinite(Number(process.env.COUNTER_INITIAL))
  ? Number(process.env.COUNTER_INITIAL)
  : 0;

const initialStep = Number.isFinite(Number(process.env.COUNTER_STEP))
  ? Number(process.env.COUNTER_STEP)
  : 1;

let settings: CounterSettings = {
  value: initialValue,
  step: initialStep,
};

export function getSettings(): CounterSettings {
  return { ...settings };
}

export function updateSettings(
  partial: Partial<CounterSettings>
): CounterSettings {
  if (typeof partial.value === 'number' && Number.isFinite(partial.value)) {
    settings.value = partial.value;
  }
  if (
    typeof partial.step === 'number' &&
    Number.isFinite(partial.step) &&
    partial.step !== 0
  ) {
    settings.step = partial.step;
  }
  return getSettings();
}

/**
 * Returns the current count and increments it for the next call.
 */
export function readAndIncrement(): { current: number; next: number } {
  const current = settings.value;
  const next = current + settings.step;
  settings.value = next;
  return { current, next };
}
