from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem, 
    QHeaderView, QSpinBox, QGridLayout
)
from PySide6.QtCore import Qt
from qfluentwidgets import (
    PrimaryPushButton, PushButton, StrongBodyLabel, 
    InfoBar, InfoBarPosition
)
from sympy import Matrix, det, transpose

class MatrixInput(QWidget):
    """Helper widget for Matrix Input (Dimensions + Grid)"""
    def __init__(self, name="Matrix A", rows=3, cols=3):
        super().__init__()
        self.rows = rows
        self.cols = cols
        self.name = name
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0,0,0,0)
        
        # Header (Label + Spinners)
        header_layout = QHBoxLayout()
        self.lbl_name = StrongBodyLabel(name)
        
        self.spin_rows = QSpinBox()
        self.spin_rows.setRange(1, 10)
        self.spin_rows.setValue(rows)
        self.spin_rows.setSuffix(" filas")
        self.spin_rows.valueChanged.connect(self.update_grid)
        
        self.spin_cols = QSpinBox()
        self.spin_cols.setRange(1, 10)
        self.spin_cols.setValue(cols)
        self.spin_cols.setSuffix(" cols")
        self.spin_cols.valueChanged.connect(self.update_grid)
        
        header_layout.addWidget(self.lbl_name)
        header_layout.addStretch()
        header_layout.addWidget(self.spin_rows)
        header_layout.addWidget(self.spin_cols)
        
        layout.addLayout(header_layout)
        
        # Grid
        self.table = QTableWidget(rows, cols)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.verticalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.update_grid() # Init items
        
        # Style grid
        self.table.setStyleSheet("""
            QTableWidget {
                background-color: #202020;
                border: 1px solid #3e3e3e;
                border-radius: 8px;
                gridline-color: #3e3e3e;
            }
            QTableWidget::item { #EA580C selection not needed for editing
                color: white;
            }
        """)
        
        layout.addWidget(self.table)
        
    def update_grid(self):
        r = self.spin_rows.value()
        c = self.spin_cols.value()
        self.table.setRowCount(r)
        self.table.setColumnCount(c)
        
        # Ensure items exist
        for i in range(r):
            for j in range(c):
                if self.table.item(i, j) is None:
                    # Default to 0, identity-like or empty
                    val = "1" if i == j and self.name == "Matrix A" else "0"
                    if self.name == "Matrix B": val = "0"
                    self.table.setItem(i, j, QTableWidgetItem(val))
                    
    def get_matrix(self):
        """Returns sympy.Matrix or raises ValueError"""
        data = []
        for i in range(self.table.rowCount()):
            row = []
            for j in range(self.table.columnCount()):
                item = self.table.item(i, j)
                txt = item.text() if item else "0"
                try:
                    # Basic float/int parse. For advanced CAS, we'd use parse_expr
                    # But for now let's allow basic eval
                    from sympy import sympify
                    val = sympify(txt)
                    row.append(val)
                except:
                    raise ValueError(f"Valor inválido en {self.name} [{i},{j}]")
            data.append(row)
        return Matrix(data)

    def set_matrix(self, mat: Matrix):
        rows, cols = mat.shape
        self.spin_rows.setValue(rows)
        self.spin_cols.setValue(cols)
        
        for i in range(rows):
            for j in range(cols):
                self.table.setItem(i, j, QTableWidgetItem(str(mat[i, j])))


