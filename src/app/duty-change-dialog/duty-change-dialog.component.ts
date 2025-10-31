import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface DutyChangeDialogData {
  currentPerson: string;
  dutyTypeName: string;
  peopleList: any[];
  clickedDate: string;
  periodText?: string;
  totalDays?: number;
  allowPeriodSelection?: boolean;
}

export interface DutyChangeResult {
  selectedPerson: any;
  isWholePeriod: boolean;
  changedBy: string;
}

@Component({
  selector: "app-duty-change-dialog",
  templateUrl: "./duty-change-dialog.component.html",
  styleUrls: ["./duty-change-dialog.component.scss"],
})
export class DutyChangeDialogComponent {
  selectedPersonIndex: number = -1;
  rangeType: "single" | "period" = "single";
  changedBy: string = "";

  constructor(
    public dialogRef: MatDialogRef<DutyChangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DutyChangeDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedPersonIndex < 0) {
      return;
    }
    if (this.changedBy.trim() == "") {
      return;
    }

    const selectedPerson = this.data.peopleList[this.selectedPersonIndex];
    const result: DutyChangeResult = {
      selectedPerson: selectedPerson,
      isWholePeriod: this.rangeType === "period",
      changedBy: this.changedBy.trim(),
    };

    this.dialogRef.close(result);
  }

  isValid(): boolean {
    return (
      this.changedBy.trim() != "" &&
      this.selectedPersonIndex >= 0 &&
      this.data.peopleList[this.selectedPersonIndex]?.name !==
        this.data.currentPerson
    );
  }

  getSelectedPersonName(): string {
    if (this.selectedPersonIndex >= 0) {
      return this.data.peopleList[this.selectedPersonIndex]?.name || "";
    }
    return "";
  }
}
