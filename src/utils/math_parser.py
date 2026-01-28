"""
Binary EquaLab - Math Expression Parser (Python Port)

Robust expression preprocessing and error handling.
Port of mathParser.ts for Desktop app parity.
"""

import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ParseResult:
    """Result of parsing a math expression"""
    success: bool
    expression: str           # Preprocessed expression ready for evaluation
    display_expression: str   # Cleaned up for display
    error: Optional[str] = None
    suggestions: Optional[List[str]] = None


class MathParser:
    """Smart Math Parser with preprocessing and error detection"""
    
    # Common function names (English + Spanish)
    FUNCTIONS = [
        # English
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'asin', 'acos', 'atan', 'acot', 'asec', 'acsc',
        'sinh', 'cosh', 'tanh', 'coth',
        'arcsin', 'arccos', 'arctan',
        'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round',
        'log', 'ln', 'exp', 'log10', 'log2',
        'factorial', 'gamma', 'sign', 'mod',
        'diff', 'integrate', 'solve', 'simplify', 'expand', 'factor', 'limit', 'taylor',
        # Spanish (Binary EquaLab native)
        'sen', 'derivar', 'integrar', 'resolver', 'simplificar', 'expandir', 'factorizar',
        'limite', 'arcsen', 'arccos', 'arctan', 'raiz', 'piso', 'techo',
        'sumatoria', 'productoria', 'sustituir'
    ]
    
    # Spanish → English function mapping
    SPANISH_TO_ENGLISH = {
        'derivar': 'diff',
        'integrar': 'integrate',
        'resolver': 'solve',
        'simplificar': 'simplify',
        'expandir': 'expand',
        'factorizar': 'factor',
        'limite': 'limit',
        'sen': 'sin',
        'arcsen': 'asin',
        'raiz': 'sqrt',
        'piso': 'floor',
        'techo': 'ceil',
        'sumatoria': 'Sum',
        'productoria': 'Product',
        'sustituir': 'subs',
    }
    
    # Constants mapping
    CONSTANTS = {
        'pi': 'pi',
        'π': 'pi',
        'e': 'E',
        'i': 'I',
        'inf': 'oo',
        '∞': 'oo',
        'phi': '((1+sqrt(5))/2)',
        'φ': '((1+sqrt(5))/2)',
    }
    
    @classmethod
    def parse(cls, input_str: str) -> ParseResult:
        """Main parse function - preprocesses and validates expression"""
        if not input_str or not input_str.strip():
            return ParseResult(
                success=False,
                expression='',
                display_expression='',
                error='Empty expression'
            )
        
        expr = input_str.strip()
        original = expr
        
        try:
            # Step 1: Basic cleanup
            expr = cls._normalize_whitespace(expr)
            
            # Step 2: Replace Unicode symbols
            expr = cls._replace_unicode_symbols(expr)
            
            # Step 3: Fix coefficient patterns (2x → 2*x, i3 → 3*i)
            expr = cls._fix_implicit_multiplication(expr)
            
            # Step 4: Fix imaginary number patterns
            expr = cls._fix_imaginary_numbers(expr)
            
            # Step 5: Fix function calls (sinx → sin(x))
            expr = cls._fix_function_calls(expr)
            
            # Step 6: Balance parentheses
            result = cls._balance_parentheses(expr)
            if not result.success:
                return result
            expr = result.expression
            
            # Step 7: Translate Spanish functions to English
            expr = cls._translate_to_english(expr)
            
            # Step 8: Validate operators
            result = cls._validate_operators(expr)
            if not result.success:
                return result
            
            return ParseResult(
                success=True,
                expression=expr,
                display_expression=cls._format_for_display(expr)
            )
            
        except Exception as e:
            return ParseResult(
                success=False,
                expression=input_str,
                display_expression=input_str,
                error=f'Parse error: {str(e)}'
            )
    
    @staticmethod
    def _normalize_whitespace(expr: str) -> str:
        """Normalize whitespace and trim"""
        return re.sub(r'\s+', ' ', expr).strip()
    
    @classmethod
    def _replace_unicode_symbols(cls, expr: str) -> str:
        """Replace Unicode math symbols with SymPy equivalents"""
        replacements = {
            '×': '*',
            '÷': '/',
            '−': '-',
            '·': '*',
            '²': '**2',
            '³': '**3',
            '⁴': '**4',
            '√': 'sqrt',
            '∫': 'integrate',
            '∑': 'Sum',
            '∏': 'Product',
            '≤': '<=',
            '≥': '>=',
            '≠': '!=',
            '±': '+-',
            'α': 'alpha',
            'β': 'beta',
            'θ': 'theta',
            'λ': 'lamda',  # SymPy uses 'lamda' 
            'μ': 'mu',
            'σ': 'sigma',
            'ω': 'omega',
        }
        
        for unicode_char, ascii_char in replacements.items():
            expr = expr.replace(unicode_char, ascii_char)
        
        # Replace constants  
        for symbol, value in cls.CONSTANTS.items():
            expr = re.sub(rf'\b{re.escape(symbol)}\b', value, expr, flags=re.IGNORECASE)
        
        return expr
    
    @classmethod
    def _fix_implicit_multiplication(cls, expr: str) -> str:
        """Fix implicit multiplication patterns"""
        # Number followed by letter (except e for scientific): 2x → 2*x
        expr = re.sub(r'(\d)([a-df-zA-Z])', r'\1*\2', expr)
        
        # Number followed by opening paren: 3(x) → 3*(x)
        expr = re.sub(r'(\d)\(', r'\1*(', expr)
        
        # Closing paren followed by opening paren: )( → )*(
        expr = re.sub(r'\)\(', ')*(', expr)
        
        # Closing paren followed by letter: )x → )*x
        expr = re.sub(r'\)([a-zA-Z])', r')*\1', expr)
        
        return expr
    
    @staticmethod
    def _fix_imaginary_numbers(expr: str) -> str:
        """Fix imaginary number notations"""
        # i followed by number: i3 → 3*I
        expr = re.sub(r'\bi(\d+)', r'\1*I', expr)
        
        # Number followed by i: 3i → 3*I
        expr = re.sub(r'(\d)i\b', r'\1*I', expr)
        
        return expr
    
    @classmethod
    def _fix_function_calls(cls, expr: str) -> str:
        """Fix function call patterns"""
        for func in cls.FUNCTIONS:
            # Function followed by variable without parens: sinx → sin(x)
            pattern = rf'\b{func}([a-zA-Z])(?!\()'
            expr = re.sub(pattern, rf'{func}(\1)', expr)
            
            # Function followed by number and variable: sin2x → sin(2*x)
            pattern = rf'\b{func}(\d+)([a-zA-Z])'
            expr = re.sub(pattern, rf'{func}(\1*\2)', expr)
        
        return expr
    
    @classmethod
    def _balance_parentheses(cls, expr: str) -> ParseResult:
        """Balance and validate parentheses"""
        open_count = 0
        close_count = 0
        
        for char in expr:
            if char == '(':
                open_count += 1
            if char == ')':
                close_count += 1
            if close_count > open_count:
                return ParseResult(
                    success=False,
                    expression=expr,
                    display_expression=expr,
                    error='Unmatched closing parenthesis',
                    suggestions=['Remove extra ) or add opening (']
                )
        
        if open_count > close_count:
            # Auto-close missing parentheses
            expr = expr + ')' * (open_count - close_count)
        
        return ParseResult(
            success=True,
            expression=expr,
            display_expression=expr
        )
    
    @staticmethod
    def _validate_operators(expr: str) -> ParseResult:
        """Validate operator usage"""
        bad_patterns = [
            (r'[+*/]{2,}', 'Consecutive operators', 'Remove duplicate operators'),
            (r'^[*/]', 'Expression starts with operator', 'Add a number before the operator'),
            (r'[+\-*/]$', 'Expression ends with operator', 'Complete the expression'),
            (r'\(\)', 'Empty parentheses', 'Add content inside ()'),
        ]
        
        for pattern, error, suggestion in bad_patterns:
            if re.search(pattern, expr):
                return ParseResult(
                    success=False,
                    expression=expr,
                    display_expression=expr,
                    error=error,
                    suggestions=[suggestion]
                )
        
        return ParseResult(
            success=True,
            expression=expr,
            display_expression=expr
        )
    
    @classmethod
    def _translate_to_english(cls, expr: str) -> str:
        """Translate Spanish function names to English for SymPy"""
        # Sort by length descending to avoid partial matches
        sorted_funcs = sorted(cls.SPANISH_TO_ENGLISH.items(), key=lambda x: -len(x[0]))
        for spanish, english in sorted_funcs:
            # Match function call pattern: spanish_func(
            pattern = rf'\b{spanish}\s*\('
            expr = re.sub(pattern, f'{english}(', expr, flags=re.IGNORECASE)
        return expr
    
    @staticmethod
    def _format_for_display(expr: str) -> str:
        """Format expression for nice display"""
        return expr.replace('**', '^').replace('*', '·').replace('sqrt', '√')


def parse_expression(input_str: str) -> ParseResult:
    """Convenience function for quick parsing"""
    return MathParser.parse(input_str)


# Physical constants (for EquaEngine)
PHYSICS_CONSTANTS = {
    'c': 299792458,           # Speed of Light (m/s)
    'g': 9.80665,             # Standard Gravity (m/s²)
    'G': 6.67430e-11,         # Gravitational Constant
    'h': 6.62607015e-34,      # Planck Constant (J·s)
    'k': 1.380649e-23,        # Boltzmann Constant (J/K)
    'Na': 6.02214076e23,      # Avogadro Constant (mol⁻¹)
    'R': 8.314462618,         # Gas Constant (J/(mol·K))
    'me': 9.10938356e-31,     # Electron Mass (kg)
    'mp': 1.6726219e-27,      # Proton Mass (kg)
    'e_charge': 1.602176634e-19,  # Elementary Charge (C)
    'mu_0': 1.25663706212e-6, # Vacuum Permeability (H/m)
    'epsilon_0': 8.8541878128e-12,  # Vacuum Permittivity (F/m)
}
