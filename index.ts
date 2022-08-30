/** Observer interface */
interface Observer {
  /** 實作nofity function，提供Observable呼叫 */
  notify(message: any): void;
}
/** Observable interface */
class Observable {
  private observers: Observer[] = [];
  /**  通知所有的觀察者，並提供異動的資料 */
  notifyObservers(message: any): void {
    for (var observer of this.observers)
      new Promise((resolve, reject) => {
        try {
          resolve(observer.notify(message));
        } catch (ex) {
          reject(ex);
        }
      });
  }
  /** 提供Observer訂閱 */
  subscribe(observer: Observer): Subscription {
    return new Subscription(this, this.observers.push(observer) - 1);
  }

  removeObserver(index: number) {
    this.observers.splice(index, 1);
  }
}
/** Subscription interface */
class Subscription {
  constructor(private observable: Observable, private index: number) {
    this.observable = observable;
    this.index = index;
  }
  unsubscribe(): void {
    this.observable.removeObserver(this.index);
  }
}

class Mineral {
  private readonly maxStock: number = 50;
  private stock: number = 0;
  stockChange$: Observable;

  constructor(private element: Element) {
    this.element = element;
    this.stockChange$ = new Observable();
  }

  digging(): void {
    setInterval(() => {
      const quantity = Math.ceil(Math.random() * 10);
      this.stock += quantity;
      if (this.stock > this.maxStock) this.stock = this.maxStock;
      this.element.innerHTML = this.stock.toString();
      this.stockChange$.notifyObservers({ quantity, type: 'in' });
    }, 2000);
  }

  stockOut(quantity: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.stock < quantity) {
        reject();
      } else {
        this.stock -= quantity;
        this.element.innerHTML = this.stock.toString();
        this.stockChange$.notifyObservers({ quantity, type: 'out' });
        resolve(Array(quantity).fill('gold'));
      }
    });
  }
}

class Truck {
  private duration = 3000;
  private ready = true;

  constructor(private element: Element) {
    this.element = element;
  }

  get isReady(): boolean {
    return this.ready;
  }

  transport(stones: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.ready = false;
      this.element.setAttribute('transport', '');
      setTimeout(() => {
        this.ready = true;
        this.element.removeAttribute('transport');
        resolve(stones);
      }, this.duration);
    });
  }
}

class Repository {
  private stock: number = 0;

  constructor(private element: Element) {
    this.element = element;
  }

  stockIn(stones: string[]): void {
    this.stock += stones.length;
    this.element.innerHTML = this.stock.toString();
  }
}

let mineral = new Mineral(document.querySelector('#mineral'));
let truck = new Truck(document.querySelector('.truck'));
let repository = new Repository(document.querySelector('#repository'));

mineral.digging();

mineral.stockChange$.subscribe({
  notify: (stones) => {
    if (truck.isReady)
      mineral
        .stockOut(10)
        .then((stones) => truck.transport(stones))
        .then((stones) => repository.stockIn(stones));
  },
});

let log = document.querySelector('#log');
mineral.stockChange$.subscribe({
  notify: (message) => {
    log.innerHTML =
      `<p>${message.type} ${message.quantity}</p>` + log.innerHTML;
  },
});
