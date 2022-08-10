import { BehaviorSubject, EMPTY, merge, Observable, of, Subject } from 'rxjs';
import { connect, filter, map, min, switchMap, tap } from 'rxjs/operators';

type changeStockCommand = { type: 'in' | 'out'; quantity: number };
type stockChanged = { type: 'in' | 'out'; quantity: number; total: number };

class Mineral {
  private readonly _repository: Repository = new Repository(50);

  constructor() {}

  get stockChanged$(): Observable<stockChanged> {
    return this._repository.stockChanged$;
  }

  digging(): void {
    setInterval(() => {
      const quantity = Math.ceil(Math.random() * 10);
      this._repository.stockIn(this._foundGold(quantity));
    }, 1000);
  }

  getGold$(quantity: number): Observable<string[]> {
    if (this._repository.stock < quantity) return EMPTY;
    const gold = this._foundGold(quantity);
    this._repository.stockOut(gold);
    return of(gold);
  }
  private _foundGold(quantity: number) {
    return Array(quantity).fill('gold');
  }
}

type truckState = { status: 'ready' | 'onway' | 'arrived'; cargo?: any };

class Truck {
  private _duration = 2000;
  private _state: truckState = { status: 'ready' };
  private _changeState$: Subject<truckState> = new Subject();
  state$: Observable<truckState>;

  constructor() {
    this.state$ = this._changeState$.pipe(
      map((state) => (this._state = state))
    );
  }

  get isReady(): boolean {
    return this._state.status === 'ready';
  }

  transport$(stones: string[]): Observable<string[]> {
    if (!this.isReady) return EMPTY;
    this._changeState$.next({ status: 'onway', cargo: stones });
    setTimeout(() => {
      this._changeState$.next({ status: 'arrived', cargo: stones });
      setTimeout(
        () => this._changeState$.next({ status: 'ready', cargo: stones }),
        500
      );
    }, this._duration);
    return this.state$.pipe(
      filter((truck) => truck.status === 'arrived'),
      map((truck) => truck.cargo)
    );
  }
}

class Repository {
  private _stock: number = 0;
  private _changeStock$: BehaviorSubject<changeStockCommand> =
    new BehaviorSubject({ type: 'in', quantity: this._stock });
  stockChanged$: Observable<stockChanged>;

  constructor(private _maxStock: number) {
    this._maxStock = _maxStock;
    this.stockChanged$ = this._changeStock$.pipe(
      map((command) => ({ ...command, total: this._stock }))
    );
    this._changeStock$.subscribe(this._changeStock.bind(this));
  }

  get stock(): number {
    return this._stock;
  }

  stockIn(stones: string[]): void {
    this._changeStock$.next({ type: 'in', quantity: stones.length });
  }

  stockOut(stones: string[]): void {
    this._changeStock$.next({ type: 'out', quantity: stones.length });
  }

  private _changeStock(command: changeStockCommand): number {
    this._stock += command.quantity * (command.type === 'in' ? 1 : -1);
    return this._stock > this._maxStock
      ? (this._stock = this._maxStock)
      : this._stock;
  }
}

let mineral = new Mineral();
let truck = new Truck();
let repository = new Repository(999);

// render element
mineral.stockChanged$.subscribe((stock) => {
  document.querySelector('#mineral').innerHTML = stock.total.toString();
});

truck.state$
  .pipe(
    connect(($shared) =>
      merge(
        $shared.pipe(
          filter((t) => t?.status === 'onway'),
          tap((t) =>
            document.querySelector('.truck').setAttribute('transport', '')
          )
        ),
        $shared.pipe(
          filter((t) => t?.status === 'arrived'),
          tap((t) =>
            document.querySelector('.truck').removeAttribute('transport')
          )
        )
      )
    )
  )
  .subscribe();

repository.stockChanged$.subscribe((stock) => {
  document.querySelector('#repository').innerHTML = stock.total.toString();
});

// mineral event
mineral.stockChanged$
  .pipe(
    filter(
      (stock) => stock.type === 'in' && stock.total >= 10 && truck.isReady
    ),
    switchMap(() => mineral.getGold$(10)),
    switchMap((stones) => truck.transport$(stones))
  )
  .subscribe();

// transport event
truck.state$
  .pipe(
    filter((t) => t?.status === 'arrived'),
    tap((t) => repository.stockIn(t.cargo))
  )
  .subscribe();

// start digging
mineral.digging();
