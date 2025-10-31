import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DutyDatabaseService, DutyChange } from '../services/duty-database.service';
import { Subscription } from 'rxjs';
import { format } from 'date-fns';

@Component({
  selector: 'app-duty-history',
  templateUrl: './duty-history.component.html',
  styleUrls: ['./duty-history.component.scss']
})
export class DutyHistoryComponent implements OnInit, OnDestroy {
  dutyChanges: DutyChange[] = [];
  filteredChanges: DutyChange[] = [];
  
  // 篩選條件
  filterType: 'all' | 'normal' | 'uat' = 'all';
  filterPerson: string = '';
  filterDateRange: string = '';
  sortBy: 'date' | 'person' | 'changeTime' = 'changeTime';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // 分頁
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  private subscription?: Subscription;

  constructor(
    private dutyDatabaseService: DutyDatabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDutyChanges();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /** 載入異動記錄 */
  loadDutyChanges(): void {
    this.subscription = this.dutyDatabaseService.getDutyChanges().subscribe(changes => {
      this.dutyChanges = changes;
      this.applyFilters();
    });
  }

  /** 套用篩選條件 */
  applyFilters(): void {
    let filtered = [...this.dutyChanges];

    // 依類型篩選
    if (this.filterType !== 'all') {
      filtered = filtered.filter(change => change.dutyType === this.filterType);
    }

    // 依人員篩選
    if (this.filterPerson.trim()) {
      const searchTerm = this.filterPerson.toLowerCase();
      filtered = filtered.filter(change => 
        change.originalPerson.toLowerCase().includes(searchTerm) ||
        change.newPerson.toLowerCase().includes(searchTerm) ||
        change.changedBy.toLowerCase().includes(searchTerm)
      );
    }

    // 依日期範圍篩選
    if (this.filterDateRange.trim()) {
      const targetMonth = this.filterDateRange;
      filtered = filtered.filter(change => 
        change.date.startsWith(targetMonth)
      );
    }

    // 排序
    this.sortChanges(filtered);
    
    this.filteredChanges = filtered;
    this.calculatePagination();
  }

  /** 排序異動記錄 */
  sortChanges(changes: DutyChange[]): void {
    changes.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'person':
          comparison = a.originalPerson.localeCompare(b.originalPerson);
          break;
        case 'changeTime':
        default:
          comparison = a.changedAt.toMillis() - b.changedAt.toMillis();
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /** 計算分頁 */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredChanges.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  /** 取得當前頁面的資料 */
  getPaginatedChanges(): DutyChange[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredChanges.slice(startIndex, endIndex);
  }

  /** 變更頁面 */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /** 取得頁面陣列 */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /** 格式化日期時間 */
  formatDateTime(timestamp: any): string {
    return timestamp.toDate().toLocaleString('zh-TW');
  }

  /** 格式化日期 */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy/MM/dd');
    } catch {
      return dateString;
    }
  }

  /** 取得值班類型名稱 */
  getDutyTypeName(dutyType: string): string {
    return dutyType === 'uat' ? 'UAT測資' : '一般值班';
  }

  /** 清除篩選條件 */
  clearFilters(): void {
    this.filterType = 'all';
    this.filterPerson = '';
    this.filterDateRange = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /** 回到值班日曆 */
  goBack(): void {
    this.router.navigate(['/']);
  }

  /** 匯出CSV */
  exportToCSV(): void {
    const headers = ['日期', '值班類型', '原負責人', '新負責人', '異動者', '異動時間'];
    const csvData = this.filteredChanges.map(change => [
      this.formatDate(change.date),
      this.getDutyTypeName(change.dutyType),
      change.originalPerson,
      change.newPerson,
      change.changedBy,
      this.formatDateTime(change.changedAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `值班異動記錄_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}