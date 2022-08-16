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
  area: string;
  population_density: number;
};

type conditionType = {
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
var contentHtmlTemplate: string;
function renderGrid(data: dataType[]) {
  const gridElement = document.querySelector('.grid');
  const contentElement = gridElement.querySelector('.grid-row');
  if (!contentHtmlTemplate) contentHtmlTemplate = contentElement.innerHTML;
  let contentTemplate = '';
  for (let i = 0; i < data.length; i++) {
    let templateHtml = contentHtmlTemplate;
    for (const col in data[i]) {
      templateHtml = templateHtml.replace(
        new RegExp(`\\{\\{${col}\\}\\}`, 'g'),
        data[i][col]
      );
    }
    contentTemplate += templateHtml;
  }
  contentElement.innerHTML = contentTemplate;
}
function getData(): Observable<dataType[]> {
  return request(
    'get',
    'https://raw.githubusercontent.com/deathabel/typescript-u6wttr/RxjsDemo/data.json'
  );
}
function filterSize(operator: string) {
  return function (a, b): boolean {
    a = parseInt(a);
    b = parseInt(b);
    if (a === NaN || b === NaN) return false;
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
 * Try
 */

// 使用 currying 技巧，將filter和Sort條件先設定好，後續交由其他程序執行
function filterAndSortData(
  condition: conditionType
): (data: dataType[]) => dataType[] {
  // data filter function
  const filterFn = (item: dataType) =>
    (!condition?.keyword || item.site_id.includes(condition.keyword)) &&
    filterSize(condition?.operator)(
      item.population_density,
      condition?.operand
    );
  // return function
  return (data) =>
    data
      .filter(filterFn)
      .sort((prev, next) =>
        !!condition?.orderSeq
          ? prev.area >= next.area
            ? condition.orderSeq
            : condition.orderSeq * -1
          : 0
      );
}
//let gridSubject = new Subject<conditionType>();
let gridSubject = new BehaviorSubject<conditionType>({});
let grid$ = gridSubject.pipe(
  debounceTime(300),
  tap(console.log),
  switchMap((condition) => getData().pipe(map(filterAndSortData(condition))))
);

grid$.subscribe(renderGrid);
// normal subject
// gridSubject.next(null);
// behavior subject
// console.log(gridSubject.value)

function orderByAreaChanged(event) {
  const orderSeq = this.value === 'asc' ? 1 : -1;
  // getData()
  //   .pipe(
  //     filter((data) => this.value !== ''),
  //     map((data: any) =>
  //       data.sort((prev, next) =>
  //         prev.area >= next.area ? orderSeq : orderSeq * -1
  //       )
  //     )
  //   )
  //   .subscribe(renderGrid);
  gridSubject.next({ orderSeq });
}
/*
 * 1. 當使用者將Keyword都輸入完畢後才進行查詢 ex. keyup過300ms才觸發搜尋
 * 2. 當輸入值與前次值相同時不重複搜尋
 */
function siteSearchInputChanged(event) {
  gridSubject.next({ keyword: this.value });
}

function filterPopulationSelectChanged(event) {
  //console.log(this.value);
  const command = gridSubject?.value;
  command.operator = this.value;
  gridSubject.next(command);
}

function filterPopulationInputChanged(event) {
  //console.log(this.value);
  const command = gridSubject.value;
  command.operand = this.value;
  gridSubject.next(command);
}

(document.querySelector('#searchInput') as HTMLInputElement).addEventListener(
  'keyup',
  siteSearchInputChanged
);
(document.querySelector('#orderBy') as HTMLInputElement).addEventListener(
  'change',
  orderByAreaChanged
);
(document.querySelector('#filter') as HTMLInputElement).addEventListener(
  'change',
  filterPopulationSelectChanged
);
(document.querySelector('#filterInput') as HTMLInputElement).addEventListener(
  'keyup',
  filterPopulationInputChanged
);
