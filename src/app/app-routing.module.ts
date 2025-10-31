import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DutyCalendarComponent } from './duty-calendar/duty-calendar.component';
import { DutyHistoryComponent } from './duty-history/duty-history.component';

const routes: Routes = [
  { path: '', component: DutyCalendarComponent },
  { path: 'history', component: DutyHistoryComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }