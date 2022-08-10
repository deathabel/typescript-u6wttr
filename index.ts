class Mineral {
  private readonly maxStock: number = 50;
  private stock: number = 0;

  constructor(private element: Element) {
    this.element = element;
  }

  digging(): void {
    setInterval(() => {
      const quantity = Math.ceil(Math.random() * 10);
      this.stock += quantity;
      if (this.stock > this.maxStock) this.stock = this.maxStock;
      this.element.innerHTML = this.stock.toString();
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
    this.element.innerHTML = this.stock.toString();
  }
}

let mineral = new Mineral(document.querySelector('#mineral'));
let truck = new Truck(document.querySelector('.truck'));
let repository = new Repository(document.querySelector('#repository'));
