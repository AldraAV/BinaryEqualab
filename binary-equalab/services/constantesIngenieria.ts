export interface ConstanteIngenieria {
  nombre: string;
  simbolo: string;
  valor: number;
  notacionCientifica: string;
  categoria: 'universal' | 'electromagnetica' | 'atomica' | 'fisicoquimica';
  unidad: string;
}

export interface PrefijoIngenieria {
  nombre: string;
  simbolo: string;
  factor: number;
  notacionCientifica: string;
}

export const CONSTANTES_INGENIERIA: ConstanteIngenieria[] = [
  // Universales
  {
    nombre: "Velocidad de la luz en el vacío",
    simbolo: "c",
    valor: 299792458,
    notacionCientifica: "2.99792458 × 10^8",
    categoria: "universal",
    unidad: "m/s"
  },
  {
    nombre: "Constante de gravitación universal",
    simbolo: "G_grav",
    valor: 6.67430e-11,
    notacionCientifica: "6.67430 × 10^-11",
    categoria: "universal",
    unidad: "m³/(kg·s²)"
  },
  {
    nombre: "Constante de Planck",
    simbolo: "h_planck",
    valor: 6.62607015e-34,
    notacionCientifica: "6.62607015 × 10^-34",
    categoria: "universal",
    unidad: "J·s"
  },
  {
    nombre: "Gravedad estándar",
    simbolo: "g_grav",
    valor: 9.80665,
    notacionCientifica: "9.80665",
    categoria: "universal",
    unidad: "m/s²"
  },
  
  // Electromagnéticas
  {
    nombre: "Permitividad eléctrica del vacío",
    simbolo: "epsilon_0",
    valor: 8.8541878128e-12,
    notacionCientifica: "8.8541878128 × 10^-12",
    categoria: "electromagnetica",
    unidad: "F/m"
  },
  {
    nombre: "Permeabilidad magnética del vacío",
    simbolo: "mu_0",
    valor: 1.25663706212e-6,
    notacionCientifica: "1.25663706212 × 10^-6",
    categoria: "electromagnetica",
    unidad: "N/A²"
  },
  {
    nombre: "Impedancia característica del vacío",
    simbolo: "Z_0",
    valor: 376.730313668,
    notacionCientifica: "3.76730313668 × 10^2",
    categoria: "electromagnetica",
    unidad: "Ω"
  },

  // Atómicas y Nucleares
  {
    nombre: "Carga elemental",
    simbolo: "e_carga",
    valor: 1.602176634e-19,
    notacionCientifica: "1.602176634 × 10^-19",
    categoria: "atomica",
    unidad: "C"
  },
  {
    nombre: "Masa del electrón",
    simbolo: "m_e",
    valor: 9.1093837015e-31,
    notacionCientifica: "9.1093837015 × 10^-31",
    categoria: "atomica",
    unidad: "kg"
  },
  {
    nombre: "Masa del protón",
    simbolo: "m_p",
    valor: 1.67262192369e-27,
    notacionCientifica: "1.67262192369 × 10^-27",
    categoria: "atomica",
    unidad: "kg"
  },
  {
    nombre: "Masa del neutrón",
    simbolo: "m_n",
    valor: 1.67492749804e-27,
    notacionCientifica: "1.67492749804 × 10^-27",
    categoria: "atomica",
    unidad: "kg"
  },

  // Fisicoquímicas
  {
    nombre: "Constante de Avogadro",
    simbolo: "N_A",
    valor: 6.02214076e23,
    notacionCientifica: "6.02214076 × 10^23",
    categoria: "fisicoquimica",
    unidad: "mol^-1"
  },
  {
    nombre: "Constante universal de los gases",
    simbolo: "R_gas",
    valor: 8.314462618,
    notacionCientifica: "8.314462618",
    categoria: "fisicoquimica",
    unidad: "J/(mol·K)"
  },
  {
    nombre: "Constante de Boltzmann",
    simbolo: "k_B",
    valor: 1.380649e-23,
    notacionCientifica: "1.380649 × 10^-23",
    categoria: "fisicoquimica",
    unidad: "J/K"
  },
  {
    nombre: "Constante de Faraday",
    simbolo: "F_faraday",
    valor: 96485.33212,
    notacionCientifica: "9.648533212 × 10^4",
    categoria: "fisicoquimica",
    unidad: "C/mol"
  }
];

export const PREFIJOS_INGENIERIA: PrefijoIngenieria[] = [
  { nombre: "tera", simbolo: "T", factor: 1e12, notacionCientifica: "10^12" },
  { nombre: "giga", simbolo: "G", factor: 1e9, notacionCientifica: "10^9" },
  { nombre: "mega", simbolo: "M", factor: 1e6, notacionCientifica: "10^6" },
  { nombre: "kilo", simbolo: "k", factor: 1e3, notacionCientifica: "10^3" },
  { nombre: "mili", simbolo: "m", factor: 1e-3, notacionCientifica: "10^-3" },
  { nombre: "micro", simbolo: "u", factor: 1e-6, notacionCientifica: "10^-6" },
  { nombre: "nano", simbolo: "n", factor: 1e-9, notacionCientifica: "10^-9" },
  { nombre: "pico", simbolo: "p", factor: 1e-12, notacionCientifica: "10^-12" },
  { nombre: "femto", simbolo: "f", factor: 1e-15, notacionCientifica: "10^-15" }
];
