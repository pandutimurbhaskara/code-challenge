var sum_to_n_a = function(n) {
    // Iterative approach
    // On this version we iterate the value from 1 to n
    // then add it to value (initally 0)
    var sum = 0;

    for (var i = 1; i <= n; i++) {
        sum += i;
    }

    return sum;
};

var sum_to_n_b = function(n) {
    // Mathematical formula
    // Use this formula to sum from 1 to n by using n value
    return n > 0 ? n * (n + 1) / 2 : 0;
};

var sum_to_n_c = function(n) {
    // Recursive approach
    // sum of n is sum of n-1 (before n) + n value. iterate back until found the result
    if (n <= 0) {
        return 0;
    }

    return n + sum_to_n_c(n - 1);
};