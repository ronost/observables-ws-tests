import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class TestObservables {
  public observable1$: Observable<number> = new Observable(subscriber => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });

  constructor() {};

  getObservable1MultipliedByTwo() {
    return this.observable1$.pipe(map((n: number) => n * 2));
  }

  }