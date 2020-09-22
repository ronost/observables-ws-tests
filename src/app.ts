import { TestObservables } from "./testobservables";

const testObservables = new TestObservables();

testObservables.getObservable1MultipliedByTwo().subscribe(val => {
    console.log("observable 1 value: ", val);
});
