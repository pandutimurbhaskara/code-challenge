var sum_to_n_a = function(n) {
    // Iterative approach
    // Iterate from 1 to n and add each value to sum.
    //
    // Time Complexity: O(n)
    //   The loop runs n times.
    //
    // Space Complexity: O(1)
    //   Only a fixed amount of extra memory is used (sum and i).
    var sum = 0;

    for (var i = 1; i <= n; i++) {
        sum += i;
    }

    return sum;
};


var sum_to_n_b = function(n) {
    // Mathematical formula
    // Use the formula n * (n + 1) / 2 to calculate the sum directly.
    //
    // Time Complexity: O(1)
    //   The calculation takes the same amount of time regardless of n.
    //
    // Space Complexity: O(1)
    //   Only a fixed amount of memory is used.
    return n > 0 ? n * (n + 1) / 2 : 0;
};


var sum_to_n_c = function(n) {
    // Recursive approach
    // The sum of n is n + sum of (n - 1).
    // The recursion continues until n reaches 0.
    //
    // Time Complexity: O(n)
    //   The function is called once for each value from n down to 0.
    //
    // Space Complexity: O(n)
    //   Each recursive call is stored on the call stack,
    //   resulting in n stack frames.
    if (n <= 0) {
        return 0;
    }

    return n + sum_to_n_c(n - 1);
};