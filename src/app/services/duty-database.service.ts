import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  where,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DutyChangeHistory {
  originalPerson: string;
  newPerson: string;
  changedBy: string;
  changedAt: Timestamp;
  reason?: string;
}

export interface DutyChange {
  id: string; // 格式: ${date}-${dutyType}
  date: string;
  originalPerson: string; // 最初的原始人員（計算出的預設值班人員）
  newPerson: string; // 當前的人員（最新的變更）
  dutyType: 'normal' | 'uat';
  changedBy: string; // 最後變更者
  changedAt: Timestamp; // 最後變更時間
  createdAt: Timestamp; // 首次建立時間
  reason?: string; // 最後變更原因
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  changeCount: number; // 變更次數（用於追蹤）
}

// 簡化的類型定義：用於新增/更新時的輸入
export type DutyChangeInput = Omit<DutyChange, 'id' | 'changedAt' | 'createdAt' | 'changeCount'>;

export interface DutySettings {
  normalDutyOrder: string[];
  uatDutyOrder: string[];
  lastUpdated: Timestamp;
  updatedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class DutyDatabaseService {
  private dutyChangesSubject = new BehaviorSubject<DutyChange[]>([]);
  private dutySettingsSubject = new BehaviorSubject<DutySettings | null>(null);
  private isInitialized = false;

  constructor() {
    this.initializeRealtimeListeners();
  }

  /** 初始化即時監聽 */
  private initializeRealtimeListeners(): void {
    if (this.isInitialized) return;
    
    try {
      // 監聽值班異動記錄（移除數量限制以確保獲取所有記錄）
      const changesRef = collection(db, 'dutyChanges');
      const changesQuery = query(changesRef, orderBy('changedAt', 'desc'));
      
      onSnapshot(changesQuery, (snapshot) => {
        const changes: DutyChange[] = [];
        snapshot.forEach((doc) => {
          changes.push({ id: doc.id, ...doc.data() } as DutyChange);
        });
        this.dutyChangesSubject.next(changes);
      });

      // 監聽值班設定
      const settingsRef = doc(db, 'dutySettings', 'current');
      onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          this.dutySettingsSubject.next(doc.data() as DutySettings);
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Firebase 初始化失敗:', error);
    }
  }

  /** 取得值班異動記錄（即時） */
  getDutyChanges(): Observable<DutyChange[]> {
    return this.dutyChangesSubject.asObservable();
  }

  /** 取得值班設定（即時） */
  getDutySettings(): Observable<DutySettings | null> {
    return this.dutySettingsSubject.asObservable();
  }

  /** 取得值班設定（一次性） */
  async getDutySettingsOnce(): Promise<DutySettings | null> {
    try {
      const settingsRef = doc(db, 'dutySettings', 'current');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as DutySettings;
      }
      return null;
    } catch (error) {
      console.error('獲取值班設定失敗:', error);
      throw error;
    }
  }



  /** 新增或更新值班異動記錄
   * - 使用固定的文件 ID: ${date}-${dutyType}
   * - 如果記錄已存在，直接覆蓋更新
   * - 如果記錄不存在，創建新記錄
   */
  async addDutyChange(change: DutyChangeInput): Promise<void> {
    try {
      // 使用固定的文件 ID
      const docId = `${change.date}-${change.dutyType}`;
      const changeRef = doc(db, 'dutyChanges', docId);
      
      // 檢查記錄是否已存在
      const existingDoc = await getDoc(changeRef);
      const now = Timestamp.now();
      
      // 準備要保存的資料
      const changeData: any = {
        date: change.date,
        originalPerson: change.originalPerson,
        newPerson: change.newPerson,
        dutyType: change.dutyType,
        changedBy: change.changedBy,
        changedAt: now,
        createdAt: existingDoc.exists() 
          ? (existingDoc.data() as DutyChange).createdAt || now
          : now,
        changeCount: existingDoc.exists() 
          ? ((existingDoc.data() as DutyChange).changeCount || 0) + 1
          : 1
      };
      
      // 只有當 reason 有值時才加入
      if (change.reason !== undefined && change.reason !== null) {
        changeData.reason = change.reason;
      }
      
      // 使用 setDoc 創建或覆蓋更新
      await setDoc(changeRef, changeData);
      
      if (existingDoc.exists()) {
        console.log(`✅ 更新值班異動: ${docId} (第 ${changeData.changeCount} 次變更)`);
      } else {
        console.log(`✅ 創建新值班異動: ${docId}`);
      }
    } catch (error) {
      console.error('新增/更新值班異動失敗:', error);
      throw error;
    }
  }

  /** 更新值班人員順序 */
  async updateDutyOrder(
    normalOrder: string[], 
    uatOrder: string[], 
    updatedBy: string
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'dutySettings', 'current');
      await setDoc(settingsRef, {
        normalDutyOrder: normalOrder,
        uatDutyOrder: uatOrder,
        lastUpdated: Timestamp.now(),
        updatedBy: updatedBy
      });
    } catch (error) {
      console.error('更新值班順序失敗:', error);
      throw error;
    }
  }

  /** 取得特定日期的值班異動 */
  getDutyChangeForDate(date: string, dutyType: 'normal' | 'uat'): DutyChange | null {
    const changes = this.dutyChangesSubject.value;
    return changes.find(change => 
      change.date === date && change.dutyType === dutyType
    ) || null;
  }

  /** 刪除值班異動記錄（復原功能） */
  async deleteDutyChange(changeId: string): Promise<void> {
    try {
      const changeRef = doc(db, 'dutyChanges', changeId);
      const docSnap = await getDoc(changeRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        await setDoc(changeRef, {
          ...data,
          isDeleted: true,
          deletedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('刪除值班異動失敗:', error);
      throw error;
    }
  }

  /** 取得當前使用中的值班異動（排除已刪除的） */
  getActiveDutyChanges(): DutyChange[] {
    return this.dutyChangesSubject.value.filter(change => !(change as any).isDeleted);
  }

  /** 批量新增或更新值班異動記錄
   * - 使用智慧更新邏輯，自動判斷新增或更新
   */
  async addBatchDutyChanges(changes: DutyChangeInput[]): Promise<void> {
    try {
      const promises = changes.map(async (change) => {
        // 直接調用 addDutyChange 以保持邏輯一致
        return this.addDutyChange(change);
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('批量新增/更新值班異動失敗:', error);
      throw error;
    }
  }

  /** 取得特定值班異動的完整歷史記錄 */
  /** 取得特定值班異動的完整歷史記錄 
   * 注意：此功能已停用（為避免 Firebase 權限問題，不再使用子集合）
   */
  async getDutyChangeHistory(date: string, dutyType: 'normal' | 'uat'): Promise<DutyChangeHistory[]> {
    console.warn('歷史記錄功能已停用（Firebase 權限限制）');
    return [];
  }

  /** 還原到之前的版本（從歷史記錄中）
   * 注意：此功能已停用（為避免 Firebase 權限問題，不再使用子集合）
   */
  async revertDutyChange(date: string, dutyType: 'normal' | 'uat', changedBy: string): Promise<void> {
    throw new Error('還原功能已停用（Firebase 權限限制）。如需此功能，請更新 Firebase 安全規則以支持子集合。');
  }


}