import { Component, OnInit } from '@angular/core';
import {
 CalendarEvent,
 CalendarView
} from 'angular-calendar';
import { addDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';

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

@Component({
 selector: 'app-duty-calendar',
 templateUrl: './duty-calendar.component.html',
 styleUrls: ['./duty-calendar.component.scss']
})
export class DutyCalendarComponent implements OnInit {
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

 ngOnInit(): void {
   // 確保初始化時有基本資料
   if (this.normalEvents.length === 0 && this.uatEvents.length === 0) {
     this.loadBothSchedules();
   }
 }

 /** 取得當前顯示的事件 */
 get events(): DutyEvent[] {
   return this.currentDutyType === 'uat' ? this.uatEvents : this.normalEvents;
 }

 /** 載入兩種排程 */
 loadBothSchedules(): void {
   // 載入一般值班排程
   this.currentDutyType = 'normal';
   this.loadEvents();

   // 載入UAT值班排程
   this.currentDutyType = 'uat';
   this.loadEvents();

   // 回到預設模式
   this.currentDutyType = 'normal';
 }

 /** 取得當前的 storage key */
 get storageKey(): string {
   return this.currentDutyType === 'uat' ? 'duty-calendar-uat-events' : 'duty-calendar-events';
 }

 /** 切到上一個月 */
 prevMonth(): void {
   this.viewDate = addMonths(this.viewDate, -1);
   if (!this.hasSavedEventsForMonth(this.viewDate)) {
     this.generateAutoSchedule();
   }
 }

 /** 切到下一個月 */
 nextMonth(): void {
   this.viewDate = addMonths(this.viewDate, 1);
   if (!this.hasSavedEventsForMonth(this.viewDate)) {
     this.generateAutoSchedule();
   }
 } /** 檢查 localStorage 是否已經有當月的事件（簡單判斷） */
 private hasSavedEventsForMonth(date: Date): boolean {
   const data = localStorage.getItem(this.storageKey);
   if (!data) return false;
   try {
     const items: any[] = JSON.parse(data);
     return items.some(i => {
       const d = new Date(i.start);
       return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
     });
   } catch {
     return false;
   }
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
     { startDate: new Date(2025, 9, 20), endDate: new Date(2025, 9, 26), person: 'Bubble' },  // 10/20-10/26
     { startDate: new Date(2025, 9, 27), endDate: new Date(2025, 10, 2), person: 'Alen' },   // 10/27-11/2
     { startDate: new Date(2025, 10, 3), endDate: new Date(2025, 10, 9), person: 'Nico' },   // 11/3-11/9
     // 可以繼續添加更多週期...
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
   this.saveEvents();
 }

 /** 產生UAT測資小天使排程（2週為一個sprint） */
 generateUATSchedule(): void {
   const start = startOfMonth(this.viewDate);
   const end = endOfMonth(this.viewDate);
   const days: DutyEvent[] = [];

   // 定義UAT值班排程表（2週為一個sprint，有特殊交換安排）
   const uatSchedule = [
     { startDate: new Date(2025, 9, 17), endDate: new Date(2025, 9, 30), person: 'Yong' },      // 10/17-10/30 (Yong跟大Angela交換)
     { startDate: new Date(2025, 9, 31), endDate: new Date(2025, 10, 13), person: '大Angela' }, // 10/31-11/13 (大Angela跟Yong交換)
     { startDate: new Date(2025, 10, 14), endDate: new Date(2025, 10, 27), person: '77' },      // 11/14-11/27
     { startDate: new Date(2025, 10, 28), endDate: new Date(2025, 11, 11), person: 'Jingle' },  // 11/28-12/11
     { startDate: new Date(2025, 11, 12), endDate: new Date(2025, 11, 25), person: 'Goldas' },  // 12/12-12/25
     { startDate: new Date(2025, 11, 26), endDate: new Date(2026, 0, 8), person: 'Alen' },      // 12/26-1/8
     { startDate: new Date(2026, 0, 9), endDate: new Date(2026, 0, 22), person: 'Roy' },        // 1/9-1/22
     { startDate: new Date(2026, 0, 23), endDate: new Date(2026, 1, 5), person: 'Boso' },       // 1/23-2/5
     { startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 19), person: 'Eason' },      // 2/6-2/19
     { startDate: new Date(2026, 1, 20), endDate: new Date(2026, 2, 5), person: 'Bubble' },     // 2/20-3/5
     { startDate: new Date(2026, 2, 6), endDate: new Date(2026, 2, 19), person: 'MiaoMiao' },   // 3/6-3/19
     { startDate: new Date(2026, 2, 20), endDate: new Date(2026, 3, 2), person: 'Nico' },       // 3/20-4/2
     // 之後會自動按照清單順序循環：Lynn → 小Angela → 大Angela → Yong → 77 → Jingle → Goldas → Alen → Roy → Boso → Eason → Bubble → MiaoMiao → Nico
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
       // 前面已定義的sprint: Yong(0) → 大Angela(1) → 77(2) → Jingle(3) → Goldas(4) → Alen(5) → Roy(6) → Boso(7) → Eason(8) → Bubble(9) → MiaoMiao(10) → Nico(11)
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
   this.saveEvents();
 }

 /** 點擊事件（從 template 傳來的 CalendarEvent） */
 handleEventClick(clickedEvent: CalendarEvent): void {
   // cast 成 DutyEvent 使用自定義屬性
   const event = clickedEvent as DutyEvent;
   const current = event.dutyPerson ?? event.title ?? '';

   // 根據當前值班類型選擇人員清單
   const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   // 安全檢查人員清單
   if (!peopleList || peopleList.length === 0) {
     alert('人員清單載入中，請稍後再試');
     return;
   }

   // 建立選擇清單
   const options = peopleList.map((person, index) => `${index + 1}. ${person?.name || '未知'}`).join('\n');
   const message = `目前${dutyTypeName}：${current}\n\n請選擇新的值班人員：\n${options}\n\n請輸入數字 (1-${peopleList.length}) 或取消：`;

   const input = prompt(message);

   if (input === null) {
     // 使用者按取消 -> 不變
     return;
   }

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

   const titleSuffix = this.currentDutyType === 'uat' ? ' (UAT)' : '';
   event.title = selectedPerson.name + titleSuffix;
   event.dutyPerson = selectedPerson.name;
   event.color = selectedPerson.color;
   this.saveEvents();
 } /** 儲存到 localStorage（把 Date 會自動被 JSON.stringify 轉成字串） */
 saveEvents(): void {
   const eventsToSave = this.currentDutyType === 'uat' ? this.uatEvents : this.normalEvents;
   localStorage.setItem(this.storageKey, JSON.stringify(eventsToSave));
 }

 /** 從 localStorage 載入，並把 start/end 轉回 Date */
 loadEvents(): void {
   const data = localStorage.getItem(this.storageKey);
   if (!data) {
     this.generateAutoSchedule();
     return;
   }

   try {
     const raw = JSON.parse(data) as any[];
     // 將 start/end 轉回 Date
     const events = raw.map(r => {
       const ev: DutyEvent = {
         ...r,
         start: r.start ? new Date(r.start) : undefined,
         end: r.end ? new Date(r.end) : undefined
       };
       return ev;
     });

     // 根據當前值班類型保存到對應的陣列
     if (this.currentDutyType === 'uat') {
       this.uatEvents = events;
     } else {
       this.normalEvents = events;
     }

     // 若目前月份沒有事件，產生自動排班
     if (!this.hasSavedEventsForMonth(this.viewDate)) {
       this.generateAutoSchedule();
     }
   } catch (e) {
     console.error('載入事件失敗，重新產生：', e);
     this.generateAutoSchedule();
   }
 }

 /** 顯示值班人員清單 */
 showDutyList(): void {
   const peopleList = this.currentDutyType === 'uat' ? this.uatDutyPeople : this.dutyPeople;
   const dutyTypeName = this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';

   const list = peopleList.map((person, index) => `${index + 1}. ${person.name}`).join('\n');
   alert(`${dutyTypeName}人員清單：\n\n${list}\n\n點擊日期可以修改值班人員`);
 }

 /** 切換值班類型 */
 switchDutyType(): void {
   this.currentDutyType = this.currentDutyType === 'normal' ? 'uat' : 'normal';

   // 檢查當前模式是否有當月資料，沒有的話才生成
   const currentEvents = this.currentDutyType === 'uat' ? this.uatEvents : this.normalEvents;
   const hasCurrentMonthEvents = currentEvents.some(event => {
     const eventDate = new Date(event.start as Date);
     return eventDate.getFullYear() === this.viewDate.getFullYear() &&
            eventDate.getMonth() === this.viewDate.getMonth();
   });

   if (!hasCurrentMonthEvents) {
     this.generateAutoSchedule();
   }
 }

 /** 取得當前值班類型名稱 */
 getCurrentDutyTypeName(): string {
   return this.currentDutyType === 'uat' ? 'UAT測資小天使' : '一般值班';
 }
}/** 幫忙比對是不是同一天（小工具） */
function sameDay(d1?: Date, d2?: Date): boolean {
 if (!d1 || !d2) return false;
 return d1.getFullYear() === d2.getFullYear()
   && d1.getMonth() === d2.getMonth()
   && d1.getDate() === d2.getDate();
}
