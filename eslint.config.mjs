import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// eslint-config-next 15 는 플랫 설정을 내보내지 않는다.
// core-web-vitals.js / typescript.js 가 구형 eslintrc 객체라 FlatCompat 으로 감싸야 한다.
// 16 방식(서브패스를 배열로 스프레드)을 그대로 두면 npm run lint 가 깨진다.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
