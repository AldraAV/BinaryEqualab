"""
Binary EquaLab - Scientific Keypad Widget (PyQt6)
Port of ScientificKeypad.tsx for Desktop parity
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, 
    QPushButton, QFrame
)
from PyQt6.QtCore import pyqtSignal

# Aurora Palette
class AuroraPalette:
    PRIMARY = "#ff6b35"
    SECONDARY = "#ffc857"
    BACKGROUND = "#0a0a0f"
    BACKGROUND_LIGHT = "#12121a"
    BACKGROUND_DARK = "#050508"
    BORDER = "#2a2a3a"
    TEXT = "#e0e0e0"
    MUTED = "#6a6a7a"


class KeyButton(QPushButton):
    """Styled calculator key button"""
    
    def __init__(self, label: str, value: str = None, primary: bool = False, 
                 secondary: bool = False, parent=None):
        super().__init__(label, parent)
        self.value = value or label
        self.primary = primary
        self.secondary = secondary
        self._setup_style()
        
    def _setup_style(self):
        if self.primary:
            bg = AuroraPalette.PRIMARY
            hover = "#ff8555"
            text = "white"
        elif self.secondary:
            bg = AuroraPalette.BACKGROUND_LIGHT
            hover = "#1a1a2a"
            text = AuroraPalette.PRIMARY
            border = AuroraPalette.PRIMARY
        else:
            bg = AuroraPalette.BACKGROUND_LIGHT
            hover = "#1a1a2a"
            text = AuroraPalette.TEXT
            border = AuroraPalette.BORDER
            
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {bg};
                color: {text};
                border: 1px solid {border if not self.primary else bg};
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                padding: 12px 8px;
                min-height: 40px;
            }}
            QPushButton:hover {{
                background-color: {hover};
            }}
            QPushButton:pressed {{
                background-color: {AuroraPalette.BACKGROUND_DARK};
            }}
        """)


