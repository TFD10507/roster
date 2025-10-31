import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

// ⚠️ 重要：請前往 Firebase Console 建立專案並取得您自己的配置
// 步驟：
// 1. 前往 https://console.firebase.google.com/
// 2. 建立新專案（或使用現有專案）
// 3. 啟用 Firestore Database
// 4. 在專案設定中找到您的網頁應用程式配置
// 5. 將下方的範例配置替換為您自己的配置

const firebaseConfig = {
  apiKey: "AIzaSyDQXHBX_qTnuRdwp-3IgVe2_VZIs1MwyW8",
  authDomain: "roster-c875a.firebaseapp.com",
  projectId: "roster-c875a",
  storageBucket: "roster-c875a.firebasestorage.app",
  messagingSenderId: "547478016913",
  appId: "1:547478016913:web:7c1fd9bc35d353f24b8030",
  measurementId: "G-WYPSH8KWET"
};

// 檢查是否已正確配置
if (firebaseConfig.apiKey === "AIzaSyDQXHBX_qTnuRdwp-3IgVe2_VZIs1MwyW8") {
  console.warn('⚠️ 請先設定 Firebase 配置！請查看 firebase.config.ts 檔案中的說明。');
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// 初始化 Firestore
export const db = getFirestore(app);