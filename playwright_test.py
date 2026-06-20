from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    
    print("Page title:", page.title())
    
    # Take a screenshot to verify UI
    page.screenshot(path='C:\\Users\\carde\\Desktop\\MUACK\\BinaryEquaLab\\scratch\\dashboard_test.png', full_page=True)
    
    browser.close()
    print("Webapp test completed successfully!")
