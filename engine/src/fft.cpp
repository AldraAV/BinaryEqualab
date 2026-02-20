#include <vector>
#include <complex>
#include <Eigen/Dense>
#include <cmath>

#ifdef HAVE_FFTW3
#include <fftw3.h>
#endif

namespace equacore {
namespace fft {

    using Complex = std::complex<double>;
    using ComplexVector = std::vector<Complex>;

    // --- Forward FFT ---
    // Returns Fourier Transform of input vector (real or complex)
    // If FFTW3 is available, uses it. Otherwise uses slow DFT (O(N^2)) fallback.
    ComplexVector fft(const ComplexVector& input) {
        size_t n = input.size();
        ComplexVector output(n);

#ifdef HAVE_FFTW3
        // FFTW3 Implementation
        // Note: Creating plans is expensive. In prod, plans should be cached.
        // For v3.0, we create/destroy plans per call for simplicity unless optimized later.
        
        fftw_complex* in = (fftw_complex*) fftw_malloc(sizeof(fftw_complex) * n);
        fftw_complex* out = (fftw_complex*) fftw_malloc(sizeof(fftw_complex) * n);
        
        for(size_t i=0; i<n; ++i) {
            in[i][0] = input[i].real();
            in[i][1] = input[i].imag();
        }

        fftw_plan p = fftw_plan_dft_1d(n, in, out, FFTW_FORWARD, FFTW_ESTIMATE);
        fftw_execute(p);

        for(size_t i=0; i<n; ++i) {
            output[i] = Complex(out[i][0], out[i][1]);
        }

        fftw_destroy_plan(p);
        fftw_free(in);
        fftw_free(out);

#else
        // Slow DFT Fallback (O(N^2)) - Warn user!
        // X_k = sum_{n=0}^{N-1} x_n * exp(-i * 2*pi * k * n / N)
        const double PI = 3.141592653589793238460;
        for (size_t k = 0; k < n; ++k) {
            Complex sum(0, 0);
            for (size_t t = 0; t < n; ++t) {
                double angle = -2.0 * PI * k * t / n;
                sum += input[t] * std::polar(1.0, angle);
            }
            output[k] = sum;
        }
#endif
        return output;
    }

    // --- Inverse FFT ---
    ComplexVector ifft(const ComplexVector& input) {
        size_t n = input.size();
        ComplexVector output(n);

#ifdef HAVE_FFTW3
        // FFTW3
        fftw_complex* in = (fftw_complex*) fftw_malloc(sizeof(fftw_complex) * n);
        fftw_complex* out = (fftw_complex*) fftw_malloc(sizeof(fftw_complex) * n);
        
        for(size_t i=0; i<n; ++i) {
            in[i][0] = input[i].real();
            in[i][1] = input[i].imag();
        }

        fftw_plan p = fftw_plan_dft_1d(n, in, out, FFTW_BACKWARD, FFTW_ESTIMATE);
        fftw_execute(p);

        // Normalize
        for(size_t i=0; i<n; ++i) {
            output[i] = Complex(out[i][0] / n, out[i][1] / n);
        }

        fftw_destroy_plan(p);
        fftw_free(in);
        fftw_free(out);

#else
        // Slow IDFT Fallback
        const double PI = 3.141592653589793238460;
        for (size_t k = 0; k < n; ++k) {
            Complex sum(0, 0);
            for (size_t t = 0; t < n; ++t) {
                double angle = 2.0 * PI * k * t / n;
                sum += input[t] * std::polar(1.0, angle);
            }
            output[k] = sum / static_cast<double>(n);
        }
#endif
        return output;
    }

} // namespace fft
} // namespace equacore
