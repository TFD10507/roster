import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DutyChangeDialogComponent } from './duty-change-dialog.component';

describe('DutyChangeDialogComponent', () => {
  let component: DutyChangeDialogComponent;
  let fixture: ComponentFixture<DutyChangeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DutyChangeDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DutyChangeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});