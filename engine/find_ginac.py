import urllib.request
import re

url = "https://repo.msys2.org/mingw/mingw64/"
print(f"Buscando en: {url}...")

try:
    html = urllib.request.urlopen(url).read().decode('utf-8')
    
    # Extraer paquetes de ginac y cln, priorizando la extensión .zst o .xz
    ginac_links = set(re.findall(r'href="(mingw-w64-x86_64-ginac-[^"]+\.pkg\.tar\.(?:zst|xz))"', html))
    cln_links = set(re.findall(r'href="(mingw-w64-x86_64-cln-[^"]+\.pkg\.tar\.(?:zst|xz))"', html))
    
    print("\n📦 GiNaC encontrados:")
    for link in ginac_links:
        print(link)
        
    print("\n📦 CLN encontrados:")
    for link in cln_links:
        print(link)
        
except Exception as e:
    print(f"Error: {e}")
