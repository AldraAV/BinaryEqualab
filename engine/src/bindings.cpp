#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <cmath>
#include <string>
#include <map>

namespace py = pybind11;

// --- High Performance Number Theory ---

// Optimized primality test (Trial Division)
bool is_prime(long long n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long long i = 5; i * i <= n; i = i + 6)
        if (n % i == 0 || n % (i + 2) == 0)
            return false;
    return true;
}

// Fast Factorization
std::map<long long, int> get_factors(long long n) {
    std::map<long long, int> factors;
    
    // Count 2s
    while (n % 2 == 0) {
        factors[2]++;
        n /= 2;
    }
    
    // Count odd numbers
    for (long long i = 3; i * i <= n; i = i + 2) {
        while (n % i == 0) {
            factors[i]++;
            n /= i;
        }
    }
    
    // If n > 2, it is a prime factor itself
    if (n > 2)
        factors[n]++;
        
    return factors;
}

// Numerical Integration (Trapezoidal Rule)
double integrate(const std::function<double(double)> &func, double a, double b, int steps) {
    double h = (b - a) / steps;
    double sum = 0.5 * (func(a) + func(b));
    for (int i = 1; i < steps; ++i) {
        double x = a + h * i;
        sum += func(x);
    }
    return sum * h;
}


PYBIND11_MODULE(_equacore, m) {
    m.doc() = "EquaCore - High-performance numerical C++ engine for Binary EquaLab";
    
    m.def("is_prime", &is_prime, "Check if a number is prime (C++ optimized)");
    
    m.def("factorize", &get_factors, "Get prime factorization as a dict {factor: power}");
    
    m.def("integrate", &integrate, "Numerical integration using Trapezoidal rule",
          py::arg("func"), py::arg("a"), py::arg("b"), py::arg("steps") = 1000);

    m.attr("__version__") = "0.0.1";
}
