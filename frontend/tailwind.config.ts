import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} }
}
export default config
