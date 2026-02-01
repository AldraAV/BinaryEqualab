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

from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QTextEdit
from PySide6.QtCore import Qt

import winsound
from src.core.context import get_context

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
        
        # Initialize Math Engine via Global Context
        if HAS_ENGINE:
            self.context = get_context()
            self.engine = self.context.get_engine()
        
        # Main Layout: Side by Side (Console Left, Keypad Right)
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(10)
        
        # --- Left Panel: Console (Output + Input) ---
        console_container = QWidget()
        console_layout = QVBoxLayout(console_container)
        console_layout.setContentsMargins(0, 0, 0, 0)
        console_layout.setSpacing(10) # Space between output and input
        
        # Output Area (Read-only)
        self.outputArea = QTextEdit()
        self.outputArea.setReadOnly(True)
        self.outputArea.setStyleSheet("""
            QTextEdit {
                background-color: #1a1a1a; 
                color: #e0e0e0;
                border: none;
                border-radius: 8px;
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
                padding: 12px;
                font-family: 'Consolas', 'Cascadia Code', monospace;
                font-size: 16px;
                font-weight: bold;
            }
            QLineEdit:focus {
                border: 1px solid #EA580C;
            }
        """)
        
        console_layout.addWidget(self.outputArea)
        console_layout.addWidget(self.inputLine)
        
        # --- Right Panel: Keypad ---
        self.keypad = KeypadWidget()
        # Connect Signals
        self.keypad.text_inserted.connect(self.on_keypad_insert)
        self.keypad.action_triggered.connect(self.on_keypad_action)

        self.inputLine.returnPressed.connect(self.handle_command)
        
        # Add to main layout
        main_layout.addWidget(console_container, stretch=3) # Console takes 75%
        main_layout.addWidget(self.keypad, stretch=1)      # Keypad takes 25%
        
        self.append_output("Binary EquaLab Desktop [Aurora v2.0]", "#EA580C")
        if HAS_ENGINE:
            self.append_output("Motor Matemático: CONECTADO ✅", "#10b981")
            self.append_output("Giac Integration: READY 🚀", "#3b82f6")
        else:
            self.append_output(f"Motor: ERROR DE CONEXIÓN ({IMPORT_ERROR}) ❌", "#ef4444")
            self.append_output(f"Path intentado: {cli_path}", "#888")

    def on_keypad_insert(self, text):
        self.inputLine.insert(text)
        self.inputLine.setFocus()
        
    def on_keypad_action(self, action):
        if action == "enter":
            self.handle_command()
        elif action == "backspace":
            self.inputLine.backspace()
        elif action == "clear":
            self.inputLine.clear()
        self.inputLine.setFocus()

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
            # Evaluate
             result = self.engine.evaluate(cmd)
             
             # Sync ans
             if result is not None:
                 self.context.update_ans(result)

             if str(result).endswith('.wav'):
                 # It's an audio file
                 self.append_output(f"🎵 Audio generado: {result}", "#22d3ee")
                 try:
                     # Play sound asynchronously
                     winsound.PlaySound(result, winsound.SND_FILENAME | winsound.SND_ASYNC)
                 except Exception as ws_e:
                     self.append_output(f"Error al reproducir: {ws_e}", "#ef4444")
             else:
                 self.append_output(f"= {str(result)}", "#e0e0e0")
        except Exception as e:
            self.append_output(f"Error: {str(e)}", "#ef4444")
            
        self.outputArea.verticalScrollBar().setValue(
            self.outputArea.verticalScrollBar().maximum()
        )

    def append_output(self, text, color="#e0e0e0"):
        html = f'<span style="color:{color}; white-space: pre-wrap;">{text}</span>'
        self.outputArea.append(html)
