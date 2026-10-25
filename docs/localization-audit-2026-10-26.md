# 汉化覆盖检查（2026-10-26）

## 同步结果

已将上游 `1f969a9224934a55417daf10359a6fb1458b63f4` 合入汉化分支。
相对原基线 `d4e4ac69bbd93d237eaf5d0260bc6a5ff3a5e373` 新增 5 个提交，
仅涉及 CodeRabbit、Dependabot、SonarCloud 和 README，无应用界面代码变更，无合并冲突。
本轮没有新增翻译词条，也没有发布新的安装包。

## 统计口径与结果

扫描 Git 跟踪的 `frontend/apps/artcraft` 和 `frontend/libs` TypeScript/JavaScript
源文件，排除测试、故事和夹具。使用 TypeScript AST 查找未包在 `t`、`tr`、
`i18n.t` 或 `Trans` 内的英文 JSX 文本、常见显示属性、通知以及显示标签对象。
只计匹配这些规则的候选，**不代表完整漏译总数或全项目汉化完成率**。
没有执行模块可达性分析，可能包含暂未启用的页面、样例标签、模型品牌、格式缩写；
模板插值、动态拼接、间接传参、服务端文案和非常规翻译包装可能漏检。

- 英文和简体中文词库各 824 条，键名完全匹配；唯一原文相同项为 `BPM`。
- 已扫描到的字面量翻译调用无缺失键（识别 `_one` / `_other` 复数词条）。
- 前端共 1,310 处待审候选，去重为 976 个字符串，分布在 235 个文件。
- 其中 764 处位于 JSX 文本／显示属性／通知调用，去重为 580 个字符串。
  其中 144 处已有同名英文词条，但此处仍直接使用英文，需要接入翻译调用。
- 另 546 处来自对象的 `label`、`title`、`description` 等属性，需确认运行时
  是否已在消费端翻译、是否为品牌或业务数据，不能全部直接判为漏译。

下表为包含对象候选在内的出现次数，**不是需要新增的词条数**：

| 区域                   | 候选位置数 |
|------------------------|------------|
| 视频编辑器             | 410        |
| 应用页面及入口组件     | 217        |
| 提示词组件／角色管理   | 153        |
| 3D 场景编辑器          | 141        |
| 情绪板                 | 83         |
| 绘图编辑器             | 43         |
| 上传弹窗               | 36         |
| 模型列表               | 34         |
| VFX                    | 30         |
| 订阅状态数据           | 28         |
| 音效面板               | 23         |
| 其他                   | 112        |

## 已核实的典型遗漏

- `frontend/apps/artcraft/app/src/components/GlobalFileDropHandler/GlobalFileDropHandler.tsx:197`：`Drop to Upload`。
- `frontend/apps/artcraft/app/src/components/experiences/ImageTo3DExperience.tsx:250`：`Failed to upload image`。
- `frontend/libs/components/video-editor/src/lib/actions/shortcuts-dialog.tsx:115`：`Keyboard shortcuts`。
- `frontend/libs/components/video-editor/src/lib/components/editor/editor-error-boundary.tsx:63`：`The editor ran into a problem`。

优先处理上传、图生 3D／世界、角色管理、分镜、角度调整、去背景和去水印页面，
再处理视频编辑器、3D 场景、情绪板和绘图工具。优先复用已有词条；模型名、文件
扩展名、用户提示词、用户素材名、协议值和账号／付款参数不应直接替换为中文。

## Rust 原生版单列

`artcraft-native` 是独立的 egui 程序，不使用 React 汉化词库。本轮对其常见 UI
调用行（包括 `widgets` 包装函数）做正则抽样扫描，找到 148 处英文候选、121 个
去重字符串，涉及 17 个文件。它不是该原生版的完整漏译清单：多行调用、格式化
参数和变量内容没有完整追踪。该统计不与 Tauri 版相加，也不能据此估算覆盖率。
本轮没有为原生版添加中文支持。

## 复查方式

仓库根目录执行（已安装 `frontend` 依赖）：

```powershell
New-Item -ItemType Directory -Force .local-build | Out-Null
node frontend/tools/testing/audit-localization.mjs .local-build/localization-audit.json
```

JSON 输出包含每个候选的文件、行号、文本、候选类型，以及是否已有同名词条。
本次明细保存在 `.local-build/localization-audit.json`，直接显示候选的 CSV 在
`.local-build/localization-direct-candidates.csv`。这些构建输出不提交到 Git。

## 验证范围

- 21 个测试文件、105 项汉化相关测试通过。
- i18n TypeScript 类型检查通过。
- 前端生产构建成功，产物在 `.local-build/frontend-sync-20261026`。
- 本地浏览器夹具验证通过：默认英文、中文设置／首页／创作页面、刷新后语言保留、
  切回英文、用户提示词不变、双语快捷键搜索与冲突提示、中文登录文案。
- 浏览器验证阻断外部请求，不进行真实登录、付费生成或上传。
- 本轮没有原生源代码或应用依赖变更，未重编译 Windows 可执行文件，也未进行
  新的安装／卸载测试；本地安装包和 GitHub Release 仍为之前的修复版。