class ScientificKeypad(QWidget):
    """Scientific keypad with tabs: MAIN, ABC, GREEK, FUNC, CONST"""
    
    key_clicked = pyqtSignal(str)  # Emits the clicked key value
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_tab = "MAIN"
        self._setup_ui()
        
    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        
        # Tab bar
        self.tab_bar = QFrame()
        self.tab_bar.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND};
                border-bottom: 1px solid {AuroraPalette.BORDER};
            }}
        """)
        tab_layout = QHBoxLayout(self.tab_bar)
        tab_layout.setContentsMargins(8, 8, 8, 8)
        tab_layout.setSpacing(8)
        
        self.tabs = {}
        for tab_name, label in [("MAIN", "MAIN"), ("ABC", "ABC"), ("GREEK", "αβγ"), 
                                 ("FUNC", "FUNC"), ("CONST", "CONST")]:
            btn = QPushButton(label)
            btn.setCheckable(True)
            btn.setChecked(tab_name == "MAIN")
            btn.clicked.connect(lambda checked, t=tab_name: self._switch_tab(t))
            btn.setStyleSheet(self._tab_style(tab_name == "MAIN"))
            self.tabs[tab_name] = btn
            tab_layout.addWidget(btn)
            
        layout.addWidget(self.tab_bar)
        
        # Keypad content area
        self.keypad_container = QFrame()
        self.keypad_container.setStyleSheet(f"""
            QFrame {{
                background-color: {AuroraPalette.BACKGROUND_LIGHT};
                padding: 12px;
            }}
        """)
        self.keypad_layout = QVBoxLayout(self.keypad_container)
        self.keypad_layout.setContentsMargins(12, 12, 12, 12)
        layout.addWidget(self.keypad_container, stretch=1)
        
        # Render initial tab
        self._render_main_tab()
        
    def _tab_style(self, active: bool) -> str:
        if active:
            return f"""
                QPushButton {{
                    background-color: {AuroraPalette.PRIMARY}30;
                    color: {AuroraPalette.PRIMARY};
                    border: 1px solid {AuroraPalette.PRIMARY}50;
                    border-radius: 6px;
                    padding: 6px 12px;
                    font-size: 11px;
                    font-weight: bold;
                }}
            """
        return f"""
            QPushButton {{
                background-color: transparent;
                color: {AuroraPalette.MUTED};
                border: none;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                color: {AuroraPalette.TEXT};
            }}
        """
        
    def _switch_tab(self, tab_name: str):
        self.current_tab = tab_name
        for name, btn in self.tabs.items():
            btn.setChecked(name == tab_name)
            btn.setStyleSheet(self._tab_style(name == tab_name))
        self._render_tab()
        
    def _render_tab(self):
        # Clear current keypad
        while self.keypad_layout.count():
            item = self.keypad_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
                
        # Render selected tab
        if self.current_tab == "MAIN":
            self._render_main_tab()
        elif self.current_tab == "ABC":
            self._render_abc_tab()
        elif self.current_tab == "GREEK":
            self._render_greek_tab()
        elif self.current_tab == "FUNC":
            self._render_func_tab()
        elif self.current_tab == "CONST":
            self._render_const_tab()
            
    def _create_grid(self, keys: list, cols: int = 4) -> QWidget:
        """Helper to create a grid of keys"""
        widget = QWidget()
        grid = QGridLayout(widget)
        grid.setSpacing(8)
        grid.setContentsMargins(0, 0, 0, 0)
        
        for i, key_data in enumerate(keys):
            if isinstance(key_data, tuple):
                label, value, *opts = key_data
                primary = 'primary' in opts
                secondary = 'secondary' in opts
            else:
                label = value = key_data
                primary = secondary = False
                
            btn = KeyButton(label, value, primary, secondary)
            btn.clicked.connect(lambda checked, v=value: self.key_clicked.emit(v))
            grid.addWidget(btn, i // cols, i % cols)
            
        return widget
        
    def _render_main_tab(self):
        keys = [
            # Row 1: CAS
            ("∫", "integrar(", "secondary"), ("d/dx", "derivar(", "secondary"), 
            ("Σ", "sumatoria(", "secondary"), ("lím", "limite(", "secondary"),
            # Row 2: Trig
            ("sen", "sen("), ("cos", "cos("), ("tan", "tan("), ("√", "raiz("),
            # Row 3: Powers
            ("x²", "^2"), ("xⁿ", "^"), ("EXP", "*10^", "secondary"), ("%", "/100"),
            # Row 4-7: Numpad
            ("7", "7"), ("8", "8"), ("9", "9"), ("÷", "/"),
            ("4", "4"), ("5", "5"), ("6", "6"), ("×", "*"),
            ("1", "1"), ("2", "2"), ("3", "3"), ("−", "-"),
            ("0", "0"), (".", "."), ("π", "pi"), ("+", "+"),
            # Row 8: Actions
            ("(", "("), (")", ")"), ("⌫", "DEL"), ("=", "=", "primary"),
        ]
        self.keypad_layout.addWidget(self._create_grid(keys))
        
    def _render_abc_tab(self):
        keys = list("xyzwabcdefghijklmnopqrstuv")
        self.keypad_layout.addWidget(self._create_grid(keys))
        
    def _render_greek_tab(self):
        keys = [
            ("α", "alpha"), ("β", "beta"), ("γ", "gamma"), ("δ", "delta"),
            ("ε", "epsilon"), ("ζ", "zeta"), ("η", "eta"), ("θ", "theta"),
            ("λ", "lambda"), ("μ", "mu"), ("ν", "nu"), ("ξ", "xi"),
            ("ρ", "rho"), ("σ", "sigma"), ("τ", "tau"), ("φ", "phi"),
            ("ψ", "psi"), ("ω", "omega"), ("∞", "oo"), ("∂", "d"),
            ("Δ", "Delta", "secondary"), ("Σ", "sumatoria(", "secondary"), 
            ("Π", "productoria(", "secondary"), ("Ω", "Omega", "secondary"),
        ]
        self.keypad_layout.addWidget(self._create_grid(keys))
        
    def _render_func_tab(self):
        keys = [
            ("simplificar", "simplificar("), ("expandir", "expandir("), 
            ("factorizar", "factorizar("), ("resolver", "resolver("),
            ("derivar", "derivar("), ("integrar", "integrar("), 
            ("limite", "limite("), ("taylor", "taylor("),
            ("ln", "ln("), ("log", "log("), ("exp", "exp("), ("abs", "abs("),
            ("arcsen", "arcsen("), ("arccos", "arccos("), ("arctan", "arctan("),
            ("n!", "factorial("),
        ]
        self.keypad_layout.addWidget(self._create_grid(keys))
        
    def _render_const_tab(self):
        keys = [
            ("π", "pi"), ("e", "E"), ("i", "I"), ("φ", "((1+sqrt(5))/2)"),
            ("c", "c"), ("g", "g"), ("G", "G"), ("h", "h"),
            ("k", "k"), ("Nₐ", "Na"), ("R", "R"), ("∞", "oo"),
        ]
        self.keypad_layout.addWidget(self._create_grid(keys))


if __name__ == "__main__":
    # Test the keypad
    from PyQt6.QtWidgets import QApplication
    import sys
    
    app = QApplication(sys.argv)
    keypad = ScientificKeypad()
    keypad.key_clicked.connect(print)
    keypad.show()
    sys.exit(app.exec())
