import math
import numpy as np
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton, 
                               QLabel, QSlider, QFrame)
from PySide6.QtCore import Qt, QTimer, QPointF, QRectF
from PySide6.QtGui import QPainter, QPen, QColor, QPainterPath

class EpicyclesWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("EpicyclesWidget")
        
        # State
        self.drawing = True
        self.path_points = []  # List of complex numbers
        self.fourier_coeffs = [] # List of {'freq', 'amp', 'phase', 'complex'}
        self.time = 0.0
        self.trail = []
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.animate)
        
        # UI Layout
        layout = QVBoxLayout(self)
        
        # Controls
        controls = QHBoxLayout()
        self.btnAction = QPushButton("Calcular Fourier")
        self.btnAction.clicked.connect(self.toggle_mode)
        self.btnAction.setStyleSheet("""
            QPushButton {
                background-color: #EA580C; color: white; border-radius: 4px; padding: 8px 16px; font-weight: bold;
            }
            QPushButton:hover { background-color: #f97316; }
        """)
        
        self.btnClear = QPushButton("Limpiar")
        self.btnClear.clicked.connect(self.reset)
        self.btnClear.setStyleSheet("background-color: #444; color: white; border-radius: 4px; padding: 8px;")
        
        self.statusLabel = QLabel("Dibuja una figura continua")
        self.statusLabel.setStyleSheet("color: #aaa; font-style: italic;")
        
        controls.addWidget(self.btnAction)
        controls.addWidget(self.btnClear)
        controls.addWidget(self.statusLabel)
        controls.addStretch()
        
        layout.addLayout(controls)
        
        # Canvas Area (The widget itself will handle paint events, but let's wrap logic)
        # We paint directly on 'self' below controls
        self.setMouseTracking(True)

    def mousePressEvent(self, event):
        if not self.drawing:
            return
        self.path_points = []
        self.path_points.append(complex(event.position().x(), event.position().y()))
        self.update()

    def mouseMoveEvent(self, event):
        if not self.drawing:
            return
        if event.buttons() & Qt.MouseButton.LeftButton:
            pos = event.position()
            # Sampling distance check? No, raw high freq is fun
            self.path_points.append(complex(pos.x(), pos.y()))
            self.update()

    def mouseReleaseEvent(self, event):
        if not self.drawing:
            return
        # Auto-close loop visually?
        pass

    def toggle_mode(self):
        if self.drawing:
            # Switch to Animation
            if len(self.path_points) < 2:
                self.statusLabel.setText("Dibuja algo primero.")
                return
            
            self.drawing = False
            
            # Apply smoothing
            self.smooth_path()
            
            self.compute_dft()
            self.btnAction.setText("Editar / Dibujar")
            self.statusLabel.setText(f"Animando {len(self.fourier_coeffs)} epiciclos...")
            self.time = 0
            self.trail = []
            self.timer.start(16) # ~60 FPS
        else:
            # Switch to Drawing
            self.drawing = True
            self.timer.stop()
            self.trail = []
            self.btnAction.setText("Calcular Fourier")
            self.statusLabel.setText("Dibuja una figura nueva")
            self.update()

    def reset(self):
        self.path_points = []
        self.fourier_coeffs = []
        self.trail = []
        self.time = 0
        if not self.drawing:
            self.toggle_mode() # Go back to drawing
        self.update()

    def smooth_path(self, iterations=3):
        """Apply simple Laplacian smoothing to reduce hand jitter"""
        if len(self.path_points) < 3:
            return
            
        points = self.path_points
        
        # Iterative smoothing (Average neighbors)
        for _ in range(iterations):
            new_points = [points[0]] # Keep start
            
            for i in range(1, len(points) - 1):
                # P_new = 0.25*prev + 0.5*curr + 0.25*next
                prev_p = points[i-1]
                curr_p = points[i]
                next_p = points[i+1]
                
                avg_x = 0.25 * prev_p.real + 0.5 * curr_p.real + 0.25 * next_p.real
                avg_y = 0.25 * prev_p.imag + 0.5 * curr_p.imag + 0.25 * next_p.imag
                
                new_points.append(complex(avg_x, avg_y))
            
            new_points.append(points[-1]) # Keep end
            points = new_points
            
        self.path_points = points

    def compute_dft(self):
        """Discrete Fourier Transform"""
        x = np.array(self.path_points)
        N = len(x)
        X = []
        
        # Compute DFT
        # Or simply use numpy fft?
        # Numpy FFT gives 0 to N-1 freqs. We usually want -N/2 to N/2 for epicycles center-stability
        # But let's stick to standard definition first
        
        # Using numpy.fft which is super fast
        fft_vals = np.fft.fft(x) / N
        
        for k in range(N):
            amp = abs(fft_vals[k])
            phase = np.angle(fft_vals[k])
            freq = k
            X.append({'re': fft_vals[k].real, 'im': fft_vals[k].imag, 
                      'freq': freq, 'amp': amp, 'phase': phase})
        
        # Sort by amplitude (draw biggest circles first for better visualization)
        X.sort(key=lambda item: item['amp'], reverse=True)
        self.fourier_coeffs = X

    def animate(self):
        dt = 2 * math.pi / len(self.fourier_coeffs)
        self.time += dt
        if self.time > 2 * math.pi:
            self.time = 0
            self.trail = [] # Reset trail or keep loop? Loop trail
        
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Background handled by parent style usually, but assume transparent canvas logic
        
        if self.drawing:
            # Draw user path
            if len(self.path_points) > 1:
                painter.setPen(QPen(QColor("#555"), 2))
                path = QPainterPath()
                start = self.path_points[0]
                path.moveTo(start.real, start.imag)
                for p in self.path_points[1:]:
                    path.lineTo(p.real, p.imag)
                painter.drawPath(path)
                
        else:
            # Draw Epicycles
            # Center? No, DFT reconstructs absolute coordinates if handled right
            
            # Start point (usually 0,0 but first term is constant offset 0 freq)
            # Actually with FFT, the terms sum up to position
            
            x = 0
            y = 0
            
            # Draw circles
            for eps in self.fourier_coeffs:
                prev_x = x
                prev_y = y
                
                freq = eps['freq']
                radius = eps['amp']
                phase = eps['phase']
                
                # Setup angle: freq * t + phase
                angle = freq * self.time + phase
                
                dx = radius * math.cos(angle)
                dy = radius * math.sin(angle)
                
                x += dx
                y += dy
                
                # Draw Circle
                if radius > 1: # Optimization: don't draw tiny circles
                    painter.setPen(QPen(QColor(255, 255, 255, 30), 1)) # Faint white
                    painter.setBrush(Qt.BrushStyle.NoBrush)
                    painter.drawEllipse(QPointF(prev_x, prev_y), radius, radius)
                
                # Draw Radius Line
                if radius > 1:
                    painter.setPen(QPen(QColor(255, 255, 255, 50), 1))
                    painter.drawLine(QPointF(prev_x, prev_y), QPointF(x, y))
            
            # Draw Trail
            self.trail.append(QPointF(x, y))
            
            if len(self.trail) > 1:
                painter.setPen(QPen(QColor("#EA580C"), 2)) # Aurora Orange
                path = QPainterPath()
                path.moveTo(self.trail[0])
                for p in self.trail[1:]:
                    path.lineTo(p)
                painter.drawPath(path)
            
            # Draw Pen Tip
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QColor("#06b6d4")) # Cyan tip
            painter.drawEllipse(QPointF(x, y), 3, 3)
