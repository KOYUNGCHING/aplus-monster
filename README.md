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
| 進度頁面（各科統計、弱點分析） | ✅ P3 |
| Supabase Auth（登入/登出/註冊） | ✅ P4 |
| AI Gateway Edge Function（NVIDIA） | ✅ P4 |
| AI 導師（即時問答，課程限定範圍） | ✅ P4 |
| Supabase DB Schema + RLS migrations | ✅ P4 |
| AI 計畫生成（草稿→審核→套用） | ✅ P5 |
| AI 測驗生成（草稿→審核→儲存） | ✅ P5 |
| AI 筆記摘要（草稿→審核→加入筆記） | ✅ P5 |
| AI 自適應重新規劃（弱點分析→建議行程） | ✅ P5 |
| 資料匯出 JSON | ✅ P5 |
| 清除本機資料 | ✅ P5 |

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
# 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
```

| 變數 | 說明 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 專案 URL（瀏覽器安全） |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（瀏覽器安全） |
| `NVIDIA_API_KEY` | ⚠️ 只設定在 Edge Function secrets，絕對不要加 VITE_ 前綴 |
| `NVIDIA_BASE_URL` | NVIDIA API base URL |
| `NVIDIA_MODEL` | 要使用的模型 ID |

## 部署 AI Gateway

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# 設定 secrets（絕對不要 commit）
supabase secrets set NVIDIA_API_KEY=your-key
supabase secrets set NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
supabase secrets set NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# 套用 DB migrations
supabase db push

# 部署 Edge Function
supabase functions deploy ai-gateway
```

## 兩種模式

| 情境 | 說明 |
|---|---|
| **有 Supabase** | 登入後雲端同步，全部 AI 功能開啟 |
| **無 Supabase** | 本機示範模式，IndexedDB 儲存，AI 功能顯示引導提示 |

## AI 功能一覽

| 功能 | 入口 | 說明 |
|---|---|---|
| AI 計畫生成 | 讀書計畫 → ✨ AI 生成計畫 | 根據課程/截止日生成週計畫草稿 |
| AI 測驗生成 | 測驗庫 → ✨ AI 出題 | 根據主題/筆記出 MCQ/是非/簡答 |
| AI 筆記摘要 | 筆記 → ✨ AI 整理 | 整理筆記為結構化重點摘要 |
| AI 導師 | AI 導師頁面 | 課程限定範圍 Q&A |
| AI 自適應重新規劃 | 進度 → ✨ AI 建議調整計畫 | 根據錯題弱點建議額外複習行程 |

所有 AI 功能均為「草稿 → 使用者審核 → 確認儲存」flow，AI 不會直接修改任何資料。

## 技術堆疊

- **前端：** React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4
- **路由：** React Router v7
- **資料：** TanStack Query + IndexedDB (idb) / Supabase Postgres + RLS
- **驗證：** Zod
- **Auth：** Supabase Auth
- **AI：** NVIDIA API via Supabase Edge Function（server-side only）
