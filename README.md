# A+ Monster 🎓

> 你的 AI 讀書夥伴 Mochi，幫你規劃學期計畫、追蹤學習進度。  
> A+ 是目標，不是保證。

## 功能狀態

| 功能 | 狀態 |
|---|---|
| 專案骨架、設計系統、路由 | ✅ 已實作 (Phase 1) |
| 共用 UI 元件（Button、Card、Badge 等） | ✅ 已實作 (Phase 1) |
| Mochi 吉祥物元件（SVG、多表情） | ✅ 已實作 (Phase 1) |
| Landing 頁面 | ✅ 已實作 (Phase 1) |
| Dashboard（框架） | ✅ 已實作 (Phase 1) |
| Onboarding 精靈（UI 流程） | ✅ 已實作 (Phase 1) |
| 學期 & 課程 CRUD | 🚧 Phase 2 |
| 筆記 Markdown 編輯器 | 🚧 Phase 2 |
| 測驗生成與作答 | 🚧 Phase 2 |
| 錯題本 | 🚧 Phase 2 |
| 讀書計畫行事曆 | 🚧 Phase 2 |
| IndexedDB 本地持久化 | 🚧 Phase 2 |
| Supabase Auth & 雲端同步 | 📋 Phase 3 |
| NVIDIA AI Gateway | 📋 Phase 3 |
| AI 計畫生成 | 📋 Phase 3 |
| AI 筆記摘要 | 📋 Phase 4 |
| AI 測驗生成 | 📋 Phase 4 |
| 自適應重新規劃 | 📋 Phase 5 |

## 本機開發

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器（http://localhost:5173）
npm run dev

# 型別檢查 + 建置
npm run build

# 預覽 production build
npm run preview
```

## 環境變數

複製 `.env.example` 為 `.env.local`，並填入正確的值。

```bash
cp .env.example .env.local
```

> ⚠️ **絕對不要**把真實的 API Key 放入前端（`VITE_` 前綴）或提交到 Git。

## 技術堆疊

- **前端：** React 19 + TypeScript + Vite 8
- **樣式：** Tailwind CSS v4
- **路由：** React Router v7
- **狀態：** TanStack Query（Phase 2+）
- **驗證：** Zod
- **後端：** Supabase（Phase 3+）
- **AI：** NVIDIA API via Edge Function（Phase 3+）

## 目前模式

**📱 本機示範模式**：Phase 1 為純前端骨架，資料尚未持久化（Phase 2 加入 IndexedDB），雲端帳號同步於 Phase 3 完成。

## 目錄結構

```
src/
├── app/           # AppLayout、Router、Sidebar、TopBar、BottomNav
├── components/
│   ├── ui/        # Button、Card、Badge、Input、Dialog、EmptyState…
│   └── mascot/    # MochiAvatar、MochiWidget
├── features/      # 各功能模組（landing、dashboard、semesters…）
├── lib/           # routes、cn、date helpers
├── styles/        # 設計 Token（tokens.css）
└── types/         # 共用 TypeScript 型別
```
