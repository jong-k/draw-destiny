import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

const THRESHOLD = 0.35; // 이 이상 기울면 한 칸 이동
const RESET = 0.18; // 이 아래로 돌아와야 다음 이동 허용 (디바운스)
const SMOOTHING = 0.2; // 저역통과 계수

export function useTilt(
  onStep: (direction: 1 | -1) => void,
  enabled: boolean,
): void {
  const smoothed = useRef(0);
  const armed = useRef(true);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x }) => {
      smoothed.current = smoothed.current * (1 - SMOOTHING) + x * SMOOTHING;
      const value = smoothed.current;

      if (armed.current && Math.abs(value) > THRESHOLD) {
        // x>0 → 오른쪽 기울임 → 오른쪽으로 한 칸(+1)
        onStepRef.current(value > 0 ? 1 : -1);
        armed.current = false;
      } else if (!armed.current && Math.abs(value) < RESET) {
        armed.current = true;
      }
    });

    return () => sub.remove();
  }, [enabled]);
}
