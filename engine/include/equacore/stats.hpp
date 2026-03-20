#ifndef EQUACORE_STATS_HPP
#define EQUACORE_STATS_HPP

#include <vector>
#include <stdexcept>
#include "equacore/expression.hpp"

namespace equacore::stats {

/**
 * Basic statistical operations over vectors of Real numbers.
 */
class Statistics {
public:
    // Computes the arithmetic mean
    static Real mean(const std::vector<Real>& data);

    // Computes the median
    static Real median(std::vector<Real> data); // Passed by value because it requires sorting

    // Computes the sample variance (n - 1)
    static Real variance(const std::vector<Real>& data);

    // Computes the population variance (n)
    static Real population_variance(const std::vector<Real>& data);

    // Computes the standard deviation (sample)
    static Real standard_deviation(const std::vector<Real>& data);

    // Computes the population standard deviation
    static Real population_standard_deviation(const std::vector<Real>& data);
};

} // namespace equacore::stats

#endif // EQUACORE_STATS_HPP
