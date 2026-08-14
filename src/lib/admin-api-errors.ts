export const ADMIN_API_ERROR_MESSAGES = {
  SESSION_EXPIRED: "登录状态已失效，请重新登录。",
  AUTH_RATE_LIMITED: "登录尝试过于频繁，请稍后再试。",
  DATABASE_UNAVAILABLE: "数据库暂不可用，请检查 D1 或本地数据库配置。",
  INVALID_JSON: "请求内容格式无效，请刷新页面后重试。",
  INVALID_SECURITY_KEY: "安全密钥不正确，请重新输入。",
  AUTH_FAILED: "登录失败，请稍后重试。",
  INVALID_CONTENT_TYPE: "内容类型无效，无法保存。",
  POST_SLUG_REQUIRED: "文章别名不能为空，请填写后再保存。",
  POST_SLUG_EXISTS: "该文章别名已存在，请更换别名后再发布。",
  POST_TARGET_SLUG_EXISTS: "修改后的文章别名已被其他文章占用，请更换后再保存。",
  SAVE_FAILED: "内容保存失败，请稍后重试。",
  DELETE_TARGET_REQUIRED: "删除目标信息不完整，请刷新页面后重试。",
  DELETE_FAILED: "内容删除失败，请稍后重试。",
  INVALID_DOWNLOAD_REQUEST: "下载参数无效，请刷新页面后重试。",
  INVALID_FILENAME: "文件名无效，无法下载。",
  CONTENT_NOT_FOUND: "要下载的内容不存在或已被删除。",
  DOWNLOAD_FAILED: "内容下载失败，请稍后重试。",
  TOKEN_DATABASE_UNAVAILABLE: "API 密钥功能需要可用的 D1 或本地数据库。",
  TOKEN_NAME_REQUIRED: "请输入 API 密钥名称。",
  TOKEN_ID_REQUIRED: "API 密钥标识无效，请刷新页面后重试。",
  TOKEN_LIST_FAILED: "API 密钥列表加载失败，请稍后重试。",
  TOKEN_CREATE_FAILED: "API 密钥创建失败，请稍后重试。",
  TOKEN_DELETE_FAILED: "API 密钥删除失败，请稍后重试。",
  LIST_FAILED: "内容列表加载失败，请稍后重试。",
} as const;

export type AdminApiErrorCode = keyof typeof ADMIN_API_ERROR_MESSAGES;

export function adminApiError(code: AdminApiErrorCode) {
  return { code, error: ADMIN_API_ERROR_MESSAGES[code] };
}
