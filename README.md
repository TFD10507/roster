# 🚀 Roster | 智慧雲端值班排程系統

[![Angular](https://img.shields.io/badge/Angular-16-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[](https://firebase.google.com/products/firestore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 一個基於 Angular 16 開發，結合 **雲端資料庫** 實現資料持久化的值班排程管理系統。採用 **Google Calendar 風格**介面與 **Angular Material** 組件，提供雙重值班模式、彈性排班調整及完整的修改歷程記錄。

## 🌐 線上體驗

點擊以下連結，立即體驗智慧排班的視覺化管理功能：

[**前往線上 DEMO 站點**](https://tfd10507.github.io/roster/)

-----

## 🎯 專案背景

### 🔍 解決的痛點
- **人工管理效率低**：過去值班人員與測資小天使的排程需人工在 Excel 修改，繁瑣且耗時
- **查詢不便**：難以快速查看某個時間點由誰負責
- **錯誤率高**：人工排班容易產生衝突和遺漏

-----

## ✨ 專案亮點與核心優勢

透過整合雲端資料庫，本系統已克服單機儲存限制，成為一個功能更強大、更可靠的團隊工具：

| 舊痛點 (Old Pain Point) | 解決方案 (Solution) | 核心優勢 (Key Advantage) |
| :--- | :--- | :--- |
| 🔄 **人工排程繁瑣、易錯** | **自動化循環排班** | 高效且零錯誤率的基礎排班。 |
| ❌ **資料只能存於 LocalStorage** | **整合雲端資料庫** | 實現**跨裝置、跨瀏覽器**的資料同步與持久化。 |
| 🧩 **無法臨時調整排班** | **彈性值班更換功能** | 透過 Material Dialog 實現直覺式的排班交換與修改。 |
| ⚠️ **多種值班模式容易衝突** | **智能雙模式衝突檢測** | 提供紅、黃、綠三級預警，防範排班重疊。 |
| 📝 **缺乏變更記錄難以追溯** | **排班修改歷程 (Audit Log)** | 完整記錄每一次手動調整，確保管理透明化。 |

-----

## 🔑 主要功能

### 1\. 雙重獨立排班模式

  * **一般值班**：12 人輪值，以 **週（7天）** 為單位循環。
  * **UAT 測資小天使**：14 人輪值，以 **Sprint（14天）** 為單位循環。
  * 兩種排程皆儲存在資料庫，並可一鍵切換獨立檢視。

### 2\. 彈性排班調整 (Duty Adjustment) **(New\!)**

  * **值班更換介面**：使用 **Angular Material Dialog** 提供一個直觀的表單，讓管理者快速設定特定日期的值班人員交換或替換。
  * **資料持久化**：所有的手動排班調整，都會即時寫入雲端資料庫，確保所有使用者看到最新的排程。

### 3\. 排班修改歷程 (Audit Log) **(New\!)**

  * **完整記錄**：系統自動追蹤並儲存所有手動調整排班的紀錄。
  * **透明化管理**：提供專門的介面（可使用 Angular Material Table）查看「誰」、「何時」修改了「哪個日期」的「哪種值班」以及「從誰更換為誰」。

### 4\. 智能視覺化日曆

  * **日曆介面**：採用 `angular-calendar` 呈現 Google Calendar 樣式。
  * **色彩區分**：每位值班人員皆有獨特的顏色標識，提高排程辨識度。

### 5\. 排班衝突預警系統

  * **自動掃描**：檢查同一人員在兩種模式下的排班重疊。
  * **三級預警**：🔴 嚴重警告（近期衝突）、🟡 輕量提醒（遠期衝突）、🟢 無衝突提示。

-----

## 🛠️ 技術架構

本專案已升級為一個全端 (Full-stack-like) 解決方案，實現資料持久化。

### 核心技術棧

| 分層 | 技術名稱 | 作用 |
| :--- | :--- | :--- |
| **前端框架** | Angular 16 | 基礎應用程式架構。 |
| **UI 組件** | **Angular Material** | 提供美觀且響應式的 UI 組件，用於值班調整與歷程記錄介面。 |
| **資料持久化**| **Firebase Cloud Firestore** | 儲存排班調整資料與修改歷程，實現資料同步。 |
| **日曆渲染** | `angular-calendar` | 提供 Google Calendar 風格的日曆視圖。 |
| **輔助工具** | TypeScript 5.0.2 / date-fns | 程式碼強型別與日期處理。 |

### 📁 專案結構 (新增資料庫服務)

```
roster/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   └── services/
│   │   │       └── firebase.service.ts  # 資料庫 CRUD 操作
│   │   ├── duty-calendar/              # 主要日曆與排班邏輯
│   │   ├── duty-adjustment/            # 新增：值班更換 Mat Dialog
│   │   └── audit-log/                  # 新增：修改歷程 Mat Table
│   ...
├── Firebase_Setup_Guide.md             # 資料庫環境設置指引 (請參考此文件)
...
```

-----

## ⚙️ 安裝與執行

### 環境要求

  * Node.js (v16+)
  * npm 或 yarn
  * Git

### 快速開始

```bash
# 1. 克隆專案
git clone https://github.com/TFD10507/roster.git
cd roster

# 2. 安裝相依套件 (包含 Angular Material 與 Firebase 相關依賴)
npm install

# 3. **配置 Firebase/Firestore**
# 請根據專案根目錄的 `Firebase_Setup_Guide.md` 文件完成 Firebase 專案設定，
# 並將配置資訊填入您的環境變數或指定檔案中。

# 4. 啟動開發伺服器
npm start 
# 瀏覽器將自動開啟 http://localhost:4200/
```

### 建置與部署

| 指令 | 描述 |
| :--- | :--- |
| `npm run build:prod` | 建置生產版本 (輸出至 `dist/duty-schedule`) |
| `npm run deploy` | 快速部署至 GitHub Pages (如果使用 Firebase，請注意 Pages 僅適用於前端展示) |

-----

## 🤝 貢獻指南

我們歡迎對專案的改進與貢獻！

1.  Fork 此專案。
2.  建立功能分支：`git checkout -b feature/add-new-rule`
3.  提交變更：`git commit -m 'feat: 實作新排班規則邏輯'`
4.  推送分支：`git push origin feature/add-new-rule`
5.  開啟 Pull Request。

### 📝 開發團隊與許可證

  * **主要開發者**：[TFD10507](https://github.com/TFD10507)
  * **貢獻者**：[Tzuchi-lin](https://github.com/Tzuchi-lin)
  * **許可證**：[MIT License](/TFD10507/roster/blob/master/LICENSE)