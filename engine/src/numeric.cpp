#include <numeric>
#include <vector>
#include <cmath>
#include <algorithm>
#include <Eigen/Dense>

namespace equacore {
namespace numeric {

    // --- High Performance GCD/LCM ---
    // Using std::gcd (C++17) which is usually optimized hardware instruction
    long long gcd(long long a, long long b) {
        return std::gcd(a, b);
    }

    long long lcm(long long a, long long b) {
        return std::lcm(a, b);
    }

    // --- Fast Prime Check (Miller-Rabin could be added for larger numbers) ---
    // For now, optimized trial division for < 10^12
    bool is_prime(long long n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (long long i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0)
                return false;
        }
        return true;
    }

    // --- Statistics (using Welford's online algorithm for variance) ---
    struct Stats {
        double mean;
        double variance;
        double std_dev;
    };

    Stats calculate_stats(const Eigen::VectorXd& data) {
        double mean = 0.0;
        double M2 = 0.0;
        long count = 0;

        for (long i = 0; i < data.size(); ++i) {
            double x = data[i];
            count++;
            double delta = x - mean;
            mean += delta / count;
            double delta2 = x - mean;
            M2 += delta * delta2;
        }

        double variance = (count > 1) ? M2 / (count - 1) : 0.0;
        return {mean, variance, std::sqrt(variance)};
    }
    
    // --- Vector Operations not in Eigen ---
    // Moving average
    Eigen::VectorXd moving_average(const Eigen::VectorXd& data, int window) {
        if (window <= 0 || window > data.size()) return data;
        
        Eigen::VectorXd result(data.size() - window + 1);
        double sum = 0.0;
        
        // First window
        for (int i = 0; i < window; ++i) sum += data[i];
        result[0] = sum / window;
        
        // Slide
        for (int i = 1; i < result.size(); ++i) {
            sum -= data[i - 1];
            sum += data[i + window - 1];
            result[i] = sum / window;
        }
        
        return result;
    }

} // namespace numeric
} // namespace equacore
