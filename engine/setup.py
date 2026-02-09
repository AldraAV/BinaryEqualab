from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
import sys
import setuptools

__version__ = '0.0.1'

class get_pybind_include(object):
    """Helper class to determine the pybind11 include path
    The purpose of this class is to postpone importing pybind11 until it is actually
    installed, so that the ``get_include()`` method can be invoked. """

    def __str__(self):
        import pybind11
        return pybind11.get_include()

ext_modules = [
    Extension(
        '_equacore',
        ['src/bindings.cpp'],
        include_dirs=[
            # Path to pybind11 headers
            get_pybind_include(),
            'src'
        ],
        language='c++'
    ),
]

setup(
    name='equacore',
    version=__version__,
    author='Aldra',
    author_email='contact@aldra.dev',
    description='A test project using pybind11',
    long_description='',
    ext_modules=ext_modules,
    install_requires=['pybind11>=2.5.0'],
    setup_requires=['pybind11>=2.5.0'],
    zip_safe=False,
)
