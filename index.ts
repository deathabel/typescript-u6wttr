interface Observer {
  notify(message: any): void;
}

class Observable {
  private observers: Observer[] = [];

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
  subscribe(notify: (message: any) => any): Subscription {
    return new Subscription(this, this.observers.push({ notify }) - 1);
  }

  removeObserver(index: number) {
    this.observers.splice(index, 1);
  }
}

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
      this.stock += Math.ceil(Math.random() * 10);
      if (this.stock > this.maxStock) this.stock = this.maxStock;
      this.element.innerHTML = this.stock.toString();
      this.stockChange$.notifyObservers(this.stock);
    }, 2000);
  }

  stockOut(quantity: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.stock < quantity) {
        reject();
      } else {
        this.stock -= quantity;
        this.element.innerHTML = this.stock.toString();
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
  }
}

let mineral = new Mineral(document.querySelector('#mineral'));
let truck = new Truck(document.querySelector('.truck'));
let repository = new Repository(document.querySelector('#repository'));

mineral.digging();

mineral.stockChange$.subscribe((stones) => {
  console.log(truck.isReady, stones);
  if (truck.isReady)
    mineral
      .stockOut(10)
      .then((stones) => truck.transport(stones))
      .then((stones) => repository.stockIn(stones));
});
