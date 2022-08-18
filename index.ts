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

type conditionType = {
  property?: string;
  keyword?: string;
  orderSeq?: number;
  operator?: string;
  operand?: number;
} | null;

class Grid<T extends { [key: string]: any }> {
  private contentElement: HTMLElement;
  private contentHtmlTemplate: string;
  private filterSubject = new BehaviorSubject<{
    [property: string]: conditionType;
  }>({});
  private filterConditionChanged$: Observable<{
    [property: string]: conditionType;
  }>;
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
      const property = titleElement.getAttribute('g-property');
      const tools = titleElement.getAttribute('g-tools');
      // render html
      titleElement.innerHTML += tools
        .split(/,/g)
        .map(this.getToolHtmlTemplate)
        .join('');
      // keyword event
      titleElement
        .querySelector('[g-tool-keyword]')
        ?.querySelector('input')
        ?.addEventListener(
          'keyup',
          this.filterFn(
            property,
            (element, command) => (command.keyword = element.value)
          )
        );
      // sort event
      titleElement
        .querySelector('[g-tool-sort]')
        ?.querySelector('select')
        ?.addEventListener(
          'change',
          this.filterFn(
            property,
            (element, command) =>
              (command.orderSeq = element.value === 'asc' ? 1 : -1)
          )
        );
      // filter event
      titleElement
        .querySelector('[g-tool-filter]')
        ?.querySelector('select')
        ?.addEventListener(
          'change',
          this.filterFn(
            property,
            (element, command) => (command.operator = element.value)
          )
        );
      titleElement
        .querySelector('[g-tool-filter]')
        ?.querySelector('input')
        ?.addEventListener(
          'keyup',
          this.filterFn(
            property,
            (element, command) => (command.operand = element.value)
          )
        );
    }
  }

  search(): void {
    this.dataSubject.next([]);
  }

  filter(condition: conditionType): void {
    if (!condition?.property) return;
    this.filterSubject.value[condition.property] = condition;
    this.filterSubject.next(this.filterSubject.value);
  }

  private filterFn(
    property: string,
    fn: (element: any, cmd: conditionType) => void
  ) {
    return (event: any) => {
      const condition = this.filterSubject.value[property] || { property };
      // reference object 特性
      fn.call(event.target, event.target, condition);
      this.filter.call(this, condition);
    };
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

  private filterAndSortData(propertyCondition: {
    [property: string]: conditionType;
  }): (data: T[]) => T[] {
    // data filter function
    const filterFn = (item: T) => {
      let result = true;
      for (const prop in item) {
        const condition = propertyCondition[prop];
        if (!condition) continue;
        if (
          !!condition?.keyword &&
          !item[prop]?.toString()?.includes(condition.keyword)
        )
          return false;
        if (filterSize(condition?.operator)) return false;
      }

      if (!condition?.property || !item[condition.property]) return true;
      console.log(item[condition.property], condition);
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
const grid = new Grid(document.querySelector('.grid'), getData);

// 使用 currying 技巧，將filter和Sort條件先設定好，後續交由其他程序執行

// return function

//let gridSubject = new Subject<conditionType>();
// normal subject
// gridSubject.next(null);
// behavior subject
// console.log(gridSubject.value)
