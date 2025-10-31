import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
 CalendarEvent,
 CalendarView
} from 'angular-calendar';
import { addDays, startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns';
import { DutyDatabaseService, DutyChange } from '../services/duty-database.service';
import { DutyChangeDialogComponent, DutyChangeDialogData, DutyChangeResult } from '../duty-change-dialog/duty-change-dialog.component';
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

@Component({
 selector: 'app-duty-calendar',
 templateUrl: './duty-calendar.component.html',
 styleUrls: ['./duty-calendar.component.scss']
})
export class DutyCalendarComponent implements OnInit, OnDestroy {
 view: CalendarView = CalendarView.Month;
 viewDate: Date = new Date();

 // 值班人員清單，每個人有不同的顏色
 dutyPeople: DutyPerson[] = [
   { name: 'Nico', color: { primary: 'dodgerblue', secondary: 'lightblue' } },
   { name: 'Boso', color: { primary: 'forestgreen', secondary: 'lightgreen' } },
   { name: 'Miao', color: { primary: 'orange', secondary: 'moccasin' } },
   { name: 'Lynn', color: { primary: 'crimson', secondary: 'mistyrose' } },
   { name: '小Angela', color: { primary: 'mediumorchid', secondary: 'lavender' } },
   { name: '大Angela', color: { primary: 'teal', secondary: 'lightcyan' } },
   { name: 'Eason', color: { primary: 'darkgoldenrod', secondary: 'wheat' } },
   { name: 'Yong', color: { primary: 'indianred', secondary: 'rosybrown' } },
   { name: 'Roy', color: { primary: 'steelblue', secondary: 'lightsteelblue' } },
   { name: '77', color: { primary: 'darkslategray', secondary: 'lightgray' } },
   { name: 'Bubble', color: { primary: 'hotpink', secondary: 'pink' } },
   { name: 'Alen', color: { primary: 'chocolate', secondary: 'peachpuff' } }
 ];

 // UAT 測試資料值班人員清單（按照指定順序）
 uatDutyPeople: DutyPerson[] = [
   { name: 'Lynn', color: { primary: 'crimson', secondary: 'mistyrose' } },
   { name: '小Angela', color: { primary: 'mediumorchid', secondary: 'lavender' } },
   { name: '大Angela', color: { primary: 'teal', secondary: 'lightcyan' } },
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
 currentUser: string = 'User-' + Math.random().toString(36).substr(2, 5); // 簡單的用戶識別
 private subscriptions: Subscription[] = [];

 constructor(
   private dutyDatabaseService: DutyDatabaseService,
   private router: Router,
   private dialog: MatDialog
 ) {}

 ngOnInit(): void {
   // 訂閱 Firebase 即時資料
   this.subscriptions.push(
     this.dutyDatabaseService.getDutyChanges().subscribe(changes => {
       this.dutyChanges = changes;
       this.generateBothSchedules(); // 重新產生排班
     })
   );

   this.subscriptions.push(
     this.dutyDatabaseService.getDutySettings().subscribe(settings => {
       if (settings) {
         // 如果資料庫有人員順序設定，就使用資料庫的
         this.updatePeopleOrderFromDatabase(settings);
         this.generateBothSchedules();
       }
     })
   );

   // 自動產生兩種模式的排班
   this.generateBothSchedules();
   // 檢查衝突並顯示警告
   this.checkConflictsAndWarn();
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

 /** 從資料庫更新人員順序 */
 private updatePeopleOrderFromDatabase(settings: any): void {
   if (settings.normalDutyOrder && settings.normalDutyOrder.length > 0) {
     // 根據資料庫的順序重新排序人員清單
     const newOrder = settings.normalDutyOrder.map((name: string) => 
       this.dutyPeople.find(p => p.name === name)
     ).filter(Boolean);
     
     if (newOrder.length === this.dutyPeople.length) {
       this.dutyPeople = newOrder;
     }
   }

   if (settings.uatDutyOrder && settings.uatDutyOrder.length > 0) {
     const newOrder = settings.uatDutyOrder.map((name: string) => 
       this.uatDutyPeople.find(p => p.name === name)
     ).filter(Boolean);
     
     if (newOrder.length === this.uatDutyPeople.length) {
       this.uatDutyPeople = newOrder;
     }
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
     console.log(conflicts);
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
     
     // 產生該月份的兩種排班資料
     const normalEventsForMonth = this.generateNormalScheduleForDate(checkDate);
     const uatEventsForMonth = this.generateUATScheduleForDate(checkDate);
     
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
     // 根據初始點和資料庫人員清單順序計算值班人員
     const baseDate = new Date(2025, 8, 29); // 2025/9/29 開始 (月份從0開始，所以8月=9月)
     const yongIndex = this.dutyPeople.findIndex(p => p.name === 'Yong');
     
     const daysSinceStart = Math.floor((current.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
     const weeksSinceStart = Math.floor(daysSinceStart / 7);
     const dutyIndex = (yongIndex + weeksSinceStart) % this.dutyPeople.length;
     const assignedPerson = this.dutyPeople[dutyIndex] || this.dutyPeople[0];

     days.push({
       title: assignedPerson.name,
       start: new Date(current),
       allDay: true,
       color: assignedPerson.color,
       dutyPerson: assignedPerson.name
     });

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
     // 根據初始點和資料庫人員清單順序計算UAT值班人員
     const baseDate = new Date(2025, 9, 3); // 2025/10/3 開始 (月份從0開始，所以9月=10月)
     const angelaIndex = this.uatDutyPeople.findIndex(p => p.name === '小Angela');
     
     const daysSinceStart = Math.floor((current.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
     const sprintsSinceStart = Math.floor(daysSinceStart / 14); // 14天為一個sprint
     const dutyIndex = (angelaIndex + sprintsSinceStart) % this.uatDutyPeople.length;
     const assignedPerson = this.uatDutyPeople[dutyIndex] || this.uatDutyPeople[0];

     days.push({
       title: `${assignedPerson.name} (UAT)`,
       start: new Date(current),
       allDay: true,
       color: assignedPerson.color,
       dutyPerson: assignedPerson.name
     });

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
     // 根據初始點和資料庫人員清單順序計算值班人員
     const baseDate = new Date(2025, 8, 29); // 2025/9/29 開始 (月份從0開始，所以8月=9月)
     const yongIndex = this.dutyPeople.findIndex(p => p.name === 'Yong');
     
     const daysSinceStart = Math.floor((current.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
     const weeksSinceStart = Math.floor(daysSinceStart / 7);
     const dutyIndex = (yongIndex + weeksSinceStart) % this.dutyPeople.length;
     const assignedPerson = this.dutyPeople[dutyIndex] || this.dutyPeople[0];

     days.push({
       title: assignedPerson.name,
       start: new Date(current),
       allDay: true,
       color: assignedPerson.color,
       dutyPerson: assignedPerson.name
     });

     current = addDays(current, 1);
   }

   this.normalEvents = days;
   
   // 套用 Firebase 中的值班異動
   this.normalEvents = this.applyDutyChanges(this.normalEvents);
 }

 /** 產生UAT測資小天使排程（2週為一個sprint） */
 generateUATSchedule(): void {
   const start = startOfMonth(this.viewDate);
   const end = endOfMonth(this.viewDate);
   const days: DutyEvent[] = [];

   let current = new Date(start);

   while (current <= end) {
     // 根據初始點和資料庫人員清單順序計算UAT值班人員
     const baseDate = new Date(2025, 9, 3); // 2025/10/3 開始 (月份從0開始，所以9月=10月)
     const angelaIndex = this.uatDutyPeople.findIndex(p => p.name === '小Angela');
     
     const daysSinceStart = Math.floor((current.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
     const sprintsSinceStart = Math.floor(daysSinceStart / 14); // 14天為一個sprint
     const dutyIndex = (angelaIndex + sprintsSinceStart) % this.uatDutyPeople.length;
     const assignedPerson = this.uatDutyPeople[dutyIndex] || this.uatDutyPeople[0];

     days.push({
       title: `${assignedPerson.name} (UAT)`,
       start: new Date(current),
       allDay: true,
       color: assignedPerson.color,
       dutyPerson: assignedPerson.name
     });

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
           await this.updateDutyPeriod(dutyPeriod, current, selectedPerson.name, changedBy);
           
           this.showToastNotification(
             `✅ 已將 ${periodText} 的${dutyTypeName}從 ${current} 全部更換為 ${selectedPerson.name}`,
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
           const changeData: any = {
             date: format(clickedDate, 'yyyy-MM-dd'),
             originalPerson: current,
             newPerson: selectedPerson.name,
             dutyType: this.currentDutyType,
             changedBy: changedBy || this.currentUser
           };
           
           await this.dutyDatabaseService.addDutyChange(changeData);

           this.showToastNotification(
             `✅ 已將 ${clickedDateText} 的${dutyTypeName}從 ${current} 更換為 ${selectedPerson.name}`,
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

 /** 套用 Firebase 中的值班異動 */
 private applyDutyChanges(events: DutyEvent[]): DutyEvent[] {
   return events.map(event => {
     const dateString = format(new Date(event.start!), 'yyyy-MM-dd');
     const change = this.dutyChanges.find(c => 
       c.date === dateString && c.dutyType === this.currentDutyType
     );

     if (change) {
       // 找到對應的人員顏色
       const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
       const newPerson = peopleList.find(p => p.name === change.newPerson);
       
       if (newPerson) {
         const titleSuffix = this.currentDutyType === 'uat' ? ' (UAT)' : '';
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
     }

     return event;
   });
 }

 /** 顯示異動歷史（導向新頁面） */
 showDutyChangeHistory(): void {
   this.router.navigate(['/history']);
 }

 /** 查看資料庫內容（除錯用） */
 showDatabaseContent(): void {
   console.log('=== 資料庫內容 ===');
   console.log('值班異動記錄:', this.dutyChanges);
   
   // 顯示統計資訊
   const totalChanges = this.dutyChanges.length;
   const normalChanges = this.dutyChanges.filter(c => c.dutyType === 'normal').length;
   const uatChanges = this.dutyChanges.filter(c => c.dutyType === 'uat').length;
   
   const summary = `📊 資料庫統計資訊：
   
總異動記錄：${totalChanges} 筆
一般值班異動：${normalChanges} 筆  
UAT值班異動：${uatChanges} 筆

詳細資料請查看瀏覽器開發者工具的 Console`;
   
   alert(summary);
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
   const baseDate = new Date(2025, 8, 29); // 2025/9/29 開始 (月份從0開始，所以8月=9月)
   const daysSinceStart = Math.floor((clickedDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
   const weeksSinceStart = Math.floor(daysSinceStart / 7);
   
   // 找到該週的開始日期
   const weekStartDate = addDays(baseDate, weeksSinceStart * 7);
   const weekEndDate = addDays(weekStartDate, 6);

   return {
     startDate: weekStartDate,
     endDate: weekEndDate
   };
 }

 /** 計算UAT值班的期間（2週為單位） */
 private calculateUATPeriod(clickedDate: Date, personName: string): { startDate: Date; endDate: Date; } | null {
   const baseDate = new Date(2025, 9, 3); // 2025/10/3 開始 (月份從0開始，所以9月=10月)
   const daysSinceStart = Math.floor((clickedDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
   const sprintsSinceStart = Math.floor(daysSinceStart / 14);
   
   // 找到該sprint的開始日期
   const sprintStartDate = addDays(baseDate, sprintsSinceStart * 14);
   const sprintEndDate = addDays(sprintStartDate, 13);

   return {
     startDate: sprintStartDate,
     endDate: sprintEndDate
   };
 }

 /** 更新整個值班期間 */
 async updateDutyPeriod(
   period: { startDate: Date; endDate: Date; }, 
   originalPerson: string, 
   newPerson: string,
   changedBy?: string
 ): Promise<void> {
   const changes: Omit<DutyChange, 'id' | 'changedAt'>[] = [];
   
   let current = new Date(period.startDate);
   while (current <= period.endDate) {
     const dateString = format(current, 'yyyy-MM-dd');
     
     // 收集所有異動記錄
     changes.push({
       date: dateString,
       originalPerson: originalPerson,
       newPerson: newPerson,
       dutyType: this.currentDutyType,
       changedBy: changedBy || this.currentUser
     });
     
     current = addDays(current, 1);
   }

   // 使用批量操作一次性提交所有異動
   await this.dutyDatabaseService.addBatchDutyChanges(changes);
 }
}



