/**
 * 草稿默认不显示（开发和生产都不显示）。
 * 想在本地预览草稿时，用环境变量临时打开：
 *   PowerShell: $env:SHOW_DRAFTS='1'; npm run dev
 *   bash:       SHOW_DRAFTS=1 npm run dev
 * 生产构建始终忽略这个开关，避免草稿被误发布。
 */
const env = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;

export const includeDraftsByDefault =
  !import.meta.env.PROD && env?.SHOW_DRAFTS === '1';
