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
  HOME_SCHEMA_MISSING: "首页管理数据表尚未初始化，请先执行数据库迁移（0007_home_manage.sql）。",
  HOME_STATUS_INVALID: "状态词和地点不能为空。",
  HOME_TOOL_INVALID: "请输入工具名称。",
  HOME_BOOK_INVALID: "请输入书名。",
  HOME_URL_INVALID: "链接或封面地址格式无效，仅支持 http(s):// 或以 / 开头的站内路径。",
  HOME_ID_REQUIRED: "缺少目标记录标识，请刷新页面后重试。",
  HOME_LOAD_FAILED: "首页管理数据加载失败，请稍后重试。",
  HOME_SAVE_FAILED: "首页配置保存失败，请稍后重试。",
  HOME_DELETE_FAILED: "删除失败，请稍后重试。",
} as const;

export type AdminApiErrorCode = keyof typeof ADMIN_API_ERROR_MESSAGES;

export function adminApiError(code: AdminApiErrorCode) {
  return { code, error: ADMIN_API_ERROR_MESSAGES[code] };
}
