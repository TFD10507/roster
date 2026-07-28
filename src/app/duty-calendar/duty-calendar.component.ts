import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
 CalendarEvent,
 CalendarView
} from 'angular-calendar';
import { addDays, startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns';
import { DutyDatabaseService, DutyChange, DutyChangeInput, DutySettings, InsertedPeriod, InsertedPeriodInput } from '../services/duty-database.service';
import { DutyChangeDialogComponent, DutyChangeDialogData, DutyChangeResult } from '../duty-change-dialog/duty-change-dialog.component';
import { DutyInsertPeriodDialogComponent, InsertPeriodResult } from '../duty-insert-period-dialog/duty-insert-period-dialog.component';
import { Subscription } from 'rxjs';

interface DutyPerson {
 name: string;
 color: {
   primary: string;
   secondary: string;
 };
}

interface DutyEvent extends CalendarEvent {
 dutyPerson: string;
}

interface DutyConflict {
  date: Date;
  person: string;
  normalDuty: boolean;
  uatDuty: boolean;
  daysUntilConflict: number;
}

interface NormalDutyRule {
 effectiveDate: Date;
 order: string[];
 anchorPerson: string;
}

interface NormalDutyVersionInput {
 effectiveDate?: string;
 order?: string[] | Record<string, string>;
 anchorPerson?: string;
}

@Component({
 selector: 'app-duty-calendar',
 templateUrl: './duty-calendar.component.html',
 styleUrls: ['./duty-calendar.component.scss']
})
export class DutyCalendarComponent implements OnInit, OnDestroy {
 view: CalendarView = CalendarView.Month;
 viewDate: Date = new Date();

 private readonly defaultNormalDutyOrderVersions: NormalDutyVersionInput[] = [
   {
     effectiveDate: '2026-02-23',
     anchorPerson: 'Lynn',
     order: [
       'Nico',
       'Boso',
       'Miao',
       'Lynn',
       'Angela',
       'Eason',
       'Yong',
       'Roy',
       '77',
       'Bubble',
       'Alen'
     ]
   },
   {
     effectiveDate: '2026-08-03',
     anchorPerson: 'Goldas',
     order: [
       'Boso',
       'Miao',
       'Lynn',
       'Goldas',
       'Wei',
       'Angela',
       'Eason',
       'Yong',
       'Roy',
       '77',
       'Bubble',
       'Alen'
     ]
   }
  ];

 private readonly defaultUATDutyOrderVersions: NormalDutyVersionInput[] = [
   {
     effectiveDate: '2026-02-06',
     anchorPerson: 'Eason',
     order: [
       'Lynn',
       'Angela',
       'Yong',
       '77',
       'Jingle',
       'Goldas',
       'Alen',
       'Roy',
       'Boso',
       'Eason',
       'Bubble',
       'Miao',
       'Wei'
     ]
   }
 ];

 private readonly insertedDutyPersonName = '週期插入';

 // 預設值班人員清單，用作備用
 private defaultDutyPeople: DutyPerson[] = [
   { name: 'Boso', color: { primary: 'forestgreen', secondary: 'lightgreen' } },
   { name: 'Miao', color: { primary: 'orange', secondary: 'moccasin' } },
   { name: 'Lynn', color: { primary: 'crimson', secondary: 'mistyrose' } },
   { name: 'Goldas', color: { primary: 'goldenrod', secondary: 'lightgoldenrodyellow' } },
   { name: 'Wei', color: { primary: 'mediumseagreen', secondary: 'honeydew' } },
   { name: 'Angela', color: { primary: 'teal', secondary: 'lightcyan' } },
   { name: 'Eason', color: { primary: 'darkgoldenrod', secondary: 'wheat' } },
   { name: 'Yong', color: { primary: 'indianred', secondary: 'rosybrown' } },
   { name: 'Roy', color: { primary: 'steelblue', secondary: 'lightsteelblue' } },
   { name: '77', color: { primary: 'darkslategray', secondary: 'lightgray' } },
   { name: 'Bubble', color: { primary: 'hotpink', secondary: 'pink' } },
   { name: 'Alen', color: { primary: 'chocolate', secondary: 'peachpuff' } }
 ];

 // 動態載入的值班人員清單
 dutyPeople: DutyPerson[] = [];
 private normalDutyRules: NormalDutyRule[] = [];
 private uatDutyRules: NormalDutyRule[] = [];

 // 預設UAT測試資料值班人員清單，用作備用
 private defaultUATDutyPeople: DutyPerson[] = [
   { name: 'Lynn', color: { primary: 'crimson', secondary: 'mistyrose' } },
   { name: 'Angela', color: { primary: 'teal', secondary: 'lightcyan' } },
   { name: 'Yong', color: { primary: 'indianred', secondary: 'rosybrown' } },
   { name: '77', color: { primary: 'darkslategray', secondary: 'lightgray' } },
   { name: 'Jingle', color: { primary: 'purple', secondary: 'plum' } },
   { name: 'Goldas', color: { primary: 'goldenrod', secondary: 'lightgoldenrodyellow' } },
   { name: 'Alen', color: { primary: 'chocolate', secondary: 'peachpuff' } },
   { name: 'Roy', color: { primary: 'steelblue', secondary: 'lightsteelblue' } },
   { name: 'Boso', color: { primary: 'forestgreen', secondary: 'lightgreen' } },
   { name: 'Eason', color: { primary: 'darkgoldenrod', secondary: 'wheat' } },
   { name: 'Bubble', color: { primary: 'hotpink', secondary: 'pink' } },
   { name: 'Miao', color: { primary: 'orange', secondary: 'moccasin' } },
   { name: 'Nico', color: { primary: 'dodgerblue', secondary: 'lightblue' } }
 ];

 // 動態載入的UAT值班人員清單
 uatDutyPeople: DutyPerson[] = [];

 // 當前值班類型：'normal' 一般值班 或 'uat' UAT測資小天使
 currentDutyType: 'normal' | 'uat' = 'normal';

 // 兩種模式獨立的事件陣列
 normalEvents: DutyEvent[] = [];
 uatEvents: DutyEvent[] = [];

 // Toast 通知相關屬性
 showToast: boolean = false;
 toastMessage: string = '';
 toastIcon: string = '';
 toastType: 'success' | 'info' | 'warning' = 'info';
 private toastTimeout: any;

 // 台灣農曆過年國定假日設定（包含補假）
 private chineseNewYearHolidays = [
   // 2026年農曆過年：2/14(六)~2/22(日) 共9天
   { start: new Date(2026, 1, 14), end: new Date(2026, 1, 22) }
 ];

 // Firebase 相關屬性
 dutyChanges: DutyChange[] = [];
 insertedPeriods: InsertedPeriod[] = [];
 currentUser: string = 'User-' + Math.random().toString(36).substr(2, 5); // 簡單的用戶識別
 private subscriptions: Subscription[] = [];
 
 // 追蹤資料載入狀態
 private dutyChangesLoaded = false;
 private insertedPeriodsLoaded = false;
 private dutySettingsLoaded = false;
 private conflictCheckExecuted = false;

 constructor(
   private dutyDatabaseService: DutyDatabaseService,
   private router: Router,
   private dialog: MatDialog
 ) {}

 async ngOnInit(): Promise<void> {
   try {
     // 先載入人員清單
     await this.loadDutyPersons();
     
     // 訂閱 Firebase 即時資料
     this.subscriptions.push(
        this.dutyDatabaseService.getDutyChanges().subscribe(changes => {
          this.dutyChanges = changes;
          this.dutyChangesLoaded = true;
          this.generateBothSchedules(); // 重新產生排班
          this.checkAndExecuteConflictWarning(); // 檢查是否所有資料已載入
        })
      );

      this.subscriptions.push(
        this.dutyDatabaseService.getInsertedPeriods().subscribe(periods => {
          this.insertedPeriods = periods;
          this.insertedPeriodsLoaded = true;
          this.generateBothSchedules();
          this.checkAndExecuteConflictWarning();
        })
      );

     this.subscriptions.push(
       this.dutyDatabaseService.getDutySettings().subscribe(settings => {
         if (settings) {
           // 如果資料庫有人員順序設定，就使用資料庫的
           this.updatePeopleOrderFromDatabase(settings);
           this.generateBothSchedules();
           // 只有當資料庫有設定時才標記為已載入
           this.dutySettingsLoaded = true;
           this.checkAndExecuteConflictWarning(); // 檢查是否所有資料已載入
          } else {
            // 如果沒有資料庫設定，也標記為已載入（使用預設值）
            this.rebuildNormalDutyRules(null);
            this.dutySettingsLoaded = true;
            this.checkAndExecuteConflictWarning();
          }
       })
     );

     // 自動產生兩種模式的排班
     this.generateBothSchedules();
   } catch (error) {
     console.error('初始化失敗:', error);
     this.showToastNotification('初始化失敗，請重新載入頁面', 'warning', 5000);
   }
 }

 ngOnDestroy(): void {
   // 清理 timeout
   if (this.toastTimeout) {
     clearTimeout(this.toastTimeout);
   }
   
   // 清理 Firebase 訂閱
   this.subscriptions.forEach(sub => sub.unsubscribe());
 }

 /** 取得當前顯示的事件 */
 get events(): CalendarEvent[] {
   return this.currentDutyType === 'uat' ? this.uatEvents : this.normalEvents;
 }

 /** 載入兩種排程 */
 generateBothSchedules(): void {
   // 載入一般值班排程
   const originalType = this.currentDutyType;
   
   this.currentDutyType = 'normal';
   this.generateAutoSchedule();

   // 載入UAT值班排程
   this.currentDutyType = 'uat';
   this.generateAutoSchedule();

   // 回到原始模式
   this.currentDutyType = originalType;
 }

 /** 顯示 Toast 通知 */
 showToastNotification(message: string, type: 'success' | 'info' | 'warning' = 'info', duration: number = 3000): void {
   // 清除之前的 timeout
   if (this.toastTimeout) {
     clearTimeout(this.toastTimeout);
   }

   this.toastMessage = message;
   this.toastType = type;
   this.toastIcon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
   this.showToast = true;

   // 自動隱藏
   this.toastTimeout = setTimeout(() => {
     this.hideToast();
   }, duration);
 }

 /** 隱藏 Toast 通知 */
 hideToast(): void {
   this.showToast = false;
   if (this.toastTimeout) {
     clearTimeout(this.toastTimeout);
   }
 }

  /** 載入人員清單（優先使用資料庫，回退到預設值） */
  private async loadDutyPersons(): Promise<void> {
    try {
      // 嘗試從資料庫載入
      const settings = await this.dutyDatabaseService.getDutySettingsOnce();
      this.rebuildNormalDutyRules(settings);
      this.rebuildUatDutyRules(settings);
      this.dutyPeople = this.buildDutyPeople(this.getCurrentNormalDutyOrder(settings));

      const currentUatDutyOrder = this.getCurrentUatDutyOrder(settings);
      if (currentUatDutyOrder.length > 0) {
        // 從資料庫載入UAT人員
        this.uatDutyPeople = this.buildDutyPeople(currentUatDutyOrder);
      } else {
        // 使用預設值
        this.uatDutyPeople = [...this.defaultUATDutyPeople];
     }

    } catch (error) {
      console.error('載入人員清單失敗，使用預設值:', error);
      this.rebuildNormalDutyRules(null);
      this.rebuildUatDutyRules(null);
      this.dutyPeople = [...this.defaultDutyPeople];
      this.uatDutyPeople = [...this.defaultUATDutyPeople];
    }
  }

  /** 從資料庫更新人員順序 */
  private updatePeopleOrderFromDatabase(settings: DutySettings): void {
    this.rebuildNormalDutyRules(settings);
    this.rebuildUatDutyRules(settings);

    this.dutyPeople = this.buildDutyPeople(this.getCurrentNormalDutyOrder(settings));

    const currentUatDutyOrder = this.getCurrentUatDutyOrder(settings);
    if (currentUatDutyOrder.length > 0) {
      this.uatDutyPeople = this.buildDutyPeople(currentUatDutyOrder);
    }
  }

  private buildDutyPeople(order: string[]): DutyPerson[] {
    return order.map(name => this.createDutyPerson(name));
  }

  private createDutyPerson(name: string): DutyPerson {
    return (
      this.defaultDutyPeople.find(p => p.name === name) ||
      this.defaultUATDutyPeople.find(p => p.name === name) ||
      { name, color: { primary: 'gray', secondary: 'lightgray' } }
    );
  }

  private getCurrentNormalDutyOrder(settings?: DutySettings | null): string[] {
    const databaseRules = this.normalizeDutyOrderVersions(this.getDatabaseNormalDutyOrderVersions(settings));
    if (databaseRules && databaseRules.length > 0) {
      return databaseRules[databaseRules.length - 1].order;
    }

    return this.getDefaultNormalDutyRules()[this.defaultNormalDutyOrderVersions.length - 1].order;
  }

  private rebuildNormalDutyRules(settings: DutySettings | null): void {
    const databaseRules = this.normalizeDutyOrderVersions(this.getDatabaseNormalDutyOrderVersions(settings));

    if (databaseRules && databaseRules.length > 0) {
      this.normalDutyRules = databaseRules;
      return;
    }

    this.normalDutyRules = this.getDefaultNormalDutyRules();
  }

  private getDefaultNormalDutyRules(): NormalDutyRule[] {
    return this.normalizeDutyOrderVersions(this.defaultNormalDutyOrderVersions) ?? [];
  }

  private getCurrentUatDutyOrder(settings?: DutySettings | null): string[] {
    const databaseRules = this.normalizeDutyOrderVersions(this.getDatabaseUatDutyOrderVersions(settings));
    if (databaseRules && databaseRules.length > 0) {
      return databaseRules[databaseRules.length - 1].order;
    }

    return this.getDefaultUatDutyRules()[this.defaultUATDutyOrderVersions.length - 1].order;
  }

  private rebuildUatDutyRules(settings: DutySettings | null): void {
    const databaseRules = this.normalizeDutyOrderVersions(this.getDatabaseUatDutyOrderVersions(settings));

    if (databaseRules && databaseRules.length > 0) {
      this.uatDutyRules = databaseRules;
      return;
    }

    this.uatDutyRules = this.getDefaultUatDutyRules();
  }

  private getDefaultUatDutyRules(): NormalDutyRule[] {
    return this.normalizeDutyOrderVersions(this.defaultUATDutyOrderVersions) ?? [];
  }

  private getDatabaseNormalDutyOrderVersions(
    settings?: DutySettings | null
  ): DutySettings['normalDutyOrderVersions'] {
    return settings?.normalDutyOrderVersions ?? settings?.settinglist?.normalDutyOrderVersions;
  }

  private getDatabaseUatDutyOrderVersions(
    settings?: DutySettings | null
  ): DutySettings['uatDutyOrderVersions'] {
    return settings?.uatDutyOrderVersions ?? settings?.settinglist?.uatDutyOrderVersions;
  }

  private parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private normalizeDutyOrderVersions(
    versions: DutySettings['normalDutyOrderVersions'] | NormalDutyVersionInput[] | Record<string, NormalDutyVersionInput>
  ): NormalDutyRule[] | null {
    if (!versions) {
      return null;
    }

    const versionInputs = Array.isArray(versions)
      ? versions
      : Object.entries(versions).map(([effectiveDate, version]) => ({
          effectiveDate: version.effectiveDate || effectiveDate,
          anchorPerson: version.anchorPerson,
          order: version.order
        }));

    const rules = versionInputs
      .map(version => this.normalizeDutyOrderVersion(version))
      .filter((rule): rule is NormalDutyRule => rule !== null)
      .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());

    return rules.length > 0 ? rules : null;
  }

  private normalizeDutyOrderVersion(version: NormalDutyVersionInput): NormalDutyRule | null {
    const order = this.normalizeDutyOrder(version.order);
    const anchorPerson = version.anchorPerson?.trim();
    const effectiveDate = version.effectiveDate ? this.parseDateString(version.effectiveDate) : null;

    if (!effectiveDate || Number.isNaN(effectiveDate.getTime()) || !anchorPerson || order.length === 0) {
      return null;
    }

    return {
      effectiveDate,
      order,
      anchorPerson
    };
  }

  private normalizeDutyOrder(order?: string[] | Record<string, string>): string[] {
    if (!order) {
      return [];
    }

    const names = Array.isArray(order)
      ? order
      : Object.entries(order)
          .sort(([left], [right]) => Number(left) - Number(right))
          .map(([, value]) => value);

    return names.filter(name => typeof name === 'string' && name.trim() !== '');
  }

 /** 檢查所有資料是否已載入，如是則執行衝突檢查（僅執行一次） */
 private checkAndExecuteConflictWarning(): void {
   // 確保所有資料都已載入且尚未執行過檢查
    if (this.dutyChangesLoaded && 
        this.insertedPeriodsLoaded &&
        this.dutySettingsLoaded && 
        !this.conflictCheckExecuted &&
        this.dutyPeople.length > 0 &&
       this.uatDutyPeople.length > 0) {
     this.conflictCheckExecuted = true;
     
     // 打印當前人員清單以便調試
    //  console.log('UAT人員順序:', this.uatDutyPeople.map(p => p.name).join(', '));
    //  console.log('一般值班人員順序:', this.dutyPeople.map(p => p.name).join(', '));
     
     // 增加延遲時間，確保排班已完全產生並套用資料庫變更
     setTimeout(() => {
       this.checkConflictsAndWarn();
     }, 800);
   }
 }

 /** 檢查值班衝突並顯示警告 */
 checkConflictsAndWarn(): void {
   
   const conflicts = this.findDutyConflicts();
   const upcomingConflicts = conflicts.filter(conflict => 
     conflict.daysUntilConflict >= 0 && conflict.daysUntilConflict <= 14
   );

   if (upcomingConflicts.length > 0) {
     // 有衝突時使用 alert 確保使用者注意到
     this.showConflictAlert(upcomingConflicts);
   } else {
     // 檢查是否有更遠期的衝突
     const allFutureConflicts = conflicts.filter(conflict => conflict.daysUntilConflict > 14);
     if (allFutureConflicts.length > 0) {
       // 找到最近的衝突
       const nearestConflict = allFutureConflicts.reduce((nearest, current) => 
         current.daysUntilConflict < nearest.daysUntilConflict ? current : nearest
       );
       
       const nearestDateStr = format(nearestConflict.date, 'yyyy/MM/dd');
       this.showToastNotification(
         `有 ${allFutureConflicts.length} 個遠期的衝突，最近的是 ${nearestDateStr} ${nearestConflict.person}，建議提前留意。`, 
         'info', 
         4000
       );
     } else {
       this.showToastNotification('未來三個月內沒有發現值班衝突！', 'success', 3000);
     }
   }
 }

 /** 靜默檢查衝突（只在有近期衝突時顯示警告） */
 checkConflictsQuietly(): void {
   const conflicts = this.findDutyConflicts();
   const upcomingConflicts = conflicts.filter(conflict => 
     conflict.daysUntilConflict >= 0 && conflict.daysUntilConflict <= 14
   );

   if (upcomingConflicts.length > 0) {
     this.showConflictToast(upcomingConflicts);
   }
 }

 /** 尋找值班衝突 */
 findDutyConflicts(): DutyConflict[] {
   const conflicts: DutyConflict[] = [];
   const today = new Date();
   
   // 檢查未來3個月的衝突
   for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
     const checkDate = addMonths(today, monthOffset);
     const monthStart = startOfMonth(checkDate);
     const monthEnd = endOfMonth(checkDate);
     
     // 產生該月份的兩種排班資料（包含異動記錄）
     const originalType = this.currentDutyType;
     
     this.currentDutyType = 'normal';
     const normalEventsForMonth = this.applyDutyChanges(this.generateNormalScheduleForDate(checkDate));
     
     this.currentDutyType = 'uat';
     const uatEventsForMonth = this.applyDutyChanges(this.generateUATScheduleForDate(checkDate));
     
     this.currentDutyType = originalType;
     
     let current = new Date(monthStart);
     while (current <= monthEnd) {
       const normalEvent = normalEventsForMonth.find(e => 
         e.start && format(new Date(e.start), 'yyyy-MM-dd') === format(current, 'yyyy-MM-dd')
       );
       const uatEvent = uatEventsForMonth.find(e => 
         e.start && format(new Date(e.start), 'yyyy-MM-dd') === format(current, 'yyyy-MM-dd')
       );
       
       if (normalEvent && uatEvent) {
         // 處理名稱對應（MiaoMiao 在 UAT 中對應 Miao）
         const normalPerson = normalEvent.dutyPerson;
         const uatPerson =  uatEvent.dutyPerson;
         
         if (normalPerson === uatPerson) {
           const daysUntilConflict = differenceInDays(current, today);
           conflicts.push({
             date: new Date(current),
             person: normalPerson,
             normalDuty: true,
             uatDuty: true,
             daysUntilConflict: daysUntilConflict
           });
         }
       }
       
       current = addDays(current, 1);
     }
   }
   
   return conflicts;
 }

 /** 產生指定日期的一般值班排程（不修改元件狀態） */
 generateNormalScheduleForDate(targetDate: Date): DutyEvent[] {
   const start = startOfMonth(targetDate);
   const end = endOfMonth(targetDate);
   const days: DutyEvent[] = [];

   let current = new Date(start);
    while (current <= end) {
      const personName = this.getNormalDutyPerson(current);
      if (personName) {
        const assignedPerson = this.createDutyPerson(personName);
        days.push({
          title: assignedPerson.name,
          start: new Date(current),
          allDay: true,
          color: assignedPerson.color,
          dutyPerson: assignedPerson.name
        });
      }

     current = addDays(current, 1);
   }

   return days;
 }

 /** 產生指定日期的UAT值班排程（不修改元件狀態） */
  generateUATScheduleForDate(targetDate: Date): DutyEvent[] {
   const start = startOfMonth(targetDate);
   const end = endOfMonth(targetDate);
   const days: DutyEvent[] = [];

    let current = new Date(start);
    while (current <= end) {
      const personName = this.getUATDutyPerson(current);
      if (personName) {
        const assignedPerson = this.uatDutyPeople.find(p => p.name === personName) || this.createDutyPerson(personName);
        days.push({
          title: `${assignedPerson.name} (UAT)`,
          start: new Date(current),
          allDay: true,
          color: assignedPerson.color,
          dutyPerson: assignedPerson.name
        });
      }
      current = addDays(current, 1);
    }

   return days;
 }

 /** 顯示衝突警告 Alert（重要衝突） */
 showConflictAlert(conflicts: DutyConflict[]): void {
   const conflictMessages = conflicts.map(conflict => {
     const dateStr = format(conflict.date, 'yyyy/MM/dd', { locale: undefined });
     let daysText = '';
     if (conflict.daysUntilConflict === 0) {
       daysText = '今天';
     } else if (conflict.daysUntilConflict === 1) {
       daysText = '明天';
     } else if (conflict.daysUntilConflict <= 7) {
       daysText = `${conflict.daysUntilConflict}天後`;
     } else {
       daysText = `${conflict.daysUntilConflict}天後`;
     }
     return `📅 ${dateStr} 👤 ${conflict.person} (${daysText})`;
   });

   const title = conflicts.length === 1 ? '⚠️ 發現 1 個值班衝突' : `⚠️ 發現 ${conflicts.length} 個值班衝突`;
   const message = `${title}\n\n以下人員在同一天同時被排到一般值班和UAT測資小天使：\n\n${conflictMessages.join('\n\n')}\n\n🔧 請注意調整排班安排，避免同一人員身兼兩職！`;
   
   alert(message);
 }

 /** 顯示衝突 Toast 通知（輕量提醒） */
 showConflictToast(conflicts: DutyConflict[]): void {
   const conflictMessages = conflicts.map(conflict => {
     const dateStr = format(conflict.date, 'MM/dd', { locale: undefined });
     let daysText = '';
     if (conflict.daysUntilConflict === 0) {
       daysText = '今天';
     } else if (conflict.daysUntilConflict === 1) {
       daysText = '明天';
     } else if (conflict.daysUntilConflict <= 7) {
       daysText = `${conflict.daysUntilConflict}天後`;
     } else {
       daysText = `${conflict.daysUntilConflict}天後`;
     }
     return `${dateStr} ${conflict.person} (${daysText})`;
   });

   const message = `值班衝突提醒：${conflictMessages.join(', ')}`;
   this.showToastNotification(message, 'warning', 5000);
 }

 /** 切到上一個月 */
 prevMonth(): void {
   this.viewDate = addMonths(this.viewDate, -1);
   this.generateAutoSchedule();
   // 靜默檢查衝突（只在有近期衝突時顯示）
   this.checkConflictsQuietly();
 }

 /** 切到下一個月 */
 nextMonth(): void {
   this.viewDate = addMonths(this.viewDate, 1);
   this.generateAutoSchedule();
   // 靜默檢查衝突（只在有近期衝突時顯示）
   this.checkConflictsQuietly();
 } 
 
