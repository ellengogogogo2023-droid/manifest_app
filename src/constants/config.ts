/**
 * 后端 API 地址。
 * 开发时在 .env.local 设置：
 *   iOS 模拟器  → http://localhost:3001
 *   Android 模拟器 → http://10.0.2.2:3001
 *   真机调试    → http://YOUR_LOCAL_IP:3001
 */
export const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
