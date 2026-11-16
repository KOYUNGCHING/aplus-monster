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
| Dashboard（接真實資料） | ✅ 已實作 (Phase 2) |
| Onboarding 精靈（真實儲存） | ✅ 已實作 (Phase 2) |
| IndexedDB 本地持久化 | ✅ 已實作 (Phase 2) |
| 學期 CRUD（建立、編輯、封存、刪除） | ✅ 已實作 (Phase 2) |
| 課程 CRUD（顏色、難度、目標成績） | ✅ 已實作 (Phase 2) |
| 課程頁面（tabs、截止日管理） | ✅ 已實作 (Phase 2) |
| 截止日 CRUD | ✅ 已實作 (Phase 2) |
| 筆記 Markdown 編輯器 | 🚧 Phase 3 |
| 測驗生成與作答 | 🚧 Phase 3 |
| 錯題本 | 🚧 Phase 3 |
| 讀書計畫行事曆 | 🚧 Phase 3 |
| Supabase Auth & 雲端同步 | 📋 Phase 4 |
| NVIDIA AI Gateway | 📋 Phase 4 |
| AI 計畫生成與審核 | 📋 Phase 4 |
| AI 筆記摘要、AI 測驗生成 | 📋 Phase 5 |
| 自適應重新規劃、PDF / 匯出 | 📋 Phase 5 |

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

**📱 本機示範模式**：目前學期、課程與截止日資料會儲存在這台裝置的瀏覽器 IndexedDB，不會同步雲端。清除瀏覽器資料可能造成資料遺失；Supabase 帳號與跨裝置同步規劃於 Phase 4。

## 階段交付狀態

- Phase 1（M0）：已完成並通過 build / lint；包含 Vite、React、TypeScript、Tailwind、設計 Token、完整路由空殼、響應式全域 layout、共用 UI 與靜態 Mochi。
- Phase 2（M1）：已實作本機 IndexedDB 與學期／課程 CRUD。
- Phase 3（M2）：開發中，尚未宣告完成。
- Phase 4–5（M3–M6）：規劃中；尚未串接 Supabase 或 NVIDIA，UI 不會把假資料呈現為真實 AI 結果。

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
