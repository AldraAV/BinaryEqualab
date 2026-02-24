#pragma once
#include <vector>
#include <map>
#include <Eigen/Dense>

namespace equacore {

    using Eigen::VectorXd;

    // Parameters structs for type safety
    struct BergmanParams {
        double p1; // Glucose effectiveness
        double p2; // Insulin excertion rate
        double p3; // Insulin sensitivity
        double Gb; // Basal glucose
        double Ib; // Basal insulin
        double n;  // Insulin clearance
    };

    struct PKParams {
        double ka; // Absorption rate
        double ke; // Elimination rate
        double Vd; // Volume of distribution
        double D;  // Dose
        bool oral; // True for oral (has absorption), False for IV
    };

    struct WindkesselParams {
        double R; // Resistance
        double C; // Compliance
        double P_venous; // Downstream pressure (usually ~0-5 mmHg)
    };
    
    struct HHParams {
        double C_m;    // Membrane capacitance
        double g_Na;   // Max Na+ conductance
        double g_K;    // Max K+ conductance
        double g_L;    // Leak conductance
        double E_Na;   // Na+ reversal potential
        double E_K;    // K+ reversal potential
        double E_L;    // Leak reversal potential
        double I_ext;  // External current
    };

    // PTI (Púrpura Trombocitopénica Idiopática)
    // Para José de 12 años. Y para todos los niños del 10%.
    struct PTIParams {
        // Producción medular
        double production_rate;     // plaquetas/μL por día (normal ~50,000)
        
        // Destrucción autoinmune
        double destruction_rate;    // tasa de destrucción mediada por anticuerpos
        double antibody_half_life;  // vida media de anticuerpos (días)
        double antibody_production; // producción basal de auto-anticuerpos
        
        // Tratamiento: 0=NONE, 1=PREDNISONE, 2=IVIG, 3=SPLENECTOMY
        int treatment;
        double treatment_efficacy;  // 0.0-1.0 (eficacia del tratamiento actual)
        
        // Paciente
        double initial_platelets;   // recuento inicial (plaquetas/μL)
    };

    class BioODESolver {
    public:
        enum class Integrator {
            RK4,
            RK45, // Adaptive step (Dormand-Prince)
            Euler // For educational comparison
        };

        struct SimulationResult {
            VectorXd t;
            std::vector<VectorXd> y;
        };

        // --- Biomedical Models ---

        // Bergman Minimal Model (Glucose-Insulin)
        // State y: [G, X, I] -> Glucose, Remote Insulin, Insulin
        static SimulationResult simulate_glucose_insulin(
            double t_start, double t_end, double dt, 
            const VectorXd& y0, 
            const BergmanParams& p
        );

        // Pharmacokinetics (1-Compartment)
        // State y: [Amount_Central] or [Amount_Gut, Amount_Central]
        static SimulationResult simulate_pk_1cmt(
            double t_start, double t_end, double dt,
            const VectorXd& y0,
            const PKParams& p
        );

        // Cardiovascular Windkessel (2-Element)
        // State y: [Pressure] or [Volume, Pressure] depending on formulation
        // Input: Flow Q(t) is usually needed. We will assume a simple pulsatile function internally or take parameters for it.
        static SimulationResult simulate_windkessel(
            double t_start, double t_end, double dt,
            const VectorXd& y0,
            const WindkesselParams& p,
            double heart_rate // bpm
        );
        
        // Hodgkin-Huxley Neuron
        // State y: [V, m, h, n]
        static SimulationResult simulate_hodgkin_huxley(
            double t_start, double t_end, double dt,
            const VectorXd& y0,
            const HHParams& p
        );

        // PTI (Púrpura Trombocitopénica Idiopática)
        // State y: [P, A] -> Platelets (plaquetas/μL), Antibodies (normalizado)
        static SimulationResult simulate_pti(
            double t_start, double t_end, double dt,
            const VectorXd& y0,
            const PTIParams& p
        );

        // Interpretación clínica del resultado PTI
        static std::string pti_clinical_interpretation(
            double initial_count,
            double final_count,
            int days
        );

    private:
        static VectorXd stepRK4(std::function<VectorXd(double, const VectorXd&)> f, double t, const VectorXd& y, double dt);
    };

} // namespace equacore
