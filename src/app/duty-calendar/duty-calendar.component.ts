import { Component, OnInit, OnDestroy } from '@angular/core';
import {
 CalendarEvent,
 CalendarView
} from 'angular-calendar';
import { addDays, startOfMonth, endOfMonth, addMonths, differenceInDays, format } from 'date-fns';
import { DutyDatabaseService, DutyChange } from '../services/duty-database.service';
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
 currentUser: string = '使用者'; // 可以從登入系統取得
 private subscriptions: Subscription[] = [];

 constructor(private dutyDatabaseService: DutyDatabaseService) {}

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

   // 定義值班排程表（與原有邏輯相同）
   const dutySchedule = [
     { startDate: new Date(2025, 9, 20), endDate: new Date(2025, 9, 26), person: 'Bubble' },
     { startDate: new Date(2025, 9, 27), endDate: new Date(2025, 10, 2), person: 'Alen' },
     { startDate: new Date(2025, 10, 3), endDate: new Date(2025, 10, 9), person: 'Nico' },
     { startDate: new Date(2025, 10, 10), endDate: new Date(2025, 10, 16), person: 'Boso' },
     { startDate: new Date(2025, 10, 17), endDate: new Date(2025, 10, 23), person: 'Lynn' },
     { startDate: new Date(2025, 10, 24), endDate: new Date(2025, 10, 30), person: 'Miao' },
     { startDate: new Date(2025, 11, 1), endDate: new Date(2025, 11, 7), person: '小Angela' },
     { startDate: new Date(2025, 11, 8), endDate: new Date(2025, 11, 14), person: '大Angela' },
   ];

   let current = new Date(start);
   while (current <= end) {
     let assignedPerson = null;

     for (const schedule of dutySchedule) {
       if (current >= schedule.startDate && current <= schedule.endDate) {
         assignedPerson = this.dutyPeople.find(p => p.name === schedule.person);
         break;
       }
     }

     if (!assignedPerson) {
       const startDate = new Date(2024, 0, 1);
       const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
       const weeksSinceStart = Math.floor(daysSinceStart / 7);
       const dutyIndex = weeksSinceStart % this.dutyPeople.length;
       assignedPerson = this.dutyPeople[dutyIndex];
     }

     if (!assignedPerson) {
       assignedPerson = this.dutyPeople[0];
     }

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

   // 定義UAT值班排程表（與原有邏輯相同）
   const uatSchedule = [
     { startDate: new Date(2025, 9, 17), endDate: new Date(2025, 9, 30), person: 'Yong' },
     { startDate: new Date(2025, 9, 31), endDate: new Date(2025, 10, 13), person: '77' },
     { startDate: new Date(2025, 10, 14), endDate: new Date(2025, 10, 27), person: '大Angela' },
     { startDate: new Date(2025, 10, 28), endDate: new Date(2025, 11, 11), person: 'Jingle' },
     { startDate: new Date(2025, 11, 12), endDate: new Date(2025, 11, 25), person: 'Goldas' },
     { startDate: new Date(2025, 11, 26), endDate: new Date(2026, 0, 8), person: 'Alen' },
     { startDate: new Date(2026, 0, 9), endDate: new Date(2026, 0, 22), person: 'Roy' },
     { startDate: new Date(2026, 0, 23), endDate: new Date(2026, 1, 5), person: 'Boso' },
     { startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 19), person: 'Eason' },
     { startDate: new Date(2026, 1, 20), endDate: new Date(2026, 2, 5), person: 'Bubble' },
     { startDate: new Date(2026, 2, 6), endDate: new Date(2026, 2, 19), person: 'Miao' },
     { startDate: new Date(2026, 2, 20), endDate: new Date(2026, 3, 2), person: 'Nico' },
   ];

   let current = new Date(start);
   while (current <= end) {
     let assignedPerson = null;

     for (const schedule of uatSchedule) {
       if (current >= schedule.startDate && current <= schedule.endDate) {
         assignedPerson = this.uatDutyPeople.find(p => p.name === schedule.person);
         break;
       }
     }

     if (!assignedPerson) {
       const startDate = new Date(2025, 9, 17);
       const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
       const sprintsSinceStart = Math.floor(daysSinceStart / 14);
       const cyclePosition = sprintsSinceStart % this.uatDutyPeople.length;
       assignedPerson = this.uatDutyPeople[cyclePosition];
     }

     if (!assignedPerson) {
       assignedPerson = this.uatDutyPeople[0];
     }

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

   // 定義值班排程表
   const dutySchedule = [
     { startDate: new Date(2025, 9, 20), endDate: new Date(2025, 9, 26), person: 'Bubble' },
     { startDate: new Date(2025, 9, 27), endDate: new Date(2025, 10, 2), person: 'Alen' },
     { startDate: new Date(2025, 10, 3), endDate: new Date(2025, 10, 9), person: 'Nico' },
     { startDate: new Date(2025, 10, 10), endDate: new Date(2025, 10, 16), person: 'Boso' },
     { startDate: new Date(2025, 10, 17), endDate: new Date(2025, 10, 23), person: 'Lynn' },
     { startDate: new Date(2025, 10, 24), endDate: new Date(2025, 10, 30), person: 'Miao' },
     { startDate: new Date(2025, 11, 1), endDate: new Date(2025, 11, 7), person: '小Angela' },
     { startDate: new Date(2025, 11, 8), endDate: new Date(2025, 11, 14), person: '大Angela' },
   ];

   let current = new Date(start);

   while (current <= end) {
     // 找到當前日期對應的值班人員
     let assignedPerson = null;

     for (const schedule of dutySchedule) {
       if (current >= schedule.startDate && current <= schedule.endDate) {
         assignedPerson = this.dutyPeople.find(p => p.name === schedule.person);
         break;
       }
     }

     // 如果沒有找到指定的值班人員，使用預設循環邏輯
     if (!assignedPerson) {
       const startDate = new Date(2024, 0, 1);
       const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
       const weeksSinceStart = Math.floor(daysSinceStart / 7);
       const dutyIndex = weeksSinceStart % this.dutyPeople.length;
       assignedPerson = this.dutyPeople[dutyIndex];
     }

     // 安全檢查，確保 assignedPerson 存在
     if (!assignedPerson) {
       assignedPerson = this.dutyPeople[0]; // 使用第一個人作為預設
     }

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

   // 定義UAT值班排程表（2週為一個sprint，有特殊交換安排）
   const uatSchedule = [
     { startDate: new Date(2025, 9, 17), endDate: new Date(2025, 9, 30), person: 'Yong' },      // 10/17-10/30 (大Angela跟Yong交換)
     { startDate: new Date(2025, 9, 31), endDate: new Date(2025, 10, 13), person: '77' }, // 10/31-11/13 (大Angela跟77交換)
     { startDate: new Date(2025, 10, 14), endDate: new Date(2025, 10, 27), person: '大Angela' },      // 11/14-11/27
     { startDate: new Date(2025, 10, 28), endDate: new Date(2025, 11, 11), person: 'Jingle' },  // 11/28-12/11
     { startDate: new Date(2025, 11, 12), endDate: new Date(2025, 11, 25), person: 'Goldas' },  // 12/12-12/25
     { startDate: new Date(2025, 11, 26), endDate: new Date(2026, 0, 8), person: 'Alen' },      // 12/26-1/8
     { startDate: new Date(2026, 0, 9), endDate: new Date(2026, 0, 22), person: 'Roy' },        // 1/9-1/22
     { startDate: new Date(2026, 0, 23), endDate: new Date(2026, 1, 5), person: 'Boso' },       // 1/23-2/5
     { startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 19), person: 'Eason' },      // 2/6-2/19
     { startDate: new Date(2026, 1, 20), endDate: new Date(2026, 2, 5), person: 'Bubble' },     // 2/20-3/5
     { startDate: new Date(2026, 2, 6), endDate: new Date(2026, 2, 19), person: 'Miao' },   // 3/6-3/19
     { startDate: new Date(2026, 2, 20), endDate: new Date(2026, 3, 2), person: 'Nico' },       // 3/20-4/2
     // 之後會自動按照清單順序循環：Lynn → 小Angela → 大Angela → Yong → 77 → Jingle → Goldas → Alen → Roy → Boso → Eason → Bubble → Miao → Nico
   ];

   let current = new Date(start);

   while (current <= end) {
     // 找到當前日期對應的值班人員
     let assignedPerson = null;

     for (const schedule of uatSchedule) {
       if (current >= schedule.startDate && current <= schedule.endDate) {
         assignedPerson = this.uatDutyPeople.find(p => p.name === schedule.person);
         break;
       }
     }

     // 如果沒有找到指定的值班人員，使用UAT人員清單循環邏輯
     if (!assignedPerson) {
       const startDate = new Date(2025, 9, 17); // UAT排程開始日期 (10/17)
       const daysSinceStart = Math.floor((current.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
       const sprintsSinceStart = Math.floor(daysSinceStart / 14); // 14天為一個sprint

       // 按照完整一輪的順序計算
       // 前面已定義的sprint: Yong(0) → 大Angela(1) → 77(2) → Jingle(3) → Goldas(4) → Alen(5) → Roy(6) → Boso(7) → Eason(8) → Bubble(9) → Miao(10) → Nico(11)
       // 之後循環: Lynn(12) → 小Angela(13) → 大Angela(14) → Yong(15) ...
       const cyclePosition = sprintsSinceStart % this.uatDutyPeople.length;
       assignedPerson = this.uatDutyPeople[cyclePosition];
     }

     // 安全檢查，確保 assignedPerson 存在
     if (!assignedPerson) {
       assignedPerson = this.uatDutyPeople[0]; // 使用第一個人作為預設
     }

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

 /** 點擊事件處理（加入 Firebase 儲存） */
 async handleEventClick(clickedEvent: CalendarEvent): Promise<void> {
   const event = clickedEvent as DutyEvent;
   const current = event.dutyPerson ?? event.title ?? '';
   const dateString = format(new Date(event.start!), 'yyyy-MM-dd');

   // 跳過假期
   if (current === '假期') {
     this.showToastNotification('農曆過年假期無法異動值班', 'info', 2000);
     return;
   }

   const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   if (!peopleList || peopleList.length === 0) {
     alert('人員清單載入中，請稍後再試');
     return;
   }

   const options = peopleList.map((person, index) => `${index + 1}. ${person?.name || '未知'}`).join('\n');
   const message = `目前${dutyTypeName}：${current}\n\n請選擇新的值班人員：\n${options}\n\n請輸入數字 (1-${peopleList.length}) 或取消：`;

   const input = prompt(message);
   if (input === null) return;

   const selectedIndex = parseInt(input.trim()) - 1;
   if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= peopleList.length) {
     alert(`請輸入 1 到 ${peopleList.length} 之間的數字`);
     return;
   }

   const selectedPerson = peopleList[selectedIndex];
   if (!selectedPerson) {
     alert('選擇的人員無效，請重新選擇');
     return;
   }

   // 如果選擇的是同一個人，就不需要異動
   if (selectedPerson.name === current) {
     this.showToastNotification('未變更值班人員', 'info', 2000);
     return;
   }

   // 詢問異動原因
   const reason = prompt('請輸入異動原因（選填）：') || '';

   try {
     // 儲存到 Firebase
     await this.dutyDatabaseService.addDutyChange({
       date: dateString,
       originalPerson: current,
       newPerson: selectedPerson.name,
       dutyType: this.currentDutyType,
       changedBy: this.currentUser,
       reason: reason
     });

     this.showToastNotification(
       `✅ 已將 ${dateString} 的${dutyTypeName}從 ${current} 改為 ${selectedPerson.name}`,
       'success',
       3000
     );
   } catch (error) {
     console.error('儲存異動失敗:', error);
     this.showToastNotification('❌ 儲存失敗，請檢查網路連線後重試', 'warning', 3000);
   }
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

 /** 顯示異動歷史 */
 showDutyChangeHistory(): void {
   if (this.dutyChanges.length === 0) {
     alert('目前沒有值班異動記錄');
     return;
   }

   const history = this.dutyChanges
     .slice(0, 10) // 只顯示最近10筆
     .map(change => {
       const date = change.date;
       const type = change.dutyType === 'uat' ? 'UAT' : '一般';
       const reason = change.reason ? ` (${change.reason})` : '';
       const changedAt = change.changedAt.toDate().toLocaleString('zh-TW');
       return `📅 ${date} ${type}值班\n👤 ${change.originalPerson} → ${change.newPerson}\n👨‍💻 by ${change.changedBy}${reason}\n🕐 ${changedAt}`;
     })
     .join('\n\n');

   alert(`最近的值班異動記錄：\n\n${history}`);
 }

 /** 儲存當前人員順序到 Firebase */
 async savePeopleOrderToDatabase(): Promise<void> {
   try {
     const normalOrder = this.dutyPeople.map(p => p.name);
     const uatOrder = this.uatDutyPeople.map(p => p.name);
     
     await this.dutyDatabaseService.updateDutyOrder(
       normalOrder,
       uatOrder,
       this.currentUser
     );
     
     this.showToastNotification('✅ 人員順序已儲存到雲端', 'success', 3000);
   } catch (error) {
     console.error('儲存人員順序失敗:', error);
     this.showToastNotification('❌ 儲存失敗，請重試', 'warning', 3000);
   }
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
}



