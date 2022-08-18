import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  from,
  Observable,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { map, debounceTime, tap } from 'rxjs/operators';

type dataType = {
  site_id: string;
  area: number;
  population_density: number;
};

type conditionType = {
  property?: string;
  keyword?: string;
  orderSeq?: number;
  operator?: string;
  operand?: number;
} | null;

function request(method, url): Observable<any> {
  return from(
    new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send();
    })
  );
}

function getData(): Observable<dataType[]> {
  return request(
    'get',
    'https://raw.githubusercontent.com/deathabel/typescript-u6wttr/RxjsDemo/data.json'
  ).pipe(
    map((data: dataType[]) => {
      for (let item of data) {
        item.area = parseFloat(item.area.toString());
        item.population_density = parseInt(item.population_density.toString());
      }
      return data;
    })
  );
}
function filterSize(operator: string) {
  return function (a, b): boolean {
    switch (operator) {
      case '>=':
        return a >= b;
      case '>':
        return a > b;
      case '=':
        return a === b;
      case '<=':
        return a <= b;
      case '<':
        return a < b;
      default:
        return true;
    }
  };
}

/**
 * Grid
 * *** Warning ***
 * Just use for test case
 * Using innerHTML without check script had xss issue, avoid to use
 */
class Grid<T extends { [key: string]: any }> {
  private contentElement: HTMLElement;
  private contentHtmlTemplate: string;
  private filterSubject = new BehaviorSubject<conditionType>({});
  private filterConditionChanged$: Observable<conditionType>;
  private dataSubject = new BehaviorSubject<T[]>([]);
  dataChanged$: Observable<T[]>;

  constructor(
    private gridElement: HTMLElement,
    private readData: () => Observable<T[]>
  ) {
    this.contentElement = this.gridElement.querySelector('.grid-row');
    this.contentHtmlTemplate = this.contentElement.innerHTML;
    this.initGrid();
    // filter observable
    this.filterConditionChanged$ = this.filterSubject.pipe(debounceTime(300));
    // data observable
    this.dataChanged$ = this.dataSubject.pipe(
      switchMap(readData),
      switchMap((data) =>
        this.filterConditionChanged$.pipe(
          map((condition) => this.filterAndSortData(condition)(data))
        )
      )
    );
    // subscribe
    this.dataChanged$.subscribe(this.renderGrid.bind(this));
  }
  protected getToolHtmlTemplate(type: 'Keyword' | 'sort' | 'filter'): string {
    return document.querySelector(`#${type}Template`)?.innerHTML;
  }
  protected initGrid() {
    for (let titleElement of this.gridElement
      .querySelector('.grid-title')
      .querySelectorAll('[g-property]')) {
      titleElement.innerHTML += this.getToolHtmlTemplate('Keyword');
    }
  }

  search(): void {
    this.dataSubject.next([]);
  }

  filter(condition: conditionType): void {
    this.filterSubject.next(condition);
  }

  private renderGrid(data: T[]): void {
    let contentTemplate = '';
    for (let i = 0; i < data.length; i++) {
      let templateHtml = this.contentHtmlTemplate;
      for (const col in data[i]) {
        templateHtml = templateHtml.replace(
          new RegExp(`\\{\\{${col}\\}\\}`, 'g'),
          data[i][col]
        );
      }
      contentTemplate += templateHtml;
    }
    this.contentElement.innerHTML = contentTemplate;
  }

  private filterAndSortData(condition: conditionType): (data: T[]) => T[] {
    // data filter function
    const filterFn = (item: T) => {
      return (
        (!condition?.keyword ||
          item[condition.property].includes(condition.keyword)) &&
        filterSize(condition?.operator)(
          item[condition.property],
          condition?.operand
        )
      );
    };
    return (data) =>
      data
        .filter(filterFn)
        .sort((prev, next) =>
          !!condition?.orderSeq
            ? prev[condition.property] >= next[condition.property]
              ? condition.orderSeq
              : condition.orderSeq * -1
            : 0
        );
  }
}

/**
 * Try
 */
globalThis.grid = new Grid(document.querySelector('.grid'), getData);

// 使用 currying 技巧，將filter和Sort條件先設定好，後續交由其他程序執行

// return function

//let gridSubject = new Subject<conditionType>();
// normal subject
// gridSubject.next(null);
// behavior subject
// console.log(gridSubject.value)

function filterGrid(fn: (element: any, cmd: conditionType) => void) {
  return (event: any) => {
    // reference object 特性
    fn.call(event.target, event.target, gridSubject?.value);
    gridSubject.next(gridSubject?.value);
  };
}

// (document.querySelector('#searchInput') as HTMLInputElement).addEventListener(
//   'keyup',
//   filterGrid((element, command) => {
//     command.property = element.getAttribute('g-property')
//     console.log(element.getAttribute('g-property'))
//     command.keyword = element.value;
//   })
// );
// (document.querySelector('#orderBy') as HTMLSelectElement).addEventListener(
//   'change',
//   filterGrid((element, command) => {
//     command.property = element.getAttribute('g-property')
//     command.orderSeq = element.value === 'asc' ? 1 : -1
//   })
// );
// (document.querySelector('#filter') as HTMLSelectElement).addEventListener(
//   'change',
//   filterGrid((element, command) => (command.operator = element.value))
// );
// (document.querySelector('#filterInput') as HTMLInputElement).addEventListener(
//   'keyup',
//   filterGrid((element, command) => (command.operand = element.value))
// );
