import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DutyHistoryComponent } from './duty-history.component';

describe('DutyHistoryComponent', () => {
  let component: DutyHistoryComponent;
  let fixture: ComponentFixture<DutyHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DutyHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DutyHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});