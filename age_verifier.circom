pragma circom 2.0.0;

include "comparators.circom";

template IsAdult() {
    signal input birthYear;
    signal output isAdult;

    var currentYear = 2025;

    signal age;
    age <== currentYear - birthYear;

    component gte18 = GreaterEqThan(16);  
    gte18.in[0] <== age;
    gte18.in[1] <== 18;

    isAdult <== gte18.out;
}

component main = IsAdult();