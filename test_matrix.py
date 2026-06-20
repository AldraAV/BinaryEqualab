import sympy as sp

local_ns = {
    'Matrix': sp.Matrix, 
    'det': lambda M: sp.Matrix(M).det(),
    'inversa': lambda M: sp.Matrix(M).inv(), 
    'inv': lambda M: sp.Matrix(M).inv(),
}

expr = "det(Matrix([[1, 2], [3, 4]])) + inv(Matrix([[1, 2], [3, 4]]))"
try:
    parsed = sp.sympify(expr, locals=local_ns)
    print("Parsed successfully:")
    print(parsed)
except Exception as e:
    print("Error parsing:")
    print(e)
