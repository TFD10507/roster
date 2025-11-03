# 🚀 Roster | 智慧雲端值班排程系統

[![Angular](https://img.shields.io/badge/Angular-16-DD0031.svg?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg?logo=firebase)](https://firebase.google.com/products/firestore)
[![Angular Material](https://img.shields.io/badge/Angular_Material-16-673AB7.svg)](https://material.angular.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 一個現代化的值班排程管理系統，採用 **Angular 16** + **Firebase Firestore** 架構，提供雙重值班模式、即時資料同步、智能衝突檢測與完整的異動歷程追蹤。透過 **Angular Material** 打造專業的使用者介面，取代傳統 Excel 人工排班的繁瑣流程。

## 🌐 線上體驗

點擊以下連結，立即體驗智慧排班的視覺化管理功能：

[**前往線上 DEMO 站點**](https://tfd10507.github.io/roster/)

---

## 🎯 專案背景

### 🔍 解決的核心痛點
- **人工管理效率低下**：傳統使用 Excel 管理值班與測資小天使排程，修改繁瑣且容易出錯
- **資料同步困難**：團隊成員無法即時查看最新的排班異動
- **缺乏追蹤機制**：排班變更缺乏記錄，難以追溯和管理
- **衝突檢測缺失**：無法自動檢測雙重值班模式間的人員衝突

---

## ✨ 核心功能與技術亮點

### 🎯 主要功能模組

#### 1. **智能雙模式排班系統**
- **一般值班**：12 人輪值，7 天週期循環排班
- **UAT 測資小天使**：14 人輪值，14 天 Sprint 週期排班
- **獨立管理**：兩種排程完全獨立，支援一鍵切換檢視
- **自動計算**：基於設定的人員順序和起始日期自動產生排程

#### 2. **專業值班異動介面** 🆕
- **Material Dialog 設計**：取代傳統 alert/prompt，提供專業操作體驗
- **視覺化人員選擇**：Radio Button 介面，每位成員有專屬顏色標識
- **智能範圍選擇**：支援單日異動或整個週期異動
- **異動原因記錄**：選填式原因輸入，支援 200 字描述
- **即時預覽確認**：變更前後對比展示，確保操作正確性

#### 3. **完整異動歷程追蹤** 🆕
- **詳細記錄**：追蹤每次異動的時間、人員、原因、操作者
- **多維度篩選**：按值班類型、人員、日期範圍篩選歷程
- **排序功能**：支援按異動時間、日期、人員等多種排序方式
- **分頁顯示**：大量記錄的友善瀏覽體驗
- **復原機制**：支援軟刪除和復原異動記錄

#### 4. **智能衝突檢測系統**
- **自動掃描**：即時檢測同一人員在兩種值班模式下的重疊
- **三級預警機制**：
  - 🔴 **嚴重警告**：7 天內的衝突，需立即處理
  - 🟡 **中度提醒**：8-30 天內的衝突，建議調整
  - 🟢 **安全狀態**：30 天內無衝突
- **視覺化標示**：在日曆上直接標示衝突日期和等級

#### 5. **即時協作與同步**
- **多人同時使用**：支援團隊成員同時查看和編輯
- **即時資料同步**：任何異動立即同步至所有使用者
- **離線支援**：支援基本的離線瀏覽功能
- **雲端備份**：所有資料自動備份至 Firebase

### 🏗️ 系統架構特色

| 層級 | 技術選型 | 核心優勢 |
|:-----|:---------|:---------|
| **前端框架** | Angular 16 + TypeScript 5.0 | 強型別檢查、響應式程式設計 |
| **UI 組件庫** | Angular Material 16 | 專業 Material Design 介面 |
| **雲端資料庫** | Firebase Firestore | 即時同步、離線支援、無伺服器架構 |
| **日曆視覺化** | angular-calendar + date-fns | Google Calendar 風格的排程展示 |
| **狀態管理** | RxJS BehaviorSubject | 響應式資料流管理 |

---

## 🛠️ 技術實作詳解

### 📱 響應式使用者介面
```typescript
// 核心組件架構
├── DutyCalendarComponent     // 主要日曆檢視與排班邏輯
├── DutyChangeDialogComponent // Material Dialog 值班異動介面  
├── DutyHistoryComponent      // 異動歷程管理與篩選
└── DutyDatabaseService       // Firebase 資料存取層
```

### � Firebase 整合架構
```typescript
// 資料模型設計
interface DutyChange {
  id: string;
  date: string;              // 異動日期 (YYYY-MM-DD)
  originalPerson: string;    // 原值班人員
  newPerson: string;         // 新值班人員
  dutyType: 'normal' | 'uat';// 值班類型
  changedBy: string;         // 操作人員
  changedAt: Timestamp;      // 異動時間
  reason?: string;           // 異動原因
}

interface DutySettings {
  normalDutyOrder: string[]; // 一般值班人員順序
  uatDutyOrder: string[];    // UAT 值班人員順序
  lastUpdated: Timestamp;    // 最後更新時間
  updatedBy: string;         // 更新人員
}
```

### 🎨 視覺化設計特色
- **人員色彩系統**：12 位值班人員各有專屬色彩，提升視覺辨識度
- **即時同步指示**：載入動畫和狀態提示，讓使用者了解資料同步狀態
- **衝突視覺警示**：不同等級的衝突使用不同顏色和圖示標示
- **響應式佈局**：支援桌面、平板、手機等多種裝置

### ⚡ 效能最佳化
- **RxJS 響應式資料流**：使用 BehaviorSubject 管理狀態，避免不必要的重新渲染
- **Firebase 即時監聽**：只訂閱必要的資料集合，減少網路傳輸
- **分頁載入**：異動歷程採用分頁機制，避免大量資料影響效能
- **快取機制**：本地快取常用資料，提升使用者體驗

---

## 🚀 快速開始

### 📋 環境要求
- **Node.js** 16+ (建議使用 LTS 版本)
- **npm** 8+ 或 **yarn** 1.22+
- **Git** (用於專案克隆)
- **現代瀏覽器** (Chrome 90+、Firefox 90+、Safari 14+、Edge 90+)

### ⚡ 安裝步驟

```powershell
# 1. 克隆專案儲存庫
git clone https://github.com/TFD10507/roster.git
cd roster

# 2. 安裝專案相依套件
npm install

# 3. Firebase 設定 (必要步驟)
# 請參考 Firebase_Setup_Guide.md 完成以下設定：
# - 建立 Firebase 專案
# - 啟用 Firestore Database
# - 取得並配置 Firebase 金鑰
# - 設定 Firestore 安全規則

# 4. 啟動開發伺服器
npm start
```

瀏覽器會自動開啟 `http://localhost:4200/`，即可開始使用！

### 🔧 可用指令

| 指令 | 描述 | 使用場景 |
|:-----|:-----|:---------|
| `npm start` | 啟動開發伺服器 | 本地開發與測試 |
| `npm run build` | 建置開發版本 | 功能驗證 |
| `npm run build:prod` | 建置生產版本 | 正式部署 |
| `npm test` | 執行單元測試 | 程式碼品質確保 |
| `npm run deploy` | 部署至 GitHub Pages | 快速線上展示 |

### 🔑 首次使用設定

1. **配置 Firebase**：依照 `Firebase_Setup_Guide.md` 完成雲端資料庫設定
2. **初始化人員清單**：在系統中設定值班人員名單和順序
3. **設定起始日期**：指定排班計算的基準日期
4. **驗證功能**：測試值班異動和歷程記錄功能

### 📱 系統操作指南

#### 基本操作
1. **檢視排程**：主畫面顯示當月值班安排
2. **切換模式**：使用頂部按鈕在「一般值班」與「UAT測資小天使」間切換
3. **查看衝突**：系統自動標示並提醒值班衝突

#### 值班異動
1. **點擊日期**：點擊任何值班日期開啟異動對話框
2. **選擇人員**：使用 Radio Button 選擇新的值班人員
3. **設定範圍**：選擇單日異動或整個週期異動
4. **填寫原因**：（選填）輸入異動原因供後續追蹤
5. **確認變更**：檢視預覽後確認異動

#### 歷程管理
1. **檢視歷程**：點擊「異動歷史」查看所有變更記錄
2. **篩選資料**：按值班類型、人員、日期篩選歷程
3. **匯出記錄**：（規劃中）支援匯出異動記錄為 Excel

---

## 📁 專案結構

```
roster/
├── 📄 README.md                    # 專案說明文件
├── 📄 Firebase_Setup_Guide.md      # Firebase 設定指南
├── 📄 DIALOG_FEATURES.md          # Dialog 功能特色說明
├── 📄 package.json                # 專案相依套件設定
├── 📄 angular.json                # Angular 專案配置
├── 📄 tsconfig.json               # TypeScript 編譯設定
└── 📁 src/
    ├── 📄 index.html              # 應用程式進入點
    ├── 📄 main.ts                 # Angular 啟動檔案
    ├── 📄 styles.scss             # 全域樣式定義
    └── 📁 app/
        ├── 📄 app.module.ts                    # 主要模組定義
        ├── 📄 app-routing.module.ts            # 路由設定
        ├── 📄 app.component.*                  # 根組件
        ├── 📁 duty-calendar/                   # 🗓️ 主要日曆檢視
        │   ├── 📄 duty-calendar.component.ts   # 排班邏輯與日曆操作
        │   ├── 📄 duty-calendar.component.html # 日曆樣板
        │   └── 📄 duty-calendar.component.scss # 日曆樣式
        ├── 📁 duty-change-dialog/              # 💬 值班異動對話框
        │   ├── 📄 duty-change-dialog.component.ts   # Dialog 邏輯
        │   ├── 📄 duty-change-dialog.component.html # Dialog 樣板
        │   └── 📄 duty-change-dialog.component.scss # Dialog 樣式
        ├── 📁 duty-history/                    # 📋 異動歷程管理
        │   ├── 📄 duty-history.component.ts    # 歷程檢視與篩選
        │   ├── 📄 duty-history.component.html  # 歷程樣板
        │   └── 📄 duty-history.component.scss  # 歷程樣式
        ├── 📁 services/                        # 🔧 核心服務
        │   ├── 📄 duty-database.service.ts     # Firebase 資料存取
        │   └── 📄 firebase.config.ts           # Firebase 設定檔
        └── 📁 shared/                          # 🛠️ 共用工具
            └── 📄 filter.pipe.ts               # 資料篩選管道
```

### 🎯 核心檔案說明

| 檔案/目錄 | 職責 | 主要功能 |
|:----------|:-----|:---------|
| **duty-calendar/** | 主要排程檢視 | 日曆渲染、排班計算、衝突檢測 |
| **duty-change-dialog/** | 值班異動介面 | Material Dialog、人員選擇、範圍設定 |
| **duty-history/** | 歷程管理 | 異動記錄、多維篩選、分頁顯示 |
| **duty-database.service** | 資料存取層 | Firebase CRUD、即時同步、資料模型 |
| **firebase.config** | 雲端設定 | Firebase 連線設定與初始化 |

---

## 🤝 開發與貢獻

### 🔄 開發流程

1. **Fork 專案**：建立自己的專案分支
2. **建立功能分支**：`git checkout -b feature/新功能名稱`
3. **開發與測試**：確保新功能正常運作
4. **提交變更**：`git commit -m "feat: 新增功能描述"`
5. **推送分支**：`git push origin feature/新功能名稱`
6. **建立 Pull Request**：提交程式碼審查請求

### 📝 程式碼規範

- **TypeScript**：使用嚴格模式，確保型別安全
- **Angular Style Guide**：遵循 Angular 官方風格指南
- **RxJS Best Practices**：適當使用響應式程式設計模式
- **Material Design**：保持一致的 UI/UX 設計語言

### 🧪 測試策略

- **單元測試**：使用 Jasmine + Karma 測試組件邏輯
- **整合測試**：測試 Firebase 資料存取功能
- **E2E 測試**：（規劃中）使用 Cypress 測試完整使用者流程

### 🚀 版本發布

本專案採用語義化版本控制（Semantic Versioning）：
- **主要版本（Major）**：重大功能變更或 Breaking Changes
- **次要版本（Minor）**：新功能新增，向後相容
- **修補版本（Patch）**：錯誤修正和小幅改進

---

## 📞 技術支援與聯絡

### 👥 開發團隊
- **主要開發者**：[TFD10507](https://github.com/TFD10507) - 系統架構與核心功能
- **貢獻者**：[Tzuchi-lin](https://github.com/Tzuchi-lin) - UI/UX 設計與測試

### 🐛 問題回報
如遇到系統問題，請透過以下方式回報：
1. **GitHub Issues**：[建立新的 Issue](https://github.com/TFD10507/roster/issues)
2. **功能建議**：使用 Feature Request 模板
3. **錯誤回報**：使用 Bug Report 模板，請提供詳細的重現步驟

### 📖 相關資源
- **Firebase 官方文件**：[https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Angular Material**：[https://material.angular.io](https://material.angular.io)
- **Angular Calendar**：[https://mattlewis92.github.io/angular-calendar](https://mattlewis92.github.io/angular-calendar)

---

## 📄 許可證

本專案採用 [MIT License](LICENSE) 授權條款。

```
MIT License

Copyright (c) 2024 TFD10507

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## ⭐ 如果這個專案對您有幫助，請給我們一顆星星！

[![GitHub stars](https://img.shields.io/github/stars/TFD10507/roster.svg?style=social&label=Star)](https://github.com/TFD10507/roster)
