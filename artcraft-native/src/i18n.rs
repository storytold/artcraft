//! Display-only translations. Never apply to model IDs, prompts or user media names.
use std::cell::Cell;

thread_local! { static CHINESE: Cell<bool> = const { Cell::new(false) }; }

pub fn is_chinese() -> bool { CHINESE.with(Cell::get) }
pub fn set_chinese(enabled: bool) { CHINESE.with(|locale| locale.set(enabled)); }

pub fn t(source: &str) -> &str {
  if !is_chinese() { return source; }
  match source {
    "3D Object" => "3D 物体",
    "3D Stage" => "3D 场景",
    "3D World" => "3D 世界",
    "About" => "关于",
    "Add audio" => "添加音频",
    "Add image" => "添加图片",
    "Audio" => "音频",
    "Auto" => "自动",
    "BG Remove" => "移除背景",
    "Back" => "返回",
    "Beat & Key" => "节拍与调性",
    "Buy credits" => "购买积分",
    "Cancel" => "取消",
    "Capable tools for artists." => "为创作者打造的强大工具。",
    "Character name" => "角色名称",
    "Clear all" => "全部清空",
    "Clear all?" => "全部清空？",
    "Close" => "关闭",
    "Collapse" => "收起",
    "Connect account" => "连接账号",
    "Copy" => "复制",
    "Create" => "创作",
    "Delete" => "删除",
    "Delete character?" => "删除角色？",
    "Delete this media?" => "删除此素材？",
    "Description" => "描述",
    "Description..." => "描述…",
    "Deselect all" => "取消全选",
    "Done" => "已完成",
    "Download" => "下载",
    "Duration" => "时长",
    "Edit Image" => "编辑图像",
    "Edit Video" => "编辑视频",
    "Enter to generate" => "按回车生成",
    "Exit selection" => "退出选择",
    "Expand" => "展开",
    "FAL API key" => "FAL API 密钥",
    "Frame Extract" => "提取帧",
    "From library" => "从素材库选择",
    "General" => "通用",
    "Generate images, videos and audio with the best models, steer them with references and keyframes, and keep everything in your library." => "使用先进模型生成图像、视频和音频，通过参考素材和关键帧掌控创作，并将作品保存在素材库中。",
    "Home" => "首页",
    "Image" => "图片",
    "Information" => "详细信息",
    "Language" => "语言",
    "Login to Midjourney" => "登录 Midjourney",
    "Make Video" => "生成视频",
    "Midjourney account" => "Midjourney 账户",
    "Model" => "模型",
    "Mute" => "静音",
    "No prompt" => "无提示词",
    "Number of generations" => "生成数量",
    "Open data folder" => "打开数据文件夹",
    "Open page again" => "重新打开页面",
    "Password" => "密码",
    "Pause" => "暂停",
    "Pick from library" => "从素材库选择",
    "Play" => "播放",
    "Play in your video player" => "在视频播放器中播放",
    "Prompt" => "提示词",
    "Provider accounts" => "服务商账户",
    "Recreate" => "再次生成",
    "Reference" => "参考素材",
    "Remove" => "移除",
    "Resources" => "资源",
    "Save" => "保存",
    "Select Model" => "选择模型",
    "Select Provider" => "选择服务商",
    "Settings" => "设置",
    "Share" => "分享",
    "Sign in to ArtCraft" => "登录 ArtCraft",
    "Sign in to create" => "登录以开始创作",
    "Sign in to start" => "登录以开始",
    "Sign in with browser" => "通过浏览器登录",
    "Soon" => "即将推出",
    "Swap frames" => "交换首尾帧",
    "This clears the prompt and also removes the attached references." => "这将清空提示词并移除附加的参考素材。",
    "This will permanently remove the media from your library. This action cannot be undone." => "这将从素材库中永久删除该素材，此操作无法撤销。",
    "Tuning" => "调节",
    "Unmute" => "取消静音",
    "Use selected" => "使用所选素材",
    "Use your ArtCraft account to generate images and videos." => "使用 ArtCraft 账户生成图像和视频。",
    "Video" => "视频",
    "View full size" => "查看原始尺寸",
    "Volume" => "音量",
    "When on, pressing Enter submits the prompt and Shift+Enter adds a new line. When off (default), both Enter and Shift+Enter add a new line - use only the button to submit." => "开启后，按 Enter 提交提示词，Shift+Enter 换行。关闭时（默认），两者均用于换行，请点击按钮提交。",
    "required" => "必填",
    "Confirmation code" => "确认码",
    "Approve the sign-in in your browser and check the code matches. This window updates by itself." => "请在浏览器中确认登录并核对验证码，此窗口会自动更新。",
    "Username or email" => "用户名或电子邮箱",
    "Sign in" => "登录",
    "Create account" => "创建账户",
    "Forgot password" => "忘记密码",
    "Account" => "账户",
    "Log out" => "退出登录",
    "Edit character" => "编辑角色",
    "Delete character" => "删除角色",
    "Open in web app" => "在网页版中打开",
    "Toggle Sidebar" => "切换侧边栏",
    "Library" => "素材库",
    "Signing in\u{2026}" => "正在登录…",
    "Uploading\u{2026}" => "正在上传…",
    _ => source,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn switches_display_text_and_preserves_unknown_content() {
    set_chinese(false);
    assert_eq!(t("Settings"), "Settings");
    set_chinese(true);
    assert_eq!(t("Settings"), "设置");
    assert_eq!(t("My own scene / model-id"), "My own scene / model-id");
    set_chinese(false);
    assert_eq!(t("Settings"), "Settings");
  }
}
