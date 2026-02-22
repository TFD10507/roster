import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

// Angular Material 模組
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// 路由
import { AppRoutingModule } from './app-routing.module';

// 組件
import { AppComponent } from './app.component';
import { DutyCalendarComponent } from './duty-calendar/duty-calendar.component';
import { DutyHistoryComponent } from './duty-history/duty-history.component';
import { DutyChangeDialogComponent } from './duty-change-dialog/duty-change-dialog.component';
import { DutyInsertPeriodDialogComponent } from './duty-insert-period-dialog/duty-insert-period-dialog.component';

// 服務
import { DutyDatabaseService } from './services/duty-database.service';

// Pipes
import { FilterPipe } from './shared/filter.pipe';

@NgModule({
  declarations: [
    AppComponent, 
    DutyCalendarComponent,
    DutyHistoryComponent,
    DutyChangeDialogComponent,
    DutyInsertPeriodDialogComponent,
    FilterPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    // Angular Material 模組
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    }),
  ],
  providers: [
    DutyDatabaseService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
