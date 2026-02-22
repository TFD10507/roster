import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { format, addDays } from 'date-fns';

export interface InsertPeriodData {
  dutyTypeName: string;
}

export interface InsertPeriodResult {
  startDate: Date;
  days: number;
  reason: string;
  changedBy: string;
}

@Component({
  selector: 'app-duty-insert-period-dialog',
  templateUrl: './duty-insert-period-dialog.component.html',
  styleUrls: ['./duty-insert-period-dialog.component.scss']
})
export class DutyInsertPeriodDialogComponent {
  startDate: Date | null = null;
  days: number = 7;
  reason: string = '';
  changedBy: string = '';

  constructor(
    public dialogRef: MatDialogRef<DutyInsertPeriodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InsertPeriodData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.isValid()) {
      return;
    }

    const result: InsertPeriodResult = {
      startDate: this.startDate!,
      days: this.days,
      reason: this.reason.trim(),
      changedBy: this.changedBy.trim()
    };

    this.dialogRef.close(result);
  }

  isValid(): boolean {
    return (
      this.startDate !== null &&
      this.days > 0 &&
      this.days <= 365 &&
      this.changedBy.trim() !== ''
    );
  }

  getEndDate(): string {
    if (!this.startDate || this.days <= 0) {
      return '';
    }
    const endDate = addDays(this.startDate, this.days - 1);
    return format(endDate, 'yyyy/MM/dd');
  }

  getStartDateString(): string {
    if (!this.startDate) {
      return '';
    }
    return format(this.startDate, 'yyyy/MM/dd');
  }
}
