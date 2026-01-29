import sys
import os

# Add binary-cli to site-packages style path for shared logic
# Assuming binary-desktop is at .../BinaryEquaLab/binary-desktop
# And binary-cli is at .../BinaryEquaLab/binary-cli
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
cli_path = os.path.join(project_root, "binary-cli")

if cli_path not in sys.path:
    sys.path.append(cli_path)

from PySide6.QtWidgets import QWidget, QVBoxLayout, QLineEdit, QTextEdit
from PySide6.QtCore import Qt

try:
    from binary_equalab.engine import MathEngine
    HAS_ENGINE = True
except ImportError as e:
    HAS_ENGINE = False
    IMPORT_ERROR = str(e)

class ConsoleWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("ConsoleWidget")
        
        # Initialize Math Engine
        if HAS_ENGINE:
            self.engine = MathEngine()
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Output Area (Read-only)
        self.outputArea = QTextEdit()
        self.outputArea.setReadOnly(True)
        self.outputArea.setStyleSheet("""
            QTextEdit {
                background-color: #1a1a1a; 
                color: #e0e0e0;
                border: none;
                font-family: 'Consolas', 'Cascadia Code', monospace;
                font-size: 14px;
                padding: 10px;
            }
        """)
        
        # Input Line
        self.inputLine = QLineEdit()
        self.inputLine.setPlaceholderText("Escribe una expresión... (ej: 1+1, derivar(x^2))")
        self.inputLine.setStyleSheet("""
            QLineEdit {
                background-color: #2b2b2b;
                color: #EA580C; 
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
                font-family: 'Consolas', 'Cascadia Code', monospace;
                font-size: 14px;
                font-weight: bold;
            }
            QLineEdit:focus {
                border: 1px solid #EA580C;
            }
        """)
        
        layout.addWidget(self.outputArea)
        layout.addWidget(self.inputLine)
        
        self.inputLine.returnPressed.connect(self.handle_command)
        
        self.append_output("Binary EquaLab Desktop [Aurora v1.0]", "#EA580C")
        if HAS_ENGINE:
            self.append_output("Motor Matemático: CONECTADO ✅", "#10b981")
        else:
            self.append_output(f"Motor: ERROR DE CONEXIÓN ({IMPORT_ERROR}) ❌", "#ef4444")
            self.append_output(f"Path intentado: {cli_path}", "#888")

    def handle_command(self):
        cmd = self.inputLine.text().strip()
        if not cmd:
            return
            
        self.append_output(f"> {cmd}", "#EA580C")
        self.inputLine.clear()
        
        if not HAS_ENGINE:
            self.append_output("Error: Motor no disponible.", "#ef4444")
            return

        try:
            # Execute in Engine
            result = self.engine.evaluate(cmd)
            self.append_output(f"= {str(result)}", "#e0e0e0")
        except Exception as e:
            self.append_output(f"Error: {str(e)}", "#ef4444")
            
        self.outputArea.verticalScrollBar().setValue(
            self.outputArea.verticalScrollBar().maximum()
        )

    def append_output(self, text, color="#e0e0e0"):
        html = f'<span style="color:{color}; white-space: pre-wrap;">{text}</span>'
        self.outputArea.append(html)
