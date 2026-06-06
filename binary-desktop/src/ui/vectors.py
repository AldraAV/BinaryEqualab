import numpy as np
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem, 
    QDoubleSpinBox, QSplitter, QGroupBox
)
from PySide6.QtCore import Qt
from qfluentwidgets import (
    PrimaryPushButton, BodyLabel, 
    InfoBar
)

# Matplotlib
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg, NavigationToolbar2QT
from matplotlib.figure import Figure
# 3D Toolkit

class VectorItem:
    def __init__(self, name, x, y, z, color):
        self.name = name
        self.vector = np.array([x, y, z])
        self.color = color

class VectorsWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("VectorsWidget")
        
        self.vectors = []
        self.colors = ['#EA580C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
        self.color_idx = 0
        
        main_layout = QHBoxLayout(self)
        
        # --- Left Panel: Controls ---
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0, 0, 10, 0)
        
        # 1. New Vector Input
        input_group = QGroupBox("Nuevo Vector")
        input_layout = QVBoxLayout(input_group)
        
        coord_layout = QHBoxLayout()
        self.spin_x = self.create_spinbox("X")
        self.spin_y = self.create_spinbox("Y")
        self.spin_z = self.create_spinbox("Z")
        coord_layout.addWidget(self.spin_x)
        coord_layout.addWidget(self.spin_y)
        coord_layout.addWidget(self.spin_z)
        
        self.btn_add = PrimaryPushButton("Añadir Vector")
        self.btn_add.clicked.connect(self.add_vector)
        
        input_layout.addLayout(coord_layout)
        input_layout.addWidget(self.btn_add)
        
        # 2. Vector List
        list_group = QGroupBox("Vectores Activos")
        list_layout = QVBoxLayout(list_group)
        self.list_widget = QListWidget()
        self.list_widget.setStyleSheet("""
            QListWidget {
                background-color: #2b2b2b;
                border: 1px solid #3e3e3e;
                border-radius: 6px;
                color: white;
            }
            QListWidget::item {
                padding: 8px;
            }
        """)
        self.list_widget.itemDoubleClicked.connect(self.delete_vector)
        list_layout.addWidget(self.list_widget)
        list_layout.addWidget(BodyLabel("Doble click para eliminar", self))
        
        # 3. Operations Info
        info_group = QGroupBox("Info")
        info_layout = QVBoxLayout(info_group)
        self.lbl_info = BodyLabel("Selecciona 2 vectores para ver ángulo/producto.")
        self.lbl_info.setWordWrap(True)
        info_layout.addWidget(self.lbl_info)
        
        left_layout.addWidget(input_group)
        left_layout.addWidget(list_group)
        left_layout.addWidget(info_group)
        # left_layout.addStretch()
        
        # --- Right Panel: 3D Plot ---
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(0, 0, 0, 0)
        
        self.figure = Figure(figsize=(5, 4), dpi=100, facecolor='#1a1a1a')
        self.canvas = FigureCanvasQTAgg(self.figure)
        self.ax = self.figure.add_subplot(111, projection='3d')
        
        self.toolbar = NavigationToolbar2QT(self.canvas, self)
        self.toolbar.setStyleSheet("background-color: #ccc; color: black;")
        
        right_layout.addWidget(self.toolbar)
        right_layout.addWidget(self.canvas)
        
        # Add to splitter or main
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_panel)
        splitter.addWidget(right_panel)
        splitter.setStretchFactor(1, 3)
        
        main_layout.addWidget(splitter)
        
        self.init_plot()
        
        # Selection logic
        self.list_widget.itemSelectionChanged.connect(self.calculate_ops)

    def create_spinbox(self, prefix):
        spin = QDoubleSpinBox()
        spin.setRange(-100, 100)
        spin.setPrefix(f"{prefix}: ")
        spin.setValue(0)
        spin.setSingleStep(1.0)
        return spin
        
    def init_plot(self):
        # Just trigger initial draw
        self.draw_plot()

    def style_axes(self):
        self.ax.set_facecolor('#1a1a1a')
        self.ax.grid(True, linestyle='--', alpha=0.3)
        self.ax.tick_params(colors='white')
        self.ax.xaxis.label.set_color('white')
        self.ax.yaxis.label.set_color('white')
        self.ax.zaxis.label.set_color('white')
        
    def add_vector(self):
        x = self.spin_x.value()
        y = self.spin_y.value()
        z = self.spin_z.value()
        
        if x==0 and y==0 and z==0:
             InfoBar.warning(title='Vector Nulo', content='El vector (0,0,0) no se dibuja.', parent=self, duration=2000)
             return
        
        color = self.colors[self.color_idx % len(self.colors)]
        self.color_idx += 1
        
        name = f"v{len(self.vectors)+1}"
        vec = VectorItem(name, x, y, z, color)
        self.vectors.append(vec)
        
        # Add to UI List
        item = QListWidgetItem(f"{name} = [{x}, {y}, {z}]")
        item.setForeground(Qt.GlobalColor.white)
        self.list_widget.addItem(item)
        
        self.draw_plot()
        
    def delete_vector(self, item):
        row = self.list_widget.row(item)
        self.list_widget.takeItem(row)
        self.vectors.pop(row)
        self.draw_plot()
        
    def draw_plot(self):
        self.ax.clear()
        self.style_axes() # Apply style AFTER clear
        
        # Draw Origin
        self.ax.scatter([0], [0], [0], color='white', s=20)
        
        max_val = 1
        
        for v in self.vectors:
            # Quiver: x, y, z, u, v, w
            self.ax.quiver(0, 0, 0, v.vector[0], v.vector[1], v.vector[2], 
                           color=v.color, arrow_length_ratio=0.1, linewidth=2, label=v.name)
            
            # Text label at tip
            self.ax.text(v.vector[0], v.vector[1], v.vector[2], v.name, color=v.color)
            
            max_val = max(max_val, np.max(np.abs(v.vector)))
            
        # Set limits
        limit = max_val * 1.2
        self.ax.set_xlim([-limit, limit])
        self.ax.set_ylim([-limit, limit])
        self.ax.set_zlim([-limit, limit])
        self.ax.set_xlabel('X')
        self.ax.set_ylabel('Y')
        self.ax.set_zlabel('Z')
        
        self.canvas.draw()
        
    def calculate_ops(self):
        selected_items = self.list_widget.selectedItems()
        if len(selected_items) == 2:
            idx1 = self.list_widget.row(selected_items[0])
            idx2 = self.list_widget.row(selected_items[1])
            
            v1 = self.vectors[idx1].vector
            v2 = self.vectors[idx2].vector
            
            dot = np.dot(v1, v2)
            cross = np.cross(v1, v2)
            cross_str = f"[{cross[0]:.2f}, {cross[1]:.2f}, {cross[2]:.2f}]"
            
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            cos_theta = dot / (norm1 * norm2) if (norm1*norm2) > 0 else 0
            angle_rad = np.arccos(np.clip(cos_theta, -1.0, 1.0))
            angle_deg = np.degrees(angle_rad)
            
            self.lbl_info.setText(
                f"<b>{self.vectors[idx1].name} · {self.vectors[idx2].name}</b> = {dot:.2f}<br>"
                f"<b>{self.vectors[idx1].name} × {self.vectors[idx2].name}</b> = {cross_str}<br>"
                f"<b>Ángulo</b> = {angle_deg:.2f}°"
            )
        else:
            self.lbl_info.setText("Selecciona 2 vectores (Ctrl+Click) para ver Producto Punto, Cruz y Ángulo.")
