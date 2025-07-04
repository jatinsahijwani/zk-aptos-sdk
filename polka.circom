template SumCheck() {
    signal input a;
    signal input b;
    signal output sum;

    sum <== a + b;
}

component main = SumCheck();