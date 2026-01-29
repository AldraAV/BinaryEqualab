import sys
import os
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                               QLineEdit, QPushButton, QTabWidget, QFormLayout, 
                               QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox)
from PySide6.QtCore import Qt

# Shared Logic Import
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
cli_path = os.path.join(project_root, "binary-cli")
if cli_path not in sys.path:
    sys.path.append(cli_path)

try:
    from binary_equalab.engine import MathEngine
    HAS_ENGINE = True
except ImportError:
    HAS_ENGINE = False

class FinancialWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("FinancialWidget")
        self.engine = MathEngine() if HAS_ENGINE else None
        
        layout = QVBoxLayout(self)
        
        # Title
        header = QLabel("Módulo Financiero PRO")
        header.setStyleSheet("color: #EA580C; font-size: 18px; font-weight: bold;")
        header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(header)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #333; }
            QTabBar::tab {
                background: #2b2b2b; color: #aaa; padding: 10px 20px;
                border: 1px solid #333;
            }
            QTabBar::tab:selected {
                background: #EA580C; color: white;
            }
        """)
        
        self.tabs.addTab(self.create_projects_tab(), "Proyectos (VAN/TIR)")
        self.tabs.addTab(self.create_interest_tab(), "Interés Simple/Comp.")
        self.tabs.addTab(self.create_depreciation_tab(), "Depreciación")
        
        layout.addWidget(self.tabs)

    def create_projects_tab(self):
        tab = QWidget()
        form = QFormLayout(tab)
        
        self.inputRate = QLineEdit()
        self.inputRate.setPlaceholderText("Ej: 0.10 para 10%")
        self.inputFlows = QLineEdit()
        self.inputFlows.setPlaceholderText("Ej: -1000, 300, 400, 500 (Inversión inicial negativa)")
        
        btnCalcVAN = QPushButton("Calcular VAN (Valor Actual Neto)")
        btnCalcTIR = QPushButton("Calcular TIR (Tasa Interna de Retorno)")
        
        self.lblResultProjects = QLabel("Resultados aparecerán aquí...")
        self.lblResultProjects.setStyleSheet("color: #EA580C; font-weight: bold; font-size: 14px;")
        
        btnCalcVAN.clicked.connect(self.calculate_van)
        btnCalcTIR.clicked.connect(self.calculate_tir)
        
        style_btn = "background-color: #333; color: white; padding: 8px; border-radius: 4px;"
        btnCalcVAN.setStyleSheet(style_btn)
        btnCalcTIR.setStyleSheet(style_btn)

        form.addRow("Tasa de Descuento (r):", self.inputRate)
        form.addRow("Flujos de Caja:", self.inputFlows)
        form.addRow(btnCalcVAN)
        form.addRow(btnCalcTIR)
        form.addRow(self.lblResultProjects)
        
        return tab

    def create_interest_tab(self):
        tab = QWidget()
        form = QFormLayout(tab)
        
        self.inputCapital = QLineEdit()
        self.inputRateInt = QLineEdit()
        self.inputTime = QLineEdit()
        self.inputPeriods = QLineEdit()
        self.inputPeriods.setPlaceholderText("Solo para Compuesto (ej: 12 mensual)")
        self.inputPeriods.setText("1")
        
        btnSimple = QPushButton("Interés Simple")
        btnCompound = QPushButton("Interés Compuesto")
        
        self.lblResultInterest = QLabel("-")
        self.lblResultInterest.setStyleSheet("color: #EA580C; font-weight: bold;")
        
        btnSimple.clicked.connect(self.calc_simple)
        btnCompound.clicked.connect(self.calc_compound)
        
        style_btn = "background-color: #333; color: white; padding: 8px; border-radius: 4px;"
        btnSimple.setStyleSheet(style_btn)
        btnCompound.setStyleSheet(style_btn)
        
        form.addRow("Capital Inicial (C):", self.inputCapital)
        form.addRow("Tasa Anual (r):", self.inputRateInt)
        form.addRow("Tiempo (t años):", self.inputTime)
        form.addRow("Periodos por año (n):", self.inputPeriods)
        form.addRow(btnSimple)
        form.addRow(btnCompound)
        form.addRow(self.lblResultInterest)
        
        return tab
        
    def create_depreciation_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        form = QFormLayout()
        
        self.inputCost = QLineEdit()
        self.inputResidual = QLineEdit()
        self.inputLife = QLineEdit()
        
        btnCalcDep = QPushButton("Generar Tabla de Depreciación")
        btnCalcDep.setStyleSheet("background-color: #EA580C; color: white; padding: 10px; font-weight: bold;")
        btnCalcDep.clicked.connect(self.calc_depreciation)
        
        form.addRow("Costo del Activo:", self.inputCost)
        form.addRow("Valor Residual:", self.inputResidual)
        form.addRow("Vida Útil (años):", self.inputLife)
        
        layout.addLayout(form)
        layout.addWidget(btnCalcDep)
        
        # Table
        self.tableDep = QTableWidget()
        self.tableDep.setColumnCount(4)
        self.tableDep.setHorizontalHeaderLabels(["Año", "Depreciación", "Acumulada", "Valor Libros"])
        self.tableDep.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.tableDep.setStyleSheet("""
            QTableWidget { background-color: #1a1a1a; color: white; gridline-color: #333; }
            QHeaderView::section { background-color: #333; color: white; padding: 4px; }
        """)
        layout.addWidget(self.tableDep)
        
        return tab

    # --- Logic ---

    def calculate_van(self):
        if not self.engine: return
        try:
            r = self.inputRate.text()
            flows = self.inputFlows.text()
            # Reuse CLI logic engine.evaluate
            result = self.engine.evaluate(f"van({r}, {flows})")
            self.lblResultProjects.setText(f"VAN = {result}")
        except Exception as e:
            self.lblResultProjects.setText(f"Error: {e}")

    def calculate_tir(self):
        if not self.engine: return
        try:
            flows = self.inputFlows.text()
            result = self.engine.evaluate(f"tir({flows})")
            self.lblResultProjects.setText(f"TIR = {result}%")
        except Exception as e:
            self.lblResultProjects.setText(f"Error: {e}")

    def calc_simple(self):
        if not self.engine: return
        try:
            c, r, t = self.inputCapital.text(), self.inputRateInt.text(), self.inputTime.text()
            # Returns dict from engine
            res = self.engine._interes_simple(c, r, t)
            self.lblResultInterest.setText(f"Interés: {res['interes']} | Total: {res['monto_final']}")
        except Exception as e:
            self.lblResultInterest.setText(str(e))

    def calc_compound(self):
        if not self.engine: return
        try:
            c, r, t = self.inputCapital.text(), self.inputRateInt.text(), self.inputTime.text()
            n = self.inputPeriods.text()
            res = self.engine._interes_compuesto(c, r, n, t)
            self.lblResultInterest.setText(f"Interés: {res['interes']} | Total: {res['monto_final']}")
        except Exception as e:
            self.lblResultInterest.setText(str(e))

    def calc_depreciation(self):
        if not self.engine: return
        try:
            c, r, n= self.inputCost.text(), self.inputResidual.text(), self.inputLife.text()
            schedule = self.engine._depreciar(c, r, n)
            
            self.tableDep.setRowCount(len(schedule))
            for row, item in enumerate(schedule):
                self.tableDep.setItem(row, 0, QTableWidgetItem(str(item['año'])))
                self.tableDep.setItem(row, 1, QTableWidgetItem(str(item['depreciacion'])))
                self.tableDep.setItem(row, 2, QTableWidgetItem(str(item['acumulado'])))
                self.tableDep.setItem(row, 3, QTableWidgetItem(str(item['valor_libro'])))
        except Exception as e:
            QMessageBox.critical(self, "Error", str(e))
