import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ⚠️ 重要：請前往 Firebase Console 建立專案並取得您自己的配置
// 步驟：
// 1. 前往 https://console.firebase.google.com/
// 2. 建立新專案（或使用現有專案）
// 3. 啟用 Firestore Database
// 4. 在專案設定中找到您的網頁應用程式配置
// 5. 將下方的範例配置替換為您自己的配置

const firebaseConfig = {
  // 請替換為您自己的 Firebase 專案配置
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id-here",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id-here"
};

// 檢查是否已正確配置
if (firebaseConfig.apiKey === "your-api-key-here") {
  console.warn('⚠️ 請先設定 Firebase 配置！請查看 firebase.config.ts 檔案中的說明。');
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore
export const db = getFirestore(app);