import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase.config';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DutyChange {
  id: string;
  date: string;
  originalPerson: string;
  newPerson: string;
  dutyType: 'normal' | 'uat';
  changedBy: string;
  changedAt: Timestamp;
  reason?: string;
}

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
      // 監聽值班異動記錄
      const changesRef = collection(db, 'dutyChanges');
      const changesQuery = query(changesRef, orderBy('changedAt', 'desc'), limit(50));
      
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

  /** 新增值班異動記錄 */
  async addDutyChange(change: Omit<DutyChange, 'id' | 'changedAt'>): Promise<void> {
    try {
      const changeRef = doc(collection(db, 'dutyChanges'));
      await setDoc(changeRef, {
        ...change,
        changedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('新增值班異動失敗:', error);
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
      await updateDoc(changeRef, {
        isDeleted: true,
        deletedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('刪除值班異動失敗:', error);
      throw error;
    }
  }

  /** 取得當前使用中的值班異動（排除已刪除的） */
  getActiveDutyChanges(): DutyChange[] {
    return this.dutyChangesSubject.value.filter(change => !(change as any).isDeleted);
  }
}