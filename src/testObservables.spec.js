const { Observable, of, from, interval } = require('rxjs');
const { map, delay, take, takeLast, throttleTime } = require('rxjs/operators');
const { TestScheduler } = require('rxjs/testing');
const { cold } = require('jasmine-marbles');

const TestObservables = require('./testobservables').TestObservables

/**
 * TestScheduler:
 * 
 * "-" time: 10 "frames" of time passage.
 * "|" complete: The successful completion of an observable. This is the observable producer signaling complete()
 * "#" error: An error terminating the observable. This is the observable producer signaling error()
 * "a" any character: All other characters represent a value being emitted by the producure signaling next()
 * "()" sync groupings: When multiple events need to single in the same frame synchronously, parenthesis are used to group those events. You can group nexted values, a completion or an error in this manner. The position of the initial ( determines the time at which its values are emitted.
 * "^" subscription point: (hot observables only) shows the point at which the tested observables will be subscribed to the hot observable. This is the "zero frame" for that observable, every frame before the ^ will be negative.
 *
 * Timefactor:
 * 
 * Inside TestScheduler run callback, the fram time factor is set to 1ms. So every emission in a marble diagram is 1ms.
 * Outside the run callback (e.g in jasmine marbles case), the timefactor is 10ms.
 * 
 * Source: https://medium.com/angular-in-depth/testing-asynchronous-rxjs-operators-5495784f249e
 * 
 */

/**
 * Jasmine marbles:
 * 
 * RxJS marble testing allows for a more natural style of tedting observables. 
 * To get started, you will need to include a few helpers libraries, if you use 
 * jasmine, you can directly download jasmine-marbles. These libraries provide 
 * helpers for parsing marble diagrams and asserting against the subscription 
 * points and result of your observables under test.
 * - `-` (dash): indicates a passing of time, you can thing of each dash as 10ms when it comes to your tests;
 * - `a`, `b`, `c`... (characters): each character insde the dash indicates an emission;
 * - `|` (pipes): indicate the completion point of an observable;
 * - `()` (parenthesis): indicate the multiple emission in the same time frame;
 * - `^` (caret): indicates the starting point of a subscription;
 * - `!` (exclamation point): indicates the end point of a subscription;
 * - `#` (pound sign): indicates error;
 * 
 */

describe('testObservable test', () => {
    let scheduler;
    let testObservables = new TestObservables();
    beforeEach(() => {
        scheduler = new TestScheduler((actual, expected) => { 
            // assert deep equals callback https://rxjs-dev.firebaseapp.com/api/testing/TestScheduler
            // epectObservable() only prepares and converts Observable values to something comparable (an array of actual and expected values).
            // It's this callback's responsibility to assert deep equality using appropriate test.
            console.log('actual: ', actual);
            console.log('expected: ', expected);
            expect(actual).toEqual(expected);
        });
    });

    afterEach(() => {
        scheduler.flush();
    });

    describe('test case - synchronous (same frame): ', () => {
        beforeEach(() => {
            // "mock"
            //testObservables.observable1$ = of(1,2,3);
            testObservables.observable1$ = new Observable(subscriber => {
                subscriber.next(1);
                subscriber.next(2);
                subscriber.next(3);
                subscriber.complete();
              });
        });

        it('subscribe and assert pattern', done => {
            const expected = [2,4,6];
            const results = [];
            let sub = testObservables.getObservable1MultipliedByTwo().subscribe(value => results.push(value), () => {}, () => {
                expect(results).toEqual(expected);
                done();    
            });
            expect(sub.closed).toBe(true);
        });

        it('marble testing with diagram pattern', () => {
            scheduler.run(({ expectObservable }) => {
                const expectedDiagram = '(abc|)';
                const expectedValues = {a: 2, b: 4, c: 6};
            
                expectObservable(testObservables.getObservable1MultipliedByTwo()).toBe(expectedDiagram, expectedValues);
              });
        });
    });

    describe('test case - asynchronous (multiple frames): ', () => {
        beforeEach(() => {
            // "mock"
            testObservables.observable1$ = interval(10).pipe(
                take(3),
                map(v => (v + 1))
            );
        });

        it('subscribe and assert pattern', done => {
            const results = [];
            testObservables.getObservable1MultipliedByTwo().subscribe(value => results.push(value), () => {}, () => {
                expect(results).toEqual([2,4,6]);
                done();    
            });
        });

        it('marble testing with diagram pattern', () => {
            scheduler.run(({ expectObservable }) => {
                const expectedDiagram = '10ms a 9ms b 9ms (c|)'; //'----------a----------b----------(c|)'
                const expectedValues = {a: 2, b: 4, c: 6};
            
                expectObservable(testObservables.getObservable1MultipliedByTwo()).toBe(expectedDiagram, expectedValues);
            });
        });
    });

    describe('test case - mock observable and compare testSceduler to jasmine-marbles: ', () => {
        it('marble testing with diagram pattern', () => {
            scheduler.run(({ cold, expectObservable }) => {
                testObservables.observable1$ = cold('----------a----------b----------(c|)', { a: 1, b: 2, c: 3 }); // Frame time factor is 1ms (inside .run())
                const expectedDiagram = '10ms a 10ms b 10ms (c|)';
                const expectedValues = {a: 2, b: 4, c: 6};
            
                expectObservable(testObservables.getObservable1MultipliedByTwo()).toBe(expectedDiagram, expectedValues);
            });
        });

        it('marble testing with diagram pattern using jasmine-marbles', () => {
            // Why not to use: https://github.com/ngrx/platform/issues/1740 ???
            testObservables.observable1$ = cold('-a-b-(c|)', { a: 1, b: 2, c: 3 }); // Frame time factor is 10ms. (outside .run())
            let expected = cold('10ms a 10ms b 10ms (c|)', {a: 2, b: 4, c: 6});
        
            expect(testObservables.getObservable1MultipliedByTwo()).toBeObservable(expected);
        });
    });

    describe('test case - hot observables and subscriptions: ', () => {
        it('should showcase multiple subscriptions to hot observable', () => {
            scheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
                const stream$ = hot('-a-b-c-d-e-f-g-', {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7});

                const subscription1 = '^--!';
                const expectedDiagram1 = '-a';
                const expectedValues1 = {a: 1};

                const subscription2 = '--^-----!';
                const expectedDiagram2 = '---b-c-d-';
                const expectedValues2 = {b: 2, c: 3, d: 4};

                const subscription3 = '--------^';
                const expectedDiagram3 = '---------e-f-g';
                const expectedValues3 = {e: 5, f: 6, g: 7};

                expectObservable(stream$, subscription1).toBe(expectedDiagram1, expectedValues1);
                expectObservable(stream$, subscription2).toBe(expectedDiagram2, expectedValues2);
                expectObservable(stream$, subscription3).toBe(expectedDiagram3, expectedValues3);

                expectSubscriptions(stream$.subscriptions).toBe([subscription1, subscription2, subscription3]);
            });
        });
    });

    describe('test case - showcase testing errors: ', () => {
        it('marble testing with diagram pattern', () => {
            scheduler.run(({ cold, expectObservable }) => {
                testObservables.observable1$ = cold('-a-#-b-c', { a: 1, b: 2, c: 3 }, new Error('some error'));
                const expectedDiagram = '-a-#';
                const expectedValues = {a: 2};
                const expectedError = new Error('some error');
            
                expectObservable(testObservables.getObservable1MultipliedByTwo()).toBe(expectedDiagram, expectedValues, expectedError);
            });
        });
    });
});