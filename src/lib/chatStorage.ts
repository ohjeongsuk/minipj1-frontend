import type { TransactionResponse } from "@/types/api";

/**
 * 대화 이력을 브라우저에 저장한다.
 *
 * ⚠️ 키에 userId 를 넣는다. 한 브라우저에서 다른 계정으로 로그인했을 때
 *    이전 사용자의 대화가 보이면 안 된다. 로그아웃 시 삭제와 이중으로 막는다.
 *
 * ⚠️ 모든 접근을 try/catch 로 감싼다. 프라이빗 모드·사이트 데이터 차단·용량 초과에서
 *    localStorage 는 값을 못 주는 게 아니라 예외를 던진다.
 *    실패하면 조용히 메모리 상태로만 동작하고 화면은 정상적으로 그려져야 한다.
 *
 * ⚠️ 상한이 없으면 안 된다. 말풍선마다 transactions 가 최대 20건씩 붙어
 *    무한 누적하면 할당량(약 5MB)에 닿고, 그 순간 쓰기가 예외로 바뀐다.
 */
const PREFIX = "moneylog_chat_";
const MAX_BUBBLES = 50;

export interface ChatBubble {
  id: string;
  role: "user" | "bot";
  content: string;
  yearMonth?: string | null;
  transactions?: TransactionResponse[] | null;
  suggestions?: string[];
}

export function readChat(userId: number): ChatBubble[] {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${userId}`);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatBubble[]) : [];
  } catch {
    return [];
  }
}

export function writeChat(userId: number, bubbles: ChatBubble[]): void {
  try {
    window.localStorage.setItem(
      `${PREFIX}${userId}`,
      JSON.stringify(bubbles.slice(-MAX_BUBBLES)),
    );
  } catch {
    // 프라이빗 모드나 용량 초과. 메모리 상태로만 계속 동작한다
  }
}

/** 로그아웃 시 모든 계정의 이력을 지운다. 어느 계정이었는지 알 필요가 없다 */
export function clearAllChats(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // 위와 같다
  }
}