goToToday() {
  this.viewDate = new Date();
  this.generateAutoSchedule();
}
 
 /** 自動產生當月輪值（按照指定順序） */
 generateAutoSchedule(): void {
   if (this.currentDutyType === 'uat') {
     this.generateUATSchedule();
   } else {
     this.generateNormalSchedule();
   }
 }

 /** 產生一般值班排程 */
  generateNormalSchedule(): void {
    const start = startOfMonth(this.viewDate);
    const end = endOfMonth(this.viewDate);
    const days: DutyEvent[] = [];

   let current = new Date(start);

    while (current <= end) {
      const personName = this.getNormalDutyPerson(current);
      if (personName) {
        const assignedPerson = this.createDutyPerson(personName);
        days.push({
          title: assignedPerson.name,
          start: new Date(current),
          allDay: true,
          color: assignedPerson.color,
          dutyPerson: assignedPerson.name
        });
      }

     current = addDays(current, 1);
   }

   this.normalEvents = days;
   
   // 套用 Firebase 中的值班異動
   this.normalEvents = this.applyDutyChanges(this.normalEvents);
 }

 /** 產生UAT測資小天使排程 */
  generateUATSchedule(): void {
   const start = startOfMonth(this.viewDate);
   const end = endOfMonth(this.viewDate);
   const days: DutyEvent[] = [];

    let current = new Date(start);
    while (current <= end) {
      const personName = this.getUATDutyPerson(current);
      if (personName) {
        const assignedPerson = this.uatDutyPeople.find(p => p.name === personName) || this.createDutyPerson(personName);
        days.push({
          title: `${assignedPerson.name} (UAT)`,
          start: new Date(current),
          allDay: true,
          color: assignedPerson.color,
          dutyPerson: assignedPerson.name
        });
      }
      current = addDays(current, 1);
    }

   this.uatEvents = days;
   
   // 套用 Firebase 中的值班異動
   this.uatEvents = this.applyDutyChanges(this.uatEvents);
 }

 /** 點擊事件處理（使用 Material Dialog） */
 async handleEventClick(clickedEvent: CalendarEvent): Promise<void> {
   const event = clickedEvent as DutyEvent;
   const current = event.dutyPerson ?? event.title ?? '';
   const clickedDate = new Date(event.start!);

   // 跳過假期
   if (current === '假期') {
     this.showToastNotification('農曆過年假期無法異動值班', 'info', 2000);
     return;
   }

   // 找到當前人員負責的整個期間
   const dutyPeriod = this.findDutyPeriod(clickedDate, current);
   if (!dutyPeriod) {
     this.showToastNotification('無法確定值班期間', 'warning', 2000);
     return;
   }

   const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   if (!peopleList || peopleList.length === 0) {
     this.showToastNotification('人員清單載入中，請稍後再試', 'warning', 2000);
     return;
   }

   // 準備對話框資料
   const periodText = `${format(dutyPeriod.startDate, 'yyyy/MM/dd')} ~ ${format(dutyPeriod.endDate, 'yyyy/MM/dd')}`;
   const totalDays = Math.ceil((dutyPeriod.endDate.getTime() - dutyPeriod.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
   const clickedDateText = format(clickedDate, 'yyyy/MM/dd');

   const dialogData: DutyChangeDialogData = {
     currentPerson: current,
     dutyTypeName: dutyTypeName,
     peopleList: peopleList,
     clickedDate: clickedDateText,
     periodText: periodText,
     totalDays: totalDays,
     allowPeriodSelection: true
   };

   // 開啟對話框
   const dialogRef = this.dialog.open(DutyChangeDialogComponent, {
     width: '600px',
     maxWidth: '95vw',
     maxHeight: '90vh',
     data: dialogData,
     disableClose: false,
     autoFocus: true
   });

   // 處理對話框結果
   dialogRef.afterClosed().subscribe(async (result: DutyChangeResult) => {
     if (!result) {
       return; // 使用者取消
     }

     const selectedPerson = result.selectedPerson;
     const isWholePeriod = result.isWholePeriod;
     const changedBy = result.changedBy;

     try {
       if (isWholePeriod) {
         // 批量更新整個期間的所有日期
         try {
           // 計算該期間第一天的原始值班人員作為代表
           const periodOriginalPerson = this.calculateOriginalDutyPerson(dutyPeriod.startDate);
           await this.updateDutyPeriod(dutyPeriod, periodOriginalPerson, selectedPerson.name, changedBy);
           
           this.showToastNotification(
             `✅ 已將 ${periodText} 的${dutyTypeName}從 ${periodOriginalPerson} 全部更換為 ${selectedPerson.name}`,
             'success',
             4000
           );
         } catch (error: any) {
           console.error('批量更新失敗:', error);
           let errorMessage = '❌ 批量更新失敗：';
           
           if (error?.code) {
             switch (error.code) {
               case 'permission-denied':
                 errorMessage += '權限不足，請檢查 Firebase 安全規則';
                 break;
               case 'network-request-failed':
                 errorMessage += '網路連線失敗，請檢查網路狀態';
                 break;
               case 'unavailable':
                 errorMessage += 'Firebase 服務暫時無法使用';
                 break;
               default:
                 errorMessage += `${error.code} - ${error.message}`;
             }
           } else {
             errorMessage += error?.message || '未知錯誤';
           }
           
           this.showToastNotification(errorMessage, 'warning', 5000);
           throw error;
         }
       } else {
         // 只更新單天
         try {
           // 計算該日期的原始值班人員（不考慮任何異動）
           const originalPerson = this.calculateOriginalDutyPerson(clickedDate);
           
           const changeData: any = {
             date: format(clickedDate, 'yyyy-MM-dd'),
             originalPerson: originalPerson, // 使用計算出的原始人員，不是顯示的人員
             newPerson: selectedPerson.name,
             dutyType: this.currentDutyType,
             changedBy: changedBy || this.currentUser
           };
           
           await this.dutyDatabaseService.addDutyChange(changeData);

           this.showToastNotification(
             `✅ 已將 ${clickedDateText} 的${dutyTypeName}從 ${originalPerson} 更換為 ${selectedPerson.name}`,
             'success',
             3000
           );
         } catch (error: any) {
           console.error('詳細錯誤資訊:', error);
           let errorMessage = '❌ 儲存失敗：';
           
           if (error?.code) {
             switch (error.code) {
               case 'permission-denied':
                 errorMessage += '權限不足，請檢查 Firebase 安全規則';
                 break;
               case 'network-request-failed':
                 errorMessage += '網路連線失敗，請檢查網路狀態';
                 break;
               case 'unavailable':
                 errorMessage += 'Firebase 服務暫時無法使用';
                 break;
               default:
                 errorMessage += `${error.code} - ${error.message}`;
             }
           } else {
             errorMessage += error?.message || '未知錯誤';
           }
           
           this.showToastNotification(errorMessage, 'warning', 5000);
           throw error;
         }
       }
     } catch (error) {
       console.error('儲存異動失敗:', error);
       this.showToastNotification('❌ 儲存失敗，請檢查網路連線後重試', 'warning', 3000);
     }
   });
 }
 /** 顯示值班人員清單 */
 showDutyList(): void {
   const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   const list = peopleList.map((person, index) => `${index + 1}. ${person.name}`).join('\n');
   alert(`${dutyTypeName}人員清單：\n\n${list}`);
 }

 /** 開啟插入週期對話框 */
 async openInsertPeriodDialog(): Promise<void> {
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   const dialogRef = this.dialog.open(DutyInsertPeriodDialogComponent, {
     width: '600px',
     maxWidth: '95vw',
     data: {
       dutyTypeName: dutyTypeName
     },
     disableClose: false
   });

   dialogRef.afterClosed().subscribe(async (result: InsertPeriodResult | null) => {
     if (!result) {
       return; // 使用者取消
     }

     try {
       // 計算插入週期的日期範圍
       const startDate = result.startDate;
       const endDate = addDays(startDate, result.days - 1);
       const startDateStr = format(startDate, 'yyyy-MM-dd');
       const endDateStr = format(endDate, 'yyyy-MM-dd');

        const insertedPeriod: InsertedPeriodInput = {
          dutyType: this.currentDutyType,
          startDate: startDateStr,
          endDate: endDateStr,
          changedBy: result.changedBy,
          reason: result.reason || `插入 ${result.days} 天週期`
        };

        await this.dutyDatabaseService.addInsertedPeriod(insertedPeriod);

       this.showToastNotification(
         `✅ 已插入 ${result.days} 天週期 (${format(startDate, 'yyyy/MM/dd')} ~ ${format(endDate, 'yyyy/MM/dd')})`,
         'success',
         4000
       );

       // 重新產生排班
       this.generateBothSchedules();
     } catch (error) {
       console.error('插入週期失敗:', error);
       this.showToastNotification('❌ 插入週期失敗，請重試', 'warning', 3000);
     }
   });
 }



  /** 套用 Firebase 中的值班異動 */
  private applyDutyChanges(events: DutyEvent[]): DutyEvent[] {
    return events.map(event => {
      const dateString = format(new Date(event.start!), 'yyyy-MM-dd');
      const change = this.dutyChanges.find(c =>
        c.date === dateString &&
        c.dutyType === this.currentDutyType &&
        !c.isDeleted
      );

      if (change) {
        const titleSuffix = this.currentDutyType === 'uat' ? ' (UAT)' : '';
        const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
        const newPerson = peopleList.find(p => p.name === change.newPerson);

        if (newPerson) {
          return {
            ...event,
            title: `${newPerson.name}${titleSuffix} ⚡`,
            dutyPerson: newPerson.name,
            color: {
              primary: newPerson.color.primary,
              secondary: newPerson.color.secondary
            }
          };
        }

        return {
          ...event,
          title: `${change.newPerson}${titleSuffix} ⚡`,
          dutyPerson: change.newPerson,
          color: {
            primary: '#757575',
            secondary: '#e0e0e0'
          }
        };
      }

      if (this.isInsertedDate(dateString, this.currentDutyType)) {
        const titleSuffix = this.currentDutyType === 'uat' ? ' (UAT)' : '';
        return {
          ...event,
          title: `📦 插入週期${titleSuffix}`,
          dutyPerson: this.insertedDutyPersonName,
          color: {
            primary: '#9e9e9e',
            secondary: '#f5f5f5'
          }
        };
      }

      return event;
    });
  }

 /** 顯示異動歷史（導向新頁面） */
 showDutyChangeHistory(): void {
   this.router.navigate(['/history']);
 }

 /** 切換值班類型 */
 switchDutyType(): void {
   this.currentDutyType = this.currentDutyType === 'normal' ? 'uat' : 'normal';
   this.generateAutoSchedule();
 }

 /** 取得當前值班類型名稱 */
 getCurrentDutyTypeName(): string {
   return this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';
 }

 /** 取得值班人員姓名（用於模板顯示） */
 getDutyPersonName(event: CalendarEvent): string {
   const dutyEvent = event as DutyEvent;
   return dutyEvent.dutyPerson || event.title || '';
 }

 /** 找到指定日期和人員的整個值班期間 */
 findDutyPeriod(clickedDate: Date, personName: string): { startDate: Date; endDate: Date; } | null {
   // 現在直接使用循環邏輯計算期間
   if (this.currentDutyType === 'uat') {
     return this.calculateUATPeriod(clickedDate, personName);
   } else {
     return this.calculateNormalPeriod(clickedDate, personName);
   }
 }

 /** 取得一般值班排程表 */
 private getNormalSchedule() {
   // 現在使用動態計算，不再需要固定排程表
   return [];
 }

 /** 取得UAT值班排程表 */
 private getUATSchedule() {
   // 現在使用動態計算，不再需要固定排程表
   return [];
 }

  /** 計算一般值班的期間（週為單位） */
  private calculateNormalPeriod(clickedDate: Date, personName: string): { startDate: Date; endDate: Date; } | null {
    const rule = this.getNormalDutyRule(clickedDate);
    if (!rule) {
      return null;
    }

    const daysSinceStart = Math.floor((clickedDate.getTime() - rule.effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    
    // 找到該週的開始日期
    const weekStartDate = addDays(rule.effectiveDate, weeksSinceStart * 7);
    const weekEndDate = addDays(weekStartDate, 6);

   return {
     startDate: weekStartDate,
     endDate: weekEndDate
   };
 }

 /** 依日期取得UAT值班人員，支援名單版本切換與插入週期順延 */
  private getUATDutyPerson(date: Date): string {
    const rule = this.getUatDutyRule(date);
    if (!rule || rule.order.length === 0) {
      return '';
   }

   const anchorIndex = rule.order.findIndex(person => person === rule.anchorPerson);
   if (anchorIndex === -1) {
     return rule.order[0] || 'Unknown';
   }

   const daysSinceRuleStart = Math.floor((date.getTime() - rule.effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
   const insertedDays = this.countInsertedDays(rule.effectiveDate, date, 'uat');
   const effectiveDays = daysSinceRuleStart - insertedDays;
   const cyclesSinceRuleStart = Math.floor(effectiveDays / 14);
   const dutyIndex = (anchorIndex + cyclesSinceRuleStart) % rule.order.length;

    return rule.order[dutyIndex] || rule.order[0] || 'Unknown';
  }

  /** 依日期取得一般值班人員，支援名單版本切換與插入週期順延 */
  private getNormalDutyPerson(date: Date): string {
    const rule = this.getNormalDutyRule(date);
    if (!rule || rule.order.length === 0) {
      return '';
    }

    const anchorIndex = rule.order.findIndex(person => person === rule.anchorPerson);
    if (anchorIndex === -1) {
      return rule.order[0] || 'Unknown';
    }

    const daysSinceRuleStart = Math.floor((date.getTime() - rule.effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
    const insertedDays = this.countInsertedDays(rule.effectiveDate, date, 'normal');
    const effectiveDays = daysSinceRuleStart - insertedDays;
    const weeksSinceRuleStart = Math.floor(effectiveDays / 7);
    const dutyIndex = (anchorIndex + weeksSinceRuleStart) % rule.order.length;

    return rule.order[dutyIndex] || rule.order[0] || 'Unknown';
  }

  private getNormalDutyRule(date: Date): NormalDutyRule | null {
    if (this.normalDutyRules.length === 0) {
      this.rebuildNormalDutyRules(null);
    }

    let currentRule: NormalDutyRule | null = null;
    for (const rule of this.normalDutyRules) {
      if (date >= rule.effectiveDate) {
        currentRule = rule;
      } else {
        break;
      }
    }

    return currentRule;
  }

  private getUatDutyRule(date: Date): NormalDutyRule | null {
    if (this.uatDutyRules.length === 0) {
      this.rebuildUatDutyRules(null);
    }

    let currentRule: NormalDutyRule | null = null;
    for (const rule of this.uatDutyRules) {
      if (date >= rule.effectiveDate) {
        currentRule = rule;
      } else {
        break;
      }
    }

    return currentRule;
  }

  /** 計算UAT期間 */
  private getUATPeriod(date: Date): { startDate: Date; endDate: Date } | null {
    const rule = this.getUatDutyRule(date);
    if (!rule) return null;

    const daysSinceStart = Math.floor((date.getTime() - rule.effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
    const cycleIndex = Math.floor(daysSinceStart / 14);
    const startDate = addDays(rule.effectiveDate, cycleIndex * 14);
    return { startDate, endDate: addDays(startDate, 13) };
  }

 /** 計算UAT值班的期間（2週為單位） */
 private calculateUATPeriod(clickedDate: Date, personName: string): { startDate: Date; endDate: Date; } | null {
   return this.getUATPeriod(clickedDate);
 }

 /** 找到指定人員在特定時間範圍內的值班期間 */
 private findPersonDutyPeriodInRange(
   personName: string, 
   rangeStart: Date, 
   rangeEnd: Date
 ): { startDate: Date; endDate: Date; } | null {
   
   // 在指定範圍內逐日檢查，找到該人員負責的值班期間
   let current = new Date(rangeStart);
   
   while (current <= rangeEnd) {
     // 計算這一天原本應該是誰值班
     const originalPerson = this.calculateOriginalDutyPerson(current);
     
     if (originalPerson === personName) {
       // 找到了該人員值班的日期，現在確定整個期間
       if (this.currentDutyType === 'uat') {
         return this.calculateUATPeriod(current, personName);
       } else {
         return this.calculateNormalPeriod(current, personName);
       }
     }
     
     current = addDays(current, 1);
   }
   
   return null;
 }

 /** 計算指定日期原本應該由誰值班（不考慮異動記錄） */
 /** 計算從起始日期到結束日期之間插入週期的總天數 */
  private countInsertedDays(startDate: Date, endDate: Date, dutyType: 'normal' | 'uat'): number {
    let count = 0;
    const insertedPeriods = this.insertedPeriods.filter(period =>
      period.dutyType === dutyType &&
      !period.isDeleted
    );
    
    let current = new Date(startDate);
    while (current < endDate) {
      const dateString = format(current, 'yyyy-MM-dd');
      const isInserted = insertedPeriods.some(period => this.isDateWithinPeriod(dateString, period));
      if (isInserted) {
        count++;
      }
     current = addDays(current, 1);
   }
   
   return count;
 }

 /** 獲取某日期的實際值班人員（已套用所有異動後的結果）
  * 用於插入週期等需要知道實際值班人員的場景
  */
  private getActualDutyPerson(date: Date): string {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // 先查找是否有已存在的異動記錄
    const existingChange = this.dutyChanges.find(c => 
     c.date === dateString && 
     c.dutyType === this.currentDutyType &&
     !c.isDeleted
   );
   
    if (existingChange) {
      // 如果已經有異動記錄，使用異動後的人員
      return existingChange.newPerson;
    }

    if (this.isInsertedDate(dateString, this.currentDutyType)) {
      return this.insertedDutyPersonName;
    }
    
    // 如果沒有異動記錄，使用原始計算的值班人員
    return this.calculateOriginalDutyPerson(date);
  }

  private calculateOriginalDutyPerson(date: Date): string {
   if (this.currentDutyType === 'uat') {
     return this.getUATDutyPerson(date);
    } else {
      return this.getNormalDutyPerson(date);
   }
  }

  private isInsertedDate(dateString: string, dutyType: 'normal' | 'uat'): boolean {
    return this.insertedPeriods.some(period =>
      period.dutyType === dutyType &&
      !period.isDeleted &&
      this.isDateWithinPeriod(dateString, period)
    );
  }

  private isDateWithinPeriod(dateString: string, period: InsertedPeriod): boolean {
    return dateString >= period.startDate && dateString <= period.endDate;
  }

 /** 更新整個值班期間 */
 async updateDutyPeriod(
   period: { startDate: Date; endDate: Date; }, 
   originalPerson: string, 
   newPerson: string,
   changedBy?: string
 ): Promise<void> {
   const changes: DutyChangeInput[] = [];
   
   // 第一步：收集原始人員期間的所有異動記錄
   let current = new Date(period.startDate);
   while (current <= period.endDate) {
     const dateString = format(current, 'yyyy-MM-dd');
     
     changes.push({
       date: dateString,
       originalPerson: originalPerson,
       newPerson: newPerson,
       dutyType: this.currentDutyType,
       changedBy: changedBy || this.currentUser
     });
     
     current = addDays(current, 1);
   }

   // 第二步：找到新人員在同樣時間範圍內的值班期間，進行互換
   const newPersonPeriod = this.findPersonDutyPeriodInRange(newPerson, period.startDate, period.endDate);
   
   if (newPersonPeriod) {
     // 添加互換記錄：新人員 → 原人員
     let swapCurrent = new Date(newPersonPeriod.startDate);
     while (swapCurrent <= newPersonPeriod.endDate) {
       const dateString = format(swapCurrent, 'yyyy-MM-dd');
       
       changes.push({
         date: dateString,
         originalPerson: newPerson,
         newPerson: originalPerson,
         dutyType: this.currentDutyType,
         changedBy: changedBy || this.currentUser
       });
       
       swapCurrent = addDays(swapCurrent, 1);
     }
   }

   // 使用批量操作一次性提交所有異動
   await this.dutyDatabaseService.addBatchDutyChanges(changes);
 }
}
