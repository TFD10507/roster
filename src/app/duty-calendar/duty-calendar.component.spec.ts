import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DutyCalendarComponent } from './duty-calendar.component';

describe('DutyCalendarComponent', () => {
  let component: DutyCalendarComponent;
  let fixture: ComponentFixture<DutyCalendarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DutyCalendarComponent]
    });
    fixture = TestBed.createComponent(DutyCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
