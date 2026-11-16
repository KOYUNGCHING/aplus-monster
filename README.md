# A+ Monster 🎓

> 你的 AI 讀書夥伴 Mochi，幫你規劃學期計畫、追蹤學習進度。  
> A+ 是目標，不是保證。

## 功能狀態

| 功能 | 狀態 |
|---|---|
| 專案骨架、設計系統、路由 | ✅ P1 |
| 共用 UI 元件（Button、Card、Badge 等） | ✅ P1 |
| Mochi 吉祥物（小怪獸，SVG 多表情） | ✅ P1 |
| Landing 頁面 | ✅ P1 |
| IndexedDB 本地持久化 | ✅ P2 |
| 學期 CRUD（建立/編輯/封存/刪除） | ✅ P2 |
| 課程 CRUD（顏色/難度/目標成績） | ✅ P2 |
| 截止日期 CRUD | ✅ P2 |
| Dashboard（接真實資料） | ✅ P2 |
| Onboarding 精靈 | ✅ P2 |
| 筆記頁面（Markdown 編輯器 + 預覽） | ✅ P3 |
| 測驗庫（建立測驗、題目管理） | ✅ P3 |
| 測驗作答（MCQ/是非/簡答）與結果頁 | ✅ P3 |
| 錯題本（自動記錄、標記解決） | ✅ P3 |
| 讀書計畫（週視圖行事曆、完成/略過） | ✅ P3 |
| 進度頁面（各科統計） | ✅ P3 |
| Supabase Auth（登入/登出/註冊） | ✅ P4 |
| AI Gateway Edge Function（NVIDIA） | ✅ P4 |
| AI 導師（TutorPage 接 AI） | ✅ P4 |
| AI 計畫生成（前端 service 完成，需部署） | ✅ P4 |
| AI 測驗生成（前端 service 完成，需部署） | ✅ P4 |
| AI 筆記摘要（前端 service 完成，需部署） | ✅ P4 |
| Supabase DB Schema + RLS | ✅ P4 |
| AI 自適應重新規劃 UI | 📋 P5 |
| PDF 上傳 / 匯出 | 📋 P5 |
| 資料匯出 JSON | 📋 P5 |

## 本機開發

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 型別檢查 + 建置
npm run preview    # 預覽 production build
```

## 環境設定

```bash
cp .env.example .env.local
```

| 變數 | 說明 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 專案 URL（瀏覽器安全） |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（瀏覽器安全） |
| `NVIDIA_API_KEY` | ⚠️ 只設定在 Supabase Edge Function secrets，絕對不要加 VITE_ 前綴 |
| `NVIDIA_BASE_URL` | NVIDIA API base URL（Edge Function 環境變數） |
| `NVIDIA_MODEL` | 要使用的模型 ID（Edge Function 環境變數） |

## 部署 AI Gateway

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入並連結專案
supabase login
supabase link --project-ref <your-project-ref>

# 設定 secrets（絕對不要 commit）
supabase secrets set NVIDIA_API_KEY=your-key
supabase secrets set NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
supabase secrets set NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# 部署 Edge Function
supabase functions deploy ai-gateway
```

## 資料庫 Migrations

```bash
supabase db push    # 套用 supabase/migrations/ 裡的所有 migration
```

## 目前模式

- **有 Supabase 設定**：登入後雲端同步，AI 功能全開
- **無 Supabase 設定**：本機示範模式，IndexedDB 儲存，AI 功能顯示引導提示

## 技術堆疊

- **前端：** React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4
- **路由：** React Router v7
- **資料：** TanStack Query + IndexedDB (idb) / Supabase Postgres + RLS
- **驗證：** Zod
- **Auth：** Supabase Auth
- **AI：** NVIDIA API via Supabase Edge Function（server-side only）
