/**
 * 앱 전역 디자인 토큰의 단일 출처.
 * 색상은 점진적으로 각 컴포넌트에서 이 상수를 참조하도록 이전한다.
 */

export const COLORS = {
  /** 화면 기본 배경 */
  bg: "#0E0B1A",
  /** 카드·시트 등 표면 */
  surface: "#1C1730",
  /** 강조된 표면 (보유 카드, 앞면 등) */
  surfaceActive: "#3A2E5C",
  /** 보조 표면 (뒷면, 잠긴 카드 등) */
  surfaceAlt: "#2A2342",
  /** 기본 텍스트 */
  text: "#F4EAD5",
  /** 약한 텍스트 (chevron 등) */
  textMuted: "#B9A6E0",
  /** 강조색 (포인트, 버튼) */
  accent: "#7C5CFF",
  /** 경계선 */
  border: "#332B4D",
  borderStrong: "#3D3460",
} as const;

export const SPACING = {
  /** 콘텐츠가 safe-area 아래에서 시작하는 상단 갭 */
  screenTop: 16,
  /** 화면 좌우 기본 거터 */
  gutter: 20,
} as const;
