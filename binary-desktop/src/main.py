import sys
import os

# Force usage of PySide6
os.environ["QT_API"] = "pyside6"

from PySide6.QtWidgets import QApplication, QLabel, QVBoxLayout, QWidget
from PySide6.QtCore import Qt

if __name__ == "__main__":
    # 1. Create Application FIRST
    app = QApplication(sys.argv)

    # 2. NOW import qfluentwidgets (PySide6 version)
    from qfluentwidgets import FluentWindow, setTheme, Theme, setThemeColor, FluentIcon as FIF

    class MainWindow(FluentWindow):
        def __init__(self):
            super().__init__()
            self.setWindowTitle("Binary EquaLab Desktop")
            self.resize(1000, 700)
            
            # --- Home Interface ---
            self.homeInterface = QWidget()
            self.homeInterface.setObjectName("HomeInterface")
            layout = QVBoxLayout(self.homeInterface)
            
            # Welcome Label
            label = QLabel("Binary EquaLab Desktop\nAurora Theme 🧡")
            label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            label.setStyleSheet("""
                QLabel {
                    font-family: 'Segoe UI', 'Inter', sans-serif;
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #EA580C;
                }
            """)
            
            sublabel = QLabel("Consola . Gráficos . Epicycles")
            sublabel.setAlignment(Qt.AlignmentFlag.AlignCenter)
            sublabel.setStyleSheet("font-size: 16px; color: #A8A29E;")
            
            layout.addStretch()
            layout.addWidget(label)
            layout.addWidget(sublabel)
            layout.addStretch()
            
            # Add to Navigation
            self.addSubInterface(self.homeInterface, FIF.HOME, "Inicio")
            
            # Import locally (relative to src root which is in sys.path)
            from ui.console import ConsoleWidget
            
            self.consoleInterface = ConsoleWidget()
            self.consoleInterface.setObjectName("consoleInterface")
            self.addSubInterface(self.consoleInterface, FIF.EDIT, "Consola")
            
            from ui.graphics import GraphingWidget
            self.graphicsInterface = GraphingWidget()
            self.graphicsInterface.setObjectName("graphicsInterface")
            self.addSubInterface(self.graphicsInterface, FIF.BRUSH, "Gráficos")
            
            from ui.epicycles import EpicyclesWidget
            self.epicyclesInterface = EpicyclesWidget()
            self.epicyclesInterface.setObjectName("epicyclesInterface")
            self.addSubInterface(self.epicyclesInterface, FIF.VIDEO, "Epiciclos")
            
            from ui.financial import FinancialWidget
            self.financeInterface = FinancialWidget()
            self.financeInterface.setObjectName("financeInterface")
            self.addSubInterface(self.financeInterface, FIF.MARKET, "Finanzas")

    # Apply Aurora Theme
    setTheme(Theme.DARK)
    setThemeColor("#EA580C") 
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())
