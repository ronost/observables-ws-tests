"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestObservables = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var TestObservables = /** @class */ (function () {
    function TestObservables() {
        this.observable1$ = new rxjs_1.Observable(function (subscriber) {
            subscriber.next(1);
            subscriber.next(2);
            subscriber.next(3);
            subscriber.complete();
        });
    }
    ;
    TestObservables.prototype.getObservable1MultipliedByTwo = function () {
        return this.observable1$.pipe(operators_1.map(function (n) { return n * 2; }));
    };
    return TestObservables;
}());
exports.TestObservables = TestObservables;
