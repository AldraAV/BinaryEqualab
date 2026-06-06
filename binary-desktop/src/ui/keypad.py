
from PySide6.QtCore import Signal
from PySide6.QtWidgets import QWidget, QVBoxLayout, QGridLayout
from qfluentwidgets import PushButton, PrimaryPushButton, FluentIcon as FIF

class KeypadWidget(QWidget):
    """
    A visual keypad for mathematical input.
    Emits 'text_inserted' signal when buttons are clicked.
    Emits 'action_triggered' for special keys (Enter, Backspace, Clear).
    """
    
    text_inserted = Signal(str)
    action_triggered = Signal(str)  # "enter", "backspace", "clear"
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        
        # Main Grid
        self.grid = QGridLayout()
        self.grid.setSpacing(4)
        layout.addLayout(self.grid)
        
        # Define layout
        # (row, col, text, type, value_to_insert)
        # Type: 'num', 'op', 'sci', 'action'
        keys = [
            # Row 0: Scientific 1
            (0, 0, "sin", 'sci', "sin("),
            (0, 1, "cos", 'sci', "cos("),
            (0, 2, "tan", 'sci', "tan("),
            (0, 3, "π", 'sci', "pi"),
            
            # Row 1: Scientific 2
            (1, 0, "∫", 'sci', "integrar("),
            (1, 1, "d/dx", 'sci', "derivar("),
            (1, 2, "√", 'sci', "sqrt("),
            (1, 3, "^", 'op', "**"),
            
            # Row 2
            (2, 0, "C", 'action', "clear"),
            (2, 1, "(", 'op', "("),
            (2, 2, ")", 'op', ")"),
            (2, 3, "⌫", 'action', "backspace"), # Backspace
            
            # Row 3
            (3, 0, "7", 'num', "7"),
            (3, 1, "8", 'num', "8"),
            (3, 2, "9", 'num', "9"),
            (3, 3, "/", 'op', "/"),
            
            # Row 4
            (4, 0, "4", 'num', "4"),
            (4, 1, "5", 'num', "5"),
            (4, 2, "6", 'num', "6"),
            (4, 3, "*", 'op', "*"),
            
            # Row 5
            (5, 0, "1", 'num', "1"),
            (5, 1, "2", 'num', "2"),
            (5, 2, "3", 'num', "3"),
            (5, 3, "-", 'op', "-"),
            
            # Row 6
            (6, 0, "0", 'num', "0"),
            (6, 1, ".", 'num', "."),
            (6, 2, "=", 'action', "enter"),
            (6, 3, "+", 'op', "+"),
        ]
        
        for r, c, label, ktype, val in keys:
            if ktype == 'action' and val == 'enter':
                btn = PrimaryPushButton(label)
                if label == "=":
                    # Make it span? No, keep grid uniform for now
                     # Or make it distinct style
                     pass
            elif ktype == 'action' and val in ['backspace', 'clear']:
                 btn = PushButton(label)
                 # Maybe use icon for backspace
                 if val == 'backspace':
                     btn.setIcon(FIF.DELETE)
                     btn.setText("")
            else:
                btn = PushButton(label)
            
            btn.setFixedWidth(50) # Fixed size for calculator feel
            btn.setFixedHeight(40)
            
            # Connect
            if ktype == 'action':
                # Accept checked argument (bool) from clicked signal
                btn.clicked.connect(lambda checked=False, v=val: self.action_triggered.emit(v))
            else:
                # Accept checked argument (bool) from clicked signal
                btn.clicked.connect(lambda checked=False, v=val: self.text_inserted.emit(v))
                
            self.grid.addWidget(btn, r, c)
            
        # Add basic style
        self.setStyleSheet("""
            QWidget {
                background-color: transparent;
            }
        """)

