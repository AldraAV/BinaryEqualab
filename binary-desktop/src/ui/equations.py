from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem, QHeaderView, 
    QSpinBox, QTabWidget
)
from qfluentwidgets import (
    PrimaryPushButton, StrongBodyLabel, 
    BodyLabel
)
from sympy import symbols, solve, sympify, Matrix, linsolve

class PolynomialSolver(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        # Controls
        controls = QHBoxLayout()
        self.spin_degree = QSpinBox()
        self.spin_degree.setRange(1, 10)
        self.spin_degree.setValue(2) # Quadratic default
        self.spin_degree.setPrefix("Grado: ")
        self.spin_degree.valueChanged.connect(self.setup_grid)
        
        self.btn_solve = PrimaryPushButton("Encontrar Raíces")
        self.btn_solve.clicked.connect(self.solve)
        
        controls.addWidget(self.spin_degree)
        controls.addWidget(self.btn_solve)
        controls.addStretch()
        
        # Grid for Coefficients
        self.grid = QTableWidget(1, 3) # ax^2 + bx + c
        self.grid.verticalHeader().hide()
        self.grid.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.grid.setStyleSheet("""
            QTableWidget {
                background-color: #2b2b2b;
                border: 1px solid #3e3e3e;
                border-radius: 6px;
                color: white;
            }
        """)
        
        # Result area
        self.lbl_result = BodyLabel("Resultados aparecerán aquí...")
        self.lbl_result.setWordWrap(True)
        self.lbl_result.setStyleSheet("font-size: 14px; color: #EA580C; font-weight: bold;")
        
        layout.addLayout(controls)
        layout.addWidget(StrongBodyLabel("Coeficientes:"))
        layout.addWidget(self.grid)
        layout.addWidget(StrongBodyLabel("Raíces:"))
        layout.addWidget(self.lbl_result)
        layout.addStretch()
        
        self.setup_grid()
        
    def setup_grid(self):
        degree = self.spin_degree.value()
        self.grid.setColumnCount(degree + 1)
        headers = []
        for i in range(degree, -1, -1):
            if i > 1: headers.append(f"x^{i}")
            elif i == 1: headers.append("x")
            else: headers.append("c")
        self.grid.setHorizontalHeaderLabels(headers)
        
        # Fill defaults
        for j in range(degree + 1):
            if self.grid.item(0, j) is None:
                self.grid.setItem(0, j, QTableWidgetItem("1" if j==0 else "0"))
                
    def solve(self):
        try:
            degree = self.spin_degree.value()
            coeffs = []
            x = symbols('x')
            expr = 0
            
            for j in range(degree + 1):
                item = self.grid.item(0, j)
                val_str = item.text() if item else "0"
                try:
                    val = sympify(val_str)
                    power = degree - j
                    expr += val * (x**power)
                except:
                    raise ValueError(f"Coeficiente inválido: {val_str}")
            
            sol = solve(expr, x)
            
            # Format
            res_text = ""
            for i, r in enumerate(sol):
                res_text += f"x{i+1} = {r}\n"
                
            self.lbl_result.setText(res_text if res_text else "No solution found")
            
        except Exception as e:
            self.lbl_result.setText(f"Error: {str(e)}")


class LinearSystemSolver(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        # Controls
        controls = QHBoxLayout()
        self.spin_vars = QSpinBox()
        self.spin_vars.setRange(2, 10)
        self.spin_vars.setValue(3) # 3x3 default
        self.spin_vars.setPrefix("Variables: ")
        self.spin_vars.valueChanged.connect(self.setup_grid)
        
        self.btn_solve = PrimaryPushButton("Resolver Sistema")
        self.btn_solve.clicked.connect(self.solve)
        
        controls.addWidget(self.spin_vars)
        controls.addWidget(self.btn_solve)
        controls.addStretch()
        
        # Grid A | b
        self.grid = QTableWidget()
        self.grid.setStyleSheet("""
            QTableWidget {
                background-color: #2b2b2b;
                border: 1px solid #3e3e3e;
                border-radius: 6px;
                color: white;
            }
        """)
        
        self.lbl_result = BodyLabel("x = ?, y = ?, z = ?")
        self.lbl_result.setStyleSheet("color: #EA580C; font-weight: bold;")
        
        layout.addLayout(controls)
        layout.addWidget(StrongBodyLabel("Matriz Aumentada (Ax = b):"))
        layout.addWidget(self.grid)
        layout.addWidget(StrongBodyLabel("Solución:"))
        layout.addWidget(self.lbl_result)
        layout.addStretch()
        
        self.setup_grid()
        
    def setup_grid(self):
        n = self.spin_vars.value()
        self.grid.setRowCount(n)
        self.grid.setColumnCount(n + 1) # Extra col for 'b'
        
        headers = [f"x{i+1}" for i in range(n)] + ["="]
        self.grid.setHorizontalHeaderLabels(headers)
        
        # Defaults
        for i in range(n):
            for j in range(n + 1):
                if self.grid.item(i, j) is None:
                    val = "1" if i == j else "0"
                    self.grid.setItem(i, j, QTableWidgetItem(val))
                    
    def solve(self):
        try:
            n = self.spin_vars.value()
            matrix_data = []
            
            for i in range(n):
                row = []
                for j in range(n + 1):
                    item = self.grid.item(i, j)
                    txt = item.text() if item else "0"
                    row.append(sympify(txt))
                matrix_data.append(row)
            
            M = Matrix(matrix_data)
            # Separate A and b
            A = M[:, :n]
            b = M[:, n]
            
            syms = symbols(f'x0:{n}')
            sol = linsolve((A, b), syms)
            
            if not sol:
                self.lbl_result.setText("No hay solución (Inconsistente)")
            else:
                s = list(sol)[0]
                text = ", ".join([f"x{i+1} = {val}" for i, val in enumerate(s)])
                self.lbl_result.setText(text)
                
        except Exception as e:
            self.lbl_result.setText(f"Error ({str(e)})")


class EquationsWidget(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        self.tabs = QTabWidget()
        self.tabs.addTab(PolynomialSolver(), "Polinomios")
        self.tabs.addTab(LinearSystemSolver(), "Sistemas Lineales")
        
        # Style Tabs
        self.tabs.setStyleSheet("""
            QTabWidget::pane {
                border: 1px solid #3e3e3e;
                background: #202020;
                border-radius: 8px;
            }
            QTabBar::tab {
                background: #2d2d2d;
                color: #ccc;
                padding: 8px 16px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
            }
            QTabBar::tab:selected {
                background: #EA580C;
                color: white;
            }
        """)
        
        layout.addWidget(self.tabs)
