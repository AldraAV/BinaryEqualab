
from binary_equalab.engine import MathEngine

class GlobalContext:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GlobalContext, cls).__new__(cls)
            cls._instance._init_data()
        return cls._instance
    
    def _init_data(self):
        """Initialize the shared engine and state."""
        self.engine = MathEngine()
        self.ans = None
        self.variables = {}
        
    def get_engine(self):
        return self.engine

    def update_ans(self, value):
        self.ans = value
        # Update engine symbol for ans if desired, though MathEngine might not support 'ANS' keyword natively yet
        # We can inject it:
        # self.engine.symbols['ANS'] = value

    def get_variable(self, name):
        return self.engine.symbols.get(name)

# Global accessor
def get_context():
    return GlobalContext()
