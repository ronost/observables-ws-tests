"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var testobservables_1 = require("./testobservables");
var testObservables = new testobservables_1.TestObservables();
testObservables.getObservable1MultipliedByTwo().subscribe(function (val) {
    console.log("observable 1 value: ", val);
});
