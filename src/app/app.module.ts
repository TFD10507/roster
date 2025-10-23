import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { AppComponent } from './app.component';
import { DutyCalendarComponent } from './duty-calendar/duty-calendar.component';

@NgModule({
 declarations: [AppComponent, DutyCalendarComponent],
 imports: [
   BrowserModule,
   BrowserAnimationsModule,
   CalendarModule.forRoot({
     provide: DateAdapter,
     useFactory: adapterFactory
   }),
 ],
 providers: [],
 bootstrap: [AppComponent],
})
export class AppModule {}
