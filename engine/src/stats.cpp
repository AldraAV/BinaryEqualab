#include "equacore/stats.hpp"
#include <cmath>
#include <numeric>
#include <algorithm>

namespace equacore::stats {

Real Statistics::mean(const std::vector<Real>& data) {
    if (data.empty()) {
        throw std::invalid_argument("Cannot compute mean of an empty dataset.");
    }
    Real sum = std::accumulate(data.begin(), data.end(), 0.0);
    return sum / data.size();
}

Real Statistics::median(std::vector<Real> data) {
    if (data.empty()) {
        throw std::invalid_argument("Cannot compute median of an empty dataset.");
    }
    std::sort(data.begin(), data.end());
    size_t n = data.size();
    if (n % 2 != 0) {
        return data[n / 2];
    } else {
        return (data[(n - 1) / 2] + data[n / 2]) / 2.0;
    }
}

Real Statistics::population_variance(const std::vector<Real>& data) {
    if (data.empty()) {
        throw std::invalid_argument("Cannot compute variance of an empty dataset.");
    }
    Real m = mean(data);
    Real accum = 0.0;
    for (Real val : data) {
        accum += (val - m) * (val - m);
    }
    return accum / data.size();
}

Real Statistics::variance(const std::vector<Real>& data) {
    if (data.size() <= 1) {
        throw std::invalid_argument("Cannot compute sample variance of a dataset with less than 2 elements.");
    }
    Real m = mean(data);
    Real accum = 0.0;
    for (Real val : data) {
        accum += (val - m) * (val - m);
    }
    return accum / (data.size() - 1);
}

Real Statistics::population_standard_deviation(const std::vector<Real>& data) {
    return std::sqrt(population_variance(data));
}

Real Statistics::standard_deviation(const std::vector<Real>& data) {
    return std::sqrt(variance(data));
}

} // namespace equacore::stats
