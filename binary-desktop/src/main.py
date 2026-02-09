import sys
import os
# Force usage of PySide6
os.environ["QT_API"] = "pyside6"

# Fix import path to include 'binary-desktop' root so 'src.core' works
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
sys.path.insert(0, current_dir)

from PySide6.QtWidgets import QApplication, QLabel, QVBoxLayout, QWidget
from PySide6.QtCore import Qt

if __name__ == "__main__":
    # 1. Create Application FIRST
    app = QApplication(sys.argv)

    # 2. NOW import qfluentwidgets (PySide6 version)
    from qfluentwidgets import FluentWindow, setTheme, Theme, setThemeColor, FluentIcon as FIF, NavigationItemPosition

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
            
            slogan = QLabel("Las matemáticas también sienten,\npero estas no se equivocan.")
            slogan.setAlignment(Qt.AlignmentFlag.AlignCenter)
            slogan.setStyleSheet("font-size: 14px; font-style: italic; color: #78716C; margin-bottom: 20px;")
            layout.addWidget(slogan)
            
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
            
            from ui.matrix import MatrixWidget
            self.matrixInterface = MatrixWidget()
            self.matrixInterface.setObjectName("matrixInterface")
            self.addSubInterface(self.matrixInterface, FIF.TILES, "Matrices")
            
            from ui.vectors import VectorsWidget
            self.vectorsInterface = VectorsWidget()
            self.vectorsInterface.setObjectName("vectorsInterface")
            self.addSubInterface(self.vectorsInterface, FIF.IOT, "Vectores")
            
            from ui.equations import EquationsWidget
            self.equationsInterface = EquationsWidget()
            self.equationsInterface.setObjectName("equationsInterface")
            self.addSubInterface(self.equationsInterface, FIF.EDIT, "Ecuaciones")
            
            from ui.statistics import StatisticsWidget
            self.analyticsInterface = StatisticsWidget()
            self.analyticsInterface.setObjectName("analyticsInterface")
            self.addSubInterface(self.analyticsInterface, FIF.ALBUM, "Estadística")

            # --- Cloud Interface ---
            from ui.cloud_view import CloudWidget
            self.cloudInterface = CloudWidget()
            self.cloudInterface.setObjectName("cloudInterface")
            self.addSubInterface(self.cloudInterface, FIF.CLOUD, "Nube SaaS")

            # Feedback (Bottom)
            self.navigationInterface.addItem(
                routeKey="feedback",
                icon=FIF.CHAT,
                text="Feedback & Soporte",
                onClick=self.show_feedback,
                selectable=False,
                position=NavigationItemPosition.BOTTOM
            )

        def show_feedback(self):
            from PySide6.QtGui import QDesktopServices
            from PySide6.QtCore import QUrl
            from PySide6.QtWidgets import QMessageBox
            
            msg = """
            <h3 style='color:#EA580C'>💬 Feedback & Soporte</h3>
            <p>¡Hola! Soy Aldra.</p>
            <p>Acepto cualquier sugerencia de mejora, apoyo, compañía o financiamiento.</p>
            <p>Cualquier inconveniente, por favor repórtalo en GitHub.</p>
            <br>
            <a href='https://github.com/Malexnnn/BinaryEqualab'>🐙 Ir al Repositorio (GitHub)</a>
            """
            
            box = QMessageBox(self)
            box.setWindowTitle("Binary EquaLab - Feedback")
            box.setTextFormat(Qt.TextFormat.RichText)
            box.setText(msg)
            box.setIcon(QMessageBox.Icon.Information)
            box.exec()
            
            QDesktopServices.openUrl(QUrl("https://github.com/Malexnnn/BinaryEqualab"))


    # Apply Aurora Theme
    setTheme(Theme.DARK)
    setThemeColor("#EA580C") 
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())
