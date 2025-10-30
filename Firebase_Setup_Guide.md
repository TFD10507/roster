# Firebase 值班系統整合指南

## 🚀 功能特色

- ✅ **即時同步**：所有團隊成員的值班異動會立即同步
- ✅ **異動記錄**：完整的值班異動歷史追蹤
- ✅ **雲端儲存**：值班人員順序和異動記錄儲存在雲端
- ✅ **多人協作**：支援多人同時使用和編輯

## 📋 Firebase 設定步驟

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱（例如：`roster-system`）
4. 選擇是否啟用 Google Analytics（可選）
5. 完成專案建立

### 2. 啟用 Firestore Database

1. 在 Firebase Console 中，點擊左側選單的「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」（暫時）
4. 選擇資料庫位置（建議選擇 `asia-east1` 或 `asia-southeast1`）

### 3. 取得專案配置

1. 在 Firebase Console 中，點擊專案設定齒輪圖示
2. 向下捲動到「您的應用程式」區域
3. 點擊「網頁」圖示（`</>`）
4. 輸入應用程式暱稱（例如：`roster-web`）
5. **不要**勾選「同時為此應用程式設定 Firebase Hosting」
6. 點擊「註冊應用程式」
7. 複製 `firebaseConfig` 物件

### 4. 更新本地配置

將複製的配置貼到 `src/app/services/firebase.config.ts` 檔案中：

```typescript
const firebaseConfig = {
  apiKey: "您的-api-key",
  authDomain: "您的專案.firebaseapp.com",
  projectId: "您的專案-id",
  storageBucket: "您的專案.appspot.com",
  messagingSenderId: "您的-sender-id",
  appId: "您的-app-id"
};
```

### 5. 設定 Firestore 安全規則（重要！）

在 Firebase Console 的 Firestore Database 中，點擊「規則」標籤，將規則改為：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許讀寫 dutyChanges 集合
    match /dutyChanges/{document} {
      allow read, write: if true;
    }
    
    // 允許讀寫 dutySettings 集合
    match /dutySettings/{document} {
      allow read, write: if true;
    }
  }
}
```

**注意**：這是測試用的開放規則，正式環境建議加入使用者驗證和更嚴格的權限控制。

## 🎯 使用方式

### 基本功能

1. **查看值班表**：系統會自動顯示當月的值班安排
2. **切換模式**：可在「一般值班」和「UAT測資小天使」之間切換
3. **檢查衝突**：自動檢查並提醒值班衝突

### 異動值班

1. **點擊日期**：點擊任何一天的值班人員
2. **選擇新人員**：從彈出的清單中選擇新的值班人員
3. **輸入原因**：（選填）輸入異動原因
4. **自動儲存**：異動會立即儲存到雲端並同步給所有使用者

### 查看異動歷史

1. 點擊「異動歷史」按鈕
2. 查看最近 10 筆值班異動記錄
3. 包含異動時間、原因、操作人員等資訊

### 儲存人員順序

1. 點擊「儲存順序」按鈕
2. 將當前的人員順序儲存到雲端
3. 其他使用者會自動同步新的人員順序

## 🔧 資料結構

### DutyChange（值班異動）
```typescript
{
  id: string;           // 唯一識別碼
  date: string;         // 異動日期 (YYYY-MM-DD)
  originalPerson: string; // 原值班人員
  newPerson: string;    // 新值班人員
  dutyType: 'normal' | 'uat'; // 值班類型
  changedBy: string;    // 操作人員
  changedAt: Timestamp; // 異動時間
  reason?: string;      // 異動原因（選填）
}
```

### DutySettings（值班設定）
```typescript
{
  normalDutyOrder: string[];  // 一般值班人員順序
  uatDutyOrder: string[];     // UAT值班人員順序
  lastUpdated: Timestamp;     // 最後更新時間
  updatedBy: string;          // 更新人員
}
```

## 🚨 注意事項

1. **網路連線**：需要穩定的網路連線才能正常同步
2. **瀏覽器支援**：建議使用 Chrome、Firefox、Safari 或 Edge 的最新版本
3. **資料備份**：Firebase 會自動備份資料，但建議定期匯出重要資料
4. **費用**：Firebase 免費方案對小團隊已足夠，如需更大容量請參考 Firebase 定價

## 📞 支援

如有任何問題，請聯絡系統管理員或查看 Firebase 官方文件。