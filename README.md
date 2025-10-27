# 🗓️ 值班排程系統 (Duty Schedule System)

[![Angular](https://img.shields.io/badge/Angular-16-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**線上體驗：** https://tfd10507.github.io/roster/

一個基於 Angular 16 開發的值班排程系統，支援**一般值班**與**UAT 測資小天使**，採用 Google Calendar 風格的直覺介面，讓值班管理更高效、更智能。

## 🎯 專案背景

### 🔍 解決的痛點
- **人工管理效率低**：過去值班人員與測資小天使的排程需人工在 Excel 修改，繁瑣且耗時
- **查詢不便**：難以快速查看某個時間點由誰負責
- **錯誤率高**：人工排班容易產生衝突和遺漏

### 💡 解決方案
1. **自動化排班**：智能循環分配，減少人工操作，降低錯誤率
2. **即時查看**：Web 介面隨時存取，不受限於公司網路或特定裝置
3. **衝突檢測**：自動檢查兩種值班模式的衝突，提前預警
4. **視覺化管理**：直觀的月曆檢視，一目了然

### 🔧 設計限制與考量

- 原本計劃加入「調換值班順序」功能，以應對臨時交換或兩種值班撞期的情況。
但因為系統部署在個人 GitHub Pages，無法使用資料庫，只能依賴 LocalStorage。
導致資料僅能保存在同一瀏覽器，跨裝置或瀏覽器時無法同步，因此該功能最終未能實現。

**未來改進方向**
- 考慮部署至支援後端的平台 (如內部伺服器)
- 加入檔案讀寫功能實現排班調整
- 增加更多客製化排班規則

## ✨ 核心功能

### 🔄 雙重值班模式
- **一般值班**：12人輪值，以週為單位 (7天)
- **UAT測資小天使**：14人輪值，以Sprint為單位 (14天)
- 兩種模式獨立運作，可快速切換查看

### 🎨 智能視覺化
- **Google Calendar 風格**：熟悉的月曆介面
- **色彩區分**：每位同事擁有獨特的顏色標識
- **即時切換**：一鍵切換值班模式檢視
- **人員圖例**：清楚顯示所有值班人員及其顏色

### ⚠️ 衝突檢測系統
- **自動檢測**：自動檢查同一人在同一天的雙重排班衝突
- **智能提醒**：
  - 🔴 **14天內衝突**：彈出 Alert 警告
  - 🟡 **遠期衝突**：Toast 輕量提醒
  - 🟢 **無衝突**：安心提示
- **前瞻性預警**：檢查未來3個月的潛在衝突

### 🚀 操作功能
- **月份導航**：上一月/下一月/今天按鈕
- **模式切換**：一鍵切換一般值班與UAT測資值班
- **人員清單**：顯示當前模式的所有值班人員
- **衝突檢查**：手動觸發衝突檢測

## 🛠️ 技術架構

### 核心技術棧
- **前端框架**：Angular 16
- **日曆組件**：angular-calendar ^0.31.1
- **日期處理**：date-fns ^4.1.0
- **樣式語言**：SCSS
- **語言版本**：TypeScript 5.0.2
- **狀態管理**：Component State (無後端資料庫)

### 開發工具
- **建置工具**：Angular CLI 16.0.4
- **測試框架**：Jasmine + Karma
- **部署平台**：GitHub Pages

## ⚙️ 安裝與執行

### 環境需求
- Node.js 16+ 
- npm 或 yarn
- Git

### 快速開始

```bash
# clone專案
git clone https://github.com/TFD10507/roster.git
cd roster

# 安裝相依套件
npm install

# 啟動開發伺服器
npm start
# 或
ng serve

# 瀏覽器開啟 http://localhost:4200
```

### 建置與部署

```bash
# 建置生產版本
npm run build:prod

# 手動部署到 GitHub Pages
npm run deploy
```

## 📋 使用指南

### 基本操作
1. **切換值班模式**：點擊頂部「切換到 xxx」按鈕
2. **導航月份**：使用 ← 上一月、下一月 →、今天按鈕
3. **查看人員**：點擊「值班人員清單」查看當前模式所有成員
4. **檢查衝突**：點擊「檢查衝突」手動檢測排班衝突

### 排班邏輯
- **一般值班**：週循環制，每7天自動切換下一位
- **UAT測資**：Sprint循環制，每14天自動切換下一位
- **特殊安排**：系統內建特定時段的人員交換安排

### 衝突處理
- 系統會自動在載入時檢查近期衝突
- 切換月份時進行靜默檢查
- 手動點擊「檢查衝突」可重新掃描

## 📖 專案結構

```
roster/
├── src/
│   ├── app/
│   │   ├── duty-calendar/          # 主要日曆組件
│   │   │   ├── duty-calendar.component.ts   # 核心業務邏輯
│   │   │   ├── duty-calendar.component.html # UI 模板
│   │   │   └── duty-calendar.component.scss # 樣式定義
│   │   ├── app.component.*         # 根組件
│   │   └── app.module.ts          # 模組配置
│   ├── index.html                 # 入口頁面
│   ├── main.ts                   # 應用啟動點
│   └── styles.scss               # 全域樣式
├── angular.json                  # Angular 配置
├── package.json                  # 專案依賴
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 專案說明
```

## 🚀 部署到 GitHub Pages

## 🚀 部署到 GitHub Pages

### 前置條件
- GitHub 帳號
- Git 已安裝
- Node.js 16+ 已安裝

### 部署步驟

#### 1️⃣ Fork 或clone專案
```bash
# 方法一：clone此專案
git clone https://github.com/TFD10507/roster.git
cd roster

# 方法二：Fork 後clone你的版本
git clone https://github.com/YOUR_USERNAME/roster.git
cd roster
```

#### 2️⃣ 建立 GitHub Pages 部署檔案
建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build:prod
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/duty-schedule
```

#### 3️⃣ 推送程式碼
```bash
# 添加所有檔案
git add .

# 提交變更
git commit -m "Initial commit: 值班排程系統"

# 推送到 GitHub
git push origin main
```

#### 4️⃣ 啟用 GitHub Pages
1. 前往你的 GitHub Repository 設定頁面
2. 點選左側選單的 **Pages**
3. 在 **Source** 選擇 **GitHub Actions**
4. 系統會自動偵測 workflow 檔案並開始部署

#### 5️⃣ 存取你的網站
部署完成後，你的網站將可在以下網址存取：
```
https://YOUR_USERNAME.github.io/roster/
```

### 手動部署 (選用)
```bash
# 快速部署指令
npm run deploy
```

## 🛠️ 開發指南

### 本地開發環境

### 本地開發環境

```bash
# 安裝專案依賴
npm install

# 啟動開發伺服器 (http://localhost:4200)
npm start
# 或使用 Angular CLI
ng serve

# 建置生產版本
npm run build:prod

# 執行單元測試
npm test

# 執行 E2E 測試 (需先安裝測試套件)
ng e2e
```

### 程式碼結構說明

#### 核心組件：`DutyCalendarComponent`
- **位置**：`src/app/duty-calendar/`
- **功能**：主要業務邏輯，包含排班計算、衝突檢測、UI 控制

#### 重要方法：
- `generateNormalSchedule()`：生成一般值班排程
- `generateUATSchedule()`：生成 UAT 測資排程  
- `findDutyConflicts()`：檢測排班衝突
- `switchDutyType()`：切換值班模式

#### 資料結構：
```typescript
interface DutyPerson {
  name: string;
  color: { primary: string; secondary: string; };
}

interface DutyEvent extends CalendarEvent {
  dutyPerson: string;
}
```

### 自訂功能開發

#### 添加新的值班人員
1. 修改 `dutyPeople` 或 `uatDutyPeople` 陣列
2. 為新人員定義獨特的顏色配置
3. 調整排班邏輯以包含新成員

#### 修改輪值週期
1. 一般值班：修改 `generateNormalSchedule()` 中的週計算邏輯
2. UAT 值班：修改 `generateUATSchedule()` 中的 Sprint 計算邏輯

#### 自訂排班規則
在 `dutySchedule` 或 `uatSchedule` 陣列中添加特殊時段安排：
```typescript
const dutySchedule = [
  { startDate: new Date(2025, 10, 1), endDate: new Date(2025, 10, 7), person: 'Nico' },
  // 添加更多特殊安排...
];
```

## 📝 版本資訊

### 當前版本：v1.0.0

#### 主要特性
- ✅ 雙重值班模式支援
- ✅ 自動排班計算
- ✅ 視覺化月曆介面  
- ✅ 智能衝突檢測
- ✅ 響應式設計
- ✅ GitHub Pages 部署

#### 技術規格
- Angular 16.0.0
- TypeScript 5.0.2
- angular-calendar 0.31.1
- date-fns 4.1.0

## 🤝 貢獻指南

### 如何貢獻
1. Fork 此專案
2. 建立功能分支：`git checkout -b feature/amazing-feature`
3. 提交變更：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 開啟 Pull Request

### 開發規範
- 遵循 Angular 編碼風格指南
- 提交前執行 `npm test` 確保測試通過
- 新增功能請包含適當的註解和文檔

## 👨‍💻 開發團隊

- **主要開發者**：[TFD10507](https://github.com/TFD10507)
- **貢獻者**：[Tzuchi-lin](https://github.com/Tzuchi-lin)

---

## 🔧 Angular CLI 參考資訊

<details>
<summary>點擊展開 Angular CLI 說明</summary>

### Development server
執行 `ng serve` 啟動開發伺服器，瀏覽器開啟 `http://localhost:4200/`，當您修改任何原始檔案時，應用程式會自動重新載入。

### Code scaffolding
執行 `ng generate component component-name` 來產生新的組件。您也可以使用 `ng generate directive|pipe|service|class|guard|interface|enum|module`。

### Build
執行 `ng build` 來建置專案，建置產物會儲存在 `dist/` 目錄中。

### Running unit tests
執行 `ng test` 透過 [Karma](https://karma-runner.github.io) 執行單元測試。

### Running end-to-end tests
執行 `ng e2e` 來執行端到端測試。使用此指令前，您需要先新增實作端到端測試功能的套件。

### Further help
要獲得更多 Angular CLI 使用說明，請使用 `ng help` 或查看 [Angular CLI Overview and Command Reference](https://angular.io/cli) 頁面。

</details>


