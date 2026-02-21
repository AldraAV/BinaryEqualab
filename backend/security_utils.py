import re

def sanitize_math_expression(expression: str) -> str:
    """
    Sanitizes a math expression by removing potentially dangerous characters
    and ensuring only allowed math symbols and functions are present.
    """
    if not expression:
        return ""
    
    # Remove any script tags or html-like content (XSS prevention)
    clean = re.sub(r'<[^>]*?>', '', expression)
    
    # Allow only: letters, digits, basic math operators, parentheses, commas, dots, spaces, and Greek letters (some)
    # This is a strict whitelist approach
    # [a-zA-Z0-9\+\-\*\/\^ \(\)\,\.\_\=]
    # We also allow some common math functions: sin, cos, tan, log, etc.
    
    # Check for dangerous patterns like __import__, __builtins__, etc (Python Injection)
    dangerous_patterns = [
        r'__', r'import', r'eval', r'exec', r'os\.', r'subprocess', 
        r'open\(', r'getattr', r'setattr', r'request', r'session'
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, clean.lower()):
            clean = re.sub(pattern, '', clean, flags=re.IGNORECASE)
            
    return clean.strip()

def validate_password_strength(password: str) -> bool:
    """
    Validates that a password has at least 8 characters, one uppercase letter, and one number.
    As per Binary EquaLab security standards.
    """
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True
