from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QSpacerItem, QSizePolicy
from PySide6.QtCore import Qt
from qfluentwidgets import (SubtitleLabel, BodyLabel, LineEdit, PasswordLineEdit, 
                            PrimaryPushButton, PushButton, InfoBar, InfoBarPosition,
                            CardWidget, IconWidget, StrongBodyLabel)
from qfluentwidgets import FluentIcon as FIF

from src.core.cloud import cloud_client

class CloudWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.setObjectName("CloudWidget")
        
        self.vBoxLayout = QVBoxLayout(self)
        self.vBoxLayout.setContentsMargins(30, 30, 30, 30)
        self.vBoxLayout.setSpacing(15)

        # Header
        self.header = SubtitleLabel("Nube Binary SaaS (Pro/Elite)", self)
        self.vBoxLayout.addWidget(self.header)
        
        self.statusLabel = BodyLabel("Inicia sesión para sincronizar tus hojas de trabajo y acceder a funciones AI.", self)
        self.statusLabel.setStyleSheet("color: #a0a0a0;")
        self.vBoxLayout.addWidget(self.statusLabel)
        
        self.vBoxLayout.addSpacing(20)

        # Container for dynamic content (Login Form or Dashboard)
        self.contentContainer = QWidget()
        self.contentLayout = QVBoxLayout(self.contentContainer)
        self.contentLayout.setContentsMargins(0, 0, 0, 0)
        self.vBoxLayout.addWidget(self.contentContainer)
        
        self.vBoxLayout.addStretch()

        self.refresh_ui()

    def refresh_ui(self):
        # Clear current content
        for i in reversed(range(self.contentLayout.count())): 
            self.contentLayout.itemAt(i).widget().setParent(None)

        if cloud_client.is_logged_in():
            self.show_dashboard()
        else:
            self.show_login_form()

    def show_login_form(self):
        # Email
        self.emailInput = LineEdit(self)
        self.emailInput.setPlaceholderText("Correo electrónico")
        self.emailInput.setFixedWidth(300)
        
        # Password
        self.passInput = PasswordLineEdit(self)
        self.passInput.setPlaceholderText("Contraseña")
        self.passInput.setFixedWidth(300)
        
        # Login Button
        self.loginBtn = PrimaryPushButton("Iniciar Sesión", self)
        self.loginBtn.setFixedWidth(300)
        self.loginBtn.clicked.connect(self.handle_login)
        
        self.contentLayout.addWidget(self.emailInput, 0, Qt.AlignmentFlag.AlignHCenter)
        self.contentLayout.addWidget(self.passInput, 0, Qt.AlignmentFlag.AlignHCenter)
        self.contentLayout.addSpacing(10)
        self.contentLayout.addWidget(self.loginBtn, 0, Qt.AlignmentFlag.AlignHCenter)

    def show_dashboard(self):
        user = cloud_client.user or {}
        email = user.get('email', 'Usuario')
        
        # User Card
        card = CardWidget(self)
        card.setFixedWidth(400)
        cardLayout = QHBoxLayout(card)
        
        icon = IconWidget(FIF.IOT)
        icon.setFixedSize(48, 48)
        
        infoLayout = QVBoxLayout()
        nameLabel = StrongBodyLabel(email)
        roleLabel = BodyLabel("Conectado a Binary SaaS")
        roleLabel.setStyleSheet("color: #a0a0a0; font-size: 12px;")
        
        infoLayout.addWidget(nameLabel)
        infoLayout.addWidget(roleLabel)
        
        cardLayout.addWidget(icon)
        cardLayout.addLayout(infoLayout)
        cardLayout.addStretch()
        
        self.contentLayout.addWidget(card, 0, Qt.AlignmentFlag.AlignHCenter)
        
        # Actions
        actionsLayout = QHBoxLayout()
        
        syncBtn = PrimaryPushButton(FIF.SYNC, "Sincronizar Worksheets", self)
        syncBtn.clicked.connect(lambda: self.show_info("Próximamente", "La subida de archivos llegará pronto."))
        
        logoutBtn = PushButton("Cerrar Sesión", self)
        logoutBtn.clicked.connect(self.handle_logout)
        
        actionsLayout.addWidget(syncBtn)
        actionsLayout.addWidget(logoutBtn)
        
        self.contentLayout.addSpacing(20)
        self.contentLayout.addLayout(actionsLayout)

    def handle_login(self):
        email = self.emailInput.text()
        password = self.passInput.text()
        
        if not email or not password:
            self.show_error("Campos vacíos", "Por favor ingresa correo y contraseña.")
            return

        self.loginBtn.setEnabled(False)
        self.loginBtn.setText("Conectando...")
        # Force repaint
        from PySide6.QtWidgets import QApplication
        QApplication.processEvents()
        
        success = cloud_client.login(email, password)
        
        if success:
            self.show_success("¡Bienvenido!", "Has iniciado sesión correctamente.")
            self.refresh_ui()
        else:
            self.show_error("Error de Login", "Credenciales incorrectas o servidor no disponible.")
            self.loginBtn.setEnabled(True)
            self.loginBtn.setText("Iniciar Sesión")

    def handle_logout(self):
        cloud_client.logout()
        self.refresh_ui()

    def show_error(self, title, msg):
        InfoBar.error(
            title=title,
            content=msg,
            orient=Qt.Orientation.Horizontal,
            isClosable=True,
            position=InfoBarPosition.TOP_RIGHT,
            duration=4000,
            parent=self
        )

    def show_success(self, title, msg):
        InfoBar.success(
            title=title,
            content=msg,
            orient=Qt.Orientation.Horizontal,
            isClosable=True,
            position=InfoBarPosition.TOP_RIGHT,
            duration=3000,
            parent=self
        )
    
    def show_info(self, title, msg):
        InfoBar.info(
            title=title,
            content=msg,
            orient=Qt.Orientation.Horizontal,
            isClosable=True,
            position=InfoBarPosition.TOP_RIGHT,
            duration=3000,
            parent=self
        )