class MatrixWidget(QWidget):
    def __init__(self):
        super().__init__()
        
        main_layout = QVBoxLayout(self)
        main_layout.setSpacing(20)
        
        # 1. Inputs Area (Horizontal Split)
        inputs_layout = QHBoxLayout()
        self.mat_a = MatrixInput("Matriz A", 3, 3)
        self.mat_b = MatrixInput("Matriz B", 3, 3)
        
        inputs_layout.addWidget(self.mat_a)
        inputs_layout.addWidget(self.mat_b)
        
        # 2. Toolbar (Operations)
        tools_layout = QGridLayout() # Grid for buttons
        
        # Binary Ops
        btn_add = PrimaryPushButton("A + B")
        btn_sub = PushButton("A - B")
        btn_mul = PushButton("A × B")
        
        btn_add.clicked.connect(lambda: self.calc_binary('+'))
        btn_sub.clicked.connect(lambda: self.calc_binary('-'))
        btn_mul.clicked.connect(lambda: self.calc_binary('*'))
        
        # Unary Ops A
        btn_det_a = PushButton("Det(A)")
        btn_inv_a = PushButton("Inv(A)")
        btn_t_a = PushButton("Trans(A)")
        btn_rank_a = PushButton("Rango(A)")
        
        btn_det_a.clicked.connect(lambda: self.calc_unary('det', self.mat_a))
        btn_inv_a.clicked.connect(lambda: self.calc_unary('inv', self.mat_a))
        btn_t_a.clicked.connect(lambda: self.calc_unary('T', self.mat_a))
        btn_rank_a.clicked.connect(lambda: self.calc_unary('rank', self.mat_a))

        # Add to layout
        tools_layout.addWidget(StrongBodyLabel("Operaciones:"), 0, 0)
        tools_layout.addWidget(btn_add, 0, 1)
        tools_layout.addWidget(btn_sub, 0, 2)
        tools_layout.addWidget(btn_mul, 0, 3)
        
        tools_layout.addWidget(StrongBodyLabel("Matriz A:"), 1, 0)
        tools_layout.addWidget(btn_det_a, 1, 1)
        tools_layout.addWidget(btn_inv_a, 1, 2)
        tools_layout.addWidget(btn_t_a, 1, 3)
        tools_layout.addWidget(btn_rank_a, 1, 4)

        # 3. Result Area
        self.lbl_result = StrongBodyLabel("Resultado:")
        self.res_grid = MatrixInput("Resultado", 3, 3)
        # Make result read-only-ish (or user can edit result to use as input next?)
        # Let's leave it editable.
        
        main_layout.addLayout(inputs_layout, stretch=4)
        main_layout.addLayout(tools_layout, stretch=1)
        main_layout.addWidget(self.lbl_result)
        main_layout.addWidget(self.res_grid, stretch=3)
        
    def calc_binary(self, op):
        try:
            A = self.mat_a.get_matrix()
            B = self.mat_b.get_matrix()
            
            if op == '+': R = A + B
            elif op == '-': R = A - B
            elif op == '*': R = A * B
            
            self.show_result(R)
            
        except Exception as e:
            self.show_error(str(e))
            
    def calc_unary(self, op, widget_input):
        try:
            A = widget_input.get_matrix()
            
            if op == 'det': 
                val = det(A)
                self.show_message(f"Determinante = {val}")
                return # Don't update grid result, just show message
            
            elif op == 'inv': R = A.inv()
            elif op == 'T': R = transpose(A)
            elif op == 'rank': 
                val = A.rank()
                self.show_message(f"Rango = {val}")
                return
            
            self.show_result(R)
            
        except Exception as e:
            self.show_error(str(e))
            
    def show_result(self, mat: Matrix):
        self.res_grid.set_matrix(mat)
        self.res_grid.lbl_name.setText(f"Resultado ({mat.shape[0]}x{mat.shape[1]})")

    def show_error(self, msg):
        InfoBar.error(
            title='Error Matemático',
            content=msg,
            orient=Qt.Horizontal,
            isClosable=True,
            position=InfoBarPosition.BOTTOM_RIGHT,
            duration=3000,
            parent=self
        )

    def show_message(self, msg):
        InfoBar.success(
            title='Resultado',
            content=msg,
            orient=Qt.Horizontal,
            isClosable=True,
            position=InfoBarPosition.BOTTOM,
            duration=5000,
            parent=self
        )
