# 值班排程系統 (Duty Schedule)

https://tfd10507.github.io/roster/
一個基於 Angular 16 開發的值班排程管理系統，支援「一般值班」與「UAT 測資小天使」兩種模式，並採用 Google Calendar 風格的直覺介面，讓排班管理更高效。

## 🔍 痛點分析
過去值班人員與測資小天使的排程需人工在 Excel 修改，不僅繁瑣且耗時，還難以快速查看某個時間點由誰負責。

因此，本系統的開發目標是：

1. 自動排班：減少人工操作，降低錯誤率。
2. 隨時查看：不受限於公司網路或裝置，選擇使用 GitHub Pages 部署，確保在任何地方都能存取（若放在公司伺服器則僅限內網使用）。

## ⚠️ 開發困難
原本計劃加入「調換值班順序」功能，以應對臨時交換或兩種值班撞期的情況。
但因為系統部署在個人 GitHub Pages，無法使用資料庫，只能依賴 LocalStorage。
導致資料僅能保存在同一瀏覽器，跨裝置或瀏覽器時無法同步，因此該功能最終未能實現。

(未來如果大家覺得更換排班順序這個功能比較重要，會嘗試能不能看看部屬在dx07上，用讀檔案的方式實現)

## 功能特色

- 📅 **Google Calendar 風格介面** - 直觀的月曆檢視
- 👥 **雙重值班模式** - 支援一般值班和 UAT 測資值班
- 🎨 **視覺化顯示** - 不同人員有不同顏色標示
- 🔄 **自動輪替** - 智能的值班人員循環排程

## 部署到 GitHub Pages

### 前置條件

1. 確保您有 GitHub 帳號
2. 安裝 Git 和 Node.js

### 部署步驟

#### 1. 建立 GitHub Repository

1. 登入 GitHub 並建立新的 repository
2. Repository 名稱建議為 `duty-schedule`
3. 設為 Public（GitHub Pages 需要）

#### 2. 推送程式碼到 GitHub

在專案根目錄執行以下命令：

```bash
# 初始化 Git repository（如果尚未初始化）
git init

# 添加 GitHub remote origin（替換成您的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/duty-schedule.git

# 設定主分支名稱
git branch -M main

# 添加所有檔案
git add .

# 提交變更
git commit -m "Initial commit: 值班排程系統"

# 推送到 GitHub
git push -u origin main
```

#### 3. 啟用 GitHub Pages

1. 在 GitHub repository 頁面，點擊 **Settings**
2. 在左側選單找到 **Pages**
3. 在 **Source** 選擇 **GitHub Actions**
4. 系統會自動偵測到 `.github/workflows/deploy.yml` 檔案

#### 4. 自動部署

當您推送程式碼到 `main` 分支時：

1. GitHub Actions 會自動觸發
2. 系統會建置 Angular 應用程式
3. 建置完成後會自動部署到 GitHub Pages
4. 您的網站將可在以下網址存取：
   `https://YOUR_USERNAME.github.io/duty-schedule/`

### 手動部署（可選）

如果您想要手動部署，可以執行：

```bash
npm run deploy
```

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm start

# 建置生產版本
npm run build:prod
```

## 使用說明

1. **切換值班模式**：點擊頂部的按鈕可在一般值班和 UAT 測資值班間切換
2. **查看人員清單**：點擊「顯示人員清單」查看所有值班人員
3. **月份導航**：使用左右箭頭切換月份

## 技術棧

- **Angular 16** - 前端框架
- **angular-calendar** - 日曆組件
- **date-fns** - 日期處理
- **SCSS** - 樣式設計
- **GitHub Actions** - CI/CD 自動部署
- **GitHub Pages** - 靜態網站託管

## 原始 Angular CLI 資訊

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
