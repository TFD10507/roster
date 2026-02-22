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
  rangeType: "single" | "period" = "period";
  changedBy: string = "";
  useCustomName: boolean = false;
  customPersonName: string = "";

  constructor(
    public dialogRef: MatDialogRef<DutyChangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DutyChangeDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.isValid()) {
      return;
    }

    let selectedPerson: any;
    
    if (this.useCustomName) {
      // 使用自訂人員
      selectedPerson = {
        name: this.customPersonName.trim(),
        color: { primary: 'gray', secondary: 'lightgray' }
      };
    } else {
      // 使用清單中的人員
      selectedPerson = this.data.peopleList[this.selectedPersonIndex];
    }

    const result: DutyChangeResult = {
      selectedPerson: selectedPerson,
      isWholePeriod: this.rangeType === "period",
      changedBy: this.changedBy.trim(),
    };

    this.dialogRef.close(result);
  }

  isValid(): boolean {
    if (this.changedBy.trim() === "") {
      return false;
    }

    if (this.useCustomName) {
      // 自訂人員模式：檢查是否填寫名字且與當前人員不同
      return this.customPersonName.trim() !== "" && 
             this.customPersonName.trim() !== this.data.currentPerson;
    } else {
      // 清單選擇模式：檢查是否選擇了人員且與當前人員不同
      return this.selectedPersonIndex >= 0 &&
             this.data.peopleList[this.selectedPersonIndex]?.name !== this.data.currentPerson;
    }
  }

  getSelectedPersonName(): string {
    if (this.useCustomName) {
      return this.customPersonName.trim();
    } else if (this.selectedPersonIndex >= 0) {
      return this.data.peopleList[this.selectedPersonIndex]?.name || "";
    }
    return "";
  }

  onModeChange(): void {
    // 切換模式時清空選擇
    if (this.useCustomName) {
      this.selectedPersonIndex = -1;
    } else {
      this.customPersonName = "";
    }
  }
}
