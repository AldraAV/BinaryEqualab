"""
Estilos QSS para la aplicación Binary EquaLab (Tema Aurora Mejorado).
"""
from src.utils.constants import AuroraPalette

def get_stylesheet():
    return f"""
    /* === GENERAL WINDOW === */
    QMainWindow {{
        background-color: {AuroraPalette.BACKGROUND};
        color: {AuroraPalette.TEXT_PRIMARY};
    }}

    QWidget {{
        background-color: {AuroraPalette.BACKGROUND};
        color: {AuroraPalette.TEXT_PRIMARY};
        font-family: 'Segoe UI', 'Inter', 'Roboto', sans-serif;
        font-size: 13px;
        selection-background-color: {AuroraPalette.SECONDARY};
        selection-color: white;
    }}

    /* === BUTTONS - Modern Glass Effect === */
    QPushButton {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 6px;
        padding: 8px 14px;
        color: {AuroraPalette.TEXT_PRIMARY};
        font-weight: 500;
        min-width: 50px;
    }}
    QPushButton:hover {{
        background-color: #3D3936;
        border-color: {AuroraPalette.ACCENT};
    }}
    QPushButton:pressed {{
        background-color: {AuroraPalette.BACKGROUND_DARK};
        border-color: {AuroraPalette.SECONDARY};
    }}
    QPushButton:disabled {{
        background-color: #1A1918;
        color: {AuroraPalette.TEXT_MUTED};
        border-color: #2A2725;
    }}
    
    /* Primary Button - Orange Gradient */
    QPushButton[class="primary"] {{
        background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
            stop:0 #F97316, stop:1 #EA580C);
        border: none;
        color: white;
        font-weight: 600;
        padding: 8px 18px;
    }}
    QPushButton[class="primary"]:hover {{
        background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
            stop:0 #FB923C, stop:1 #F97316);
    }}
    QPushButton[class="primary"]:pressed {{
        background: #C2410C;
    }}
    
    /* Secondary/Accent Button */
    QPushButton[class="secondary"] {{
        background-color: rgba(185, 28, 28, 0.15);
        border: 1px solid {AuroraPalette.PRIMARY};
        color: #FCA5A5;
    }}
    QPushButton[class="secondary"]:hover {{
        background-color: rgba(185, 28, 28, 0.3);
        border-color: #DC2626;
    }}

    /* === INPUTS - Glowing Focus === */
    QLineEdit, QTextEdit, QPlainTextEdit {{
        background-color: {AuroraPalette.BACKGROUND_DARK};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 6px;
        color: {AuroraPalette.TEXT_PRIMARY};
        padding: 8px 10px;
        font-family: 'JetBrains Mono', 'Consolas', 'Fira Code', monospace;
        font-size: 13px;
        selection-background-color: {AuroraPalette.ACCENT};
    }}
    QLineEdit:focus, QTextEdit:focus {{
        border: 1px solid {AuroraPalette.SECONDARY};
        background-color: #141210;
    }}
    QLineEdit:hover, QTextEdit:hover {{
        border-color: {AuroraPalette.TEXT_SECONDARY};
    }}
    QLineEdit::placeholder {{
        color: {AuroraPalette.TEXT_MUTED};
    }}

    /* === TABS - Modern Underline Style === */
    QTabWidget::pane {{
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 8px;
        top: -1px;
        background-color: {AuroraPalette.BACKGROUND};
    }}
    QTabBar::tab {{
        background: transparent;
        color: {AuroraPalette.TEXT_SECONDARY};
        padding: 10px 20px;
        margin-right: 4px;
        border: none;
        border-bottom: 2px solid transparent;
        font-weight: 500;
    }}
    QTabBar::tab:selected {{
        color: {AuroraPalette.SECONDARY};
        border-bottom: 2px solid {AuroraPalette.SECONDARY};
        font-weight: 600;
    }}
    QTabBar::tab:hover {{
        color: {AuroraPalette.TEXT_PRIMARY};
        border-bottom: 2px solid {AuroraPalette.BORDER};
    }}

    /* === SCROLLBARS - Minimal Modern === */
    QScrollBar:vertical {{
        border: none;
        background: transparent;
        width: 10px;
        margin: 0px;
    }}
    QScrollBar::handle:vertical {{
        background: {AuroraPalette.BORDER};
        min-height: 40px;
        border-radius: 5px;
        margin: 2px;
    }}
    QScrollBar::handle:vertical:hover {{
        background: {AuroraPalette.TEXT_SECONDARY};
    }}
    QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
        height: 0px;
    }}
    QScrollBar:horizontal {{
        border: none;
        background: transparent;
        height: 10px;
    }}
    QScrollBar::handle:horizontal {{
        background: {AuroraPalette.BORDER};
        min-width: 40px;
        border-radius: 5px;
        margin: 2px;
    }}
    
    /* === LIST WIDGET - Card Style === */
    QListWidget {{
        background-color: {AuroraPalette.BACKGROUND_DARK};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 8px;
        padding: 4px;
        outline: none;
    }}
    QListWidget::item {{
        padding: 10px 12px;
        border-radius: 6px;
        margin: 2px 0px;
    }}
    QListWidget::item:selected {{
        background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
            stop:0 rgba(234, 88, 12, 0.3), stop:1 rgba(234, 88, 12, 0.1));
        border-left: 3px solid {AuroraPalette.SECONDARY};
    }}
    QListWidget::item:hover {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
    }}

    /* === COMBOBOX === */
    QComboBox {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 6px;
        padding: 6px 10px;
        color: {AuroraPalette.TEXT_PRIMARY};
        min-width: 80px;
    }}
    QComboBox:hover {{
        border-color: {AuroraPalette.ACCENT};
    }}
    QComboBox::drop-down {{
        border: none;
        width: 24px;
    }}
    QComboBox::down-arrow {{
        image: none;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid {AuroraPalette.TEXT_SECONDARY};
        margin-right: 8px;
    }}
    QComboBox QAbstractItemView {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 6px;
        selection-background-color: {AuroraPalette.SECONDARY};
        padding: 4px;
    }}

    /* === FRAMES - Card Style === */
    QFrame[class="card"] {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 10px;
        padding: 12px;
    }}

    /* === LABELS === */
    QLabel {{
        background: transparent;
        border: none;
    }}
    QLabel[class="header"] {{
        font-size: 22px;
        font-weight: 700;
        color: {AuroraPalette.SECONDARY};
    }}
    QLabel[class="subheader"] {{
        font-size: 14px;
        font-weight: 600;
        color: {AuroraPalette.TEXT_SECONDARY};
    }}

    /* === SLIDERS === */
    QSlider::groove:horizontal {{
        border: none;
        height: 4px;
        background: {AuroraPalette.BORDER};
        border-radius: 2px;
    }}
    QSlider::handle:horizontal {{
        background: {AuroraPalette.SECONDARY};
        width: 16px;
        height: 16px;
        margin: -6px 0;
        border-radius: 8px;
    }}
    QSlider::handle:horizontal:hover {{
        background: {AuroraPalette.SECONDARY_HOVER};
    }}

    /* === SPINBOX === */
    QSpinBox, QDoubleSpinBox {{
        background-color: {AuroraPalette.BACKGROUND_DARK};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 6px;
        padding: 4px 8px;
        color: {AuroraPalette.TEXT_PRIMARY};
    }}
    QSpinBox:focus, QDoubleSpinBox:focus {{
        border-color: {AuroraPalette.SECONDARY};
    }}

    /* === MENU BAR === */
    QMenuBar {{
        background-color: {AuroraPalette.BACKGROUND};
        border-bottom: 1px solid {AuroraPalette.BORDER};
        padding: 4px;
    }}
    QMenuBar::item {{
        background: transparent;
        padding: 6px 12px;
        border-radius: 4px;
    }}
    QMenuBar::item:selected {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
    }}
    QMenu {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        border: 1px solid {AuroraPalette.BORDER};
        border-radius: 8px;
        padding: 6px;
    }}
    QMenu::item {{
        padding: 8px 24px;
        border-radius: 4px;
    }}
    QMenu::item:selected {{
        background-color: {AuroraPalette.SECONDARY};
    }}

    /* === STATUS BAR === */
    QStatusBar {{
        background-color: {AuroraPalette.BACKGROUND_DARK};
        border-top: 1px solid {AuroraPalette.BORDER};
        color: {AuroraPalette.TEXT_SECONDARY};
        font-size: 12px;
        padding: 4px 8px;
    }}

    /* === TOOLTIPS - Modern Look === */
    QToolTip {{
        background-color: {AuroraPalette.BACKGROUND_LIGHT};
        color: {AuroraPalette.TEXT_PRIMARY};
        border: 1px solid {AuroraPalette.SECONDARY};
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
    }}

    /* === SPLITTER === */
    QSplitter::handle {{
        background-color: {AuroraPalette.BORDER};
        width: 2px;
    }}
    QSplitter::handle:hover {{
        background-color: {AuroraPalette.SECONDARY};
    }}
    """

